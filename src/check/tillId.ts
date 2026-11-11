/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Finding the Till ID without depending on CoreCashier.
 *
 * Device Check exists for the tablet where CoreCashier will not open, so it
 * must not import the till's store, boot it, or care whether its licence is
 * valid — doing any of that would mean the diagnostic tool dies of the same
 * illness it was sent to diagnose.
 *
 * So the database is opened read-only, by hand, with everything wrapped and a
 * short deadline. A till number makes the support call easier; not having one
 * costs nothing but a line on the report.
 */

/** The three editions, each with its own database. Checked in turn. */
const DATABASES = ["corecashier", "corecashier-cloud", "corecashier-demo"];

function fromOne(name: string): Promise<string> {
  return new Promise((resolve) => {
    let settled = false;
    const give = (value: string) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    /* A database another tab holds open, or one mid-upgrade, can leave the
       open request hanging for ever. Nothing here is worth waiting on. */
    const deadline = window.setTimeout(() => give(""), 1500);

    try {
      const request = indexedDB.open(name);
      request.onerror = () => give("");
      request.onblocked = () => give("");
      request.onupgradeneeded = () => {
        /* It does not exist. Let the empty one be created and thrown away
           rather than writing a schema we have no business writing. */
        give("");
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          if (!db.objectStoreNames.contains("settings")) {
            db.close();
            give("");
            return;
          }
          const row = db.transaction("settings").objectStore("settings").get("settings");
          row.onsuccess = () => {
            const found = (row.result as { tillId?: string } | undefined)?.tillId;
            db.close();
            give(typeof found === "string" ? found : "");
          };
          row.onerror = () => {
            db.close();
            give("");
          };
        } catch {
          try {
            db.close();
          } catch {
            // Already gone.
          }
          give("");
        }
      };
    } catch {
      give("");
    } finally {
      void deadline;
    }
  });
}

export async function findTillId(): Promise<string> {
  if (typeof indexedDB === "undefined") return "";
  for (const name of DATABASES) {
    try {
      const found = await fromOne(name);
      if (found) return found;
    } catch {
      // Try the next one.
    }
  }
  return "";
}

/** The shop's name, for the report header. Same rules: nice to have, never
    waited on, and nothing else is read — no products, no sales, no
    customers. */
export async function findShopName(): Promise<string> {
  if (typeof indexedDB === "undefined") return "";
  return new Promise((resolve) => {
    let settled = false;
    const give = (value: string) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    window.setTimeout(() => give(""), 1500);
    try {
      const request = indexedDB.open("corecashier");
      request.onerror = () => give("");
      request.onblocked = () => give("");
      request.onupgradeneeded = () => give("");
      request.onsuccess = () => {
        const db = request.result;
        try {
          if (!db.objectStoreNames.contains("settings")) {
            db.close();
            give("");
            return;
          }
          const row = db.transaction("settings").objectStore("settings").get("settings");
          row.onsuccess = () => {
            const found = (row.result as { shopName?: string } | undefined)?.shopName;
            db.close();
            give(typeof found === "string" ? found : "");
          };
          row.onerror = () => {
            db.close();
            give("");
          };
        } catch {
          give("");
        }
      };
    } catch {
      give("");
    }
  });
}
