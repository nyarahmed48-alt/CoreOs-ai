/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The loaner tablet's one piece of bookkeeping: how long it has been out.
 *
 * A loaner asks for no licence, which is the right call — a shop whose till
 * is in for repair should not then be made to wait on a code. But a till with
 * no licence and no expiry is a till that quietly becomes permanent, and the
 * tablet that never comes back is a real cost rather than a theoretical one.
 *
 * So instead of a lock there is a date and a number. The day it first opened
 * is written down, the count is on screen, and after a fortnight it says so
 * across the top. Nothing stops working, ever — this is a reminder, not an
 * enforcement, because enforcing it would mean a shop in Karrada unable to
 * sell on the tablet we gave them to sell on.
 */

import { scoped } from "./edition";

const SINCE_KEY = scoped("coreos.pos.loaner.since.v1");

/** After this many days the banner appears. Long enough for an ordinary
    repair, short enough that a forgotten tablet surfaces. */
export const REMIND_AFTER_DAYS = 14;

/**
 * The day this tablet went out, written the first time it is opened.
 *
 * First run rather than a date someone types: the tablet is handed over and
 * switched on in the same few minutes, and a number nobody has to enter is a
 * number that is always right.
 */
export function onLoanSince(): number {
  try {
    const raw = localStorage.getItem(SINCE_KEY);
    if (raw) {
      const when = Number(raw);
      if (Number.isFinite(when) && when > 0) return when;
    }
    const now = Date.now();
    localStorage.setItem(SINCE_KEY, String(now));
    return now;
  } catch {
    /* Storage blocked. The till still works; only the count is lost, and a
       count is not worth a broken counter. */
    return Date.now();
  }
}

export function daysOut(now = Date.now()): number {
  return Math.max(0, Math.floor((now - onLoanSince()) / 86_400_000));
}

export function overdue(now = Date.now()): boolean {
  return daysOut(now) >= REMIND_AFTER_DAYS;
}

/** Starts the clock again, for the next shop. */
export function handedBack() {
  try {
    localStorage.removeItem(SINCE_KEY);
  } catch {
    // Nothing written, nothing to clear.
  }
}
