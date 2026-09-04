/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The orchestration loop, against a scripted provider.
 *
 * The behaviour worth proving is the part that only happens when something
 * goes wrong: QA rejects a task, the conductor sends it back to whoever wrote
 * it with the defects attached, and the review runs again. That path cannot be
 * observed by watching a successful run, and it is the whole reason the system
 * is a graph rather than four prompts in a row.
 *
 * The provider is injected, so none of this needs a key or a network.
 */

import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { conduct, makePlan, type Complete, type CompletionRequest } from "./conductor.ts";
import { PlanError } from "./graph.ts";

const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "orch-run-"));
after(() => fs.rm(workspace, { recursive: true, force: true }));

/** A provider that answers from a script, and records what it was asked. */
function scripted(replies: Array<string | ((req: CompletionRequest) => string)>): {
  complete: Complete;
  seen: CompletionRequest[];
} {
  const seen: CompletionRequest[] = [];
  let i = 0;
  const complete: Complete = async (req) => {
    seen.push(req);
    const next = replies[Math.min(i++, replies.length - 1)];
    return { text: typeof next === "function" ? next(req) : next, attempt: 1 };
  };
  return { complete, seen };
}

const PLAN = JSON.stringify({
  tasks: [
    { id: "design", role: "designer", goal: "Design it", dependsOn: [], needs: [], produces: "contract" },
    { id: "build", role: "backend", goal: "Build it", dependsOn: ["design"], needs: ["contract"], produces: "code" },
    { id: "review", role: "qa", goal: "Review it", dependsOn: ["build"], needs: ["code"], produces: "review" },
  ],
});

const agentDone = (summary: string) => JSON.stringify({ summary, tools: [], done: true });

describe("makePlan", () => {
  it("parses a plan out of a fenced reply", async () => {
    const { complete } = scripted(["Here you go:\n```json\n" + PLAN + "\n```"]);
    const plan = await makePlan("goal", { complete });
    assert.deepEqual(plan.tasks.map((t) => t.id), ["design", "build", "review"]);
  });

  it("defaults `produces` to the task id when the planner omits it", async () => {
    const { complete } = scripted([
      JSON.stringify({ tasks: [{ id: "only", role: "backend", goal: "g", dependsOn: [] }] }),
    ]);
    const plan = await makePlan("goal", { complete });
    assert.equal(plan.tasks[0].produces, "only");
  });

  it("rejects a structurally broken plan before anything runs", async () => {
    const { complete } = scripted([
      JSON.stringify({ tasks: [{ id: "a", role: "backend", goal: "g", dependsOn: ["nope"] }] }),
    ]);
    await assert.rejects(() => makePlan("goal", { complete }), PlanError);
  });
});

describe("conduct", () => {
  it("runs a plan in dependency order and passes only the declared context", async () => {
    const { complete, seen } = scripted([
      PLAN,
      agentDone("CONTRACT: POST /api/thing returns {id}"),
      agentDone("Wrote the handler."),
      JSON.stringify({ summary: "Looks right.", verdict: "pass", tools: [], done: true }),
    ]);

    const report = await conduct("goal", { workspace, complete, apply: false });

    assert.equal(report.ok, true);
    assert.deepEqual(report.runs.map((r) => r.status), ["done", "done", "done"]);

    /* "build" declared needs:["contract"], so the designer's summary must be
       in its prompt — and the raw designer transcript must not be. */
    const buildPrompt = seen[2].messages[0].content;
    assert.match(buildPrompt, /POST \/api\/thing/);
    assert.match(buildPrompt, /Build it/);
  });

  it("sends a task back to its author when QA rejects it, with the defects", async () => {
    let qaCalls = 0;
    const { complete, seen } = scripted([
      (req) => {
        /* The planner is whoever is asked first; after that, route by role. */
        if (req.system.includes("Conductor of a team")) return PLAN;
        if (req.system.includes("You are QA")) {
          qaCalls++;
          return qaCalls === 1
            ? JSON.stringify({
                summary: "Not yet.",
                verdict: "fail",
                defects: ["handler does not validate the request body"],
                tools: [],
                done: true,
              })
            : JSON.stringify({ summary: "Fixed.", verdict: "pass", tools: [], done: true });
        }
        if (req.system.includes("You are the System Designer")) return agentDone("CONTRACT: ...");
        return agentDone("Wrote the handler.");
      },
    ]);

    const report = await conduct("goal", { workspace, complete, apply: false, maxAttempts: 2 });

    const build = report.runs.find((r) => r.task.id === "build");
    assert.equal(build?.attempts, 2, "the authoring task should have run twice");
    assert.equal(report.ok, true, "the second review passed, so the run succeeded");

    /* The defect has to reach the retry prompt verbatim — an agent told only
       "QA rejected this" will rewrite the file rather than fix the fault. */
    const retryPrompt = seen.find(
      (r, i) => i > 2 && r.system.includes("Backend Engineer") && r.messages[0].content.includes("returned to you"),
    );
    assert.ok(retryPrompt, "the retry should say the task was returned");
    assert.match(retryPrompt.messages[0].content, /validate the request body/);
  });

  it("fails the run when the author is out of attempts, rather than passing it", async () => {
    const { complete } = scripted([
      (req) => {
        if (req.system.includes("Conductor of a team")) return PLAN;
        if (req.system.includes("You are QA")) {
          return JSON.stringify({
            summary: "Still wrong.",
            verdict: "fail",
            defects: ["still unvalidated"],
            tools: [],
            done: true,
          });
        }
        return agentDone("Wrote something.");
      },
    ]);

    const report = await conduct("goal", { workspace, complete, apply: false, maxAttempts: 1 });

    assert.equal(report.ok, false);
    const review = report.runs.find((r) => r.task.id === "review");
    assert.equal(review?.status, "failed");
    assert.match(review?.failure ?? "", /still unvalidated/);
  });

  it("skips what depended on a failure instead of reporting success", async () => {
    const { complete } = scripted([
      (req) => {
        if (req.system.includes("Conductor of a team")) return PLAN;
        if (req.system.includes("You are the System Designer")) throw new Error("provider exploded");
        return agentDone("ok");
      },
    ]);

    const report = await conduct("goal", { workspace, complete, apply: false });

    assert.equal(report.ok, false);
    const byId = Object.fromEntries(report.runs.map((r) => [r.task.id, r.status]));
    assert.equal(byId.design, "failed");
    assert.equal(byId.build, "skipped");
    assert.equal(byId.review, "skipped", "a transitive dependent must not be left pending");
  });

  it("records the files an agent asked to write", async () => {
    const { complete } = scripted([
      (req) => {
        if (req.system.includes("Conductor of a team")) {
          return JSON.stringify({
            tasks: [{ id: "one", role: "backend", goal: "write", dependsOn: [], needs: [], produces: "one" }],
          });
        }
        if (req.messages.length === 1) {
          return JSON.stringify({
            summary: "writing",
            tools: [{ tool: "write_file", path: "out/made.ts", content: "export const x = 1;\n" }],
            done: false,
          });
        }
        return agentDone("Wrote out/made.ts");
      },
    ]);

    const report = await conduct("goal", { workspace, complete, apply: false });
    assert.deepEqual(report.filesWritten, ["out/made.ts"]);
  });

  it("recovers when an agent replies in prose instead of JSON", async () => {
    let turns = 0;
    const { complete } = scripted([
      (req) => {
        if (req.system.includes("Conductor of a team")) {
          return JSON.stringify({
            tasks: [{ id: "one", role: "backend", goal: "g", dependsOn: [], needs: [], produces: "one" }],
          });
        }
        turns++;
        return turns === 1 ? "Sure! I'll get right on that." : agentDone("Done properly.");
      },
    ]);

    const report = await conduct("goal", { workspace, complete, apply: false });
    assert.equal(report.ok, true);
    assert.equal(report.runs[0].summary, "Done properly.");
  });
});
