/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Runs one inbox cycle from the terminal and prints what it did.
 *
 *   npm run inbox:scan
 *
 * Useful for the first run, when you want to watch it decide rather than find
 * out from your Sent folder. Pair it with INBOX_AUTOSEND=false in .env.local
 * to see the drafts and notifications without anything leaving the mailbox.
 */

import dotenv from "dotenv";
import { inboxSettings, inboxReadiness, runInboxScan } from "../lab/inbox";
import { closeMailbox, describeBackend } from "../lab/mailbox";

dotenv.config({ path: ".env.local" });
dotenv.config();

const ICONS: Record<string, string> = {
  drafted: "✎",
  sent: "→",
  escalated: "⚑",
  ignored: "·",
  skipped: "–",
  failed: "✗",
};

async function main() {
  const readiness = inboxReadiness();
  if (!readiness.ready) {
    console.error(`The responder isn't configured yet. Missing:\n  ${readiness.missing.join("\n  ")}`);
    console.error("\nSee README → The inbox responder.");
    process.exit(1);
  }

  const settings = inboxSettings();
  console.log(
    `Scanning via ${describeBackend()} — autosend ${settings.autoSend ? `on, ${settings.holdMinutes}m hold` : "OFF (drafts only)"}, ` +
      `cap ${settings.maxPerDay}/day, looking back ${settings.lookbackDays}d\n`,
  );

  const report = await runInboxScan();

  for (const outcome of report.outcomes) {
    const who = outcome.from ? `${outcome.from} — ` : "";
    console.log(`  ${ICONS[outcome.action] || "?"} ${outcome.action.padEnd(9)} ${who}${outcome.subject}`);
    console.log(`      ${outcome.detail}`);
  }
  if (!report.outcomes.length) console.log("  (nothing to do)");

  console.log(
    `\nExamined ${report.examined} · drafted ${report.drafted} · sent ${report.sent} · ` +
      `for you ${report.escalated} · ignored ${report.ignored}`,
  );
}

main()
  .then(() => closeMailbox())
  .catch(async (err) => {
    console.error("Scan failed:", err?.message || err);
    await closeMailbox().catch(() => undefined);
    process.exit(1);
  });
