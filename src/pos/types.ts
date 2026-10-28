/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Lang } from "./i18n";

/**
 * The POS domain, in one file.
 *
 * Every amount in the system is a whole number of Iraqi dinars. There are no
 * decimals anywhere: fils have not been in circulation for decades, and
 * storing money as an integer means a day's takings can never drift by a
 * rounding error.
 */

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  /** As printed on the packet. Empty for loose goods that are picked by hand. */
  barcode: string;
  categoryId: string;
  /** Whole dinars. */
  price: number;
  /** Units on the shelf. Goes negative if the cashier oversells; that is a
      warning to count the shelf, not an error to block a sale on. */
  stock: number;
  /** Warn at or below this count. -1 means "use the shop default". */
  lowStockAt: number;
  /** Archived products stay in the file so old receipts still read correctly,
      but they leave the till grid. */
  archived: boolean;
}

/** A line is a copy, not a reference: a receipt from March must still show
    March's price even after the shelf price changes. */
export interface SaleLine {
  /** Its own identity, so a line can be synced and reconciled on its own.
      Older lines, written before this existed, are given one on migration. */
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
}

/** `later` is the debt book: the goods leave, the money does not, and the
    sale is owed by a named customer rather than taken. */
export type PaymentMethod = "cash" | "card" | "later";

export interface Sale {
  id: string;
  /** Counts up on this tablet alone. */
  no: number;
  /** What is printed and read out: `T1-000123`. Two tablets in one shop count
      separately, so without the prefix they would both print #1001 and the
      shop would have two different sales with the same receipt number. */
  receiptNo: string;
  /** Which tablet rang it up. Needed before several tills can sync into one
      set of books without arguing. */
  deviceId: string;
  /** ISO timestamp. */
  at: string;
  lines: SaleLine[];
  /** Sum of the lines, before the discount and the rounding. */
  subtotal: number;
  /** Whole dinars taken off the sale by the cashier. */
  discount: number;
  /** What rounding the total to the nearest note added or removed. */
  rounding: number;
  /** What the customer actually paid. */
  total: number;
  method: PaymentMethod;
  /** Cash handed over. Equals the total for a card sale. */
  tendered: number;
  change: number;
  /** Who rang it up. A copy of the name, not a reference: the log has to read
      correctly after a cashier leaves and is renamed or removed. */
  staffId: string;
  staffName: string;
  /** The shift this sale belongs to, so a drawer can be counted against it. */
  shiftId: string;
  /** Set when the sale is voided; the stock goes back on the shelf and the
      sale drops out of the day's totals but stays in the history. */
  voidedAt?: string;
  /** Voiding asks who approved it and why — the two questions an owner has
      when the day's takings are short. */
  voidedBy?: string;
  voidReason?: string;
  /** For a sale on the book: who owes it. */
  customerId?: string;
  customerName?: string;
}

/**
 * A person who works the counter.
 *
 * The PIN is kept as a hash with a salt. That is not real security — anyone
 * holding the backup file can do as they please, and the shop's own owner can
 * read everything — but it keeps a cashier from reading a colleague's PIN off
 * the screen or out of an export, and it is what makes the log below mean
 * something.
 */
export interface Staff {
  id: string;
  name: string;
  pinHash: string;
  pinSalt: string;
  /** An owner may void, discount, change prices and open Settings. A cashier
      may sell. */
  role: "owner" | "cashier";
  active: boolean;
}

/** What happened, who did it, and when. Written for the owner, not for us:
    every entry here is something that moves money or stock. */
export interface AuditEntry {
  id: string;
  at: string;
  staffId: string;
  staffName: string;
  action:
    | "signed-in"
    | "sale"
    | "void"
    | "discount"
    | "price"
    | "shift-open"
    | "shift-close"
    | "debt"
    | "payment";
  /** Already-formatted detail: receipt numbers, amounts, product names. */
  detail: string;
  /** The owner who approved it, where approval was needed. */
  approvedBy?: string;
}

/** One cashier's turn at the counter, opened with a float and closed with a
    count. The difference between what the drawer holds and what the till
    expected is the number this whole feature exists to produce. */
export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  openedAt: string;
  openingFloat: number;
  closedAt?: string;
  countedCash?: number;
  expectedCash?: number;
}

/**
 * The end of a trading day, written down.
 *
 * Not a shift: a shift is one cashier's turn, and a day is the shop's. This is
 * the figure an owner checks — what the till says it took against what is
 * actually in the drawer — and the rest is there to explain a difference
 * without going back through every sale.
 */
export interface DayClose {
  id: string;
  /** `2026-10-28`, the local day it covers. */
  day: string;
  closedAt: string;
  staffId: string;
  staffName: string;
  /** Signed off by this owner. */
  approvedBy: string;
  openingFloat: number;
  sales: number;
  gross: number;
  cash: number;
  card: number;
  onBook: number;
  discounts: number;
  voids: number;
  voidedValue: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
}

/** A name in the debt book. */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

/** A line in one customer's page of the book: goods taken, or money paid. */
export interface DebtEntry {
  id: string;
  customerId: string;
  at: string;
  kind: "owed" | "paid";
  amount: number;
  /** The sale that created it, for an owed line. */
  saleId?: string;
  saleNo?: number;
  /** As printed: `T1-001002`. A customer disputing a line on their tab holds
      the paper receipt, so the book has to show the same number back. */
  receiptNo?: string;
  staffId: string;
  staffName: string;
  note: string;
}

export interface Settings {
  /** The language the counter is worked in — the till, the receipts and the
      reports all follow it. */
  lang: Lang;
  shopName: string;
  addressLine: string;
  phone: string;
  receiptFooter: string;
  /** Round the total to the nearest multiple of this. 0 turns rounding off.
      250 is the smallest note in ordinary circulation. */
  roundTo: number;
  /** Shop-wide low stock threshold, used by products that don't set their own. */
  lowStockAt: number;
  /** The number the next receipt will carry on this tablet. */
  nextSaleNo: number;
  /** This till's mark on every receipt it prints — T1, T2, and so on. */
  tillPrefix: string;
  /** A short name for this installation, made on first run. Fifty tablets all
      called "the till" cannot be told apart in a support queue; this is what a
      shopkeeper reads down the phone, and what a report arrives under. */
  tillId: string;
  /** Where the "send report" button sends to. Set once, at setup. */
  supportPhone: string;
  /** Off until the shop adds its first person, so a one-person shop is never
      asked to sign in to its own till. */
  staffLogin: boolean;
  /** How much of the log to keep. Tablets are small and a busy counter writes
      a lot of it. */
  auditKeep: number;
  /** True while the shelf is still the sample one we shipped. It lets the
      sample products follow the language setting, and goes false for good the
      moment the shop sells something or edits anything — after that the names
      are the shop's own and nothing rewrites them. */
  sampleShop: boolean;
}

export interface PosData {
  version: number;
  settings: Settings;
  categories: Category[];
  products: Product[];
  sales: Sale[];
  staff: Staff[];
  shifts: Shift[];
  audit: AuditEntry[];
  customers: Customer[];
  debts: DebtEntry[];
  closes: DayClose[];
}

/** A cart line before it becomes a sale line. Holds the product id so price
    and stock stay live until the sale is closed. */
export interface CartLine {
  productId: string;
  qty: number;
}
