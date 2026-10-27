/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The support report.
 *
 * Fifty shops means fifty phone calls that begin "it is not working". A
 * shopkeeper cannot be asked to read a browser version down the line, and
 * should not have to: the till knows what it is running on, what build it is,
 * and what went wrong last. One button gathers it and hands it to WhatsApp.
 *
 * Two rules about what goes in it.
 *
 * It is written in English, whatever language the counter is worked in,
 * because it is read by a support desk rather than by the shop.
 *
 * And it carries no trade: no product names, no prices, no customers, no
 * takings. Counts and timings only. A shop has to be able to press this button
 * without wondering what it told us about their business — and the one thing
 * support usually wants beyond this, the shop's own data, is a backup file
 * they choose to send.
 */

import type { PosData } from "./types";

const ERROR_KEY = "coreos.pos.errors.v1";
const KEEP = 8;

export interface LoggedError {
  at: string;
  what: string;
}

/** Build stamp, replaced at build time — see vite.config.ts. Without it a
    support desk cannot tell which of fifty tablets is running old code. */
declare const __POS_BUILD__: string;

export function buildStamp(): string {
  try {
    return typeof __POS_BUILD__ === "string" ? __POS_BUILD__ : "dev";
  } catch {
    return "dev";
  }
}

function readErrors(): LoggedError[] {
  try {
    const raw = localStorage.getItem(ERROR_KEY);
    return raw ? (JSON.parse(raw) as LoggedError[]) : [];
  } catch {
    return [];
  }
}

function writeErrors(errors: LoggedError[]) {
  try {
    localStorage.setItem(ERROR_KEY, JSON.stringify(errors.slice(0, KEEP)));
  } catch {
    // The errors worth reporting include "this browser will not let us write",
    // so failing to save one must not become one.
  }
}

export function recordError(what: string) {
  const trimmed = what.slice(0, 300);
  const errors = readErrors();
  // The same fault repeating every render would otherwise push out the one
  // that started it.
  if (errors[0]?.what === trimmed) return;
  writeErrors([{ at: new Date().toISOString(), what: trimmed }, ...errors]);
}

export function errorCount(): number {
  return readErrors().length;
}

/** Catches what the shop would otherwise have to describe: a crash, or a
    promise that failed with nobody watching. */
export function watchForErrors() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (event) => {
    recordError(`${event.message} (${event.filename ?? "?"}:${event.lineno ?? 0})`);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    recordError(
      `unhandled: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
  });
}

/** Roughly how much the till is holding, in kilobytes. Shops run out of room
    on cheap tablets, and the number says how close they are. */
function storageSize(): string {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("coreos.pos")) {
        total += (localStorage.getItem(key)?.length ?? 0) + key.length;
      }
    }
    return `${Math.round(total / 1024)} kB`;
  } catch {
    return "unreadable (storage blocked)";
  }
}

function storageState(): string {
  try {
    const probe = "coreos.pos.probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return "writable";
  } catch {
    return "BLOCKED — nothing is being saved";
  }
}

export function buildReport(data: PosData, writeError: string): string {
  const { settings } = data;
  const lastSale = data.sales[0];
  const lines = [
    "CoreCashier — support report",
    "",
    `Till ID:     ${settings.tillId}`,
    `Shop:        ${settings.shopName}`,
    `Build:       ${buildStamp()}`,
    `Language:    ${settings.lang}`,
    `Sent:        ${new Date().toISOString()}`,
    "",
    `Products:    ${data.products.length} (${data.products.filter((p) => p.archived).length} archived)`,
    `Sales kept:  ${data.sales.length}`,
    `Last sale:   ${lastSale ? `#${lastSale.no} on ${lastSale.at}` : "none yet"}`,
    `Next receipt: ${settings.nextSaleNo}`,
    `Storage:     ${storageState()}, holding ${storageSize()}`,
    writeError ? `Warning:     ${writeError}` : "",
    "",
    `Running from: ${typeof location === "undefined" ? "?" : location.protocol}`,
    `Online:      ${typeof navigator === "undefined" ? "?" : navigator.onLine}`,
    `Screen:      ${typeof window === "undefined" ? "?" : `${window.innerWidth}x${window.innerHeight}`}`,
    `Camera API:  ${typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia ? "present" : "missing"}`,
    `Barcode API: ${typeof window !== "undefined" && "BarcodeDetector" in window ? "present" : "missing (the till uses its own reader)"}`,
    `Device:      ${typeof navigator === "undefined" ? "?" : navigator.userAgent}`,
    "",
    "Last errors:",
  ];

  const errors = readErrors();
  if (errors.length === 0) lines.push("  none recorded");
  else for (const error of errors) lines.push(`  ${error.at}  ${error.what}`);

  lines.push("", "No product names, prices, customers or takings are included.");
  return lines.filter((line) => line !== "").join("\n");
}

/** WhatsApp wants digits only, and tolerates the shape people write numbers
    in — 0964, +964, spaces and dashes. */
export function whatsappNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.replace(/^00/, "");
}
