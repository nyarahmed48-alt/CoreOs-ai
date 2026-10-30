/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The sample shelf has to be scannable.
 *
 * Twenty-four of the thirty-two barcodes we shipped had the wrong check
 * digit. Nothing on screen showed it — the till matches a barcode by string,
 * so typing one in worked fine — but every real scanner, the camera and the
 * handheld alike, computes the check digit and refuses a code that fails it.
 * The one thing that most needs demonstrating on a shopkeeper's counter was
 * the one thing that could not be.
 *
 * A made-up barcode is fine. A made-up barcode that is not a barcode is not.
 */

import { describe, expect, it } from "vitest";
import { seedProducts } from "./seed";

/**
 * The last digit of an EAN, worked out from the ones before it.
 *
 * Both lengths are on these shelves and they weight the digits the opposite
 * way round: EAN-13 starts at 1,3,1,3…, EAN-8 at 3,1,3,1…. Either way the
 * check digit is whatever takes the total to a multiple of ten.
 */
function checkDigit(body: string): number {
  const startsAtOne = body.length === 12;
  let total = 0;
  for (let i = 0; i < body.length; i++) {
    const odd = i % 2 === 0;
    total += Number(body[i]) * (startsAtOne ? (odd ? 1 : 3) : odd ? 3 : 1);
  }
  return (10 - (total % 10)) % 10;
}

describe("the sample shelf", () => {
  const products = seedProducts("en");

  it("has something on it", () => {
    expect(products.length).toBeGreaterThan(10);
  });

  it("carries only barcodes a scanner will accept", () => {
    const wrong = products
      .filter((product) => product.barcode)
      .filter((product) => {
        const code = product.barcode;
        if (!/^(\d{8}|\d{13})$/.test(code)) return true;
        const body = code.slice(0, -1);
        return checkDigit(body) !== Number(code[code.length - 1]);
      })
      .map((product) => `${product.name} (${product.barcode})`);

    expect(wrong).toEqual([]);
  });

  it("gives every product its own barcode", () => {
    /* Two products on one code means the camera picks whichever the search
       happens to find first, which is a wrong price at the counter. */
    const codes = products.map((product) => product.barcode).filter(Boolean);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
