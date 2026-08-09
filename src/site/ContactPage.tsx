/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import { Mail, Copy, Check, Send, MessageSquare, Building2 } from "lucide-react";
import { CONTACT_EMAIL, mailto } from "./contact";
import { Eyebrow } from "./Eyebrow";

const TOPICS = [
  "Set up an AI agent for my business",
  "Pricing and affordability",
  "Feedback on an agent I tested",
  "Partnership or reseller enquiry",
  "Something else",
];

export function ContactPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);

  const href = useMemo(() => {
    const body = [
      name ? `Name: ${name}` : "",
      company ? `Business: ${company}` : "",
      `Topic: ${topic}`,
      "",
      details || "(Tell us what you need here.)",
      "",
      "— Sent from coreos.ai",
    ]
      .filter(Boolean)
      .join("\n");
    return mailto(`CoreOs enquiry — ${topic}`, body);
  }, [name, company, topic, details]);

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
            <Eyebrow>Contact</Eyebrow>
            <h1 className="mt-5 font-brand text-[clamp(2.2rem,5.5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              Tell us what your business needs.
            </h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-[#a4abc4]">
              One address, read by us. Describe the job you want handled — the
              repeated questions, the inbox, the paperwork — and we'll tell you
              honestly whether CoreOs is the right fit and what it would cost.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
            {/* ------------------------------------------------ Direct email */}
            <div>
              <div className="rounded-2xl border border-[#1c2337] bg-[#0a0d16] p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#141a2c] text-[#6c7bf0]">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-[18px] font-semibold text-white">
                  Email CoreOs
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
                  The fastest route. We answer enquiries ourselves — there is no
                  ticket queue between you and the people who build this.
                </p>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#232b40] bg-[#0d1220] px-4 py-3.5 transition-colors hover:border-[#6c7bf0]"
                >
                  <span className="break-all font-mono text-[13.5px] text-[#e7eaf6]">
                    {CONTACT_EMAIL}
                  </span>
                  <Send className="h-4 w-4 shrink-0 text-[#6c7bf0]" />
                </a>

                <button
                  type="button"
                  onClick={copyEmail}
                  className="mt-2.5 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-[13px] font-medium text-[#8c93ac] transition-colors hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#4ade80]" />
                      Address copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy address
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 grid gap-4">
                <SideNote
                  icon={<MessageSquare className="h-4 w-4" />}
                  title="Testing feedback is welcome"
                  body="If one of the open agents answered badly, send us the exchange. That feedback goes straight into how the agent is configured."
                />
                <SideNote
                  icon={<Building2 className="h-4 w-4" />}
                  title="Small businesses first"
                  body="You do not need a procurement process or an IT department to work with us. Most of our clients have neither."
                />
              </div>
            </div>

            {/* ------------------------------------------------ Brief builder */}
            <div className="rounded-2xl border border-[#1c2337] bg-[#0a0d16] p-6 md:p-8">
              <h2 className="font-display text-[18px] font-semibold text-white">
                Send us a brief
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
                Fill this in and it opens a pre-written email to{" "}
                <span className="break-all font-mono text-[13px] text-[#c3c9dd]">
                  {CONTACT_EMAIL}
                </span>{" "}
                in your own mail app. Nothing is submitted to a server, and we
                store nothing until you press send.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Your name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Okafor"
                    aria-label="Your name"
                    className="w-full rounded-xl border border-[#232b40] bg-[#0d1220] px-3.5 py-2.5 text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#4d556b] focus:border-[#4a5677]"
                  />
                </Field>
                <Field label="Business">
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Okafor Logistics"
                    aria-label="Business name"
                    className="w-full rounded-xl border border-[#232b40] bg-[#0d1220] px-3.5 py-2.5 text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#4d556b] focus:border-[#4a5677]"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="What's this about?">
                  <div className="flex flex-wrap gap-1.5">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        className={`rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                          topic === t
                            ? "bg-[#6c7bf0] text-[#05060a]"
                            : "border border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Details">
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={6}
                    aria-label="Details"
                    placeholder="We get around 60 of the same delivery questions a day and two people spend their mornings answering them…"
                    className="w-full resize-y rounded-xl border border-[#232b40] bg-[#0d1220] px-3.5 py-3 text-[14px] leading-relaxed text-[#e7eaf6] outline-none placeholder:text-[#4d556b] focus:border-[#4a5677]"
                  />
                </Field>
              </div>

              <a
                href={href}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3.5 text-[14.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
              >
                <Mail className="h-4 w-4" />
                Open this in my email app
              </a>
              <p className="mt-3 text-center text-[12px] text-[#5e677f]">
                No mail app? Copy the address above and write to us directly.
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
