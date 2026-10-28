/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The licence codes, checked end to end: the generator signs, the till
 * verifies, and nothing else gets in.
 *
 * These tests sign with a keypair made on the spot. The real private key is
 * not in this repository and must not be — that is the whole point of the
 * scheme — so the suite proves the mechanism rather than the particular key
 * the shipped build trusts. What it does check about the real key is that the
 * line in `activation.ts` is a well-formed P-256 public key the browser will
 * import, since a typo there would lock out every till at once.
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
  PUBLIC_KEY,
  canVerify,
  checkCode,
  groupCode,
  requestCode,
  trustKeysForTests,
} from "./activation";
import {
  createKeypair,
  freezeCode,
  importPrivateKey,
  keyMatches,
  unlockCode,
} from "./generator/issue";

const REQUEST = requestCode("3NR-LET", "7K2Q");

let key: CryptoKey;

beforeAll(async () => {
  const pair = await createKeypair();
  key = await importPrivateKey(pair.privateJwk);
  trustKeysForTests([pair.publicKey]);
});

describe("licence codes", () => {
  it("accepts a code the office signed for this very request", async () => {
    const code = await unlockCode(key, REQUEST, 30);
    const verdict = await checkCode(REQUEST, code);
    expect(verdict.kind).toBe("grant");
    if (verdict.kind !== "grant") return;
    expect(verdict.lifetime).toBe(false);
    /* Thirty days out, give or take the milliseconds this test took. */
    expect(verdict.until).toBeGreaterThan(Date.now() + 29 * 86400000);
    expect(verdict.until).toBeLessThan(Date.now() + 31 * 86400000);
  });

  it("refuses the same code on a different till", async () => {
    const code = await unlockCode(key, REQUEST, 30);
    const other = requestCode("3NR-LET", "9WPD");
    expect((await checkCode(other, code)).kind).toBe("bad");
  });

  it("refuses a code whose length was edited upwards", async () => {
    const code = await unlockCode(key, REQUEST, 7);
    /* The scope travels in front of the signature, and is signed. Swapping a
       week for a year is the obvious thing to try, and it has to fail. */
    const greedy = `365-${code.slice(code.indexOf("-") + 1)}`;
    expect((await checkCode(REQUEST, greedy)).kind).toBe("bad");
  });

  it("gives the lifetime offline plan no expiry at all", async () => {
    const verdict = await checkCode(REQUEST, await unlockCode(key, REQUEST, 0));
    expect(verdict).toEqual({ kind: "grant", until: null, lifetime: true });
  });

  it("stops a till from a code made with its till number alone", async () => {
    /* The office issues a stop from the number on the support report, not
       from the rotating request code the shop would have to read out. */
    const code = await freezeCode(key, "3NR-LET");
    expect((await checkCode(REQUEST, code)).kind).toBe("freeze");
  });

  it("forgives how a long code survives being copied about", async () => {
    const code = await unlockCode(key, REQUEST, 90);
    const mangled = groupCode(code)
      .toLowerCase()
      .replace(/-/g, " \n ")
      /* The characters Crockford leaves out are exactly the ones a person
         types when reading a screen: I and l for one, O for zero. */
      .replace(/1/g, "l")
      .replace(/0/g, "O");
    expect((await checkCode(REQUEST, mangled)).kind).toBe("grant");
  });

  it("refuses a signature with a byte changed", async () => {
    const code = await unlockCode(key, REQUEST, 30);
    const body = code.slice(code.indexOf("-") + 1);
    const swapped = body[10] === "Z" ? "Y" : "Z";
    const forged = `30-${body.slice(0, 10)}${swapped}${body.slice(11)}`;
    expect((await checkCode(REQUEST, forged)).kind).toBe("bad");
  });

  it("refuses rubbish, short codes and the old short format", async () => {
    for (const attempt of [
      "",
      "-",
      "30",
      "30-XKM4-PQ7A",
      "F-XKM4-PQ7A",
      `30-${"A".repeat(103)}`,
      `30-${"A".repeat(40)}`,
    ]) {
      expect((await checkCode(REQUEST, attempt)).kind, attempt).toBe("bad");
    }
  });

  it("prints a code in groups without changing what it says", async () => {
    const code = await unlockCode(key, REQUEST, 30);
    expect(groupCode(code)).toMatch(/^30(-[0-9A-Z]{1,6})+$/);
    expect((await checkCode(REQUEST, groupCode(code))).kind).toBe("grant");
  });
});

describe("the key the shipped till trusts", () => {
  it("is a P-256 public key the browser will import", async () => {
    const raw = Uint8Array.from(atob(PUBLIC_KEY), (c) => c.charCodeAt(0));
    /* 65 bytes, uncompressed point: a leading 0x04 then x and y. */
    expect(raw.length).toBe(65);
    expect(raw[0]).toBe(4);
    await expect(
      crypto.subtle.importKey(
        "raw",
        raw,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"],
      ),
    ).resolves.toBeTruthy();
  });

  it("is not the key this suite signs with", async () => {
    /* If this ever passes, somebody has committed the private key. */
    expect(await keyMatches(key, PUBLIC_KEY)).toBe(false);
  });
});

describe("a browser that cannot do the arithmetic", () => {
  it("says so instead of calling the code wrong", async () => {
    const real = globalThis.crypto;
    /* Old Android WebViews really do turn up without subtle crypto, usually
       because the page is being served over plain http. Telling the shop
       their code is wrong would have them reading it back down the phone all
       afternoon. */
    Object.defineProperty(globalThis, "crypto", {
      value: { getRandomValues: real.getRandomValues.bind(real) },
      configurable: true,
    });
    try {
      expect(canVerify()).toBe(false);
      expect((await checkCode(REQUEST, "30-ABC")).kind).toBe("noCrypto");
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: real,
        configurable: true,
      });
    }
  });
});
