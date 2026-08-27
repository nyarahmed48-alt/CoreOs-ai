/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The whole till, in localStorage.
 *
 * There is no server: a market till has to keep ringing when the internet
 * drops, and a single shop on a single machine does not need one. Everything
 * lives under two keys and is read through `useSyncExternalStore`, so any
 * component can subscribe without prop-drilling and a second tab open on the
 * same till stays in step through the browser's `storage` event.
 *
 * The storage layer is deliberately the only place that knows about
 * localStorage. Putting a backend behind this later means rewriting this file
 * and nothing else.
 */

import { useSyncExternalStore } from "react";
import type {
  CartLine,
  Category,
  PaymentMethod,
  PosData,
  Product,
  Sale,
  SaleLine,
  Settings,
} from "./types";
import { DEFAULT_SETTINGS, SEED_CATEGORIES, seedProducts } from "./seed";
import { roundTotal } from "./money";

const DATA_KEY = "coreos.pos.data.v1";
const CART_KEY = "coreos.pos.cart.v1";
const DATA_VERSION = 1;

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

function freshData(): PosData {
  return {
    version: DATA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    categories: SEED_CATEGORIES.map((c) => ({ ...c })),
    products: seedProducts(),
    sales: [],
  };
}

/** Reads the file, and repairs it rather than throwing: a till that refuses to
    open because one field is missing is worse than a till with a default in
    that field. */
function parseData(raw: string | null): PosData {
  if (!raw) return freshData();
  try {
    const parsed = JSON.parse(raw) as Partial<PosData>;
    return {
      version: DATA_VERSION,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      categories: parsed.categories ?? [],
      products: parsed.products ?? [],
      sales: parsed.sales ?? [],
    };
  } catch {
    return freshData();
  }
}

let data: PosData = parseData(
  typeof localStorage === "undefined" ? null : localStorage.getItem(DATA_KEY),
);
let cart: CartLine[] = (() => {
  if (typeof localStorage === "undefined") return [];
  try {
    return (JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") ??
      []) as CartLine[];
  } catch {
    return [];
  }
})();

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Storage can be full or blocked (private windows). The sale in front of the
    cashier still has to complete, so a failed write is surfaced rather than
    thrown. */
let writeError = "";

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    writeError = "";
  } catch {
    writeError =
      "This browser is refusing to save. Sales are being kept in memory only — export a backup and free some space.";
  }
}

function commit(next: PosData) {
  data = next;
  persist(DATA_KEY, data);
  notify();
}

function commitCart(next: CartLine[]) {
  cart = next;
  persist(CART_KEY, cart);
  notify();
}

if (typeof window !== "undefined") {
  // A second tab on the same till: pick up its writes instead of overwriting
  // them on the next action.
  window.addEventListener("storage", (event) => {
    if (event.key === DATA_KEY) {
      data = parseData(event.newValue);
      notify();
    }
    if (event.key === CART_KEY) {
      try {
        cart = (JSON.parse(event.newValue ?? "[]") ?? []) as CartLine[];
      } catch {
        cart = [];
      }
      notify();
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePos(): PosData {
  return useSyncExternalStore(
    subscribe,
    () => data,
    () => data,
  );
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    subscribe,
    () => cart,
    () => cart,
  );
}

export function useWriteError(): string {
  return useSyncExternalStore(
    subscribe,
    () => writeError,
    () => writeError,
  );
}

/* ---------------------------------------------------------------- catalogue */

export function saveProduct(product: Product) {
  const exists = data.products.some((p) => p.id === product.id);
  commit({
    ...data,
    products: exists
      ? data.products.map((p) => (p.id === product.id ? product : p))
      : [...data.products, product],
  });
}

export function setArchived(id: string, archived: boolean) {
  commit({
    ...data,
    products: data.products.map((p) => (p.id === id ? { ...p, archived } : p)),
  });
}

/** Goods arriving from the supplier. Kept separate from editing the count by
    hand so the common case is one tap and cannot mistype the running total. */
export function receiveStock(id: string, units: number) {
  commit({
    ...data,
    products: data.products.map((p) =>
      p.id === id ? { ...p, stock: p.stock + units } : p,
    ),
  });
}

export function saveCategory(category: Category) {
  const exists = data.categories.some((c) => c.id === category.id);
  commit({
    ...data,
    categories: exists
      ? data.categories.map((c) => (c.id === category.id ? category : c))
      : [...data.categories, category],
  });
}

/** Refuses while anything is still filed under it — silently orphaning
    products is how a shelf goes missing from the till. */
export function deleteCategory(id: string): string | null {
  const inUse = data.products.filter(
    (p) => p.categoryId === id && !p.archived,
  ).length;
  if (inUse > 0) {
    return `${inUse} product${inUse === 1 ? "" : "s"} still in this category. Move them first.`;
  }
  commit({ ...data, categories: data.categories.filter((c) => c.id !== id) });
  return null;
}

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...data, settings: { ...data.settings, ...patch } });
}

/* --------------------------------------------------------------------- cart */

export function addToCart(productId: string, qty = 1) {
  const line = cart.find((l) => l.productId === productId);
  commitCart(
    line
      ? cart.map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + qty } : l,
        )
      : [...cart, { productId, qty }],
  );
}

export function setQty(productId: string, qty: number) {
  if (qty <= 0) {
    commitCart(cart.filter((l) => l.productId !== productId));
    return;
  }
  commitCart(
    cart.map((l) => (l.productId === productId ? { ...l, qty } : l)),
  );
}

export function clearCart() {
  commitCart([]);
}

/* -------------------------------------------------------------------- sales */

export interface CartTotals {
  lines: SaleLine[];
  count: number;
  subtotal: number;
  rounding: number;
  total: number;
}

/** Prices the cart against the catalogue as it stands right now, so a price
    corrected in the Products tab is reflected in an open basket. */
export function priceCart(
  posData: PosData,
  cartLines: CartLine[],
  discount: number,
): CartTotals {
  const lines: SaleLine[] = [];
  for (const line of cartLines) {
    const product = posData.products.find((p) => p.id === line.productId);
    if (!product) continue;
    lines.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: line.qty,
    });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const total = roundTotal(afterDiscount, posData.settings.roundTo);
  return {
    lines,
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotal,
    rounding: total - afterDiscount,
    total,
  };
}

/** Closes the sale: writes the receipt, takes the stock off the shelf, moves
    the receipt number on and empties the basket. One commit, so a crash
    mid-way cannot leave a sale recorded but the stock untouched. */
export function completeSale(input: {
  totals: CartTotals;
  discount: number;
  method: PaymentMethod;
  tendered: number;
}): Sale {
  const { totals, discount, method, tendered } = input;
  const sale: Sale = {
    id: newId("s"),
    no: data.settings.nextSaleNo,
    at: new Date().toISOString(),
    lines: totals.lines,
    subtotal: totals.subtotal,
    discount,
    rounding: totals.rounding,
    total: totals.total,
    method,
    tendered: method === "cash" ? tendered : totals.total,
    change: method === "cash" ? Math.max(0, tendered - totals.total) : 0,
  };

  const sold = new Map<string, number>();
  for (const line of totals.lines) {
    sold.set(line.productId, (sold.get(line.productId) ?? 0) + line.qty);
  }

  commit({
    ...data,
    settings: { ...data.settings, nextSaleNo: data.settings.nextSaleNo + 1 },
    products: data.products.map((p) =>
      sold.has(p.id) ? { ...p, stock: p.stock - (sold.get(p.id) ?? 0) } : p,
    ),
    sales: [sale, ...data.sales],
  });
  commitCart([]);
  return sale;
}

/** Voiding is the only correction a market till needs: the goods come back,
    the money goes back, and the receipt number stays in the book so the
    sequence has no holes. */
export function voidSale(id: string) {
  const sale = data.sales.find((s) => s.id === id);
  if (!sale || sale.voidedAt) return;

  const returned = new Map<string, number>();
  for (const line of sale.lines) {
    returned.set(line.productId, (returned.get(line.productId) ?? 0) + line.qty);
  }

  commit({
    ...data,
    products: data.products.map((p) =>
      returned.has(p.id) ? { ...p, stock: p.stock + (returned.get(p.id) ?? 0) } : p,
    ),
    sales: data.sales.map((s) =>
      s.id === id ? { ...s, voidedAt: new Date().toISOString() } : s,
    ),
  });
}

/* ------------------------------------------------------------------- backup */

export function exportData(): string {
  return JSON.stringify(data, null, 2);
}

/** Replaces everything. The caller has already warned; this only refuses a
    file that is not a till. */
export function importData(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PosData>;
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.sales)) {
      return "That file does not look like a till backup.";
    }
    commit(parseData(raw));
    commitCart([]);
    return null;
  } catch {
    return "That file could not be read.";
  }
}

export function resetToSeed() {
  commit(freshData());
  commitCart([]);
}
