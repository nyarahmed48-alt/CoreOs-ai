/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Making technician keys. The half that holds the private key.
 *
 * Only ever built into the Key Maker, which lives on the technician's own
 * phone and laptop and is never hosted, never shipped inside CoreCashier and
 * never imported by the till. The till has the matching module for checking
 * keys and nothing that could make one.
 */

import {
  DEFAULT_HOURS,
  MAX_HOURS,
  MAX_HOURS_ALL_TILLS,
  encodeKey,
  keyBody,
  type Scope,
} from "../pos/techkey";

const CURVE = { name: "ECDSA", namedCurve: "P-256" } as const;

export async function createKeypair(): Promise<{
  privateJwk: JsonWebKey;
  publicKey: string;
}> {
  const pair = await crypto.subtle.generateKey(CURVE, true, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  let binary = "";
  for (const byte of raw) binary += String.fromCharCode(byte);
  return {
    privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
    publicKey: btoa(binary),
  };
}

export async function importPrivateKey(
  jwk: JsonWebKey,
  extractable = false,
): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, CURVE, extractable, ["sign"]);
}

/** A fresh one-time number. Eight bytes: a technician issuing a key a minute
    for a century would not see the same one twice. */
export function newNonce(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface KeyRequest {
  /** The till it opens, or "" for every till — which costs it most of its
      life, see below. */
  till: string;
  technician: string;
  scopes: Scope[];
  hours?: number;
}

/** The longest a key of this shape may last. */
export function capHours(till: string): number {
  return till ? MAX_HOURS : MAX_HOURS_ALL_TILLS;
}

export async function makeKey(
  signingKey: CryptoKey,
  request: KeyRequest,
  now = Date.now(),
): Promise<{ text: string; nonce: string; expires: number }> {
  const cap = capHours(request.till);
  /* Clamped here and checked again by the till. A technician who edits this
     file gains nothing: the tablet applies the same cap to a key it has
     already decided is genuine. */
  const hours = Math.min(Math.max(request.hours ?? DEFAULT_HOURS, 0.25), cap);
  const nonce = newNonce();
  const expires = now + hours * 3600_000;

  const body = keyBody({
    scopes: request.scopes,
    till: request.till,
    technician: request.technician,
    issued: now,
    expires,
    nonce,
  });
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, body),
  );
  return { text: encodeKey(body, signature), nonce, expires };
}

export { MAX_HOURS, MAX_HOURS_ALL_TILLS, DEFAULT_HOURS };
