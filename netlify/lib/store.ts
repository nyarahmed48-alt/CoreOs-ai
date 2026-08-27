/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify's side of the settings store, backed by Netlify Blobs.
 *
 * Blobs is loaded with a dynamic import inside a try/catch rather than at the
 * top of the file, and that is deliberate. A top-level import that fails to
 * resolve takes the whole function down before any of its own code runs — so a
 * problem with optional storage would break /api/lab/health, which is the one
 * endpoint that has to keep working precisely when something else is wrong.
 *
 * Every failure here degrades to "no storage": the caller falls back to
 * environment variables and /admin says it cannot save. A settings page that
 * cannot save is a far better outcome than a site that cannot answer.
 */

import type { SettingsStore, StoredSettings } from "../../lab/settings";

const STORE_NAME = "coreos-lab";
const KEY = "settings";

/** Resolve the Blobs store, or null if it is unavailable for any reason. */
async function blobs(): Promise<{
  get: (key: string, opts: { type: "text" }) => Promise<string | null>;
  set: (key: string, value: string) => Promise<unknown>;
} | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore(STORE_NAME) as never;
  } catch (err) {
    console.error("Netlify Blobs unavailable; using environment variables:", err);
    return null;
  }
}

export function settingsStore(): SettingsStore {
  return {
    async read(): Promise<StoredSettings | null> {
      const store = await blobs();
      if (!store) return null;
      try {
        const raw = await store.get(KEY, { type: "text" });
        return raw ? (JSON.parse(raw) as StoredSettings) : null;
      } catch (err) {
        /* Missing, unreadable or malformed all mean the same thing to the
           caller: nothing stored, use the environment. */
        console.error("Could not read stored settings:", err);
        return null;
      }
    },
    async write(value: StoredSettings): Promise<void> {
      const store = await blobs();
      // Surfaces as a clear failure in /admin rather than a silent no-op that
      // looks like it saved.
      if (!store) throw new Error("Netlify Blobs is not available on this deployment.");
      await store.set(KEY, JSON.stringify(value));
    },
  };
}
