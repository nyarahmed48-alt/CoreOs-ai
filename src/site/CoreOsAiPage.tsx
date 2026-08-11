/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import { Search, EyeOff, Scale, Shuffle } from "lucide-react";
import { CoreOsMark } from "./Logo";
import { LAB_MODELS, type PublicAgent } from "./catalog";
import { AgentCard } from "./AgentCard";
import { TestConsole } from "./TestConsole";
import { Eyebrow } from "./Eyebrow";
import { useLang } from "./i18n";
import { fill } from "./strings";
import type { Copy } from "./strings";

/** Sentinel for the unfiltered chip. Not a category name, so it cannot collide
 *  with one in either language. */
const ALL = "__all";

export function CoreOsAiPage() {
  const [testing, setTesting] = useState<PublicAgent | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const { t, pick } = useLang();

  /* Filtering is keyed on the English category, which is stable, while the
     chip renders in whichever language is active. Switching language must not
     silently drop the active filter. */
  const categories = useMemo(() => {
    const seen = new Map<string, Copy>();
    for (const m of LAB_MODELS) seen.set(m.category.en, m.category);
    return [...seen.entries()];
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LAB_MODELS.filter((m) => {
      if (category !== ALL && m.category.en !== category) return false;
      if (!q) return true;
      // Search both languages: a visitor may know the English term for a task
      // while reading the Arabic page, or the reverse.
      const haystack = [
        m.name,
        m.tagline.ar,
        m.tagline.en,
        m.category.ar,
        m.category.en,
        ...m.uses.flatMap((u) => [u.ar, u.en]),
        ...m.traits.flatMap((tr) => [tr.ar, tr.en]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category]);

  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-20 md:pb-16 md:pt-28">
          <div className="site-rise max-w-3xl">
            <div className="flex items-center gap-3">
              <CoreOsMark size={40} />
              <span
                dir="ltr"
                className="font-brand text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#6c7bf0]"
              >
                coreOs<span className="text-[#1878dc]">.ai</span>
              </span>
            </div>

            <div className="mt-7">
              <Eyebrow>{t("lab.eyebrow")}</Eyebrow>
            </div>

            <h1 className="mt-4 font-brand text-[clamp(2.1rem,5.2vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-white">
              {t("lab.h1a")}
              <br />
              {t("lab.h1b")}
            </h1>

            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-[#a4abc4]">
              {t("lab.lede")}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Note
              icon={<EyeOff className="h-4 w-4" />}
              title={t("lab.n1T")}
              body={t("lab.n1B")}
            />
            <Note
              icon={<Scale className="h-4 w-4" />}
              title={t("lab.n2T")}
              body={t("lab.n2B")}
            />
            <Note
              icon={<Shuffle className="h-4 w-4" />}
              title={t("lab.n3T")}
              body={t("lab.n3B")}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e677f]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("lab.search")}
                aria-label={t("lab.searchAria")}
                className="w-full rounded-xl border border-[#232b40] bg-[#0a0d16] py-2.5 pe-3 ps-10 text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#5e677f] focus:border-[#4a5677]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={category === ALL}
                onClick={() => setCategory(ALL)}
                label={t("lab.all")}
              />
              {categories.map(([key, copy]) => (
                <Chip
                  key={key}
                  active={category === key}
                  onClick={() => setCategory(key)}
                  label={pick(copy)}
                />
              ))}
            </div>
          </div>

          <p className="mt-5 text-[13px] text-[#5e677f]">
            {fill(t("lab.showing"), {
              shown: visible.length,
              total: LAB_MODELS.length,
            })}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => (
              <AgentCard key={m.slug} agent={m} onTest={setTesting} />
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-[#171d2d] bg-[#0a0d16] px-6 py-16 text-center">
              <p className="text-[14.5px] text-[#98a0bb]">
                {fill(t("lab.empty"), { query })}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Why codenames */}
      <section className="border-t border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold tracking-[-0.02em] text-white">
            {t("lab.whyH2")}
          </h2>
          <div className="mt-6 space-y-5 text-[15.5px] leading-[1.75] text-[#a4abc4]">
            <p>{t("lab.whyP1")}</p>
            <p>{t("lab.whyP2")}</p>
            <p className="text-[#e7eaf6]">{t("lab.whyP3")}</p>
          </div>
        </div>
      </section>

      {testing ? (
        <TestConsole agent={testing} onClose={() => setTesting(null)} />
      ) : null}
    </>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
        active
          ? "bg-[#6c7bf0] text-[#05060a]"
          : "border border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Note({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[#171d2d] bg-[#0a0d16] p-4">
      <div className="flex items-center gap-2 text-[#6c7bf0]">
        {icon}
        <h3 className="font-display text-[14px] font-semibold text-white">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#98a0bb]">{body}</p>
    </div>
  );
}
