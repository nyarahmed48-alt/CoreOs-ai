/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify function backing /api/lab/settings — read and change which model and
 * key the sandbox runs on, without a deploy.
 *
 * The handler itself is in lab/settings.ts and is shared with the Worker. Both
 * hosts speak Request/Response, so only the store and the dashboard's name
 * differ. Everything that matters — the token check that does not short-circuit
 * on the first wrong byte, never returning the stored key, refusing outright
 * when no ADMIN_TOKEN is set — is in that one file and cannot drift between
 * hosts.
 */

import { handleSettingsRequest } from "../../lab/settings";
import { settingsStore } from "../lib/settings-store";
import { withDeadline } from "../lib/deadline";

export default async function handler(request: Request): Promise<Response> {
  return withDeadline(
    () =>
      handleSettingsRequest(request, {
        env: process.env as Record<string, string | undefined>,
        store: settingsStore(),
        adminToken: process.env.ADMIN_TOKEN,
        hostName: "Netlify",
      }),
    () =>
      new Response(
        JSON.stringify({
          error: "FUNCTION_TIMEOUT",
          message: "The settings store did not answer in time. Nothing was changed.",
        }),
        { status: 504, headers: { "content-type": "application/json", "cache-control": "no-store" } },
      ),
  );
}
