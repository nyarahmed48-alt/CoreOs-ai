/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify's side of the settings store.
 *
 * Netlify Blobs is the counterpart to Cloudflare's KV: it needs no dashboard
 * setup and is available to functions automatically, which is the whole reason
 * the admin page can work here without any account configuration beyond one
 * environment variable.
 *
 * If Blobs is unavailable for any reason, this returns null rather than
 * throwing. The caller treats that as "no storage", falls back to environment
 * variables, and says so — a settings page that cannot save is a much better
 * outcome than a site that cannot answer.
 */

import { getStore } from "@netlify/blobs";
import type { SettingsStore, StoredSettings } from "../../lab/settings";

const STORE_NAME = "coreos-lab";
const KEY = "settings";

export function settingsStore(): SettingsStore | null {
  let store: ReturnType<typeof getStore>;
  try {
    store = getStore(STORE_NAME);
  } catch (err) {
    console.error("Netlify Blobs unavailable; falling back to env vars:", err);
    return null;
  }

  return {
    async read(): Promise<StoredSettings | null> {
      const raw = await store.get(KEY, { type: "text" });
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
      await store.set(KEY, JSON.stringify(value));
    },
  };
}
