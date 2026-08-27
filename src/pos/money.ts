/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Notes a customer actually hands over, largest first. Drives the quick
    tender buttons at checkout. */
export const IQD_NOTES = [50000, 25000, 10000, 5000, 1000, 500, 250];

/** `12,750 IQD`. Grouped so a cashier can read a five-figure total at a
    glance, which is the number that gets misread. */
export function money(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(amount)).toLocaleString("en-US")} IQD`;
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
