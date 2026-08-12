/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Demo — restaurant, large scope.
 *
 * Nine sections. A restaurant carries the most: a full menu by category, the
 * story that justifies the prices, reservations, delivery, and more than one
 * branch with different hours. Scrolling this next to the barbershop should
 * make the difference in scope obvious without anyone explaining it.
 */

import {
  UtensilsCrossed,
  MessageCircle,
  Clock,
  MapPin,
  Bike,
  CalendarCheck,
} from "lucide-react";
import { REST } from "./content";
import { DemoBar, DemoSection, PhotoTile, PriceRow, useCopy } from "./shared";
import { whatsapp } from "../contact";
import { useLang } from "../i18n";

const INK = "#0f1512";
const PAPER = "#f0ebe1";
const GOLD = "#c8a45c";
const GREEN = "#1f3a2e";
const MUTED = "#8e9a92";
const LINE = "#1e2a24";

const TILES: Array<[string, string]> = [
  ["#3d5c4a", "#1f3a2e"],
  ["#8a6a3a", "#4a3a1f"],
  ["#6d4b3a", "#33231b"],
  ["#4a5f57", "#22322c"],
  ["#5c4a3d", "#2e1f1a"],
  ["#40564d", "#1a2621"],
];

export function RestaurantDemo() {
  const c = useCopy();
  const { t } = useLang();

  return (
    <div style={{ background: INK, color: PAPER }} className="min-h-[100dvh]">
      <DemoBar />

      {/* ------------------------------------------------------------- Hero */}
      <header
        className="border-b"
        style={{
          borderColor: LINE,
          background: `linear-gradient(160deg, ${GREEN} 0%, ${INK} 65%)`,
        }}
      >
        <div className="mx-auto max-w-5xl px-5 py-20 md:py-32">
          <div className="flex items-center gap-2" style={{ color: GOLD }}>
            <UtensilsCrossed className="h-5 w-5" />
            <span className="text-[12px] font-bold uppercase tracking-[0.24em]">
              1998
            </span>
          </div>
          <h1 className="mt-5 font-brand text-[clamp(3rem,10vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
            {c(REST.name)}
          </h1>
          <p
            className="mt-5 max-w-xl text-[20px] leading-relaxed"
            style={{ color: GOLD }}
          >
            {c(REST.tagline)}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={whatsapp(t("contact.waPrefill"))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-opacity hover:opacity-90"
              style={{ background: GOLD, color: INK }}
            >
              <CalendarCheck className="h-4 w-4" />
              {c(REST.heroCta)}
            </a>
            <a
              href="#menu"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-[15px] font-bold transition-colors"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              {c(REST.heroAlt)}
            </a>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ Story */}
      <DemoSection className="border-b border-[#1e2a24]">
        <div className="grid gap-10 md:grid-cols-[1fr_0.8fr] md:items-center">
          <div>
            <h2 className="font-display text-[28px] font-bold">
              {c(REST.storyTitle)}
            </h2>
            {REST.story.map((p, i) => (
              <p
                key={i}
                className="mt-4 text-[15.5px] leading-[1.8]"
                style={{ color: i === 0 ? PAPER : MUTED }}
              >
                {c(p)}
              </p>
            ))}
          </div>
          <PhotoTile from="#3d5c4a" to="#1a2a22" ratio="aspect-[4/5]" />
        </div>
      </DemoSection>

      {/* ------------------------------------------------------------- Menu */}
      <DemoSection id="menu" className="border-b border-[#1e2a24]">
        <h2 className="font-display text-[28px] font-bold">
          {c(REST.menuTitle)}
        </h2>
        <p className="mt-2 text-[14.5px]" style={{ color: MUTED }}>
          {c(REST.menuNote)}
        </p>

        <div className="mt-8 grid gap-x-14 gap-y-10 md:grid-cols-2">
          {REST.menu.map((group) => (
            <div key={group.category.en}>
              <h3
                className="border-b pb-2 font-display text-[13px] font-bold uppercase tracking-[0.2em]"
                style={{ color: GOLD, borderColor: LINE }}
              >
                {c(group.category)}
              </h3>
              <div className="mt-2">
                {group.items.map((item) => (
                  <PriceRow
                    key={item.name.en}
                    name={c(item.name)}
                    detail={item.detail ? c(item.detail) : undefined}
                    price={c(item.price)}
                    rule="#2c3a33"
                    muted={MUTED}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[13px]" style={{ color: MUTED }}>
          {c(REST.currencyNote)}
        </p>
      </DemoSection>

      {/* ---------------------------------------------------------- Gallery */}
      <DemoSection className="border-b border-[#1e2a24]">
        <h2 className="font-display text-[28px] font-bold">
          {c(REST.galleryTitle)}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TILES.map(([from, to]) => (
            <PhotoTile key={from} from={from} to={to} ratio="aspect-square" />
          ))}
        </div>
      </DemoSection>

      {/* --------------------------------------------- Reservations + delivery */}
      <DemoSection className="border-b border-[#1e2a24]">
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="rounded-2xl p-6"
            style={{ background: "#141d18", border: `1px solid ${LINE}` }}
          >
            <div className="flex items-center gap-2" style={{ color: GOLD }}>
              <CalendarCheck className="h-4 w-4" />
              <h2 className="font-display text-[18px] font-bold">
                {c(REST.reserveTitle)}
              </h2>
            </div>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: MUTED }}>
              {c(REST.reserveBody)}
            </p>
            <a
              href={whatsapp(t("contact.waPrefill"))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-bold transition-opacity hover:opacity-90"
              style={{ background: GOLD, color: INK }}
            >
              <MessageCircle className="h-4 w-4" />
              {c(REST.reserveCta)}
            </a>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: "#141d18", border: `1px solid ${LINE}` }}
          >
            <div className="flex items-center gap-2" style={{ color: GOLD }}>
              <Bike className="h-4 w-4" />
              <h2 className="font-display text-[18px] font-bold">
                {c(REST.deliveryTitle)}
              </h2>
            </div>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: MUTED }}>
              {c(REST.deliveryBody)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Talabat", "Lezzoo", "Zomato"].map((app) => (
                <span
                  key={app}
                  dir="ltr"
                  className="rounded-lg border px-3 py-2 text-[13px] font-semibold"
                  style={{ borderColor: LINE, color: PAPER }}
                >
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DemoSection>

      {/* ----------------------------------------------------------- Events */}
      <DemoSection className="border-b border-[#1e2a24]">
        <div className="grid gap-10 md:grid-cols-[0.85fr_1fr] md:items-center">
          <PhotoTile from="#8a6a3a" to="#2a2116" ratio="aspect-[4/3]" />
          <div>
            <h2 className="font-display text-[28px] font-bold">
              {c(REST.eventsTitle)}
            </h2>
            <p
              className="mt-3 text-[15.5px] leading-relaxed"
              style={{ color: MUTED }}
            >
              {c(REST.eventsBody)}
            </p>
            <div className="mt-5">
              {REST.events.map((e) => (
                <PriceRow
                  key={e.name.en}
                  name={c(e.name)}
                  detail={e.detail ? c(e.detail) : undefined}
                  price={c(e.price)}
                  rule="#2c3a33"
                  muted={MUTED}
                />
              ))}
            </div>
          </div>
        </div>
      </DemoSection>

      {/* --------------------------------------------------------- Branches */}
      <DemoSection>
        <h2 className="font-display text-[28px] font-bold">
          {c(REST.branchesTitle)}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {REST.branches.map((b) => (
            <div
              key={b.name.en}
              className="rounded-2xl p-5"
              style={{ background: "#141d18", border: `1px solid ${LINE}` }}
            >
              <h3 className="font-display text-[16.5px] font-bold">
                {c(b.name)}
              </h3>
              <p
                className="mt-2 inline-flex items-start gap-2 text-[14px]"
                style={{ color: MUTED }}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {c(b.address)}
              </p>
              <p
                className="mt-1.5 inline-flex items-start gap-2 text-[14px]"
                style={{ color: MUTED }}
              >
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {c(b.hours)}
              </p>
            </div>
          ))}
        </div>
      </DemoSection>

      <footer
        className="border-t px-5 py-8 text-center text-[13px]"
        style={{ borderColor: LINE, color: MUTED }}
      >
        {c(REST.name)} — {new Date().getFullYear()}
      </footer>
    </div>
  );
}
