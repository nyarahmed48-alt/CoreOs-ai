/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Vercel entry point for GET /api/inbox/status. See lab/inbox.ts. */

import { inboxStatus } from "../../lab/inbox";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    res.setHeader("cache-control", "no-store");
    return res.status(200).json(await inboxStatus());
  } catch (err: any) {
    console.error("Inbox status failed:", err?.message || err);
    return res.status(500).json({ error: "STATUS_FAILED", message: String(err?.message || err) });
  }
}
