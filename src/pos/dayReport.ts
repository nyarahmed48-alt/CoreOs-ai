/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The end of the day, in a message an owner reads on their phone.
 *
 * Most shopkeepers here do not sit down with the till at closing. They lock
 * up, go home, and want to know what the day did — which is a WhatsApp
 * message, because that is where everything else in this business already
 * happens.
 *
 * Deliberately pure: data in, text out. No DOM, no storage, no sending. That
 * is so the same function can run on a server the day Cloud sync exists and
 * produce the identical message without a tablet being awake — the owner
 * with four shops wants four messages at nine, not four tablets somebody
 * remembered to tap.
 *
 * Two rules about the writing. Every line is one fact, and the number goes
 * at the end: Arabic and Kurdish run right to left, Latin digits run left to
 * right, and a line with a number in the middle comes out scrambled on some
 * phones. And nothing is padded or aligned — WhatsApp has no fixed-width
 * font, so columns that line up here do not line up there.
 *
 * Unlike the error log, this carries real trade: customer names, debts,
 * takings. That is correct — it goes to the shop's own owner, about their
 * own shop. It must never be pointed anywhere else.
 */

import type { Lang } from "./i18n";
import { money } from "./money";
import type { DebtEntry, PosData, Sale } from "./types";

export interface DaySummary {
  day: string;
  sales: number;
  takings: number;
  cash: number;
  card: number;
  onBook: number;
  voids: number;
  voidedValue: number;
  expectedCash: number;
  top: { name: string; qty: number }[];
  newDebts: { name: string; amount: number }[];
  owedInTotal: number;
  lowStock: { name: string; left: number }[];
}

const WORDS: Record<Lang, Record<string, string>> = {
  en: {
    nothing: "No sales today.",
    sales: "Sales",
    receipts: "Receipts",
    top: "Best sellers",
    cancelled: "Cancelled",
    cancelledValue: "Value of the cancelled",
    newDebts: "New debts today",
    owed: "Owed to the shop in total",
    cash: "Cash expected in the drawer",
    low: "Running out",
    none: "none",
  },
  ar: {
    nothing: "لا مبيعات اليوم.",
    sales: "المبيعات",
    receipts: "عدد الفواتير",
    top: "الأكثر مبيعاً",
    cancelled: "فواتير ملغاة",
    cancelledValue: "قيمة الملغاة",
    newDebts: "ديون جديدة اليوم",
    owed: "إجمالي الديون على الزبائن",
    cash: "النقد المتوقع في الدرج",
    low: "قارب على النفاد",
    none: "لا شيء",
  },
  ckb: {
    nothing: "ئەمڕۆ هیچ فرۆشتنێک نییە.",
    sales: "فرۆشتن",
    receipts: "ژمارەی وەسڵ",
    top: "زۆرترین فرۆش",
    cancelled: "وەسڵی هەڵوەشێنراو",
    cancelledValue: "بەهای هەڵوەشێنراوەکان",
    newDebts: "قەرزی نوێی ئەمڕۆ",
    owed: "کۆی قەرزی سەر کڕیاران",
    cash: "پارەی چاوەڕوانکراو لە سندوق",
    low: "خەریکە تەواو دەبێت",
    none: "هیچ",
  },
};

/** How the day is written at the top. Spelled out rather than 2026-11-15,
    because a date in digits is the one line an owner misreads. */
function dayName(day: string, lang: Lang): string {
  const [year, month, date] = day.split("-").map(Number);
  const when = new Date(year, month - 1, date);
  try {
    /* `-u-nu-latn` keeps the digits Latin. An Iraqi shelf label, price list
       and bank note are all written that way, and the rest of the app follows
       the same rule — see the note at the top of i18n.ts. */
    return when.toLocaleDateString(
      lang === "ar" ? "ar-IQ-u-nu-latn" : lang === "ckb" ? "ckb-u-nu-latn" : "en-GB",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    );
  } catch {
    return day;
  }
}

/**
 * Everything the message needs, worked out from the books.
 *
 * `belongsTo` is passed in rather than imported so this stays pure — the
 * caller knows the shop's day boundary, and a server calling it later will
 * know it too.
 */
export function summarise(
  data: PosData,
  day: string,
  belongsTo: (iso: string) => string,
): DaySummary {
  const ofDay = data.sales.filter((sale) => belongsTo(sale.at) === day);
  const counted = ofDay.filter((sale) => !sale.voidedAt);
  const voided = ofDay.filter((sale) => sale.voidedAt);
  const sum = (list: Sale[], pick: (sale: Sale) => number) =>
    list.reduce((total, sale) => total + pick(sale), 0);

  const byMethod = (method: Sale["method"]) =>
    sum(counted.filter((sale) => sale.method === method), (sale) => sale.total);

  /* Quantity, not money: the owner is asking what moved off the shelf, and
     one expensive thing outselling nothing is not a best seller. */
  const qty = new Map<string, number>();
  for (const sale of counted) {
    for (const line of sale.lines) {
      qty.set(line.name, (qty.get(line.name) ?? 0) + line.qty);
    }
  }
  const top = [...qty.entries()]
    .map(([name, count]) => ({ name, qty: count }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const names = new Map(data.customers.map((one) => [one.id, one.name]));
  const owedToday = data.debts.filter(
    (entry: DebtEntry) => entry.kind === "owed" && belongsTo(entry.at) === day,
  );
  const perCustomer = new Map<string, number>();
  for (const entry of owedToday) {
    const who = names.get(entry.customerId) ?? "—";
    perCustomer.set(who, (perCustomer.get(who) ?? 0) + entry.amount);
  }

  const owedInTotal = data.debts.reduce(
    (total, entry) => total + (entry.kind === "paid" ? -entry.amount : entry.amount),
    0,
  );

  const collected = data.debts
    .filter((entry) => entry.kind === "paid" && belongsTo(entry.at) === day)
    .reduce((total, entry) => total + entry.amount, 0);
  const openingFloat = data.shifts
    .filter((shift) => belongsTo(shift.openedAt) === day)
    .reduce((total, shift) => total + shift.openingFloat, 0);

  const lowStock = data.products
    .filter((product) => !product.archived)
    .filter((product) => {
      const mark = product.lowStockAt >= 0 ? product.lowStockAt : data.settings.lowStockAt;
      return mark > 0 && product.stock <= mark;
    })
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
    .map((product) => ({ name: product.name, left: product.stock }));

  return {
    day,
    sales: counted.length,
    takings: byMethod("cash") + byMethod("card") + byMethod("later"),
    cash: byMethod("cash"),
    card: byMethod("card"),
    onBook: byMethod("later"),
    voids: voided.length,
    voidedValue: sum(voided, (sale) => sale.total),
    expectedCash: openingFloat + byMethod("cash") + collected,
    top,
    newDebts: [...perCustomer.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
    owedInTotal,
    lowStock,
  };
}

/**
 * The sign-off, which says where the message came from when it is forwarded.
 *
 * Left off when the shop has not renamed itself yet, because the till ships
 * called "CoreCashier" and a message that both opens and closes with the
 * same word reads like a mistake.
 */
function signOff(shopName: string): string[] {
  return shopName.trim().toLowerCase() === "corecashier" ? [] : ["", "CoreCashier"];
}

/** The message itself. Plain text, short enough to read on a phone without
    scrolling twice. */
export function reportText(
  summary: DaySummary,
  shopName: string,
  lang: Lang,
): string {
  const w = WORDS[lang] ?? WORDS.en;
  const m = (value: number) => money(value, lang);
  const lines: string[] = [shopName, dayName(summary.day, lang), ""];

  if (summary.sales === 0 && summary.voids === 0) {
    /* A quiet day is a fact, not an empty message. An owner who gets a
       blank report assumes the app is broken and rings about that instead. */
    lines.push(w.nothing);
    if (summary.owedInTotal !== 0) {
      lines.push(`${w.owed}: ${m(summary.owedInTotal)}`);
    }
    lines.push(...signOff(shopName));
    return lines.join("\n");
  }

  /* One number per line, and at the end of it. Arabic and Kurdish run
     right to left while Latin digits run left to right, so a line with a
     figure in the middle and words after it comes out reordered on some
     phones — "9 — 27,000 المبيعات" is not something an owner should have to
     decipher at midnight. Two short lines always read correctly. */
  lines.push(`${w.sales}: ${m(summary.takings)}`);
  lines.push(`${w.receipts}: ${summary.sales}`);

  if (summary.top.length > 0) {
    lines.push("", `${w.top}:`);
    for (const one of summary.top) lines.push(`• ${one.name} — ${one.qty}`);
  }

  if (summary.voids > 0) {
    lines.push("", `${w.cancelled}: ${summary.voids}`);
    lines.push(`${w.cancelledValue}: ${m(summary.voidedValue)}`);
  }

  if (summary.newDebts.length > 0) {
    lines.push("", `${w.newDebts}:`);
    for (const one of summary.newDebts) lines.push(`• ${one.name} — ${m(one.amount)}`);
  }
  if (summary.owedInTotal !== 0) {
    lines.push(`${w.owed}: ${m(summary.owedInTotal)}`);
  }

  lines.push("", `${w.cash}: ${m(summary.expectedCash)}`);

  if (summary.lowStock.length > 0) {
    lines.push("", `${w.low}:`);
    for (const one of summary.lowStock) lines.push(`• ${one.name} — ${one.left}`);
  }

  lines.push(...signOff(shopName));
  return lines.join("\n");
}

/** Both halves at once, which is what every caller actually wants. */
export function buildDayReport(
  data: PosData,
  day: string,
  belongsTo: (iso: string) => string,
  lang: Lang,
): { summary: DaySummary; text: string } {
  const summary = summarise(data, day, belongsTo);
  return { summary, text: reportText(summary, data.settings.shopName, lang) };
}
