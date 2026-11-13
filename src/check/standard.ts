/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The CoreOS Hardware Standard, and every number Device Check judges by.
 *
 * All of it is here so it can be tuned from one file. The figures below are
 * seeded from the tablet CoreCashier was built against — the HONOR Pad X7,
 * 4GB, which is the floor we sell on — and should be re-measured on a Galaxy
 * Tab A9+ before they are trusted as a pass mark. A threshold set from a
 * developer's laptop fails every tablet in Baghdad.
 *
 * Document FD-09 is the written standard this file implements; the name is
 * printed on an inspection result so a seller can be shown what was applied.
 */

export const STANDARD_REF = "FD-09";

export const STANDARD = {
  /** Gigabytes. `navigator.deviceMemory` is rounded to 0.25/0.5/1/2/4/8 and
      capped at 8, so this can only ever be a coarse floor — it tells 2 from
      4, and nothing finer. */
  minimumMemoryGb: 4,

  /** Cores. Every tablet we sell on has at least four; fewer is an older
      chip than the standard allows. */
  minimumCores: 4,

  /** Megabytes of room left before saving starts to fail. A shop's year of
      trade is a few megabytes, but Android itself needs far more headroom
      than that to keep working. */
  lowStorageMb: 250,

  /** Warn before it is urgent. */
  tightStorageMb: 1000,

  /** Percent. Below this and off the charger, the counter has about an hour. */
  lowBatteryPercent: 15,
};

/**
 * The speed test's pass marks, in milliseconds.
 *
 * Each measures the thing CoreCashier actually does, not an abstract
 * benchmark: a shelf being drawn, a search being typed, a basket being
 * totalled. `warn` is "a cashier would notice"; `fail` is "a cashier would
 * complain".
 */
export const SPEED = {
  /** Building and laying out 500 products. */
  render: { warn: 400, fail: 900 },
  /** Searching that shelf, the way the search box does on every keystroke. */
  search: { warn: 120, fail: 300 },
  /** Pricing a 50-line basket. */
  total: { warn: 40, fail: 120 },
  /** Frames dropped while the shelf scrolls, out of roughly 60. Dropped
      frames are what "laggy" actually means to the person holding it. */
  dropped: { warn: 10, fail: 25 },
};

/**
 * What the till needs from the software on the tablet.
 *
 * These are the versions CoreCashier is actually built against, not a wish
 * list. An older Chrome does not merely look worse — it is missing the
 * crypto the licence check is built on, and the till will not activate at
 * all on it.
 */
export const SOFTWARE = {
  /** Chrome below this has no reliable WebCrypto on Android and no Web
      Bluetooth. Raise it only when the oldest tablet in the field is past it. */
  minimumChrome: 90,
  warnChrome: 110,
  /** Android below this cannot run a Chrome new enough for the above. */
  minimumAndroid: 9,
  /** A tablet whose clock is further out than this cannot be given a
      technician key, and will argue with its own licence dates. */
  clockSkewMinutes: 10,
  /** Writing 200 records to the shop's own database, the way a busy hour
      does. Slow storage is the most common reason a cheap tablet feels
      broken while every other number looks fine. */
  storageWrite: { warn: 500, fail: 1500 },
};

/**
 * What the till needs from the screen.
 *
 * The till is laid out for a 10-inch tablet held in two hands. Below these
 * the buttons are too small to hit in a queue, however well the tablet
 * performs on everything else.
 */
export const DISPLAY = {
  /** CSS pixels across, in landscape. Narrower than this and the basket and
      the shelf cannot both be on screen. */
  minimumWidth: 960,
  minimumHeight: 540,
  /** Frames per second, measured. A 30Hz panel reads as broken to a thumb. */
  refresh: { warn: 50, fail: 40 },
  /** Fingers the digitiser reports. Two is enough for the till; one means a
      panel that cannot be trusted. */
  minimumTouchPoints: 2,
  /** Browser text scaling. A tablet set to large text pushes the till's
      buttons off screen. 1 is normal. */
  textScale: { warn: 1.15, fail: 1.3 },
};

export type Verdict = "pass" | "warn" | "fail" | "untested";

/** Worst wins: a single failure decides the result. */
export function worst(verdicts: Verdict[]): Verdict {
  if (verdicts.includes("fail")) return "fail";
  if (verdicts.includes("warn")) return "warn";
  if (verdicts.includes("pass")) return "pass";
  return "untested";
}

/** Which side of the two marks a measurement falls on. */
export function grade(value: number, marks: { warn: number; fail: number }): Verdict {
  if (value >= marks.fail) return "fail";
  if (value >= marks.warn) return "warn";
  return "pass";
}
