/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify function backing GET /api/lab/agents — the public roster.
 *
 * Slugs and display names, and nothing else. The codename → engine mapping and
 * the system instructions stay in LAB_ENGINES and are never serialised, because
 * a familiar model badge biases a tester's judgement of the answer, which is
 * the whole point of publishing under codenames.
 *
 * `live` says whether a provider is actually configured, so the console can
 * show the Test buttons as switched off rather than letting every one of them
 * fail the same way once pressed.
 */

import { isConfigured, publicAgentList } from "../../lab/agents";
import { resolveSettings } from "../../lab/settings";
import { settingsStore } from "../lib/settings-store";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "content-type": "application/json", allow: "GET" },
    });
  }

  const settings = await resolveSettings(
    process.env as Record<string, string | undefined>,
    settingsStore(),
  );

  return new Response(JSON.stringify({ agents: publicAgentList(), live: isConfigured(settings) }), {
    headers: {
      "content-type": "application/json",
      /* Whether the sandbox is live changes the moment someone saves a key at
         /admin, so this must not be served from a cache. */
      "cache-control": "no-store",
    },
  });
}
