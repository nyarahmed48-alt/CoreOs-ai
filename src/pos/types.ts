/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export type PaymentMethod = "cash" | "card";

export interface Sale {
  id: string;
  /** Human-facing receipt number, sequential per shop. */
  no: number;
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
  /** Set when the sale is voided; the stock goes back on the shelf and the
      sale drops out of the day's totals but stays in the history. */
  voidedAt?: string;
}

export interface Settings {
  shopName: string;
  addressLine: string;
  phone: string;
  receiptFooter: string;
  /** Round the total to the nearest multiple of this. 0 turns rounding off.
      250 is the smallest note in ordinary circulation. */
  roundTo: number;
  /** Shop-wide low stock threshold, used by products that don't set their own. */
  lowStockAt: number;
  /** The number the next receipt will carry. */
  nextSaleNo: number;
}

export interface PosData {
  version: number;
  settings: Settings;
  categories: Category[];
  products: Product[];
  sales: Sale[];
}

/** A cart line before it becomes a sale line. Holds the product id so price
    and stock stay live until the sale is closed. */
export interface CartLine {
  productId: string;
  qty: number;
}
