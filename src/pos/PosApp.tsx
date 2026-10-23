/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The POS shell.
 *
 * Four screens, one row of tabs, and no chrome from the marketing site: the
 * till is a tool someone stands at for eight hours, not a page they read.
 *
 * It takes its language and its direction from the shop's own setting rather
 * than the site's: a counter in Baghdad is worked in Arabic and one in Slemani
 * in Kurdish, and both are read right to left. The layout is written in
 * logical properties throughout, so that is a `dir` flip rather than a second
 * set of screens.
 *
 * Loaded lazily from the route table, so a visitor reading the website never
 * downloads it. The same component is also built into a single portable HTML
 * file for shops that run the till off a USB stick rather than the site, which
 * is what `standalone` is for: there is no site to exit to there.
 */

import { useState } from "react";
import { BarChart3, Boxes, Settings as SettingsIcon, ShoppingCart } from "lucide-react";
import { Link } from "../site/router";
import { setLanguage, usePos, useWriteError } from "./store";
import { watchForErrors } from "./report";
import { useT } from "./useT";
import { LANGS } from "./i18n";
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

/* Started before the first render, so a crash on the way up is still in the
   report the shop sends afterwards. */
watchForErrors();

type Tab = "register" | "products" | "sales" | "settings";

const TABS: { id: Tab; label: "app.till" | "app.products" | "app.sales" | "app.settings"; icon: typeof ShoppingCart }[] = [
  { id: "register", label: "app.till", icon: ShoppingCart },
  { id: "products", label: "app.products", icon: Boxes },
  { id: "sales", label: "app.sales", icon: BarChart3 },
  { id: "settings", label: "app.settings", icon: SettingsIcon },
];

export default function PosApp({ standalone = false }: { standalone?: boolean }) {
  const data = usePos();
  const writeError = useWriteError();
  const { t, lang, dir } = useT();
  const [tab, setTab] = useState<Tab>("register");

  return (
    <div
      dir={dir}
      lang={lang}
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#05060a] text-[#e7eaf6]"
    >
      <style>{PRINT_CSS}</style>

      <header className="pos-noprint flex shrink-0 items-center justify-between gap-3 border-b border-[#1b2337] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#6c7bf0]" />
          <span className="truncate font-display text-[15px] font-semibold text-white">
            {data.settings.shopName}
          </span>
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[#1e2740] p-0.5">
            {LANGS.map((option) => (
              <button
                key={option.id}
                type="button"
                lang={option.id}
                onClick={() => setLanguage(option.id)}
                aria-pressed={lang === option.id}
                className={`rounded-md px-2 py-1 text-[12px] font-semibold transition-colors ${
                  lang === option.id
                    ? "bg-[#6c7bf0]/20 text-[#c6ccff]"
                    : "text-[#6b7490] hover:text-white"
                }`}
              >
                {option.id === "en" ? "EN" : option.name}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              /* The label is hidden on a phone to keep four tabs on one row,
                 so the name has to live on the element itself. */
              aria-label={t(label)}
              aria-current={tab === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                tab === id
                  ? "bg-[#6c7bf0]/15 text-[#c6ccff]"
                  : "text-[#8b93ae] hover:bg-[#111830] hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{t(label)}</span>
            </button>
          ))}
          {standalone ? null : (
            <Link
              to="/"
              className="ms-1 hidden shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium text-[#6b7490] hover:text-white lg:inline-block"
            >
              {t("app.exit")}
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
