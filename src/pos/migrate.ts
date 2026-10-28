/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Moving a shop's books out of localStorage, once.
 *
 * This runs on a tablet that already has a year of trade on it, in a shop that
 * has no idea the storage underneath changed. It gets one chance.
 *
 * The rules it follows:
 *
 * **Count before you cut.** Everything is written to IndexedDB, then read back
 * and counted against what was in the blob. Only if every count matches is the
 * migration recorded as done.
 *
 * **Never delete the old copy.** The blob is renamed, not removed, even after
 * a clean migration. It costs a few hundred kilobytes once and it is the only
 * thing standing behind a bug nobody has found yet.
 *
 * **Keep the ids.** New records get full UUIDs from here on, but migrated ones
 * keep the ids they have. They are already unique inside this shop, and
 * rewriting them would mean rewriting every reference to them — in sales
 * lines, debts, audit entries, shifts — and a single missed reference is a
 * sale pointing at a product that no longer exists.
 *
 * **Finish or change nothing.** The whole import is one transaction. A tablet
 * switched off halfway leaves IndexedDB empty and the blob untouched, and the
 * next launch simply tries again.
 */

import { clearAll, countIn, readAll, write, type StoreName } from "./db";
import type { PosData, Sale } from "./types";

export const OLD_KEY = "coreos.pos.data.v1";
/** Where the old blob goes once it is safely copied. */
export const KEPT_KEY = "coreos.pos.data.v1.before-indexeddb";
export const SCHEMA = 2;

/** The stores that hold lists, and the field of PosData each one came from. */
const LISTS: { store: StoreName; field: keyof PosData }[] = [
  { store: "products", field: "products" },
  { store: "categories", field: "categories" },
  { store: "sales", field: "sales" },
  { store: "staff", field: "staff" },
  { store: "shifts", field: "shifts" },
  { store: "audit", field: "audit" },
  { store: "customers", field: "customers" },
  { store: "debts", field: "debts" },
  { store: "closes", field: "closes" },
];

export interface MigrationResult {
  ran: boolean;
  counts: Record<string, number>;
  problem?: string;
}

/** A receipt number a second tablet can never collide with: `T1-000123`. */
export function receiptNumber(prefix: string, no: number): string {
  return `${prefix}-${String(no).padStart(6, "0")}`;
}

/** Older sales predate both the till prefix and the device stamp; they get
    them now so every sale in the book reads the same way. */
function bringSaleForward(sale: Sale, prefix: string, deviceId: string): Sale {
  return {
    ...sale,
    receiptNo: sale.receiptNo ?? receiptNumber(prefix, sale.no),
    deviceId: sale.deviceId ?? deviceId,
    lines: sale.lines.map((line) => ({
      ...line,
      // Lines never had ids. They need them before they can be synced one by
      // one, and a line is identified by its sale and its product.
      id: line.id ?? `${sale.id}:${line.productId}`,
    })),
  };
}

/**
 * Counts what is actually in the database against what should be.
 *
 * Separate and exported because it is the one step that decides whether a
 * shop's old copy may be set aside, and a check that cannot be tested on its
 * own is a check nobody should trust.
 */
export async function verifyCounts(
  expected: Record<string, number>,
): Promise<string | null> {
  for (const [store, wanted] of Object.entries(expected)) {
    const found = await countIn(store as StoreName);
    if (found !== wanted) return `${store}: expected ${wanted}, found ${found}`;
  }
  return null;
}

export async function alreadyMigrated(): Promise<boolean> {
  try {
    const meta = await readAll<{ id: string; schema?: number }>("meta");
    return meta.some((row) => row.id === "schema" && (row.schema ?? 0) >= SCHEMA);
  } catch {
    return false;
  }
}

/**
 * Copies the blob into IndexedDB and proves it arrived.
 *
 * Returns what it found and what it wrote, so the caller can show a shop the
 * numbers rather than a spinner and a promise.
 */
export async function migrateFromLocalStorage(
  raw: string | null,
  parse: (raw: string | null) => PosData,
): Promise<MigrationResult> {
  const counts: Record<string, number> = {};

  if (!raw) {
    // Nothing to move: a new tablet. Record the schema so this never runs again.
    await write([{ store: "meta", put: [{ id: "schema", schema: SCHEMA, at: new Date().toISOString() }] }]);
    return { ran: false, counts };
  }

  const data = parse(raw);
  const prefix = data.settings.tillPrefix ?? "T1";
  const deviceId = data.settings.tillId;

  const changes = LISTS.map(({ store, field }) => {
    const rows = (data[field] as unknown[]) ?? [];
    counts[store] = rows.length;
    return {
      store,
      put: store === "sales"
        ? (rows as Sale[]).map((sale) => bringSaleForward(sale, prefix, deviceId))
        : rows,
    };
  });

  changes.push({ store: "settings", put: [{ id: "settings", ...data.settings }] });

  await write(changes);

  // Read it back. A write that reports success over a store that is empty is
  // exactly the failure this check exists for.
  const problem = await verifyCounts(counts);
  if (problem) return { ran: false, counts, problem };

  await write([
    {
      store: "meta",
      put: [
        {
          id: "schema",
          schema: SCHEMA,
          at: new Date().toISOString(),
          movedFrom: "localStorage",
          counts,
        },
      ],
    },
  ]);

  return { ran: true, counts };
}

/** Called only after the counts have been checked. Renames, never deletes. */
export function keepOldCopy(): void {
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (raw === null) return;
    localStorage.setItem(KEPT_KEY, raw);
    localStorage.removeItem(OLD_KEY);
  } catch {
    // If the old copy cannot be moved it simply stays where it is. The till
    // reads from IndexedDB now either way.
  }
}

/** Used by the tests, and by "wipe and start over". */
export async function wipeEverything(): Promise<void> {
  await clearAll();
}
