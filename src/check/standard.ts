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
