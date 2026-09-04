/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Netlify function backing /admin.
 *
 * The page itself is lab/admin-page.ts, shared with the Worker. It is a static
 * string with no build step behind it, which is the point: /admin is what you
 * open when the model has gone dark, and it should not depend on the site
 * build being healthy at that moment.
 *
 * No token check here. The page is inert markup — it holds no settings and can
 * read none. Everything it can actually do goes through /api/lab/settings,
 * which refuses without ADMIN_TOKEN. Gating the HTML as well would only mean
 * two places to get the check right.
 */

import { ADMIN_PAGE } from "../../lab/admin-page";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "content-type": "application/json", allow: "GET" },
    });
  }

  return new Response(ADMIN_PAGE, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
