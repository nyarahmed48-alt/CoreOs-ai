/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The migration gets one chance on a tablet with a year of trade on it.
 *
 * These tests run it against a real IndexedDB implementation (fake-indexeddb,
 * in Node) rather than a stub, so the transaction semantics under test are the
 * ones the tablet will use.
 */

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { countIn, clearAll, readAll, write } from "./db";
import {
  alreadyMigrated,
  migrateFromLocalStorage,
  receiptNumber,
  SCHEMA,
  verifyCounts,
} from "./migrate";
import type { PosData, Sale } from "./types";
import { defaultSettings } from "./seed";

function book(sales: number, products: number): PosData {
  return {
    version: 1,
    settings: { ...defaultSettings("ar"), tillId: "ABC-DEF", tillPrefix: "T2", nextSaleNo: 1001 + sales },
    categories: [{ id: "c-1", name: "المشروبات" }],
    products: Array.from({ length: products }, (_, i) => ({
      id: `p-${i}`,
      name: `مادة ${i}`,
      barcode: `620000000${i}`,
      categoryId: "c-1",
      price: 250 * (i + 1),
      stock: 10,
      lowStockAt: -1,
      archived: false,
    })),
    sales: Array.from({ length: sales }, (_, i) => ({
      id: `s-${i}`,
      no: 1001 + i,
      at: new Date(Date.UTC(2026, 0, 1, 9, i % 60)).toISOString(),
      lines: [{ productId: "p-0", name: "مادة 0", price: 250, qty: 2 }],
      subtotal: 500,
      discount: 0,
      rounding: 0,
      total: 500,
      method: "cash" as const,
      tendered: 1000,
      change: 500,
      staffId: "",
      staffName: "",
      shiftId: "",
    })) as unknown as Sale[],
    staff: [],
    shifts: [],
    audit: [],
    customers: [],
    debts: [],
    closes: [],
  };
}

const parse = (raw: string | null): PosData => JSON.parse(raw ?? "{}") as PosData;

beforeEach(async () => {
  await clearAll();
});

describe("moving a shop off localStorage", () => {
  it("carries every record across and says what it moved", async () => {
    const result = await migrateFromLocalStorage(JSON.stringify(book(120, 40)), parse);

    expect(result.ran).toBe(true);
    expect(result.problem).toBeUndefined();
    expect(result.counts).toMatchObject({ sales: 120, products: 40, categories: 1 });
    expect(await countIn("sales")).toBe(120);
    expect(await countIn("products")).toBe(40);
  });

  it("does not lose a single sale out of a busy year", async () => {
    await migrateFromLocalStorage(JSON.stringify(book(5000, 500)), parse);
    expect(await countIn("sales")).toBe(5000);

    const sales = await readAll<Sale>("sales");
    const numbers = new Set(sales.map((sale) => sale.no));
    expect(numbers.size).toBe(5000);
  });

  it("gives older sales a receipt number and the tablet that rang them", async () => {
    await migrateFromLocalStorage(JSON.stringify(book(3, 2)), parse);
    const sales = await readAll<Sale>("sales");

    for (const sale of sales) {
      expect(sale.receiptNo).toBe(receiptNumber("T2", sale.no));
      expect(sale.deviceId).toBe("ABC-DEF");
      for (const line of sale.lines) expect(line.id).toBeTruthy();
    }
  });

  it("keeps the ids a shop's data already references", async () => {
    await migrateFromLocalStorage(JSON.stringify(book(2, 2)), parse);
    const sales = await readAll<Sale>("sales");
    // A line still points at the product it was sold from.
    expect(sales[0].lines[0].productId).toBe("p-0");
  });

  it("records the schema, so it never runs twice", async () => {
    expect(await alreadyMigrated()).toBe(false);
    await migrateFromLocalStorage(JSON.stringify(book(5, 5)), parse);
    expect(await alreadyMigrated()).toBe(true);

    const meta = await readAll<{ id: string; schema: number }>("meta");
    expect(meta.find((row) => row.id === "schema")?.schema).toBe(SCHEMA);
  });

  it("marks a brand new tablet as migrated without inventing data", async () => {
    const result = await migrateFromLocalStorage(null, parse);
    expect(result.ran).toBe(false);
    expect(await countIn("sales")).toBe(0);
    expect(await alreadyMigrated()).toBe(true);
  });
});

describe("when it is interrupted", () => {
  it("leaves nothing behind if the tablet dies mid-write", async () => {
    // The real failure: the transaction never completes. Nothing is committed,
    // the old blob is untouched, and the next launch starts over.
    const broken = { ...book(50, 10) };
    const raw = JSON.stringify(broken);

    const original = IDBTransaction.prototype.objectStore;
    let calls = 0;
    IDBTransaction.prototype.objectStore = function (name: string) {
      calls += 1;
      if (calls > 3) throw new Error("tablet switched off");
      return original.call(this, name);
    } as typeof original;

    await expect(migrateFromLocalStorage(raw, parse)).rejects.toThrow();
    IDBTransaction.prototype.objectStore = original;

    expect(await countIn("sales")).toBe(0);
    expect(await alreadyMigrated()).toBe(false);
  });

  it("runs cleanly on the next launch after an interruption", async () => {
    const raw = JSON.stringify(book(30, 5));
    const result = await migrateFromLocalStorage(raw, parse);

    expect(result.ran).toBe(true);
    expect(await countIn("sales")).toBe(30);
  });

  it("notices when a store comes up short, and names it", async () => {
    await migrateFromLocalStorage(JSON.stringify(book(10, 2)), parse);
    // Three sales go missing after the write — a disk that lied, or a store
    // that silently dropped them.
    await write([{ store: "sales", remove: ["s-0", "s-1", "s-2"] }]);

    const problem = await verifyCounts({ sales: 10, products: 2 });
    expect(problem).toBe("sales: expected 10, found 7");
  });

  it("passes when everything is where it should be", async () => {
    await migrateFromLocalStorage(JSON.stringify(book(10, 2)), parse);
    expect(await verifyCounts({ sales: 10, products: 2, categories: 1 })).toBeNull();
  });
});
