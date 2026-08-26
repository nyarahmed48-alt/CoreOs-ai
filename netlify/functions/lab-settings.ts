/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify function backing /api/lab/settings — the API behind /admin.
 *
 * The logic is shared with the Cloudflare Worker in lab/settings.ts; only the
 * storage differs. See that file for the security posture, which is the part
 * worth reading before changing anything here.
 */

import { handleSettingsRequest } from "../../lab/settings";
import { settingsStore } from "../lib/store";

export default async function handler(request: Request): Promise<Response> {
  return handleSettingsRequest(request, {
    env: process.env as Record<string, string | undefined>,
    store: settingsStore(),
    adminToken: process.env.ADMIN_TOKEN,
    hostName: "Netlify",
  });
}
