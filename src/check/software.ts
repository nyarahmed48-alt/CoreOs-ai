/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The checks that look at the software rather than the metal.
 *
 * These are the ones that catch a tablet which passes every hardware test
 * and still cannot run a shop. A tablet with a browser too old for WebCrypto
 * will never activate a licence. A tablet whose storage Android is free to
 * evict will lose a year of sales the first time it runs low on space, and
 * nothing before that moment will look wrong. A tablet whose clock is a day
 * out will reject every technician key it is handed.
 *
 * None of that is visible to a shopkeeper, and none of it shows up in a
 * speed test. It is the reason this section exists.
 *
 * Everything here is measured, never assumed: the storage test really writes
 * and reads back, the clock is compared against a server's own header, and
 * an API that is missing is reported as missing rather than guessed at.
 */

import { SOFTWARE, type Verdict } from "./standard";
import type { Result } from "./probes";

const no = (id: string, because: string): Result => ({
  id,
  verdict: "untested",
  reading: "—",
  because,
});

/* --------------------------------------------------------- what is there */

/**
 * The APIs the till is built on, and what the shop loses without each.
 *
 * `fatal` means the till genuinely cannot work: not degraded, not awkward —
 * will not sell. Those are the ones worth a P1 code on a report.
 */
const NEEDED: {
  id: string;
  label: string;
  fatal: boolean;
  has: () => boolean;
}[] = [
  {
    id: "crypto",
    label: "secure crypto",
    fatal: true,
    /* The licence and every technician key are signatures. Without this the
       till cannot be activated at all, and nothing else on this report
       matters. */
    has: () => typeof crypto !== "undefined" && Boolean(crypto.subtle),
  },
  {
    id: "indexeddb",
    label: "the database",
    fatal: true,
    has: () => typeof indexedDB !== "undefined",
  },
  {
    id: "localstorage",
    label: "settings storage",
    fatal: true,
    has: () => {
      try {
        const probe = "coreos.check.probe";
        localStorage.setItem(probe, "1");
        localStorage.removeItem(probe);
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    id: "camera",
    label: "the camera",
    fatal: false,
    has: () => Boolean(navigator.mediaDevices?.getUserMedia),
  },
  {
    id: "bluetooth",
    label: "Bluetooth printing",
    fatal: false,
    has: () => "bluetooth" in navigator,
  },
  {
    id: "worker",
    label: "working offline",
    fatal: false,
    has: () => "serviceWorker" in navigator,
  },
  {
    id: "share",
    label: "sending reports",
    fatal: false,
    has: () => Boolean(navigator.share) || Boolean(navigator.clipboard),
  },
  {
    id: "wakelock",
    label: "keeping the screen on",
    fatal: false,
    has: () => "wakeLock" in navigator,
  },
];

export function checkApis(): Result {
  const missing = NEEDED.filter((one) => !one.has());
  const fatal = missing.filter((one) => one.fatal);

  if (fatal.length > 0) {
    return {
      id: "apis",
      verdict: "fail",
      reading: `missing: ${fatal.map((one) => one.label).join(", ")}`,
      /* A till that cannot check a signature cannot be licensed, which is a
         licence problem from the shop's side however technical the cause. */
      code: fatal.some((one) => one.id === "crypto") ? "SW-06" : "DT-01",
    };
  }
  if (missing.length > 0) {
    return {
      id: "apis",
      verdict: "warn",
      reading: `missing: ${missing.map((one) => one.label).join(", ")}`,
      code: "SW-09",
    };
  }
  return {
    id: "apis",
    verdict: "pass",
    reading: `all ${NEEDED.length} parts the till needs are present`,
  };
}

/* ------------------------------------------------------------ the browser */

export function checkBrowser(): Result {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const chrome = Number(/Chrome\/(\d+)/.exec(ua)?.[1] ?? 0);
  const android = Number(/Android\s+(\d+)/.exec(ua)?.[1] ?? 0);
  /* `wv` marks a WebView — an app showing a web page rather than Chrome
     itself. It has no Web Bluetooth and often no camera permission, so a
     till opened inside one silently loses its printer and its scanner. */
  const webview = / wv[);]/.test(ua) || /; wv\)/.test(ua);

  if (!chrome) {
    return {
      id: "browser",
      verdict: "warn",
      reading: "not Chrome — the till is only tested on Chrome for Android",
      code: "SW-09",
    };
  }

  const bits = [`Chrome ${chrome}`, android ? `Android ${android}` : ""].filter(Boolean);
  if (webview) bits.push("inside another app, not Chrome");

  if (chrome < SOFTWARE.minimumChrome || (android && android < SOFTWARE.minimumAndroid)) {
    return {
      id: "browser",
      verdict: "fail",
      reading: `${bits.join(", ")} — below Chrome ${SOFTWARE.minimumChrome} / Android ${SOFTWARE.minimumAndroid}`,
      code: "SW-08",
    };
  }
  if (webview || chrome < SOFTWARE.warnChrome) {
    return { id: "browser", verdict: "warn", reading: bits.join(", "), code: "SW-08" };
  }
  return { id: "browser", verdict: "pass", reading: bits.join(", ") };
}

/* ------------------------------------------------- will the data survive? */

/**
 * Is the shop's data safe from Android tidying it away?
 *
 * This is the single most valuable check in the app and the least visible.
 * Without persistent storage the browser may evict a site's database when the
 * tablet runs low on space — quietly, with no warning and no way back. On a
 * till that is a year of sales gone on a Tuesday.
 *
 * Permission is requested, not merely read: asking is free, usually granted
 * for an installed app, and turns a warning into a pass.
 */
export async function checkPersistence(): Promise<Result> {
  if (!navigator.storage?.persisted) return no("persist", "noApi");
  try {
    let safe = await navigator.storage.persisted();
    if (!safe && navigator.storage.persist) {
      safe = await navigator.storage.persist();
    }
    return safe
      ? {
          id: "persist",
          verdict: "pass",
          reading: "the shop's records are protected from being cleared",
        }
      : {
          id: "persist",
          verdict: "warn",
          reading: "Android may clear the shop's records if the tablet runs out of room",
          code: "DT-01",
        };
  } catch {
    return no("persist", "refused");
  }
}

/**
 * Writing and reading back, for real.
 *
 * Two hundred records, which is a busy hour. It is the closest thing to the
 * work a sale actually does, and it catches the tablet whose eMMC is worn —
 * the one that benchmarks fine and then takes four seconds to ring up a
 * bottle of water.
 *
 * It writes into its own database and deletes it afterwards. CoreCashier's
 * data is never opened, let alone written to.
 */
export async function checkStorageSpeed(): Promise<Result> {
  if (typeof indexedDB === "undefined") return no("diskspeed", "noApi");
  const NAME = "coreos-check-scratch";
  const COUNT = 200;

  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("probe", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("blocked"));
      window.setTimeout(() => reject(new Error("slow to open")), 5000);
    });

    const started = performance.now();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("probe", "readwrite");
      const store = tx.objectStore("probe");
      for (let i = 0; i < COUNT; i++) {
        store.put({ id: i, at: new Date().toISOString(), lines: [1, 2, 3], total: i * 250 });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    const wrote = performance.now() - started;

    /* Read one back, so a write that silently kept nothing is caught. */
    const readBack = await new Promise<unknown>((resolve, reject) => {
      const row = db.transaction("probe").objectStore("probe").get(COUNT - 1);
      row.onsuccess = () => resolve(row.result);
      row.onerror = () => reject(row.error);
    });
    db.close();
    indexedDB.deleteDatabase(NAME);

    if (!readBack) {
      return {
        id: "diskspeed",
        verdict: "fail",
        reading: "records were written but could not be read back",
        code: "DT-01",
      };
    }

    const reading = `${COUNT} records written and read back in ${Math.round(wrote)}ms`;
    if (wrote >= SOFTWARE.storageWrite.fail) {
      return { id: "diskspeed", verdict: "fail", reading, code: "TB-04" };
    }
    if (wrote >= SOFTWARE.storageWrite.warn) {
      return { id: "diskspeed", verdict: "warn", reading, code: "TB-04" };
    }
    return { id: "diskspeed", verdict: "pass", reading };
  } catch (cause) {
    return {
      id: "diskspeed",
      verdict: "fail",
      reading: `the tablet would not keep records: ${cause instanceof Error ? cause.message : String(cause)}`,
      code: "DT-01",
    };
  }
}

/* -------------------------------------------------------------- the clock */

/**
 * Is the tablet's clock right?
 *
 * It matters more here than it looks. Licence dates, technician keys and
 * every receipt time are judged against it, so a tablet a day out will
 * refuse a key that was issued correctly and will date a day's takings to
 * yesterday.
 *
 * Checked against a server's own `Date` header, which is the only reference
 * a browser has. With no network there is nothing to compare against and
 * this says so rather than guessing.
 */
export async function checkClock(): Promise<Result> {
  if (typeof location === "undefined" || location.protocol === "file:") {
    return no("clock", "fromFile");
  }
  if (!navigator.onLine) return no("clock", "offline");
  try {
    const before = Date.now();
    const response = await fetch(`${location.href.split("#")[0]}?clock=${before}`, {
      method: "HEAD",
      cache: "no-store",
    });
    const header = response.headers.get("date");
    if (!header) return no("clock", "noApi");

    /* Half the round trip, so the comparison is against the moment the
       server answered rather than the moment we asked. */
    const middle = before + (Date.now() - before) / 2;
    const skewMinutes = Math.abs(Date.parse(header) - middle) / 60000;
    const reading = `${skewMinutes < 1 ? "under a minute" : `${Math.round(skewMinutes)} minutes`} out`;

    if (skewMinutes > SOFTWARE.clockSkewMinutes) {
      return { id: "clock", verdict: "fail", reading, code: "SW-06" };
    }
    if (skewMinutes > 2) return { id: "clock", verdict: "warn", reading };
    return { id: "clock", verdict: "pass", reading };
  } catch {
    return no("clock", "refused");
  }
}

/* --------------------------------------------------- is the till in here? */

/**
 * What CoreCashier is doing on this tablet, read without starting it.
 *
 * Opened read-only and counted. A till with a database that will not open is
 * the thing most worth knowing before anybody drives to a shop, and it is
 * exactly what the shopkeeper cannot tell you.
 */
export async function checkTill(): Promise<Result> {
  if (typeof indexedDB === "undefined") return no("till", "noApi");

  const counts = await new Promise<{ sales: number; products: number } | null>(
    (resolve) => {
      let settled = false;
      const give = (value: { sales: number; products: number } | null) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };
      window.setTimeout(() => give(null), 2500);
      try {
        const request = indexedDB.open("corecashier");
        request.onerror = () => give(null);
        request.onblocked = () => give(null);
        /* Not there at all: a tablet with no till on it yet, which is a fine
           state and not a fault. */
        request.onupgradeneeded = () => give({ sales: -1, products: -1 });
        request.onsuccess = () => {
          const db = request.result;
          try {
            if (!db.objectStoreNames.contains("sales")) {
              db.close();
              give({ sales: -1, products: -1 });
              return;
            }
            const tx = db.transaction(["sales", "products"]);
            const sales = tx.objectStore("sales").count();
            const products = tx.objectStore("products").count();
            tx.oncomplete = () => {
              db.close();
              give({ sales: sales.result, products: products.result });
            };
            tx.onerror = () => {
              db.close();
              give(null);
            };
          } catch {
            give(null);
          }
        };
      } catch {
        give(null);
      }
    },
  );

  if (counts === null) {
    return {
      id: "till",
      verdict: "fail",
      reading: "CoreCashier's records are on this tablet but would not open",
      code: "DT-01",
    };
  }
  if (counts.sales < 0) {
    return { id: "till", verdict: "pass", reading: "CoreCashier is not set up on this tablet yet" };
  }
  return {
    id: "till",
    verdict: "pass",
    reading: `CoreCashier holds ${counts.sales} sales and ${counts.products} products`,
  };
}

export type { Verdict };
