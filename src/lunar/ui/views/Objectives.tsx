import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { objectiveView } from "../../engine/objectives";
import { getScenario } from "../../engine/scenarios";
import { Meter } from "../components/Meter";
import { Panel } from "../components/Panel";
import { met } from "../format";
import type { ViewProps } from "./types";

export function Objectives({ s }: ViewProps) {
  const sc = getScenario(s.scenarioId);
  const views = sc.objectives.map((o) => objectiveView(s, o));
  const earned = views.filter((v) => v.completed).reduce((a, v) => a + v.def.points, 0);
  const possible = views.reduce((a, v) => a + v.def.points, 0);
  return (
    <div className="space-y-4">
      <Panel title={`${sc.name} — objectives`} eyebrow={`${sc.codename} · ${sc.difficulty}`} actions={<span className="lc-mono text-[13px] text-lc-dim">{earned} / {possible} pts</span>}>
        <p className="mb-4 text-[13px] leading-relaxed text-lc-dim">
          <strong className="text-lc-text">Mission accomplished</strong> requires every primary objective plus at least 75% of secondary objective points. Missing objectives gives <strong className="text-lc-text">completed with limitations</strong>; an evacuation means <strong className="text-lc-text">unsuccessful</strong>.
        </p>
        <ul className="space-y-3">
          {views.map((v) => (
            <li key={v.def.id} className="rounded-xl border border-lc-line bg-[#0b1322] p-4">
              <div className="flex items-start gap-3">
                {v.completed ? <CheckCircle2 className="mt-0.5 shrink-0 text-lc-green" size={18} aria-label="Complete" /> : v.failed ? <XCircle className="mt-0.5 shrink-0 text-lc-red" size={18} aria-label="Not achieved" /> : <Circle className="mt-0.5 shrink-0 text-lc-mute" size={18} aria-label="In progress" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-semibold text-lc-text">{v.def.title}</span>
                    <span className={`lc-mono rounded border px-1.5 text-[10px] tracking-wider ${v.def.primary ? "border-lc-cyan/50 text-lc-cyan" : "border-lc-line2 text-lc-mute"}`}>{v.def.primary ? "PRIMARY" : "SECONDARY"}</span>
                    <span className="lc-mono text-[11px] text-lc-mute">{v.def.points} pts</span>
                  </div>
                  <p className="mt-1 text-[13px] text-lc-dim">{v.def.description}</p>
                  <div className="mt-2.5">
                    <Meter value={v.progress} max={1} level={v.completed ? "nominal" : v.failed ? "critical" : "caution"} label={`${v.def.title} progress`} />
                  </div>
                  <div className="lc-mono mt-1.5 flex flex-wrap justify-between gap-2 text-[11.5px] text-lc-mute">
                    <span>{v.current}</span>
                    <span>
                      {v.completed ? `Completed ${met(s.objectives[v.def.id].completedHour ?? s.hour)}` : v.failed ? "Not achieved" : v.evaluatedAtEnd ? "Evaluated at mission end" : "In progress"}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
