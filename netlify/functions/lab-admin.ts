/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Serves /admin on Netlify. The page itself is shared with the Cloudflare
 * Worker — see lab/admin-page.ts.
 */

import { ADMIN_PAGE } from "../../lab/admin-page";

export default async function handler(): Promise<Response> {
  return new Response(ADMIN_PAGE, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
