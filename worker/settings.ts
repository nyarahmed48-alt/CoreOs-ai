/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cloudflare's side of the settings store.
 *
 * The logic lives in lab/settings.ts and is shared with Netlify; this file is
 * only the KV adapter and the Worker's environment shape. If no namespace is
 * bound, settingsStore() returns null, the site falls back to environment
 * variables, and /admin says so rather than failing oddly.
 */

import type { SettingsStore, StoredSettings } from "../lab/settings";

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

const KEY = "lab-settings";

export function settingsStore(env: Env): SettingsStore | null {
  const kv = env.LAB_CONFIG;
  if (!kv) return null;

  return {
    async read(): Promise<StoredSettings | null> {
      const raw = await kv.get(KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StoredSettings;
      } catch {
        /* A malformed value must not take the site down. */
        console.error("Stored settings were not valid JSON; ignoring them.");
        return null;
      }
    },
    async write(value: StoredSettings): Promise<void> {
      await kv.put(KEY, JSON.stringify(value));
    },
  };
}
