/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Cloud edition's half of the conversation with the office.
 *
 * Written against Supabase's REST and auth endpoints with plain `fetch`,
 * rather than with the official client library. The till ships as one HTML
 * file onto a 4GB tablet, and the library brings a realtime websocket stack
 * and a storage client that this never touches — a hundred kilobytes carried
 * by every shop for ever to save about eighty lines here. The endpoints are
 * stable and documented, and the eighty lines are below.
 *
 * Three rules shape all of it, and they are the same three that shaped the
 * licence:
 *
 * **The shop keeps selling when the connection drops.** Nothing here is on
 * the path between a cashier pressing Charge and a receipt coming out. Sales
 * are written to the tablet first and pushed afterwards, whenever the network
 * next exists. That is most of the day in these shops.
 *
 * **Pushing twice is free.** Every table is keyed by (shop, record id) and
 * every push is an upsert, because a push that dies halfway through is the
 * normal case here, not the exception. The till re-sends and the office ends
 * up with one copy.
 *
 * **The office decides, the shop reports.** A till can write its own books
 * and read its own standing. It cannot write its standing: whether a shop is
 * frozen lives in a column only CoreOs can set. That is enforced in the
 * database by row-level security, not here — anything enforced only in this
 * file is enforced only until somebody edits this file.
 */

import { SUPABASE_KEY, SUPABASE_URL } from "./cloudConfig";
import { scoped } from "./edition";
import type { PosData } from "./types";

export type CloudFault =
  /** No network, or the office is down. Never fatal: the till carries on. */
  | "offline"
  /** Wrong email or password. */
  | "badLogin"
  /** Signed in, but this account has not been put with a shop yet. */
  | "noShop"
  /** Signed in once, but the session has gone and cannot be renewed. */
  | "signedOut"
  | "server";

export class CloudError extends Error {
  constructor(readonly fault: CloudFault) {
    super(fault);
    this.name = "CloudError";
  }
}

export interface Session {
  access: string;
  refresh: string;
  /** Epoch milliseconds. */
  expires: number;
  email: string;
}

export interface Shop {
  id: string;
  name: string;
  frozen: boolean;
  frozenMessage: string;
  until: number | null;
  graceDays: number;
}

const SESSION_KEY = scoped("coreos.pos.cloud.session.v1");
const SHOP_KEY = scoped("coreos.pos.cloud.shop.v1");
const OUTBOX_KEY = scoped("coreos.pos.cloud.outbox.v1");

/* ---------------------------------------------------------------- storage */

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A till that cannot remember being signed in asks again. Survivable.
  }
}

function drop(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to drop.
  }
}

export function session(): Session | null {
  return read<Session>(SESSION_KEY);
}

/** The shop this till last knew itself to belong to. Cached so a till with no
    connection still knows whose books it is holding. */
export function knownShop(): Shop | null {
  return read<Shop>(SHOP_KEY);
}

export function signOut() {
  drop(SESSION_KEY);
  drop(SHOP_KEY);
  drop(OUTBOX_KEY);
}

/* ------------------------------------------------------------------- wire */

async function call(
  path: string,
  options: { method?: string; body?: unknown; token?: string; headers?: Record<string, string> } = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    /* No network, DNS gone, captive portal, the office down. All the same
       thing from here, and none of them is the shop's problem. */
    throw new CloudError("offline");
  }

  if (response.status === 401 || response.status === 403) {
    throw new CloudError("signedOut");
  }
  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      throw new CloudError("badLogin");
    }
    throw new CloudError("server");
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

interface TokenReply {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: { email?: string };
}

function keep(reply: TokenReply, email: string): Session {
  const next: Session = {
    access: reply.access_token,
    refresh: reply.refresh_token,
    /* A minute early, so a request never goes out with a token that expires
       while it is in flight. */
    expires: Date.now() + (reply.expires_in - 60) * 1000,
    email: reply.user?.email ?? email,
  };
  write(SESSION_KEY, next);
  return next;
}

/** A live access token, renewed if it has run out. */
async function token(): Promise<string> {
  const current = session();
  if (!current) throw new CloudError("signedOut");
  if (current.expires > Date.now()) return current.access;

  try {
    const reply = (await call("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: current.refresh },
    })) as TokenReply;
    return keep(reply, current.email).access;
  } catch (problem) {
    /* A refresh that fails because there is no network is not a sign-out —
       the till keeps the session and tries again later. One the office
       rejects is. */
    if (problem instanceof CloudError && problem.fault === "offline") throw problem;
    throw new CloudError("signedOut");
  }
}

/* ------------------------------------------------------------- signing in */

export async function signIn(email: string, password: string): Promise<Shop> {
  const reply = (await call("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: email.trim(), password },
  })) as TokenReply;
  keep(reply, email.trim());
  return refreshShop();
}

interface ShopRow {
  id: string;
  name: string;
  frozen: boolean;
  frozen_message: string;
  until: string | null;
  grace_days: number;
}

/** Who this till belongs to, from the office. */
export async function refreshShop(): Promise<Shop> {
  const rows = (await call("/rest/v1/cc_shop?select=*&limit=1", {
    token: await token(),
  })) as ShopRow[] | null;

  const row = rows?.[0];
  /* Signed in, but nobody has put this account with a shop. The shop cannot
     fix that from here; CoreOs has to. */
  if (!row) throw new CloudError("noShop");

  const shop: Shop = {
    id: row.id,
    name: row.name,
    frozen: Boolean(row.frozen),
    frozenMessage: row.frozen_message ?? "",
    until: row.until ? Date.parse(row.until) : null,
    graceDays: row.grace_days ?? 14,
  };
  write(SHOP_KEY, shop);
  return shop;
}

/** Tells the office this tablet exists and is awake. */
export async function announceTill(tillId: string, label: string, build: string) {
  const shop = knownShop();
  if (!shop) return;
  await call("/rest/v1/cc_till", {
    method: "POST",
    token: await token(),
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: [
      {
        id: tillId,
        shop_id: shop.id,
        label,
        build,
        last_seen: new Date().toISOString(),
      },
    ],
  });
}

/* ------------------------------------------------------------- the outbox */

/**
 * What this till has changed but not yet pushed.
 *
 * Kept as a plain list of `store:id` rather than in the database, so that a
 * sale is never held up waiting on a second write. It can be lost — cleared
 * storage, a browser being tidy — and losing it costs nothing but a full
 * push, which is idempotent.
 */
type Pending = string[];

export function pending(): Pending {
  return read<Pending>(OUTBOX_KEY) ?? [];
}

export function markPending(entries: string[]) {
  if (entries.length === 0) return;
  const now = new Set(pending());
  for (const entry of entries) now.add(entry);
  /* A till that has been off the network for a month has a long list, and a
     list long enough to fill storage would start breaking sales. Past this,
     throw it away and let the next sync push everything. */
  write(OUTBOX_KEY, now.size > 5000 ? [] : [...now]);
}

function clearPending(done: string[]) {
  const left = new Set(pending());
  for (const entry of done) left.delete(entry);
  write(OUTBOX_KEY, [...left]);
}

/* -------------------------------------------------------------- the books */

function sales(data: PosData, shopId: string, only?: Set<string>) {
  return data.sales
    .filter((sale) => !only || only.has(sale.id))
    .map((sale) => ({
      shop_id: shopId,
      id: sale.id,
      till_id: sale.deviceId ?? "",
      receipt_no: sale.receiptNo ?? "",
      at: sale.at,
      subtotal: sale.subtotal,
      discount: sale.discount,
      rounding: sale.rounding,
      total: sale.total,
      method: sale.method,
      tendered: sale.tendered,
      change_given: sale.change,
      staff_name: sale.staffName ?? "",
      voided_at: sale.voidedAt ?? null,
      void_reason: sale.voidReason ?? "",
      lines: sale.lines,
    }));
}

function products(data: PosData, shopId: string, only?: Set<string>) {
  return data.products
    .filter((product) => !only || only.has(product.id))
    .map((product) => ({
      shop_id: shopId,
      id: product.id,
      name: product.name,
      barcode: product.barcode ?? "",
      price: product.price,
      stock: product.stock,
      archived: Boolean(product.archived),
    }));
}

function debts(data: PosData, shopId: string, only?: Set<string>) {
  const names = new Map(data.customers.map((one) => [one.id, one]));
  return data.debts
    .filter((entry) => !only || only.has(entry.id))
    .map((entry) => ({
      shop_id: shopId,
      id: entry.id,
      customer_name: names.get(entry.customerId)?.name ?? "",
      customer_phone: names.get(entry.customerId)?.phone ?? "",
      /* One signed column rather than a kind: a tab is the sum of its lines,
         and a reader who has to know the word "owed" to add them up will get
         it wrong one day. */
      amount: entry.kind === "paid" ? -entry.amount : entry.amount,
      note: entry.note ?? "",
      receipt_no: entry.receiptNo ?? "",
      at: entry.at,
    }));
}

function closes(data: PosData, shopId: string, only?: Set<string>) {
  return data.closes
    .filter((close) => !only || only.has(close.id))
    .map((close) => ({
      shop_id: shopId,
      id: close.id,
      till_id: data.settings.tillId,
      day: close.day,
      closed_at: close.closedAt,
      staff_name: close.staffName ?? "",
      sales_count: close.sales,
      takings: close.gross,
      counted_cash: close.countedCash,
      difference: close.difference,
    }));
}

const TABLES = ["cc_sale", "cc_product", "cc_debt", "cc_close"] as const;

/** Rows go up in batches. One request with four thousand sales in it times
    out on a connection like this and has to start again from nothing. */
const BATCH = 200;

async function upsert(table: string, rows: unknown[]) {
  for (let at = 0; at < rows.length; at += BATCH) {
    await call(`/rest/v1/${table}`, {
      method: "POST",
      token: await token(),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: rows.slice(at, at + BATCH),
    });
  }
}

export interface Pushed {
  sales: number;
  products: number;
  debts: number;
  closes: number;
}

/**
 * Sends the shop's books to the office.
 *
 * `everything` is the first upload and the repair: it pushes the whole book
 * regardless of what the outbox says, which is what an offline till moving
 * onto the Cloud plan needs, and what fixes a till whose outbox was lost.
 * Otherwise only what has changed goes.
 */
export async function pushBook(data: PosData, everything = false): Promise<Pushed> {
  const shop = knownShop();
  if (!shop) throw new CloudError("noShop");

  const waiting = pending();
  const only = everything ? undefined : new Set(waiting.map((entry) => entry.split(":")[1]));
  if (!everything && waiting.length === 0) {
    return { sales: 0, products: 0, debts: 0, closes: 0 };
  }

  const batches = [
    sales(data, shop.id, only),
    products(data, shop.id, only),
    debts(data, shop.id, only),
    closes(data, shop.id, only),
  ];

  for (let i = 0; i < TABLES.length; i++) {
    if (batches[i].length > 0) await upsert(TABLES[i], batches[i]);
  }

  /* Cleared only once every table is through. A push that died on the third
     table has to be able to run again. */
  if (everything) {
    write(OUTBOX_KEY, []);
  } else {
    clearPending(waiting);
  }

  return {
    sales: batches[0].length,
    products: batches[1].length,
    debts: batches[2].length,
    closes: batches[3].length,
  };
}

/* ------------------------------------------------------------- the office */

export interface CloudStanding {
  frozen: boolean;
  message: string;
  until: number | null;
  graceDays: number;
}

/** One round trip: may this till still sell, and what should it say if not. */
export async function checkStanding(): Promise<CloudStanding> {
  const rows = (await call("/rest/v1/rpc/cc_standing", {
    method: "POST",
    token: await token(),
    body: {},
  })) as
    | { frozen: boolean; until: string | null; grace_days: number; message: string }[]
    | null;

  const row = rows?.[0];
  if (!row) throw new CloudError("noShop");

  const standing: CloudStanding = {
    frozen: Boolean(row.frozen),
    message: row.message ?? "",
    until: row.until ? Date.parse(row.until) : null,
    graceDays: row.grace_days ?? 14,
  };

  const shop = knownShop();
  if (shop) {
    write(SHOP_KEY, {
      ...shop,
      frozen: standing.frozen,
      frozenMessage: standing.message,
      until: standing.until,
      graceDays: standing.graceDays,
    });
  }
  return standing;
}
