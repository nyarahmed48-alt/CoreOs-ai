/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Technician sessions: one-time keys, and a session that closes itself.
 *
 * The module reads localStorage as it loads, so the store is stubbed before
 * it is imported and the module is re-imported fresh wherever a test needs to
 * act out a restart. That is the point of several of these: a key that cannot
 * be replayed after the tablet is switched off and on is the whole promise.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { trustKeysForTests } from "./techkey";
import { createKeypair, importPrivateKey, makeKey } from "../keymaker/sign";

const TILL = "3NR-LET";

/** The smallest localStorage that behaves like one, including throwing on
    nothing — a tablet with storage blocked is covered elsewhere. */
function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

const store = fakeStorage();
vi.stubGlobal("localStorage", store);
vi.stubGlobal("window", undefined);

let signing: CryptoKey;
let publicKey: string;

/**
 * A fresh copy of the module, as though the tablet had just been switched on.
 * The spent list and the session both live in storage, which persists.
 *
 * Resetting the modules gives technician.ts a fresh techkey.ts as well, and
 * that copy trusts the real CoreOS key again — so the test key has to be put
 * back into the new graph, not the old one.
 */
async function restart() {
  vi.resetModules();
  const fresh = await import("./techkey");
  fresh.trustKeysForTests([publicKey]);
  return import("./technician");
}

beforeEach(async () => {
  store.clear();
  const pair = await createKeypair();
  publicKey = pair.publicKey;
  signing = await importPrivateKey(pair.privateJwk, true);
  trustKeysForTests([publicKey]);
});

async function key(hours = 2) {
  const made = await makeKey(signing, {
    till: TILL,
    technician: "Nyar",
    scopes: ["details", "simulate"],
    hours,
  });
  return made.text;
}

describe("opening technician mode", () => {
  it("opens on a good key and reports who is in", async () => {
    const tech = await restart();
    expect(tech.session()).toBeNull();
    const verdict = await tech.unlock(await key(), TILL);
    expect(verdict.ok).toBe(true);
    expect(tech.session()?.technician).toBe("Nyar");
    expect(tech.can("details")).toBe(true);
    expect(tech.can("settings")).toBe(false);
  });

  it("writes the session into the log the shop owner reads", async () => {
    const tech = await restart();
    await tech.unlock(await key(), TILL);
    const { recordedErrors } = await import("./report");
    const log = recordedErrors().map((entry) => entry.what);
    expect(log.some((line) => line.includes("technician session opened"))).toBe(true);
    expect(log.some((line) => line.includes("Nyar"))).toBe(true);
  });

  it("logs the end of a session too, with why", async () => {
    const tech = await restart();
    await tech.unlock(await key(), TILL);
    tech.finish("ended");
    const { recordedErrors } = await import("./report");
    expect(
      recordedErrors().some((entry) => entry.what.includes("technician session ended")),
    ).toBe(true);
    expect(tech.session()).toBeNull();
  });
});

describe("one key, one use", () => {
  it("refuses the same key a second time", async () => {
    const tech = await restart();
    const text = await key();
    expect((await tech.unlock(text, TILL)).ok).toBe(true);
    tech.finish("ended");
    expect(await tech.unlock(text, TILL)).toEqual({ ok: false, why: "used" });
  });

  it("still refuses it after the tablet is switched off and on", async () => {
    const first = await restart();
    const text = await key();
    expect((await first.unlock(text, TILL)).ok).toBe(true);

    /* The whole point of writing the spent list down. */
    const second = await restart();
    expect(await second.unlock(text, TILL)).toEqual({ ok: false, why: "used" });
  });

  it("does not burn a key that was refused for another reason", async () => {
    const tech = await restart();
    const wrongTill = await makeKey(signing, {
      till: "9WP-DQK",
      technician: "Nyar",
      scopes: ["details"],
    });
    expect(await tech.unlock(wrongTill.text, TILL)).toEqual({
      ok: false,
      why: "wrongTill",
    });
    /* Used on the tablet it was actually made for, it must still work. */
    expect((await tech.unlock(wrongTill.text, "9WP-DQK")).ok).toBe(true);
  });
});

describe("a session that closes itself", () => {
  it("closes after the idle time with no taps", async () => {
    const tech = await restart();
    tech.setIdleTimeout(50);
    await tech.unlock(await key(), TILL);
    expect(tech.session()).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(tech.session()).toBeNull();
    const { recordedErrors } = await import("./report");
    expect(
      recordedErrors().some((entry) => entry.what.includes("technician session idle")),
    ).toBe(true);
  });

  it("stays open while the technician keeps tapping", async () => {
    const tech = await restart();
    tech.setIdleTimeout(120);
    await tech.unlock(await key(), TILL);
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      /* touch() ignores taps closer together than 20 seconds, so the test
         reaches past it the way the clock would. */
      tech.touch();
      expect(tech.session()).not.toBeNull();
    }
  });

  it("closes when the key's own time runs out, taps or no taps", async () => {
    const tech = await restart();
    tech.setIdleTimeout(60_000);
    await tech.unlock(await key(0.25), TILL);
    const past = Date.now() + 20 * 60_000; // the key was good for fifteen
    expect(tech.session(past)).toBeNull();
  });

  it("is gone after a restart once it has expired", async () => {
    const first = await restart();
    first.setIdleTimeout(40);
    await first.unlock(await key(), TILL);
    await new Promise((resolve) => setTimeout(resolve, 70));

    const second = await restart();
    second.setIdleTimeout(40);
    expect(second.session()).toBeNull();
  });
});
