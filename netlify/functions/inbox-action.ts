/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Backs the "Stop it" and "Send now" links in the notification email.
 *
 * These are opened from a mail client, often on a phone, so the response is a
 * small HTML page rather than JSON. The links carry an HMAC over the draft id
 * and the action — see signAction in lab/inbox.ts.
 */

import { actionPage, handleInboxAction } from "../../lab/inbox";

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" };

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  try {
    const outcome = await handleInboxAction(url.searchParams.get("id"), url.searchParams.get("do"), url.searchParams.get("t"));
    return new Response(actionPage(outcome), { status: outcome.status, headers: HTML_HEADERS });
  } catch (err: any) {
    console.error("Inbox action failed:", err?.message || err);
    return new Response(
      actionPage({ status: 500, title: "That didn't work", message: "Something went wrong. Open the draft in Gmail instead." }),
      { status: 500, headers: HTML_HEADERS },
    );
  }
}
