import { UserRound, X } from "lucide-react";
import { CONFIG, TASK_LABELS } from "../../engine/config";
import { facilityName } from "../../engine/mutators";
import { computeLabor, crewEfficiency, isSleepHour } from "../../engine/step";
import type { CrewTask } from "../../engine/types";
import { Meter } from "../components/Meter";
import { Panel, SimNote } from "../components/Panel";
import { num } from "../format";
import { crewStatusLabel, stationClock } from "../selectors";
import type { ViewProps } from "./types";

const TASKS: CrewTask[] = ["operations", "maintenance", "research", "hydroponics", "rest"];

const TASK_EFFECT: Record<CrewTask, string> = {
  operations: "Monitors systems: reduces facility wear (up to 30%).",
  maintenance: "Works the job queue: services, repairs and EVAs.",
  research: "Produces research points in the lab (uses science kits).",
  hydroponics: "Tends crops: raises food production by up to 30%.",
  rest: "Recovers workload faster. No output.",
};

export function Crew({ s, api }: ViewProps) {
  const ended = s.status === "ended";
  const sleeping = isSleepHour(s.hour);
  const labor = computeLabor(s, s.hour);
  return (
    <div className="space-y-4">
      <div className="lc-panel flex flex-wrap items-center justify-between gap-3 p-4 text-[13px] text-lc-dim">
        <div>
          <span className="lc-label">Station clock</span>
          <div className="lc-mono text-[20px] text-lc-text">{stationClock(s.hour)}</div>
        </div>
        <p className="max-w-xl">
          Crew work {String(CONFIG.sleepEndHour).padStart(2, "0")}:00–{CONFIG.sleepStartHour}:00 station time and sleep the rest. {sleeping ? "It is currently the sleep period: no tasks progress, but workload recovers." : "Shift in progress."} Assigning someone to their specialty gives a {Math.round((CONFIG.specialtyBonus - 1) * 100)}% bonus.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {s.crew.map((c) => {
          const eff = crewEfficiency(c.wellbeing, c.workload) * (c.task === c.specialty ? CONFIG.specialtyBonus : 1);
          return (
            <div key={c.id} className="lc-panel p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lc-line2 bg-[#0d1729] text-lc-cyan" aria-hidden>
                  <UserRound size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[15.5px] font-semibold text-lc-text">{c.name}</div>
                  <div className="text-[12.5px] text-lc-dim">
                    {c.role} · specialty: {TASK_LABELS[c.specialty].toLowerCase()}
                  </div>
                  <div className="lc-mono mt-1 text-[11px] text-lc-mute">{crewStatusLabel(s, c).toUpperCase()}</div>
                </div>
              </div>
              <div className="mt-3">
                <label className="lc-label" htmlFor={`task-${c.id}`}>
                  Assigned task
                </label>
                <select
                  id={`task-${c.id}`}
                  value={c.task}
                  disabled={ended}
                  onChange={(e) => {
                    api.dispatch({ type: "assignCrew", crewId: c.id, task: e.target.value as CrewTask });
                    api.dispatch({ type: "tutorialStep", step: "crew" });
                  }}
                  className="mt-1 w-full rounded-lg border border-lc-line2 bg-[#0d1626] px-3 py-2 text-[13.5px] text-lc-text"
                >
                  {TASKS.map((t) => (
                    <option key={t} value={t}>
                      {TASK_LABELS[t]}
                      {t === c.specialty ? " ★" : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11.5px] text-lc-mute">{TASK_EFFECT[c.task]}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="lc-label flex justify-between">
                    <span>Workload</span>
                    <span className="lc-mono normal-case tracking-normal text-lc-text">{Math.round(c.workload)}</span>
                  </div>
                  <div className="mt-1.5">
                    <Meter value={c.workload} max={100} level={c.workload > 90 ? "warning" : c.workload > 75 ? "caution" : "nominal"} label={`${c.name} workload`} thresholds={[{ at: 85, label: "High" }]} />
                  </div>
                </div>
                <div>
                  <div className="lc-label flex justify-between">
                    <span>Wellbeing</span>
                    <span className="lc-mono normal-case tracking-normal text-lc-text">{Math.round(c.wellbeing)}</span>
                  </div>
                  <div className="mt-1.5">
                    <Meter value={c.wellbeing} max={100} level={c.wellbeing < 40 ? "warning" : c.wellbeing < 65 ? "caution" : "nominal"} label={`${c.name} wellbeing`} />
                  </div>
                </div>
              </div>
              <div className="lc-mono mt-2 text-[11px] text-lc-mute">Task efficiency ×{eff.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Maintenance job queue" eyebrow="Worked in order by maintenance crew">
          {s.jobs.length === 0 ? (
            <p className="text-[13px] text-lc-dim">No jobs queued. Start services and repairs from the Base view.</p>
          ) : (
            <ol className="space-y-2">
              {s.jobs.map((j, i) => (
                <li key={j.id} className="rounded-lg border border-lc-line bg-[#0b1322] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13.5px] text-lc-text">
                        {i + 1}. {j.label}
                      </div>
                      <div className="lc-mono text-[11px] text-lc-mute">
                        {j.kind.toUpperCase()}
                        {j.facility ? ` · ${facilityName(j.facility)}` : ""}
                        {j.takesOffline ? " · facility offline" : ""}
                        {j.eva ? " · EVA" : ""}
                      </div>
                    </div>
                    <button type="button" className="lc-btn !min-h-8 !px-2" disabled={ended} onClick={() => api.dispatch({ type: "cancelJob", jobId: j.id })} aria-label={`Cancel ${j.label}`}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mt-2">
                    <Meter value={j.laborDone} max={j.laborTotal} label={`${j.label} progress`} />
                  </div>
                  <div className="lc-mono mt-1 text-[11px] text-lc-dim">
                    {num(j.laborDone, 1)} / {j.laborTotal} crew-hours{j.laborDone === 0 && j.partsSpent > 0 ? " · cancel now to recover parts" : ""}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {s.jobs.length > 0 && labor.maintenance === 0 && !sleeping && (
            <p className="mt-3 rounded-lg border border-lc-amber/40 bg-[#1a1308] p-2.5 text-[12.5px] text-[#ffe2bf]" role="status">
              Nobody is assigned to Maintenance &amp; EVA — queued jobs will not progress.
            </p>
          )}
        </Panel>
        <Panel title="About the crew model">
          <p className="text-[13px] leading-relaxed text-lc-dim">
            The crew are fictional. Workload and wellbeing are simple gameplay indicators: high workload, uncomfortable cabin conditions and rationing slowly lower wellbeing, which reduces task efficiency. They are not medical measures and make no claims about real human physiology.
          </p>
        </Panel>
      </div>
      <SimNote />
    </div>
  );
}
