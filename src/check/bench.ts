/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The speed test: what CoreCashier does, done on purpose and timed.
 *
 * Not a synthetic benchmark. A tablet that scores well on arithmetic and
 * badly on laying out a shelf is a tablet that feels slow at a counter, and
 * the counter is the only opinion that matters. So the three things measured
 * here are the three things a cashier waits for: the shelf being drawn, the
 * search box answering a keystroke, and a full basket being totalled.
 *
 * Dropped frames are measured separately and matter most. "Slow" to the
 * person holding the tablet almost never means a slow total — it means the
 * list stuttered under their thumb.
 */

import { SPEED, grade, worst, type Verdict } from "./standard";
import type { Result } from "./probes";

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
}

/** A shelf the size of a real shop's, built once. */
function shelf(count: number): Product[] {
  const words = ["ماء", "خبز", "حليب", "شاي", "رز", "زيت", "سكر", "جبن"];
  const out: Product[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `p-${i}`,
      name: `${words[i % words.length]} ${i}`,
      barcode: String(6221000000000 + i),
      price: 250 * ((i % 20) + 1),
      stock: i % 97,
    });
  }
  return out;
}

/** Lays 500 products out as real elements. `offsetHeight` forces the browser
    to actually do the layout rather than leaving it until after the clock
    has been read. */
function timeRender(products: Product[]): number {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-99999px;top:0;width:360px";
  document.body.appendChild(host);
  const started = performance.now();
  const fragment = document.createDocumentFragment();
  for (const product of products) {
    const row = document.createElement("div");
    row.className = "flex justify-between px-3 py-2 text-[14px]";
    const name = document.createElement("span");
    name.textContent = product.name;
    const price = document.createElement("span");
    price.textContent = `${product.price.toLocaleString("en-GB")} د.ع`;
    row.append(name, price);
    fragment.append(row);
  }
  host.append(fragment);
  void host.offsetHeight;
  const took = performance.now() - started;
  host.remove();
  return took;
}

/** The search box, as it behaves on every keystroke: the whole shelf filtered
    by name and barcode, several times over. */
function timeSearch(products: Product[]): number {
  const terms = ["ما", "ماء", "خبز", "62210", "9"];
  const started = performance.now();
  let found = 0;
  for (let round = 0; round < 20; round++) {
    const term = terms[round % terms.length];
    found += products.filter(
      (product) =>
        product.name.includes(term) || product.barcode.includes(term),
    ).length;
  }
  const took = performance.now() - started;
  /* Used, so the whole loop cannot be optimised away. */
  if (found < 0) throw new Error("impossible");
  return took;
}

/** Pricing a fifty-line basket, a thousand times, the way the till prices one
    on every change to the cart. */
function timeTotal(products: Product[]): number {
  const basket = products.slice(0, 50).map((product, i) => ({
    product,
    qty: (i % 4) + 1,
  }));
  const started = performance.now();
  let total = 0;
  for (let round = 0; round < 1000; round++) {
    let subtotal = 0;
    for (const line of basket) subtotal += line.product.price * line.qty;
    const afterDiscount = Math.max(0, subtotal - 500);
    total = Math.round(afterDiscount / 250) * 250;
  }
  const took = performance.now() - started;
  if (total < 0) throw new Error("impossible");
  return took;
}

/**
 * Frames dropped over a second of scrolling.
 *
 * A frame is counted as dropped when the gap since the last one is more than
 * about a frame and a half — the point at which a thumb feels a stutter
 * rather than seeing one.
 */
function countDroppedFrames(): Promise<number> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;left:-99999px;top:0;width:360px;height:400px;overflow:auto";
    const tall = document.createElement("div");
    tall.style.height = "8000px";
    tall.textContent = "x";
    host.append(tall);
    document.body.appendChild(host);

    let last = performance.now();
    let dropped = 0;
    let frames = 0;
    const started = last;

    const step = (now: number) => {
      const gap = now - last;
      last = now;
      frames++;
      if (frames > 2 && gap > 25) dropped++;
      host.scrollTop = (host.scrollTop + 60) % 7000;
      if (now - started < 1000) requestAnimationFrame(step);
      else {
        host.remove();
        resolve(dropped);
      }
    };
    requestAnimationFrame(step);
  });
}

export interface Speed {
  render: number;
  search: number;
  total: number;
  dropped: number;
  verdict: Verdict;
}

/** Yields between the parts so the screen can keep drawing — a progress bar
    that freezes during the speed test is its own bad look. */
const breathe = () => new Promise((resolve) => setTimeout(resolve, 30));

export async function runSpeed(): Promise<Result & { speed: Speed }> {
  if (typeof document === "undefined") {
    return {
      id: "speed",
      verdict: "untested",
      reading: "—",
      because: "noApi",
      speed: { render: 0, search: 0, total: 0, dropped: 0, verdict: "untested" },
    };
  }

  const products = shelf(500);
  const render = timeRender(products);
  await breathe();
  const search = timeSearch(products);
  await breathe();
  const total = timeTotal(products);
  await breathe();
  const dropped = await countDroppedFrames();

  const verdict = worst([
    grade(render, SPEED.render),
    grade(search, SPEED.search),
    grade(total, SPEED.total),
    grade(dropped, SPEED.dropped),
  ]);

  return {
    id: "speed",
    verdict,
    reading: `shelf ${Math.round(render)}ms · search ${Math.round(search)}ms · basket ${Math.round(total)}ms · ${dropped} frames dropped`,
    code: verdict === "pass" ? undefined : "TB-04",
    speed: { render, search, total, dropped, verdict },
  };
}
