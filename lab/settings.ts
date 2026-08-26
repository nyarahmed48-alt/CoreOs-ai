/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Runtime settings: which model answers, and with which key.
 *
 * Two layers, stored winning over deployed:
 *
 *   1. Environment variables set in the host's dashboard. The baseline, and
 *      what a fresh deploy runs on.
 *   2. Values saved through /admin. These override the baseline and apply on
 *      the next request — no redeploy, no code change.
 *
 * Layer 2 is the point of this file. A model id going stale, or a key needing
 * to be swapped, should not require a developer.
 *
 * Storage differs per host — Cloudflare has KV, Netlify has Blobs — so it is
 * behind the SettingsStore interface below and everything else here is shared.
 * Both hosts speak Request/Response, so the handler is portable as written.
 *
 * Security posture, since this handles a credential:
 *   - No admin token configured means the endpoint is off entirely. An
 *     unconfigured deploy is never an open door.
 *   - No endpoint ever returns the stored key. Reads get the last four
 *     characters: enough to tell which key is loaded, useless to anyone else.
 *   - The token comparison does not short-circuit on the first wrong byte.
 */

import { settingsFromEnv, type EnvLike, type LabSettings } from "./agents";

export interface StoredSettings {
  apiKey?: string;
  model?: string;
  updatedAt?: string;
}

/** Whatever the host gives us to persist a small blob of JSON. */
export interface SettingsStore {
  read(): Promise<StoredSettings | null>;
  write(value: StoredSettings): Promise<void>;
}

/** The settings a request should run with: stored values over environment. */
export async function resolveSettings(
  env: EnvLike,
  store: SettingsStore | null,
): Promise<LabSettings> {
  const base = settingsFromEnv(env);
  if (!store) return base;

  let stored: StoredSettings | null = null;
  try {
    stored = await store.read();
  } catch (err) {
    /* A storage outage must never take the site down: fall back to the
       environment, which is the whole reason there are two layers. */
    console.error("Could not read stored settings; using environment:", err);
  }
  if (!stored) return base;

  return {
    ...base,
    // Only override where something was actually stored. An empty value means
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

export interface SettingsContext {
  env: EnvLike;
  store: SettingsStore | null;
  /** Unset disables the endpoint outright. */
  adminToken?: string;
  /** Named in error messages so each host points at its own dashboard. */
  hostName: string;
}

/**
 * GET  — what is in force right now, key masked.
 * PUT  — set model and/or key. An empty string clears the stored override and
 *        falls back to the environment variable.
 */
export async function handleSettingsRequest(
  request: Request,
  { env, store, adminToken, hostName }: SettingsContext,
): Promise<Response> {
  if (!adminToken) {
    return json(
      {
        error: "ADMIN_DISABLED",
        message: `No ADMIN_TOKEN is set on this deployment, so settings cannot be changed here. Add one in the ${hostName} dashboard as an environment variable, then redeploy.`,
      },
      503,
    );
  }

  if (!safeEqual(request.headers.get("x-admin-token") || "", adminToken)) {
    return json({ error: "UNAUTHORISED" }, 401);
  }

  if (!store) {
    return json(
      {
        error: "NO_STORAGE",
        message: `No settings storage is available on this deployment. Until there is, change OPENROUTER_MODEL and OPENROUTER_API_KEY as environment variables in ${hostName} instead.`,
      },
      503,
    );
  }

  const stored = (await store.read()) ?? {};
  const envSettings = settingsFromEnv(env);

  if (request.method === "GET") {
    const effective = await resolveSettings(env, store);
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
    await store.write(next);

    const effective = await resolveSettings(env, store);
    return json({
      saved: true,
      model: effective.model ?? null,
      apiKey: maskKey(effective.apiKey),
      updatedAt: next.updatedAt,
    });
  }

  return json({ error: "METHOD_NOT_ALLOWED" }, 405);
}
