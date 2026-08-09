/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  ArrowRight,
  Wallet,
  SlidersHorizontal,
  Languages,
  Gauge,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { CoreOsMark } from "./Logo";
import { Link } from "./router";
import { OPEN_TESTING, LAB_MODELS, type PublicAgent } from "./catalog";
import { AgentCard } from "./AgentCard";
import { Eyebrow } from "./Eyebrow";
import { TestConsole } from "./TestConsole";

export function HomePage() {
  const [testing, setTesting] = useState<PublicAgent | null>(null);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="site-grain relative overflow-hidden border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 md:pb-28 md:pt-28">
          <div className="site-rise max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#232b40] bg-[#0a0d16]/70 px-3.5 py-1.5 text-[12.5px] font-medium text-[#98a0bb]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              31 AI agents open for public testing
            </span>

            <h1 className="mt-7 font-brand text-[clamp(2.6rem,7vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-white">
              Where your needs
              <br />
              <span className="text-[#6c7bf0]">meet reality.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-[#a4abc4] md:text-[18px]">
              CoreOs builds business AI that small and mid-sized companies can
              actually afford to run. Not a per-seat licence. Not a six-figure
              pilot. A configurable AI agent shaped around what your business
              already does — priced by what it actually uses.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/testing"
                className="inline-flex items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
              >
                Try the 11 open agents
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/coreos-ai"
                className="inline-flex items-center gap-2 rounded-xl border border-[#232b40] bg-[#0a0d16] px-5 py-3 text-[14.5px] font-semibold text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
              >
                {/* One flex child: the parent's gap must not split the word. */}
                <span>
                  Explore CoreOs<span className="text-[#1878dc]">.ai</span>
                </span>
              </Link>
            </div>

            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {[
                ["31", "Agents in testing"],
                ["3", "Languages served"],
                ["0", "Per-seat fees"],
                ["100%", "Human-in-the-loop"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-[26px] font-bold text-white">
                    {value}
                  </dt>
                  <dd className="mt-0.5 text-[12.5px] text-[#7d859e]">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Mission */}
      <section className="border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <div>
              <Eyebrow>Our mission</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                B2B AI, priced so a real business can say yes.
              </h2>
              <p className="mt-5 text-[15.5px] leading-relaxed text-[#a4abc4]">
                Enterprise AI is priced for enterprises. A twelve-person
                logistics firm, a family wholesaler, a regional clinic — they get
                quoted the same platform fee as a multinational, told to buy a
                seat for every employee, then asked to sign for a year before
                anything works.
              </p>
              <p className="mt-4 text-[15.5px] leading-relaxed text-[#a4abc4]">
                CoreOs exists to break that. We meter usage, not headcount. You
                set the ceiling before you spend a thing.
              </p>
              <Link
                to="/mission"
                className="mt-7 inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#6c7bf0] hover:text-[#8390f4]"
              >
                Read the full mission
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Pillar
                icon={<Wallet className="h-5 w-5" />}
                title="Metered, not licensed"
                body="Quotas are set per customer in sentences and characters. You cap the spend before the first message, and the cap holds."
              />
              <Pillar
                icon={<SlidersHorizontal className="h-5 w-5" />}
                title="Configured, not custom-built"
                body="Your agent is tuned at runtime — instructions, tone, limits, variables. No six-month engagement to change a sentence."
              />
              <Pillar
                icon={<Languages className="h-5 w-5" />}
                title="Serves your actual customers"
                body="English, Arabic and Kurdish out of the box, with the same brand voice in each. Regional business is not an afterthought."
              />
              <Pillar
                icon={<Gauge className="h-5 w-5" />}
                title="Switchable underneath"
                body="Models change monthly. Yours updates without a migration project, because the engine is ours to swap, not yours to manage."
              />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Human-first */}
      <section className="border-b border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <HeartHandshake className="mx-auto h-8 w-8 text-[#1878dc]" />
            <h2 className="mt-6 font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              We build AI to help people work — not to work instead of them.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[#a4abc4]">
              This is not a marketing line we soften later. It is a design
              constraint. Every CoreOs agent is built to take the repetitive
              third of a job — the same twenty questions, the copy-paste, the
              after-hours holding pattern — and hand the judgement back to the
              person whose name is on the reply.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              {
                title: "Drafts, not decisions",
                body: "Agents prepare the reply. A human reviews it, edits it, and sends it.",
              },
              {
                title: "Escalation by default",
                body: "When an agent is unsure, it stops and routes to a colleague instead of inventing an answer.",
              },
              {
                title: "Nobody is measured out of a job",
                body: "We report on tickets deflected and hours returned — never on headcount you could cut.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-[#171d2d] bg-[#0a0d16] p-5"
              >
                <h3 className="font-display text-[15.5px] font-semibold text-white">
                  {c.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#98a0bb]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Open testing sample */}
      <section className="border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow>Open testing</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                Eleven business agents. Free to test, right now.
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-[#a4abc4]">
                These are the agents CoreOs deploys for clients, opened up so you
                can put your own questions to them before you talk to anyone.
                No signup, no card, no call.
              </p>
            </div>
            <Link
              to="/testing"
              className="inline-flex items-center gap-2 rounded-xl border border-[#232b40] px-4 py-2.5 text-[13.5px] font-semibold text-[#c3c9dd] hover:border-[#3a4460] hover:text-white"
            >
              See all 11
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {OPEN_TESTING.slice(0, 6).map((a) => (
              <AgentCard key={a.slug} agent={a} onTest={setTesting} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ CoreOs.ai CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="site-grain overflow-hidden rounded-3xl border border-[#1c2337] bg-[#0a0d16] p-8 md:p-14">
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <CoreOsMark size={34} />
                  <span className="font-brand text-[26px] font-extrabold tracking-[-0.02em] text-[#6c7bf0]">
                    coreOs<span className="text-[#1878dc]">.ai</span>
                  </span>
                </div>
                <h2 className="mt-6 font-display text-[clamp(1.7rem,3.6vw,2.4rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                  Twenty models. Twenty codenames. No badges to bias you.
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-[#a4abc4]">
                  CoreOs.ai is our open model lab. Each of the {LAB_MODELS.length}{" "}
                  models is published under a CoreOs codename with a plain
                  description of what it's good for — so you pick on results,
                  not on whose logo is attached.
                </p>
                <Link
                  to="/coreos-ai"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
                >
                  <Sparkles className="h-4 w-4" />
                  Enter the model lab
                </Link>
              </div>

              <div className="grid w-full max-w-xs grid-cols-4 gap-2 md:w-auto">
                {LAB_MODELS.map((m) => (
                  <div
                    key={m.slug}
                    title={m.name}
                    className="flex aspect-square items-center justify-center rounded-lg border border-[#1e2537] bg-[#0d1220] font-display text-[11px] font-bold text-[#5e677f]"
                  >
                    {m.monogram}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {testing ? (
        <TestConsole agent={testing} onClose={() => setTesting(null)} />
      ) : null}
    </>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[#171d2d] bg-[#0a0d16] p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#141a2c] text-[#6c7bf0]">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-[15.5px] font-semibold text-white">
        {title}
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#98a0bb]">{body}</p>
    </div>
  );
}
