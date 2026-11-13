/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What can be measured about the screen without asking anybody.
 *
 * The guided tests catch what a person has to see — a crack, a dead pixel,
 * backlight bleed. These catch what a person cannot: a panel that only runs
 * at 30Hz, a tablet too narrow to lay the till out on, a digitiser that
 * reports one finger, a browser set to large text that pushes the Charge
 * button off the bottom of the screen.
 *
 * Every one of these has turned a perfectly healthy-looking tablet into a
 * till somebody could not sell on.
 */

import { DISPLAY, grade } from "./standard";
import type { Result } from "./probes";

const no = (id: string, because: string): Result => ({
  id,
  verdict: "untested",
  reading: "—",
  because,
});

/**
 * Frames per second, counted.
 *
 * Over a second and a half, taking the median gap rather than the average:
 * one long frame while the browser does something else would drag an average
 * down and call a good panel bad.
 */
export function checkRefresh(): Promise<Result> {
  if (typeof requestAnimationFrame === "undefined") {
    return Promise.resolve(no("refresh", "noApi"));
  }
  return new Promise((resolve) => {
    const gaps: number[] = [];
    let last = performance.now();
    const started = last;

    const step = (now: number) => {
      gaps.push(now - last);
      last = now;
      if (now - started < 1500) {
        requestAnimationFrame(step);
        return;
      }
      /* The first couple of frames are the browser warming up. */
      const useful = gaps.slice(2).sort((a, b) => a - b);
      if (useful.length < 10) {
        resolve(no("refresh", "refused"));
        return;
      }
      const median = useful[Math.floor(useful.length / 2)];
      const fps = Math.round(1000 / median);
      const reading = `${fps} frames a second`;
      /* Graded the other way round from the rest: here a bigger number is
         better, so the marks are flipped before grading. */
      const verdict =
        fps <= DISPLAY.refresh.fail
          ? "fail"
          : fps <= DISPLAY.refresh.warn
            ? "warn"
            : "pass";
      resolve({
        id: "refresh",
        verdict,
        reading,
        code: verdict === "pass" ? undefined : "TB-04",
      });
    };
    requestAnimationFrame(step);
  });
}

/** Is there room to lay the till out, and is the panel what it claims? */
export function checkScreen(): Result {
  if (typeof window === "undefined") return no("screen", "noApi");

  /* The long edge, because a till is worked in landscape whichever way the
     tablet happens to be held while this runs. */
  const long = Math.max(window.screen.width, window.screen.height);
  const short = Math.min(window.screen.width, window.screen.height);
  const ratio = window.devicePixelRatio || 1;
  const depth = window.screen.colorDepth;

  const reading = `${long}×${short} at ${ratio}× (${Math.round(long * ratio)}×${Math.round(short * ratio)} real pixels), ${depth}-bit colour`;

  if (long < DISPLAY.minimumWidth || short < DISPLAY.minimumHeight) {
    return {
      id: "screen",
      verdict: "fail",
      reading: `${reading} — too small to lay the till out`,
      code: "TB-09",
    };
  }
  /* 16-bit panels band badly on the receipt preview and are a sign of a very
     cheap screen, but they do sell. */
  if (depth < 24) {
    return { id: "screen", verdict: "warn", reading, code: "TB-09" };
  }
  return { id: "screen", verdict: "pass", reading };
}

/**
 * How many fingers the digitiser will admit to.
 *
 * `maxTouchPoints` is the panel's own answer and is reliable. One point on a
 * tablet means a digitiser that is failing or a driver that is wrong; either
 * way the till's scrolling and long-press will misbehave.
 */
export function checkMultiTouch(): Result {
  if (typeof navigator === "undefined" || navigator.maxTouchPoints === undefined) {
    return no("multitouch", "noApi");
  }
  const points = navigator.maxTouchPoints;
  if (points === 0) {
    /* A desk machine with a mouse. Not a fault, just not a tablet. */
    return {
      id: "multitouch",
      verdict: "warn",
      reading: "no touch screen on this machine",
      code: "TB-03",
    };
  }
  const reading = `${points} fingers at once`;
  if (points < DISPLAY.minimumTouchPoints) {
    return { id: "multitouch", verdict: "fail", reading, code: "TB-03" };
  }
  return { id: "multitouch", verdict: "pass", reading };
}

/**
 * Has somebody turned the text size up?
 *
 * Android's accessibility text scaling and Chrome's own font size both land
 * here, and both break a layout built in fixed pixels — the Charge button
 * goes under the fold and a cashier cannot reach it. Measured by laying out
 * a known size and seeing what comes back.
 */
export function checkTextScale(): Result {
  if (typeof document === "undefined") return no("textscale", "noApi");
  try {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;left:-9999px;top:0;font-size:16px;line-height:1;padding:0;margin:0";
    probe.textContent = "M";
    document.body.appendChild(probe);
    const measured = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    if (!measured) return no("textscale", "refused");

    const scale = measured / 16;
    const reading =
      scale === 1 ? "normal text size" : `text is ${Math.round(scale * 100)}% of normal`;
    const verdict = grade(scale, DISPLAY.textScale);
    return {
      id: "textscale",
      verdict,
      reading,
      code: verdict === "pass" ? undefined : "TB-09",
    };
  } catch {
    return no("textscale", "refused");
  }
}
