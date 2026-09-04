/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify's side of the settings store.
 *
 * The twin of worker/settings.ts. The logic both hosts share lives in
 * lab/settings.ts; this file is only the Blobs adapter.
 *
 * Netlify Blobs needs no setup on a deployed site — the credentials arrive on
 * the function's environment — but it is unavailable when the function is run
 * any other way, and getStore() throws rather than returning empty. That throw
 * must not reach the caller: a settings store that cannot be reached is the
 * documented fallback state, not an outage. So this returns null instead, the
 * site runs on its environment variables, and /admin says plainly that it can
 * read settings but not save them.
 */

import { getStore } from "@netlify/blobs";

import type { SettingsStore, StoredSettings } from "../../lab/settings";

const STORE = "coreos-lab";
const KEY = "lab-settings";

export function settingsStore(): SettingsStore | null {
  let store: ReturnType<typeof getStore>;
  try {
    store = getStore(STORE);
  } catch (err) {
    /* Not an error worth failing the request over — see above. */
    console.warn("Netlify Blobs is unavailable; falling back to environment variables:", err);
    return null;
  }

  return {
    async read(): Promise<StoredSettings | null> {
      const value = await store.get(KEY, { type: "json" });
      if (!value) return null;
      /* Blobs parses for us, but a hand-edited or half-written blob is still
         possible, and a malformed value must not take the site down. */
      if (typeof value !== "object") {
        console.error("Stored settings were not an object; ignoring them.");
        return null;
      }
      return value as StoredSettings;
    },
    async write(value: StoredSettings): Promise<void> {
      await store.setJSON(KEY, value);
    },
  };
}
