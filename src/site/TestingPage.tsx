/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { EyeOff, ShieldCheck, Zap } from "lucide-react";
import { OPEN_TESTING, type PublicAgent } from "./catalog";
import { AgentCard } from "./AgentCard";
import { TestConsole } from "./TestConsole";
import { Eyebrow } from "./Eyebrow";
import { useLang } from "./i18n";

export function TestingPage() {
  const [testing, setTesting] = useState<PublicAgent | null>(null);
  const { t } = useLang();

  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-20 md:pb-16 md:pt-28">
          <div className="site-rise max-w-3xl">
            <Eyebrow>{t("testing.eyebrow")}</Eyebrow>
            <h1 className="mt-5 font-brand text-[clamp(2.2rem,5.5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              {t("testing.h1a")}
              <br />
              {t("testing.h1b")}
            </h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-[#a4abc4]">
              {t("testing.lede")}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Note
              icon={<Zap className="h-4 w-4" />}
              title={t("testing.n1T")}
              body={t("testing.n1B")}
            />
            <Note
              icon={<EyeOff className="h-4 w-4" />}
              title={t("testing.n2T")}
              body={t("testing.n2B")}
            />
            <Note
              icon={<ShieldCheck className="h-4 w-4" />}
              title={t("testing.n3T")}
              body={t("testing.n3B")}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {OPEN_TESTING.map((a) => (
              <AgentCard key={a.slug} agent={a} onTest={setTesting} />
            ))}
          </div>

          <p className="mt-12 text-center text-[14px] text-[#7d859e]">
            {t("testing.footerQ")}{" "}
            <a
              href="/contact"
              className="font-semibold text-[#6c7bf0] hover:text-[#8390f4]"
            >
              {t("testing.footerCta")}
            </a>
            .
          </p>
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
