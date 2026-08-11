/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vercel entry point for the inbox responder's scan.
 *
 * Unlike Netlify there is no schedule declared in code here — Vercel takes
 * crons from vercel.json, where this path is registered. The pipeline is
 * shared with every other target; see lab/inbox.ts.
 *
 * Vercel's own cron calls arrive with an authorization header carrying
 * CRON_SECRET, so that is accepted alongside the responder's own secret.
 */

import { authorizeScan, runInboxScan } from "../../lab/inbox";

export default async function handler(req: any, res: any) {
  const presented =
    req.headers["x-inbox-secret"] ||
    (typeof req.headers.authorization === "string" ? req.headers.authorization.replace(/^Bearer\s+/i, "") : "") ||
    req.query?.secret;

  if (!authorizeScan(Array.isArray(presented) ? presented[0] : presented)) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const report = await runInboxScan();
    if (report.ran) {
      console.log(
        `Inbox scan: examined ${report.examined}, drafted ${report.drafted}, sent ${report.sent}, escalated ${report.escalated}, ignored ${report.ignored}`,
      );
    } else {
      console.log(`Inbox scan skipped — ${report.reason}`);
    }
    return res.status(200).json(report);
  } catch (err: any) {
    console.error("Inbox scan failed:", err?.message || err);
    return res.status(500).json({ error: "SCAN_FAILED", message: err?.message || "unknown error" });
  }
}
