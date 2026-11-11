/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Technician mode: what happens after a key is accepted.
 *
 * Three rules hold it together.
 *
 * **A key works once.** The tablet remembers every one-time number it has
 * honoured until that key's expiry has passed, across restarts. A key
 * photographed off a technician's phone is worth nothing afterwards.
 *
 * **But a session survives a reload.** These keys are one-time, and a
 * technician is usually here *because* the app is crashing — if a reload
 * ended the session they would need a fresh key every time the thing they
 * came to fix went wrong. So the session is written down and picked back up,
 * and it is the session that carries the clock, not the key.
 *
 * **The shop sees everything.** Opening and closing a session are both
 * written to the error log the owner can read, with the technician's name and
 * what the key unlocked. There is no mode here that hides from the shop; the
 * owner is the customer, not the subject.
 */

import { scoped } from "./edition";
import { recordError } from "./report";
import {
  readKey,
  type KeyVerdict,
  type Scope,
  type TechKey,
} from "./techkey";

const SPENT_KEY = scoped("coreos.pos.tech.spent.v1");
const SESSION_KEY = scoped("coreos.pos.tech.session.v1");

/** How long technician mode may sit untouched before it closes itself. A
    tablet left open on a counter with the technician gone is the thing this
    prevents. Settable so the test suite does not have to wait half an hour. */
let idleMs = 30 * 60 * 1000;

export function setIdleTimeout(ms: number) {
  idleMs = ms;
}

export function idleTimeout(): number {
  return idleMs;
}

export interface TechSession {
  technician: string;
  scopes: Scope[];
  till: string;
  startedAt: number;
  /** When the key itself runs out. */
  expires: number;
  /** Last tap. */
  lastSeen: number;
  nonce: string;
}

/* ------------------------------------------------------- the spent list */

type Spent = Record<string, number>;

function spentList(): Spent {
  try {
    const raw = localStorage.getItem(SPENT_KEY);
    return raw ? (JSON.parse(raw) as Spent) : {};
  } catch {
    /* A tablet that cannot remember which keys it has used cannot enforce
       one-time use. It still refuses forged and expired keys, which is most
       of the value, and the alternative — refusing every key — would lock a
       technician out of the tablet they were sent to repair. */
    return {};
  }
}

function keepSpent(list: Spent) {
  try {
    localStorage.setItem(SPENT_KEY, JSON.stringify(list));
  } catch {
    // See above.
  }
}

/** Forgets numbers whose keys have expired: after that they cannot be
    replayed anyway, and the list would otherwise grow for ever. */
function prune(list: Spent, now: number): Spent {
  const left: Spent = {};
  for (const [nonce, until] of Object.entries(list)) {
    if (until > now) left[nonce] = until;
  }
  return left;
}

export function wasSpent(nonce: string, now = Date.now()): boolean {
  const list = prune(spentList(), now);
  return nonce in list;
}

function spend(key: TechKey, now: number) {
  const list = prune(spentList(), now);
  list[key.nonce] = key.expires;
  keepSpent(list);
}

/* ----------------------------------------------------------- the session */

let current: TechSession | null = null;
const listeners = new Set<() => void>();

function publish(next: TechSession | null) {
  current = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // The session still works for as long as this page is open.
  }
  for (const listener of listeners) listener();
}

function restore(): TechSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as TechSession;
    const now = Date.now();
    if (session.expires <= now || now - session.lastSeen > idleMs) return null;
    return session;
  } catch {
    return null;
  }
}

current = restore();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function session(now = Date.now()): TechSession | null {
  if (!current) return null;
  if (current.expires <= now) {
    finish("expired");
    return null;
  }
  if (now - current.lastSeen > idleMs) {
    finish("idle");
    return null;
  }
  return current;
}

/** True when technician mode is open and this key allows that much. */
export function can(scope: Scope, now = Date.now()): boolean {
  return session(now)?.scopes.includes(scope) ?? false;
}

/** A tap. Keeps the session alive; costs nothing when it is closed.
 *
 * Throttled against the idle window rather than to a fixed number of seconds,
 * so it does not write to storage on every pixel of a drag, and so that a
 * shortened window — which is how this gets tested without waiting half an
 * hour — still behaves the way the real one does.
 */
export function touch(now = Date.now()) {
  if (!current) return;
  if (now - current.lastSeen < Math.max(1, idleMs / 60)) return;
  publish({ ...current, lastSeen: now });
}

export type EndReason = "ended" | "idle" | "expired";

export function finish(reason: EndReason) {
  const was = current;
  if (!was) return;
  publish(null);
  recordError(
    `technician session ${reason}: ${was.technician || "unnamed"} (${was.scopes.join(",") || "no scopes"}), opened ${new Date(was.startedAt).toISOString()}`,
  );
}

/**
 * Checks a key and, if it is good, opens technician mode.
 *
 * Spending the one-time number happens here rather than in the checker, so a
 * key refused for any other reason is not silently burnt — a technician whose
 * tablet clock is wrong should be able to use the same key again once it is
 * put right.
 */
export async function unlock(text: string, tillId: string): Promise<KeyVerdict> {
  const now = Date.now();
  const verdict = await readKey(text, tillId, (nonce) => wasSpent(nonce, now), now);
  if (!verdict.ok) return verdict;

  spend(verdict.key, now);
  publish({
    technician: verdict.key.technician,
    scopes: verdict.key.scopes,
    till: verdict.key.till,
    startedAt: now,
    expires: verdict.key.expires,
    lastSeen: now,
    nonce: verdict.key.nonce,
  });
  recordError(
    `technician session opened: ${verdict.key.technician || "unnamed"} (${verdict.key.scopes.join(",") || "no scopes"}), until ${new Date(verdict.key.expires).toISOString()}`,
  );
  return verdict;
}

/**
 * Watches the clock while the till is open.
 *
 * Checked rather than scheduled: a timer set for half an hour does not fire
 * on a tablet that was asleep for most of it, and "asleep on the counter" is
 * exactly when a forgotten session should be closing itself.
 */
export function watchSession(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const tick = () => void session();
  const timer = window.setInterval(tick, 15_000);
  const tap = () => touch();
  window.addEventListener("pointerdown", tap, { passive: true });
  window.addEventListener("keydown", tap, { passive: true });
  document.addEventListener("visibilitychange", tick);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("pointerdown", tap);
    window.removeEventListener("keydown", tap);
    document.removeEventListener("visibilitychange", tick);
  };
}
