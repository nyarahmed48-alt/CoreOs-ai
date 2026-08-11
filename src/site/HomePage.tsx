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
  Globe,
  Smartphone,
  Workflow,
  Bot,
} from "lucide-react";
import { CoreOsMark } from "./Logo";
import { Link } from "./router";
import { OPEN_TESTING, LAB_MODELS, type PublicAgent } from "./catalog";
import { AgentCard } from "./AgentCard";
import { Eyebrow } from "./Eyebrow";
import { TestConsole } from "./TestConsole";
import { useLang } from "./i18n";
import type { CopyKey } from "./strings";

export function HomePage() {
  const [testing, setTesting] = useState<PublicAgent | null>(null);
  const { t, isRtl } = useLang();

  /* The arrow is a direction cue, not decoration: it has to point the way the
     text runs or it reads as "back" in Arabic. */
  const Arrow = () => (
    <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
  );

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="site-grain relative overflow-hidden border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 md:pb-28 md:pt-28">
          <div className="site-rise max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#232b40] bg-[#0a0d16]/70 px-3.5 py-1.5 text-[12.5px] font-medium text-[#98a0bb]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              {t("home.badge")}
            </span>

            <h1 className="mt-7 font-brand text-[clamp(2.6rem,7vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-white">
              {t("home.h1a")}
              <br />
              <span className="text-[#6c7bf0]">{t("home.h1b")}</span>
            </h1>

            <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-[#a4abc4] md:text-[18px]">
              {t("home.lede")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/testing"
                className="inline-flex items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
              >
                {t("home.ctaTest")}
                <Arrow />
              </Link>
              <Link
                to="/coreos-ai"
                className="inline-flex items-center gap-2 rounded-xl border border-[#232b40] bg-[#0a0d16] px-5 py-3 text-[14.5px] font-semibold text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
              >
                {/* One flex child: the parent's gap must not split the word. */}
                <span>
                  {t("home.ctaExplore")}{" "}
                  <span dir="ltr">
                    CoreOs<span className="text-[#1878dc]">.ai</span>
                  </span>
                </span>
              </Link>
            </div>

            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {(
                [
                  ["31", "home.stat1"],
                  ["3", "home.stat2"],
                  ["0", "home.stat3"],
                  ["100%", "home.stat4"],
                ] as Array<[string, CopyKey]>
              ).map(([value, key]) => (
                <div key={key}>
                  <dt
                    dir="ltr"
                    className="font-display text-[26px] font-bold text-white rtl:text-end"
                  >
                    {value}
                  </dt>
                  <dd className="mt-0.5 text-[12.5px] text-[#7d859e]">
                    {t(key)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- What we build

          Sits directly under the hero on purpose. The hero leads on AI, but
          most enquiries are website builds — a visitor should not have to
          scroll past three AI sections to learn we do the thing they came for.
      */}
      <section className="border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="max-w-2xl">
            <Eyebrow>{t("build.eyebrow")}</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              {t("build.h2")}
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[#a4abc4]">
              {t("build.lede")}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Craft
              icon={<Globe className="h-5 w-5" />}
              title={t("build.c1T")}
              body={t("build.c1B")}
            />
            <Craft
              icon={<Smartphone className="h-5 w-5" />}
              title={t("build.c2T")}
              body={t("build.c2B")}
            />
            <Craft
              icon={<Workflow className="h-5 w-5" />}
              title={t("build.c3T")}
              body={t("build.c3B")}
            />
            <Craft
              icon={<Bot className="h-5 w-5" />}
              title={t("build.c4T")}
              body={t("build.c4B")}
            />
          </div>

          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
          >
            {t("build.cta")}
            <Arrow />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------- Mission */}
      <section className="border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <div>
              <Eyebrow>{t("home.missionEyebrow")}</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                {t("home.missionH2")}
              </h2>
              <p className="mt-5 text-[15.5px] leading-relaxed text-[#a4abc4]">
                {t("home.missionP1")}
              </p>
              <p className="mt-4 text-[15.5px] leading-relaxed text-[#a4abc4]">
                {t("home.missionP2")}
              </p>
              <Link
                to="/mission"
                className="mt-7 inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#6c7bf0] hover:text-[#8390f4]"
              >
                {t("home.missionLink")}
                <Arrow />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Pillar
                icon={<Wallet className="h-5 w-5" />}
                title={t("home.pillar1T")}
                body={t("home.pillar1B")}
              />
              <Pillar
                icon={<SlidersHorizontal className="h-5 w-5" />}
                title={t("home.pillar2T")}
                body={t("home.pillar2B")}
              />
              <Pillar
                icon={<Languages className="h-5 w-5" />}
                title={t("home.pillar3T")}
                body={t("home.pillar3B")}
              />
              <Pillar
                icon={<Gauge className="h-5 w-5" />}
                title={t("home.pillar4T")}
                body={t("home.pillar4B")}
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
              {t("home.humanH2")}
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[#a4abc4]">
              {t("home.humanP")}
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {(
              [
                ["home.human1T", "home.human1B"],
                ["home.human2T", "home.human2B"],
                ["home.human3T", "home.human3B"],
              ] as Array<[CopyKey, CopyKey]>
            ).map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-[#171d2d] bg-[#0a0d16] p-5"
              >
                <h3 className="font-display text-[15.5px] font-semibold text-white">
                  {t(title)}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#98a0bb]">
                  {t(body)}
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
              <Eyebrow>{t("home.testEyebrow")}</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                {t("home.testH2")}
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-[#a4abc4]">
                {t("home.testP")}
              </p>
            </div>
            <Link
              to="/testing"
              className="inline-flex items-center gap-2 rounded-xl border border-[#232b40] px-4 py-2.5 text-[13.5px] font-semibold text-[#c3c9dd] hover:border-[#3a4460] hover:text-white"
            >
              {t("home.testAll")}
              <Arrow />
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
                  <span
                    dir="ltr"
                    className="font-brand text-[26px] font-extrabold tracking-[-0.02em] text-[#6c7bf0]"
                  >
                    coreOs<span className="text-[#1878dc]">.ai</span>
                  </span>
                </div>
                <h2 className="mt-6 font-display text-[clamp(1.7rem,3.6vw,2.4rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                  {t("home.labH2")}
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-[#a4abc4]">
                  {t("home.labP")}
                </p>
                <Link
                  to="/coreos-ai"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("home.labCta")}
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

/** Compact capability tile. Four across on desktop, so the copy stays short. */
function Craft({
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
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#141a2c] text-[#1878dc]">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-[15.5px] font-semibold text-white">
        {title}
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#98a0bb]">{body}</p>
    </div>
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
