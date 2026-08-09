/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, Quote } from "lucide-react";
import { Link } from "./router";
import { Eyebrow } from "./Eyebrow";

export function MissionPage() {
  return (
    <>
      <section className="site-grain border-b border-[#12172a]">
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-20 md:pb-20 md:pt-28">
          <div className="site-rise">
            <Eyebrow>Our mission</Eyebrow>
            <h1 className="mt-5 font-brand text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              Make business AI affordable — and make it work{" "}
              <span className="text-[#6c7bf0]">with</span> people.
            </h1>
            <p className="mt-7 text-[17px] leading-relaxed text-[#a4abc4]">
              Two commitments hold up everything CoreOs builds. One is about
              price. The other is about people. We refuse to trade either for
              the other.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Affordability */}
      <section className="border-b border-[#12172a]">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-[#5e677f]">
            Commitment 01
          </span>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            B2B affordability
          </h2>

          <div className="mt-8 space-y-6 text-[15.5px] leading-[1.75] text-[#a4abc4]">
            <p>
              The AI industry has quietly decided that serious tooling is for
              companies with a procurement department. The pricing proves it:
              platform fees before a single message is sent, seat licences that
              punish you for having staff, annual commitments signed before
              anyone has demonstrated the thing works on your data, and an
              integration bill that arrives afterwards.
            </p>
            <p>
              A twelve-person logistics firm has the same problem a
              twelve-thousand-person one does — the same repeated customer
              questions, the same after-hours gap, the same inbox nobody has
              time for. What it does not have is a six-figure line item to solve
              it with. So it goes without, and the gap between businesses that
              can use AI and businesses that cannot gets wider every quarter.
            </p>
            <p className="text-[#e7eaf6]">
              CoreOs is built specifically to close that gap. Affordability is
              not our discount strategy; it is the product architecture.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <Principle
              n="01"
              title="You pay for usage, never for headcount"
              body="Quotas are defined in sentences and characters, per customer, with hard limits enforced on every request. Hiring a tenth employee does not raise your bill. Neither does giving five more people access."
            />
            <Principle
              n="02"
              title="The ceiling is set before you spend"
              body="Every account carries an explicit cap. When it is reached, the agent stops and says so — it does not keep spending and invoice you afterwards. No surprise overage is the single most requested feature from businesses of this size, so it is the default."
            />
            <Principle
              n="03"
              title="Configuration replaces custom development"
              body="Your agent's instructions, tone, language, variables and limits are all runtime settings. Changing how it behaves is an edit in a console, not a change request against a statement of work."
            />
            <Principle
              n="04"
              title="Model upgrades are ours to absorb"
              body="The engine underneath your agent improves without a migration project on your side. You never pay a professional-services fee to move from one generation of model to the next."
            />
            <Principle
              n="05"
              title="Test the whole thing before you talk to sales"
              body="Thirty-one agents are open for public testing on this site. No account, no card, no discovery call. If it does not answer your questions well, you have lost ten minutes rather than a budget cycle."
            />
          </div>

          <div className="mt-10 rounded-2xl border border-[#1c2337] bg-[#0a0d16] p-6">
            <Quote className="h-6 w-6 text-[#1878dc]" />
            <p className="mt-4 font-display text-[19px] leading-relaxed text-white">
              Affordable does not mean cheap and stripped down. It means the
              price is shaped like the business paying it.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Human-first */}
      <section className="border-b border-[#12172a] bg-[#07090f]">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-[#5e677f]">
            Commitment 02
          </span>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            AI that helps humans — not AI that takes their jobs
          </h2>

          <div className="mt-8 space-y-6 text-[15.5px] leading-[1.75] text-[#a4abc4]">
            <p>
              Most AI is sold on a headcount argument: deploy this, employ fewer
              people. We will not sell that, and we have deliberately built
              CoreOs so it is a poor tool for anyone trying to.
            </p>
            <p>
              The work our agents take on is the part of a job nobody protects:
              answering the same twenty questions, copying an order number
              between two systems, drafting the fourth identical email of the
              morning, covering the inbox at eleven at night. That work exhausts
              people and it is the first thing that gets dropped when a team is
              stretched. Removing it does not remove the person — it gives them
              back the part of the role that needed a human in the first place.
            </p>
            <p className="text-[#e7eaf6]">
              Judgement stays with your staff. Every time.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Draft-first by design",
                body: "Agents that touch customers produce drafts. A person reviews and sends. The system is built around that step, not around removing it.",
              },
              {
                title: "Uncertainty escalates",
                body: "An agent that is not confident says so and routes to a colleague. Confident nonsense is a worse outcome than a handover, so we optimise against it.",
              },
              {
                title: "Bounded scope",
                body: "Agents answer from your documents and policies. They are not given authority to make commitments, discounts or exceptions on your behalf.",
              },
              {
                title: "Honest reporting",
                body: "We report hours returned and questions deflected. We do not produce headcount-reduction models, and we will not build one on request.",
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

      <section>
        <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-20">
          <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold tracking-[-0.02em] text-white">
            Judge it yourself before you believe any of this.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#a4abc4]">
            Thirty-one agents are open right now. Ask them something from your
            own business and see whether the answers hold up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/testing"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] hover:bg-[#8390f4]"
            >
              Test the open agents
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-[#232b40] px-5 py-3 text-[14.5px] font-semibold text-[#c3c9dd] hover:border-[#3a4460] hover:text-white"
            >
              Talk to us
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
