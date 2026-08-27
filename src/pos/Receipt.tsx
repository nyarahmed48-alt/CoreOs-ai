/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The receipt, on screen and on paper.
 *
 * It is laid out at 72mm — the width of the thermal rolls these shops already
 * own — in a monospace face, so what the cashier sees and what comes out of
 * the printer are the same document. Printing is the browser's own dialogue:
 * a market till is plugged into whatever printer was cheapest, and the driver
 * knows more about it than we do.
 */

import { Printer, Share2 } from "lucide-react";
import type { Sale, Settings } from "./types";
import { money } from "./money";
import { Button } from "./ui";

export function receiptDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The same receipt as plain text, for sharing to a phone or saving as a
    file. Padded to 32 characters, the width of a 72mm roll. */
export function receiptText(sale: Sale, settings: Settings): string {
  const W = 32;
  const centre = (text: string) =>
    text.length >= W ? text : " ".repeat(Math.floor((W - text.length) / 2)) + text;
  const row = (left: string, right: string) => {
    const gap = Math.max(1, W - left.length - right.length);
    return left + " ".repeat(gap) + right;
  };

  const out: string[] = [centre(settings.shopName)];
  if (settings.addressLine) out.push(centre(settings.addressLine));
  if (settings.phone) out.push(centre(settings.phone));
  out.push("-".repeat(W));
  out.push(row(`Receipt #${sale.no}`, receiptDate(sale.at).split(",")[0] ?? ""));
  out.push("-".repeat(W));

  for (const line of sale.lines) {
    out.push(line.name.slice(0, W));
    out.push(row(`  ${line.qty} x ${money(line.price)}`, money(line.price * line.qty)));
  }

  out.push("-".repeat(W));
  out.push(row("Subtotal", money(sale.subtotal)));
  if (sale.discount) out.push(row("Discount", `-${money(sale.discount)}`));
  if (sale.rounding) out.push(row("Rounding", money(sale.rounding)));
  out.push(row("TOTAL", money(sale.total)));
  out.push(row(sale.method === "cash" ? "Cash" : "Card", money(sale.tendered)));
  if (sale.method === "cash") out.push(row("Change", money(sale.change)));
  if (sale.voidedAt) out.push(centre("*** VOIDED ***"));
  out.push("");
  if (settings.receiptFooter) out.push(centre(settings.receiptFooter));
  return out.join("\n");
}

export function Receipt({ sale, settings }: { sale: Sale; settings: Settings }) {
  const line = "border-t border-dashed border-[#c2c6d0]";

  return (
    <div className="pos-print mx-auto w-full max-w-[302px] bg-white px-4 py-5 font-mono text-[12px] leading-[1.6] text-black">
      <div className="text-center">
        <p className="text-[15px] font-bold uppercase tracking-[0.06em]">
          {settings.shopName}
        </p>
        {settings.addressLine ? <p>{settings.addressLine}</p> : null}
        {settings.phone ? <p>{settings.phone}</p> : null}
      </div>

      <div className={`mt-3 flex justify-between pt-2 ${line}`}>
        <span>Receipt #{sale.no}</span>
        <span>{receiptDate(sale.at)}</span>
      </div>

      <div className={`mt-2 space-y-1 pt-2 ${line}`}>
        {sale.lines.map((item) => (
          <div key={item.productId}>
            <p>{item.name}</p>
            <div className="flex justify-between">
              <span>
                {item.qty} x {money(item.price)}
              </span>
              <span>{money(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-2 space-y-1 pt-2 ${line}`}>
        <Row label="Subtotal" value={money(sale.subtotal)} />
        {sale.discount ? <Row label="Discount" value={`-${money(sale.discount)}`} /> : null}
        {sale.rounding ? <Row label="Rounding" value={money(sale.rounding)} /> : null}
        <div className="flex justify-between text-[15px] font-bold">
          <span>TOTAL</span>
          <span>{money(sale.total)}</span>
        </div>
        <Row
          label={sale.method === "cash" ? "Cash" : "Card"}
          value={money(sale.tendered)}
        />
        {sale.method === "cash" ? <Row label="Change" value={money(sale.change)} /> : null}
      </div>

      {sale.voidedAt ? (
        <p className="mt-3 text-center text-[13px] font-bold">*** VOIDED ***</p>
      ) : null}

      {settings.receiptFooter ? (
        <p className={`mt-3 pt-2 text-center ${line}`}>{settings.receiptFooter}</p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * Print and share, side by side.
 *
 * Share falls back to a downloaded text file wherever the Web Share API is
 * missing or refuses — desktop browsers mostly — so the button never dead-ends.
 */
export function ReceiptActions({
  sale,
  settings,
  className = "",
}: {
  sale: Sale;
  settings: Settings;
  className?: string;
}) {
  async function share() {
    const text = receiptText(sale, settings);
    const title = `${settings.shopName} — receipt #${sale.no}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (error) {
        // The customer changed their mind mid-share; not a failure to report.
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${sale.no}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`pos-noprint flex gap-2 ${className}`}>
      <Button variant="ghost" className="flex-1" onClick={() => window.print()}>
        <Printer size={16} /> Print
      </Button>
      <Button variant="ghost" className="flex-1" onClick={share}>
        <Share2 size={16} /> Share
      </Button>
    </div>
  );
}
