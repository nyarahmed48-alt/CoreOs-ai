import { ArrowDown, ArrowUp, Power as PowerIcon } from "lucide-react";
import { CATEGORY_LABELS, CONFIG } from "../../engine/config";
import { forecast, sunElevationAt } from "../../engine/illumination";
import { facilityName, hasMod, modSum } from "../../engine/mutators";
import { getScenario } from "../../engine/scenarios";
import { FACILITY_IDS } from "../../engine/types";
import { LineChart } from "../components/LineChart";
import { Meter } from "../components/Meter";
import { Panel, SimNote, Stat } from "../components/Panel";
import { StatusBadge, StatusIcon } from "../components/Status";
import { Term } from "../components/Term";
import { met, num } from "../format";
import { facilityLevel, facilityStatus, powerLevel, resourceLevel } from "../selectors";
import type { ViewProps } from "./types";

export function Power({ s, api }: ViewProps) {
  const sc = getScenario(s.scenarioId);
  const p = s.power;
  const batt = s.resources.energy;
  const cap = CONFIG.batteryCapacityKwh;
  const reserveKwh = Math.max(0, batt - s.batteryFloor * cap);
  const ended = s.status === "ended";
  const fc = forecast(sc, s.hour, 72);
  const mark = () => !s.tutorialSteps.includes("power") && api.dispatch({ type: "tutorialStep", step: "power" });

  return (
    <div className="space-y-4">
      <div className="lc-panel grid grid-cols-2 gap-4 p-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Solar generation" value={num(p.solarKw, 1)} unit="kW" hint={`Capacity ${CONFIG.solarCapacityKw} kW`} />
        <Stat label={<Term term="Illumination" />} value={Math.round(p.illumination * 100)} unit="%" hint={`Sun elev. ${sunElevationAt(sc, s.hour).toFixed(1)}°`} />
        <Stat label="Total demand" value={num(p.demandKw, 1)} unit="kW" hint={`Supplied ${num(p.suppliedKw, 1)} kW`} tone={p.deficitKw > 0.05 ? "var(--color-lc-amber)" : undefined} />
        <Stat label="Battery flow" value={`${p.batteryFlowKw >= 0 ? "+" : "−"}${num(Math.abs(p.batteryFlowKw), 1)}`} unit="kW" hint={p.batteryFlowKw >= 0 ? "Charging" : "Discharging"} />
        <Stat label={<Term term="kWh">Battery charge</Term>} value={num(batt, 0)} unit={`/ ${cap} kWh`} hint={`${Math.round((batt / cap) * 100)}%`} />
        <Stat label="Available above reserve" value={num(reserveKwh, 0)} unit="kWh" hint={p.batteryFlowKw < 0 ? `≈ ${num(reserveKwh / Math.max(0.1, -p.batteryFlowKw), 0)} h at this rate` : "Not discharging"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Power priorities" eyebrow="Highest priority is served first" actions={<StatusBadge level={powerLevel(s)} />}>
          <p className="mb-3 text-[12.5px] leading-snug text-lc-dim">
            When generation plus battery cannot meet demand, power is allocated in this order. Groups that cannot be fully served run at reduced capacity — or not at all.
          </p>
          <ol className="space-y-2">
            {s.priorities.map((cat, i) => {
              const members = FACILITY_IDS.filter((f) => f !== "power" && CONFIG.categoryOf[f] === cat);
              const frac = members.length ? Math.min(...members.map((m) => (s.facilities[m].enabled ? s.facilities[m].powerFraction : 1))) : 1;
              return (
                <li key={cat} className="flex items-center gap-2 rounded-lg border border-lc-line bg-[#0b1322] px-3 py-2">
                  <span className="lc-mono w-5 text-center text-[12px] text-lc-cyan">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] text-lc-text">{CATEGORY_LABELS[cat]}</div>
                    <div className="truncate text-[11.5px] text-lc-mute">{members.map(facilityName).join(", ")}</div>
                  </div>
                  <span className="lc-mono text-[11.5px] text-lc-dim">{Math.round(frac * 100)}% served</span>
                  <button type="button" className="lc-btn !min-h-8 !px-2" disabled={i === 0 || ended} onClick={() => { api.dispatch({ type: "movePriority", category: cat, direction: -1 }); mark(); }} aria-label={`Raise priority of ${CATEGORY_LABELS[cat]}`}>
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" className="lc-btn !min-h-8 !px-2" disabled={i === s.priorities.length - 1 || ended} onClick={() => { api.dispatch({ type: "movePriority", category: cat, direction: 1 }); mark(); }} aria-label={`Lower priority of ${CATEGORY_LABELS[cat]}`}>
                    <ArrowDown size={14} />
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-4">
            <label htmlFor="lc-floor" className="flex justify-between text-[13px] text-lc-text">
              <span>
                <Term term="Battery reserve" /> for top priority only
              </span>
              <span className="lc-mono">{Math.round(s.batteryFloor * 100)}%</span>
            </label>
            <input
              id="lc-floor"
              type="range"
              min={0}
              max={60}
              step={5}
              value={Math.round(s.batteryFloor * 100)}
              disabled={ended}
              onChange={(e) => { api.dispatch({ type: "setBatteryFloor", value: Number(e.target.value) / 100 }); mark(); }}
              className="lc-range mt-2 w-full"
            />
            <div className="mt-1">
              <Meter value={batt} max={cap} level={resourceLevel(s, "energy")} label="Battery charge" thresholds={[{ at: s.batteryFloor * cap, label: "Reserve floor" }]} />
            </div>
          </div>
        </Panel>

        <Panel title="Facility power demand" eyebrow="Switch loads on or off">
          <ul className="divide-y divide-lc-line">
            {FACILITY_IDS.filter((f) => f !== "power").map((f) => {
              const fac = s.facilities[f];
              const demand = CONFIG.demandKw[f] + modSum(s, "extraDemand", f);
              const shed = hasMod(s, "loadShed", f);
              return (
                <li key={f} className="flex flex-wrap items-center gap-3 py-2.5">
                  <StatusIcon level={facilityLevel(s, f)} />
                  <div className="min-w-[140px] flex-1">
                    <div className="text-[13.5px]">{facilityName(f)}</div>
                    <div className="lc-mono text-[11px] text-lc-mute">
                      {facilityStatus(s, f).toUpperCase()}
                      {shed ? " · load-shed by event" : ""}
                    </div>
                  </div>
                  <span className="lc-mono w-28 text-right text-[12px] text-lc-dim">
                    {num(fac.drawKw, 1)} / {num(demand, 1)} kW
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fac.enabled}
                    disabled={ended}
                    onClick={() => { api.dispatch({ type: "toggleFacility", facility: f }); mark(); }}
                    className={`lc-btn !min-h-8 w-24 ${fac.enabled ? "lc-btn-primary" : ""}`}
                    aria-label={`${facilityName(f)} power`}
                  >
                    <PowerIcon size={13} aria-hidden /> {fac.enabled ? "ON" : "OFF"}
                  </button>
                </li>
              );
            })}
            <li className="flex items-center justify-between py-2.5 text-[12.5px] text-lc-mute">
              <span>Fixed overhead (array drives, avionics)</span>
              <span className="lc-mono">{CONFIG.powerOverheadKw} kW</span>
            </li>
          </ul>
          {f_warn(s.facilities.habitat.enabled)}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Illumination forecast — next 72 h" eyebrow="Predicted from terrain models">
          <LineChart title="Illumination forecast" unit="%" series={[{ key: "f", label: "Forecast illumination", color: "#1f9fb8", points: fc.map((x) => ({ x: x.h, y: x.illumination * 100 })) }]} xLabel={met} yMin={0} yMax={100} nowX={s.hour} decimals={0} area />
          <p className="mt-2 text-[12px] leading-snug text-lc-dim">
            At this polar ridge, the Sun stays within ~1.5° of the horizon. Dips are forecast terrain shadows — plan battery charge and load shedding before them. Unforecast events and dust are not shown.
          </p>
        </Panel>
        <Panel title="Generation vs. demand" eyebrow="kW, recorded each hour">
          <LineChart
            title="Generation versus demand"
            unit="kW"
            series={[
              { key: "solar", label: "Solar generation", color: "#1f9fb8", points: s.history.map((x) => ({ x: x.h, y: x.solarKw })) },
              { key: "demand", label: "Demand", color: "#8e6ae0", points: s.history.map((x) => ({ x: x.h, y: x.demandKw })), dashed: true },
            ]}
            xLabel={met}
            yMin={0}
          />
        </Panel>
      </div>
      <SimNote>Array capacity, battery size and demands are illustrative. Illumination windows are illustrative, not computed from real terrain data.</SimNote>
    </div>
  );
}

function f_warn(habitatOn: boolean) {
  if (habitatOn) return null;
  return (
    <p className="mt-3 rounded-lg border border-lc-red/50 bg-[#1f0c10] p-2.5 text-[12.5px] text-[#ffd0d2]" role="alert">
      The habitat module is powered down: cabin temperature will fall and CO₂ will rise.
    </p>
  );
}
