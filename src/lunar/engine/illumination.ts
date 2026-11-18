/**
 * Illustrative solar illumination for a polar ridge site.
 *
 * Physics behind the model (see Science section):
 *  - The Moon's spin axis is tilted only ~1.5° to the ecliptic, so at the poles
 *    the Sun skims the horizon and circles it once per synodic month (~29.5 d).
 *  - High ridges can stay sunlit for most of that cycle; nearby terrain blocks
 *    the Sun for hours to days at a time. Because topography is known, these
 *    shadow periods can be forecast in advance.
 *
 * The numbers here are illustrative: a fixed base fraction (array tracking,
 * partial self-shadowing) with a slow ripple, plus scenario shadow windows with
 * 2-hour penumbra ramps.
 */
import { LUNAR_SYNODIC_HOURS } from "./config";
import type { Scenario } from "./scenarios";

const RAMP_HOURS = 2;

export function shadowDepthAt(scenario: Scenario, hour: number): number {
  let depth = 0;
  for (const w of scenario.shadows) {
    if (hour >= w.start && hour < w.end) {
      const intoWindow = hour - w.start;
      const untilEnd = w.end - hour;
      const ramp = Math.min(1, (Math.min(intoWindow, untilEnd) + 1) / (RAMP_HOURS + 1));
      depth = Math.max(depth, w.depth * ramp);
    }
  }
  return depth;
}

/** Fraction (0–1) of array capacity the Sun can supply at `hour`, before dust and events. */
export function illuminationAt(scenario: Scenario, hour: number): number {
  const ripple = 0.05 * Math.sin((2 * Math.PI * hour) / 97);
  const base = Math.min(1, Math.max(0, scenario.baseIllumination + ripple));
  return +(base * (1 - shadowDepthAt(scenario, hour))).toFixed(4);
}

/** Sun azimuth in degrees — it circles the horizon once per synodic month at the pole. */
export function sunAzimuthAt(hour: number, offsetDeg = 132): number {
  return (offsetDeg + (hour / LUNAR_SYNODIC_HOURS) * 360) % 360;
}

/** Sun elevation (degrees) — stays within about ±1.5° of the horizon at the pole. */
export function sunElevationAt(scenario: Scenario, hour: number): number {
  const seasonal = 1.2 * Math.sin((2 * Math.PI * hour) / LUNAR_SYNODIC_HOURS + 0.6);
  return +seasonal.toFixed(2);
}

export function forecast(scenario: Scenario, fromHour: number, hours: number): { h: number; illumination: number }[] {
  const out: { h: number; illumination: number }[] = [];
  for (let h = fromHour; h < fromHour + hours; h++) out.push({ h, illumination: illuminationAt(scenario, h) });
  return out;
}
