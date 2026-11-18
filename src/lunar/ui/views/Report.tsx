import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { evaluateMission, type Metric } from "../../engine/evaluation";
import { getScenario } from "../../engine/scenarios";
import { Panel } from "../components/Panel";
import { SeverityBadge, StatusBadge } from "../components/Status";
import { met } from "../format";
import type { ViewProps } from "./types";

function MetricList({ items }: { items: Metric[] }) {
  return (
    <dl className="space-y-2.5">
      {items.map((m) => (
        <div key={m.label} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-lc-line pb-2 last:border-0">
          <dt className="text-[13px] text-lc-dim">{m.label}</dt>
          <dd className="lc-mono text-[13.5px] text-lc-text">{m.value}</dd>
          {m.note && <dd className="w-full text-[11.5px] text-lc-mute">{m.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function Report({ s, onNewMission }: ViewProps & { onNewMission: () => void }) {
  const e = evaluateMission(s);
  const sc = getScenario(s.scenarioId);
  const lvl = e.outcome === "accomplished" ? "nominal" : e.outcome === "limited" ? "caution" : "critical";
  return (
    <div className="space-y-4">
      <section className="lc-panel lc-grid-bg p-5 sm:p-7">
        <div className="lc-label">Mission report · {sc.codename} · {sc.name}</div>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-[-0.02em] text-lc-text">{e.headline}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusBadge level={lvl} label={e.outcome.toUpperCase()} size="md" />
          <span className="lc-mono text-[13px] text-lc-dim">
            Duration {(e.durationHours / 24).toFixed(1)} / {e.plannedHours / 24} days · {e.points.earned} / {e.points.possible} objective points
          </span>
        </div>
        <h2 className="mt-5 font-display text-[15px] font-semibold text-lc-text">Why this outcome</h2>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-lc-dim">
          {e.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="text-lc-cyan">›</span>
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="lc-btn lc-btn-primary" onClick={onNewMission}>
            <RotateCcw size={14} aria-hidden /> Start a new mission
          </button>
          <button type="button" className="lc-btn" onClick={() => window.print()}>
            Print report
          </button>
        </div>
        {s.endReason && <p className="mt-3 text-[12px] text-lc-mute">End condition: {s.endReason}</p>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Objectives">
          <ul className="space-y-2">
            {e.objectives.map((o) => (
              <li key={o.title} className="flex items-start gap-2.5 text-[13.5px]">
                {o.completed ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-lc-green" aria-label="Completed" /> : <XCircle size={17} className="mt-0.5 shrink-0 text-lc-red" aria-label="Not completed" />}
                <span className="flex-1 text-lc-text">
                  {o.title} <span className="lc-mono text-[10.5px] text-lc-mute">{o.primary ? "PRIMARY" : "SECONDARY"}</span>
                </span>
                <span className="lc-mono text-[12px] text-lc-dim">
                  {o.earned}/{o.points}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Resource efficiency">
          <MetricList items={e.resourceEfficiency} />
        </Panel>
        <Panel title="System reliability">
          <MetricList items={e.reliability} />
        </Panel>
        <Panel title="Crew safety">
          <MetricList items={e.safety} />
        </Panel>
        <Panel title="Decisions made" eyebrow={`${e.decisions.length} decisions`}>
          {e.decisions.length === 0 ? (
            <p className="text-[13px] text-lc-dim">No event decisions were recorded.</p>
          ) : (
            <ul className="space-y-2">
              {e.decisions.map((d) => (
                <li key={`${d.defId}-${d.hour}`} className="text-[13px]">
                  <div className="text-lc-text">{d.title}</div>
                  <div className="text-[12px] text-lc-dim">
                    {met(d.hour)} → {d.optionLabel}
                    {d.auto ? " (automatic — deadline passed)" : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Major events">
          {e.majorEvents.length === 0 ? (
            <p className="text-[13px] text-lc-dim">No warning-level events occurred.</p>
          ) : (
            <ul className="space-y-2">
              {e.majorEvents.map((d) => (
                <li key={`${d.defId}-${d.hour}`} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="text-lc-text">
                    {d.title} <span className="lc-mono text-[11px] text-lc-mute">{met(d.hour)}</span>
                  </span>
                  <SeverityBadge severity={d.severity} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <p className="text-[12px] text-lc-mute">The evaluation is rule-based and fully explained above; objective points are reported for comparison, not as the sole measure of success. All values are simulated.</p>
    </div>
  );
}
