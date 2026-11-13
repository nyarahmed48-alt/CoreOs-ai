/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A backup a person can actually read.
 *
 * It used to be a .json file. That is the right thing for a machine and the
 * wrong thing for a shop: a shopkeeper who opens their backup and sees a wall
 * of brackets concludes something has gone wrong, and the one file holding
 * their year is the one file they are now inclined to delete. It matters most
 * on a loaner, where the whole handover rests on them keeping it.
 *
 * So the backup is now an HTML page. Double-tapped, it opens in any browser
 * and shows the shop what is in it — how many sales, what they came to, the
 * shelf, who owes what. Fed back to Restore, it puts the whole till back,
 * because the real data is still in there verbatim, in a script tag the
 * browser does not draw.
 *
 * It is written as plain English and Arabic together, deliberately: the shop
 * reads one, and whoever ends up supporting them reads the other.
 */

import type { PosData } from "./types";
import { money } from "./money";

/** Where the real data sits inside the page. */
const DATA_ID = "corecashier-backup";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Day by day, newest first — the view a shop actually wants from a backup. */
function byDay(data: PosData): { day: string; count: number; total: number }[] {
  const days = new Map<string, { count: number; total: number }>();
  for (const sale of data.sales) {
    if (sale.voidedAt) continue;
    const day = sale.at.slice(0, 10);
    const row = days.get(day) ?? { count: 0, total: 0 };
    row.count += 1;
    row.total += sale.total;
    days.set(day, row);
  }
  return [...days.entries()]
    .map(([day, row]) => ({ day, ...row }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

/**
 * The whole backup: a readable page with the data inside it.
 *
 * The data goes in a script tag rather than anywhere visible. A browser will
 * not render it, nothing in the page can run it — there is no script in here
 * at all — and `</script>` inside a product name cannot end the block early,
 * which is the one way a shop's own typing could otherwise break its backup.
 */
export function backupPage(data: PosData): string {
  const { settings } = data;
  const m = (value: number) => money(value, "en");
  const days = byDay(data);
  const takings = days.reduce((sum, row) => sum + row.total, 0);
  const owed = data.debts.reduce(
    (sum, entry) => sum + (entry.kind === "paid" ? -entry.amount : entry.amount),
    0,
  );

  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  const row = (left: string, right: string) =>
    `<tr><td>${escapeHtml(left)}</td><td class="n">${escapeHtml(right)}</td></tr>`;

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CoreCashier backup — ${escapeHtml(settings.shopName)} — ${new Date().toISOString().slice(0, 10)}</title>
<style>
  body { margin:0; background:#f4f5f8; color:#15181f; font:15px/1.6 system-ui, "Segoe UI", Roboto, sans-serif; }
  .sheet { max-width:720px; margin:0 auto; background:#fff; padding:28px 24px 40px; min-height:100vh; }
  h1 { font-size:22px; margin:0 0 4px; }
  h2 { font-size:15px; text-transform:uppercase; letter-spacing:.08em; color:#6b7280; margin:28px 0 8px; }
  p.sub { margin:0; color:#6b7280; }
  .note { background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; padding:14px 16px; margin:22px 0; }
  .note b { display:block; margin-bottom:4px; }
  .ar { direction:rtl; text-align:right; font-size:14px; color:#374151; margin-top:10px; }
  table { border-collapse:collapse; width:100%; font-size:14px; }
  td, th { border-bottom:1px solid #e5e7eb; padding:7px 4px; text-align:left; }
  th { color:#6b7280; font-weight:600; }
  td.n, th.n { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .big { font-size:26px; font-weight:700; }
  footer { margin-top:32px; color:#9ca3af; font-size:12.5px; }
</style>
</head>
<body>
<div class="sheet">
  <h1>${escapeHtml(settings.shopName)}</h1>
  <p class="sub">CoreCashier backup · till ${escapeHtml(settings.tillId)} · saved ${new Date().toISOString().slice(0, 16).replace("T", " ")}</p>

  <div class="note">
    <b>This file is your till. Keep it safe.</b>
    To put it back on a tablet: open CoreCashier, go to Settings, then Backup,
    then Restore, and choose this file. Everything below comes back exactly as
    it was.
    <div class="ar">
      <b>هذا الملف هو صندوقك. احتفظ به.</b>
      لإعادته إلى جهاز: افتح CoreCashier، ثم «الإعدادات»، ثم «النسخة الاحتياطية»،
      ثم «استعادة»، واختر هذا الملف.
    </div>
  </div>

  <h2>What is in it</h2>
  <table>
    ${row("Sales", String(data.sales.length))}
    ${row("Takings in those sales", m(takings))}
    ${row("Products on the shelf", String(data.products.filter((p) => !p.archived).length))}
    ${row("Customers in the debt book", String(data.customers.length))}
    ${row("Still owed to the shop", m(owed))}
    ${row("Days closed off", String(data.closes.length))}
    ${row("Cashiers", String(data.staff.length))}
  </table>

  <h2>Day by day</h2>
  ${
    days.length === 0
      ? "<p>No sales in this backup.</p>"
      : `<table><tr><th>Day</th><th class="n">Sales</th><th class="n">Takings</th></tr>${days
          .slice(0, 60)
          .map(
            (one) =>
              `<tr><td>${one.day}</td><td class="n">${one.count}</td><td class="n">${escapeHtml(m(one.total))}</td></tr>`,
          )
          .join("")}</table>${days.length > 60 ? `<p class="sub">…and ${days.length - 60} earlier days, all kept in the file.</p>` : ""}`
  }

  <h2>The shelf</h2>
  ${
    data.products.length === 0
      ? "<p>No products in this backup.</p>"
      : `<table><tr><th>Product</th><th>Barcode</th><th class="n">Price</th><th class="n">In stock</th></tr>${data.products
          .filter((product) => !product.archived)
          .slice(0, 400)
          .map(
            (product) =>
              `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.barcode ?? "")}</td><td class="n">${escapeHtml(m(product.price))}</td><td class="n">${product.stock}</td></tr>`,
          )
          .join("")}</table>`
  }

  <footer>
    Saved by CoreCashier. The whole till is inside this file, including the
    parts not shown above. Do not edit it — open CoreCashier and restore it.
  </footer>
</div>
<script type="application/json" id="${DATA_ID}">${json}</script>
</body>
</html>
`;
}

/**
 * Gets the data back out of whatever the shop chose.
 *
 * Takes the readable page, and a plain .json file from any till saved before
 * this existed. Backups outlive the code that wrote them, so the old shape
 * has to keep working for as long as a shop might still be holding one.
 */
export function dataFromBackup(raw: string): string {
  const text = raw.trim();
  if (text.startsWith("{")) return text;

  const tag = new RegExp(
    `<script[^>]*id=["']${DATA_ID}["'][^>]*>([\\s\\S]*?)</script>`,
    "i",
  );
  const found = tag.exec(raw);
  if (found) {
    return found[1]
      .replace(/\\u003c/gi, "<")
      .replace(/\\u003e/gi, ">")
      .replace(/\\u0026/gi, "&")
      .trim();
  }
  /* Neither: hand back what came in, so the caller's own check is what
     refuses it and the shop gets the ordinary "not a till backup" message. */
  return text;
}
