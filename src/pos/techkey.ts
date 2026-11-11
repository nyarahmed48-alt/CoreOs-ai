/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The CoreOS technician key.
 *
 * A PIN is a secret that gets shared, written on a wall, watched over a
 * shoulder, and never expires. This is a signed key instead: the tablet holds
 * only a public key, so it can check a technician key but can never make one.
 * The private half lives on the technician's own phone and nowhere else — not
 * in this app, not in the repository, not on a server.
 *
 * A key names one tablet, one technician, one window of time and one set of
 * powers, and it works once. There is nothing in it worth stealing after
 * that: a key copied off a screen is a key that has already been used, for a
 * till the thief does not have, for an hour that has passed.
 *
 * It is deliberately a different keypair from the one that signs licences.
 * The two have nothing to do with each other, and a technician key that leaks
 * must not also be able to mint a shop a free year of CoreCashier.
 *
 * Nothing in here is hidden from the shop. Every session opened with one of
 * these keys is written into the error log the owner can read, with who
 * opened it, when, what it unlocked and when it ended.
 */

import { fromBase32, tidyBody, toBase32 } from "../activation";

/** The public half of the CoreOS technician key. The private half is in a
    key file on the technician's phone; see the Key Maker. */
export const TECH_PUBLIC_KEYS = [
  "BC/QTjm2Zko1JLTyCqzW0Ih9+DRqSRASSK15Nq4CLR2JEol7t0zqiD28fis931v1gJ0/yDohy4aedzNRa53gZNE=",
];

/** Bumped if the bytes below ever change shape, so an old key is refused
    cleanly instead of being read as something it is not. */
export const TECH_VERSION = 1;

export type Scope = "details" | "simulate" | "device" | "settings";

/** What each scope is worth, as one bit. */
const SCOPE_BITS: Record<Scope, number> = {
  details: 1,
  simulate: 2,
  device: 4,
  settings: 8,
};

export const ALL_SCOPES = Object.keys(SCOPE_BITS) as Scope[];

export function packScopes(scopes: Scope[]): number {
  return scopes.reduce((bits, scope) => bits | SCOPE_BITS[scope], 0);
}

export function unpackScopes(bits: number): Scope[] {
  return ALL_SCOPES.filter((scope) => (bits & SCOPE_BITS[scope]) !== 0);
}

export interface TechKey {
  version: number;
  scopes: Scope[];
  /** The till this key opens, or "" for a key that opens any of them. */
  till: string;
  /** Epoch milliseconds. */
  issued: number;
  expires: number;
  /** The one-time number. Hex, so it can be a plain map key. */
  nonce: string;
  technician: string;
}

/* ------------------------------------------------------------ the bytes */

const TILL_BYTES = 8;
const NAME_BYTES = 16;
const BODY = 1 + 1 + TILL_BYTES + 4 + 4 + 8 + NAME_BYTES; // 42
const SIGNATURE = 64;
export const KEY_BYTES = BODY + SIGNATURE; // 106

/** How long a key may last. An hour for a key that opens every till, because
    one of those is worth far more if it goes astray. */
export const MAX_HOURS = 24;
export const MAX_HOURS_ALL_TILLS = 1;
export const DEFAULT_HOURS = 2;

/** A key issued more than this far in the future is refused — a tablet whose
    clock is a few minutes out should still work, one being fed a key dated
    next week should not. */
const FUTURE_GRACE_MS = 10 * 60 * 1000;

function ascii(text: string, length: number): Uint8Array {
  const out = new Uint8Array(length);
  const bytes = new TextEncoder().encode(text);
  out.set(bytes.subarray(0, length));
  return out;
}

function unascii(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return new TextDecoder().decode(end === -1 ? bytes : bytes.subarray(0, end));
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The part of a key that gets signed: everything except the signature. */
export function keyBody(key: Omit<TechKey, "version">): Uint8Array {
  const body = new Uint8Array(BODY);
  const view = new DataView(body.buffer);
  body[0] = TECH_VERSION;
  body[1] = packScopes(key.scopes);
  body.set(ascii(key.till.toUpperCase(), TILL_BYTES), 2);
  /* Seconds, not milliseconds: four bytes of seconds reaches the year 2106,
     and four bytes of milliseconds reaches next month. */
  view.setUint32(10, Math.floor(key.issued / 1000));
  view.setUint32(14, Math.floor(key.expires / 1000));
  body.set(
    Uint8Array.from(
      (key.nonce.match(/.{2}/g) ?? []).slice(0, 8).map((pair) => parseInt(pair, 16)),
    ),
    18,
  );
  body.set(ascii(key.technician, NAME_BYTES), 26);
  return body;
}

function readBody(body: Uint8Array): TechKey {
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  return {
    version: body[0],
    scopes: unpackScopes(body[1]),
    till: unascii(body.subarray(2, 2 + TILL_BYTES)),
    issued: view.getUint32(10) * 1000,
    expires: view.getUint32(14) * 1000,
    nonce: hex(body.subarray(18, 26)),
    technician: unascii(body.subarray(26, 26 + NAME_BYTES)),
  };
}

/** `TK-…` — the whole key, printable, in the alphabet the licences use. */
export function encodeKey(body: Uint8Array, signature: Uint8Array): string {
  const whole = new Uint8Array(KEY_BYTES);
  whole.set(body, 0);
  whole.set(signature, BODY);
  return `TK-${toBase32(whole)}`;
}

/** Printed in groups: a hundred and seventy characters in one run cannot be
    checked against another screen, and sometimes one has to be. */
export function groupKey(key: string, size = 6): string {
  const body = key.replace(/^TK-/i, "").replace(/-/g, "");
  return `TK-${(body.match(new RegExp(`.{1,${size}}`, "g")) ?? []).join("-")}`;
}

/* -------------------------------------------------------------- checking */

export type KeyRefusal =
  /** Not a technician key at all, or mangled past repair. */
  | "unreadable"
  /** Not signed by CoreOS. The interesting one. */
  | "signature"
  /** Signed, but for a different tablet. */
  | "wrongTill"
  | "expired"
  /** Dated too far ahead — a clock wrong at one end or the other. */
  | "future"
  /** Genuine, but already used. */
  | "used"
  /** This browser cannot check signatures at all. */
  | "noCrypto";

export type KeyVerdict =
  | { ok: true; key: TechKey }
  | { ok: false; why: KeyRefusal };

let imported: Promise<CryptoKey[]> | null = null;
let trusted = TECH_PUBLIC_KEYS;

/** Swaps the keys this module checks against. For the test suite, which signs
    with a key that is not the real one — the real private key is not in this
    repository and must never be. */
export function trustKeysForTests(keys: string[]) {
  trusted = keys;
  imported = null;
}

function keys(): Promise<CryptoKey[]> {
  if (!imported) {
    imported = Promise.all(
      trusted.map((key) =>
        crypto.subtle.importKey(
          "raw",
          Uint8Array.from(atob(key), (character) => character.charCodeAt(0)),
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["verify"],
        ),
      ),
    );
  }
  return imported;
}

export function canVerify(): boolean {
  return typeof crypto !== "undefined" && Boolean(crypto.subtle);
}

/**
 * Reads a technician key and says whether this tablet should honour it.
 *
 * `spent` answers "has this one-time number been used here before" — the
 * caller owns that list, because it has to outlive a restart.
 *
 * The order of the checks matters. The signature is tested first, so that
 * every later message is about a key CoreOS really issued: telling someone
 * their key is "for a different till" when it was forged tells them something
 * true about a key we should say nothing about.
 */
export async function readKey(
  text: string,
  tillId: string,
  spent: (nonce: string) => boolean,
  now = Date.now(),
): Promise<KeyVerdict> {
  if (!canVerify()) return { ok: false, why: "noCrypto" };

  const cleaned = tidyBody(text.replace(/^\s*TK[-\s]?/i, ""));
  const bytes = fromBase32(cleaned);
  if (!bytes || bytes.length !== KEY_BYTES) return { ok: false, why: "unreadable" };

  const body = bytes.subarray(0, BODY);
  const signature = bytes.subarray(BODY);

  let genuine = false;
  try {
    for (const key of await keys()) {
      if (
        await crypto.subtle.verify(
          { name: "ECDSA", hash: "SHA-256" },
          key,
          signature,
          body,
        )
      ) {
        genuine = true;
        break;
      }
    }
  } catch {
    return { ok: false, why: "signature" };
  }
  if (!genuine) return { ok: false, why: "signature" };

  const key = readBody(body);
  if (key.version !== TECH_VERSION) return { ok: false, why: "unreadable" };
  if (key.till && key.till !== tillId.toUpperCase()) {
    return { ok: false, why: "wrongTill" };
  }
  if (key.expires <= now) return { ok: false, why: "expired" };
  if (key.issued > now + FUTURE_GRACE_MS) return { ok: false, why: "future" };

  /* A key that opens every till is worth an hour at most, and the cap is
     checked here as well as in the Key Maker. A cap only the maker enforces
     is not a cap — this is the half the technician cannot edit. */
  const cap = key.till ? MAX_HOURS : MAX_HOURS_ALL_TILLS;
  if (key.expires - key.issued > cap * 3600_000) return { ok: false, why: "expired" };

  if (spent(key.nonce)) return { ok: false, why: "used" };

  return { ok: true, key };
}
