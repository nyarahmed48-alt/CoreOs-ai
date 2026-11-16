/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Contact.
 *
 * One route only: the enquiry form. There is no phone number, no email
 * address and no mailto form here any more. Everything arrives in one place,
 * in the same shape, and nothing personal is left on a public page.
 *
 * The topic chips that used to build a mailto subject are gone with it — the
 * form asks those questions itself, and asking them twice helps nobody.
 */

import { ArrowUpRight, Instagram, MessageSquare, Clock } from "lucide-react";
import { FORM_LINK_PROPS, SOCIALS } from "./contact";
import { Eyebrow } from "./Eyebrow";
import { useLang } from "./i18n";

export function ContactPage() {
  const { t } = useLang();

  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-20 md:pb-16 md:pt-28">
          <Eyebrow>{t("contact.eyebrow")}</Eyebrow>
          <h1 className="mt-5 max-w-3xl font-brand text-[clamp(2.1rem,5.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
            {t("contact.h1")}
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#a4abc4]">
            {t("contact.lede")}
          </p>
        </div>
      </section>

      <section id="contact">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rounded-3xl border border-[#232b40] bg-[#0b1018] p-7 md:p-10">
            <h2 className="font-display text-[22px] font-bold text-white md:text-[26px]">
              {t("contact.briefH2")}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#a4abc4]">
              {t("ct.formNote")}
            </p>

            <a
              {...FORM_LINK_PROPS}
              className="mt-7 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#6c7bf0] px-7 text-[15.5px] font-bold text-[#05060a] transition-colors hover:bg-[#8390f4]"
            >
              {t("nav.talk")}
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <p className="mt-5 inline-flex items-center gap-2 text-[14px] text-[#8c93ac]">
              <Clock className="h-4 w-4 shrink-0 text-[#6c7bf0]" />
              {t("ct.reply")}
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#1b2236] bg-[#080b12] p-6">
              <h3 className="font-display text-[15.5px] font-bold text-white">
                {t("contact.note2T")}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#8c93ac]">
                {t("contact.note2B")}
              </p>
            </div>
            <div className="rounded-2xl border border-[#1b2236] bg-[#080b12] p-6">
              <h3 className="font-display text-[15.5px] font-bold text-white">
                {t("contact.note1T")}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#8c93ac]">
                {t("contact.note1B")}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#5e677f]">
              {t("ct.follow")}
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={SOCIALS.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#232b40] px-4 text-[14.5px] font-medium text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
              >
                <Instagram className="h-4 w-4 shrink-0" />
                <span dir="ltr">{SOCIALS.instagram.handle}</span>
              </a>
              <a
                href={SOCIALS.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#232b40] px-4 text-[14.5px] font-medium text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span dir="ltr">{SOCIALS.tiktok.handle}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
