/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Lang } from "./i18n";

/** Notes a customer actually hands over, largest first. Drives the quick
    tender buttons at checkout. */
export const IQD_NOTES = [50000, 25000, 10000, 5000, 1000, 500, 250];

/** How the dinar is written in each language. An Arabic counter does not read
    "IQD", and leaving a Latin currency mark in a right-to-left line also makes
    the browser reorder the two, so a price rendered beside Arabic came out as
    "IQD 250" rather than "250 د.ع". */
const CURRENCY: Record<Lang, string> = {
  en: "IQD",
  ar: "د.ع",
  ckb: "د.ع",
};

/** `12,750 د.ع`. Grouped so a cashier can read a five-figure total at a
    glance, which is the number that gets misread. Digits stay Latin in every
    language — see the note in i18n.ts. */
export function money(amount: number, lang: Lang = "en"): string {
  const sign = amount < 0 ? "-" : "";
  const digits = Math.abs(Math.round(amount)).toLocaleString("en-US");
  return `${sign}${digits} ${CURRENCY[lang]}`;
}

/** Digits only, for input fields and tight table cells. */
export function amount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Round to the nearest note the shop can actually make change with.
 *
 * Half rounds up, in the customer's favour on the change rather than the
 * shop's, because a cashier arguing over 125 dinars costs more than it saves.
 */
export function roundTotal(total: number, roundTo: number): number {
  if (roundTo <= 1) return Math.round(total);
  return Math.round(total / roundTo) * roundTo;
}

/** Reads a typed amount. Tolerates the separators people type by habit. */
export function parseAmount(text: string): number {
  const digits = text.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
