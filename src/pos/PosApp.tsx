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
import {
  BarChart3,
  Boxes,
  BookUser,
  LogOut,
  Settings as SettingsIcon,
  ShoppingCart,
} from "lucide-react";
import { Link } from "../site/router";
import { setLanguage, usePos, useSession, useWriteError } from "./store";
import { watchForErrors } from "./report";
import { useT } from "./useT";
import { LANGS, formatTime } from "./i18n";
import { RegisterView } from "./RegisterView";
import { ProductsView } from "./ProductsView";
import { SalesView } from "./SalesView";
import { SettingsView } from "./SettingsView";
import { DebtView } from "./DebtView";
import { CloseShiftModal, LockScreen } from "./LockScreen";
import { ActivationGate, daysLeft, useActivation } from "./ActivationGate";

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

type Tab = "register" | "products" | "debt" | "sales" | "settings";

const TABS: {
  id: Tab;
  label: "app.till" | "app.products" | "debt.title" | "app.sales" | "app.settings";
  icon: typeof ShoppingCart;
  /** Screens a cashier has no business in. */
  ownerOnly?: boolean;
}[] = [
  { id: "register", label: "app.till", icon: ShoppingCart },
  { id: "products", label: "app.products", icon: Boxes },
  { id: "debt", label: "debt.title", icon: BookUser },
  { id: "sales", label: "app.sales", icon: BarChart3 },
  { id: "settings", label: "app.settings", icon: SettingsIcon, ownerOnly: true },
];

export default function PosApp({ standalone = false }: { standalone?: boolean }) {
  const data = usePos();
  const writeError = useWriteError();
  const { t, lang, dir } = useT();
  const { staff, shift } = useSession();
  const [tab, setTab] = useState<Tab>("register");
  const [closing, setClosing] = useState(false);
  const activation = useActivation();

  /* The till locks only once the shop has people on it. A one-person market
     is never asked to sign in to its own counter. */
  const locked = data.settings.staffLogin && data.staff.some((p) => p.active) && !staff;
  const isOwner = !staff || staff.role === "owner";
  const tabs = TABS.filter((entry) => !entry.ownerOnly || isOwner);

  /* Before anything else. An unactivated tablet shows one screen and nothing
     behind it — but it keeps every sale and product it already had. */
  if (!activation.active) {
    return (
      <div dir={dir} lang={lang}>
        <style>{PRINT_CSS}</style>
        <ActivationGate
          nonce={activation.state.nonce}
          frozen={activation.state.frozen}
          onGranted={activation.grant}
          onFrozen={activation.freeze}
        />
      </div>
    );
  }

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
          {tabs.map(({ id, label, icon: Icon }) => (
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

      {/* A till that locks mid-morning with no warning is a shop that cannot
          sell and does not know why. */}
      {(() => {
        const left = daysLeft(activation.state.until);
        if (left === null || left > 3) return null;
        return (
          <p className="pos-noprint shrink-0 bg-[#3a2c12] px-4 py-2 text-[13px] text-[#f0c078]">
            {left <= 1
              ? t("licence.warningLast")
              : t("licence.warning", { n: left })}
          </p>
        );
      })()}

      {writeError ? (
        <p className="pos-noprint shrink-0 bg-[#3a1622] px-4 py-2 text-[13px] text-[#ffc2ce]">
          {writeError}
        </p>
      ) : null}

      {shift ? (
        <div className="pos-noprint flex shrink-0 items-center justify-between gap-3 border-b border-[#141b2d] bg-[#080d18] px-3 py-1.5 text-[12.5px] text-[#7e87a5] sm:px-4">
          <span className="truncate">
            {t("shift.openedBy", {
              name: shift.staffName,
              time: formatTime(shift.openedAt),
            })}
          </span>
          <button
            type="button"
            onClick={() => setClosing(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-[#8b96ff] hover:text-white"
          >
            <LogOut size={14} /> {t("shift.close")}
          </button>
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col">
        {locked ? (
          <LockScreen />
        ) : (
          <>
            {tab === "register" ? <RegisterView /> : null}
            {tab === "products" ? <ProductsView /> : null}
            {tab === "debt" ? <DebtView /> : null}
            {tab === "sales" ? <SalesView /> : null}
            {tab === "settings" && isOwner ? <SettingsView /> : null}
          </>
        )}
      </main>

      {closing ? <CloseShiftModal onClose={() => setClosing(false)} /> : null}
    </div>
  );
}
