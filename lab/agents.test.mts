/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The fallback chain, exercised against a stand-in provider.
 *
 * This is the one part of the runtime whose whole job is to behave well when
 * something else is behaving badly, which makes it exactly the part that
 * cannot be checked by reading it or by watching the site work on a good day.
 * A model that is merely slow, one that is over its cap and one that is
 * retired all have to fail differently, and the only way to see that is to
 * stand up something that fails on purpose.
 *
 * No test framework and no fixtures: node:test and node:assert ship with the
 * runtime, and OPENROUTER_BASE_URL already exists so the calls can be pointed
 * at a stand-in endpoint. Run with `npm test`.
 */

import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { generateReply, ProviderError, TOTAL_BUDGET_MS, type LabSettings } from "./agents";

/** What the stand-in should do for a given model id, per test. */
type Behaviour = "hang" | "quota" | "auth" | "boom" | "ok";

let script: Record<string, Behaviour> = {};
/** Model ids the stand-in was actually asked for, in order. */
let asked: string[] = [];

const server = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const model = JSON.parse(raw).model as string;
  asked.push(model);

  const json = (status: number, body: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  switch (script[model] ?? "ok") {
    // Never answers, so the caller's own abort is what ends it.
    case "hang":
      return;
    case "quota":
      return json(429, { error: { message: "rate limited" } });
    case "auth":
      return json(401, { error: { message: "bad key" } });
    case "boom":
      return json(500, { error: { message: "upstream failure" } });
    default:
      return json(200, {
        choices: [{ message: { content: `answer from ${model}` }, finish_reason: "stop" }],
      });
  }
});

const port: number = await new Promise((resolve) =>
  server.listen(0, () => resolve((server.address() as import("node:net").AddressInfo).port)),
);
after(() => server.close());

const settings = (model: string): LabSettings => ({
  apiKey: "test-key",
  model,
  baseUrl: `http://127.0.0.1:${port}`,
});

const ask = (model: string) =>
  generateReply(
    { system: "s", messages: [{ role: "user", content: "hi" }], temperature: 0, maxTokens: 8 },
    settings(model),
  );

/** Set the scenario and forget what the last one asked for. */
const given = (s: Record<string, Behaviour>) => {
  script = s;
  asked = [];
};

describe("generateReply fallback chain", () => {
  it("hands a slow model's turn to the next one", async () => {
    /* The regression this file was written for. "timeout" was treated as not
       worth falling back from, on the reasoning that a retry would fail the
       same way — true of the same model, false of a different one, and the
       slow-model case is the main thing the list exists to survive. */
    given({ "model-a": "hang", "model-b": "ok" });
    const started = Date.now();

    const reply = await ask("model-a,model-b");

    assert.equal(reply.attempt, 2, "the second model should have answered");
    assert.match(reply.text, /model-b/);
    assert.deepEqual(asked, ["model-a", "model-b"], "both models should have been tried");
    assert.ok(
      Date.now() - started < TOTAL_BUDGET_MS,
      "the whole chain should finish inside the budget",
    );
  });

  it("cuts a hung attempt short so the next model can still be tried", async () => {
    /* A flat 15s ceiling would leave a 17s budget with no room for anyone
       else, which made the fallback list decorative under a timeout. */
    given({ "model-a": "hang", "model-b": "ok" });
    const started = Date.now();

    await ask("model-a,model-b");

    assert.ok(
      Date.now() - started < 14_000,
      `first attempt should get about half the budget, not the flat ceiling (took ${Date.now() - started}ms)`,
    );
  });

  it("falls back past a model that is over its cap", async () => {
    given({ "model-a": "quota", "model-b": "ok" });
    assert.equal((await ask("model-a,model-b")).attempt, 2);
  });

  it("falls back past a provider-side failure", async () => {
    given({ "model-a": "boom", "model-b": "ok" });
    assert.equal((await ask("model-a,model-b")).attempt, 2);
  });

  it("stops on a bad key instead of spending the budget", async () => {
    /* The one failure that says something about every model at once: the key
       is rejected the same way down the whole list, so trying the rest only
       delays telling the operator what is actually wrong. */
    given({ "model-a": "auth", "model-b": "ok" });

    await assert.rejects(
      () => ask("model-a,model-b"),
      (err: unknown) => err instanceof ProviderError && err.kind === "auth",
    );
    assert.deepEqual(asked, ["model-a"], "the fallback should not have been tried");
  });

  it("reports which model answered, so a backup can be told from the primary", async () => {
    /* /api/lab/health surfaces this. Running on the last fallback and running
       on the first look identical from outside, right up until it doesn't. */
    given({ "model-a": "ok" });
    assert.equal((await ask("model-a,model-b")).attempt, 1);
  });

  it("reports the real failure once the list is exhausted", async () => {
    given({ "model-a": "quota", "model-b": "quota" });

    await assert.rejects(
      () => ask("model-a,model-b"),
      (err: unknown) => err instanceof ProviderError && err.kind === "quota",
      "the last real failure should survive, not be replaced by a generic one",
    );
  });
});
