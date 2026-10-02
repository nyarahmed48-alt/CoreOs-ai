/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Demo — Book River, an Instagram bookshop shipping across Iraq.
 *
 * Built from their profile (see bookRiver.ts): night-navy and steel blue from
 * their avatar, the shelf from their posts, ordering by WhatsApp because that
 * is how they already sell. The addition is RiverAi, an assistant that
 * recommends books and explains ordering — the part a static page cannot do.
 */

import { useCallback, useMemo, useState } from "react";
import { MessageCircle, Sparkles, Phone, Instagram, Truck, Quote, BookOpen, Send, PackageCheck } from "lucide-react";
import { BR, BOOKS, GENRES, BR_INSTAGRAM, BR_PHONE_DISPLAY, brWhatsapp, type Book, type Genre } from "./bookRiver";
import { RiverChat } from "./RiverChat";
import { RiverMark } from "./RiverMark";
import { DemoBar, DemoSection, useCopy } from "./shared";
import { fill } from "../strings";

const NIGHT = "#0b1120";
const DEEP = "#080d19";
const PANEL = "#111a2e";
const EDGE = "#1d2a45";
const RIVER = "#7fb0e8";
const PAPER = "#e6ecf7";
const MUTED = "#8b98b4";

const STEP_ICONS = [BookOpen, Send, PackageCheck];

export function BookRiverDemo() {
  const c = useCopy();
  const [genre, setGenre] = useState<Genre | "all">("all");
  const [chatOpen, setChatOpen] = useState(false);
  const [seed, setSeed] = useState<{ id: number; text: string } | null>(null);

  const shelf = useMemo(() => (genre === "all" ? BOOKS : BOOKS.filter((b) => b.genre === genre)), [genre]);

  const ask = useCallback((text?: string) => {
    if (text) setSeed({ id: Date.now(), text });
    setChatOpen(true);
  }, []);

  const price = (n: number) => `${n.toLocaleString("en-US")} ${c(BR.currency)}`;

  return (
    <div style={{ background: NIGHT, color: PAPER }} className="min-h-[100dvh]">
      <DemoBar />

      {/* ------------------------------------------------------------- Hero */}
      <header
        className="relative overflow-hidden border-b"
        style={{ borderColor: EDGE, background: `radial-gradient(90% 70% at 85% 0%, #1b2d52 0%, ${NIGHT} 60%)` }}
      >
        {/* A river of light behind the hero, purely decorative. */}
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full opacity-40" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 110 C 200 60, 400 150, 600 100 S 1000 50, 1200 100 V160 H0Z" fill="#132342" />
          <path d="M0 130 C 250 90, 450 160, 700 120 S 1050 90, 1200 125 V160 H0Z" fill="#0f1c36" />
        </svg>

        <div className="relative mx-auto grid max-w-5xl gap-12 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-24">
          <div>
            <div className="flex items-center gap-2" style={{ color: RIVER }}>
              <RiverMark className="h-5 w-5" color={RIVER} />
              <span className="text-[12px] font-bold uppercase tracking-[0.2em]">{c(BR.kicker)}</span>
            </div>
            <h1 className="mt-4 font-brand text-[clamp(2.6rem,7vw,4.2rem)] font-extrabold leading-[1.02] tracking-[-0.025em]">
              {c(BR.name)}
            </h1>
            <p className="mt-4 text-[19px] font-medium leading-snug" style={{ color: RIVER }}>
              {c(BR.tagline)}
            </p>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed" style={{ color: MUTED }}>
              {c(BR.intro)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={brWhatsapp(c(BR.orderMsg))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-opacity hover:opacity-90"
                style={{ background: RIVER, color: NIGHT }}
              >
                <MessageCircle className="h-4 w-4" />
                {c(BR.orderCta)}
              </a>
              <button
                type="button"
                onClick={() => ask()}
                className="inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-[15px] font-bold transition-colors hover:bg-white/5"
                style={{ borderColor: "#34476e", color: PAPER }}
              >
                <Sparkles className="h-4 w-4" style={{ color: RIVER }} />
                {c(BR.askCta)}
              </button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {BR.stats.map((s) => (
                <div key={s.value}>
                  <dt className="sr-only">{c(s.label)}</dt>
                  <dd>
                    <span dir="ltr" className="block font-display text-[24px] font-bold tabular-nums">{s.value}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: MUTED }}>{c(s.label)}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* A fanned stack of three covers from the shelf. */}
          <div className="relative mx-auto h-[340px] w-full max-w-[320px]" aria-hidden="true">
            {[BOOKS[3], BOOKS[0], BOOKS[7]].map((b, i) => (
              <div
                key={b.title}
                className="absolute top-1/2 left-1/2 w-[170px]"
                style={{ transform: `translate(-50%, -50%) translateX(${(i - 1) * 72}px) rotate(${(i - 1) * 9}deg)`, zIndex: i === 1 ? 2 : 1 }}
              >
                <Cover book={b} />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ Steps */}
      <DemoSection className="border-b border-[#1d2a45]">
        <h2 className="font-display text-[26px] font-bold">{c(BR.stepsTitle)}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {BR.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={s.title.en} className="rounded-2xl border p-5" style={{ borderColor: EDGE, background: PANEL }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "#1a2a4a", color: RIVER }}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span dir="ltr" className="font-display text-[13px] font-bold" style={{ color: MUTED }}>0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">{c(s.title)}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: MUTED }}>{c(s.body)}</p>
              </li>
            );
          })}
        </ol>
      </DemoSection>

      {/* ------------------------------------------------------------ Shelf */}
      <section id="shelf" className="border-y" style={{ borderColor: EDGE, background: DEEP }}>
        <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[26px] font-bold">{c(BR.shelfTitle)}</h2>
              <p className="mt-2 text-[13.5px]" style={{ color: MUTED }}>{c(BR.shelfNote)}</p>
            </div>
          </div>

          <div role="tablist" className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
            {GENRES.map((g) => {
              const active = genre === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setGenre(g.id)}
                  className="shrink-0 rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors"
                  style={active ? { background: RIVER, borderColor: RIVER, color: NIGHT } : { borderColor: EDGE, color: "#c3cde2" }}
                >
                  {c(g.label)}
                </button>
              );
            })}
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {shelf.map((b) => (
              <li key={b.title} className="flex flex-col">
                <Cover book={b} />
                <h3 dir="ltr" className="mt-3 text-start text-[15px] font-bold leading-snug">{b.title}</h3>
                <p dir="ltr" className="text-start text-[13px]" style={{ color: MUTED }}>{b.author}</p>
                <p dir="ltr" className="mt-1 text-start text-[14px] font-semibold tabular-nums" style={{ color: RIVER }}>
                  {price(b.price)}
                </p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={brWhatsapp(`${c(BR.orderMsg)} ${b.title} — ${b.author}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg py-2 text-center text-[13px] font-bold transition-opacity hover:opacity-90"
                    style={{ background: RIVER, color: NIGHT }}
                  >
                    {c(BR.order)}
                  </a>
                  <button
                    type="button"
                    onClick={() => ask(fill(c(BR.askAboutMsg), { title: b.title }))}
                    aria-label={`${c(BR.askAbout)}: ${b.title}`}
                    title={c(BR.askAbout)}
                    className="inline-flex items-center justify-center rounded-lg border px-3 transition-colors hover:bg-white/5"
                    style={{ borderColor: EDGE, color: RIVER }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-[14.5px]" style={{ color: MUTED }}>
            {c(BR.notListed)}{" "}
            <button type="button" onClick={() => ask()} className="font-semibold underline underline-offset-4" style={{ color: RIVER }}>
              {c(BR.askCta)}
            </button>
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- RiverAi */}
      <DemoSection>
        <div
          className="grid gap-10 overflow-hidden rounded-3xl border p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12"
          style={{ borderColor: "#2a3d63", background: `linear-gradient(135deg, #14244a 0%, ${PANEL} 70%)` }}
        >
          <div>
            <span className="text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: RIVER }}>{c(BR.aiKicker)}</span>
            <h2 className="mt-3 font-brand text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold tracking-[-0.02em]">{c(BR.aiTitle)}</h2>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed" style={{ color: "#b4c0d8" }}>{c(BR.aiBody)}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {BR.chatStarters.map((s) => (
                <button
                  key={s.en}
                  type="button"
                  onClick={() => ask(c(s))}
                  dir="auto"
                  className="rounded-full border px-4 py-2 text-[13.5px] transition-colors hover:bg-white/5"
                  style={{ borderColor: "#34476e", color: "#d3dcee" }}
                >
                  {c(s)}
                </button>
              ))}
            </div>
            <p className="mt-6 text-[12.5px]" style={{ color: MUTED }}>{c(BR.aiNote)}</p>
          </div>
          <button
            type="button"
            onClick={() => ask()}
            className="mx-auto flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full transition-transform hover:scale-[1.03]"
            style={{ background: NIGHT, border: `1px solid #34476e`, boxShadow: `0 0 0 10px rgba(127,176,232,0.06), 0 0 60px rgba(127,176,232,0.25)` }}
          >
            <RiverMark className="h-14 w-14" color={RIVER} />
            <span className="font-display text-[14px] font-bold">RiverAi</span>
          </button>
        </div>
      </DemoSection>

      {/* --------------------------------------------------------- Feedback */}
      <DemoSection className="border-t border-[#1d2a45]">
        <h2 className="font-display text-[26px] font-bold">{c(BR.feedbackTitle)}</h2>
        <figure className="mt-6 rounded-2xl border p-6 md:p-8" style={{ borderColor: EDGE, background: PANEL }}>
          <Quote className="h-6 w-6" style={{ color: RIVER }} />
          <blockquote dir="ltr" lang="en" className="mt-4 text-start text-[17px] leading-relaxed">
            {BR.feedback.quote}
          </blockquote>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]" style={{ color: MUTED }}>
            <span>{c(BR.feedback.source)}</span>
            <a href={BR_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold" style={{ color: RIVER }}>
              <Instagram className="h-4 w-4" />
              {c(BR.moreOnInsta)}
            </a>
          </figcaption>
        </figure>
      </DemoSection>

      {/* ---------------------------------------------------------- Contact */}
      <DemoSection className="border-t border-[#1d2a45]">
        <h2 className="font-display text-[26px] font-bold">{c(BR.contactTitle)}</h2>
        <p className="mt-2 text-[15px]" style={{ color: MUTED }}>{c(BR.contactBody)}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ContactTile icon={Phone} label={c(BR.phoneLabel)} value={BR_PHONE_DISPLAY} href={brWhatsapp()} ltr />
          <ContactTile icon={Instagram} label="Instagram" value="@book.river64" href={BR_INSTAGRAM} ltr />
          <ContactTile icon={Truck} label={c(BR.deliveryLabel)} value={c(BR.deliveryValue)} />
        </div>
      </DemoSection>

      <footer className="border-t px-5 pb-28 pt-8 text-center text-[13px]" style={{ borderColor: EDGE, color: MUTED }}>
        <RiverMark className="mx-auto mb-2 h-6 w-6" color={MUTED} />
        {c(BR.name)} — {new Date().getFullYear()}
      </footer>

      <RiverChat open={chatOpen} onOpenChange={setChatOpen} seed={seed} />
    </div>
  );
}

/**
 * A generated jacket: the shop's real covers are photographs on Instagram, and
 * this stands in until they are dropped in. Typeset rather than blank, so the
 * shelf still reads as books.
 */
function Cover({ book }: { book: Book }) {
  return (
    <div
      dir="ltr"
      className="relative aspect-[2/3] overflow-hidden rounded-md shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
      style={{ background: `linear-gradient(160deg, ${book.cover[0]}, ${book.cover[1]})` }}
    >
      {/* Spine shading and a soft sheen. */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_20%_0%,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="relative flex h-full flex-col justify-between p-4" style={{ color: book.ink }}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">{book.author}</span>
        <span className="font-display text-[clamp(1rem,2.6vw,1.35rem)] font-bold uppercase leading-[1.05] tracking-[0.02em]">
          {book.title}
        </span>
      </div>
    </div>
  );
}

function ContactTile({
  icon: Icon,
  label,
  value,
  href,
  ltr,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
  ltr?: boolean;
}) {
  const body = (
    <>
      <Icon className="h-5 w-5" style={{ color: RIVER }} />
      <span className="mt-3 block text-[12.5px]" style={{ color: MUTED }}>{label}</span>
      <span dir={ltr ? "ltr" : undefined} className="mt-0.5 block text-[16px] font-bold">{value}</span>
    </>
  );
  const cls = "block rounded-2xl border p-5 text-start transition-colors";
  const style = { borderColor: EDGE, background: PANEL };
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-[#34476e]`} style={style}>
      {body}
    </a>
  ) : (
    <div className={cls} style={style}>{body}</div>
  );
}
