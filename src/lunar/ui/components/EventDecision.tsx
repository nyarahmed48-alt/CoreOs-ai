import { Clock } from "lucide-react";
import { canAfford } from "../../engine/mutators";
import { facilityName } from "../../engine/mutators";
import { pendingEventDef } from "../../engine/actions";
import type { GameState } from "../../engine/types";
import type { MissionApi } from "../../state/useMission";
import { SourceLinks } from "./Sources";
import { SeverityBadge } from "./Status";

export function EventDecision({ s, api, headingId }: { s: GameState; api: MissionApi; headingId?: string }) {
  const def = pendingEventDef(s);
  if (!def || !s.pendingEvent) return null;
  const left = s.pendingEvent.deadlineHour - s.hour;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={def.severity} />
        <span className="lc-mono inline-flex items-center gap-1 text-[11.5px] text-lc-dim">
          <Clock size={12} aria-hidden /> Decide within {left} sim-hour{left === 1 ? "" : "s"} — otherwise “{def.options.find((o) => o.id === def.defaultOption)?.label}” is applied
        </span>
      </div>
      <h2 id={headingId} className="mt-2 font-display text-[21px] font-semibold leading-tight text-lc-text">
        {def.title}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-lc-dim">{def.description}</p>
      <div className="mt-2 text-[12px] text-lc-mute">
        Affected systems: <span className="text-lc-dim">{def.affected.map(facilityName).join(", ")}</span>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {def.options.map((o) => {
          const afford = canAfford(s, o.cost);
          return (
            <button
              key={o.id}
              type="button"
              disabled={!afford.ok}
              onClick={() => api.dispatch({ type: "resolveEvent", optionId: o.id })}
              className="group flex flex-col rounded-xl border border-lc-line2 bg-[#0c1525] p-3.5 text-left transition-colors hover:border-lc-cyan hover:bg-[#0f1b30] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-display text-[14.5px] font-semibold text-lc-text group-hover:text-lc-cyan">{o.label}</span>
              <span className="mt-1 text-[12.5px] leading-snug text-lc-dim">{o.description}</span>
              <ul className="mt-2 space-y-0.5 text-[12px] text-lc-mute">
                {o.consequences.map((c) => (
                  <li key={c} className="flex gap-1.5">
                    <span aria-hidden>›</span>
                    {c}
                  </li>
                ))}
              </ul>
              {!afford.ok && <span className="mt-2 text-[11.5px] text-lc-red">{afford.reason}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-lc-line bg-[#0b1322] p-3">
        <div className="lc-label">Why this happens</div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-lc-dim">{def.science}</p>
        <SourceLinks ids={def.sourceIds} />
      </div>
    </div>
  );
}
