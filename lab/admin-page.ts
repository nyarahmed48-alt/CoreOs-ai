/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The /admin page: change the OpenRouter model or key without a deploy.
 *
 * Served straight from the server rather than added to the React app, for two
 * reasons. It keeps an admin surface out of the bundle every visitor
 * downloads, and it means this page still works when the site build is broken
 * — which is exactly when you might need to point the sandbox at a different
 * model.
 *
 * Lives beside the agent code rather than under worker/ because both hosts
 * serve it: Cloudflare from the Worker, Netlify from a function.
 *
 * The token is typed in, held in memory for the length of the visit, and sent
 * as a header. It is never stored, never put in the URL, and never logged.
 */

export const ADMIN_PAGE = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>CoreOs — sandbox settings</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px 20px; background: #05060a; color: #e7eaf6;
    font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  main { max-width: 560px; margin: 0 auto; }
  h1 { font-size: 22px; letter-spacing: -0.02em; margin: 0 0 6px; }
  .sub { color: #8c93ac; font-size: 14px; margin: 0 0 28px; }
  fieldset { border: 1px solid #232b40; border-radius: 14px; padding: 20px; margin: 0 0 16px; }
  legend { padding: 0 8px; font-size: 12px; text-transform: uppercase;
           letter-spacing: 0.14em; color: #6b7392; }
  label { display: block; font-size: 13px; color: #a4abc4; margin: 14px 0 6px; }
  input {
    width: 100%; padding: 11px 13px; border-radius: 9px; font-size: 15px;
    background: #0e1320; border: 1px solid #232b40; color: #e7eaf6;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }
  input:focus { outline: 2px solid #6c7bf0; outline-offset: 1px; }
  button {
    margin-top: 18px; padding: 11px 20px; border: 0; border-radius: 9px;
    background: #6c7bf0; color: #05060a; font-size: 15px; font-weight: 700;
    cursor: pointer;
  }
  button:disabled { opacity: 0.5; cursor: default; }
  .hint { font-size: 12.5px; color: #6b7392; margin-top: 6px; }
  .state { margin-top: 18px; padding: 13px 15px; border-radius: 10px; font-size: 14px;
           border: 1px solid #232b40; background: #0b1018; white-space: pre-wrap; }
  .ok { border-color: #1f6f43; color: #7ee2a8; }
  .bad { border-color: #7a2b32; color: #ff9ba4; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 6px 0 0;
       font-size: 14px; }
  button.ghost { background: transparent; color: #cfd6f5; border: 1px solid #2a3350;
                 margin-inline-start: 8px; }
  button.ghost:hover { background: #161d33; }
  dt { color: #6b7392; }
  dd { margin: 0; font-family: ui-monospace, Menlo, monospace; word-break: break-all; }
</style>
</head>
<body>
<main>
  <h1>Sandbox settings</h1>
  <p class="sub">
    Change which model answers, or replace the OpenRouter key. Saves take effect
    on the next request — no redeploy.
  </p>

  <fieldset>
    <legend>Sign in</legend>
    <label for="token">Admin token</label>
    <input id="token" type="password" autocomplete="current-password"
           placeholder="the ADMIN_TOKEN secret" />
    <p class="hint">Held in this tab only. Never saved.</p>
    <button id="load">Load current settings</button>
  </fieldset>

  <fieldset id="panel" hidden>
    <legend>Current</legend>
    <dl>
      <dt>Model</dt><dd id="cur-model">—</dd>
      <dt>Source</dt><dd id="cur-model-src">—</dd>
      <dt>Key</dt><dd id="cur-key">—</dd>
      <dt>Source</dt><dd id="cur-key-src">—</dd>
      <dt>Changed</dt><dd id="cur-when">—</dd>
    </dl>

    <label for="model">Model (comma-separate for fallbacks)</label>
    <input id="model" placeholder="vendor/model:free, vendor/backup:free" />
    <p class="hint">Ids come from openrouter.ai/models. The first that answers wins.</p>

    <label for="key">API key — leave blank to keep the current one</label>
    <input id="key" type="password" autocomplete="off" placeholder="sk-or-v1-…" />
    <p class="hint">Type a single space and save to clear it and fall back to the environment variable.</p>

    <button id="save">Save</button>
    <button id="test" class="ghost">Test now</button>
    <p class="hint">
      Test makes one real call through the same path the agents use and says
      what came back — so a swap can be confirmed here rather than by opening
      the site and guessing at a silent failure.
    </p>

    <dl id="probe" hidden>
      <dt>Result</dt><dd id="p-result">—</dd>
      <dt>Answered by</dt><dd id="p-by">—</dd>
      <dt>Round trip</dt><dd id="p-ms">—</dd>
      <dt>What to do</dt><dd id="p-hint">—</dd>
    </dl>
  </fieldset>

  <div id="state" class="state" hidden></div>
</main>

<script>
  var API = "/api/lab/settings";
  var $ = function (id) { return document.getElementById(id); };
  var token = "";

  function say(msg, kind) {
    var el = $("state");
    el.hidden = false;
    el.textContent = msg;
    el.className = "state" + (kind ? " " + kind : "");
  }

  function paint(d) {
    $("cur-model").textContent = d.model.effective || "not set";
    $("cur-model-src").textContent = d.model.from;
    $("cur-key").textContent = d.apiKey.preview || "not set";
    $("cur-key-src").textContent = d.apiKey.from;
    $("cur-when").textContent = d.updatedAt || "never";
    $("model").value = d.model.effective || "";
    $("panel").hidden = false;
  }

  async function call(method, body) {
    var res = await fetch(API, {
      method: method,
      headers: Object.assign({ "x-admin-token": token },
        body ? { "content-type": "application/json" } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
    var data = await res.json().catch(function () { return null; });
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || ("HTTP " + res.status));
    }
    return data;
  }

  $("load").onclick = async function () {
    token = $("token").value.trim();
    if (!token) return say("Enter the admin token first.", "bad");
    say("Loading…");
    try { paint(await call("GET")); say("Loaded.", "ok"); }
    catch (e) { $("panel").hidden = true; say(e.message, "bad"); }
  };

  /* /api/lab/health needs no token: it reports states and status codes only,
     never the key, the model ids, or the provider's own error text. */
  $("test").onclick = async function () {
    say("Testing…");
    $("probe").hidden = true;
    try {
      var res = await fetch("/api/lab/health", { headers: { accept: "application/json" } });
      var h = await res.json();
      $("probe").hidden = false;
      $("p-result").textContent = h.probe && h.probe.ok
        ? "working"
        : "failed — " + ((h.probe && h.probe.kind) || "unknown")
          + ((h.probe && h.probe.status) ? " (HTTP " + h.probe.status + ")" : "");
      /* answeredBy is the position in the fallback list that replied. Anything
         above 1 means the site is running on a backup — which looks identical
         to healthy from outside, right up until the last one runs out too. */
      var by = h.probe && h.probe.answeredBy;
      $("p-by").textContent = by
        ? (by === 1 ? "the first id" : "fallback #" + by + " — the ids before it did not answer")
        : "—";
      $("p-ms").textContent = h.probe && h.probe.ms != null ? h.probe.ms + " ms" : "—";
      $("p-hint").textContent = h.hint || "—";
      say(h.probe && h.probe.ok ? "Working." : "Not working — see below.",
          h.probe && h.probe.ok ? "ok" : "bad");
    } catch (e) {
      say("Could not reach /api/lab/health on this deployment.", "bad");
    }
  };

  $("save").onclick = async function () {
    var payload = { model: $("model").value };
    var key = $("key").value;
    // Only send the key when the field was touched, so saving a model change
    // never silently rewrites the credential.
    if (key !== "") payload.apiKey = key;
    say("Saving…");
    try {
      await call("PUT", payload);
      $("key").value = "";
      paint(await call("GET"));
      say("Saved. Checking it answers…", "ok");
      /* The reason anyone is on this page is that something stopped working,
         so prove the new setting before saying the job is done. */
      $("test").click();
    } catch (e) { say(e.message, "bad"); }
  };
</script>
</body>
</html>`;
