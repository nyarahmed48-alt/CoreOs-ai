/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Check } from "lucide-react";
import type { PublicAgent } from "./catalog";
import { useLang } from "./i18n";

export function AgentCard({
  agent,
  onTest,
}: {
  agent: PublicAgent;
  onTest: (agent: PublicAgent) => void;
}) {
  const { t, pick } = useLang();

  return (
    <article className="group flex flex-col rounded-2xl border border-[#171d2d] bg-[#0a0d16] p-5 transition-colors hover:border-[#2c3550]">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#141a2c] font-display text-[14px] font-bold text-[#6c7bf0]">
          {agent.monogram}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-[17px] font-semibold text-white">
              {agent.name}
            </h3>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#5e677f]">
              {pick(agent.category)}
            </span>
          </div>
          <p className="mt-1 text-[13.5px] leading-snug text-[#98a0bb]">
            {pick(agent.tagline)}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {agent.uses.map((use) => (
          <li
            key={use.en}
            className="flex gap-2.5 text-[13.5px] leading-relaxed text-[#b6bdd2]"
          >
            <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#1878dc]" />
            <span>{pick(use)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {agent.traits.map((trait) => (
          <span
            key={trait.en}
            className="rounded-md border border-[#1e2537] bg-[#0d1220] px-2 py-1 text-[11.5px] text-[#8c93ac]"
          >
            {pick(trait)}
          </span>
        ))}
      </div>

      {/* mt-auto pins the action to the card floor so buttons line up across
          a row regardless of how much copy each agent carries. */}
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={() => onTest(agent)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#232b40] bg-[#0d1220] px-4 py-2.5 text-[13.5px] font-semibold text-[#c3c9dd] transition-colors group-hover:border-[#6c7bf0] group-hover:bg-[#6c7bf0] group-hover:text-[#05060a]"
        >
          <Play className="h-3.5 w-3.5" />
          {t("card.test")} {agent.name}
        </button>
      </div>
    </article>
  );
}
