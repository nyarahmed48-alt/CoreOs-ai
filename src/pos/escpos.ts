/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Receipts, as a thermal printer understands them.
 *
 * ESC/POS is the language every cheap roll printer speaks, and it was built
 * for Latin text: you send characters, the printer looks them up in a code
 * page it holds in ROM, and paper comes out. None of those code pages has
 * Arabic in it, and none of the printers in these shops joins Arabic letters
 * up or lays a line out right to left. A receipt sent as text would come out
 * as isolated letters in the wrong order, which is worse than no receipt.
 *
 * So the receipt is drawn, not typed. The browser lays out the Arabic or
 * Kurdish — it already knows how, it is doing it on the screen — onto a
 * canvas the exact width of the paper, and what goes down the wire is a
 * picture. That costs speed: a picture is twenty-odd kilobytes where text
 * would be one, and over Bluetooth that is seconds rather than an instant.
 * It is the right trade. A fast receipt nobody can read is not a receipt.
 *
 * English shops get the same treatment, so that what the cashier sees on
 * screen and what comes out of the printer stay one document rather than two
 * that drift apart.
 */

import { money } from "./money";
import { formatDateTime, translate, type Lang } from "./i18n";
import { receiptLabel } from "./migrate";
import type { Sale, Settings } from "./types";

/** Printable dots across, by paper width. The paper is wider than this: a
    58mm roll prints 48mm of it, an 80mm roll 72mm. */
export const DOTS: Record<PaperWidth, number> = { 58: 384, 80: 576 };

export type PaperWidth = 58 | 80;

const ESC = 0x1b;
const GS = 0x1d;

/* ------------------------------------------------------------------ raster */

export interface Mono {
  width: number;
  height: number;
  /** One bit per dot, 1 = burn. Rows padded to whole bytes. */
  bits: Uint8Array;
}

/**
 * Greyscale a canvas's pixels down to the one bit a thermal head has.
 *
 * A plain threshold, not dithering. Receipts are black text on white with
 * nothing in between, so there is no tone to dither, and dithering a sharp
 * edge only makes the small type furry.
 */
export function toMono(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 160,
): Mono {
  const rowBytes = Math.ceil(width / 8);
  const bits = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      const alpha = pixels[at + 3];
      /* Anything the drawing never touched is paper, not ink. */
      const luma =
        alpha === 0
          ? 255
          : (pixels[at] * 299 + pixels[at + 1] * 587 + pixels[at + 2] * 114) / 1000;
      if (luma < threshold) {
        bits[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }
  return { width, height, bits };
}

/**
 * `GS v 0` — print a raster bitmap.
 *
 * Sent in bands rather than one command per receipt. A printer with a small
 * buffer handed forty kilobytes in one go prints half a receipt and stops,
 * and the ones in these shops have small buffers.
 */
export function rasterCommands(mono: Mono, bandRows = 64): Uint8Array[] {
  const rowBytes = Math.ceil(mono.width / 8);
  const out: Uint8Array[] = [];
  for (let top = 0; top < mono.height; top += bandRows) {
    const rows = Math.min(bandRows, mono.height - top);
    const header = new Uint8Array([
      GS,
      0x76,
      0x30,
      0, // normal size, no doubling
      rowBytes & 0xff,
      (rowBytes >> 8) & 0xff,
      rows & 0xff,
      (rows >> 8) & 0xff,
    ]);
    const body = mono.bits.subarray(top * rowBytes, (top + rows) * rowBytes);
    const band = new Uint8Array(header.length + body.length);
    band.set(header, 0);
    band.set(body, header.length);
    out.push(band);
  }
  return out;
}

/** Wake the printer up and clear whatever the last job left set. */
export const INIT = new Uint8Array([ESC, 0x40]);

/**
 * Enough blank paper to tear against, then a cut for the printers that have a
 * blade.
 *
 * The cut is sent to every printer. One without a blade ignores it, which is
 * the whole reason to send it: there is no way to ask, and feeding paper a
 * shop then has to tear by hand is cheaper than a receipt that comes out
 * joined to the last one.
 */
export const FEED_AND_CUT = new Uint8Array([
  ESC, 0x64, 0x04, // feed four lines
  GS, 0x56, 0x42, 0x00, // partial cut, feeding first
]);

/* ---------------------------------------------------------------- the page */

type Piece =
  | { kind: "text"; text: string; align: "start" | "center" | "end"; size: number; bold?: boolean }
  | { kind: "row"; label: string; value: string; size: number; bold?: boolean }
  | { kind: "rule" }
  | { kind: "gap"; height: number };

/** The same receipt the screen shows, as instructions for drawing it. */
function pieces(sale: Sale, settings: Settings): Piece[] {
  const lang = settings.lang;
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
  const m = (value: number) => money(value, lang);
  const body = 22;

  const out: Piece[] = [
    { kind: "text", text: settings.shopName, align: "center", size: 30, bold: true },
  ];
  if (settings.addressLine)
    out.push({ kind: "text", text: settings.addressLine, align: "center", size: body });
  if (settings.phone)
    out.push({ kind: "text", text: settings.phone, align: "center", size: body });

  out.push({ kind: "rule" });
  out.push({
    kind: "row",
    label: t("receipt.no", { no: receiptLabel(sale) }),
    value: formatDateTime(sale.at),
    size: body,
  });
  out.push({ kind: "rule" });

  for (const line of sale.lines) {
    out.push({ kind: "text", text: line.name, align: "start", size: body });
    out.push({
      kind: "row",
      label: `  ${line.qty} × ${m(line.price)}`,
      value: m(line.price * line.qty),
      size: body,
    });
  }

  out.push({ kind: "rule" });
  out.push({ kind: "row", label: t("receipt.subtotal"), value: m(sale.subtotal), size: body });
  if (sale.discount)
    out.push({ kind: "row", label: t("receipt.discount"), value: `-${m(sale.discount)}`, size: body });
  if (sale.rounding)
    out.push({ kind: "row", label: t("receipt.rounding"), value: m(sale.rounding), size: body });
  out.push({ kind: "row", label: t("receipt.total"), value: m(sale.total), size: 28, bold: true });
  out.push({
    kind: "row",
    label: t(sale.method === "cash" ? "receipt.cash" : "receipt.card"),
    value: m(sale.tendered),
    size: body,
  });
  if (sale.method === "cash")
    out.push({ kind: "row", label: t("receipt.change"), value: m(sale.change), size: body });

  if (sale.voidedAt)
    out.push({ kind: "text", text: t("receipt.voided"), align: "center", size: 26, bold: true });

  out.push({ kind: "gap", height: 10 });
  if (settings.receiptFooter) {
    out.push({ kind: "rule" });
    out.push({ kind: "text", text: settings.receiptFooter, align: "center", size: body });
  }
  out.push({ kind: "text", text: "Powered by CoreCashier", align: "center", size: 17 });
  return out;
}

const RTL: Lang[] = ["ar", "ckb"];

function face(size: number, bold?: boolean): string {
  /* A system stack rather than a bundled face: whatever the tablet uses for
     Arabic on screen is the one that will shape it correctly here too. */
  return `${bold ? "700 " : ""}${size}px system-ui, "Segoe UI", Roboto, sans-serif`;
}

/**
 * Draws the receipt at the paper's exact width and hands back the picture.
 *
 * Two passes: one to find out how tall it needs to be, one to draw it. A
 * canvas cannot be grown without clearing it, and guessing the height means
 * either a cut-off receipt or a strip of blank paper on every sale.
 */
export function drawReceipt(
  sale: Sale,
  settings: Settings,
  width: PaperWidth,
): Mono | null {
  const dots = DOTS[width];
  const margin = 8;
  const inner = dots - margin * 2;
  const gap = 6;
  const rtl = RTL.includes(settings.lang);
  const plan = pieces(sale, settings);

  const canvas = document.createElement("canvas");
  canvas.width = dots;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  /** Wrapping a long product name rather than letting it run off the paper. */
  function wrap(text: string, size: number, bold?: boolean): string[] {
    context!.font = face(size, bold);
    if (context!.measureText(text).width <= inner) return [text];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context!.measureText(candidate).width <= inner) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = word;
    }
    if (line) lines.push(line);
    return lines;
  }

  /**
   * A label and a value that will not fit side by side, made to fit.
   *
   * 48mm of paper is not much, and the row that runs out of it first is the
   * one carrying the receipt number and the date — in Arabic, at the top of
   * every receipt. Left alone the two run into each other and the number
   * prints over the date, which is exactly the thing somebody later needs to
   * read. Shrinking that one row is uglier than the alternative and far
   * better than losing it.
   */
  function fit(piece: Piece & { kind: "row" }): number {
    let size = piece.size;
    while (size > 13) {
      context!.font = face(size, piece.bold);
      const width =
        context!.measureText(piece.label).width +
        context!.measureText(piece.value).width +
        10;
      if (width <= inner) break;
      size -= 1;
    }
    return size;
  }

  // Pass one: how tall.
  let height = margin;
  const wrapped = new Map<Piece, string[]>();
  const fitted = new Map<Piece, number>();
  for (const piece of plan) {
    if (piece.kind === "rule") {
      height += gap + 2;
    } else if (piece.kind === "gap") {
      height += piece.height;
    } else if (piece.kind === "row") {
      const size = fit(piece);
      fitted.set(piece, size);
      height += size + gap;
    } else {
      const lines = wrap(piece.text, piece.size, piece.bold);
      wrapped.set(piece, lines);
      height += lines.length * (piece.size + 2) + gap - 2;
    }
  }
  height += margin;

  canvas.height = height;
  /* Setting the height clears the canvas and resets the context, so the paper
     is painted and the direction set after, not before. */
  context.direction = rtl ? "rtl" : "ltr";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, dots, height);
  context.fillStyle = "#000000";
  context.textBaseline = "top";

  const startX = rtl ? dots - margin : margin;
  const endX = rtl ? margin : dots - margin;
  const startAlign = rtl ? "right" : "left";
  const endAlign = rtl ? "left" : "right";

  let y = margin;
  for (const piece of plan) {
    if (piece.kind === "rule") {
      y += gap / 2;
      context.fillRect(margin, y, inner, 2);
      y += gap / 2 + 2;
      continue;
    }
    if (piece.kind === "gap") {
      y += piece.height;
      continue;
    }
    if (piece.kind === "row") {
      const size = fitted.get(piece) ?? piece.size;
      context.font = face(size, piece.bold);
      context.textAlign = startAlign;
      context.fillText(piece.label, startX, y);
      context.textAlign = endAlign;
      context.fillText(piece.value, endX, y);
      y += size + gap;
      continue;
    }
    context.font = face(piece.size, piece.bold);
    const lines = wrapped.get(piece) ?? [piece.text];
    context.textAlign =
      piece.align === "center" ? "center" : piece.align === "start" ? startAlign : endAlign;
    const x = piece.align === "center" ? dots / 2 : piece.align === "start" ? startX : endX;
    for (const line of lines) {
      context.fillText(line, x, y);
      y += piece.size + 2;
    }
    y += gap - 2;
  }

  const image = context.getImageData(0, 0, dots, height);
  return toMono(image.data, dots, height);
}

/** The whole job: wake up, print the picture, feed and cut. */
export function receiptJob(
  sale: Sale,
  settings: Settings,
  width: PaperWidth,
): Uint8Array[] | null {
  const mono = drawReceipt(sale, settings, width);
  if (!mono) return null;
  return [INIT, ...rasterCommands(mono), FEED_AND_CUT];
}
