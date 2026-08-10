/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mints the GOOGLE_REFRESH_TOKEN the inbox responder needs.
 *
 *   node scripts/gmail-auth.mjs
 *
 * Run it once, on your own machine, with GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET already set (in .env.local or the shell). It opens
 * Google's consent screen, catches the redirect on localhost, and prints the
 * refresh token — which you then paste into your host's environment settings.
 *
 * The token is printed and never written to disk. Treat it like a password:
 * it grants full access to the mailbox until you revoke it at
 * https://myaccount.google.com/permissions.
 */

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/* Read .env.local the same way the app does, without pulling in dotenv for a
   one-shot script. */
for (const file of [".env.local", ".env"]) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(`
Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.

  1. https://console.cloud.google.com/ → create or pick a project
  2. APIs & Services → Library → enable "Gmail API"
  3. APIs & Services → OAuth consent screen → External, add yourself as a
     test user (the app does not need verifying for your own mailbox)
  4. Credentials → Create credentials → OAuth client ID → Desktop app
  5. Put the id and secret in .env.local, then run this again
`);
  process.exit(1);
}

const PORT = 5788;
const REDIRECT = `http://localhost:${PORT}`;
const SCOPE = "https://mail.google.com/";
const state = crypto.randomBytes(16).toString("hex");

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    // Without both of these Google hands back an access token only, and the
    // responder needs one that outlives the hour.
    access_type: "offline",
    prompt: "consent",
    state,
  });

const page = (title, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
     body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#05060a;color:#e7eaf6;
          display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
     div{max-width:420px;border:1px solid #1c2337;background:#0a0d16;border-radius:18px;padding:32px}
     h1{font-size:19px;margin:0 0 10px} p{margin:0;color:#a4abc4;font-size:14.5px;line-height:1.6}
   </style></head><body><div><h1>${title}</h1><p>${body}</p></div></body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== "/") {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error || !code) {
    res.writeHead(400, { "content-type": "text/html" }).end(page("Not authorised", error || "No code came back."));
    console.error(`\nGoogle returned: ${error || "no code"}`);
    server.close();
    process.exit(1);
  }

  if (url.searchParams.get("state") !== state) {
    res.writeHead(400, { "content-type": "text/html" }).end(page("State mismatch", "That response didn't match this request."));
    server.close();
    process.exit(1);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  const payload = await response.json();

  if (!response.ok || !payload.refresh_token) {
    res.writeHead(500, { "content-type": "text/html" }).end(page("Exchange failed", "Check the terminal."));
    console.error("\nToken exchange failed:", payload);
    console.error(
      payload.refresh_token === undefined && response.ok
        ? "\nGoogle returned an access token but no refresh token. That happens when the\nmailbox has already granted this client — revoke it at\nhttps://myaccount.google.com/permissions and run this again."
        : "",
    );
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "content-type": "text/html" }).end(page("Authorised", "The refresh token is in your terminal. You can close this tab."));

  console.log(`
─────────────────────────────────────────────────────────────
GOOGLE_REFRESH_TOKEN=${payload.refresh_token}
─────────────────────────────────────────────────────────────

Set that in your host's environment variables (Netlify: Site configuration →
Environment variables). Keep it secret — it grants full access to the mailbox
until revoked at https://myaccount.google.com/permissions.
`);
  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`
Open this in a browser, signed in as the mailbox you want answered:

${authUrl}

Waiting on http://localhost:${PORT} …
`);
});
