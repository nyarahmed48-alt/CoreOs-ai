/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GET /api/inbox/status — what the responder thinks it is configured to do.
 *
 * The Express server has had this route since the start; Netlify did not, so
 * the URL answered with the site's 404 page and looked like a failed deploy
 * rather than a missing function. This is the same handler over the other
 * transport.
 *
 * It reports configuration and counts, never message content, so it is safe to
 * leave open — but it does confirm which mailbox is connected, so it stays
 * boring on purpose.
 */

import { inboxStatus } from "../../lab/inbox";

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { ...JSON_HEADERS, allow: "GET" },
    });
  }

  try {
    return new Response(JSON.stringify(await inboxStatus(), null, 2), { status: 200, headers: JSON_HEADERS });
  } catch (err: any) {
    // A mailbox that will not connect is the most likely cause, and the
    // message says which — surface it rather than a bare 500, since this
    // endpoint exists to diagnose exactly that.
    console.error("Inbox status failed:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "STATUS_FAILED", message: String(err?.message || err) }, null, 2),
      { status: 500, headers: JSON_HEADERS },
    );
  }
}
