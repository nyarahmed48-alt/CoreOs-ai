/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Demo — barbershop, small scope.
 *
 * Four sections and one action. A shop like this needs to answer three
 * questions (what do you do, what does it cost, when are you open) and give
 * one way to book. Anything more would be work the owner is paying for and
 * nobody is reading.
 */

import { Scissors, Clock, MapPin, MessageCircle } from "lucide-react";
import { BARBER } from "./content";
import { DemoBar, DemoSection, PriceRow, useCopy } from "./shared";
import { whatsapp } from "../contact";
import { useLang } from "../i18n";

const INK = "#12100e";
const GOLD = "#c9a227";
const CREAM = "#f4efe6";
const MUTED = "#9a8f7d";

export function BarberDemo() {
  const c = useCopy();
  const { t } = useLang();

  return (
    <div style={{ background: INK, color: CREAM }} className="min-h-[100dvh]">
      <DemoBar />

      {/* ------------------------------------------------------------- Hero */}
      <header className="border-b" style={{ borderColor: "#241f19" }}>
        <div className="mx-auto max-w-5xl px-5 py-20 md:py-28">
          <div className="flex items-center gap-2" style={{ color: GOLD }}>
            <Scissors className="h-5 w-5" />
            <span className="text-[12px] font-bold uppercase tracking-[0.24em]">
              EST. 2016
            </span>
          </div>
          <h1 className="mt-5 font-brand text-[clamp(2.6rem,8vw,4.5rem)] font-extrabold leading-[1] tracking-[-0.02em]">
            {c(BARBER.name)}
          </h1>
          <p
            className="mt-5 max-w-xl text-[19px] leading-relaxed"
            style={{ color: GOLD }}
          >
            {c(BARBER.tagline)}
          </p>
          <p
            className="mt-4 max-w-xl text-[15.5px] leading-relaxed"
            style={{ color: MUTED }}
          >
            {c(BARBER.intro)}
          </p>

          <a
            href={whatsapp(t("contact.waPrefill"))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: INK }}
          >
            <MessageCircle className="h-4 w-4" />
            {c(BARBER.bookCta)}
          </a>
          <p className="mt-3 text-[13.5px]" style={{ color: MUTED }}>
            {c(BARBER.walkIn)}
          </p>
        </div>
      </header>

      {/* --------------------------------------------------------- Services */}
      <DemoSection className="border-b border-[#241f19]">
        <h2 className="font-display text-[26px] font-bold" style={{ color: CREAM }}>
          {c(BARBER.servicesTitle)}
        </h2>
        <div className="mt-6 max-w-2xl divide-y" style={{ borderColor: "#241f19" }}>
          {BARBER.services.map((s) => (
            <PriceRow
              key={s.name.en}
              name={c(s.name)}
              price={c(s.price)}
              rule="#3a3229"
              muted={MUTED}
            />
          ))}
        </div>
      </DemoSection>

      {/* ------------------------------------------------ Hours and address */}
      <DemoSection>
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2" style={{ color: GOLD }}>
              <Clock className="h-4 w-4" />
              <h2 className="font-display text-[17px] font-bold">
                {c(BARBER.hoursTitle)}
              </h2>
            </div>
            <dl className="mt-4 space-y-2 text-[15px]">
              {BARBER.hours.map((h) => (
                <div key={h.day.en} className="flex justify-between gap-4">
                  <dt style={{ color: MUTED }}>{c(h.day)}</dt>
                  <dd className="font-medium">{c(h.time)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <div className="flex items-center gap-2" style={{ color: GOLD }}>
              <MapPin className="h-4 w-4" />
              <h2 className="font-display text-[17px] font-bold">
                {c(BARBER.whereTitle)}
              </h2>
            </div>
            <p
              className="mt-4 whitespace-pre-line text-[15px] leading-relaxed"
              style={{ color: MUTED }}
            >
              {c(BARBER.address)}
            </p>
          </div>
        </div>
      </DemoSection>

      <footer
        className="border-t px-5 py-8 text-center text-[13px]"
        style={{ borderColor: "#241f19", color: MUTED }}
      >
        {c(BARBER.name)} — {new Date().getFullYear()}
      </footer>
    </div>
  );
}
