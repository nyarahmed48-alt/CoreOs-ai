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

export function TestingPage() {
  const [testing, setTesting] = useState<PublicAgent | null>(null);

  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-20 md:pb-16 md:pt-28">
          <div className="site-rise max-w-3xl">
            <Eyebrow>Open testing programme</Eyebrow>
            <h1 className="mt-5 font-brand text-[clamp(2.2rem,5.5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              Eleven CoreOs agents,
              <br />
              open for anyone to test.
            </h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-[#a4abc4]">
              Each one is a real CoreOs business agent — the same kind we
              configure for paying clients — running in a public sandbox. Open
              one, ask it something from your own operation, and judge it on the
              answer. Nothing to sign up for.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Note
              icon={<Zap className="h-4 w-4" />}
              title="No account needed"
              body="Every agent below is live. Click test and start typing."
            />
            <Note
              icon={<EyeOff className="h-4 w-4" />}
              title="Engines stay hidden"
              body="Agents are published under CoreOs codenames so the label can't flatter the output."
            />
            <Note
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Nothing is stored"
              body="Sandbox conversations aren't saved. Don't paste anything confidential regardless."
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
            Want one of these shaped around your own policies, documents and
            tone?{" "}
            <a
              href="/contact"
              className="font-semibold text-[#6c7bf0] hover:text-[#8390f4]"
            >
              Tell us what you need
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
