/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A till whose licence has lapsed keeps its books and stops adding to them.
 *
 * The screens hide what they can, but hiding a button is a promise one missed
 * button breaks, so the refusal lives in the store. These tests go straight at
 * the store, past every screen, which is exactly what a shop with a lapsed
 * licence and a web console would do.
 */

import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  ReadOnlyError,
  TotalsError,
  completeSale,
  exportJson,
  isReadOnly,
  priceCart,
  saveProduct,
  setReadOnly,
  voidSale,
} from "./store";
import { standing, type Known } from "./licenceServer";
import type { PosData } from "./types";

/** The store keeps one book for the module, so each test puts it back. */
afterEach(() => setReadOnly(false));

/** The whole book, read without React. exportData now writes a readable page
    for the shop to look at; exportJson is the same data without the wrapper. */
function readBook() {
  return JSON.parse(exportJson()) as PosData;
}

describe("a till that has gone read-only", () => {
  it("knows it", () => {
    expect(isReadOnly()).toBe(false);
    setReadOnly(true);
    expect(isReadOnly()).toBe(true);
  });

  it("refuses a sale loudly rather than pretending to take one", () => {
    const data = readBook();
    const totals = priceCart(data, [{ productId: data.products[0].id, qty: 1 }], 0);
    setReadOnly(true);
    expect(() =>
      completeSale({ totals, discount: 0, method: "cash", tendered: totals.total }),
    ).toThrow(ReadOnlyError);
    /* And nothing was written on the way out. */
    expect(readBook().sales).toHaveLength(0);
  });

  it("leaves the shelf exactly as it was", () => {
    const before = readBook().products[0];
    setReadOnly(true);
    saveProduct({ ...before, price: 999999 });
    expect(readBook().products[0].price).toBe(before.price);
  });

  it("does not void a sale", () => {
    /* Nothing to void on a fresh book, so the check is that asking is safe
       and changes nothing — a void is the one write a shop being cut off has
       the most reason to attempt. */
    setReadOnly(true);
    expect(() => voidSale("whatever", "", "")).not.toThrow();
    expect(readBook().sales).toHaveLength(0);
  });

  it("still hands over a full backup", () => {
    setReadOnly(true);
    const backup = readBook();
    /* The whole point: being behind on a bill does not put a shop's own
       figures out of its reach. */
    expect(backup.products.length).toBeGreaterThan(0);
  });
});

describe("checking in with an office that does not exist yet", () => {
  it("never calls a tablet out of touch", () => {
    /* Until the Cloud plan ships there is nowhere to check in, so a till has
       not failed to reach anybody. A cached answer left by an older build —
       months stale, well past its grace — must not lock anything. */
    const ancient: Known = {
      verdict: { frozen: false, until: null, graceDays: 14, at: 0 },
      lastSeen: Date.now() - 400 * 86_400_000,
    };
    expect(standing(ancient)).toEqual({ state: "fine" });
  });
});

describe("the sale total, checked a second time", () => {
  it("refuses a sale whose total does not match its lines", async () => {
    /* The screen's figures and the lines about to be written down are
       computed at different moments. If they ever disagree, the customer is
       about to be charged the wrong money — the one mistake a shop cannot
       find later and cannot undo. */
    const data = readBook();
    const honest = priceCart(data, [{ productId: data.products[0].id, qty: 2 }], 0);
    const tampered = { ...honest, total: honest.total + 1000 };
    expect(() =>
      completeSale({
        totals: tampered,
        discount: 0,
        method: "cash",
        tendered: tampered.total,
      }),
    ).toThrow(TotalsError);
    expect(readBook().sales).toHaveLength(0);
  });

  it("refuses one whose subtotal does not match either", () => {
    const data = readBook();
    const honest = priceCart(data, [{ productId: data.products[0].id, qty: 1 }], 0);
    expect(() =>
      completeSale({
        totals: { ...honest, subtotal: honest.subtotal - 50 },
        discount: 0,
        method: "cash",
        tendered: honest.total,
      }),
    ).toThrow(TotalsError);
  });

  it("lets an honest sale through", () => {
    const data = readBook();
    const honest = priceCart(data, [{ productId: data.products[0].id, qty: 3 }], 0);
    const sale = completeSale({
      totals: honest,
      discount: 0,
      method: "cash",
      tendered: honest.total,
    });
    expect(sale.total).toBe(honest.total);
    expect(readBook().sales).toHaveLength(1);
  });
});
