/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vercel entry point for the "Stop it" / "Send now" links in the notification
 * email. Answers with a page rather than JSON — these are opened in a browser.
 */

import { actionPage, handleInboxAction } from "../../lab/inbox";

export default async function handler(req: any, res: any) {
  const { id, do: action, t } = req.query || {};
  const first = (value: any) => (Array.isArray(value) ? value[0] : value);

  try {
    const outcome = await handleInboxAction(first(id), first(action), first(t));
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    return res.status(outcome.status).send(actionPage(outcome));
  } catch (err: any) {
    console.error("Inbox action failed:", err?.message || err);
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res
      .status(500)
      .send(actionPage({ status: 500, title: "That didn't work", message: "Something went wrong. Open the draft in Gmail instead." }));
  }
}
