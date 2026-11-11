/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The technician key, end to end: the Key Maker signs, the till decides.
 *
 * Signed here with a keypair made on the spot. The real private key is not in
 * this repository and must never be, so what is proved here is the mechanism,
 * not the particular key the shipped till trusts — except for the one test
 * that checks the shipped public key is a well-formed P-256 key, since a typo
 * on that line would lock every technician out of every tablet at once.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TECH_PUBLIC_KEYS,
  canVerify,
  groupKey,
  readKey,
  trustKeysForTests,
  type Scope,
} from "./techkey";
import { createKeypair, importPrivateKey, makeKey } from "../keymaker/sign";

const TILL = "3NR-LET";
const NOW = Date.UTC(2026, 10, 11, 9, 0, 0);

let signing: CryptoKey;
/** Nothing has been used, unless a test says so. */
let spent: Set<string>;
const seen = (nonce: string) => spent.has(nonce);

beforeAll(async () => {
  const pair = await createKeypair();
  signing = await importPrivateKey(pair.privateJwk, true);
  trustKeysForTests([pair.publicKey]);
});

beforeEach(() => {
  spent = new Set();
});

function issue(over: Partial<Parameters<typeof makeKey>[1]> = {}, now = NOW) {
  return makeKey(
    signing,
    { till: TILL, technician: "Nyar", scopes: ["details", "simulate"], ...over },
    now,
  );
}

describe("a key CoreOS issued", () => {
  it("opens the tablet it was made for", async () => {
    const { text } = await issue();
    const verdict = await readKey(text, TILL, seen, NOW + 1000);
    expect(verdict.ok).toBe(true);
    if (!verdict.ok) return;
    expect(verdict.key.technician).toBe("Nyar");
    expect(verdict.key.scopes).toEqual(["details", "simulate"]);
    expect(verdict.key.till).toBe(TILL);
  });

  it("carries only the powers it was given", async () => {
    const { text } = await issue({ scopes: ["device"] as Scope[] });
    const verdict = await readKey(text, TILL, seen, NOW + 1000);
    expect(verdict.ok && verdict.key.scopes).toEqual(["device"]);
  });

  it("survives being read off a screen in groups", async () => {
    const { text } = await issue();
    const mangled = groupKey(text).toLowerCase().replace(/-/g, " ");
    expect((await readKey(mangled, TILL, seen, NOW + 1000)).ok).toBe(true);
  });

  it("needs no network at all", async () => {
    /* The repair happens in a shop whose wifi is the reason somebody called.
       If anything here ever reaches for the network, this fails. */
    const fetching = vi.fn();
    vi.stubGlobal("fetch", fetching);
    const { text } = await issue();
    expect((await readKey(text, TILL, seen, NOW + 1000)).ok).toBe(true);
    expect(fetching).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("a key the tablet must refuse", () => {
  it("refuses the same key twice", async () => {
    const { text, nonce } = await issue();
    expect((await readKey(text, TILL, seen, NOW + 1000)).ok).toBe(true);
    spent.add(nonce);
    const again = await readKey(text, TILL, seen, NOW + 2000);
    expect(again).toEqual({ ok: false, why: "used" });
  });

  it("refuses a key made for another tablet", async () => {
    const { text } = await issue({ till: "9WP-DQK" });
    expect(await readKey(text, TILL, seen, NOW + 1000)).toEqual({
      ok: false,
      why: "wrongTill",
    });
  });

  it("refuses a key whose time has passed", async () => {
    const { text } = await issue({ hours: 2 });
    const later = NOW + 3 * 3600_000;
    expect(await readKey(text, TILL, seen, later)).toEqual({
      ok: false,
      why: "expired",
    });
  });

  it("refuses a key dated well into the future", async () => {
    /* Either the technician's clock or the tablet's is wrong. Accepting it
       would mean accepting a key minted to last for ever. */
    const { text } = await issue({}, NOW + 60 * 60_000);
    expect(await readKey(text, TILL, seen, NOW)).toEqual({
      ok: false,
      why: "future",
    });
  });

  it("refuses a key with one character changed", async () => {
    const { text } = await issue();
    const at = text.length - 10;
    const swapped = text[at] === "Z" ? "Y" : "Z";
    const forged = text.slice(0, at) + swapped + text.slice(at + 1);
    expect(await readKey(forged, TILL, seen, NOW + 1000)).toEqual({
      ok: false,
      why: "signature",
    });
  });

  it("refuses a key signed by anybody else", async () => {
    const other = await createKeypair();
    const theirs = await importPrivateKey(other.privateJwk, true);
    const { text } = await makeKey(
      theirs,
      { till: TILL, technician: "Not Nyar", scopes: ["settings"] },
      NOW,
    );
    expect(await readKey(text, TILL, seen, NOW + 1000)).toEqual({
      ok: false,
      why: "signature",
    });
  });

  it("refuses rubbish without pretending to know more", async () => {
    for (const attempt of ["", "TK-", "hello", "TK-ABCDEF"]) {
      expect((await readKey(attempt, TILL, seen, NOW)).ok, attempt).toBe(false);
    }
  });

  it("caps an every-till key at an hour however it was signed", async () => {
    /* The Key Maker clamps this, but the Key Maker is a file the technician
       holds and could edit. The till applies the cap itself. */
    const { text } = await makeKey(
      signing,
      { till: "", technician: "Nyar", scopes: ["details"], hours: 24 },
      NOW,
    );
    expect(await readKey(text, TILL, seen, NOW + 2 * 3600_000)).toEqual({
      ok: false,
      why: "expired",
    });
  });

  it("lets a properly short every-till key through on any tablet", async () => {
    const { text } = await makeKey(
      signing,
      { till: "", technician: "Nyar", scopes: ["details"], hours: 1 },
      NOW,
    );
    expect((await readKey(text, "ANY-TIL", seen, NOW + 1000)).ok).toBe(true);
  });
});

describe("the key the shipped till trusts", () => {
  it("is a P-256 public key the browser will import", async () => {
    const raw = Uint8Array.from(atob(TECH_PUBLIC_KEYS[0]), (c) => c.charCodeAt(0));
    expect(raw.length).toBe(65);
    expect(raw[0]).toBe(4);
    await expect(
      crypto.subtle.importKey("raw", raw, { name: "ECDSA", namedCurve: "P-256" }, false, [
        "verify",
      ]),
    ).resolves.toBeTruthy();
  });

  it("is not the key this suite signs with", async () => {
    /* If this ever passes, somebody has committed the private key. */
    const { text } = await issue();
    trustKeysForTests(TECH_PUBLIC_KEYS);
    const verdict = await readKey(text, TILL, seen, NOW + 1000);
    expect(verdict).toEqual({ ok: false, why: "signature" });
  });
});

describe("a browser that cannot check signatures", () => {
  it("says so rather than letting the key through", async () => {
    const real = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      value: { getRandomValues: real.getRandomValues.bind(real) },
      configurable: true,
    });
    try {
      expect(canVerify()).toBe(false);
      expect(await readKey("TK-ANYTHING", TILL, seen, NOW)).toEqual({
        ok: false,
        why: "noCrypto",
      });
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: real, configurable: true });
    }
  });
});
