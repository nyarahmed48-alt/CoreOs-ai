/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, ArrowUpRight, Mail } from "lucide-react";
import { CoreOsLockup, CoreOsMark } from "./Logo";
import { Link, useRouter } from "./router";
import { CONTACT_EMAIL } from "./contact";

const NAV = [
  { to: "/", label: "CoreOs" },
  { to: "/mission", label: "Mission" },
  { to: "/testing", label: "Open testing" },
  { to: "/coreos-ai", label: "CoreOs.ai" },
  { to: "/contact", label: "Contact" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useRouter();
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#6c7bf0] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#05060a]"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[#161c2c] bg-[#05060a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-5">
          <Link to="/" aria-label="CoreOs home" className="shrink-0">
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
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/manager"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#232b40] px-3.5 py-2 text-[13.5px] font-medium text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
            >
              Client console
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/contact"
              className="rounded-lg bg-[#6c7bf0] px-4 py-2 text-[13.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
            >
              Talk to us
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
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
                  {item.label}
                </Link>
              ))}
              <a
                href="/manager"
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#c3c9dd] hover:bg-[#0e1320] hover:text-white"
              >
                Client console
              </a>
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
  return (
    <footer className="mt-24 border-t border-[#161c2c] bg-[#07090f]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <CoreOsLockup size={28} tagline />
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-[#8c93ac]">
            CoreOs builds affordable, configurable AI for small and mid-sized
            businesses — and builds it to work alongside the people you already
            employ.
          </p>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5e677f]">
            Product
          </h4>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <Link to="/testing" className="text-[#c3c9dd] hover:text-white">
                11 agents in open testing
              </Link>
            </li>
            <li>
              <Link to="/coreos-ai" className="text-[#c3c9dd] hover:text-white">
                CoreOs.ai — 20 models
              </Link>
            </li>
            <li>
              <Link to="/mission" className="text-[#c3c9dd] hover:text-white">
                Our mission
              </Link>
            </li>
            <li>
              <a href="/manager" className="text-[#c3c9dd] hover:text-white">
                Client console
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5e677f]">
            Contact
          </h4>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 break-all text-[#c3c9dd] hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-[#6c7bf0]" />
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <Link to="/contact" className="text-[#c3c9dd] hover:text-white">
                Send us a brief
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#12172440] px-5">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 py-6 text-[12.5px] text-[#5e677f] sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-2">
            <CoreOsMark size={16} />© {new Date().getFullYear()} CoreOs. All
            rights reserved.
          </span>
          <span>AI that assists people. Not AI that replaces them.</span>
        </div>
      </div>
    </footer>
  );
}
