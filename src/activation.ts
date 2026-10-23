/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Letting a tablet start selling, and taking that permission away again.
 *
 * A till arrives locked. It shows a request code; the shop sends that code to
 * the office — by WhatsApp, or read down a phone line — and gets back an
 * unlock code that only the office can produce. The till checks the code
 * against the request it made and starts working, until the day the code says
 * it stops.
 *
 * This is how offline licence activation has always worked, and it is the only
 * shape that fits here: the till has no server to ask, and often no internet
 * either. The person carrying the message is the network.
 *
 * Be clear about the strength. The secret below is compiled into both the till
 * and the office app, so anyone willing to pull apart the file can extract it
 * and mint their own codes. It stops a shop copying the till onto a second
 * tablet, or carrying on after they stop paying; it does not stop a determined
 * engineer. Real enforcement needs the server that is not built yet, and this
 * is deliberately the same shape, so the same codes can be issued from it
 * later.
 */

/** Characters that survive being read down a bad phone line: no vowels to form
    words, no 0/O, no 1/I. */
const ALPHABET = "ACDEFGHJKLMNPQRTUVWXY349";

const SECRET = "coreos-activation-2026-till";

export type Duration = 0 | 7 | 30 | 90 | 365;

/**
 * What a code does when it is typed in.
 *
 * `grant` opens the till for a while. `freeze` shuts it immediately and takes
 * the current request with it, so the only way back is a new code from the
 * office. A freeze needs the shop to type it, which makes it a tool for
 * handing a tablet back, moving a licence to a new one, or a shop that accepts
 * it is over — not a weapon against one that refuses to cooperate. Nothing
 * reaches a tablet that does not want to be reached without a server.
 */
export type Verdict =
  | { kind: "grant"; until: number | null }
  | { kind: "freeze" };

function fold(bytes: Uint8Array, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i % bytes.length] % ALPHABET.length];
  }
  return out;
}

async function digest(text: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(text);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  }
  // An old WebView with no subtle crypto still has to be able to activate.
  let hash = 2166136261;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    hash = Math.imul(hash ^ data[i], 16777619) >>> 0;
    bytes[i % 32] ^= hash & 0xff;
  }
  return bytes;
}

export function randomPart(length: number): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return fold(bytes, length);
}

/** `3NR-LET-7K2Q` — the till's own name, plus a part that changes every time
    it asks, so yesterday's unlock code cannot be used again. */
export function requestCode(tillId: string, nonce: string): string {
  return `${tillId}-${nonce}`;
}

/**
 * The till's own name, out of whichever code someone has to hand.
 *
 * Two numbers live on a till and they look alike: the till number (`3NR-LET`),
 * which is on the help screen and on every support report, and the licence
 * code (`3NR-LET-7K2Q`), which is the till number plus a part that rotates.
 * Whoever is on the phone will read out whichever they are looking at, so
 * anything that only needs the till number takes either.
 */
export function tillPart(code: string): string {
  const parts = code.trim().toUpperCase().split("-").filter(Boolean);
  return parts.slice(0, 2).join("-");
}

async function proof(request: string, scope: string): Promise<string> {
  const bytes = await digest(`${SECRET}|${request.trim().toUpperCase()}|${scope}`);
  const body = fold(bytes, 8);
  return `${body.slice(0, 4)}-${body.slice(4)}`;
}

/** `30-XKM4-PQ7A`: how many days it buys, then the proof. */
export async function unlockCode(
  request: string,
  days: Duration,
): Promise<string> {
  return `${days}-${await proof(request, String(days))}`;
}

/**
 * `F-XKM4-PQ7A`: shuts this one tablet, now.
 *
 * Made from the till number alone, not the rotating licence code. A shop being
 * stopped is usually a shop still working, and the number the office has for
 * them — off a support report, or out of the register — is the till number. A
 * stop code that only worked from a code the shop would have to go and read
 * off a screen first is a stop code that does not get used.
 *
 * It can be typed more than once, which costs nothing: freezing a frozen
 * tablet leaves it frozen. Unlock codes stay bound to the rotating licence
 * code, because those have to be spendable.
 */
export async function freezeCode(anyCode: string): Promise<string> {
  return `F-${await proof(tillPart(anyCode), "F")}`;
}

/** Checks a code against the request this till actually made. Returns what it
    does, or null if it does nothing. */
export async function checkCode(
  request: string,
  code: string,
): Promise<Verdict | null> {
  const cleaned = code.trim().toUpperCase().replace(/\s/g, "");
  const match = cleaned.match(/^(F|\d+)-?([A-Z0-9]{4})-?([A-Z0-9]{4})$/);
  if (!match) return null;
  const offered = `${match[2]}-${match[3]}`;

  if (match[1] === "F") {
    return (await proof(tillPart(request), "F")) === offered
      ? { kind: "freeze" }
      : null;
  }

  const days = Number(match[1]) as Duration;
  if (![0, 7, 30, 90, 365].includes(days)) return null;
  if ((await proof(request, String(days))) !== offered) return null;

  return {
    kind: "grant",
    until: days === 0 ? null : Date.now() + days * 24 * 60 * 60 * 1000,
  };
}

export function describeDuration(days: Duration): string {
  if (days === 0) return "No expiry";
  if (days === 365) return "One year";
  if (days === 90) return "Three months";
  if (days === 30) return "One month";
  return "One week";
}
