/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The scheduled half of the inbox responder on Netlify.
 *
 * `config.schedule` below is what makes this run on its own — Netlify reads it
 * at deploy time and registers the cron. Scheduled invocations arrive with no
 * HTTP caller, which is why the secret check only applies to requests that
 * come in over the network (a manual poke, or an external cron service).
 *
 * The pipeline itself is shared with every other deployment target — see
 * lab/inbox.ts.
 */

import { authorizeScan, runInboxScan } from "../../lab/inbox";

const JSON_HEADERS = { "content-type": "application/json" };

export default async function handler(request: Request): Promise<Response> {
  // Netlify invokes scheduled functions with a JSON body carrying next_run and
  // no user agent of its own. Anything with a query string or a secret header
  // is someone calling it by hand, and has to prove it.
  const url = new URL(request.url);
  const presented = request.headers.get("x-inbox-secret") || url.searchParams.get("secret");
  const scheduled = request.headers.get("x-nf-event") === "schedule";

  if (!scheduled && !authorizeScan(presented)) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401, headers: JSON_HEADERS });
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
    return new Response(JSON.stringify(report), { status: 200, headers: JSON_HEADERS });
  } catch (err: any) {
    console.error("Inbox scan failed:", err?.message || err);
    return new Response(JSON.stringify({ error: "SCAN_FAILED", message: err?.message || "unknown error" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

/* Every 10 minutes. The hold window (INBOX_HOLD_MINUTES, 20 by default) is
   what decides how long you get to intervene; this only decides how quickly a
   new enquiry is noticed. Netlify's minimum is one minute. */
export const config = {
  schedule: "*/10 * * * *",
};
