/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The arithmetic a shop's money passes through.
 *
 * Every number here is one a cashier could be handed across a counter in
 * Baghdad, and every expectation is what they should give back.
 */

import { describe, expect, it } from "vitest";
import { amount, money, parseAmount, roundTotal, IQD_NOTES } from "./money";

describe("rounding to the nearest note", () => {
  it("rounds up at the halfway point, in the customer's favour", () => {
    expect(roundTotal(1625, 250)).toBe(1750);
  });

  it("leaves a total that already lands on a note alone", () => {
    expect(roundTotal(6250, 250)).toBe(6250);
    expect(roundTotal(0, 250)).toBe(0);
  });

  it("rounds down below the halfway point", () => {
    expect(roundTotal(1624, 250)).toBe(1500);
    expect(roundTotal(1740, 250)).toBe(1750);
  });

  it("does nothing when the shop switches rounding off", () => {
    expect(roundTotal(1737, 0)).toBe(1737);
    expect(roundTotal(1737, 1)).toBe(1737);
  });

  it("never invents fractions of a dinar", () => {
    for (const value of [1, 7, 123, 999, 100001]) {
      expect(Number.isInteger(roundTotal(value, 250))).toBe(true);
    }
  });
});

describe("writing amounts", () => {
  it("groups thousands, because five figures is what gets misread", () => {
    expect(money(12750, "en")).toBe("12,750 IQD");
    expect(amount(12750)).toBe("12,750");
  });

  it("writes the dinar the way each counter reads it", () => {
    expect(money(250, "ar")).toBe("250 د.ع");
    expect(money(250, "ckb")).toBe("250 د.ع");
    expect(money(250, "en")).toBe("250 IQD");
  });

  it("keeps Latin digits in every language, to match the shelf label", () => {
    expect(money(750, "ar")).toContain("750");
    expect(money(750, "ckb")).toContain("750");
  });

  it("marks a negative amount once, on the front", () => {
    expect(money(-500, "en")).toBe("-500 IQD");
  });
});

describe("reading what a cashier typed", () => {
  it("accepts the separators people type out of habit", () => {
    expect(parseAmount("12,750")).toBe(12750);
    expect(parseAmount("12 750")).toBe(12750);
    expect(parseAmount("12.750")).toBe(12750);
  });

  it("treats an empty or nonsense entry as nothing, not NaN", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
  });
});

describe("the notes a drawer actually holds", () => {
  it("offers them largest first, so the common ones are reachable", () => {
    expect(IQD_NOTES[0]).toBe(50000);
    expect(IQD_NOTES[IQD_NOTES.length - 1]).toBe(250);
    expect([...IQD_NOTES].sort((a, b) => b - a)).toEqual(IQD_NOTES);
  });

  it("is made only of notes the rounding can give change in", () => {
    for (const note of IQD_NOTES) expect(note % 250).toBe(0);
  });
});
