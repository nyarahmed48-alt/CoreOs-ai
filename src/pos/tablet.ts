/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The few things about the tablet a browser can actually see.
 *
 * Deliberately short. A web page cannot tell whether the charger is plugged
 * into a working socket, whether the printer has paper, or whether the
 * handheld scanner is pointed at anything — and a code raised on a guess is
 * worse than no code, because it sends a technician to the wrong thing. So
 * this file reports four states and no more:
 *
 *  - the battery, where the browser exposes it at all
 *  - whether the tablet thinks it is online
 *  - how much room is left
 *  - how long a sale took to save, which is the only honest measure of
 *    "slow" the till has: it is the thing a cashier actually waits for
 */

import { reportError } from "./reportIssue";

interface BatteryLike {
  level: number;
  charging: boolean;
  addEventListener: (type: string, listener: () => void) => void;
}

/** Below this and not charging, the shop is told. Fifteen percent on these
    tablets is about an hour of a busy counter. */
const LOW_BATTERY = 0.15;

/** A sale that takes longer than this to reach the disk is a till the
    cashier is waiting on. Generous: cheap tablets are slow at the best of
    times and a card on every busy morning would be noise. */
const SLOW_SALE_MS = 1500;

/** Under this much room left, saving is about to start failing. */
const LOW_STORAGE_BYTES = 25 * 1024 * 1024;

/**
 * How long the last sale took to save.
 *
 * Called by the checkout rather than measured from inside the store, because
 * what matters is the wait the person at the counter sees, not the part of
 * it that happens to be our arithmetic.
 */
export function measureSale(ms: number) {
  if (ms < SLOW_SALE_MS) return;
  reportError("TB-04", `a sale took ${Math.round(ms)}ms to save`, {
    quiet: true,
    once: "slow",
  });
}

async function watchBattery(): Promise<void> {
  const nav = navigator as unknown as { getBattery?: () => Promise<BatteryLike> };
  if (!nav.getBattery) return; // Most Android browsers; nothing to report.
  try {
    const battery = await nav.getBattery();
    const look = () => {
      if (battery.level <= LOW_BATTERY && !battery.charging) {
        reportError(
          "TB-02",
          `battery ${Math.round(battery.level * 100)}%, not charging`,
          { once: "low" },
        );
      }
    };
    battery.addEventListener("levelchange", look);
    battery.addEventListener("chargingchange", look);
    look();
  } catch {
    // A browser that offers the API and then refuses it. Nothing to say.
  }
}

async function watchRoom(): Promise<void> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota || estimate.usage === undefined) return;
    const left = estimate.quota - estimate.usage;
    if (left < LOW_STORAGE_BYTES) {
      reportError(
        "TB-09",
        `low storage: ${Math.round(left / 1024 / 1024)}MB left of ${Math.round(estimate.quota / 1024 / 1024)}MB`,
        { once: "room" },
      );
    }
  } catch {
    // Not every browser has it, and it is only ever advisory.
  }
}

/**
 * Starts watching, and keeps watching while the till is open.
 *
 * Offline is reported quietly and once. These shops are offline most of the
 * day by default, and a card about it over a counter would be both wrong and
 * constant — but a technician looking at the log afterwards wants to know.
 */
export function watchTablet(): () => void {
  if (typeof window === "undefined") return () => undefined;

  void watchBattery();
  void watchRoom();

  const offline = () =>
    reportError("TB-05", "the tablet reports itself offline", {
      quiet: true,
      once: "offline",
    });
  if (!navigator.onLine) offline();
  window.addEventListener("offline", offline);

  /* Room is worth another look now and then: a shop filling the tablet with
     photographs will not restart the till to find out. */
  const timer = window.setInterval(() => void watchRoom(), 10 * 60_000);

  return () => {
    window.removeEventListener("offline", offline);
    window.clearInterval(timer);
  };
}
