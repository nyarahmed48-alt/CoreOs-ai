/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hand scanners.
 *
 * A counter scanner — the pistol on the cable, or the omnidirectional plate a
 * shop lays under the till — is not a camera and not a device the browser has
 * an API for. To the machine it is a keyboard, and it works by typing the
 * barcode faster than any human could and usually pressing Enter afterwards.
 *
 * That is the whole difficulty. The keystrokes land in whatever field happens
 * to have focus, so a cashier who has just corrected a quantity and then scans
 * the next item gets thirteen digits in the quantity box. Focusing a hidden
 * box and hoping is what most web tills do, and it fails exactly when the
 * counter is busy.
 *
 * So this watches the keyboard instead, and tells a scanner from a person by
 * the one thing they cannot fake: speed. Nothing types thirteen characters at
 * thirty milliseconds apart. Once a burst looks like a scan the keystrokes are
 * taken off the page entirely, and the two or three characters that slipped
 * into a field before we could be sure are taken back out of it.
 *
 * Deliberately device-agnostic: it asks nothing of the scanner's
 * configuration, works whether the suffix is Enter, Tab or nothing at all, and
 * so works with whichever scanner the shop already bought.
 */

import { useEffect, useRef } from "react";

/** Keystrokes from a scanner arrive milliseconds apart. A very fast typist
    runs at 120ms; 35 is far below anything human and far above what any
    scanner needs. */
const FAST_GAP_MS = 35;

/** Quiet for this long and the burst is over — which is how a scanner with no
    suffix configured still completes. */
const BURST_END_MS = 90;

/** Shorter than this is a keypress, not a barcode. */
const MIN_LENGTH = 4;

/** How many characters may reach the page before we are sure enough to start
    taking them. They are repaired afterwards. */
const SURE_AT = 3;

export interface ScanInfo {
  /** Characters in the code. */
  keys: number;
  /** How long the scanner took to type it, in milliseconds. */
  ms: number;
  /** What the scanner sent at the end, which is the setting shops most often
      have wrong. */
  suffix: "enter" | "tab" | "none";
}

export interface WedgeOptions {
  /** A barcode arrived. */
  onScan: (code: string, info: ScanInfo) => void;
  /** Someone typed with no field focused, and it was not a scan. The till uses
      this to put the characters in its search box rather than lose them. */
  onType?: (text: string) => void;
  enabled?: boolean;
}

function isEditable(node: Element | null): node is HTMLInputElement | HTMLTextAreaElement {
  return node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement;
}

/**
 * React owns the value of its inputs through a setter of its own, so writing
 * `el.value` leaves its state holding the scanned digits while the screen
 * shows them gone. Going through the prototype's setter and firing the event
 * React listens for keeps the two in step.
 */
function setFieldValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function useWedgeScanner({ onScan, onType, enabled = true }: WedgeOptions) {
  const scanRef = useRef(onScan);
  scanRef.current = onScan;
  const typeRef = useRef(onType);
  typeRef.current = onType;

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let startedAt = 0;
    let lastAt = 0;
    /** The widest gap in this burst — what decides scanner or person. */
    let slowest = 0;
    /** Characters that reached a field before we were sure. */
    let leaked = 0;
    let leakedInto: HTMLInputElement | HTMLTextAreaElement | null = null;
    /** True while we are taking every keystroke because nothing was focused. */
    let owned = false;
    let tail: number | undefined;

    function reset() {
      buffer = "";
      slowest = 0;
      leaked = 0;
      leakedInto = null;
      owned = false;
      window.clearTimeout(tail);
    }

    function looksLikeAScan() {
      return buffer.length >= MIN_LENGTH && slowest < FAST_GAP_MS;
    }

    /** Take back the characters that landed in a field before we knew. */
    function repair() {
      if (!leaked || !leakedInto) return;
      const typed = buffer.slice(0, leaked);
      const field = leakedInto;
      if (!field.isConnected || !field.value.endsWith(typed)) return;
      setFieldValue(field, field.value.slice(0, field.value.length - typed.length));
    }

    function finishScan(suffix: ScanInfo["suffix"]) {
      const code = buffer;
      const info: ScanInfo = {
        keys: code.length,
        ms: Math.round(lastAt - startedAt),
        suffix,
      };
      repair();
      reset();
      scanRef.current(code, info);
    }

    /** Not a scan after all: hand the characters to the till if we took them. */
    function release() {
      const text = buffer;
      const wasOwned = owned;
      reset();
      if (wasOwned && text) typeRef.current?.(text);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const active = document.activeElement;
      // A field that is there to catch a barcode says so, and keeps it.
      if (active instanceof Element && active.closest("[data-scan-through]")) {
        reset();
        return;
      }

      const now = performance.now();
      const gap = now - lastAt;

      if (event.key === "Enter" || event.key === "Tab") {
        // The suffix belongs to the burst only if it arrived at the burst's
        // speed; a cashier pressing Enter a second later means something else.
        if (looksLikeAScan() && gap < FAST_GAP_MS) {
          event.preventDefault();
          event.stopPropagation();
          lastAt = now;
          finishScan(event.key === "Tab" ? "tab" : "enter");
        } else {
          release();
        }
        return;
      }

      if (event.key.length !== 1) {
        // Arrows, Escape, Backspace: whatever this is, it is not a barcode.
        release();
        return;
      }

      if (gap > BURST_END_MS) {
        // Too long since the last key: this is the start of something new.
        release();
        startedAt = now;
      } else {
        slowest = Math.max(slowest, gap);
      }
      lastAt = now;
      buffer += event.key;

      if (!isEditable(active)) {
        /* Nothing is focused, so nobody else wants these keys. Taking them all
           means the first characters of a scan are never lost, and a cashier
           who simply starts typing still gets every letter — it is handed to
           the search box once the burst proves to be human. */
        owned = true;
        event.preventDefault();
      } else if (buffer.length >= SURE_AT && slowest < FAST_GAP_MS) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        leaked = buffer.length;
        leakedInto = active;
      }

      window.clearTimeout(tail);
      tail = window.setTimeout(() => {
        // A scanner set to send no suffix at all ends its scan with silence.
        if (looksLikeAScan()) finishScan("none");
        else release();
      }, BURST_END_MS);
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.clearTimeout(tail);
    };
  }, [enabled]);
}
