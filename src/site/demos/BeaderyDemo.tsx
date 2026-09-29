/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Demo — Lana's Beadery, a handmade bead jewellery shop on Instagram.
 *
 * Unlike the other three this is a pitch for a real business, so it takes its
 * look from her own logo: white, sage green and soft pink, with the script
 * wordmark. Her Instagram thumbnails are too small to reuse, so the pieces are
 * drawn as SVG strands in the colours of the bracelets she actually sells.
 *
 * The chat bubble in the corner is a mock-up of an AI assistant. It opens, it
 * shows a sample exchange and it answers anything typed with a note that it is
 * not switched on yet — nothing is sent anywhere.
 */

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Gift,
  Heart,
  Instagram,
  MessageCircle,
  Palette,
  Send,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { BEADERY, type BeadProduct } from "./content";
import { DemoBar, DemoSection, useCopy } from "./shared";
import type { Copy } from "../strings";

const PAPER = "#fdfcf8";
const INK = "#3f4a33";
const SAGE = "#a9c77a";
const SAGE_DEEP = "#6f8f45";
const PINK = "#f2a7b3";
const MUTED = "#7d8671";
const LINE = "#e7ecdc";

const SCRIPT = { fontFamily: "'Dancing Script', cursive" };

/* Card backgrounds for the product grid, one per piece. */
const CARD_BG = ["#fbeef0", "#fdf5dc", "#fdecef", "#eef4e4", "#f0f5e8", "#f3eefa"];

/* ============================================================== pieces === */

/** The shop's mark: a cord dipping to a striped bead, over the wordmark. */
function Logo({ className = "" }: { className?: string }) {
  // The logo appears three times on the page; each needs its own clip id.
  const clip = `lb-bead-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 240 150" className={className} role="img" aria-label="Lana's Beadery">
      <defs>
        <clipPath id={clip}>
          <circle cx="120" cy="62" r="22" />
        </clipPath>
      </defs>
      <path d="M52 10 C 60 45, 80 58, 97 62" fill="none" stroke={SAGE} strokeWidth="3" strokeLinecap="round" />
      <path d="M188 10 C 180 45, 160 58, 143 62" fill="none" stroke={SAGE} strokeWidth="3" strokeLinecap="round" />
      <g clipPath={`url(#${clip})`}>
        <rect x="96" y="38" width="48" height="48" fill={PINK} />
        {[-14, -2, 10, 22].map((dy) => (
          <path
            key={dy}
            d={`M94 ${62 + dy} q 7 -8 14 0 t 14 0 t 14 0 t 14 0`}
            fill="none"
            stroke={SAGE}
            strokeWidth="5"
          />
        ))}
      </g>
      <text
        x="120"
        y="126"
        textAnchor="middle"
        fontSize="34"
        fill={SAGE_DEEP}
        style={SCRIPT}
        fontWeight={700}
      >
        Lana's Beadery
      </text>
    </svg>
  );
}

/** The focal bead at the bottom of a strand, centred on (0, 0). */
function Charm({ kind }: { kind: BeadProduct["charm"] }) {
  switch (kind) {
    case "strawberry":
      return (
        <g>
          <path d="M0 13 C -13 5, -13 -8, 0 -7 C 13 -8, 13 5, 0 13 Z" fill="#e8364a" />
          <path d="M-7 -8 L -2 -5 L 0 -11 L 2 -5 L 7 -8 L 3 -3 L -3 -3 Z" fill="#4f9a3a" />
          {[[-4, 0], [4, 0], [0, 4], [-5, 5], [5, 5], [0, -2], [0, 9]].map(([x, y]) => (
            <ellipse key={`${x},${y}`} cx={x} cy={y} rx="0.9" ry="1.4" fill="#ffe7a8" />
          ))}
        </g>
      );
    case "lemon":
      return (
        <g>
          <circle r="12" fill="#f58a1f" />
          <circle r="10" fill="#fff4d6" />
          <circle r="8.5" fill="#fcb53b" />
          {[0, 45, 90, 135].map((a) => (
            <line
              key={a}
              x1={-8.5 * Math.cos((a * Math.PI) / 180)}
              y1={-8.5 * Math.sin((a * Math.PI) / 180)}
              x2={8.5 * Math.cos((a * Math.PI) / 180)}
              y2={8.5 * Math.sin((a * Math.PI) / 180)}
              stroke="#fff4d6"
              strokeWidth="1.2"
            />
          ))}
        </g>
      );
    case "heart":
      return (
        <path
          d="M0 11 C -16 0, -9 -13, 0 -5 C 9 -13, 16 0, 0 11 Z"
          fill="#ea6f8a"
          stroke="#fff"
          strokeWidth="1.5"
        />
      );
    case "flower":
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-6.5"
              rx="4.6"
              ry="6.5"
              fill="#ffffff"
              stroke="#e4e8dc"
              strokeWidth="0.8"
              transform={`rotate(${a})`}
            />
          ))}
          <circle r="4" fill="#f7c948" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * A bracelet drawn as a ring of beads with its charm at the bottom. The name
 * bracelet swaps the bottom few beads for lettered cubes instead.
 */
function Bracelet({ product }: { product: BeadProduct }) {
  const COUNT = 30;
  const R = 62;
  const bottom = Math.PI / 2;
  const gap = product.charm === "none" ? 0 : product.charm === "name" ? 0.62 : 0.26;
  const letters = "LANA";

  const beads = Array.from({ length: COUNT }, (_, i) => {
    const angle = bottom + (i / COUNT) * Math.PI * 2;
    // Distance from the bottom, wrapped to [-π, π].
    const off = Math.atan2(Math.sin(angle - bottom), Math.cos(angle - bottom));
    return { i, angle, skip: Math.abs(off) < gap };
  });

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <circle cx="100" cy="100" r={R} fill="none" stroke="#d8d2c4" strokeWidth="1" />
      {beads.map(({ i, angle, skip }) =>
        skip ? null : (
          <g key={i} transform={`translate(${100 + R * Math.cos(angle)} ${100 + R * Math.sin(angle)})`}>
            <circle r="7" fill={product.beads[i % product.beads.length]} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" />
            <circle cx="-2.2" cy="-2.4" r="2" fill="#fff" opacity="0.7" />
          </g>
        ),
      )}
      {product.charm === "name" ? (
        letters.split("").map((ch, k) => {
          // SVG angles run clockwise, which is right-to-left along the bottom,
          // so step backwards to keep the name reading left to right.
          const angle = bottom - (k - (letters.length - 1) / 2) * 0.3;
          return (
            <g
              key={k}
              transform={`translate(${100 + R * Math.cos(angle)} ${100 + R * Math.sin(angle)}) rotate(${((angle - bottom) * 180) / Math.PI})`}
            >
              <rect x="-8" y="-8" width="16" height="16" rx="3" fill="#fff" stroke="#d9d4c7" />
              <text y="4.5" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK} fontFamily="Inter, sans-serif">
                {ch}
              </text>
            </g>
          );
        })
      ) : (
        <g transform={`translate(100 ${100 + R + 2})`}>
          <Charm kind={product.charm} />
        </g>
      )}
    </svg>
  );
}

/* ============================================================ assistant === */

type ChatLine = { from: "bot" | "user"; text: Copy | string };

/**
 * The AI assistant mock-up. Pinned to the bottom-right corner in every
 * language — it is a floating control, not part of the reading flow, and that
 * is where visitors expect a chat bubble to be.
 */
function ChatBubble() {
  const c = useCopy();
  const chat = BEADERY.chat;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([
    { from: "bot", text: chat.greeting },
    { from: "user", text: chat.sampleQ },
    { from: "bot", text: chat.sampleA },
  ]);
  const scroller = useRef<HTMLDivElement>(null);
  const pending = useRef<number | undefined>(undefined);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [lines, open]);

  useEffect(() => () => window.clearTimeout(pending.current), []);

  const say = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setLines((l) => [...l, { from: "user", text: clean }]);
    setDraft("");
    window.clearTimeout(pending.current);
    pending.current = window.setTimeout(
      () => setLines((l) => [...l, { from: "bot", text: chat.demoReply }]),
      700,
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    say(draft);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div
          role="dialog"
          aria-label={c(chat.title)}
          className="flex h-[min(32rem,calc(100dvh-8rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_-12px_rgba(63,74,51,0.35)]"
          style={{ border: `1px solid ${LINE}` }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: SAGE }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
              <Bot className="h-5 w-5" style={{ color: SAGE_DEEP }} />
            </span>
            <div className="min-w-0 flex-1 text-white">
              <p className="truncate text-[14.5px] font-bold">{c(chat.title)}</p>
              <p className="text-[11.5px] opacity-90">{c(chat.status)}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c(chat.close)}
              className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4" style={{ background: PAPER }}>
            {lines.map((line, i) => (
              <div key={i} className={`flex ${line.from === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className="max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed"
                  style={
                    line.from === "user"
                      ? { background: PINK, color: "#4a2a31" }
                      : { background: "#fff", color: INK, border: `1px solid ${LINE}` }
                  }
                >
                  {typeof line.text === "string" ? line.text : c(line.text)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
            {chat.suggestions.map((s) => (
              <button
                key={s.en}
                type="button"
                onClick={() => say(c(s))}
                className="rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors hover:bg-[#eef4e4]"
                style={{ border: `1px solid ${LINE}`, color: SAGE_DEEP }}
              >
                {c(s)}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={c(chat.placeholder)}
              className="min-w-0 flex-1 rounded-full px-4 py-2.5 text-[14px] outline-none focus:ring-2"
              style={{ background: PAPER, border: `1px solid ${LINE}`, color: INK }}
            />
            <button
              type="submit"
              aria-label={c(chat.send)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
              style={{ background: SAGE_DEEP }}
            >
              <Send className="h-4 w-4 rtl:-scale-x-100" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? c(chat.close) : c(chat.open)}
        aria-expanded={open}
        className="relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_10px_30px_-6px_rgba(111,143,69,0.6)] transition-transform hover:scale-105"
        style={{ background: `linear-gradient(135deg, ${SAGE}, ${SAGE_DEEP})` }}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
        {!open ? (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-white ring-2 ring-white"
            style={{ background: PINK }}
          >
            AI
          </span>
        ) : null}
      </button>
    </div>
  );
}

/* ================================================================= page === */

export function BeaderyDemo() {
  const c = useCopy();
  const B = BEADERY;

  const igButton = (label: Copy, solid = true) => (
    <a
      href={B.instagram}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-opacity hover:opacity-90"
      style={solid ? { background: SAGE_DEEP, color: "#fff" } : { border: `1.5px solid ${SAGE}`, color: SAGE_DEEP }}
    >
      <Instagram className="h-4 w-4" />
      {c(label)}
    </a>
  );

  return (
    <div style={{ background: PAPER, color: INK }} className="min-h-[100dvh]">
      <DemoBar />

      {/* -------------------------------------------------------------- Nav */}
      <nav className="border-b" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <a href="#top" className="block w-28" aria-label="Lana's Beadery">
            <Logo className="h-auto w-full" />
          </a>
          <div className="flex items-center gap-5 text-[14px] font-medium" style={{ color: MUTED }}>
            <a href="#shop" className="hidden hover:text-[#3f4a33] sm:inline">{c(B.shopTitle)}</a>
            <a href="#custom" className="hidden hover:text-[#3f4a33] sm:inline">{c(B.customTitle)}</a>
            <a href="#order" className="hidden hover:text-[#3f4a33] sm:inline">{c(B.howTitle)}</a>
            <a
              href={B.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={B.handle}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ background: PINK }}
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------- Hero */}
      <header id="top" className="relative overflow-hidden border-b" style={{ borderColor: LINE }}>
        {/* Loose beads scattered behind the hero, in the logo's colours. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {[
            ["8%", "18%", 14, PINK],
            ["92%", "12%", 10, SAGE],
            ["85%", "80%", 16, PINK],
            ["4%", "78%", 9, SAGE],
            ["50%", "6%", 7, "#f7d21e"],
          ].map(([left, top, size, color]) => (
            <span
              key={`${left}${top}`}
              className="absolute rounded-full opacity-60"
              style={{ left: left as string, top: top as string, width: size as number, height: size as number, background: color as string }}
            />
          ))}
        </div>

        <div className="relative mx-auto grid max-w-5xl gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
          <div>
            <div className="flex items-center gap-2" style={{ color: SAGE_DEEP }}>
              <Sparkles className="h-4 w-4" />
              <span className="text-[12px] font-bold uppercase tracking-[0.22em]">{c(B.kicker)}</span>
            </div>
            <h1
              dir="ltr"
              className="mt-3 text-[clamp(3rem,9vw,5rem)] font-bold leading-[1] rtl:text-right"
              style={{ ...SCRIPT, color: SAGE_DEEP }}
            >
              {c(B.name)}
            </h1>
            <p className="mt-5 text-[19px] font-semibold leading-relaxed">{c(B.tagline)}</p>
            <p className="mt-3 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>{c(B.intro)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {igButton(B.orderCta)}
              <a
                href="#shop"
                className="inline-flex items-center rounded-full px-6 py-3.5 text-[15px] font-bold transition-colors hover:bg-[#eef4e4]"
                style={{ border: `1.5px solid ${SAGE}`, color: SAGE_DEEP }}
              >
                {c(B.browseCta)}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {B.badges.map((b) => (
                <li
                  key={b.en}
                  className="rounded-full px-3 py-1 text-[12.5px] font-semibold"
                  style={{ background: "#fbeef0", color: "#b0566b" }}
                >
                  {c(b)}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(from 200deg, ${PINK}55, ${SAGE}55, ${PINK}55)` }}
            />
            <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white shadow-[0_20px_60px_-20px_rgba(63,74,51,0.35)]">
              <Logo className="w-[78%]" />
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- Shop */}
      <DemoSection id="shop" className="border-b border-[#e7ecdc]">
        <h2 className="font-display text-[28px] font-bold">{c(B.shopTitle)}</h2>
        <p className="mt-2 text-[14.5px]" style={{ color: MUTED }}>{c(B.shopNote)}</p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {B.products.map((p, i) => (
            <article
              key={p.name.en}
              className="group overflow-hidden rounded-3xl bg-white transition-shadow hover:shadow-[0_16px_40px_-18px_rgba(63,74,51,0.35)]"
              style={{ border: `1px solid ${LINE}` }}
            >
              <div className="relative aspect-square p-6" style={{ background: CARD_BG[i % CARD_BG.length] }}>
                <div className="h-full w-full transition-transform duration-500 group-hover:rotate-6">
                  <Bracelet product={p} />
                </div>
                <Heart className="absolute top-4 right-4 h-5 w-5" style={{ color: PINK }} />
              </div>
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold">{c(p.name)}</h3>
                  <p className="mt-1 text-[13.5px]" style={{ color: MUTED }}>{c(p.detail)}</p>
                </div>
                <span dir="ltr" className="shrink-0 font-bold tabular-nums" style={{ color: SAGE_DEEP }}>
                  {c(p.price)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </DemoSection>

      {/* ----------------------------------------------------------- Custom */}
      <DemoSection id="custom" className="border-b border-[#e7ecdc]">
        <div className="grid gap-8 rounded-[2rem] px-6 py-10 md:grid-cols-[1fr_1fr] md:items-center md:px-10" style={{ background: "#eef4e4" }}>
          <div>
            <Palette className="h-7 w-7" style={{ color: SAGE_DEEP }} />
            <h2 className="mt-4 font-display text-[28px] font-bold">{c(B.customTitle)}</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed" style={{ color: MUTED }}>{c(B.customBody)}</p>
            <div className="mt-6">{igButton(B.orderCta)}</div>
          </div>
          <ul className="space-y-3">
            {B.customIdeas.map((idea, i) => (
              <li key={idea.en} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-[15px] font-medium">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: i % 2 ? "#eef4e4" : "#fbeef0" }}
                >
                  <Gift className="h-4 w-4" style={{ color: i % 2 ? SAGE_DEEP : "#b0566b" }} />
                </span>
                {c(idea)}
              </li>
            ))}
          </ul>
        </div>
      </DemoSection>

      {/* ------------------------------------------------------------ Order */}
      <DemoSection id="order">
        <h2 className="font-display text-[28px] font-bold">{c(B.howTitle)}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {B.steps.map((s, i) => {
            const Icon = [MessageCircle, Sparkles, Truck][i];
            return (
              <li key={s.title.en} className="rounded-3xl bg-white p-6" style={{ border: `1px solid ${LINE}` }}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-extrabold text-white"
                    style={{ background: i === 1 ? PINK : SAGE }}
                  >
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5" style={{ color: SAGE_DEEP }} />
                </div>
                <h3 className="mt-4 text-[17px] font-bold">{c(s.title)}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: MUTED }}>{c(s.body)}</p>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 flex justify-center">{igButton(B.orderCta)}</div>
      </DemoSection>

      <footer className="border-t px-5 pb-28 pt-10 text-center" style={{ borderColor: LINE }}>
        <Logo className="mx-auto w-36" />
        <p className="mt-3 text-[13.5px]" style={{ color: MUTED }}>{c(B.footerLine)}</p>
        <a
          href={B.instagram}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-semibold"
          style={{ color: SAGE_DEEP }}
        >
          <Instagram className="h-4 w-4" />
          {B.handle}
        </a>
        <p className="mt-4 text-[12px]" style={{ color: MUTED }}>© {new Date().getFullYear()} Lana's Beadery</p>
      </footer>

      <ChatBubble />
    </div>
  );
}
