/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import { Mail, Copy, Check, Send, MessageSquare, Building2, Phone, MessageCircle } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, mailto, whatsapp } from "./contact";
import { Eyebrow } from "./Eyebrow";
import { useLang } from "./i18n";
import type { CopyKey } from "./strings";

/* Website and app builds are the most common enquiry, so that chip leads and
   is the default selection. */
const TOPIC_KEYS: CopyKey[] = [
  "contact.topicBuild",
  "contact.topic1",
  "contact.topic2",
  "contact.topic3",
  "contact.topic4",
  "contact.topic5",
];

export function ContactPage() {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [topicKey, setTopicKey] = useState<CopyKey>(TOPIC_KEYS[0]);
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);

  const topic = t(topicKey);

  const href = useMemo(() => {
    const body = [
      name ? `${t("contact.mailName")}: ${name}` : "",
      company ? `${t("contact.mailBusiness")}: ${company}` : "",
      `${t("contact.mailPhone")}: ${phone}`,
      `${t("contact.mailTopic")}: ${topic}`,
      "",
      details || t("contact.mailBody"),
      "",
      t("contact.mailFrom"),
    ]
      .filter(Boolean)
      .join("\n");
    return mailto(`${t("contact.mailSubject")}${topic}`, body);
  }, [name, company, phone, topic, details, t]);

  // The whole reason for this form is getting a number to call back on, so the
  // send button stays disabled until there is one.
  const hasPhone = phone.trim().length >= 6;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the address is on screen anyway */
    }
  }

  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-20 md:pb-16 md:pt-28">
          <div className="site-rise max-w-3xl">
            <Eyebrow>{t("contact.eyebrow")}</Eyebrow>
            <h1 className="mt-5 font-brand text-[clamp(2.2rem,5.5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              {t("contact.h1")}
            </h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-[#a4abc4]">
              {t("contact.lede")}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
            {/* ------------------------------------------------ Direct email */}
            <div>
              {/* WhatsApp leads: this page says we would rather call than trade
                  emails, so the first action on it should start a conversation
                  rather than open a mail client. */}
              <div className="mb-4 rounded-2xl border border-[#1d3a2a] bg-[#0a1410] p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#12241a] text-[#4ade80]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-[18px] font-semibold text-white">
                  {t("contact.waH2")}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
                  {t("contact.waB")}
                </p>

                <a
                  href={whatsapp(t("contact.waPrefill"))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-5 py-3.5 text-[14.5px] font-semibold text-[#04140b] transition-colors hover:bg-[#4ae57f]"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("contact.waCta")}
                </a>

                <p
                  dir="ltr"
                  className="mt-3 text-center font-mono text-[13px] text-[#7d859e]"
                >
                  {CONTACT_PHONE_DISPLAY}
                </p>
              </div>

              <div className="rounded-2xl border border-[#1c2337] bg-[#0a0d16] p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#141a2c] text-[#6c7bf0]">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-[18px] font-semibold text-white">
                  {t("contact.emailH2")}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
                  {t("contact.emailB")}
                </p>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#232b40] bg-[#0d1220] px-4 py-3.5 transition-colors hover:border-[#6c7bf0]"
                >
                  <span
                    dir="ltr"
                    className="break-all font-mono text-[13.5px] text-[#e7eaf6]"
                  >
                    {CONTACT_EMAIL}
                  </span>
                  <Send className="h-4 w-4 shrink-0 text-[#6c7bf0] rtl:-scale-x-100" />
                </a>

                <button
                  type="button"
                  onClick={copyEmail}
                  className="mt-2.5 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-[13px] font-medium text-[#8c93ac] transition-colors hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#4ade80]" />
                      {t("contact.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      {t("contact.copy")}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 grid gap-4">
                <SideNote
                  icon={<MessageSquare className="h-4 w-4" />}
                  title={t("contact.note1T")}
                  body={t("contact.note1B")}
                />
                <SideNote
                  icon={<Building2 className="h-4 w-4" />}
                  title={t("contact.note2T")}
                  body={t("contact.note2B")}
                />
              </div>
            </div>

            {/* ------------------------------------------------ Brief builder */}
            <div className="rounded-2xl border border-[#1c2337] bg-[#0a0d16] p-6 md:p-8">
              <h2 className="font-display text-[18px] font-semibold text-white">
                {t("contact.briefH2")}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
                {t("contact.briefP1")}{" "}
                <span
                  dir="ltr"
                  className="break-all font-mono text-[13px] text-[#c3c9dd]"
                >
                  {CONTACT_EMAIL}
                </span>{" "}
                {t("contact.briefP2")}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label={t("contact.name")}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("contact.namePh")}
                    aria-label={t("contact.name")}
                    className="w-full rounded-xl border border-[#232b40] bg-[#0d1220] px-3.5 py-2.5 text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#4d556b] focus:border-[#4a5677]"
                  />
                </Field>
                <Field label={t("contact.business")}>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={t("contact.businessPh")}
                    aria-label={t("contact.business")}
                    className="w-full rounded-xl border border-[#232b40] bg-[#0d1220] px-3.5 py-2.5 text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#4d556b] focus:border-[#4a5677]"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label={t("contact.phone")}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder="+964 750 123 4567"
                    aria-label={t("contact.phone")}
                    className={`w-full rounded-xl border bg-[#0d1220] px-3.5 py-2.5 text-start text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#4d556b] focus:border-[#4a5677] ${
                      phone.trim() && !hasPhone ? "border-[#5b2434]" : "border-[#232b40]"
                    }`}
                  />
                  <p className="mt-2 text-[12.5px] text-[#7d859e]">
                    {t("contact.phoneHelp")}
                  </p>
                </Field>
              </div>

              <div className="mt-4">
                <Field label={t("contact.topic")}>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTopicKey(key)}
                        className={`rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                          topicKey === key
                            ? "bg-[#6c7bf0] text-[#05060a]"
                            : "border border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
                        }`}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field label={t("contact.details")}>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={6}
                    aria-label={t("contact.details")}
                    placeholder={t("contact.detailsPh")}
                    className="w-full resize-y rounded-xl border border-[#232b40] bg-[#0d1220] px-3.5 py-3 text-[14px] leading-relaxed text-[#e7eaf6] outline-none placeholder:text-[#4d556b] focus:border-[#4a5677]"
                  />
                </Field>
              </div>

              {hasPhone ? (
                <a
                  href={href}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3.5 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
                >
                  <Mail className="h-4 w-4" />
                  {t("contact.send")}
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#232b40] bg-[#0d1220] px-5 py-3.5 text-[14.5px] font-semibold text-[#5e677f]"
                >
                  <Phone className="h-4 w-4" />
                  {t("contact.needPhone")}
                </span>
              )}
              <p className="mt-3 text-center text-[12px] text-[#5e677f]">
                {t("contact.noMail")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  // A plain <div> rather than a <label>: one of these groups wraps buttons,
  // and a label that owns a button swallows the click.
  return (
    <div>
      <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5e677f]">
        {label}
      </span>
      {children}
    </div>
  );
}

function SideNote({
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
      <div className="flex items-center gap-2 text-[#1878dc]">
        {icon}
        <h3 className="font-display text-[14.5px] font-semibold text-white">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#98a0bb]">{body}</p>
    </div>
  );
}
