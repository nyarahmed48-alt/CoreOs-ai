/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE AI ENDPOINT — one file, any provider, configured entirely from Netlify.
 *
 * Drop this file into netlify/functions/ and deploy. It needs no entry in
 * netlify.toml and no rule in public/_redirects: the `config.path` export at
 * the bottom registers its own routes, so this file is the whole install.
 *
 * ---------------------------------------------------------------------------
 * SETTING IT UP  —  Site configuration → Environment variables
 *
 *   AI_API_KEY    the key from whichever provider you are using
 *   AI_MODEL      one model id, or several comma-separated (see below)
 *   AI_PROVIDER   openrouter (default) · openai · anthropic · groq · deepseek
 *                 · mistral · together · xai · gemini · custom
 *
 * Then redeploy — Netlify only hands new variables to a new deploy, so a saved
 * change does nothing until the site is rebuilt. "Trigger deploy" is enough.
 *
 * That is the whole job. Changing the model, the key, or the provider is three
 * fields and a redeploy; no code change, and nobody has to open this file.
 *
 * ---------------------------------------------------------------------------
 * AI_MODEL TAKES A LIST, AND YOU SHOULD USE ONE
 *
 *   AI_MODEL=meta-llama/llama-3.3-70b-instruct:free, google/gemma-2-9b-it:free
 *
 * Ids are tried in order and the first that answers serves the request. Free
 * models carry a daily cap, and when the first one hits it every reply stops at
 * once — with a second id listed the site rides that out instead of going quiet
 * until somebody notices. Anything ending `:free` on OpenRouter costs nothing.
 *
 * A model is skipped when it is over its cap, unknown, unreachable, or too slow
 * to answer. A rejected key is the exception: it fails identically on every id
 * in the list, so it is reported at once rather than rediscovered five times.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT SERVES
 *
 *   GET  /ai                 a page: is it working, which provider, send a test
 *   GET  /api/ai/health      the same, as JSON
 *   POST /api/ai/chat        { message, system?, history? } → { text }
 *
 * The key is never returned by any route, never logged, and never reaches the
 * browser. /ai reports states and counts only — it is safe to leave public.
 */

/* ========================================================== the providers ===

   Nearly every provider now speaks the OpenAI chat-completions shape, so one
   client covers them all and switching brand is a base URL. Anthropic is the
   exception — a different path, a different auth header, and the system prompt
   as its own field rather than the first message — so it gets a second branch
   rather than being bent into a shape it does not have.

   Adding a brand is one entry here. Nothing else in the file changes.
============================================================================ */

interface Provider {
  label: string;
  baseUrl: string;
  /** "openai" covers every OpenAI-compatible API; "anthropic" is its own. */
  dialect: "openai" | "anthropic";
  /** Where to get a key, shown on the /ai page when none is set. */
  keysUrl: string;
}

export const PROVIDERS: Record<string, Provider> = {
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    dialect: "openai",
    keysUrl: "https://openrouter.ai/keys",
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    dialect: "openai",
    keysUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    dialect: "anthropic",
    keysUrl: "https://console.anthropic.com/settings/keys",
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    dialect: "openai",
    keysUrl: "https://console.groq.com/keys",
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    dialect: "openai",
    keysUrl: "https://platform.deepseek.com/api_keys",
  },
  mistral: {
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    dialect: "openai",
    keysUrl: "https://console.mistral.ai/api-keys",
  },
  together: {
    label: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    dialect: "openai",
    keysUrl: "https://api.together.xyz/settings/api-keys",
  },
  xai: {
    label: "xAI",
    baseUrl: "https://api.x.ai/v1",
    dialect: "openai",
    keysUrl: "https://console.x.ai",
  },
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    dialect: "openai",
    keysUrl: "https://aistudio.google.com/apikey",
  },
  custom: {
    label: "Custom",
    baseUrl: "",
    dialect: "openai",
    keysUrl: "",
  },
};

/* ================================================================ config === */

interface Settings {
  provider: Provider;
  providerName: string;
  apiKey: string;
  models: string[];
  baseUrl: string;
}

const env = (name: string): string => (process.env[name] ?? "").trim();

/**
 * Read the configuration, or say what is missing.
 *
 * OPENROUTER_API_KEY and OPENROUTER_MODEL are accepted as fallbacks so a site
 * already set up that way keeps working after this file is added — nobody
 * should have to rename a variable to install an endpoint.
 */
interface Resolved {
  /** Null when anything required is missing; `missing` then names what. */
  settings: Settings | null;
  missing: string[];
}

function readSettings(): Resolved {
  const name = (env("AI_PROVIDER") || "openrouter").toLowerCase();
  const provider = PROVIDERS[name] ?? PROVIDERS.openrouter;
  const apiKey = env("AI_API_KEY") || env("OPENROUTER_API_KEY");
  const models = (env("AI_MODEL") || env("OPENROUTER_MODEL"))
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const baseUrl = (env("AI_BASE_URL") || env("OPENROUTER_BASE_URL") || provider.baseUrl).replace(/\/$/, "");

  const missing: string[] = [];
  if (!apiKey) missing.push("AI_API_KEY");
  if (!models.length) missing.push("AI_MODEL");
  /* "custom" has no built-in URL, so it is only usable with one supplied. */
  if (!baseUrl) missing.push("AI_BASE_URL");
  if (missing.length) return { settings: null, missing };

  return {
    settings: { provider, providerName: name in PROVIDERS ? name : "openrouter", apiKey, models, baseUrl },
    missing: [],
  };
}

/* =============================================================== calling === */

type FailureKind = "quota" | "auth" | "model" | "timeout" | "network" | "other";

class AiError extends Error {
  constructor(
    readonly kind: FailureKind,
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

/** What went wrong, in terms someone can act on — never the provider's text. */
function classify(status: number, body: string): FailureKind {
  if (status === 429 || status === 402) return "quota";
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "model";
  if (status === 400 && /model/i.test(body)) return "model";
  return "other";
}

const HINTS: Record<FailureKind, string> = {
  quota: "Out of credit, or over this model's daily cap. Add a second id to AI_MODEL as a fallback, or top up with the provider.",
  auth: "AI_API_KEY is missing, wrong, or not permitted for this model. Check it with the provider, then redeploy.",
  model: "A model id in AI_MODEL is unknown or retired for this provider. Check the spelling against the provider's model list.",
  timeout: "Every model in the list answered too slowly. Put a faster one first in AI_MODEL.",
  network: "Could not reach the provider at all. Usually transient — check their status page.",
  other: "Unrecognised failure. The Netlify function log has the detail.",
};

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

/* Netlify kills a function at 30s and answers with an HTML error page, which a
   browser reads as "the endpoint is gone" rather than "the model was slow". So
   the deadline is ours: abort first, and answer with real JSON. */
const ATTEMPT_MS = 12_000;
const BUDGET_MS = 22_000;
const MIN_ATTEMPT_MS = 5_000;
const MAX_TOKENS = 2_048;

/** While anyone is left to fall back to, no attempt gets more than half. */
const attemptBudget = (remaining: number, left: number): number =>
  left <= 1
    ? Math.min(ATTEMPT_MS, remaining)
    : Math.min(ATTEMPT_MS, Math.max(MIN_ATTEMPT_MS, Math.floor(remaining / 2)), remaining);

async function callOnce(
  model: string,
  system: string,
  history: Turn[],
  settings: Settings,
  timeoutMs: number,
): Promise<string> {
  const anthropic = settings.provider.dialect === "anthropic";
  const url = `${settings.baseUrl}${anthropic ? "/messages" : "/chat/completions"}`;

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (anthropic) {
    headers["x-api-key"] = settings.apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers.authorization = `Bearer ${settings.apiKey}`;
    // OpenRouter uses these for attribution; every other provider ignores them.
    headers["http-referer"] = env("URL") || "https://coreosai.netlify.app";
    headers["x-title"] = "CoreOs";
  }

  const body = anthropic
    ? { model, max_tokens: MAX_TOKENS, system, messages: history }
    : { model, max_tokens: MAX_TOKENS, messages: [{ role: "system", content: system }, ...history] };

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: abort.signal,
    });
  } catch (err) {
    if (abort.signal.aborted) throw new AiError("timeout", null, `${model} did not answer in ${timeoutMs}ms`);
    throw new AiError("network", null, `${model}: ${(err as Error)?.message ?? "fetch failed"}`);
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();
  let payload: {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
    content?: Array<{ type?: string; text?: string }>;
  } | null = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    /* A gateway in front of the provider can answer HTML. Let the status decide. */
  }

  if (!response.ok) {
    throw new AiError(
      classify(response.status, raw),
      response.status,
      `${model} → ${response.status}: ${payload?.error?.message ?? response.statusText}`,
    );
  }
  if (payload?.error) throw new AiError("other", null, `${model}: ${payload.error.message ?? "unknown error"}`);

  const text = anthropic
    ? (payload?.content ?? []).filter((p) => p.type === "text").map((p) => p.text ?? "").join("")
    : (payload?.choices?.[0]?.message?.content ?? "");

  return String(text).trim();
}

export interface Answer {
  text: string;
  /** Which position in AI_MODEL answered, 1-based. Above 1 means a fallback. */
  answeredBy: number;
}

/** One reply, falling through AI_MODEL until something answers. */
export async function ask(system: string, history: Turn[], settings: Settings): Promise<Answer> {
  const deadline = Date.now() + BUDGET_MS;
  let last: AiError | null = null;

  for (const [index, model] of settings.models.entries()) {
    const remaining = deadline - Date.now();
    if (remaining <= 1_000) break;

    try {
      const text = await callOnce(
        model,
        system,
        history,
        settings,
        attemptBudget(remaining, settings.models.length - index),
      );
      if (index > 0) console.warn(`Answered by fallback #${index + 1} of ${settings.models.length}.`);
      return { text, answeredBy: index + 1 };
    } catch (err) {
      const error = err instanceof AiError ? err : new AiError("other", null, String(err));
      last = error;
      /* A rejected key fails the same on every id below, so stop and say so. */
      if (error.kind === "auth") throw error;
      console.warn(`Falling back past model #${index + 1} (${error.kind}): ${error.message}`);
    }
  }

  throw last ?? new AiError("timeout", null, "No model answered in time");
}

/* ================================================================ routes === */

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const MAX_MESSAGE_CHARS = 4_000;

async function health(): Promise<Response> {
  const { settings, missing } = readSettings();
  if (!settings) {
    return json(
      {
        ok: false,
        configured: false,
        missing,
        hint: `Set ${missing.join(" and ")} in Netlify → Site configuration → Environment variables, then redeploy.`,
      },
      503,
    );
  }

  const started = Date.now();
  try {
    const answer = await ask("Reply with the single word OK.", [{ role: "user", content: "ping" }], settings);
    return json({
      ok: true,
      configured: true,
      provider: settings.provider.label,
      modelsConfigured: settings.models.length,
      answeredBy: answer.answeredBy,
      ms: Date.now() - started,
      hint:
        answer.answeredBy > 1
          ? `Working, but the first ${answer.answeredBy - 1} id(s) in AI_MODEL did not answer — the site is running on a fallback.`
          : "Working.",
    });
  } catch (err) {
    const kind: FailureKind = err instanceof AiError ? err.kind : "other";
    const status = err instanceof AiError ? err.status : null;
    // The detail goes to the function log; never to the browser.
    console.error(`AI health probe failed [${kind}]:`, err instanceof Error ? err.message : err);
    return json(
      {
        ok: false,
        configured: true,
        provider: settings.provider.label,
        modelsConfigured: settings.models.length,
        kind,
        status,
        ms: Date.now() - started,
        hint: HINTS[kind],
      },
      503,
    );
  }
}

async function chat(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  const { settings, missing } = readSettings();
  if (!settings) {
    return json(
      {
        error: "NOT_CONFIGURED",
        message: `No AI is configured on this deployment. Set ${missing.join(" and ")} in Netlify and redeploy.`,
      },
      503,
    );
  }

  let payload: { message?: unknown; system?: unknown; history?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json({ error: "BAD_JSON", message: "Could not read that request." }, 400);
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message) return json({ error: "NO_MESSAGE", message: "Send a `message`." }, 400);
  if (message.length > MAX_MESSAGE_CHARS) {
    return json({ error: "TOO_LONG", message: `Keep it under ${MAX_MESSAGE_CHARS} characters.` }, 400);
  }

  const system =
    typeof payload.system === "string" && payload.system.trim()
      ? payload.system.trim()
      : "You are a helpful assistant for a small business. Be concise and practical. " +
        "You assist the people who work here rather than replacing them: prefer drafts over decisions, " +
        "say plainly when you are unsure, and hand anything consequential to a human.";

  /* Only well-formed turns survive: a malformed history is the caller's bug and
     should not become a provider error that looks like ours. */
  const history: Turn[] = Array.isArray(payload.history)
    ? payload.history
        .filter((t): t is Turn =>
          !!t &&
          typeof t === "object" &&
          typeof (t as Turn).content === "string" &&
          ((t as Turn).role === "user" || (t as Turn).role === "assistant"),
        )
        .slice(-10)
    : [];

  try {
    const answer = await ask(system, [...history, { role: "user", content: message }], settings);
    return json({ text: answer.text, answeredBy: answer.answeredBy });
  } catch (err) {
    const kind: FailureKind = err instanceof AiError ? err.kind : "other";
    console.error(`AI chat failed [${kind}]:`, err instanceof Error ? err.message : err);
    /* Deliberately generic for the browser: a provider's own error text can
       quote the prompt back, and the model ids are not the caller's business. */
    return json(
      { error: "AI_UNAVAILABLE", message: "The assistant could not answer just now. Try again shortly." },
      503,
    );
  }
}

/* ============================================================== the page === */

const PAGE = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>AI status</title>
<style>
  :root { color-scheme: light dark; --bg:#f4f6f0; --card:#fff; --line:#d7ddc9; --ink:#12161f;
          --dim:#5b6570; --ok:#1c7a4b; --bad:#ab392e; --accent:#1878dc; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#080b12; --card:#0f141f; --line:#232c3d; --ink:#e6eaf1;
            --dim:#8f99a9; --ok:#45bd80; --bad:#e97063; --accent:#4f9ef2; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 18px 60px; background:var(--bg); color:var(--ink);
         font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif; }
  main { max-width:620px; margin:0 auto; }
  h1 { font-size:21px; margin:0 0 4px; letter-spacing:-.01em; }
  .sub { color:var(--dim); font-size:14px; margin:0 0 22px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px;
          padding:18px; margin:0 0 14px; }
  .state { font-weight:600; font-size:16px; display:flex; align-items:center; gap:8px; }
  .dot { width:9px; height:9px; border-radius:50%; background:var(--dim); flex:none; }
  .ok .dot { background:var(--ok); } .ok { color:var(--ok); }
  .bad .dot { background:var(--bad); } .bad { color:var(--bad); }
  dl { display:grid; grid-template-columns:auto 1fr; gap:7px 16px; margin:14px 0 0; font-size:14px; }
  dt { color:var(--dim); }
  dd { margin:0; font-family:ui-monospace,Menlo,monospace; }
  p.hint { margin:14px 0 0; font-size:14px; color:var(--dim); }
  label { display:block; font-size:13px; color:var(--dim); margin:0 0 6px; }
  textarea, input { width:100%; font:14px/1.5 inherit; color:var(--ink); background:var(--bg);
                    border:1px solid var(--line); border-radius:8px; padding:10px; }
  textarea { resize:vertical; min-height:76px; font-family:inherit; }
  button { margin-top:10px; appearance:none; border:0; border-radius:8px; padding:10px 16px;
           background:var(--accent); color:#fff; font:600 14px inherit; cursor:pointer; }
  button:disabled { opacity:.55; cursor:default; }
  pre { white-space:pre-wrap; word-break:break-word; background:var(--bg); border:1px solid var(--line);
        border-radius:8px; padding:12px; margin:14px 0 0; font-size:13.5px; }
  code { background:var(--bg); padding:1px 5px; border-radius:4px; font-size:13px; }
  table { width:100%; border-collapse:collapse; font-size:13.5px; margin-top:10px; }
  td { padding:6px 0; border-bottom:1px solid var(--line); vertical-align:top; }
  td:first-child { font-family:ui-monospace,Menlo,monospace; padding-right:14px; white-space:nowrap; }
  tr:last-child td { border-bottom:0; }
  [hidden] { display:none !important; }
</style>
</head>
<body>
<main>
  <h1>AI status</h1>
  <p class="sub">Whether this site's assistant is working, and what to change if it is not.</p>

  <div class="card">
    <div class="state" id="state"><span class="dot"></span><span id="state-text">Checking…</span></div>
    <dl id="facts" hidden>
      <dt>Provider</dt><dd id="f-provider">—</dd>
      <dt>Models listed</dt><dd id="f-models">—</dd>
      <dt>Answered by</dt><dd id="f-by">—</dd>
      <dt>Round trip</dt><dd id="f-ms">—</dd>
    </dl>
    <p class="hint" id="hint"></p>
    <button id="recheck">Check again</button>
  </div>

  <div class="card" id="test-card" hidden>
    <label for="msg">Send it something, to see for yourself</label>
    <textarea id="msg" placeholder="What are your opening hours?"></textarea>
    <button id="send">Send</button>
    <pre id="reply" hidden></pre>
  </div>

  <div class="card">
    <strong style="font-size:14px">Changing the AI</strong>
    <p class="hint" style="margin-top:6px">
      Netlify → <em>Site configuration → Environment variables</em>. Change a value,
      save, then <em>Deploys → Trigger deploy</em> — Netlify only hands new
      variables to a new build, so a save alone does nothing.
    </p>
    <table>
      <tr><td>AI_API_KEY</td><td>The key from whichever provider you use.</td></tr>
      <tr><td>AI_MODEL</td><td>One model id — or several, comma-separated. They are tried in order, so a second one keeps the site up when the first hits its daily cap.</td></tr>
      <tr><td>AI_PROVIDER</td><td><code>openrouter</code> (default), <code>openai</code>, <code>anthropic</code>, <code>groq</code>, <code>deepseek</code>, <code>mistral</code>, <code>together</code>, <code>xai</code>, <code>gemini</code>, or <code>custom</code> with <code>AI_BASE_URL</code>.</td></tr>
    </table>
  </div>
</main>

<script>
  var $ = function (id) { return document.getElementById(id); };

  async function check() {
    $("recheck").disabled = true;
    $("state").className = "state";
    $("state-text").textContent = "Checking…";
    try {
      var res = await fetch("/api/ai/health", { headers: { accept: "application/json" } });
      var d = await res.json();
      $("state").className = "state " + (d.ok ? "ok" : "bad");
      $("state-text").textContent = d.ok ? "Working" : (d.configured ? "Not answering" : "Not configured");
      $("facts").hidden = !d.configured;
      $("f-provider").textContent = d.provider || "—";
      $("f-models").textContent = d.modelsConfigured != null ? String(d.modelsConfigured) : "—";
      $("f-by").textContent = d.answeredBy
        ? (d.answeredBy === 1 ? "the first id" : "fallback #" + d.answeredBy)
        : "—";
      $("f-ms").textContent = d.ms != null ? d.ms + " ms" : "—";
      $("hint").textContent = d.hint || "";
      $("test-card").hidden = !d.ok;
    } catch (e) {
      $("state").className = "state bad";
      $("state-text").textContent = "Could not reach /api/ai/health";
      $("hint").textContent = "The function itself is not responding on this deployment.";
    }
    $("recheck").disabled = false;
  }

  $("recheck").onclick = check;

  $("send").onclick = async function () {
    var text = $("msg").value.trim();
    if (!text) return;
    $("send").disabled = true;
    $("reply").hidden = false;
    $("reply").textContent = "Thinking…";
    try {
      var res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      var d = await res.json();
      $("reply").textContent = d.text || d.message || "No reply.";
    } catch (e) {
      $("reply").textContent = "The request failed.";
    }
    $("send").disabled = false;
  };

  check();
</script>
</body>
</html>`;

/* ============================================================== handler === */

export default async function handler(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/\/$/, "") || "/ai";

  if (path === "/api/ai/health") return health();
  if (path === "/api/ai/chat") return chat(request);

  return new Response(PAGE, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

/**
 * Netlify Functions v2 reads this at deploy time and registers the routes, so
 * this file needs no netlify.toml entry and no _redirects rule. That is what
 * makes it a drop-in: one file, and the install is complete.
 */
export const config = {
  path: ["/ai", "/api/ai/health", "/api/ai/chat"],
};
