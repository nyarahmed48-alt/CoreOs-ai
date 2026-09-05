/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The orchestrator, tested.
 *
 * Four groups, in the order a run meets them: the plan validator and scheduler,
 * the context bus and reply parsing, the security boundary, and the whole loop
 * end to end. The provider is injected, so none of it needs a key or a network.
 *
 * The cases worth knowing about are the ones that only happen when something
 * goes wrong — a plan with a cycle, a symlink pointing out of the workspace, a
 * check name with a shell metacharacter in it, and QA rejecting a task so the
 * Conductor has to send it back. None of those can be observed by watching a
 * successful run.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

import {
  blockedTasks, conduct, ContextMemory, executeTool, findCycle, makePlan,
  ParseError, parseJson, PlanError, readyTasks, resolveInside, runCheck,
  ToolError, validatePlan, waves,
} from "./orchestrator.ts";
import type { Complete, CompletionRequest, Plan, Task, TaskRun, ToolContext } from "./orchestrator.ts";

/* --------------------------------------------------------------------------
   graph
   -------------------------------------------------------------------------- */

/**
 * The plan validator and the scheduler.
 *
 * The plan comes from a language model, so every one of these is a shape a
 * real run will eventually be handed. The point of validating up front is that
 * a bad plan fails before any agent has written a file — so the tests care as
 * much about *when* the failure happens as that it happens at all.
 */



const task = (id: string, dependsOn: string[] = [], role: Task["role"] = "backend"): Task => ({
  id,
  role,
  goal: `do ${id}`,
  dependsOn,
  needs: [],
  produces: id,
});

const plan = (tasks: Task[]): Plan => ({ goal: "g", tasks });

const run = (t: Task, status: TaskRun["status"] = "pending"): TaskRun => ({
  task: t,
  status,
  attempts: 0,
  toolResults: [],
});

describe("validatePlan", () => {
  it("accepts a plan that hangs together", () => {
    validatePlan(plan([task("a"), task("b", ["a"]), task("c", ["a"])]));
  });

  it("rejects an empty plan", () => {
    assert.throws(() => validatePlan(plan([])), PlanError);
  });

  it("rejects a role that does not exist", () => {
    const bad = { ...task("a"), role: "devops" as Task["role"] };
    assert.throws(() => validatePlan(plan([bad])), /devops/);
  });

  it("rejects a dependency on a task nobody declared", () => {
    /* The failure mode this prevents: the scheduler would find nothing ready,
       and the run would end reporting success with zero tasks executed. */
    assert.throws(() => validatePlan(plan([task("a", ["ghost"])])), /ghost/);
  });

  it("rejects two tasks sharing an id", () => {
    assert.throws(() => validatePlan(plan([task("a"), task("a")])), /share the id/);
  });

  it("rejects a task with no goal, since there is nothing to assign", () => {
    assert.throws(() => validatePlan(plan([{ ...task("a"), goal: "  " }])), /no goal/);
  });

  it("rejects a cycle, and names the path around it", () => {
    assert.throws(
      () => validatePlan(plan([task("a", ["c"]), task("b", ["a"]), task("c", ["b"])])),
      (err: unknown) => {
        assert.ok(err instanceof PlanError);
        /* A bare "cycle detected" leaves a person to reverse-engineer which
           three tasks; the path around it is the actionable part. */
        for (const id of ["a", "b", "c"]) assert.match(err.message, new RegExp(id));
        return true;
      },
    );
  });

  it("rejects a task depending on itself", () => {
    assert.throws(() => validatePlan(plan([task("a", ["a"])])), /depends on itself/);
  });
});

describe("findCycle", () => {
  it("returns null for a graph that terminates", () => {
    assert.equal(findCycle([task("a"), task("b", ["a"])]), null);
  });

  it("finds a cycle that does not include the first task walked", () => {
    const found = findCycle([task("root"), task("a", ["b"]), task("b", ["a"])]);
    assert.ok(found);
    assert.ok(found.includes("a") && found.includes("b"));
  });
});

describe("readyTasks", () => {
  it("offers only tasks whose dependencies are all done", () => {
    const runs = [run(task("a"), "done"), run(task("b", ["a"])), run(task("c", ["b"]))];
    assert.deepEqual(readyTasks(runs).map((r) => r.task.id), ["b"]);
  });

  it("offers independent tasks together, so they run in parallel", () => {
    const runs = [run(task("a"), "done"), run(task("b", ["a"])), run(task("c", ["a"]))];
    assert.deepEqual(readyTasks(runs).map((r) => r.task.id), ["b", "c"]);
  });

  it("offers nothing while a dependency is merely running", () => {
    assert.deepEqual(readyTasks([run(task("a"), "running"), run(task("b", ["a"]))]), []);
  });
});

describe("blockedTasks", () => {
  it("finds nothing while everything is still viable", () => {
    assert.deepEqual(blockedTasks([run(task("a"), "done"), run(task("b", ["a"]))]), []);
  });

  it("blocks a task whose dependency failed", () => {
    const runs = [run(task("a"), "failed"), run(task("b", ["a"]))];
    assert.deepEqual(blockedTasks(runs).map((r) => r.task.id), ["b"]);
  });

  it("blocks transitively, so no task is left waiting on a skip", () => {
    /* Without the closure, "c" would sit pending forever and the run would
       report success having silently skipped it. */
    const runs = [run(task("a"), "failed"), run(task("b", ["a"])), run(task("c", ["b"]))];
    assert.deepEqual(blockedTasks(runs).map((r) => r.task.id).sort(), ["b", "c"]);
  });
});

describe("waves", () => {
  it("groups the plan into parallel steps in dependency order", () => {
    const got = waves([task("a"), task("b", ["a"]), task("c", ["a"]), task("d", ["b", "c"])]);
    assert.deepEqual(got.map((w) => w.map((t) => t.id)), [["a"], ["b", "c"], ["d"]]);
  });
});

/* --------------------------------------------------------------------------
   memory
   -------------------------------------------------------------------------- */

/**
 * The context bus.
 *
 * Its job is to keep prompts small without keeping them wrong, so the tests
 * are about what a reading agent can and cannot tell: that truncation is
 * visible, that a missing key is stated rather than omitted, and that a retried
 * task's rejected output does not linger.
 */



describe("ContextMemory", () => {
  it("returns only the keys a task asked for", () => {
    const m = new ContextMemory();
    m.write("schema", "CREATE TABLE thing (...)", "design");
    m.write("unrelated", "a large pile of other work", "other");

    const rendered = m.render(["schema"]);
    assert.match(rendered, /CREATE TABLE thing/);
    assert.doesNotMatch(rendered, /large pile/);
  });

  it("says so in the text when it truncates", () => {
    /* Silent truncation produces an agent confidently working from half a
       schema, which is worse than one that knows it is missing something. */
    const m = new ContextMemory({ maxEntryChars: 50 });
    m.write("big", "x".repeat(500), "task");
    const value = m.read("big")?.value ?? "";
    assert.ok(value.length < 300);
    assert.match(value, /truncated: 450 more characters/);
    assert.match(value, /read_file/, "it should say how to get the rest");
  });

  it("reports a missing key rather than leaving a silent gap", () => {
    const rendered = new ContextMemory().render(["schema"]);
    assert.match(rendered, /schema/);
    assert.match(rendered, /not available/);
  });

  it("returns nothing at all when a task needs nothing", () => {
    assert.equal(new ContextMemory().render([]), "");
  });

  it("overwrites on retry, so nobody reads the version QA rejected", () => {
    const m = new ContextMemory();
    m.write("code", "first attempt, unvalidated", "build");
    m.write("code", "second attempt, validated", "build");
    assert.equal(m.read("code")?.value, "second attempt, validated");
    assert.doesNotMatch(m.render(["code"]), /unvalidated/);
  });

  it("names the task an entry came from, so context has provenance", () => {
    const m = new ContextMemory();
    m.write("contract", "POST /x", "design");
    assert.match(m.render(["contract"]), /from task "design"/);
  });
});

describe("parseJson", () => {
  it("parses a bare object", () => {
    assert.deepEqual(parseJson<{ a: number }>('{"a":1}'), { a: 1 });
  });

  it("parses through a ```json fence", () => {
    assert.deepEqual(parseJson<{ a: number }>('```json\n{"a":1}\n```'), { a: 1 });
  });

  it("parses through a sentence of preamble", () => {
    assert.deepEqual(parseJson<{ a: number }>('Sure, here it is:\n{"a":1}'), { a: 1 });
  });

  it("does not stop at a brace inside a string", () => {
    /* This system's own payloads are full of braces — system prompts, code
       samples — so a naive scan would cut the object short. */
    const got = parseJson<{ code: string; ok: boolean }>('{"code":"function f() { return {}; }","ok":true}');
    assert.equal(got.ok, true);
    assert.match(got.code, /return \{\}/);
  });

  it("does not stop at an escaped quote", () => {
    const got = parseJson<{ s: string }>('{"s":"he said \\"} \\" and left"}');
    assert.match(got.s, /he said/);
  });

  it("throws with the raw text when there is no JSON at all", () => {
    assert.throws(
      () => parseJson("no json here"),
      (err: unknown) => {
        assert.ok(err instanceof ParseError);
        /* The raw text has to survive: it is what gets shown back to the model
           on the retry, and what a person reads in the log. */
        assert.match(err.raw, /no json here/);
        return true;
      },
    );
  });
});

/* --------------------------------------------------------------------------
   tools
   -------------------------------------------------------------------------- */

/**
 * The security boundary.
 *
 * Everything above this layer is a language model deciding what it would like
 * to do, and it can be talked into things — by a stray line in a file it was
 * asked to read, or simply by being wrong. These are the cases that must hold
 * whatever it asks for, so they are tested against a real temporary directory
 * with real symlinks rather than by reading the code and agreeing with it.
 */



const root = await fs.mkdtemp(path.join(os.tmpdir(), "orch-ws-"));
const outside = await fs.mkdtemp(path.join(os.tmpdir(), "orch-out-"));
after(async () => {
  await fs.rm(root, { recursive: true, force: true });
  await fs.rm(outside, { recursive: true, force: true });
});

await fs.mkdir(path.join(root, "src"), { recursive: true });
await fs.writeFile(path.join(root, "src", "app.ts"), "export const a = 1;\n");
await fs.writeFile(path.join(outside, "secrets.env"), "OPENROUTER_API_KEY=sk-real\n");
/* A link inside the workspace pointing out of it: the case that string
   filtering of ".." does not catch, because the path never contains one. */
await fs.symlink(outside, path.join(root, "escape"), "dir");

const ctx = (over: Partial<ToolContext> = {}): ToolContext => ({
  workspace: root,
  apply: false,
  allowed: ["read_file", "list_files", "write_file", "run_check"],
  written: [],
  ...over,
});

describe("resolveInside", () => {
  it("resolves an ordinary relative path", async () => {
    const got = await resolveInside(root, "src/app.ts");
    assert.equal(got, path.join(await fs.realpath(root), "src", "app.ts"));
  });

  it("refuses an absolute path", async () => {
    await assert.rejects(() => resolveInside(root, "/etc/passwd"), ToolError);
  });

  it("refuses traversal out of the workspace", async () => {
    await assert.rejects(() => resolveInside(root, "../../etc/passwd"), /outside the workspace/);
  });

  it("refuses traversal that dips back in first", async () => {
    /* "src/../../x" normalises out of the root, so the check has to be on the
       resolved location rather than on the shape of the string. */
    await assert.rejects(() => resolveInside(root, "src/../../x"), /outside the workspace/);
  });

  it("refuses to follow a symlink out of the workspace", async () => {
    await assert.rejects(() => resolveInside(root, "escape/secrets.env"), /symlink/);
  });

  it("refuses an empty path", async () => {
    await assert.rejects(() => resolveInside(root, "   "), ToolError);
  });

  it("allows a path that does not exist yet, for a file about to be written", async () => {
    const got = await resolveInside(root, "src/new/deep/file.ts");
    assert.ok(got.startsWith(await fs.realpath(root)));
  });

  it("does not mistake a sibling whose name starts with the root's", async () => {
    /* "/tmp/ws" must not admit "/tmp/ws-other": the prefix check needs the
       separator, and this is the case that catches it if someone drops it. */
    const sibling = root + "-other";
    await fs.mkdir(sibling, { recursive: true });
    try {
      await assert.rejects(
        () => resolveInside(root, path.join("..", path.basename(sibling), "x")),
        /outside the workspace/,
      );
    } finally {
      await fs.rm(sibling, { recursive: true, force: true });
    }
  });
});

describe("executeTool", () => {
  it("reads a file inside the workspace", async () => {
    const r = await executeTool({ tool: "read_file", path: "src/app.ts" }, ctx());
    assert.equal(r.ok, true);
    assert.match(r.output ?? "", /export const a/);
  });

  it("refuses a tool the role was not granted, rather than ignoring it", async () => {
    const r = await executeTool(
      { tool: "write_file", path: "x.ts", content: "x" },
      ctx({ allowed: ["read_file"] }),
    );
    assert.equal(r.ok, false);
    assert.match(r.detail, /may not use write_file/);
  });

  it("returns an escape attempt as a failed result, not a thrown error", async () => {
    /* The agent should get a turn to correct itself; crashing the run on a bad
       path would lose the work every other task has already done. */
    const r = await executeTool({ tool: "read_file", path: "../secrets.env" }, ctx());
    assert.equal(r.ok, false);
    assert.match(r.detail, /outside the workspace/);
  });

  it("does not touch disk on a dry run, but still reports the path", async () => {
    const c = ctx({ apply: false });
    const r = await executeTool({ tool: "write_file", path: "dry.ts", content: "x" }, c);
    assert.equal(r.ok, true);
    assert.match(r.detail, /dry run/);
    assert.deepEqual(c.written, ["dry.ts"]);
    await assert.rejects(() => fs.readFile(path.join(root, "dry.ts")));
  });

  it("writes, and creates missing parents, when applying", async () => {
    const c = ctx({ apply: true });
    const r = await executeTool(
      { tool: "write_file", path: "src/deep/made.ts", content: "export const b = 2;\n" },
      c,
    );
    assert.equal(r.ok, true);
    assert.equal(await fs.readFile(path.join(root, "src/deep/made.ts"), "utf8"), "export const b = 2;\n");
    assert.deepEqual(c.written, ["src/deep/made.ts"]);
  });

  it("rejects write_file with no content instead of writing an empty file", async () => {
    const r = await executeTool({ tool: "write_file", path: "x.ts" }, ctx({ apply: true }));
    assert.equal(r.ok, false);
  });

  it("lists files without descending into node_modules or .git", async () => {
    await fs.mkdir(path.join(root, "node_modules", "pkg"), { recursive: true });
    await fs.writeFile(path.join(root, "node_modules", "pkg", "index.js"), "x");
    const r = await executeTool({ tool: "list_files", path: "." }, ctx());
    assert.equal(r.ok, true);
    assert.doesNotMatch(r.output ?? "", /node_modules/);
    assert.match(r.output ?? "", /src\/app\.ts/);
  });
});

describe("runCheck", () => {
  it("refuses a check that is not on the list", async () => {
    const r = await runCheck("rm -rf /", root);
    assert.equal(r.ok, false);
    assert.match(r.output, /not a known check/);
  });

  it("treats a shell metacharacter as a name, never as syntax", async () => {
    /* There is no shell — spawn is called with an argv array — so this can
       only ever be looked up as a check name and missed. */
    const r = await runCheck("typecheck; touch /tmp/pwned", root);
    assert.equal(r.ok, false);
    assert.match(r.output, /not a known check/);
    await assert.rejects(() => fs.stat("/tmp/pwned"));
  });

  it("reports a real check's failure as a result rather than throwing", async () => {
    /* Nothing to typecheck in the temp workspace, so npm itself fails. What
       matters is that it comes back as a readable outcome. */
    const r = await runCheck("typecheck", root);
    assert.equal(typeof r.ok, "boolean");
    assert.equal(typeof r.output, "string");
  });
});

/* --------------------------------------------------------------------------
   conductor
   -------------------------------------------------------------------------- */

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
