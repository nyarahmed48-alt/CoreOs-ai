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

export function CoreOsAiPage() {
  const [testing, setTesting] = useState<PublicAgent | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(LAB_MODELS.map((m) => m.category)))],
    [],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LAB_MODELS.filter((m) => {
      if (category !== "All" && m.category !== category) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.uses.some((u) => u.toLowerCase().includes(q)) ||
        m.traits.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-20 md:pb-16 md:pt-28">
          <div className="site-rise max-w-3xl">
            <div className="flex items-center gap-3">
              <CoreOsMark size={40} />
              <span className="font-brand text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#6c7bf0]">
                coreOs<span className="text-[#1878dc]">.ai</span>
              </span>
            </div>

            <div className="mt-7">
              <Eyebrow>The open model lab</Eyebrow>
            </div>

            <h1 className="mt-4 font-brand text-[clamp(2.1rem,5.2vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-white">
              Twenty models to test.
              <br />
              Twenty names you've never heard.
            </h1>

            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-[#a4abc4]">
              Every model in this lab runs under a CoreOs codename. We publish
              what each one is good at, in plain language, and nothing about
              what's underneath — because the moment you see a familiar badge
              you stop reading the answer and start trusting the brand. Pick on
              output. That's the whole point.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Note
              icon={<EyeOff className="h-4 w-4" />}
              title="Codenames, not badges"
              body="The engine behind each name is deliberately withheld so testing stays honest."
            />
            <Note
              icon={<Scale className="h-4 w-4" />}
              title="Described by use, not by spec"
              body="No parameter counts or benchmark tables — just what each model is genuinely good for."
            />
            <Note
              icon={<Shuffle className="h-4 w-4" />}
              title="Same prompt, several models"
              body="Run one question through three codenames and keep whichever answers it best."
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e677f]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or task…"
                aria-label="Search models"
                className="w-full rounded-xl border border-[#232b40] bg-[#0a0d16] py-2.5 pl-10 pr-3 text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#5e677f] focus:border-[#4a5677]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    category === c
                      ? "bg-[#6c7bf0] text-[#05060a]"
                      : "border border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-[13px] text-[#5e677f]">
            Showing {visible.length} of {LAB_MODELS.length} models
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => (
              <AgentCard key={m.slug} agent={m} onTest={setTesting} />
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-[#171d2d] bg-[#0a0d16] px-6 py-16 text-center">
              <p className="text-[14.5px] text-[#98a0bb]">
                No model matches “{query}”. Try a task instead of a name — for
                example “translate”, “contract” or “spreadsheet”.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Why codenames */}
      <section className="border-t border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold tracking-[-0.02em] text-white">
            Why we hide which model is which
          </h2>
          <div className="mt-6 space-y-5 text-[15.5px] leading-[1.75] text-[#a4abc4]">
            <p>
              Model names carry reputation, and reputation biases judgement. Show
              a business owner two identical answers and label one with a famous
              badge, and the badge wins — even when the other answer is better
              for their use case, faster, and a fraction of the cost.
            </p>
            <p>
              That bias costs our clients money. So CoreOs.ai strips the labels
              off. You test Aurelis against Nimbex on your own question and pick
              the one that answered it properly. We then run your production
              agent on whatever that was, and keep it current as models change —
              without you having to re-evaluate the market every six months.
            </p>
            <p className="text-[#e7eaf6]">
              It also means an upgrade underneath your agent is a non-event. The
              codename stays; the engine gets better.
            </p>
          </div>
        </div>
      </section>

      {testing ? (
        <TestConsole agent={testing} onClose={() => setTesting(null)} />
      ) : null}
    </>
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
