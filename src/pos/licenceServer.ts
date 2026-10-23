/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checking in with the office.
 *
 * Codes typed by hand cover a till with no internet, and they always will —
 * that is most of the day in a lot of these shops. This is the other half: when
 * the tablet can reach the network, it asks the office whether it is still
 * allowed to sell, and the office can say no without anyone picking up a
 * phone.
 *
 * Three rules decide how it behaves, and they are the whole design:
 *
 * **A shop that cannot reach us keeps selling.** The connection drops
 * constantly; a till that stops when the wifi does is worse than no till. So
 * an unanswered check changes nothing.
 *
 * **But not for ever.** Each answer carries a grace period. If the tablet has
 * not heard anything for that many days it locks itself — otherwise pulling
 * the wifi out would be a way to keep a frozen till working.
 *
 * **The answer is cached.** A freeze sticks across restarts without the
 * network, and so does permission: a tablet told "yes, until Friday" keeps
 * that answer in its pocket.
 */

const CACHE_KEY = "coreos.pos.licence.v1";

/** Where the tills check in. Empty until the office has somewhere to run it,
    and the till falls back to typed codes alone — which is exactly how it
    behaves today. */
export const LICENCE_URL = "";

/** How often to ask while the till is open. A freeze lands within this. */
const POLL_MS = 60_000;

export interface Verdict {
  /** The office has stopped this tablet. */
  frozen: boolean;
  /** When permission runs out, if it does. */
  until: number | null;
  /** Days the tablet may go unanswered before it locks itself. */
  graceDays: number;
  /** When this answer arrived. */
  at: number;
  /** A line for the locked screen, written by the office. */
  message?: string;
}

export interface Known {
  verdict: Verdict | null;
  /** The last time the office answered at all, successfully. */
  lastSeen: number | null;
}

function read(): Known {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as Known;
  } catch {
    // A till that cannot remember an answer simply asks again.
  }
  return { verdict: null, lastSeen: null };
}

function write(known: Known) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(known));
  } catch {
    // See above.
  }
}

export type Standing =
  | { state: "fine" }
  | { state: "frozen"; message?: string }
  | { state: "lapsed" }
  /** Out of touch for longer than the grace allows. */
  | { state: "stale"; days: number };

/** What the cached answer means right now. Pure, so the gate and the licence
    panel read it the same way. */
export function standing(known: Known, now = Date.now()): Standing {
  const { verdict, lastSeen } = known;
  if (!verdict) return { state: "fine" };
  if (verdict.frozen) return { state: "frozen", message: verdict.message };
  if (verdict.until !== null && verdict.until <= now) return { state: "lapsed" };
  if (lastSeen !== null && verdict.graceDays > 0) {
    const days = Math.floor((now - lastSeen) / 86_400_000);
    if (days > verdict.graceDays) return { state: "stale", days };
  }
  return { state: "fine" };
}

/**
 * One check. Never throws, never blocks anything: a failure leaves the last
 * answer exactly as it was.
 */
export async function checkIn(tillId: string): Promise<Known> {
  const known = read();
  if (!LICENCE_URL) return known;

  try {
    const response = await fetch(
      `${LICENCE_URL}?till=${encodeURIComponent(tillId)}`,
      { method: "GET", cache: "no-store" },
    );
    if (!response.ok) return known;

    const body = (await response.json()) as Partial<Verdict>;
    const next: Known = {
      verdict: {
        frozen: Boolean(body.frozen),
        until: typeof body.until === "number" ? body.until : null,
        // A server that forgets to say falls back to a fortnight, which is
        // long enough to survive a bad month of connectivity.
        graceDays: typeof body.graceDays === "number" ? body.graceDays : 14,
        at: Date.now(),
        message: typeof body.message === "string" ? body.message : undefined,
      },
      lastSeen: Date.now(),
    };
    write(next);
    return next;
  } catch {
    // Offline, blocked, or the office is down. The shop carries on.
    return known;
  }
}

/** Starts the conversation and keeps it going while the till is open. */
export function watchLicence(
  tillId: string,
  onChange: (known: Known) => void,
): () => void {
  let stopped = false;

  async function tick() {
    const known = await checkIn(tillId);
    if (!stopped) onChange(known);
  }

  void tick();
  const timer = window.setInterval(() => void tick(), POLL_MS);
  // A tablet that has been asleep on a counter all night asks the moment it is
  // picked up, rather than waiting out the interval.
  const onWake = () => void tick();
  window.addEventListener("online", onWake);
  document.addEventListener("visibilitychange", onWake);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener("online", onWake);
    document.removeEventListener("visibilitychange", onWake);
  };
}

export function cached(): Known {
  return read();
}
