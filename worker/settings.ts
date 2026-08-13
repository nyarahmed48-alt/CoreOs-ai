/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Where the OpenRouter key and model actually come from at request time, and
 * the admin endpoint for changing them.
 *
 * Two layers, stored winning over deployed:
 *
 *   1. Environment variables set in the Cloudflare dashboard. These are the
 *      baseline and survive everything.
 *   2. Values stored in KV, set through /admin. These override the baseline
 *      and take effect on the next request — no redeploy, no code change.
 *
 * Layer 2 exists because a model id going stale should not need a developer.
 * Layer 1 stays because a deployment must still work with no KV at all: if the
 * namespace is not bound, everything below degrades to reading the environment
 * and the admin endpoint says so plainly rather than failing oddly.
 *
 * Security posture, since this handles a credential:
 *   - No ADMIN_TOKEN configured means the admin endpoint is switched off
 *     entirely. An unconfigured deploy is never an open door.
 *   - The stored key is never returned by any endpoint. Reads get the last
 *     four characters so you can tell which key is loaded, nothing more.
 *   - The token comparison does not short-circuit on the first wrong byte.
 */

import { settingsFromEnv, type LabSettings } from "../lab/agents";

export interface Env {
  /** Static assets binding — the built SPA. */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  /** Optional. Runtime settings live here; without it, env vars are used. */
  LAB_CONFIG?: KVNamespace;
  /** Required to enable /admin. Unset means the admin endpoint is disabled. */
  ADMIN_TOKEN?: string;

  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_BASE_URL?: string;
  OPENROUTER_SITE_URL?: string;
}

/** Minimal shape of the KV binding, so this file needs no extra type package. */
export interface KVNamespace {
  get(key: string, type?: "text"): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

const KV_KEY = "lab-settings";

interface StoredSettings {
  apiKey?: string;
  model?: string;
  updatedAt?: string;
}

async function readStored(env: Env): Promise<StoredSettings> {
  if (!env.LAB_CONFIG) return {};
  try {
    const raw = await env.LAB_CONFIG.get(KV_KEY);
    return raw ? (JSON.parse(raw) as StoredSettings) : {};
  } catch (err) {
    /* Never let a malformed stored value take the site down — fall back to the
       environment, which is the whole reason the two layers exist. */
    console.error("Could not read stored settings; using environment:", err);
    return {};
  }
}

/** The settings this request should run with. */
export async function resolveSettings(env: Env): Promise<LabSettings> {
  const base = settingsFromEnv(env as unknown as Record<string, string | undefined>);
  const stored = await readStored(env);
  return {
    ...base,
    // Only override where something was actually stored. An empty string means
    // "cleared", which should fall back rather than blank out the baseline.
    ...(stored.apiKey ? { apiKey: stored.apiKey } : {}),
    ...(stored.model ? { model: stored.model } : {}),
  };
}

/** Comparison that does not leak which byte differed via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Last four characters, so a reader can identify a key without learning it. */
const maskKey = (key?: string) =>
  key ? `${"•".repeat(Math.max(0, Math.min(8, key.length - 4)))}${key.slice(-4)}` : null;

/**
 * GET  /api/lab/settings — what is currently in force, key masked.
 * PUT  /api/lab/settings — set model and/or key. Empty string clears the
 *      stored override and falls back to the environment variable.
 */
export async function handleSettings(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_TOKEN) {
    return json(
      {
        error: "ADMIN_DISABLED",
        message:
          "No ADMIN_TOKEN is set on this deployment, so settings cannot be changed here. Add one in the Cloudflare dashboard under Settings → Variables and Secrets, then redeploy.",
      },
      503,
    );
  }

  const supplied = request.headers.get("x-admin-token") || "";
  if (!safeEqual(supplied, env.ADMIN_TOKEN)) {
    return json({ error: "UNAUTHORISED" }, 401);
  }

  if (!env.LAB_CONFIG) {
    return json(
      {
        error: "NO_STORAGE",
        message:
          "No KV namespace is bound as LAB_CONFIG, so there is nowhere to save settings. Until one is bound, change OPENROUTER_MODEL and OPENROUTER_API_KEY as environment variables instead.",
      },
      503,
    );
  }

  const stored = await readStored(env);
  const envSettings = settingsFromEnv(env as unknown as Record<string, string | undefined>);

  if (request.method === "GET") {
    const effective = await resolveSettings(env);
    return json({
      model: {
        effective: effective.model ?? null,
        from: stored.model ? "stored" : envSettings.model ? "environment" : "unset",
      },
      apiKey: {
        // Never the key itself, on any code path.
        preview: maskKey(effective.apiKey),
        from: stored.apiKey ? "stored" : envSettings.apiKey ? "environment" : "unset",
      },
      updatedAt: stored.updatedAt ?? null,
    });
  }

  if (request.method === "PUT") {
    let body: { model?: unknown; apiKey?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "BAD_JSON" }, 400);
    }

    const next: StoredSettings = { ...stored };

    if (typeof body.model === "string") {
      const model = body.model.trim();
      if (model) next.model = model;
      else delete next.model;
    }
    if (typeof body.apiKey === "string") {
      const apiKey = body.apiKey.trim();
      if (apiKey) next.apiKey = apiKey;
      else delete next.apiKey;
    }

    next.updatedAt = new Date().toISOString();
    await env.LAB_CONFIG.put(KV_KEY, JSON.stringify(next));

    const effective = await resolveSettings(env);
    return json({
      saved: true,
      model: effective.model ?? null,
      apiKey: maskKey(effective.apiKey),
      updatedAt: next.updatedAt,
    });
  }

  return json({ error: "METHOD_NOT_ALLOWED" }, 405);
}
