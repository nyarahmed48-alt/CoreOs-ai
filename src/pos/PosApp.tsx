/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The POS shell.
 *
 * Four screens, one row of tabs, and no chrome from the marketing site: the
 * till is a tool someone stands at for eight hours, not a page they read. It
 * is pinned left-to-right and English — this is the cashier-facing product,
 * and its layout was built for that.
 *
 * Loaded lazily from the route table, so a visitor reading the website never
 * downloads it. The same component is also built into a single portable HTML
 * file for shops that run the till off a USB stick rather than the site, which
 * is what `standalone` is for: there is no site to exit to there.
 */

import { useState } from "react";
import { BarChart3, Boxes, Settings as SettingsIcon, ShoppingCart } from "lucide-react";
import { Link } from "../site/router";
import { usePos, useWriteError } from "./store";
import { RegisterView } from "./RegisterView";
import { ProductsView } from "./ProductsView";
import { SalesView } from "./SalesView";
import { SettingsView } from "./SettingsView";

/* Printing a receipt from inside a full-screen application means hiding the
   application, not opening a second window: a second window is a popup, and
   the machines these tills run on block them. Visibility rather than display
   so the receipt keeps its own layout. */
const PRINT_CSS = `
@media print {
  @page { margin: 4mm; }
  body { background: #fff !important; }
  body * { visibility: hidden !important; }
  .pos-print, .pos-print * { visibility: visible !important; }
  .pos-print {
    position: absolute;
    top: 0;
    left: 0;
    width: 72mm;
    max-width: 72mm;
    padding: 0 !important;
  }
  .pos-noprint { display: none !important; }
}
`;

type Tab = "register" | "products" | "sales" | "settings";

const TABS: { id: Tab; label: string; icon: typeof ShoppingCart }[] = [
  { id: "register", label: "Till", icon: ShoppingCart },
  { id: "products", label: "Products", icon: Boxes },
  { id: "sales", label: "Sales", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function PosApp({ standalone = false }: { standalone?: boolean }) {
  const data = usePos();
  const writeError = useWriteError();
  const [tab, setTab] = useState<Tab>("register");

  return (
    <div
      dir="ltr"
      lang="en"
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#05060a] text-[#e7eaf6]"
    >
      <style>{PRINT_CSS}</style>

      <header className="pos-noprint flex shrink-0 items-center justify-between gap-3 border-b border-[#1b2337] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#6c7bf0]" />
          <span className="truncate font-display text-[15px] font-semibold text-white">
            {data.settings.shopName}
          </span>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              /* The label is hidden on a phone to keep four tabs on one row,
                 so the name has to live on the element itself. */
              aria-label={label}
              aria-current={tab === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                tab === id
                  ? "bg-[#6c7bf0]/15 text-[#c6ccff]"
                  : "text-[#8b93ae] hover:bg-[#111830] hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          {standalone ? null : (
            <Link
              to="/"
              className="ms-1 hidden shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium text-[#6b7490] hover:text-white lg:inline-block"
            >
              Exit
            </Link>
          )}
        </nav>
      </header>

      {writeError ? (
        <p className="pos-noprint shrink-0 bg-[#3a1622] px-4 py-2 text-[13px] text-[#ffc2ce]">
          {writeError}
        </p>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col">
        {tab === "register" ? <RegisterView /> : null}
        {tab === "products" ? <ProductsView /> : null}
        {tab === "sales" ? <SalesView /> : null}
        {tab === "settings" ? <SettingsView /> : null}
      </main>
    </div>
  );
}
