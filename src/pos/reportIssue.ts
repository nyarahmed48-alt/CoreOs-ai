/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `reportError` — the one way anything in the till reports a problem.
 *
 * Before this, trouble came out as a dozen different `setError` calls with a
 * sentence each, and a shop on the phone could only say "it says something in
 * red". Now every one of them names a code, the code goes on the screen and
 * into the log, and the call starts with "SW-06" instead of ten minutes of
 * guessing.
 *
 * Three rules:
 *
 * **It never throws.** Reporting a problem must not become one. Everything in
 * here is wrapped, including the logging.
 *
 * **It never blocks a sale.** The card is shown over the top of whatever is
 * on screen; the basket underneath is untouched and the cashier can close the
 * card and carry on.
 *
 * **It never records trade.** Details are for the support desk: codes, counts
 * and states, no customer and no money. The log scrubs what reaches it, but
 * the call site is where this is actually decided.
 */

import { buildStamp, pushLog } from "./report";
import { ISSUES, type IssueCode } from "./issues";

export interface Shown {
  code: IssueCode;
  /** Technician-only. Not on the owner's card. */
  details: string;
  at: number;
}

let showing: Shown | null = null;
const listeners = new Set<() => void>();

function publish(next: Shown | null) {
  showing = next;
  for (const listener of listeners) listener();
}

export function subscribeShown(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function currentIssue(): Shown | null {
  return showing;
}

export function dismissIssue() {
  publish(null);
}

/** Which tablet this is. Read lazily: the store is not up when the first
    error can already have happened. */
let tillId = "";
export function stampTill(id: string) {
  tillId = id;
}

/* Some things happen on every render or every frame — a missing translation
   key, an offline sync — and must be logged once, not a thousand times. */
const seenOnce = new Set<string>();

export interface ReportOptions {
  /** Log it, but do not put a card in front of the shop. For things the shop
      can do nothing about, or that are not their problem. */
  quiet?: boolean;
  /** Report this at most once per key, for the life of the page. */
  once?: string;
}

/**
 * Reports a problem under a CoreOS issue code.
 *
 * `details` is for the support desk and the technician: what actually
 * happened, in English, with no customer and no money in it.
 */
export function reportError(
  code: IssueCode,
  details = "",
  options: ReportOptions = {},
): void {
  try {
    if (options.once) {
      const key = `${code}:${options.once}`;
      if (seenOnce.has(key)) return;
      seenOnce.add(key);
    }

    pushLog({
      code,
      what: details || ISSUES[code].note,
      build: buildStamp(),
      till: tillId,
      device:
        typeof navigator === "undefined" ? "" : navigator.userAgent.slice(0, 120),
    });

    if (options.quiet) return;
    /* A second problem while one is already on screen does not replace it:
       the first is usually the cause and the one worth reading out. */
    if (showing) return;
    publish({ code, details, at: Date.now() });
  } catch {
    // See above: reporting a problem must never become one.
  }
}

/** Wraps something that might throw, reports it, and carries on. */
export function guard<T>(code: IssueCode, work: () => T, fallback: T): T {
  try {
    return work();
  } catch (cause) {
    reportError(code, cause instanceof Error ? cause.message : String(cause));
    return fallback;
  }
}

/**
 * Catches what the shop would otherwise have to describe: a crash, or a
 * promise that failed with nobody watching.
 *
 * Both come out as SW-01, which is the honest answer — at this level there is
 * nothing to say beyond "the till stopped". Anything that knows better
 * reports its own code before it gets here.
 */
export function watchForCrashes() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (event) => {
    reportError(
      "SW-01",
      `${event.message} (${event.filename ?? "?"}:${event.lineno ?? 0})`,
    );
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as unknown;
    reportError(
      "SW-01",
      `unhandled: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
  });
}
