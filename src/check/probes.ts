/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The automatic checks, and the one rule that governs all of them.
 *
 * **If the browser cannot answer, say so.** Never a pass, never a guess.
 * A check that reports "fine" because the API was missing is worse than no
 * check at all: it sends a technician home from a tablet that is broken, and
 * it teaches the shop not to trust the app. So every probe returns one of
 * four things, and `untested` carries a reason the shop can read.
 *
 * Two places where that rule bites, and where this file deliberately differs
 * from what you might expect:
 *
 * `navigator.bluetooth.getAvailability()` returning false means **this
 * tablet has no Bluetooth radio**. It does not mean Bluetooth is switched
 * off — no browser can see that — so a tablet with Bluetooth turned off
 * reads as "available" and the printer test is what finds the truth.
 *
 * `deviceMemory` is rounded to 0.25/0.5/1/2/4/8 and capped at 8. It can tell
 * 2GB from 4GB and nothing finer, so it is reported as approximate and never
 * as a specification.
 */

import type { IssueCode } from "../pos/issues";
import { STANDARD, type Verdict } from "./standard";

export interface Result {
  id: string;
  verdict: Verdict;
  /** One short line for the shop, in English — the screen translates the
      title and the advice; this is the measurement itself. */
  reading: string;
  /** The code this contributes to the ticket, when it is not a pass. */
  code?: IssueCode;
  /** Only when `untested`: why the tablet could not answer. */
  because?: string;
}

const no = (id: string, because: string): Result => ({
  id,
  verdict: "untested",
  reading: "—",
  because,
});

/* ----------------------------------------------------------- the battery */

interface BatteryLike {
  level: number;
  charging: boolean;
}

export async function checkBattery(): Promise<Result> {
  const nav = navigator as unknown as { getBattery?: () => Promise<BatteryLike> };
  if (!nav.getBattery) return no("battery", "noApi");
  try {
    const battery = await nav.getBattery();
    const percent = Math.round(battery.level * 100);
    const reading = `${percent}%, ${battery.charging ? "charging" : "on battery"}`;
    /* Low *and* off the charger. A tablet at 12% with the cable in is a
       tablet that is being looked after, not a fault. */
    if (percent <= STANDARD.lowBatteryPercent && !battery.charging) {
      return { id: "battery", verdict: "fail", reading, code: "TB-02" };
    }
    if (percent <= STANDARD.lowBatteryPercent) {
      return { id: "battery", verdict: "warn", reading };
    }
    return { id: "battery", verdict: "pass", reading };
  } catch {
    return no("battery", "refused");
  }
}

/** Watches for the charging state to flip. Used by the guided charger test. */
export async function watchCharging(
  seconds: number,
  onTick: (left: number) => void,
): Promise<"charging" | "no-change" | "untested"> {
  const nav = navigator as unknown as {
    getBattery?: () => Promise<BatteryLike & {
      addEventListener: (type: string, fn: () => void) => void;
      removeEventListener: (type: string, fn: () => void) => void;
    }>;
  };
  if (!nav.getBattery) return "untested";
  try {
    const battery = await nav.getBattery();
    if (battery.charging) return "charging";
    return await new Promise((resolve) => {
      let left = seconds;
      const done = (answer: "charging" | "no-change") => {
        battery.removeEventListener("chargingchange", flipped);
        window.clearInterval(timer);
        resolve(answer);
      };
      const flipped = () => {
        if (battery.charging) done("charging");
      };
      battery.addEventListener("chargingchange", flipped);
      const timer = window.setInterval(() => {
        left -= 1;
        onTick(left);
        /* Some tablets never fire the event but do update the flag. */
        if (battery.charging) done("charging");
        else if (left <= 0) done("no-change");
      }, 1000);
    });
  } catch {
    return "untested";
  }
}

/* ----------------------------------------------------------- the network */

/**
 * Is this tablet really on a network?
 *
 * `navigator.onLine` is famously generous: it says true for a tablet joined
 * to a wifi that has no internet behind it, which is half the shops in
 * Baghdad on a bad afternoon. So it is only the first half of the answer; the
 * second is a real request, to this app's own address. Our own origin because
 * it is the one host guaranteed to be reachable wherever this was installed,
 * and because nothing about a device check should depend on somebody else's
 * server being up.
 *
 * From a file opened off the tablet there is no origin to ask, and this
 * honestly reports that it could not tell.
 */
export async function checkNetwork(): Promise<Result> {
  const online = typeof navigator === "undefined" ? false : navigator.onLine;
  if (typeof location === "undefined" || location.protocol === "file:") {
    return {
      ...no("network", "fromFile"),
      reading: online ? "the tablet says it is online" : "the tablet says it is offline",
    };
  }
  if (!online) {
    return {
      id: "network",
      verdict: "fail",
      reading: "the tablet says it is offline",
      code: "TB-05",
    };
  }
  try {
    const started = performance.now();
    await fetch(`${location.href.split("#")[0]}?check=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
    });
    return {
      id: "network",
      verdict: "pass",
      reading: `answered in ${Math.round(performance.now() - started)}ms`,
    };
  } catch {
    /* Joined to a wifi with nothing behind it — the case `onLine` misses. */
    return {
      id: "network",
      verdict: "fail",
      reading: "joined to a network, but nothing answered",
      code: "TB-05",
    };
  }
}

/* --------------------------------------------------------- the bluetooth */

export async function checkBluetooth(): Promise<Result> {
  const nav = navigator as unknown as {
    bluetooth?: { getAvailability?: () => Promise<boolean> };
  };
  if (!nav.bluetooth) return no("bluetooth", "noApi");
  if (!nav.bluetooth.getAvailability) return no("bluetooth", "noApi");
  try {
    const there = await nav.bluetooth.getAvailability();
    return there
      ? { id: "bluetooth", verdict: "pass", reading: "a Bluetooth radio is present" }
      : {
          id: "bluetooth",
          verdict: "fail",
          reading: "no Bluetooth radio on this tablet",
          code: "TB-05",
        };
  } catch {
    return no("bluetooth", "refused");
  }
}

/* ------------------------------------------------------------ the memory */

export async function checkStorage(): Promise<Result> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate || estimate.quota === undefined || estimate.usage === undefined) {
      return no("storage", "noApi");
    }
    const leftMb = Math.round((estimate.quota - estimate.usage) / 1024 / 1024);
    /* Said carefully. This is the browser's estimate of what this app may
       still use, which on Chrome for Android tracks the tablet's free space
       but is not the same number — and the shop should not be told its
       tablet has 800MB free when that is a quota, not a disk. */
    const reading = `about ${leftMb} MB still available to the app, ${Math.round(estimate.usage / 1024 / 1024)} MB used (browser estimate)`;
    if (leftMb < STANDARD.lowStorageMb) {
      return { id: "storage", verdict: "fail", reading, code: "TB-09" };
    }
    if (leftMb < STANDARD.tightStorageMb) {
      return { id: "storage", verdict: "warn", reading, code: "TB-09" };
    }
    return { id: "storage", verdict: "pass", reading };
  } catch {
    return no("storage", "refused");
  }
}

export function checkHardware(): Result {
  const nav = navigator as unknown as {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  const gb = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  if (gb === undefined && cores === undefined) return no("hardware", "noApi");

  const parts = [
    gb === undefined ? "memory unknown" : `about ${gb} GB`,
    cores === undefined ? "cores unknown" : `${cores} cores`,
  ];
  const reading = parts.join(", ");

  /* Judged only on what was actually reported. A tablet that will not say how
     much memory it has is not thereby below standard. */
  const short =
    (gb !== undefined && gb < STANDARD.minimumMemoryGb) ||
    (cores !== undefined && cores < STANDARD.minimumCores);
  if (short) {
    return { id: "hardware", verdict: "fail", reading, code: "TB-09" };
  }
  if (gb === undefined || cores === undefined) {
    return { id: "hardware", verdict: "warn", reading };
  }
  return { id: "hardware", verdict: "pass", reading };
}

/* -------------------------------------------------------------- the rest */

/** What the tablet says it is. Not a judgement, just the line a support desk
    needs and a shopkeeper cannot be asked to find. */
export function deviceFacts(): { android: string; browser: string; screen: string } {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const android = /Android\s+([\d.]+)/.exec(ua)?.[1];
  const chrome = /Chrome\/([\d.]+)/.exec(ua)?.[1];
  const safari = /Version\/([\d.]+).*Safari/.exec(ua)?.[1];
  const firefox = /Firefox\/([\d.]+)/.exec(ua)?.[1];
  return {
    android: android ? `Android ${android}` : "not an Android tablet",
    browser: chrome
      ? `Chrome ${chrome.split(".")[0]}`
      : firefox
        ? `Firefox ${firefox.split(".")[0]}`
        : safari
          ? `Safari ${safari}`
          : "unknown browser",
    screen:
      typeof window === "undefined"
        ? "?"
        : `${Math.round(window.screen.width * devicePixelRatio)}×${Math.round(window.screen.height * devicePixelRatio)}`,
  };
}
