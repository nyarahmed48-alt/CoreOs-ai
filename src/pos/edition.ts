/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Which CoreCashier this is.
 *
 * One codebase, three products, decided at build time:
 *
 * **offline** — the till a shop buys outright. Its books live on the tablet
 * and nowhere else, it is unlocked by a signed licence code, and it never
 * needs a network for anything.
 *
 * **demo** — the one to put in front of a shopkeeper. No licence, no
 * activation screen, sample stock already on the shelf, and a button to put
 * it all back for the next shop. Receipts are stamped so a demo can never
 * quietly become somebody's real till.
 *
 * **cloud** — the subscription. The shop signs in to a CoreOs account, the
 * books go up to the office, and the office can see them and stop a till
 * from a desk. It still works with the wifi out — a till that stops when the
 * connection does is worse than no till — but it has to have been signed in,
 * and it will not run as a free offline copy.
 *
 * Each edition keeps its own books. Two of these files on one tablet sharing
 * a database would mean a demo showing a shop its real takings, or worse,
 * writing over them.
 */

declare const __EDITION__: string;

export type Edition = "offline" | "demo" | "cloud";

function chosen(): Edition {
  const named = typeof __EDITION__ === "string" ? __EDITION__ : "offline";
  return named === "demo" || named === "cloud" ? named : "offline";
}

export const EDITION: Edition = chosen();

export const isDemo = EDITION === "demo";
export const isCloud = EDITION === "cloud";
export const isOffline = EDITION === "offline";

/**
 * The IndexedDB this edition reads and writes.
 *
 * The offline name is bare and must stay that way: every till already in a
 * shop has its books under it, and renaming it would look exactly like a
 * tablet that had lost a year of trade.
 */
export function databaseName(): string {
  return isOffline ? "corecashier" : `corecashier-${EDITION}`;
}

/** Keeps each edition's settings, licence and printer apart in localStorage
    for the same reason. */
export function scoped(key: string): string {
  return isOffline ? key : `${key}.${EDITION}`;
}
