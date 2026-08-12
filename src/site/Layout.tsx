/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { CoreOsLockup, CoreOsMark } from "./Logo";
import { Link, useRouter } from "./router";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, whatsapp } from "./contact";
import { LANGS, LANG_NAMES, LANG_SHORT, useLang } from "./i18n";
import type { CopyKey } from "./strings";

const NAV: Array<{ to: string; key: CopyKey }> = [
  { to: "/", key: "nav.home" },
  { to: "/mission", key: "nav.mission" },
  { to: "/testing", key: "nav.testing" },
  { to: "/coreos-ai", key: "nav.lab" },
  { to: "/contact", key: "nav.contact" },
];

/**
 * Segmented switch across the three languages.
 *
 * A two-state toggle worked while there were two languages; with three, the
 * only honest control is one that shows all of them at once. Every option is
 * labelled in its own script, never translated — a switch that writes
 * "Kurdish" in Arabic is no use to the person who needs to press it.
 *
 * The header is tight, so it shows one-letter labels there and the full names
 * in the mobile menu, where there is room. `dir="ltr"` pins the order so the
 * buttons don't reshuffle when the page direction flips.
 */
function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();

  return (
    <div
      role="group"
      aria-label={t("nav.langAria")}
      dir="ltr"
      className={`flex items-center gap-0.5 rounded-lg border border-[#232b40] p-0.5 ${
        compact ? "w-full" : ""
      }`}
    >
      {LANGS.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            lang={code}
            aria-pressed={active}
            title={LANG_NAMES[code]}
            className={`rounded-md font-medium transition-colors ${
              compact ? "flex-1 px-2 py-2 text-[14px]" : "px-2.5 py-1.5 text-[13px]"
            } ${
              active
                ? "bg-[#6c7bf0] text-[#05060a]"
                : "text-[#c3c9dd] hover:bg-[#141a29] hover:text-white"
            }`}
          >
            {compact ? LANG_NAMES[code] : LANG_SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-surface", "site");
    // The dashboard persists a `dark` class on <body>; the site owns its own
    // palette, so shed it on the way in and let the dashboard re-apply it.
    document.body.classList.remove("dark");
    document.documentElement.classList.remove("dark");
    return () => document.body.removeAttribute("data-surface");
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <div className="min-h-[100dvh] bg-[#05060a] text-[#e7eaf6] antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#6c7bf0] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#05060a] focus:start-4"
      >
        {t("nav.skip")}
      </a>

      <header className="sticky top-0 z-40 border-b border-[#161c2c] bg-[#05060a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-5">
          <Link to="/" aria-label={t("nav.homeAria")} className="shrink-0">
            <CoreOsLockup size={26} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.to === "/" ? path === "/" : path.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                    active
                      ? "bg-[#141a2a] text-white"
                      : "text-[#98a0bb] hover:bg-[#0e1320] hover:text-[#e7eaf6]"
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LangToggle />
            <a
              href="/manager"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#232b40] px-3.5 py-2 text-[13.5px] font-medium text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
            >
              {t("nav.console")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/contact"
              className="rounded-lg bg-[#6c7bf0] px-4 py-2 text-[13.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
            >
              {t("nav.talk")}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            className="rounded-lg border border-[#232b40] p-2 text-[#c3c9dd] md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-[#161c2c] bg-[#05060a] px-5 pb-5 pt-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#c3c9dd] hover:bg-[#0e1320] hover:text-white"
                >
                  {t(item.key)}
                </Link>
              ))}
              <a
                href="/manager"
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#c3c9dd] hover:bg-[#0e1320] hover:text-white"
              >
                {t("nav.console")}
              </a>
              <div className="mt-2">
                <LangToggle compact />
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main id="main">{children}</main>

      <Footer />
    </div>
  );
}

function Footer() {
  const { t } = useLang();

  return (
    <footer className="mt-24 border-t border-[#161c2c] bg-[#07090f]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <CoreOsLockup size={28} tagline />
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-[#8c93ac]">
            {t("footer.blurb")}
          </p>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5e677f]">
            {t("footer.product")}
          </h4>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <Link to="/testing" className="text-[#c3c9dd] hover:text-white">
                {t("footer.agents")}
              </Link>
            </li>
            <li>
              <Link to="/coreos-ai" className="text-[#c3c9dd] hover:text-white">
                {t("footer.models")}
              </Link>
            </li>
            <li>
              <Link to="/mission" className="text-[#c3c9dd] hover:text-white">
                {t("footer.mission")}
              </Link>
            </li>
            <li>
              <a href="/manager" className="text-[#c3c9dd] hover:text-white">
                {t("nav.console")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5e677f]">
            {t("footer.contact")}
          </h4>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <a
                href={whatsapp()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#c3c9dd] hover:text-white"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-[#25d366]" />
                <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                dir="ltr"
                className="inline-flex items-center gap-2 break-all text-[#c3c9dd] hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-[#6c7bf0]" />
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <Link to="/contact" className="text-[#c3c9dd] hover:text-white">
                {t("footer.brief")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#12172440] px-5">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 py-6 text-[12.5px] text-[#5e677f] sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-2">
            <CoreOsMark size={16} />© {new Date().getFullYear()} CoreOs.{" "}
            {t("footer.rights")}
          </span>
          <span>{t("footer.line")}</span>
        </div>
      </div>
    </footer>
  );
}
