/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The drop-in AI endpoint, against a stand-in provider.
 *
 * The whole promise of this file is that swapping the AI is three environment
 * variables and a redeploy — so what has to be true is that the variables are
 * actually read, that a second id in AI_MODEL really does take over when the
 * first will not answer, and that a different AI_PROVIDER really does change
 * the request that goes out. None of that can be checked by reading it, and
 * all of it fails silently in production if it is wrong.
 *
 * AI_BASE_URL points the calls at a local server, so none of this needs a key.
 */

import { after, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import handler from "./functions/ai.ts";

/** One request the stand-in received, as the provider would have seen it. */
interface Seen {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

let seen: Seen[] = [];
/** Per-model behaviour for the current test, by model id. */
let script: Record<string, "ok" | "quota" | "auth" | "boom"> = {};
/** Set for the Anthropic dialect, which has its own response shape. */
let dialect: "openai" | "anthropic" = "openai";

const server = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw) as Record<string, unknown>;
  seen.push({
    url: req.url ?? "",
    headers: req.headers as Record<string, string>,
    body,
  });

  const send = (status: number, payload: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  switch (script[String(body.model)] ?? "ok") {
    case "quota":
      return send(429, { error: { message: "rate limited" } });
    case "auth":
      return send(401, { error: { message: "bad key" } });
    case "boom":
      return send(500, { error: { message: "upstream failure" } });
    default:
      return send(
        200,
        dialect === "anthropic"
          ? { content: [{ type: "text", text: "hello from anthropic" }] }
          : { choices: [{ message: { content: "hello from openai-shaped" } }] },
      );
  }
});

const port: number = await new Promise((resolve) =>
  server.listen(0, () => resolve((server.address() as import("node:net").AddressInfo).port)),
);
after(() => server.close());

const BASE = `http://127.0.0.1:${port}`;

/** Set the environment the function will read on its next call. */
function configure(over: Record<string, string | undefined>): void {
  for (const key of ["AI_API_KEY", "AI_MODEL", "AI_PROVIDER", "AI_BASE_URL", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "OPENROUTER_BASE_URL"]) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(over)) {
    if (value !== undefined) process.env[key] = value;
  }
}

const get = (path: string) => handler(new Request(`https://site.test${path}`));
const post = (path: string, body: unknown) =>
  handler(
    new Request(`https://site.test${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  seen = [];
  script = {};
  dialect = "openai";
});

describe("configuration", () => {
  it("says exactly which variables are missing rather than failing vaguely", async () => {
    configure({});
    const res = await get("/api/ai/health");
    const body = (await res.json()) as { configured: boolean; missing: string[]; hint: string };

    assert.equal(res.status, 503);
    assert.equal(body.configured, false);
    assert.deepEqual(body.missing, ["AI_API_KEY", "AI_MODEL"]);
    assert.match(body.hint, /Environment variables/);
  });

  it("still works for a site set up with the OPENROUTER_ names", async () => {
    /* Adding this file must not require renaming variables on a site that is
       already running. */
    configure({ OPENROUTER_API_KEY: "k", OPENROUTER_MODEL: "m", OPENROUTER_BASE_URL: BASE });
    const res = await get("/api/ai/health");
    assert.equal(res.status, 200);
  });

  it("names AI_BASE_URL as missing when the provider is custom", async () => {
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_PROVIDER: "custom" });
    const body = (await (await get("/api/ai/health")).json()) as { missing: string[] };
    assert.deepEqual(body.missing, ["AI_BASE_URL"]);
  });
});

describe("switching provider", () => {
  it("reports the provider it was pointed at", async () => {
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_PROVIDER: "groq", AI_BASE_URL: BASE });
    const body = (await (await get("/api/ai/health")).json()) as { provider: string };
    assert.equal(body.provider, "Groq");
  });

  it("sends an OpenAI-shaped request by default, system first", async () => {
    configure({ AI_API_KEY: "sk-test", AI_MODEL: "m", AI_BASE_URL: BASE });
    await post("/api/ai/chat", { message: "hi", system: "BE BRIEF" });

    const call = seen.at(-1);
    assert.ok(call);
    assert.match(call.url, /\/chat\/completions$/);
    assert.equal(call.headers.authorization, "Bearer sk-test");
    const messages = call.body.messages as Array<{ role: string; content: string }>;
    assert.equal(messages[0].role, "system");
    assert.equal(messages[0].content, "BE BRIEF");
    assert.equal(messages.at(-1)?.content, "hi");
  });

  it("sends Anthropic's own shape when AI_PROVIDER is anthropic", async () => {
    /* A different path, a different auth header, and the system prompt as its
       own field rather than the first message. Bending it into the OpenAI
       shape would 400 on every request. */
    dialect = "anthropic";
    configure({ AI_API_KEY: "sk-ant", AI_MODEL: "claude-x", AI_PROVIDER: "anthropic", AI_BASE_URL: BASE });

    const res = await post("/api/ai/chat", { message: "hi", system: "BE BRIEF" });
    const body = (await res.json()) as { text: string };

    const call = seen.at(-1);
    assert.ok(call);
    assert.match(call.url, /\/messages$/);
    assert.equal(call.headers["x-api-key"], "sk-ant");
    assert.equal(call.headers["anthropic-version"], "2023-06-01");
    assert.equal(call.body.system, "BE BRIEF", "system is a field, not a message");
    assert.equal((call.body.messages as unknown[]).length, 1, "and is not also in the messages");
    assert.equal(body.text, "hello from anthropic", "the content[] shape is read back");
  });

  it("never puts the key in a reply", async () => {
    configure({ AI_API_KEY: "sk-secret-value", AI_MODEL: "m", AI_BASE_URL: BASE });
    const text = await (await get("/api/ai/health")).text();
    assert.doesNotMatch(text, /sk-secret-value/);
  });
});

describe("the model chain", () => {
  it("falls through to the next id when the first is over its cap", async () => {
    /* The reason to list two ids at all: a free model's daily cap stops every
       reply at once, and the second id is what carries the site through it. */
    script = { "model-a": "quota" };
    configure({ AI_API_KEY: "k", AI_MODEL: "model-a, model-b", AI_BASE_URL: BASE });

    const body = (await (await post("/api/ai/chat", { message: "hi" })).json()) as {
      text: string;
      answeredBy: number;
    };

    assert.equal(body.answeredBy, 2);
    assert.deepEqual(seen.map((c) => c.body.model), ["model-a", "model-b"]);
  });

  it("falls through a provider-side failure too", async () => {
    script = { "model-a": "boom" };
    configure({ AI_API_KEY: "k", AI_MODEL: "model-a,model-b", AI_BASE_URL: BASE });
    const body = (await (await post("/api/ai/chat", { message: "hi" })).json()) as { answeredBy: number };
    assert.equal(body.answeredBy, 2);
  });

  it("stops on a rejected key instead of trying every id", async () => {
    /* A bad key fails identically down the whole list, so trying the rest only
       delays telling the operator what is actually wrong. */
    script = { "model-a": "auth", "model-b": "ok" };
    configure({ AI_API_KEY: "k", AI_MODEL: "model-a,model-b", AI_BASE_URL: BASE });

    const res = await post("/api/ai/chat", { message: "hi" });
    assert.equal(res.status, 503);
    assert.deepEqual(seen.map((c) => c.body.model), ["model-a"]);
  });

  it("says which id answered, so a fallback can be told from the primary", async () => {
    script = { "model-a": "quota" };
    configure({ AI_API_KEY: "k", AI_MODEL: "model-a,model-b", AI_BASE_URL: BASE });
    const body = (await (await get("/api/ai/health")).json()) as { answeredBy: number; hint: string };
    assert.equal(body.answeredBy, 2);
    assert.match(body.hint, /running on a fallback/);
  });

  it("reports the failure kind when the whole chain is exhausted", async () => {
    script = { "model-a": "quota", "model-b": "quota" };
    configure({ AI_API_KEY: "k", AI_MODEL: "model-a,model-b", AI_BASE_URL: BASE });
    const body = (await (await get("/api/ai/health")).json()) as { kind: string; hint: string };
    assert.equal(body.kind, "quota");
    assert.match(body.hint, /daily cap/);
  });
});

describe("the chat route", () => {
  it("answers a well-formed request", async () => {
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_BASE_URL: BASE });
    const body = (await (await post("/api/ai/chat", { message: "hi" })).json()) as { text: string };
    assert.equal(body.text, "hello from openai-shaped");
  });

  it("refuses an empty message", async () => {
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_BASE_URL: BASE });
    assert.equal((await post("/api/ai/chat", { message: "   " })).status, 400);
  });

  it("refuses a message past the cap", async () => {
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_BASE_URL: BASE });
    assert.equal((await post("/api/ai/chat", { message: "x".repeat(5_000) })).status, 400);
  });

  it("drops malformed history rather than passing it to the provider", async () => {
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_BASE_URL: BASE });
    await post("/api/ai/chat", {
      message: "hi",
      history: [{ role: "user", content: "kept" }, { role: "wizard", content: "dropped" }, "nonsense"],
    });
    const messages = seen.at(-1)?.body.messages as Array<{ content: string }>;
    assert.equal(messages.length, 3, "system + one kept turn + the new message");
    assert.ok(!messages.some((m) => m.content === "dropped"));
  });

  it("does not leak the provider's own error text to the browser", async () => {
    /* A provider error can quote the prompt back, and the model ids are not
       the caller's business either. */
    script = { m: "boom" };
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_BASE_URL: BASE });
    const text = await (await post("/api/ai/chat", { message: "hi" })).text();
    assert.doesNotMatch(text, /upstream failure/);
    assert.doesNotMatch(text, /\bm\b.*500/);
  });

  it("says plainly that nothing is configured rather than erroring", async () => {
    configure({});
    const res = await post("/api/ai/chat", { message: "hi" });
    const body = (await res.json()) as { error: string; message: string };
    assert.equal(res.status, 503);
    assert.equal(body.error, "NOT_CONFIGURED");
    assert.match(body.message, /AI_API_KEY and AI_MODEL/);
  });
});

describe("the page", () => {
  it("serves HTML at /ai", async () => {
    configure({ AI_API_KEY: "k", AI_MODEL: "m", AI_BASE_URL: BASE });
    const res = await get("/ai");
    assert.match(res.headers.get("content-type") ?? "", /text\/html/);
    assert.match(res.headers.get("x-robots-tag") ?? "", /noindex/);
    const html = await res.text();
    assert.match(html, /AI_MODEL/, "it should tell you which variables to set");
  });
});
