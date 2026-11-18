import { useState } from "react";
import type { TimelineKind } from "../../engine/types";
import { Panel } from "../components/Panel";
import { SEVERITY_LEVEL, StatusIcon } from "../components/Status";
import { met } from "../format";
import type { ViewProps } from "./types";

const FILTERS: { id: string; label: string; kinds: TimelineKind[] | null }[] = [
  { id: "all", label: "All", kinds: null },
  { id: "events", label: "Events & decisions", kinds: ["event", "decision"] },
  { id: "systems", label: "Failures & repairs", kinds: ["failure", "repair", "alert"] },
  { id: "milestones", label: "Objectives & science", kinds: ["objective", "science", "resupply", "start", "end"] },
  { id: "commands", label: "Commander actions", kinds: ["system"] },
];

export function Timeline({ s }: ViewProps) {
  const [filter, setFilter] = useState("all");
  const f = FILTERS.find((x) => x.id === filter)!;
  const items = [...s.timeline].reverse().filter((t) => !f.kinds || f.kinds.includes(t.kind));
  return (
    <Panel title="Mission timeline" eyebrow={`${s.timeline.length} entries · updates automatically`}>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter timeline">
        {FILTERS.map((x) => (
          <button key={x.id} type="button" aria-pressed={filter === x.id} onClick={() => setFilter(x.id)} className={`lc-btn !min-h-8 text-[12px] ${filter === x.id ? "lc-btn-primary" : ""}`}>
            {x.label}
          </button>
        ))}
      </div>
      <ol className="relative ml-2 border-l border-lc-line">
        {items.map((t) => (
          <li key={t.id} className="relative mb-4 pl-5">
            <span className="absolute -left-[8px] top-0.5 rounded-full bg-lc-panel p-[1px]">
              <StatusIcon level={SEVERITY_LEVEL[t.severity]} />
            </span>
            <div className="lc-mono text-[10.5px] text-lc-mute">
              {met(t.hour)} · {t.kind.toUpperCase()}
            </div>
            <div className="text-[13.5px] text-lc-text">{t.title}</div>
            {t.detail && <div className="mt-0.5 max-w-3xl text-[12.5px] leading-snug text-lc-dim">{t.detail}</div>}
          </li>
        ))}
        {items.length === 0 && <li className="pl-5 text-[13px] text-lc-dim">Nothing in this category yet.</li>}
      </ol>
    </Panel>
  );
}
