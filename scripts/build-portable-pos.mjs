/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Folds the built till into one HTML file.
 *
 * Vite emits a page, a script and a stylesheet; a shop wants a file it can
 * copy onto a USB stick, double-click, and use. So the script and the styles
 * go inline, nothing is left pointing at a path, and the result opens over
 * file:// with no server, no build step and no internet.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUILT = "dist-pos";
const OUT = "CoreOS_Market_POS_Portable.html";

const page = join(BUILT, "pos-portable.html");
if (!existsSync(page)) {
  console.error(`${page} is missing — run the vite build first.`);
  process.exit(1);
}

let html = readFileSync(page, "utf8");

/** `</script>` inside a string literal in the bundle would close the tag it is
    being inlined into. */
const safe = (code) => code.replace(/<\/script>/gi, "<\\/script>");

html = html.replace(
  /<script[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_match, src) => {
    const code = readFileSync(join(BUILT, src.replace(/^\//, "")), "utf8");
    return `<script type="module">\n${safe(code)}\n</script>`;
  },
);

html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (_match, href) => {
    const css = readFileSync(join(BUILT, href.replace(/^\//, "")), "utf8");
    return `<style>\n${css}\n</style>`;
  },
);

const leftover = html.match(/(?:src|href)="\/assets?\/[^"]+"/g);
if (leftover) {
  console.error(`Still pointing at files on disk: ${leftover.join(", ")}`);
  process.exit(1);
}

writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`${OUT} — ${kb} kB, self-contained.`);
