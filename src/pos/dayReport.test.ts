/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The end-of-day message, checked against a day of real trade.
 *
 * The figures in this message are the ones an owner uses to decide whether
 * the drawer is short, so they are tested against a hand-built day where
 * every number is known in advance. Pure module, no browser, no database.
 */

import { describe, expect, it } from "vitest";
import { buildDayReport, reportText, summarise } from "./dayReport";
import { defaultSettings } from "./seed";
import { iraqiNumber, showNumber, whatsappLink } from "./whatsapp";
import type { DebtEntry, PosData, Sale, SaleLine } from "./types";

/** Midnight-to-midnight, which is what most shops run. */
const byCalendarDay = (iso: string) => iso.slice(0, 10);

function line(name: string, price: number, qty: number): SaleLine {
  return { id: `l-${name}-${qty}`, productId: `p-${name}`, name, price, qty };
}

let counter = 0;
function sale(at: string, lines: SaleLine[], over: Partial<Sale> = {}): Sale {
  counter += 1;
  const subtotal = lines.reduce((total, one) => total + one.price * one.qty, 0);
  return {
    id: `s${counter}`,
    no: counter,
    receiptNo: `T1-${String(counter).padStart(6, "0")}`,
    deviceId: "till-1",
    at,
    lines,
    subtotal,
    discount: 0,
    rounding: 0,
    total: subtotal,
    method: "cash",
    tendered: subtotal,
    change: 0,
    staffId: "st1",
    staffName: "Ali",
    shiftId: "sh1",
    ...over,
  };
}

function debt(at: string, customerId: string, amount: number, kind: DebtEntry["kind"]): DebtEntry {
  counter += 1;
  return {
    id: `d${counter}`,
    customerId,
    at,
    kind,
    amount,
    staffId: "st1",
    staffName: "Ali",
    note: "",
  };
}

/**
 * A full trading day: ten sales, one of them voided, two customers taking
 * goods on the book, one of them paying something off, and a shelf with two
 * items running out.
 */
function aDayOfTrade(): PosData {
  counter = 0;
  const day = "2026-11-14";
  const sales: Sale[] = [
    sale(`${day}T08:10:00`, [line("Bread", 500, 2)]),
    sale(`${day}T09:00:00`, [line("Tea", 1500, 1), line("Sugar", 1000, 2)]),
    sale(`${day}T10:15:00`, [line("Bread", 500, 4)]),
    sale(`${day}T11:30:00`, [line("Water", 250, 6)]),
    sale(`${day}T12:05:00`, [line("Tea", 1500, 2)], { method: "card", tendered: 3000 }),
    sale(`${day}T13:40:00`, [line("Bread", 500, 1), line("Water", 250, 2)]),
    sale(`${day}T15:00:00`, [line("Rice", 7000, 1)], {
      method: "later",
      customerId: "c1",
      customerName: "Abu Omar",
      tendered: 0,
    }),
    sale(`${day}T16:20:00`, [line("Oil", 5000, 1)], {
      method: "later",
      customerId: "c2",
      customerName: "Umm Sara",
      tendered: 0,
    }),
    sale(`${day}T17:45:00`, [line("Sugar", 1000, 3)]),
    /* The tenth is voided — the cashier rang up the wrong thing. It must
       leave the totals and still be reported as cancelled. */
    sale(`${day}T18:30:00`, [line("Rice", 7000, 2)], {
      voidedAt: `${day}T18:32:00`,
      voidedBy: "Owner",
      voidReason: "wrong item",
    }),
  ];

  return {
    version: 1,
    settings: { ...defaultSettings("en"), shopName: "Al-Noor Market", lowStockAt: 5 },
    categories: [{ id: "cat1", name: "Shelf" }],
    products: [
      mkProduct("p1", "Bread", 40),
      mkProduct("p2", "Tea", 2),
      mkProduct("p3", "Sugar", 0),
      mkProduct("p4", "Water", 60),
      mkProduct("p5", "Rice", 12),
      mkProduct("p6", "Oil", 4, 3),
    ],
    sales,
    staff: [],
    shifts: [
      {
        id: "sh1",
        staffId: "st1",
        staffName: "Ali",
        openedAt: `${day}T08:00:00`,
        openingFloat: 50_000,
      },
    ],
    audit: [],
    customers: [
      { id: "c1", name: "Abu Omar", phone: "", createdAt: `${day}T15:00:00` },
      { id: "c2", name: "Umm Sara", phone: "", createdAt: `${day}T16:20:00` },
    ],
    debts: [
      debt(`${day}T15:00:00`, "c1", 7000, "owed"),
      debt(`${day}T16:20:00`, "c2", 5000, "owed"),
      /* Money off an older tab, which belongs in the drawer but is not a
         sale — the one figure a day report normally gets wrong. */
      debt(`${day}T17:00:00`, "c1", 2000, "paid"),
      debt("2026-11-01T10:00:00", "c1", 9000, "owed"),
    ],
    closes: [],
  };
}

function mkProduct(id: string, name: string, stock: number, lowStockAt = -1) {
  return {
    id,
    name,
    barcode: "",
    categoryId: "cat1",
    price: 1000,
    stock,
    lowStockAt,
    archived: false,
  };
}

describe("the day's figures", () => {
  const summary = summarise(aDayOfTrade(), "2026-11-14", byCalendarDay);

  it("counts the sales that stood and leaves out the voided one", () => {
    expect(summary.sales).toBe(9);
    expect(summary.voids).toBe(1);
    expect(summary.voidedValue).toBe(14_000);
  });

  it("splits the takings by how they were paid", () => {
    /* 1000 + 3500 + 2000 + 1500 + 1000 + 3000 = 12,000 cash,
       3,000 on card, 12,000 on the book. */
    expect(summary.cash).toBe(12_000);
    expect(summary.card).toBe(3_000);
    expect(summary.onBook).toBe(12_000);
    expect(summary.takings).toBe(27_000);
  });

  it("expects the float, the cash taken and the debt collected in the drawer", () => {
    expect(summary.expectedCash).toBe(50_000 + 12_000 + 2_000);
  });

  it("does not count goods taken on the book as cash", () => {
    expect(summary.expectedCash).not.toContain?.(12_000);
    expect(summary.expectedCash).toBeLessThan(summary.takings + 50_000);
  });

  it("ranks best sellers by how many left the shelf, not by price", () => {
    expect(summary.top[0]).toEqual({ name: "Water", qty: 8 });
    expect(summary.top[1]).toEqual({ name: "Bread", qty: 7 });
    /* Rice is the most expensive thing in the shop and sold one unit, after
       the void. It must not head the list. */
    expect(summary.top[0].name).not.toBe("Rice");
    expect(summary.top.length).toBe(5);
  });

  it("names who took goods on the book today, and what is owed in total", () => {
    expect(summary.newDebts).toEqual([
      { name: "Abu Omar", amount: 7000 },
      { name: "Umm Sara", amount: 5000 },
    ]);
    /* 9,000 older + 7,000 + 5,000 taken today - 2,000 paid off. */
    expect(summary.owedInTotal).toBe(19_000);
  });

  it("lists what is running out, emptiest first, five at most", () => {
    expect(summary.lowStock).toEqual([
      { name: "Sugar", left: 0 },
      { name: "Tea", left: 2 },
    ]);
    /* Oil has 4 left but sets its own threshold of 3, so it is not low. */
    expect(summary.lowStock.map((one) => one.name)).not.toContain("Oil");
  });
});

describe("a shop whose day starts in the morning", () => {
  /* A café serving until two. Everything before 05:00 belongs to the night
     before, which is how the owner counts it. */
  const atFive = (iso: string) => {
    const at = new Date(iso);
    if (at.getHours() < 5) at.setDate(at.getDate() - 1);
    return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
  };

  it("counts a one-in-the-morning sale against the night before", () => {
    const data = aDayOfTrade();
    data.sales.push(sale("2026-11-15T01:20:00", [line("Tea", 1500, 2)]));

    const byClock = summarise(data, "2026-11-14", byCalendarDay);
    const byShop = summarise(data, "2026-11-14", atFive);

    expect(byClock.sales).toBe(9);
    expect(byShop.sales).toBe(10);
    expect(byShop.takings - byClock.takings).toBe(3000);
  });
});

describe("the message itself", () => {
  const data = aDayOfTrade();

  it("reads as whole lines with the number at the end", () => {
    for (const lang of ["en", "ar", "ckb"] as const) {
      const { text } = buildDayReport(data, "2026-11-14", byCalendarDay, lang);
      /* Past the shop name and the date, every line carries at most one
         figure and carries it at the end. A number in the middle of a
         right-to-left line is reordered by some phones. */
      for (const row of text.split("\n").slice(2)) {
        const figures = row.match(/[\d,]+/g) ?? [];
        expect(figures.length).toBeLessThan(2);
        if (figures.length === 1) {
          expect(row.replace(/\s*(IQD|د\.ع)\s*$/, "").trimEnd()).toMatch(/[\d,]$/);
        }
      }
    }
  });

  it("names the shop and signs off as CoreCashier", () => {
    const { text } = buildDayReport(data, "2026-11-14", byCalendarDay, "en");
    expect(text.startsWith("Al-Noor Market")).toBe(true);
    expect(text.trimEnd().endsWith("CoreCashier")).toBe(true);
  });

  it("writes the same figures in all three languages", () => {
    for (const lang of ["en", "ar", "ckb"] as const) {
      const { text } = buildDayReport(data, "2026-11-14", byCalendarDay, lang);
      expect(text).toContain("27,000");
      expect(text).toContain("64,000");
      expect(text).toContain("Abu Omar");
      expect(text).toContain("CoreCashier");
      /* Latin digits in every language — a cashier reads the screen against
         the shelf, and ٢٧ against 27 is a mistake waiting to happen. */
      expect(text).not.toMatch(/[٠-٩۰-۹]/);
    }
  });

  it("says so plainly when nothing sold, rather than sending a blank", () => {
    const quiet = summarise(aDayOfTrade(), "2026-11-13", byCalendarDay);
    expect(quiet.sales).toBe(0);
    const text = reportText(quiet, "Al-Noor Market", "en");
    expect(text).toContain("No sales today.");
    expect(text).toContain("CoreCashier");
    /* The tab still stands on a day the shop was shut. */
    expect(text).toContain("19,000");
    for (const lang of ["ar", "ckb"] as const) {
      expect(reportText(quiet, "متجر النور", lang).length).toBeGreaterThan(20);
    }
  });
});

describe("the owner's number", () => {
  it("takes it however a shopkeeper types it", () => {
    for (const typed of [
      "07701234567",
      "0770 123 4567",
      "0770-123-4567",
      "+964 770 123 4567",
      "00964 770 123 4567",
      "٠٧٧٠١٢٣٤٥٦٧",
      "۰۷۷۰۱۲۳۴۵۶۷",
    ]) {
      expect(iraqiNumber(typed)).toBe("+9647701234567");
    }
  });

  it("refuses what it cannot dial rather than guessing", () => {
    /* A landline, too short, too long, and empty. A report sent to a wrong
       number is worse than one not sent. */
    for (const bad of ["", "0123456789", "0770123", "077012345678", "hello"]) {
      expect(iraqiNumber(bad)).toBe("");
    }
  });

  it("shows it back the way they wrote it", () => {
    expect(showNumber("+9647701234567")).toBe("0770 123 4567");
  });

  it("builds a link that opens the right chat with the message typed", () => {
    const link = whatsappLink("totals", "+9647701234567");
    expect(link).toBe("https://wa.me/9647701234567?text=totals");
    /* No number is the chat picker, not a broken link. */
    expect(whatsappLink("totals")).toBe("https://wa.me/?text=totals");
  });
});

describe("a till nobody has renamed", () => {
  it("does not sign off with the same word it opened on", () => {
    const summary = summarise(aDayOfTrade(), "2026-11-14", byCalendarDay);
    /* The till ships called CoreCashier. Until the shop puts its own name
       in, a message that both opens and closes with it reads like a fault. */
    const fresh = reportText(summary, "CoreCashier", "en");
    expect(fresh.startsWith("CoreCashier")).toBe(true);
    expect(fresh.split("CoreCashier").length - 1).toBe(1);
    expect(reportText(summary, "Al-Noor Market", "en").trimEnd()).toMatch(/CoreCashier$/);
  });
});
