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
  Workflow,
  Bot,
  Tag,
  ScanBarcode,
  TrendingDown,
  NotebookPen,
  WifiOff,
  FileText,
  CloudUpload,
  Tablet,
  MonitorSmartphone,
  ClipboardList,
  MapPin,
  Store,
  Megaphone,
  Plug,
  ArrowUpRight,
} from "lucide-react";
import { CoreOsMark } from "./Logo";
import { Link } from "./router";
import { FORM_LINK_PROPS } from "./contact";
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
              {t("home.oneLine")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#services"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
              >
                {t("home.ctaServices")}
                <Arrow />
              </a>
              <a
                {...FORM_LINK_PROPS}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#232b40] bg-[#0a0d16] px-5 text-[14.5px] font-semibold text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
              >
                {t("nav.talk")}
                <ArrowUpRight className="h-4 w-4" />
              </a>
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


      {/* ---------------------------------------------------------- CoreCashier

          The hero product, so it sits immediately under the hero rather than
          below three sections about the company. Every feature listed is one
          the system actually has; there are no prices here because they
          depend on the device, so each card ends at the form instead.
      */}
      <section id="corecashier" className="border-b border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Eyebrow>{t("cc.eyebrow")}</Eyebrow>
          <h2 className="mt-5 max-w-3xl font-brand text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
            {t("cc.h2")}
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#a4abc4]">
            {t("cc.lede")}
          </p>

          <h3 className="mt-12 text-[12px] font-bold uppercase tracking-[0.16em] text-[#5e677f]">
            {t("cc.featTitle")}
          </h3>
          <ul className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {(
              [
                [ScanBarcode, "cc.f1"],
                [Gauge, "cc.f2"],
                [TrendingDown, "cc.f3"],
                [NotebookPen, "cc.f4"],
                [WifiOff, "cc.f5"],
                [FileText, "cc.f6"],
                [Languages, "cc.f7"],
                [CloudUpload, "cc.f8"],
              ] as Array<[typeof Gauge, CopyKey]>
            ).map(([Icon, key]) => (
              <li key={key} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#6c7bf0]" />
                <span className="text-[15px] leading-relaxed text-[#c3c9dd]">{t(key)}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-14 text-[12px] font-bold uppercase tracking-[0.16em] text-[#5e677f]">
            {t("cc.optTitle")}
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(
              [
                [Tablet, "cc.o1t", "cc.o1b"],
                [MonitorSmartphone, "cc.o2t", "cc.o2b"],
              ] as Array<[typeof Gauge, CopyKey, CopyKey]>
            ).map(([Icon, title, body]) => (
              <div key={title} className="rounded-2xl border border-[#232b40] bg-[#0b1018] p-6">
                <Icon className="h-5 w-5 text-[#6c7bf0]" />
                <h4 className="mt-3.5 font-display text-[16.5px] font-bold text-white">{t(title)}</h4>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#8c93ac]">{t(body)}</p>
                <a
                  {...FORM_LINK_PROPS}
                  className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-[#6c7bf0] hover:text-[#8390f4]"
                >
                  {t("ct.quote")}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13.5px] text-[#7d859e]">{t("cc.addons")}</p>

          <h3 className="mt-14 text-[12px] font-bold uppercase tracking-[0.16em] text-[#5e677f]">
            {t("cc.howTitle")}
          </h3>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {(["cc.h1t", "cc.h2t", "cc.h3t"] as CopyKey[]).map((key, i) => (
              <li key={key} className="rounded-2xl border border-[#1b2236] bg-[#080b12] p-5">
                <span
                  dir="ltr"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#141a2a] font-display text-[13px] font-bold text-[#6c7bf0]"
                >
                  {i + 1}
                </span>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#c3c9dd]">{t(key)}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              {...FORM_LINK_PROPS}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#6c7bf0] px-6 text-[15px] font-bold text-[#05060a] transition-colors hover:bg-[#8390f4]"
            >
              {t("cc.cta")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="inline-flex items-center gap-2 text-[13.5px] text-[#7d859e]">
              <MapPin className="h-4 w-4 shrink-0 text-[#6c7bf0]" />
              {t("cc.where")}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Services

          Five cards, in the order a visitor is most likely to need them.
          Marketing is listed last but belongs here rather than in a silo —
          CoreStudio is part of CoreOs, not a separate company.
      */}
      <section id="services" className="border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Eyebrow>{t("sv.eyebrow")}</Eyebrow>
          <h2 className="mt-5 max-w-3xl font-brand text-[clamp(1.8rem,4.2vw,2.7rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
            {t("sv.h2")}
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                [Workflow, "sv.s1t", "sv.s1b"],
                [Globe, "sv.s2t", "sv.s2b"],
                [Plug, "sv.s3t", "sv.s3b"],
                [Bot, "sv.s4t", "sv.s4b"],
                [Megaphone, "sv.s5t", "sv.s5b"],
              ] as Array<[typeof Globe, CopyKey, CopyKey]>
            ).map(([Icon, title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-[#1b2236] bg-[#080b12] p-6 transition-colors hover:border-[#2c3550]"
              >
                <Icon className="h-5 w-5 text-[#6c7bf0]" />
                <h3 className="mt-3.5 font-display text-[16.5px] font-bold text-white">{t(title)}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#8c93ac]">{t(body)}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#232b40] bg-[#0b1018] p-6">
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#6c7bf0]" />
              <div>
                <h3 className="font-display text-[15.5px] font-bold text-white">{t("build.priceT")}</h3>
                <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-[#8c93ac]">
                  {t("build.priceB")}
                </p>
                <a
                  {...FORM_LINK_PROPS}
                  className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-[#6c7bf0] hover:text-[#8390f4]"
                >
                  {t("ct.quote")}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Demos

          Follows "what we build" for a reason: the claim comes first, then the
          proof. A prospect can click into a finished site rather than taking
          our word for the standard.
      */}
      <section className="border-b border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="max-w-2xl">
            <Eyebrow>{t("demos.eyebrow")}</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.7rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              {t("demos.h2")}
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[#a4abc4]">
              {t("demos.lede")}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <DemoCard
              to="/demos/barber"
              scale={t("demos.scaleS")}
              title={t("demos.barberT")}
              body={t("demos.barberB")}
              from="#c9a227"
              to2="#12100e"
              cta={t("demos.view")}
              rtl={isRtl}
            />
            <DemoCard
              to="/demos/nails"
              scale={t("demos.scaleM")}
              title={t("demos.nailsT")}
              body={t("demos.nailsB")}
              from="#f2d3d8"
              to2="#c2708a"
              cta={t("demos.view")}
              rtl={isRtl}
            />
            <DemoCard
              to="/demos/restaurant"
              scale={t("demos.scaleL")}
              title={t("demos.restT")}
              body={t("demos.restB")}
              from="#3d5c4a"
              to2="#0f1512"
              cta={t("demos.view")}
              rtl={isRtl}
            />
          </div>
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


      {/* ---------------------------------------------------------- CoreStudio */}
      <section id="corestudio" className="border-b border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <Eyebrow>{t("cs.eyebrow")}</Eyebrow>
          <h2 className="mt-5 max-w-2xl font-brand text-[clamp(1.7rem,3.8vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
            {t("cs.h2")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[#a4abc4]">
            {t("cs.body")}
          </p>
          <a
            {...FORM_LINK_PROPS}
            className="mt-7 inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#232b40] bg-[#0a0d16] px-5 text-[14.5px] font-semibold text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
          >
            {t("ct.quote")}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ------------------------------------------------------- Brands strip

          Four names, one company. Stated plainly because the structure is the
          thing people most often get wrong about us: CoreStudio and CoreOs.ai
          are branches, not separate businesses.
      */}
      <section className="border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <Eyebrow>{t("br.eyebrow")}</Eyebrow>
          <h2 className="mt-5 font-brand text-[clamp(1.7rem,3.8vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
            {t("br.h2")}
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["CoreOS", "br.b1", "#services"],
                ["CoreOS.ai", "br.b2", "/coreos-ai"],
                ["CoreCashier", "br.b3", "#corecashier"],
                ["CoreStudio", "br.b4", "#corestudio"],
              ] as Array<[string, CopyKey, string]>
            ).map(([name, body, href]) => (
              <a
                key={name}
                href={href}
                className="rounded-2xl border border-[#1b2236] bg-[#080b12] p-5 transition-colors hover:border-[#2c3550]"
              >
                <span dir="ltr" className="font-display text-[15.5px] font-bold text-white">
                  {name}
                </span>
                <p className="mt-2 text-[14px] leading-relaxed text-[#8c93ac]">{t(body)}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Who we work with */}
      <section className="border-b border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <Eyebrow>{t("wh.eyebrow")}</Eyebrow>
          <h2 className="mt-5 font-brand text-[clamp(1.7rem,3.8vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
            {t("wh.h2")}
          </h2>
          <p className="mt-5 inline-flex max-w-2xl items-start gap-3 text-[15.5px] leading-relaxed text-[#a4abc4]">
            <Store className="mt-1 h-4.5 w-4.5 shrink-0 text-[#6c7bf0]" />
            {t("wh.body")}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ Contact */}
      <section id="contact">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="rounded-3xl border border-[#232b40] bg-[#0b1018] p-7 text-center md:p-12">
            <h2 className="font-brand text-[clamp(1.7rem,4vw,2.5rem)] font-extrabold tracking-[-0.03em] text-white">
              {t("contact.h1")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#a4abc4]">
              {t("ct.formNote")}
            </p>
            <a
              {...FORM_LINK_PROPS}
              className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#6c7bf0] px-7 text-[15.5px] font-bold text-[#05060a] transition-colors hover:bg-[#8390f4]"
            >
              {t("nav.talk")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-5 inline-flex items-center justify-center gap-2 text-[14px] text-[#8c93ac]">
              <ClipboardList className="h-4 w-4 shrink-0 text-[#6c7bf0]" />
              {t("ct.reply")}
            </p>
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
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#a4abc4]">
                  {t("ai.verano")}
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

function DemoCard({
  to,
  scale,
  title,
  body,
  from,
  to2,
  cta,
  rtl,
}: {
  to: string;
  scale: string;
  title: string;
  body: string;
  /** Gradient endpoints, lifted from the demo's own palette so the tile
   *  previews the site it links to rather than being decoration. */
  from: string;
  to2: string;
  cta: string;
  rtl: boolean;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#171d2d] bg-[#0a0d16] transition-colors hover:border-[#2c3550]"
    >
      <div
        className="aspect-[16/9] w-full"
        style={{ background: `linear-gradient(135deg, ${from}, ${to2})` }}
      >
        <div className="h-full w-full bg-[radial-gradient(120%_90%_at_20%_10%,rgba(255,255,255,0.18),transparent_60%)]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1878dc]">
          {scale}
        </span>
        <h3 className="mt-2 font-display text-[17px] font-semibold text-white">
          {title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#98a0bb]">
          {body}
        </p>
        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#6c7bf0] group-hover:text-[#8390f4]">
          {cta}
          <ArrowRight className={`h-3.5 w-3.5 ${rtl ? "rotate-180" : ""}`} />
        </span>
      </div>
    </Link>
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
