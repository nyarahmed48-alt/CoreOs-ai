/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Where a shop's books actually live.
 *
 * The till used to keep everything in one JSON string in localStorage and
 * rewrite the whole of it on every sale. At a thousand sales that is 400 kB
 * written each time a customer pays, at five thousand it is 1.7 MB, and
 * somewhere near fourteen thousand it stops working altogether because
 * localStorage is capped around five megabytes. A busy shop would have hit
 * that inside a year, mid-queue, with no warning but "storage full".
 *
 * So: IndexedDB, one record per sale. Ringing up a customer now writes that
 * sale, the products whose stock changed, and the settings row — a kilobyte
 * or two, regardless of how many years of trade sit behind it.
 *
 * Written by hand rather than with a wrapper library. It is eighty lines, it
 * ships to a 4GB tablet, and a dependency here would be carried by every shop
 * for ever.
 */

const DB_NAME = "corecashier";
const DB_VERSION = 1;

/** One store per kind of thing, so a sale can be written without touching the
    products beside it. */
export const STORES = [
  "products",
  "categories",
  "sales",
  "staff",
  "shifts",
  "audit",
  "customers",
  "debts",
  "closes",
  /** Single-row stores, keyed by a fixed name. */
  "settings",
  "meta",
] as const;

export type StoreName = (typeof STORES)[number];

let open: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (open) return open;
  open = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no IndexedDB"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("open failed"));
    request.onblocked = () => reject(new Error("blocked by another tab"));
  });
  return open;
}

function run<T>(
  db: IDBDatabase,
  names: StoreName[],
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction) => T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(names, mode);
    let result: T;
    try {
      result = work(tx);
    } catch (cause) {
      tx.abort();
      reject(cause);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error ?? new Error("transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });
}

export async function readAll<T>(name: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return run(db, [name], "readonly", (tx) => {
    const out: T[] = [];
    const request = tx.objectStore(name).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      out.push(cursor.value as T);
      cursor.continue();
    };
    return out;
  });
}

export async function countIn(name: StoreName): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction([name], "readonly").objectStore(name).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface Change {
  store: StoreName;
  put?: unknown[];
  remove?: string[];
}

/**
 * Everything a single action changed, written in one transaction.
 *
 * All of it lands or none of it does: a sale that took stock off the shelf can
 * never be recorded without the stock movement that went with it, whatever the
 * tablet does mid-write.
 */
export async function write(changes: Change[]): Promise<void> {
  const touched = [...new Set(changes.map((change) => change.store))];
  if (touched.length === 0) return;
  const db = await openDatabase();
  await run(db, touched, "readwrite", (tx) => {
    for (const change of changes) {
      const store = tx.objectStore(change.store);
      for (const record of change.put ?? []) store.put(record);
      for (const id of change.remove ?? []) store.delete(id);
    }
  });
}

export async function clearAll(): Promise<void> {
  const db = await openDatabase();
  await run(db, [...STORES], "readwrite", (tx) => {
    for (const name of STORES) tx.objectStore(name).clear();
  });
}

/**
 * Ask Android to stop clearing this.
 *
 * Without it the browser treats a till's books as cache and may evict them
 * when the tablet runs short of space — which on a 4GB device happens. It is a
 * request, not a guarantee: Chrome grants it readily to an installed app and
 * more grudgingly to a page, so the answer is reported rather than assumed.
 */
export async function askToPersist(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function spaceUsed(): Promise<{ used: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { used: usage, quota };
  } catch {
    return null;
  }
}
