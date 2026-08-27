/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sales history, and the end-of-day report.
 *
 * A market owner has one question at closing time — how much is in the drawer,
 * and does it match — so the day, not the month, is the unit this screen is
 * built around. Voided sales stay listed but are struck out and left out of
 * every total, so the receipt numbers still run without gaps.
 */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePos, voidSale } from "./store";
import { money } from "./money";
import { Button, Empty, Modal } from "./ui";
import { Receipt, ReceiptActions } from "./Receipt";
import type { Sale } from "./types";

/** Local calendar day, not UTC: a sale rung at 9pm belongs to that evening's
    takings wherever the shop is. */
function dayKey(iso: string): string {
  const at = new Date(iso);
  const month = `${at.getMonth() + 1}`.padStart(2, "0");
  const day = `${at.getDate()}`.padStart(2, "0");
  return `${at.getFullYear()}-${month}-${day}`;
}

function todayKey(): string {
  return dayKey(new Date().toISOString());
}

function shiftDay(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  return dayKey(date.toISOString());
}

function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const label = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return key === todayKey() ? `Today · ${label}` : label;
}

export function SalesView() {
  const data = usePos();
  const [day, setDay] = useState(todayKey());
  const [open, setOpen] = useState<Sale | null>(null);

  const sales = useMemo(
    () => data.sales.filter((sale) => dayKey(sale.at) === day),
    [data.sales, day],
  );

  const report = useMemo(() => {
    const counted = sales.filter((sale) => !sale.voidedAt);
    const byItem = new Map<string, { name: string; qty: number; total: number }>();
    for (const sale of counted) {
      for (const line of sale.lines) {
        const entry = byItem.get(line.productId) ?? {
          name: line.name,
          qty: 0,
          total: 0,
        };
        entry.qty += line.qty;
        entry.total += line.qty * line.price;
        byItem.set(line.productId, entry);
      }
    }
    return {
      sales: counted.length,
      voided: sales.length - counted.length,
      revenue: counted.reduce((sum, sale) => sum + sale.total, 0),
      cash: counted
        .filter((sale) => sale.method === "cash")
        .reduce((sum, sale) => sum + sale.total, 0),
      card: counted
        .filter((sale) => sale.method === "card")
        .reduce((sum, sale) => sum + sale.total, 0),
      items: counted.reduce(
        (sum, sale) => sum + sale.lines.reduce((n, line) => n + line.qty, 0),
        0,
      ),
      top: [...byItem.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    };
  }, [sales]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="quiet"
            onClick={() => setDay(shiftDay(day, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="text-center">
            <p className="font-display text-[15.5px] font-semibold text-white">
              {dayLabel(day)}
            </p>
            <input
              type="date"
              value={day}
              max={todayKey()}
              onChange={(event) => setDay(event.target.value || todayKey())}
              aria-label="Pick a day"
              className="mt-1 rounded-lg border border-[#232b40] bg-[#0a0f1c] px-2 py-1 text-[12.5px] text-[#98a0bb] outline-none focus:border-[#6c7bf0]"
            />
          </div>
          <Button
            variant="quiet"
            disabled={day >= todayKey()}
            onClick={() => setDay(shiftDay(day, 1))}
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Takings" value={money(report.revenue)} accent />
          <Stat label="Sales" value={String(report.sales)} />
          <Stat label="Cash" value={money(report.cash)} />
          <Stat label="Card" value={money(report.card)} />
        </div>

        {report.top.length > 0 ? (
          <div className="mt-4 rounded-xl border border-[#1e2740] bg-[#0b1120] px-4 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
              Best sellers · {report.items} items sold
            </p>
            <ul className="mt-2 space-y-1.5">
              {report.top.map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between text-[14px] text-[#c3c9dd]"
                >
                  <span>
                    <span className="text-[#7e87a5]">{item.qty}×</span> {item.name}
                  </span>
                  <span className="text-[#e7eaf6]">{money(item.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-[#1e2740]">
          {sales.length === 0 ? (
            <Empty>No sales on this day.</Empty>
          ) : (
            <ul className="divide-y divide-[#141b2d]">
              {sales.map((sale) => (
                <li key={sale.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(sale)}
                    className="flex w-full items-center gap-3 bg-[#0b1120] px-4 py-3 text-start hover:bg-[#111830]"
                  >
                    <div className="flex-1">
                      <p
                        className={`text-[14.5px] font-medium ${sale.voidedAt ? "text-[#6b7490] line-through" : "text-[#e7eaf6]"}`}
                      >
                        Receipt #{sale.no}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-[#6b7490]">
                        {new Date(sale.at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {sale.lines.reduce((n, line) => n + line.qty, 0)} items ·{" "}
                        {sale.method}
                        {sale.voidedAt ? " · voided" : ""}
                      </p>
                    </div>
                    <span
                      className={`font-display text-[15px] font-semibold ${sale.voidedAt ? "text-[#6b7490] line-through" : "text-white"}`}
                    >
                      {money(sale.total)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {report.voided > 0 ? (
          <p className="mt-3 text-[12.5px] text-[#6b7490]">
            {report.voided} voided sale{report.voided === 1 ? "" : "s"} on this day,
            left out of the totals.
          </p>
        ) : null}
      </div>

      {open ? (
        <SaleModal sale={open} onClose={() => setOpen(null)} />
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1e2740] bg-[#0b1120] px-3.5 py-3">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
        {label}
      </p>
      <p
        className={`mt-1 font-display font-bold ${accent ? "text-[20px] text-[#8ee7bb]" : "text-[17px] text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function SaleModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const data = usePos();
  const [confirming, setConfirming] = useState(false);
  // Read the sale back from the store so the receipt shows the void the moment
  // it is made, rather than the copy this modal opened with.
  const current = data.sales.find((s) => s.id === sale.id) ?? sale;

  return (
    <Modal title={`Receipt #${current.no}`} onClose={onClose}>
      <Receipt sale={current} settings={data.settings} />
      <ReceiptActions sale={current} settings={data.settings} className="mt-4" />

      {!current.voidedAt ? (
        confirming ? (
          <div className="pos-noprint mt-2 rounded-xl border border-[#3d2230] bg-[#180f16] px-4 py-3">
            <p className="text-[13.5px] text-[#f0a3b5]">
              Void this sale? The goods go back on the shelf and the money comes out
              of the day's takings.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  voidSale(current.id);
                  setConfirming(false);
                }}
              >
                Void receipt #{current.no}
              </Button>
              <Button variant="quiet" onClick={() => setConfirming(false)}>
                Keep
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="quiet"
            className="pos-noprint mt-2 w-full text-[#f0879d]"
            onClick={() => setConfirming(true)}
          >
            Void this sale
          </Button>
        )
      ) : null}
    </Modal>
  );
}
