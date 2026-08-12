/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Demo — nail studio, medium scope.
 *
 * Seven sections. A studio like this sells on how it looks and on the diary
 * being full, so it earns a gallery, social proof and a booking section that
 * the barbershop does not. Light palette on purpose: it has to be obvious at
 * a glance that these demos are not one template recoloured.
 */

import { Sparkles, Clock, MapPin, MessageCircle, Quote } from "lucide-react";
import { NAILS } from "./content";
import { DemoBar, DemoSection, PhotoTile, PriceRow, useCopy } from "./shared";
import { whatsapp } from "../contact";
import { useLang } from "../i18n";

const CREAM = "#fbf7f4";
const INK = "#33262b";
const ROSE = "#c2708a";
const MUTED = "#8d7a80";
const LINE = "#ecdfe3";

/* Gallery placeholders, in the studio's own palette. */
const TILES: Array<[string, string]> = [
  ["#e8c4d2", "#c2708a"],
  ["#f0dcc8", "#d7a06b"],
  ["#d9cfe6", "#9d84bd"],
  ["#f2d3d8", "#e0899e"],
  ["#cfe0e2", "#7fa8ad"],
  ["#f6e2c8", "#caa070"],
];

export function NailsDemo() {
  const c = useCopy();
  const { t } = useLang();

  return (
    <div style={{ background: CREAM, color: INK }} className="min-h-[100dvh]">
      <DemoBar />

      {/* ------------------------------------------------------------- Hero */}
      <header className="border-b" style={{ borderColor: LINE }}>
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
          <div>
            <div className="flex items-center gap-2" style={{ color: ROSE }}>
              <Sparkles className="h-4 w-4" />
              <span className="text-[12px] font-bold uppercase tracking-[0.22em]">
                {c(NAILS.kicker)}
              </span>
            </div>
            <h1 className="mt-4 font-brand text-[clamp(2.3rem,6vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
              {c(NAILS.name)}
            </h1>
            <p className="mt-4 text-[18px] leading-relaxed" style={{ color: ROSE }}>
              {c(NAILS.tagline)}
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
              {c(NAILS.intro)}
            </p>
            <a
              href={whatsapp(t("contact.waPrefill"))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: ROSE }}
            >
              <MessageCircle className="h-4 w-4" />
              {c(NAILS.bookCta)}
            </a>
          </div>
          <PhotoTile from="#f2d3d8" to="#c2708a" ratio="aspect-[4/5]" />
        </div>
      </header>

      {/* ---------------------------------------------------------- Services */}
      <DemoSection className="border-b border-[#ecdfe3]">
        <h2 className="font-display text-[26px] font-bold">
          {c(NAILS.servicesTitle)}
        </h2>
        <div className="mt-6 grid gap-x-12 md:grid-cols-2">
          {NAILS.services.map((s) => (
            <PriceRow
              key={s.name.en}
              name={c(s.name)}
              detail={s.detail ? c(s.detail) : undefined}
              price={c(s.price)}
              rule="#d9c6cc"
              muted={MUTED}
            />
          ))}
        </div>
      </DemoSection>

      {/* ----------------------------------------------------------- Gallery */}
      <DemoSection className="border-b border-[#ecdfe3]">
        <h2 className="font-display text-[26px] font-bold">
          {c(NAILS.galleryTitle)}
        </h2>
        <p className="mt-2 text-[14.5px]" style={{ color: MUTED }}>
          {c(NAILS.galleryNote)}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TILES.map(([from, to]) => (
            <PhotoTile key={from} from={from} to={to} ratio="aspect-square" />
          ))}
        </div>
      </DemoSection>

      {/* ----------------------------------------------------------- Reviews */}
      <DemoSection className="border-b border-[#ecdfe3]">
        <h2 className="font-display text-[26px] font-bold">
          {c(NAILS.reviewsTitle)}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {NAILS.reviews.map((r) => (
            <figure
              key={r.author.en}
              className="rounded-2xl p-5"
              style={{ background: "#fff", border: `1px solid ${LINE}` }}
            >
              <Quote className="h-5 w-5" style={{ color: ROSE }} />
              <blockquote className="mt-3 text-[14.5px] leading-relaxed">
                {c(r.quote)}
              </blockquote>
              <figcaption className="mt-3 text-[13px] font-semibold" style={{ color: MUTED }}>
                {c(r.author)}
              </figcaption>
            </figure>
          ))}
        </div>
      </DemoSection>

      {/* ----------------------------------------------------------- Booking */}
      <DemoSection className="border-b border-[#ecdfe3]">
        <div
          className="rounded-3xl px-6 py-12 text-center"
          style={{ background: "#f6e7ec" }}
        >
          <h2 className="font-display text-[26px] font-bold">
            {c(NAILS.bookTitle)}
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed"
            style={{ color: MUTED }}
          >
            {c(NAILS.bookBody)}
          </p>
          <a
            href={whatsapp(t("contact.waPrefill"))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: ROSE }}
          >
            <MessageCircle className="h-4 w-4" />
            {c(NAILS.bookCta)}
          </a>
        </div>
      </DemoSection>

      {/* -------------------------------------------------- Hours and place */}
      <DemoSection>
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2" style={{ color: ROSE }}>
              <Clock className="h-4 w-4" />
              <h2 className="font-display text-[17px] font-bold">
                {c(NAILS.hoursTitle)}
              </h2>
            </div>
            <dl className="mt-4 space-y-2 text-[15px]">
              {NAILS.hours.map((h) => (
                <div key={h.day.en} className="flex justify-between gap-4">
                  <dt style={{ color: MUTED }}>{c(h.day)}</dt>
                  <dd className="font-medium">{c(h.time)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <div className="flex items-center gap-2" style={{ color: ROSE }}>
              <MapPin className="h-4 w-4" />
              <h2 className="font-display text-[17px] font-bold">
                {c(NAILS.name)}
              </h2>
            </div>
            <p
              className="mt-4 whitespace-pre-line text-[15px] leading-relaxed"
              style={{ color: MUTED }}
            >
              {c(NAILS.address)}
            </p>
          </div>
        </div>
      </DemoSection>

      <footer
        className="border-t px-5 py-8 text-center text-[13px]"
        style={{ borderColor: LINE, color: MUTED }}
      >
        {c(NAILS.name)} — {new Date().getFullYear()}
      </footer>
    </div>
  );
}
