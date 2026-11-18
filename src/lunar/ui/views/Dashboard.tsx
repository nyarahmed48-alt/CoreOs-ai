import { ArrowRight, Radio, Users, Zap, Building2, Wind, Droplets, Wheat, Gauge, CheckSquare, Square } from "lucide-react";
import type { ReactNode } from "react";
import { CONFIG, RESOURCES } from "../../engine/config";
import { pendingEventDef } from "../../engine/actions";
import { getScenario } from "../../engine/scenarios";
import type { ResourceId, StatusLevel } from "../../engine/types";
import { BaseMap } from "../components/BaseMap";
import { Meter } from "../components/Meter";
import { Panel, SimNote } from "../components/Panel";
import { SEVERITY_LEVEL, StatusBadge, StatusIcon } from "../components/Status";
import { duration, met, num, signed } from "../format";
import { baseLevel, commsLevel, crewLevel, hoursRemaining, missionLevel, netRate, powerLevel, resourceLevel } from "../selectors";
import { objectiveView } from "../../engine/objectives";
import type { ViewProps } from "./types";

function Tile({ icon, label, level, value, sub, children, onClick }: { icon: ReactNode; label: string; level: StatusLevel; value: ReactNode; sub?: ReactNode; children?: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="lc-panel group flex min-w-0 flex-col p-3.5 text-left transition-colors hover:border-lc-line2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-lc-mute">
          {icon}
          <span className="lc-label">{label}</span>
        </span>
        <StatusIcon level={level} />
      </div>
      <div className="lc-mono mt-2 truncate text-[19px] text-lc-text">{value}</div>
      {sub && <div className="mt-0.5 truncate text-[11.5px] text-lc-dim">{sub}</div>}
      {children && <div className="mt-2">{children}</div>}
      <span className="sr-only">Status {level}. Open details.</span>
    </button>
  );
}

function ResTile({ s, id, icon, go }: { s: ViewProps["s"]; id: ResourceId; icon: ReactNode; go: () => void }) {
  const spec = RESOURCES[id];
  const lvl = resourceLevel(s, id);
  const cap = id === "energy" ? CONFIG.batteryCapacityKwh : spec.capacity;
  return (
    <Tile icon={icon} label={spec.label} level={lvl} value={<>{num(s.resources[id], spec.decimals)} <span className="text-[12px] text-lc-mute">{spec.unit}</span></>} sub={`${signed(netRate(s, id), 2)} ${spec.unit}/h · ${duration(hoursRemaining(s, id))}`} onClick={go}>
      <Meter value={s.resources[id]} max={cap} level={lvl} label={`${spec.label} reserve`} thresholds={[{ at: spec.warning, label: "Warning" }]} />
    </Tile>
  );
}

const TUTORIAL_STEPS: { id: string; text: string; done: (p: ViewProps["s"]) => boolean }[] = [
  { id: "facility", text: "Open the Base view and select a facility to inspect it.", done: (s) => s.tutorialSteps.includes("facility") },
  { id: "advance", text: "Advance the clock: press ▶ Run, or +1 h.", done: (s) => s.hour >= 1 },
  { id: "decide", text: "Respond to your first event (dust on the arrays).", done: (s) => s.eventHistory.some((e) => e.optionId && !e.auto) },
  { id: "repair", text: "Queue a repair on the storage module (Base → Storage → Repair).", done: (s) => s.jobs.some((j) => j.facility === "storage") || s.stats.repairsCompleted > 0 },
  { id: "power", text: "Visit Power and adjust a priority or the battery reserve.", done: (s) => s.tutorialSteps.includes("power") },
  { id: "crew", text: "Reassign a crew member on the Crew page (e.g. send someone to rest).", done: (s) => s.tutorialSteps.includes("crew") },
];

export function Dashboard({ s, api, go }: ViewProps) {
  const sc = getScenario(s.scenarioId);
  const ev = pendingEventDef(s);
  const lvl = missionLevel(s);
  const recent = [...s.timeline].reverse().slice(0, 9);
  const avgWell = s.crew.reduce((a, c) => a + c.wellbeing, 0) / s.crew.length;
  const opsOk = (["habitat", "power", "oxygen", "water", "food", "lab", "comms", "storage"] as const).filter((f) => !s.facilities[f].failed && s.facilities[f].enabled).length;

  return (
    <div className="space-y-4">
      {ev && (
        <div className="lc-panel flex flex-wrap items-center justify-between gap-3 border-lc-amber/50 p-4" role="alert">
          <div className="flex min-w-0 items-center gap-3">
            <StatusIcon level={SEVERITY_LEVEL[ev.severity]} size={20} />
            <div className="min-w-0">
              <div className="lc-label !text-lc-amber">Decision required</div>
              <div className="truncate font-display text-[15px] font-semibold">{ev.title}</div>
            </div>
          </div>
          <button type="button" className="lc-btn lc-btn-primary" onClick={() => go("events")}>
            Review options <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 min-[1800px]:grid-cols-8">
        <Tile icon={<Gauge size={13} aria-hidden />} label="Mission" level={lvl} value={<StatusBadge level={lvl} />} sub={`${sc.codename} · ${met(s.hour)} of ${sc.durationHours / 24} d`} onClick={() => go("objectives")}>
          <Meter value={s.hour} max={sc.durationHours} level="nominal" label="Mission progress" />
        </Tile>
        <Tile icon={<Building2 size={13} aria-hidden />} label="Base" level={baseLevel(s)} value={`${opsOk}/8 online`} sub={`${s.jobs.length} job${s.jobs.length === 1 ? "" : "s"} queued`} onClick={() => go("base")} />
        <Tile icon={<Users size={13} aria-hidden />} label="Crew" level={crewLevel(s)} value={`${Math.round(avgWell)}/100`} sub="Avg. wellbeing (gameplay)" onClick={() => go("crew")} />
        <Tile icon={<Zap size={13} aria-hidden />} label="Power" level={powerLevel(s)} value={<>{num(s.power.solarKw, 1)}<span className="text-[12px] text-lc-mute"> / {num(s.power.demandKw, 1)} kW</span></>} sub={s.power.deficitKw > 0.05 ? `Shortfall ${num(s.power.deficitKw, 1)} kW` : `Solar / demand · illum. ${Math.round(s.power.illumination * 100)}%`} onClick={() => go("power")} />
        <ResTile s={s} id="oxygen" icon={<Wind size={13} aria-hidden />} go={() => go("lifesupport")} />
        <ResTile s={s} id="water" icon={<Droplets size={13} aria-hidden />} go={() => go("foodwater")} />
        <ResTile s={s} id="food" icon={<Wheat size={13} aria-hidden />} go={() => go("foodwater")} />
        <Tile icon={<Radio size={13} aria-hidden />} label="Comms" level={commsLevel(s)} value={s.science.linkQuality < CONFIG.linkDownThreshold ? "LINK DOWN" : `${Math.round(s.science.linkQuality * 100)}% link`} sub={`${num(Math.max(0, s.science.dataMb - s.science.downlinkedMb), 0)} MB queued`} onClick={() => go("base", "comms")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Ridge Station — live schematic" eyebrow="Select a facility for details" bodyClass="p-2 sm:p-3">
          <BaseMap s={s} onSelect={(f) => go("base", f)} />
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pb-1 pt-2 text-[11.5px] text-lc-mute" aria-label="Schematic legend">
            {(["nominal", "caution", "warning", "critical"] as const).map((l) => (
              <li key={l} className="flex items-center gap-1.5">
                <StatusIcon level={l} size={13} />
                {l}
              </li>
            ))}
            <li>Dashed lines: power feeds (animated when powered)</li>
          </ul>
        </Panel>

        <div className="space-y-4">
          {sc.guided && (
            <Panel title="Commander training" eyebrow="Tutorial checklist">
              <ul className="space-y-2">
                {TUTORIAL_STEPS.map((t) => {
                  const done = t.done(s);
                  return (
                    <li key={t.id} className={`flex gap-2 text-[13px] ${done ? "text-lc-mute line-through" : "text-lc-dim"}`}>
                      {done ? <CheckSquare size={16} className="mt-0.5 shrink-0 text-lc-green" aria-label="Done" /> : <Square size={16} className="mt-0.5 shrink-0" aria-label="To do" />}
                      {t.text}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
          <Panel title="Mission activity" eyebrow="Latest events and decisions" actions={<button type="button" className="lc-btn !min-h-8 text-[12px]" onClick={() => go("timeline")}>Full timeline</button>}>
            <ol className="space-y-2.5" aria-live="polite">
              {recent.map((t) => (
                <li key={t.id} className="flex gap-2.5">
                  <span className="mt-0.5">
                    <StatusIcon level={SEVERITY_LEVEL[t.severity]} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] leading-snug text-lc-text">{t.title}</div>
                    <div className="lc-mono text-[10.5px] text-lc-mute">
                      {met(t.hour)} · {t.kind.toUpperCase()}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Objectives" eyebrow={`${Object.values(s.objectives).filter((o) => o.completed).length} of ${sc.objectives.length} complete`} actions={<button type="button" className="lc-btn !min-h-8 text-[12px]" onClick={() => go("objectives")}>Details</button>}>
            <ul className="space-y-2.5">
              {sc.objectives.slice(0, 4).map((o) => {
                const v = objectiveView(s, o);
                return (
                  <li key={o.id}>
                    <div className="flex justify-between gap-2 text-[12.5px]">
                      <span className={v.completed ? "text-lc-green" : "text-lc-dim"}>
                        {v.completed ? "✓ " : ""}
                        {o.title}
                      </span>
                    </div>
                    <div className="mt-1">
                      <Meter value={v.progress} max={1} level={v.completed ? "nominal" : "caution"} label={o.title} height={4} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
      <SimNote />
    </div>
  );
}
