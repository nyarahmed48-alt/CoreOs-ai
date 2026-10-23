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
import { useT } from "./useT";
import { formatDateTime, translate, type Lang } from "./i18n";

export function receiptDate(iso: string): string {
  return formatDateTime(iso);
}

/** The same receipt as plain text, for sharing to a phone or saving as a
    file. Padded to 32 characters, the width of a 72mm roll. */
export function receiptText(sale: Sale, settings: Settings): string {
  const lang = settings.lang;
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
  const m = (value: number) => money(value, lang);
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
  out.push(row(t("receipt.no", { no: sale.no }), receiptDate(sale.at).split(",")[0] ?? ""));
  out.push("-".repeat(W));

  for (const line of sale.lines) {
    out.push(line.name.slice(0, W));
    out.push(row(`  ${line.qty} x ${m(line.price)}`, m(line.price * line.qty)));
  }

  out.push("-".repeat(W));
  out.push(row(t("receipt.subtotal"), m(sale.subtotal)));
  if (sale.discount) out.push(row(t("receipt.discount"), `-${m(sale.discount)}`));
  if (sale.rounding) out.push(row(t("receipt.rounding"), m(sale.rounding)));
  out.push(row(t("receipt.total"), m(sale.total)));
  out.push(
    row(t(sale.method === "cash" ? "receipt.cash" : "receipt.card"), m(sale.tendered)),
  );
  if (sale.method === "cash") out.push(row(t("receipt.change"), m(sale.change)));
  if (sale.voidedAt) out.push(centre(t("receipt.voided")));
  out.push("");
  if (settings.receiptFooter) out.push(centre(settings.receiptFooter));
  return out.join("\n");
}

export function Receipt({ sale, settings }: { sale: Sale; settings: Settings }) {
  const { t, m, lang, dir } = useT();
  const line = "border-t border-dashed border-[#c2c6d0]";

  return (
    <div
      dir={dir}
      lang={lang}
      className="pos-print mx-auto w-full max-w-[302px] bg-white px-4 py-5 font-mono text-[12px] leading-[1.6] text-black"
    >
      <div className="text-center">
        <p className="text-[15px] font-bold uppercase tracking-[0.06em]">
          {settings.shopName}
        </p>
        {settings.addressLine ? <p>{settings.addressLine}</p> : null}
        {settings.phone ? <p>{settings.phone}</p> : null}
      </div>

      <div className={`mt-3 flex justify-between pt-2 ${line}`}>
        <span>{t("receipt.no", { no: sale.no })}</span>
        <span dir="ltr">{receiptDate(sale.at)}</span>
      </div>

      <div className={`mt-2 space-y-1 pt-2 ${line}`}>
        {sale.lines.map((item) => (
          <div key={item.productId}>
            <p>{item.name}</p>
            <div className="flex justify-between">
              <span>
                {item.qty} x {m(item.price)}
              </span>
              <span>{m(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-2 space-y-1 pt-2 ${line}`}>
        <Row label={t("receipt.subtotal")} value={m(sale.subtotal)} />
        {sale.discount ? (
          <Row label={t("receipt.discount")} value={`-${m(sale.discount)}`} />
        ) : null}
        {sale.rounding ? (
          <Row label={t("receipt.rounding")} value={m(sale.rounding)} />
        ) : null}
        <div className="flex justify-between text-[15px] font-bold">
          <span>{t("receipt.total")}</span>
          <span>{m(sale.total)}</span>
        </div>
        <Row
          label={t(sale.method === "cash" ? "receipt.cash" : "receipt.card")}
          value={m(sale.tendered)}
        />
        {sale.method === "cash" ? (
          <Row label={t("receipt.change")} value={m(sale.change)} />
        ) : null}
      </div>

      {sale.voidedAt ? (
        <p className="mt-3 text-center text-[13px] font-bold">{t("receipt.voided")}</p>
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
  const { t } = useT();

  async function share() {
    const text = receiptText(sale, settings);
    const title = `${settings.shopName} — ${translate(settings.lang, "receipt.no", { no: sale.no })}`;
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
        <Printer size={16} /> {t("receipt.print")}
      </Button>
      <Button variant="ghost" className="flex-1" onClick={share}>
        <Share2 size={16} /> {t("receipt.share")}
      </Button>
    </div>
  );
}
