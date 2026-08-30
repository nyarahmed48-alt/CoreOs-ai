/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify function backing GET /api/lab/health (see the redirect in
 * netlify.toml).
 *
 * When the sandbox goes quiet, this is the URL to open. It makes one real call
 * through the same code path the agents use and reports why it failed, so a
 * dead key, an exhausted free tier, a retired model id and a slow model are
 * told apart from a browser instead of guessed at from a screenshot.
 *
 * Safe to leave public: it returns states, status codes and counts. Never the
 * key, never the model ids, never a provider error string.
 */

import { checkLabHealth, settingsFromProcess } from "../../lab/agents";
import { withDeadline } from "../lib/deadline";

/* Bumped whenever this function changes, so the running build can be
   identified from its own output instead of guessed at. */
const BUILD = "pr-26";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "content-type": "application/json", allow: "GET" },
    });
  }

  return withDeadline(
    async () => {
      const health = await checkLabHealth(settingsFromProcess());
      return new Response(JSON.stringify({ build: BUILD, ...health }, null, 2), {
        // A cached health check is a lie, so make that explicit to every hop.
        status: health.probe.ok ? 200 : 503,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      });
    },
    () =>
      new Response(
        JSON.stringify(
          {
            build: BUILD,
            error: "FUNCTION_TIMEOUT",
            hint: "The health probe itself hung. That points at the network path to the provider rather than the key or the model.",
          },
          null,
          2,
        ),
        { status: 504, headers: { "content-type": "application/json", "cache-control": "no-store" } },
      ),
  );
}
