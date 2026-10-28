/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Drawing a licence code as a QR code.
 *
 * This is the reason the long codes are workable at all: the owner holds up a
 * phone, the shop points the till's camera at it, and nobody types or reads
 * out a hundred characters. The codes are uppercase base32 and dashes, which
 * is exactly QR's alphanumeric mode, so the whole licence fits in a symbol a
 * cheap tablet camera reads from across a counter.
 *
 * The encoder comes from the barcode library the till already carries, so
 * this costs nothing new.
 */

/** One square path for the whole symbol: smaller than a rect per module by a
    long way, and it scales to whatever box it is dropped into. */
export interface Drawn {
  /** Modules across, not pixels. */
  size: number;
  path: string;
}

export async function drawQr(text: string): Promise<Drawn> {
  const { MultiFormatWriter, BarcodeFormat, EncodeHintType } = await import(
    "@zxing/library"
  );

  const hints = new Map();
  /* Medium correction. These are read off a phone screen held still, not off
     a crumpled packet, so spending the symbol's room on data rather than
     redundancy keeps the modules big enough for a 2-megapixel camera. */
  hints.set(EncodeHintType.ERROR_CORRECTION, "M");
  hints.set(EncodeHintType.MARGIN, 0);

  const matrix = new MultiFormatWriter().encode(
    text,
    BarcodeFormat.QR_CODE,
    0,
    0,
    hints,
  );

  const width = matrix.getWidth();
  const height = matrix.getHeight();
  let path = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size: Math.max(width, height), path };
}
