/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The reports the shop has already made.
 *
 * Kept for one reason: a report sent on WhatsApp can be deleted, lost in a
 * phone that was replaced, or sent to the wrong chat in a hurry. The till is
 * the one copy that stays, so "what did we take on the 3rd" has an answer
 * that does not depend on anyone's phone.
 *
 * In localStorage rather than the books, because this is a record of
 * something we sent, not trade. A report that failed to save must never stop
 * a day from closing.
 */

import { scoped } from "./edition";
import { reportError } from "./reportIssue";
import type { Lang } from "./i18n";

const KEY = scoped("coreos.pos.dayreports.v1");
/** Ninety reports is a quarter of trading. Beyond that the day closes are in
    the books anyway, and the tablets these run on are small. */
const KEEP = 90;

export interface MadeReport {
  /** The trading day it covers, `2026-11-14`. */
  day: string;
  /** When it was made, which is not the same as the day when a shop closes
      after midnight. */
  at: string;
  lang: Lang;
  text: string;
  /** The figure an owner looks for first, kept apart from the text so the
      history list can show it without parsing a message back. */
  takings: number;
  sales: number;
  /** What became of it. A report that was only copied still happened. */
  sent: "opened" | "shared" | "copied" | "failed" | "not-sent";
}

let kept: MadeReport[] = read();
const listeners = new Set<() => void>();

function read(): MadeReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MadeReport[]) : [];
  } catch {
    /* Quiet: a shop whose browser storage is full or blocked still has a
       working till, and the history is the least of what it is missing. */
    return [];
  }
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    /* Drop the oldest half and try once more. A tablet that has filled its
       storage should lose old reports, not the one just made. */
    kept = kept.slice(0, Math.ceil(kept.length / 2));
    try {
      localStorage.setItem(KEY, JSON.stringify(kept));
    } catch {
      reportError("DT-09", "day report history could not be saved", {
        quiet: true,
        once: "dayreport-save",
      });
    }
  }
  for (const listener of listeners) listener();
}

export function subscribeReports(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function madeReports(): MadeReport[] {
  return kept;
}

/**
 * Write one down, newest first.
 *
 * A second report for the same day replaces the first rather than stacking:
 * an owner who presses the button twice because the first did not send wants
 * one line in the history, not two.
 */
export function rememberReport(report: MadeReport) {
  kept = [report, ...kept.filter((one) => one.day !== report.day)].slice(0, KEEP);
  write();
}

/** Used when a report is sent again later, so the history shows what finally
    happened rather than the first attempt. */
export function markSent(day: string, sent: MadeReport["sent"]) {
  const found = kept.find((one) => one.day === day);
  if (!found || found.sent === sent) return;
  found.sent = sent;
  write();
}
