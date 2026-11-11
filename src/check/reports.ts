/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What a check leaves behind.
 *
 * Twenty reports, on the tablet, and nothing anywhere else. The share text is
 * written in English because a support desk reads it, and it carries codes,
 * readings and times — no customer, no product, no takings. Device Check
 * never opens those stores to begin with.
 */

import type { IssueCode } from "../pos/issues";
import type { Verdict } from "./standard";

const KEY = "coreos.check.reports.v1";
const KEEP = 20;

export interface Line {
  id: string;
  verdict: Verdict;
  reading: string;
  code?: IssueCode;
  because?: string;
}

export interface Report {
  at: string;
  tillId: string;
  shopName: string;
  device: string;
  /** The one to put on the ticket. */
  main?: IssueCode;
  lines: Line[];
}

export function saved(): Report[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Report[]) : [];
  } catch {
    return [];
  }
}

export function keep(report: Report): Report[] {
  const all = [report, ...saved()].slice(0, KEEP);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* A tablet too full to save a report is exactly the tablet this was run
       on to find out it is too full. Losing the record costs nothing: the
       result is on screen and the share button still works. */
  }
  return all;
}

/**
 * Which code goes on the ticket.
 *
 * The most serious failure wins, and P1 beats P2 beats P3 — a shop that
 * cannot sell does not want a note about its charger at the top of the
 * ticket. Warnings only reach the top when nothing has actually failed.
 */
export function mainCode(
  lines: Line[],
  priorityOf: (code: IssueCode) => "P1" | "P2" | "P3",
): IssueCode | undefined {
  const rank = { P1: 0, P2: 1, P3: 2 };
  const pick = (want: Verdict) =>
    lines
      .filter((line) => line.verdict === want && line.code)
      .map((line) => line.code as IssueCode)
      .sort((a, b) => rank[priorityOf(a)] - rank[priorityOf(b)])[0];
  return pick("fail") ?? pick("warn");
}

export function shareText(report: Report, nameOf: (id: string) => string): string {
  const lines = [
    "CoreOS Device Check",
    `Date:  ${report.at.replace("T", " ").slice(0, 19)}`,
    report.tillId ? `Till:  ${report.tillId}` : "Till:  not found on this tablet",
    report.shopName ? `Shop:  ${report.shopName}` : "",
    `Device: ${report.device}`,
    "",
    report.main ? `MAIN CODE: ${report.main}` : "MAIN CODE: none — nothing wrong found",
    "",
  ].filter(Boolean);

  for (const line of report.lines) {
    const mark =
      line.verdict === "pass"
        ? "OK  "
        : line.verdict === "warn"
          ? "WARN"
          : line.verdict === "fail"
            ? "FAIL"
            : "----";
    lines.push(
      `${mark} ${line.code ? line.code + " " : ""}${nameOf(line.id)}: ${line.verdict === "untested" ? "could not test" : line.reading}`,
    );
  }

  lines.push("", "No customer or sales information is included.");
  return lines.join("\n");
}
