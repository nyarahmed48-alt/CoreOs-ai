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
  AuditEntry,
  CartLine,
  Category,
  Customer,
  DebtEntry,
  PaymentMethod,
  PosData,
  Product,
  Sale,
  SaleLine,
  Settings,
  Shift,
  Staff,
} from "./types";
import {
  defaultSettings,
  seedCategories,
  seedProducts,
  seedShopText,
} from "./seed";
import { translate, type Lang } from "./i18n";
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

/** Arabic unless the shop says otherwise: most of these counters are in
    Baghdad, and a till that opens in English is a till somebody has to
    configure before they can sell anything. */
const FIRST_LANG: Lang = "ar";

function freshData(lang: Lang = FIRST_LANG): PosData {
  return {
    version: DATA_VERSION,
    settings: defaultSettings(lang),
    categories: seedCategories(lang),
    products: seedProducts(lang),
    sales: [],
    staff: [],
    shifts: [],
    audit: [],
    customers: [],
    debts: [],
  };
}

/** Reads the file, and repairs it rather than throwing: a till that refuses to
    open because one field is missing is worse than a till with a default in
    that field. */
function parseData(raw: string | null): PosData {
  if (!raw) return freshData();
  try {
    const parsed = JSON.parse(raw) as Partial<PosData>;
    const lang = parsed.settings?.lang ?? FIRST_LANG;
    return {
      version: DATA_VERSION,
      settings: { ...defaultSettings(lang), ...(parsed.settings ?? {}) },
      categories: parsed.categories ?? [],
      products: parsed.products ?? [],
      sales: parsed.sales ?? [],
      // Added after the first tills shipped; an older file simply has none.
      staff: parsed.staff ?? [],
      shifts: parsed.shifts ?? [],
      audit: parsed.audit ?? [],
      customers: parsed.customers ?? [],
      debts: parsed.debts ?? [],
    };
  } catch {
    return freshData();
  }
}

/** Storage can be full, or blocked outright — a private window, a browser set
    to block site data, or a page opened inside someone else's frame, where
    even *reading* localStorage throws rather than returning null. The sale in
    front of the cashier still has to complete, so every failure here is
    surfaced as a banner and the till carries on in memory. */
let writeError = "";

/* The language these messages are written in, kept beside them rather than
   read off `data`. The first of them can be raised while `data` is still being
   initialised — it is what a blocked read produces — and reaching for a
   variable that is still being assigned throws a second error on top of the
   first, which is how this screen once came up blank. */
let messageLang: Lang = FIRST_LANG;

function storageMessage(key: "store.noStorage" | "store.full"): string {
  return translate(messageLang, key);
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Touching localStorage at all can throw. Say so once, and carry on.
    writeError = storageMessage("store.noStorage");
    return null;
  }
}

const stored = read(DATA_KEY);
let data: PosData = parseData(stored);
messageLang = data.settings.lang;

/* A new install writes itself out immediately rather than waiting for the
   first edit. Until it does, every launch builds a fresh shop — including a
   fresh till number, and that number is what a shop reads down the phone to
   be activated or to get help. A till whose name changes each time it opens
   cannot be supported. */
if (!stored) persist(DATA_KEY, data);
let cart: CartLine[] = (() => {
  try {
    return (JSON.parse(read(CART_KEY) ?? "[]") ?? []) as CartLine[];
  } catch {
    return [];
  }
})();

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    writeError = "";
  } catch (cause) {
    // Out of room is a different problem from not being allowed in, and the
    // shop can only act on one of them.
    const full =
      cause instanceof DOMException &&
      (cause.name === "QuotaExceededError" ||
        cause.name === "NS_ERROR_DOM_QUOTA_REACHED");
    writeError = storageMessage(full ? "store.full" : "store.noStorage");
  }
}

function commit(next: PosData) {
  data = next;
  messageLang = next.settings.lang;
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
  commit(owned({
    ...data,
    products: exists
      ? data.products.map((p) => (p.id === product.id ? product : p))
      : [...data.products, product],
  }));
}

export function setArchived(id: string, archived: boolean) {
  commit(owned({
    ...data,
    products: data.products.map((p) => (p.id === id ? { ...p, archived } : p)),
  }));
}

/** Goods arriving from the supplier. Kept separate from editing the count by
    hand so the common case is one tap and cannot mistype the running total. */
export function receiveStock(id: string, units: number) {
  commit(owned({
    ...data,
    products: data.products.map((p) =>
      p.id === id ? { ...p, stock: p.stock + units } : p,
    ),
  }));
}

export function saveCategory(category: Category) {
  const exists = data.categories.some((c) => c.id === category.id);
  commit(owned({
    ...data,
    categories: exists
      ? data.categories.map((c) => (c.id === category.id ? category : c))
      : [...data.categories, category],
  }));
}

/** Refuses while anything is still filed under it — silently orphaning
    products is how a shelf goes missing from the till. */
export function deleteCategory(id: string): string | null {
  const inUse = data.products.filter(
    (p) => p.categoryId === id && !p.archived,
  ).length;
  if (inUse > 0) {
    return inUse === 1
      ? translate(data.settings.lang, "products.categoryInUseOne")
      : translate(data.settings.lang, "products.categoryInUse", { n: inUse });
  }
  commit(owned({ ...data, categories: data.categories.filter((c) => c.id !== id) }));
  return null;
}

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...data, settings: { ...data.settings, ...patch } });
}

/**
 * Switch the counter's language.
 *
 * While the shelf is still the sample one we shipped, it switches with the
 * language — a shop trying the till in Kurdish should not have to read its own
 * demo stock in Arabic. The moment the shop sells something or edits anything
 * the names are theirs, and this stops touching them.
 */
export function setLanguage(lang: Lang) {
  if (lang === data.settings.lang) return;
  if (!data.settings.sampleShop) {
    commit({ ...data, settings: { ...data.settings, lang } });
    return;
  }
  commit({
    ...data,
    settings: { ...data.settings, ...seedShopText(lang), lang },
    categories: seedCategories(lang),
    products: seedProducts(lang),
  });
}

/** Everything the shop does to its own catalogue says "these are mine now". */
function owned(next: PosData): PosData {
  return next.settings.sampleShop
    ? { ...next, settings: { ...next.settings, sampleShop: false } }
    : next;
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
  /** Required when the method is `later`: a sale on the book is owed by a
      name, or it is just money gone. */
  customer?: Customer;
}): Sale {
  const { totals, discount, method, tendered, customer } = input;
  const who = actor();
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
    tendered: method === "cash" ? tendered : method === "later" ? 0 : totals.total,
    change: method === "cash" ? Math.max(0, tendered - totals.total) : 0,
    staffId: who.id,
    staffName: who.name,
    shiftId: session?.shiftId ?? "",
    customerId: customer?.id,
    customerName: customer?.name,
  };

  const sold = new Map<string, number>();
  for (const line of totals.lines) {
    sold.set(line.productId, (sold.get(line.productId) ?? 0) + line.qty);
  }

  commit(owned({
    ...data,
    settings: { ...data.settings, nextSaleNo: data.settings.nextSaleNo + 1 },
    products: data.products.map((p) =>
      sold.has(p.id) ? { ...p, stock: p.stock - (sold.get(p.id) ?? 0) } : p,
    ),
    sales: [sale, ...data.sales],
    // A sale on the book is a line in that customer's page, written in the
    // same commit as the sale so the two can never disagree.
    debts:
      method === "later" && customer
        ? [
            {
              id: newId("d"),
              customerId: customer.id,
              at: new Date().toISOString(),
              kind: "owed" as const,
              amount: totals.total,
              saleId: sale.id,
              saleNo: sale.no,
              staffId: who.id,
              staffName: who.name,
              note: "",
            },
            ...data.debts,
          ]
        : data.debts,
  }));
  commitCart([]);
  log(
    method === "later" ? "debt" : "sale",
    method === "later"
      ? `#${sale.no} ${customer?.name ?? ""} ${sale.total}`
      : `#${sale.no} ${sale.total} ${method}`,
  );
  if (discount > 0) log("discount", `#${sale.no} ${discount}`);
  return sale;
}

/** Voiding is the only correction a market till needs: the goods come back,
    the money goes back, and the receipt number stays in the book so the
    sequence has no holes. */
export function voidSale(id: string, reason = "", approvedBy = "") {
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
      s.id === id
        ? {
            ...s,
            voidedAt: new Date().toISOString(),
            voidedBy: approvedBy,
            voidReason: reason,
          }
        : s,
    ),
    // A voided sale on the book was never owed.
    debts: data.debts.filter((entry) => entry.saleId !== id),
  });
  log("void", `#${sale.no} ${sale.total} — ${reason}`, approvedBy);
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
      return translate(data.settings.lang, "settings.badFile");
    }
    commit(parseData(raw));
    commitCart([]);
    return null;
  } catch {
    return translate(data.settings.lang, "settings.unreadable");
  }
}

export function resetToSeed() {
  commit(freshData());
  commitCart([]);
}

/* ------------------------------------------------------------------- staff */

/**
 * PINs.
 *
 * Hashed with a salt apiece, through the browser's own crypto where it exists
 * and a weaker fallback where it does not. Be clear about what this buys: it
 * stops a cashier reading a colleague's PIN off the screen or out of a backup
 * file. It does not stop whoever holds that file, and it is not meant to — the
 * point of the PIN is that the log below can say who did a thing.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const text = `${salt}:${pin}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(text),
      );
      return [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    // Older WebView, or a page the browser does not consider secure.
  }
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = (hash * 33) ^ text.charCodeAt(i);
  return `weak-${(hash >>> 0).toString(16)}`;
}

export function newSalt(): string {
  return newId("s").slice(2);
}

export async function saveStaff(input: {
  id?: string;
  name: string;
  role: Staff["role"];
  pin?: string;
}): Promise<void> {
  const existing = input.id ? data.staff.find((s) => s.id === input.id) : undefined;
  const salt = existing?.pinSalt ?? newSalt();
  const pinHash = input.pin
    ? await hashPin(input.pin, salt)
    : (existing?.pinHash ?? "");
  const person: Staff = {
    id: existing?.id ?? newId("u"),
    name: input.name.trim(),
    pinHash,
    pinSalt: salt,
    role: input.role,
    active: existing?.active ?? true,
  };
  const first = data.staff.length === 0;
  commit({
    ...data,
    settings: { ...data.settings, staffLogin: true },
    staff: existing
      ? data.staff.map((s) => (s.id === person.id ? person : s))
      : [...data.staff, person],
  });

  /* Adding the first person switches the till on to signing in. Whoever is
     standing there has just set it up and is plainly entitled to be at it, so
     they are signed in rather than locked out of the screen they are halfway
     through — otherwise the till bars the owner before they can add their
     cashier. The float is zero because nobody has counted the drawer; they can
     close the shift and open it properly when they do. */
  if (first && !session) startShift(person, 0);
}

export function setStaffActive(id: string, active: boolean) {
  commit({
    ...data,
    staff: data.staff.map((s) => (s.id === id ? { ...s, active } : s)),
  });
}

/** Who is at the counter. Kept beside the shop's data rather than inside it,
    so signing in on one tablet does not travel in a backup to another. */
const SESSION_KEY = "coreos.pos.session.v1";
let session: { staffId: string; shiftId: string } | null = (() => {
  try {
    const raw = read(SESSION_KEY);
    return raw ? (JSON.parse(raw) as { staffId: string; shiftId: string }) : null;
  } catch {
    return null;
  }
})();

function setSession(next: typeof session) {
  session = next;
  if (next) persist(SESSION_KEY, next);
  else {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear if storage is blocked; the session is memory-only.
    }
  }
  notify();
}

export function useSession(): { staff: Staff | null; shift: Shift | null } {
  const current = useSyncExternalStore(
    subscribe,
    () => session,
    () => session,
  );
  const posData = usePos();
  if (!current) return { staff: null, shift: null };
  return {
    staff: posData.staff.find((s) => s.id === current.staffId) ?? null,
    shift: posData.shifts.find((s) => s.id === current.shiftId) ?? null,
  };
}

/** The person a sale is recorded against. A shop that has not added anyone is
    its owner working alone, and is not asked to sign in. */
function actor(): { id: string; name: string } {
  if (!session) return { id: "", name: "" };
  const person = data.staff.find((s) => s.id === session?.staffId);
  return { id: person?.id ?? "", name: person?.name ?? "" };
}

export async function checkPin(staffId: string, pin: string): Promise<boolean> {
  const person = data.staff.find((s) => s.id === staffId);
  if (!person || !person.active) return false;
  return (await hashPin(pin, person.pinSalt)) === person.pinHash;
}

/** Any owner's PIN will do — approving a void is the owner's job, not one
    particular owner's. */
export async function findOwnerByPin(pin: string): Promise<Staff | null> {
  for (const person of data.staff) {
    if (person.role !== "owner" || !person.active) continue;
    if ((await hashPin(pin, person.pinSalt)) === person.pinHash) return person;
  }
  return null;
}

export function log(
  action: AuditEntry["action"],
  detail: string,
  approvedBy?: string,
) {
  const who = actor();
  const entry: AuditEntry = {
    id: newId("a"),
    at: new Date().toISOString(),
    staffId: who.id,
    staffName: who.name,
    action,
    detail,
    approvedBy,
  };
  commit({ ...data, audit: [entry, ...data.audit].slice(0, data.settings.auditKeep) });
}

function startShift(person: Staff, openingFloat: number) {
  const shift: Shift = {
    id: newId("sh"),
    staffId: person.id,
    staffName: person.name,
    openedAt: new Date().toISOString(),
    openingFloat,
  };
  commit({ ...data, shifts: [shift, ...data.shifts] });
  setSession({ staffId: person.id, shiftId: shift.id });
  log("shift-open", `float ${openingFloat}`);
  log("signed-in", person.role);
}

/** Signing in opens a shift, because a cashier at the counter with no shift
    open is a drawer nobody can count. */
export async function signIn(staffId: string, pin: string, openingFloat: number) {
  if (!(await checkPin(staffId, pin))) return false;
  const person = data.staff.find((s) => s.id === staffId);
  if (!person) return false;
  startShift(person, openingFloat);
  return true;
}

/** What the drawer should hold: the float, plus everything taken in cash on
    this shift. Sales on the book are not in it — that is the point of them. */
export function expectedCash(shiftId: string): number {
  const shift = data.shifts.find((s) => s.id === shiftId);
  if (!shift) return 0;
  const taken = data.sales
    .filter((sale) => sale.shiftId === shiftId && !sale.voidedAt && sale.method === "cash")
    .reduce((sum, sale) => sum + sale.total, 0);
  const collected = data.debts
    .filter((entry) => entry.kind === "paid" && entry.staffId === shift.staffId)
    .filter((entry) => entry.at >= shift.openedAt)
    .reduce((sum, entry) => sum + entry.amount, 0);
  return shift.openingFloat + taken + collected;
}

export function closeShift(countedCash: number) {
  if (!session) return;
  const shiftId = session.shiftId;
  const expected = expectedCash(shiftId);
  commit({
    ...data,
    shifts: data.shifts.map((shift) =>
      shift.id === shiftId
        ? { ...shift, closedAt: new Date().toISOString(), countedCash, expectedCash: expected }
        : shift,
    ),
  });
  log("shift-close", `counted ${countedCash}, expected ${expected}`);
  setSession(null);
}

export function signOut() {
  setSession(null);
}

/* ------------------------------------------------------------- debt book */

export function saveCustomer(input: { id?: string; name: string; phone: string }): Customer {
  const existing = input.id ? data.customers.find((c) => c.id === input.id) : undefined;
  const customer: Customer = {
    id: existing?.id ?? newId("c"),
    name: input.name.trim(),
    phone: input.phone.trim(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  commit({
    ...data,
    customers: existing
      ? data.customers.map((c) => (c.id === customer.id ? customer : c))
      : [...data.customers, customer],
  });
  return customer;
}

export function balanceOf(posData: PosData, customerId: string): number {
  return posData.debts
    .filter((entry) => entry.customerId === customerId)
    .reduce(
      (sum, entry) => sum + (entry.kind === "owed" ? entry.amount : -entry.amount),
      0,
    );
}

export function totalOwed(posData: PosData): number {
  return posData.customers.reduce(
    (sum, customer) => sum + Math.max(0, balanceOf(posData, customer.id)),
    0,
  );
}

/** Money against a tab. Cash in hand, so it belongs to the drawer count as
    much as a sale does. */
export function recordPayment(customerId: string, amount: number, note = "") {
  const who = actor();
  const customer = data.customers.find((c) => c.id === customerId);
  const entry: DebtEntry = {
    id: newId("d"),
    customerId,
    at: new Date().toISOString(),
    kind: "paid",
    amount,
    staffId: who.id,
    staffName: who.name,
    note,
  };
  commit({ ...data, debts: [entry, ...data.debts] });
  log("payment", `${customer?.name ?? customerId} paid ${amount}`);
}
