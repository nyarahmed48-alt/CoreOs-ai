/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cloudflare Worker entry point — the whole site.
 *
 * Replaces what Netlify did with two functions plus a redirects file. Static
 * assets are served by the ASSETS binding; everything under /api and /admin is
 * handled here. The agent logic itself is unchanged and still lives in
 * lab/agents.ts, shared with the Express server used for local development.
 *
 * Note the run_worker_first list in wrangler.toml. Without it, typing an API
 * URL into the address bar is a navigation request, and Cloudflare would serve
 * the SPA shell instead of running this Worker — which is exactly how
 * /api/lab/health returned a 404 page on Netlify.
 */

import {
  checkLabHealth,
  handleLabChat,
  isConfigured,
  publicAgentList,
} from "../lab/agents";
import { ADMIN_PAGE } from "../lab/admin-page";
import { handleSettingsRequest, resolveSettings } from "../lab/settings";
import { settingsStore, type Env } from "./settings";

const JSON_HEADERS = { "content-type": "application/json" };

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  /* ---------------------------------------------------------- the roster */
  if (url.pathname === "/api/lab/agents") {
    const settings = await resolveSettings(env as any, settingsStore(env));
    return json({ agents: publicAgentList(), live: isConfigured(settings) });
  }

  /* ------------------------------------------------------------- health */
  if (url.pathname === "/api/lab/health") {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "METHOD_NOT_ALLOWED" }, 405, { allow: "GET" });
    }
    const health = await checkLabHealth(await resolveSettings(env as any, settingsStore(env)));
    return json(health, health.probe.ok ? 200 : 503, { "cache-control": "no-store" });
  }

  /* ----------------------------------------------------------- settings */
  if (url.pathname === "/api/lab/settings") {
    return handleSettingsRequest(request, {
      env: env as any,
      store: settingsStore(env),
      adminToken: env.ADMIN_TOKEN,
      hostName: "Cloudflare",
    });
  }

  /* --------------------------------------------------------------- chat */
  if (url.pathname === "/api/lab/chat") {
    if (request.method !== "POST") {
      return json({ error: "METHOD_NOT_ALLOWED" }, 405, { allow: "POST" });
    }

    let payload: any;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "BAD_JSON", message: "Could not read that request." }, 400);
    }

    const { slug, message, history, lang } = payload ?? {};
    const { status, body } = await handleLabChat({
      slug,
      message,
      history,
      lang,
      settings: await resolveSettings(env as any, settingsStore(env)),
    });
    return json(body, status);
  }

  /* An unknown /api path must not fall through to the SPA. Returning JSON
     keeps the console's content-type check meaningful. */
  return json({ error: "NOT_FOUND" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      return new Response(ADMIN_PAGE, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }

    // Everything else is the site itself, including the SPA fallback.
    return env.ASSETS.fetch(request);
  },
};
