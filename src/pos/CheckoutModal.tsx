/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Taking the money.
 *
 * The whole screen is arranged around the one number that gets people
 * shortchanged: the change. Notes are tapped in as they are handed over —
 * two 10,000s is two taps — because that is what the cashier is physically
 * doing, and a running tendered total is easier to trust than arithmetic.
 */

import { useEffect, useState } from "react";
import { Banknote, CreditCard } from "lucide-react";
import { completeSale, usePos, type CartTotals } from "./store";
import { IQD_NOTES, amount, money, parseAmount } from "./money";
import { Button, Modal } from "./ui";
import { Receipt, ReceiptActions } from "./Receipt";
import type { PaymentMethod, Sale } from "./types";

export function CheckoutModal({
  totals,
  discount,
  onDiscountChange,
  onClose,
  onDone,
}: {
  totals: CartTotals;
  discount: number;
  onDiscountChange: (value: number) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const data = usePos();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState(0);
  const [sale, setSale] = useState<Sale | null>(null);

  const short = method === "cash" && tendered < totals.total;
  const change = Math.max(0, tendered - totals.total);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && !sale && !short) {
        event.preventDefault();
        charge();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function charge() {
    setSale(completeSale({ totals, discount, method, tendered }));
  }

  if (sale) {
    return (
      <Modal title={`Receipt #${sale.no}`} onClose={onDone}>
        {sale.method === "cash" && sale.change > 0 ? (
          <p className="pos-noprint mb-4 rounded-xl border border-[#1f4034] bg-[#0d2119] px-4 py-3 text-center">
            <span className="block text-[12px] uppercase tracking-[0.08em] text-[#78c9a3]">
              Change due
            </span>
            <span className="font-display text-[30px] font-bold text-[#8ee7bb]">
              {money(sale.change)}
            </span>
          </p>
        ) : null}
        <Receipt sale={sale} settings={data.settings} />
        <ReceiptActions sale={sale} settings={data.settings} className="mt-4" />
        <Button variant="primary" className="pos-noprint mt-2 h-[50px] w-full" onClick={onDone}>
          New sale
        </Button>
      </Modal>
    );
  }

  return (
    <Modal title="Payment" onClose={onClose}>
      <div className="rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <Row label={`Subtotal · ${totals.count} items`} value={money(totals.subtotal)} />
        {discount > 0 ? (
          <Row label="Discount" value={`-${money(discount)}`} />
        ) : null}
        {totals.rounding !== 0 ? (
          <Row label="Rounding" value={money(totals.rounding)} />
        ) : null}
        <div className="mt-2 flex items-baseline justify-between border-t border-[#1b2337] pt-2">
          <span className="text-[13px] uppercase tracking-[0.08em] text-[#7e87a5]">
            To pay
          </span>
          <span className="font-display text-[26px] font-bold text-white">
            {money(totals.total)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MethodButton
          active={method === "cash"}
          onClick={() => setMethod("cash")}
          icon={<Banknote size={17} />}
          label="Cash"
        />
        <MethodButton
          active={method === "card"}
          onClick={() => setMethod("card")}
          icon={<CreditCard size={17} />}
          label="Card"
        />
      </div>

      {method === "cash" ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
              Cash taken
              <input
                value={tendered ? amount(tendered) : ""}
                inputMode="numeric"
                placeholder="0"
                onChange={(event) => setTendered(parseAmount(event.target.value))}
                className="mt-1.5 h-[46px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 font-display text-[19px] font-semibold tracking-normal text-white outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0]"
              />
            </label>
            <div className="mt-6 shrink-0 text-end">
              <span className="block text-[12px] uppercase tracking-[0.08em] text-[#7e87a5]">
                Change
              </span>
              <span
                className={`font-display text-[24px] font-bold ${short ? "text-[#5b6480]" : "text-[#8ee7bb]"}`}
              >
                {money(change)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTendered(totals.total)}
              className="rounded-lg border border-[#2c3a6a] bg-[#141b33] px-3 py-2 text-[13px] font-semibold text-[#c6ccff] hover:border-[#3d4f8f]"
            >
              Exact
            </button>
            {IQD_NOTES.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => setTendered((current) => current + note)}
                className="rounded-lg border border-[#232b40] bg-[#0d1220] px-3 py-2 text-[13px] font-semibold text-[#c3c9dd] hover:border-[#3a4460] hover:text-white"
              >
                +{amount(note)}
              </button>
            ))}
            {tendered > 0 ? (
              <button
                type="button"
                onClick={() => setTendered(0)}
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#7e87a5] hover:text-white"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <details className="mt-4">
        <summary className="cursor-pointer text-[13px] font-medium text-[#7e87a5] hover:text-white">
          Give a discount
        </summary>
        <input
          value={discount ? amount(discount) : ""}
          inputMode="numeric"
          placeholder="0"
          aria-label="Discount in dinars"
          onChange={(event) =>
            onDiscountChange(Math.min(totals.subtotal, parseAmount(event.target.value)))
          }
          className="mt-2 h-[42px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 text-[15px] text-white outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0]"
        />
      </details>

      <Button
        variant="primary"
        className="mt-5 h-[52px] w-full text-[16px]"
        disabled={short}
        onClick={charge}
      >
        {short ? `Short by ${money(totals.total - tendered)}` : `Complete · ${money(totals.total)}`}
      </Button>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-[14px] text-[#98a0bb]">
      <span>{label}</span>
      <span className="text-[#e7eaf6]">{value}</span>
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[46px] items-center justify-center gap-2 rounded-xl border text-[14.5px] font-semibold transition-colors ${
        active
          ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
          : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
