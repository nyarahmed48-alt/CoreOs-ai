/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The backup has to survive the round trip, exactly.
 *
 * It is the only copy a shop has. A readable backup that cannot be restored
 * is worse than an unreadable one, so what is checked here is that the page
 * a shopkeeper opens still holds every record it went in with — including
 * the ones a shop's own typing could otherwise break.
 */

import { describe, expect, it } from "vitest";
import { backupPage, dataFromBackup } from "./backupFile";
import { defaultSettings, seedCategories, seedProducts } from "./seed";
import type { PosData, Sale } from "./types";

function sale(no: number, total: number, at: string): Sale {
  return {
    id: `s-${no}`,
    no,
    receiptNo: `T1-00${no}`,
    deviceId: "3NR-LET",
    at,
    lines: [{ id: `l-${no}`, productId: "p-1", name: "ماء 500 مل", price: total, qty: 1 }],
    subtotal: total,
    discount: 0,
    rounding: 0,
    total,
    method: "cash",
    tendered: total,
    change: 0,
    staffId: "",
    staffName: "",
    shiftId: "",
  };
}

function book(): PosData {
  return {
    version: 2,
    settings: {
      ...defaultSettings("ar"),
      shopName: "سوبرماركت أبو أحمد",
      tillId: "3NR-LET",
    },
    categories: seedCategories("ar"),
    products: seedProducts("ar"),
    staff: [],
    shifts: [],
    audit: [],
    customers: [],
    debts: [],
    closes: [],
    sales: [
      sale(1001, 3000, "2026-11-12T09:00:00.000Z"),
      sale(1002, 1500, "2026-11-12T11:00:00.000Z"),
      sale(1003, 2250, "2026-11-13T08:30:00.000Z"),
    ],
  };
}

describe("the backup a shop keeps", () => {
  it("comes back exactly as it went in", () => {
    const before = book();
    const after = JSON.parse(dataFromBackup(backupPage(before))) as PosData;
    expect(after).toEqual(before);
  });

  it("is a page a browser will open, not a wall of brackets", () => {
    const page = backupPage(book());
    expect(page.startsWith("<!doctype html>")).toBe(true);
    /* The things a shopkeeper should see without being taught anything. */
    expect(page).toContain("سوبرماركت أبو أحمد");
    expect(page).toContain("3NR-LET");
    expect(page).toContain("Sales");
    expect(page).toContain("Restore");
    /* And the same instruction in the language most of them read. */
    expect(page).toContain("النسخة الاحتياطية");
  });

  it("adds up the days for them", () => {
    const page = backupPage(book());
    /* Two sales on the 12th, one on the 13th. */
    expect(page).toContain("2026-11-12");
    expect(page).toContain("2026-11-13");
  });

  it("survives a product name that looks like code", () => {
    /* A shop can and will type anything into a product name. A name
       containing a closing script tag would end the data block early and
       quietly truncate the backup — which would be discovered on the day
       somebody needed it. */
    const before = book();
    before.products = [
      {
        ...before.products[0],
        name: '</script><script>alert("x")</script> & <b>عصير</b>',
      },
    ];
    const page = backupPage(before);
    const after = JSON.parse(dataFromBackup(page)) as PosData;
    expect(after.products[0].name).toBe(before.products[0].name);
    /* And nothing executable was written into the page itself. */
    expect(page).not.toContain('<script>alert("x")</script>');
  });

  it("still restores a plain .json backup from an older till", () => {
    /* Backups outlive the code that wrote them. A shop holding last year's
       file must still be able to put it back. */
    const before = book();
    const old = JSON.stringify(before, null, 2);
    expect(JSON.parse(dataFromBackup(old))).toEqual(before);
  });

  it("hands back rubbish unchanged, so the caller refuses it", () => {
    /* Not a backup at all: the till's own check is what says so, and the
       shop gets "that is not a till backup" rather than a crash. */
    expect(dataFromBackup("hello")).toBe("hello");
    expect(() => JSON.parse(dataFromBackup("<html>nope</html>"))).toThrow();
  });
});
