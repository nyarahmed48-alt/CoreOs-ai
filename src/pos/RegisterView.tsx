/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The till itself — the screen a cashier looks at all day.
 *
 * Two columns: the shelf on the left, the basket on the right. On a phone the
 * basket collapses to a bar at the bottom that opens it, because a one-handed
 * cashier at a counter needs the goods, not the maths.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Search, Trash2, X } from "lucide-react";
import {
  addToCart,
  clearCart,
  priceCart,
  setQty,
  useCart,
  usePos,
} from "./store";
import { money } from "./money";
import { Button, Empty } from "./ui";
import { CheckoutModal } from "./CheckoutModal";
import type { Product } from "./types";

export function RegisterView() {
  const data = usePos();
  const cart = useCart();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [discount, setDiscount] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const [flash, setFlash] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);

  const shelf = useMemo(
    () => data.products.filter((p) => !p.archived),
    [data.products],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shelf.filter((product) => {
      if (categoryId !== "all" && product.categoryId !== categoryId) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.barcode.includes(needle)
      );
    });
  }, [shelf, query, categoryId]);

  const totals = priceCart(data, cart, discount);

  /* A USB barcode scanner is a keyboard: it types the code and presses Enter.
     So any stray typing that lands on the page is pushed into the scan box,
     and a scan works no matter what the cashier last touched. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1) return;
      const active = document.activeElement;
      const typing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement;
      if (typing) return;
      scanRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function announce(text: string) {
    setFlash(text);
    window.setTimeout(() => setFlash((current) => (current === text ? "" : current)), 1800);
  }

  /** Enter in the scan box. An exact barcode wins; failing that, a search that
      has narrowed to one product is unambiguous enough to ring up. */
  function submitScan() {
    const code = query.trim();
    if (!code) return;
    const scanned =
      shelf.find((p) => p.barcode && p.barcode === code) ??
      (results.length === 1 ? results[0] : undefined);
    if (!scanned) {
      announce(`No product for "${code}"`);
      return;
    }
    addToCart(scanned.id);
    announce(`${scanned.name} added`);
    setQuery("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Shelf */}
      <div className="flex min-h-0 flex-1 flex-col border-[#1b2337] lg:border-e">
        <div className="border-b border-[#1b2337] px-3 py-3 sm:px-4">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[#5b6480]"
            />
            <input
              ref={scanRef}
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitScan();
                }
              }}
              placeholder="Scan a barcode, or search by name"
              aria-label="Scan or search"
              className="h-[46px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] ps-10 pe-10 text-[15px] text-[#e7eaf6] outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#7e87a5] hover:text-white"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <Chip
              active={categoryId === "all"}
              onClick={() => setCategoryId("all")}
              label="All"
            />
            {data.categories.map((category) => (
              <Chip
                key={category.id}
                active={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
                label={category.name}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 sm:p-4 lg:pb-4">
          {results.length === 0 ? (
            <Empty>Nothing matches. Try another word, or add it in Products.</Empty>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {results.map((product) => (
                <Tile
                  key={product.id}
                  product={product}
                  lowStockAt={
                    product.lowStockAt >= 0
                      ? product.lowStockAt
                      : data.settings.lowStockAt
                  }
                  onPick={() => {
                    addToCart(product.id);
                    announce(`${product.name} added`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Basket */}
      <aside
        className={`${basketOpen ? "fixed inset-0 z-40 flex" : "hidden"} flex-col bg-[#080d18] lg:static lg:z-auto lg:flex lg:w-[380px] xl:w-[420px]`}
      >
        <div className="flex items-center justify-between border-b border-[#1b2337] px-4 py-3">
          <h2 className="font-display text-[15px] font-semibold text-white">
            Basket{" "}
            <span className="text-[#7e87a5]">
              {totals.count > 0 ? `· ${totals.count}` : ""}
            </span>
          </h2>
          <div className="flex items-center gap-1">
            {cart.length > 0 ? (
              <Button
                variant="quiet"
                onClick={() => {
                  clearCart();
                  setDiscount(0);
                }}
              >
                <Trash2 size={15} /> Clear
              </Button>
            ) : null}
            <Button
              variant="quiet"
              className="lg:hidden"
              onClick={() => setBasketOpen(false)}
              aria-label="Close basket"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <Empty>Scan an item to start a sale.</Empty>
          ) : (
            <ul className="divide-y divide-[#141b2d]">
              {totals.lines.map((line) => (
                <li key={line.productId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[14.5px] font-medium text-[#e7eaf6]">{line.name}</p>
                    <p className="shrink-0 text-[14.5px] font-semibold text-white">
                      {money(line.price * line.qty)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[12.5px] text-[#7e87a5]">{money(line.price)} each</p>
                    <div className="flex items-center gap-1">
                      <Step
                        label={`One less ${line.name}`}
                        onClick={() => setQty(line.productId, line.qty - 1)}
                      >
                        <Minus size={15} />
                      </Step>
                      <input
                        value={line.qty}
                        inputMode="numeric"
                        aria-label={`Quantity of ${line.name}`}
                        onChange={(event) => {
                          const next = parseInt(
                            event.target.value.replace(/[^0-9]/g, ""),
                            10,
                          );
                          setQty(line.productId, Number.isNaN(next) ? 0 : next);
                        }}
                        className="h-9 w-12 rounded-lg border border-[#232b40] bg-[#0a0f1c] text-center text-[14px] text-white outline-none focus:border-[#6c7bf0]"
                      />
                      <Step
                        label={`One more ${line.name}`}
                        onClick={() => setQty(line.productId, line.qty + 1)}
                      >
                        <Plus size={15} />
                      </Step>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#1b2337] px-4 py-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] uppercase tracking-[0.08em] text-[#7e87a5]">
              Total
            </span>
            <span className="font-display text-[26px] font-bold text-white">
              {money(totals.total)}
            </span>
          </div>
          <Button
            variant="primary"
            className="mt-3 h-[52px] w-full text-[16px]"
            disabled={cart.length === 0}
            onClick={() => setCheckingOut(true)}
          >
            Charge {money(totals.total)}
          </Button>
        </div>
      </aside>

      {/* Phone: the basket is a bar until it is needed. */}
      {cart.length > 0 && !basketOpen ? (
        <button
          type="button"
          onClick={() => setBasketOpen(true)}
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-[#232b40] bg-[#6c7bf0] px-4 py-3.5 text-[15px] font-semibold text-[#05060a] lg:hidden"
        >
          <span>
            {totals.count} item{totals.count === 1 ? "" : "s"}
          </span>
          <span>{money(totals.total)} · View basket</span>
        </button>
      ) : null}

      {flash ? (
        <div
          role="status"
          className="pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#232b40] bg-[#0d1220] px-4 py-2 text-[13px] text-[#c3c9dd] lg:bottom-6"
        >
          {flash}
        </div>
      ) : null}

      {checkingOut ? (
        <CheckoutModal
          totals={totals}
          discount={discount}
          onDiscountChange={setDiscount}
          onClose={() => setCheckingOut(false)}
          onDone={() => {
            setCheckingOut(false);
            setDiscount(0);
            setBasketOpen(false);
            scanRef.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-[#c6ccff]"
          : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Step({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#232b40] text-[#c3c9dd] hover:border-[#3a4460] hover:text-white"
    >
      {children}
    </button>
  );
}

function Tile({
  product,
  lowStockAt,
  onPick,
}: {
  product: Product;
  lowStockAt: number;
  onPick: () => void;
}) {
  const out = product.stock <= 0;
  const low = !out && product.stock <= lowStockAt;

  return (
    <button
      type="button"
      onClick={onPick}
      className="flex min-h-[104px] flex-col justify-between rounded-xl border border-[#1e2740] bg-[#0d1220] p-3 text-start transition-colors hover:border-[#3a4460] hover:bg-[#111830]"
    >
      <span className="line-clamp-2 text-[14px] font-medium leading-snug text-[#e7eaf6]">
        {product.name}
      </span>
      <span className="mt-2 flex items-end justify-between gap-2">
        <span className="font-display text-[15px] font-semibold text-white">
          {money(product.price)}
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
            out
              ? "bg-[#3a1622] text-[#f0879d]"
              : low
                ? "bg-[#3a2c12] text-[#f0c078]"
                : "text-[#6b7490]"
          }`}
        >
          {out ? "Out" : `${product.stock} left`}
        </span>
      </span>
    </button>
  );
}
