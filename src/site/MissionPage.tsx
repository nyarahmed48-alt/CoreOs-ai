/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, Quote } from "lucide-react";
import { Link } from "./router";
import { Eyebrow } from "./Eyebrow";
import { useLang } from "./i18n";
import type { CopyKey } from "./strings";

export function MissionPage() {
  const { t, isRtl } = useLang();
  const Arrow = () => (
    <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
  );

  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-20 md:pb-20 md:pt-28">
          <div className="site-rise">
            <Eyebrow>{t("mission.eyebrow")}</Eyebrow>
            <h1 className="mt-5 font-brand text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              {t("mission.h1a")}{" "}
              <span className="text-[#6c7bf0]">{t("mission.h1with")}</span>{" "}
              {t("mission.h1b")}
            </h1>
            <p className="mt-7 text-[17px] leading-relaxed text-[#a4abc4]">
              {t("mission.lede")}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Affordability */}
      <section className="border-b border-[#12172a]">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-[#5e677f]">
            {t("mission.c1label")}
          </span>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            {t("mission.c1h2")}
          </h2>

          <div className="mt-8 space-y-6 text-[15.5px] leading-[1.75] text-[#a4abc4]">
            <p>{t("mission.c1p1")}</p>
            <p>{t("mission.c1p2")}</p>
            <p className="text-[#e7eaf6]">{t("mission.c1p3")}</p>
          </div>

          <div className="mt-10 space-y-4">
            {(
              [
                ["01", "mission.p1T", "mission.p1B"],
                ["02", "mission.p2T", "mission.p2B"],
                ["03", "mission.p3T", "mission.p3B"],
                ["04", "mission.p4T", "mission.p4B"],
                ["05", "mission.p5T", "mission.p5B"],
              ] as Array<[string, CopyKey, CopyKey]>
            ).map(([n, title, body]) => (
              <Principle key={n} n={n} title={t(title)} body={t(body)} />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#1c2337] bg-[#0a0d16] p-6">
            <Quote className="h-6 w-6 text-[#1878dc]" />
            <p className="mt-4 font-display text-[19px] leading-relaxed text-white">
              {t("mission.quote")}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Human-first */}
      <section className="border-b border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-[#5e677f]">
            {t("mission.c2label")}
          </span>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            {t("mission.c2h2")}
          </h2>

          <div className="mt-8 space-y-6 text-[15.5px] leading-[1.75] text-[#a4abc4]">
            <p>{t("mission.c2p1")}</p>
            <p>{t("mission.c2p2")}</p>
            <p className="text-[#e7eaf6]">{t("mission.c2p3")}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["mission.h1T", "mission.h1B"],
                ["mission.h2T", "mission.h2B"],
                ["mission.h3T", "mission.h3B"],
                ["mission.h4T", "mission.h4B"],
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

      <section>
        <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-20">
          <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold tracking-[-0.02em] text-white">
            {t("mission.closeH2")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#a4abc4]">
            {t("mission.closeP")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/testing"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] hover:bg-[#8390f4]"
            >
              {t("mission.closeCta")}
              <Arrow />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-[#232b40] px-5 py-3 text-[14.5px] font-semibold text-[#c3c9dd] hover:border-[#3a4460] hover:text-white"
            >
              {t("nav.talk")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Principle({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-5 rounded-2xl border border-[#171d2d] bg-[#0a0d16] p-5">
      <span className="font-display text-[13px] font-bold text-[#6c7bf0]">
        {n}
      </span>
      <div>
        <h3 className="font-display text-[16px] font-semibold text-white">
          {title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">{body}</p>
      </div>
    </div>
  );
}
