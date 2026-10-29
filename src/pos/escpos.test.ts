/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The bytes that go down the wire to a roll printer.
 *
 * A receipt that comes out with a band missing from the middle, or shifted a
 * dot to the left on every row, looks exactly like a broken printer — which
 * is an afternoon lost to the wrong problem. The packing and the band headers
 * are arithmetic, so they are checked here rather than against a printer.
 *
 * The drawing itself needs a canvas and is not covered here; it is checked by
 * eye, against paper.
 */

import { describe, expect, it } from "vitest";
import { DOTS, FEED_AND_CUT, INIT, rasterCommands, toMono } from "./escpos";

/** A row of pixels, from a list of 0 (black) or 255 (white) luma values. */
function row(values: number[]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(values.length * 4);
  values.forEach((value, i) => {
    out[i * 4] = value;
    out[i * 4 + 1] = value;
    out[i * 4 + 2] = value;
    out[i * 4 + 3] = 255;
  });
  return out;
}

describe("packing a picture into dots", () => {
  it("puts the leftmost dot in the top bit", () => {
    /* A thermal head reads a byte left to right from the high bit. Get this
       backwards and every receipt comes out mirrored within each byte. */
    const mono = toMono(row([0, 255, 255, 255, 255, 255, 255, 255]), 8, 1);
    expect(mono.bits).toEqual(new Uint8Array([0b10000000]));
  });

  it("packs eight dots to the byte in order", () => {
    const mono = toMono(row([0, 0, 255, 0, 255, 255, 0, 255]), 8, 1);
    expect(mono.bits).toEqual(new Uint8Array([0b11010010]));
  });

  it("pads each row out to a whole byte", () => {
    /* 12 dots is a byte and a half, and a row that carried its half-byte into
       the next row would skew the whole picture diagonally. */
    const mono = toMono(row(new Array(24).fill(0)), 12, 2);
    expect(mono.bits.length).toBe(4);
    expect([...mono.bits]).toEqual([0xff, 0xf0, 0xff, 0xf0]);
  });

  it("treats anything never drawn on as paper", () => {
    /* A canvas starts transparent. Read naively, transparent black is black,
       and the shop gets a solid stripe of ink down the receipt. */
    const blank = new Uint8ClampedArray(8 * 4);
    expect(toMono(blank, 8, 1).bits).toEqual(new Uint8Array([0]));
  });

  it("burns dark grey and leaves light grey alone", () => {
    const mono = toMono(row([100, 200, 100, 200, 100, 200, 100, 200]), 8, 1);
    expect(mono.bits).toEqual(new Uint8Array([0b10101010]));
  });
});

describe("the raster commands", () => {
  const tall = toMono(
    new Uint8ClampedArray(DOTS[58] * 200 * 4),
    DOTS[58],
    200,
  );

  it("sends a 58mm receipt 48 bytes to the row", () => {
    const [first] = rasterCommands(tall, 64);
    /* GS v 0, mode 0, then the width in bytes and the height in rows, each
       little-endian. */
    expect([...first.subarray(0, 8)]).toEqual([0x1d, 0x76, 0x30, 0, 48, 0, 64, 0]);
  });

  it("breaks a long receipt into bands a small buffer can swallow", () => {
    const bands = rasterCommands(tall, 64);
    expect(bands).toHaveLength(4);
    /* The last band is the remainder, not a full one padded out. */
    expect([...bands[3].subarray(6, 8)]).toEqual([8, 0]);
  });

  it("sends every row exactly once", () => {
    const bands = rasterCommands(tall, 64);
    const sent = bands.reduce((total, band) => total + band.length - 8, 0);
    expect(sent).toBe(48 * 200);
  });

  it("handles a receipt shorter than one band", () => {
    const stub = toMono(new Uint8ClampedArray(DOTS[58] * 10 * 4), DOTS[58], 10);
    const bands = rasterCommands(stub, 64);
    expect(bands).toHaveLength(1);
    expect([...bands[0].subarray(6, 8)]).toEqual([10, 0]);
  });

  it("knows how wide the two rolls are", () => {
    expect(DOTS[58]).toBe(384);
    expect(DOTS[80]).toBe(576);
  });
});

describe("the commands around the picture", () => {
  it("wakes the printer up first", () => {
    expect([...INIT]).toEqual([0x1b, 0x40]);
  });

  it("feeds clear of the head before cutting", () => {
    /* Cutting without feeding takes the blade through the last line of the
       receipt. The cut is sent to every printer; one without a blade ignores
       it, and there is no way to ask which is which. */
    expect([...FEED_AND_CUT]).toEqual([0x1b, 0x64, 0x04, 0x1d, 0x56, 0x42, 0x00]);
  });
});
