/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Making licence codes. The half that holds the key.
 *
 * This file is only ever built into the code generator, which lives on the
 * owner's own machine and is never sent to a shop. Nothing in the till, the
 * owner's console or the website imports it.
 *
 * Even here the private key is not written down. It is loaded from a key file
 * the owner keeps — so if the generator file itself leaks, it issues nothing.
 * The one secret in this file is the old shared password, kept so that a
 * tablet still running the pre-signature build can be rescued without
 * somebody driving a USB stick to it; it is worthless against a till built
 * from the current source, which does not contain it.
 */

import {
  payload,
  scopeFor,
  tillPart,
  toBase32,
  type Duration,
} from "../activation";

/** One licence code: the scope in front, then the signature. */
async function sign(
  key: CryptoKey,
  request: string,
  scope: string,
): Promise<string> {
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    payload(request, scope),
  );
  return `${scope}-${toBase32(new Uint8Array(signature))}`;
}

export async function unlockCode(
  key: CryptoKey,
  request: string,
  days: Duration,
): Promise<string> {
  return sign(key, request, scopeFor(days));
}

/** Stops one tablet. Signed over the till number, so the owner can issue it
    from the number they already have on file. */
export async function freezeCode(
  key: CryptoKey,
  anyCode: string,
): Promise<string> {
  return sign(key, tillPart(anyCode), "F");
}

/* ---------------------------------------------------------------- the keys */

const CURVE = { name: "ECDSA", namedCurve: "P-256" } as const;

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, CURVE, true, ["sign"]);
}

/**
 * A brand new pair.
 *
 * The owner runs this once if they would rather hold a key nobody else has
 * ever seen. It hands back the private half to save as a file, and the public
 * half as the one line to paste into `src/activation.ts` before the next
 * build. Every licence already in a shop stops verifying when that line
 * changes, so the generator warns before offering it.
 */
export async function createKeypair(): Promise<{
  privateJwk: JsonWebKey;
  publicKey: string;
}> {
  const pair = await crypto.subtle.generateKey(CURVE, true, ["sign", "verify"]);
  const raw = new Uint8Array(
    await crypto.subtle.exportKey("raw", pair.publicKey),
  );
  let base64 = "";
  for (const byte of raw) base64 += String.fromCharCode(byte);
  return {
    privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
    publicKey: btoa(base64),
  };
}

/** Does this key actually match the public half the tills are carrying? */
export async function keyMatches(
  key: CryptoKey,
  publicKey: string,
): Promise<boolean> {
  try {
    const raw = Uint8Array.from(atob(publicKey), (character) =>
      character.charCodeAt(0),
    );
    const checker = await crypto.subtle.importKey("raw", raw, CURVE, false, [
      "verify",
    ]);
    const probe = payload("3NR-LET-7K2Q", "30");
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      probe,
    );
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      checker,
      signature,
      probe,
    );
  } catch {
    return false;
  }
}

/* ------------------------------------------------------- the old short codes */

/**
 * The short codes the first build accepted, from before any of this was
 * signed: `30-XKM4-PQ7A`.
 *
 * A tablet running that build cannot check a signature, so the only code it
 * will ever accept is one of these. They are kept here, and only here, so a
 * till in a shop can be renewed or stopped while it waits for the new file.
 * They are no use against the current build, which has no idea what this
 * password is.
 */
const OLD_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY349";
const OLD_SECRET = "coreos-activation-2026-till";

async function oldProof(request: string, scope: string): Promise<string> {
  const data = new TextEncoder().encode(
    `${OLD_SECRET}|${request.trim().toUpperCase()}|${scope}`,
  );
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  let body = "";
  for (let i = 0; i < 8; i++) {
    body += OLD_ALPHABET[bytes[i % bytes.length] % OLD_ALPHABET.length];
  }
  return `${body.slice(0, 4)}-${body.slice(4)}`;
}

export async function oldUnlockCode(
  request: string,
  days: Duration,
): Promise<string> {
  return `${days}-${await oldProof(request, String(days))}`;
}

/** The two shapes of old stop code: made from the till number, and — for the
    very first build — from the whole request code. */
export async function oldFreezeCodes(anyCode: string): Promise<string[]> {
  const clean = anyCode.trim().toUpperCase();
  const fromTill = `F-${await oldProof(tillPart(clean), "F")}`;
  const fromWhole = `F-${await oldProof(clean, "F")}`;
  return fromTill === fromWhole ? [fromTill] : [fromTill, fromWhole];
}
