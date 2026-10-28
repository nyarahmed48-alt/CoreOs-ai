/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Letting a tablet start selling, and taking that permission away again.
 *
 * A till arrives locked. It shows a short request code; the shop sends that to
 * the office — by WhatsApp, or read down a phone line — and gets back a
 * licence code that only the office can produce. The till checks the licence
 * against the request it made and starts working, until the day the licence
 * says it stops. The person carrying the message is the network, because these
 * tills spend most of the day with no usable internet.
 *
 * ## What makes a licence code genuine
 *
 * A signature, checked with a public key. The office holds a private key that
 * never leaves the owner's own machine; this file holds only the matching
 * public half, which can verify a code but cannot create one. Pulling this
 * file apart — and anyone can, it is plain JavaScript in a single HTML file —
 * yields nothing that mints licences.
 *
 * That is the whole reason for the length of these codes. An ECDSA P-256
 * signature is 64 bytes, which is 103 characters however it is written down.
 * There is no public-key scheme that fits a signature into the eight or ten
 * characters somebody can comfortably read down a phone line, and a short
 * code cannot be rescued by choosing a better algorithm: ten characters is
 * about fifty bits, and a verifier sitting on the device can be asked to try
 * every one of them. So the code is long, and the shop never types it — it
 * arrives by WhatsApp and is pasted, or the camera reads it off a QR code on
 * the owner's screen. Typing it by hand works, and is the third choice.
 *
 * Be clear about what this does and does not buy. It stops anyone but the
 * owner issuing licences, which is the thing that matters commercially. It
 * does not stop someone editing the till's own code to skip the check
 * entirely — nothing enforced on the device can, whatever the cryptography.
 * Only a server holding the data could, and that is the Cloud plan.
 */

/** Characters that survive being read down a bad phone line: no vowels to form
    words, no 0/O, no 1/I. Request codes are read aloud; licence codes are not. */
const ALPHABET = "ACDEFGHJKLMNPQRTUVWXY349";

/**
 * The public half of the office's signing key — raw P-256, base64.
 *
 * Replacing this is how the owner rotates keys: the generator tool makes a new
 * pair, this line changes, the tills get the new file. Codes signed by the old
 * key stop verifying the moment it changes, so a rotation means reissuing
 * every live licence. The generator says as much before it does it.
 */
export const PUBLIC_KEYS = [
  "BN1uE75AZeWA5mVbGMoKI57liRXsA1L/bddN0k+wfoImAKiGww1MZeS23xQ0DKK488smvn0al3aY9tzZH3sOWog=",
];

/** The key codes are being signed with today: the first one listed. */
export const PUBLIC_KEY = PUBLIC_KEYS[0];

/* More than one may be listed, and a code signed by any of them is accepted.
   That is what makes a rotation survivable: ship a build that trusts the old
   key and the new one, let the shops take it, then drop the old line. With a
   single key, changing it would stop every licence already in a shop on the
   day the new file arrived. */
let trusted = PUBLIC_KEYS;

/** Swaps the keys this module verifies against. For the test suite, which has
    to sign with a key that is not the real one — the real private key is not
    in this repository and must never be. */
export function trustKeysForTests(keys: string[]) {
  trusted = keys;
  imported = null;
}

/** Bumped if the signed payload ever changes shape, so an old code fails
    cleanly rather than verifying against the wrong thing. */
const SCHEME = "CC1";

export type Duration = 0 | 7 | 30 | 90 | 365;

/** How long each duration is worth, and which letter travels in the code. 0 is
    the lifetime offline plan, which has no expiry at all. */
const SCOPE: Record<Duration, string> = {
  0: "L",
  7: "7",
  30: "30",
  90: "90",
  365: "365",
};

/**
 * What a code does when it is typed in.
 *
 * `grant` opens the till for a while, or for good. `freeze` shuts it and takes
 * the current request with it, so the only way back is a new code from the
 * office. A freeze needs the shop to type it, which makes it a tool for
 * handing a tablet back, moving a licence to a new one, or a shop that accepts
 * it is over — not a weapon against one that refuses to cooperate. Nothing
 * reaches a tablet that does not want to be reached without a server.
 */
export type Verdict =
  | { kind: "grant"; until: number | null; lifetime: boolean }
  | { kind: "freeze" };

/**
 * What checking a code produced.
 *
 * `bad` and `noCrypto` are deliberately separate. A till that cannot verify
 * signatures has to say so, loudly, rather than tell the shop their code is
 * wrong — they would read it back down the phone line all afternoon.
 */
export type Check = Verdict | { kind: "bad" } | { kind: "noCrypto" };

/* ---------------------------------------------------------------- encoding */

/** Crockford's base32: no I, L, O or U, so nothing reads as a word and the
    characters that get confused by eye are not both in the set. */
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function fromBase32(text: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const character of text) {
    const index = B32.indexOf(character);
    if (index < 0) return null;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/**
 * Whatever somebody actually pasted, reduced to the characters of the code.
 *
 * Line breaks from WhatsApp, the spaces the groups are printed with, and the
 * letters Crockford leaves out are all forgiven: I and L become 1, O becomes
 * 0. A shop reading a long code off a screen gets those wrong every time, and
 * there is no ambiguity to preserve — the real characters cannot occur.
 */
function tidyBody(text: string): string {
  return text
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/[^0-9A-Z]/g, "")
    .split("")
    .filter((character) => B32.includes(character))
    .join("");
}

/** 64 bytes of signature, in base32. */
const BODY_LENGTH = 103;

/**
 * The bit in front of the signature, read as forgivingly as the rest.
 *
 * It is one of a small fixed set, so the honest spelling is tried first and
 * only then the substitutions a person makes off a screen. Doing it in that
 * order is what keeps `L` for the lifetime plan from being read as a one.
 */
function readScope(prefix: string): string | null {
  const scopes = Object.values(SCOPE).concat("F");
  const upper = prefix.toUpperCase();
  if (scopes.includes(upper)) return upper;
  const guessed = upper.replace(/[IL]/g, "1").replace(/O/g, "0");
  return scopes.includes(guessed) ? guessed : null;
}

/** Printed in groups, because a hundred characters in one run is impossible to
    check against another screen or to read out when it comes to that. */
export function groupCode(code: string, size = 6): string {
  const cut = code.indexOf("-");
  if (cut < 1) return code;
  const prefix = code.slice(0, cut);
  const body = code.slice(cut + 1).replace(/-/g, "");
  const groups = body.match(new RegExp(`.{1,${size}}`, "g")) ?? [];
  return `${prefix}-${groups.join("-")}`;
}

/* ------------------------------------------------------------------- codes */

export function randomPart(length: number): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** `3NR-LET-7K2Q` — the till's own name, plus a part that changes every time
    it asks, so yesterday's licence code cannot be used again. */
export function requestCode(tillId: string, nonce: string): string {
  return `${tillId}-${nonce}`;
}

/**
 * The till's own name, out of whichever code someone has to hand.
 *
 * Two numbers live on a till and they look alike: the till number (`3NR-LET`),
 * which is on the help screen and on every support report, and the request
 * code (`3NR-LET-7K2Q`), which is the till number plus a part that rotates.
 * Whoever is on the phone will read out whichever they are looking at, so
 * anything that only needs the till number takes either.
 */
export function tillPart(code: string): string {
  const parts = code.trim().toUpperCase().split("-").filter(Boolean);
  return parts.slice(0, 2).join("-");
}

/** Exactly the bytes the office signs. Both halves build this the same way, so
    it lives here rather than in either of them. */
export function payload(request: string, scope: string): Uint8Array {
  const text = `${SCHEME}|${request.trim().toUpperCase()}|${scope}`;
  return new TextEncoder().encode(text);
}

export function scopeFor(days: Duration): string {
  return SCOPE[days];
}

/* -------------------------------------------------------------- verifying */

/** True when this browser can check a signature at all. */
export function canVerify(): boolean {
  return typeof crypto !== "undefined" && Boolean(crypto.subtle);
}

let imported: Promise<CryptoKey[]> | null = null;

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

async function genuine(
  signature: Uint8Array,
  request: string,
  scope: string,
): Promise<boolean> {
  try {
    const message = payload(request, scope);
    for (const key of await keys()) {
      const ok = await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        key,
        signature,
        message,
      );
      if (ok) return true;
    }
    return false;
  } catch {
    /* A key the browser refuses to import, or a signature the wrong length.
       Either way this code is not usable; it is not a reason to fall back to
       something weaker. */
    return false;
  }
}

/**
 * Checks a code against the request this till actually made.
 *
 * There is no path through here that accepts a code without a signature from
 * the office's key. If the browser cannot do the arithmetic it says so and
 * stops; it does not guess, and it does not quietly use a weaker check that
 * would make every code in circulation wrong.
 */
export async function checkCode(request: string, code: string): Promise<Check> {
  if (!canVerify()) return { kind: "noCrypto" };

  /* The scope, then anything that is not a character of the code, then the
     signature. Written this way because a code that has been through WhatsApp
     and a notes app may arrive separated by spaces or line breaks rather than
     the dashes it was printed with. */
  const split = code.trim().match(/^([A-Za-z0-9]{1,3})[^A-Za-z0-9]+([\s\S]+)$/);
  if (!split) return { kind: "bad" };

  const scope = readScope(split[1]);
  if (!scope) return { kind: "bad" };

  const body = tidyBody(split[2]);
  if (body.length !== BODY_LENGTH) return { kind: "bad" };

  const bytes = fromBase32(body);
  if (!bytes || bytes.length !== 64) return { kind: "bad" };

  /* A stop code is signed over the till number alone, not the rotating
     request. A shop being stopped is usually a shop still working, and the
     number the office has for them — off a support report, or out of the
     register — is the till number. A stop code that first needed the shop to
     go and read something off a screen is a stop code that does not get
     used. It can be applied twice, which costs nothing. */
  if (scope === "F") {
    return (await genuine(bytes, tillPart(request), "F"))
      ? { kind: "freeze" }
      : { kind: "bad" };
  }

  const days = (scope === "L" ? 0 : Number(scope)) as Duration;
  if (!(await genuine(bytes, request, scope))) return { kind: "bad" };

  return {
    kind: "grant",
    until: days === 0 ? null : Date.now() + days * 24 * 60 * 60 * 1000,
    lifetime: days === 0,
  };
}

export function describeDuration(days: Duration): string {
  if (days === 0) return "Offline plan: lifetime";
  if (days === 365) return "One year";
  if (days === 90) return "Three months";
  if (days === 30) return "One month";
  return "One week";
}
