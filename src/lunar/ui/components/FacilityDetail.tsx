import { Power, Wrench, X, Hammer } from "lucide-react";
import { jobSpec } from "../../engine/actions";
import { CONFIG, CATEGORY_LABELS } from "../../engine/config";
import { facilityName, modSum } from "../../engine/mutators";
import type { FacilityId, GameState } from "../../engine/types";
import { FACILITY_INFO } from "../../science/content";
import type { MissionApi } from "../../state/useMission";
import { num } from "../format";
import { facilityLevel, facilityStatus } from "../selectors";
import { Meter } from "./Meter";
import { SourceLinks } from "./Sources";
import { StatusBadge } from "./Status";

function outputLine(s: GameState, id: FacilityId): { produces: string; consumes: string } {
  const f = s.facilities[id];
  switch (id) {
    case "power":
      return { produces: `${num(s.power.solarKw, 1)} kW solar now (capacity ${CONFIG.solarCapacityKw} kW)`, consumes: `${CONFIG.powerOverheadKw} kW overhead · dust ${Math.round(f.dust)}%` };
    case "oxygen":
      return { produces: `${num(s.rates.oxygen.production, 3)} kg O₂/h`, consumes: `${num(s.rates.oxygen.production * CONFIG.waterPerKgO2, 3)} kg water/h · ${num(f.drawKw, 1)} kW` };
    case "water":
      return { produces: `${num(s.rates.water.production, 2)} kg water/h recovered`, consumes: `${num(f.drawKw, 1)} kW · wastewater buffer ${num(s.wastewater, 1)} kg` };
    case "food":
      return { produces: `${num(s.rates.food.production * 24, 2)} kg food/day`, consumes: `${num(f.drawKw, 1)} kW · ≈${num(CONFIG.hydroWaterPerHour * Math.min(1, f.efficiency) * 24, 1)} kg water/day` };
    case "lab":
      return { produces: `${num(s.science.points, 1)} research points to date`, consumes: `${num(f.drawKw, 1)} kW · science kits` };
    case "comms":
      return { produces: `Link quality ${Math.round(s.science.linkQuality * 100)}% · ${num(Math.max(0, s.science.dataMb - s.science.downlinkedMb), 0)} MB queued`, consumes: `${num(f.drawKw, 1)} kW · dust ${Math.round(f.dust)}%` };
    case "habitat":
      return { produces: `${num(s.habitat.pressure, 1)} kPa · ${num(s.habitat.temperature, 1)} °C · CO₂ ${num(s.habitat.co2, 1)} mmHg`, consumes: `${num(f.drawKw, 1)} kW` };
    case "storage":
      return { produces: "Temperature-controlled storage for food, spares and kits", consumes: `${num(f.drawKw, 1)} kW` };
  }
}

export function FacilityDetail({ s, id, api, onClose }: { s: GameState; id: FacilityId; api: MissionApi; onClose?: () => void }) {
  const f = s.facilities[id];
  const info = FACILITY_INFO[id];
  const level = facilityLevel(s, id);
  const st = facilityStatus(s, id);
  const out = outputLine(s, id);
  const service = jobSpec(s, id, "service");
  const repair = jobSpec(s, id, "repair");
  const jobs = s.jobs.filter((j) => j.facility === id);
  const demand = id === "power" ? 0 : CONFIG.demandKw[id] + modSum(s, "extraDemand", id);
  const mods = s.modifiers.filter((m) => m.target === id);
  const ended = s.status === "ended";

  return (
    <div className="lc-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="lc-label">{CATEGORY_LABELS[CONFIG.categoryOf[id]]}</div>
          <h3 className="mt-0.5 font-display text-[19px] font-semibold text-lc-text">{facilityName(id)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge level={level} label={st.toUpperCase()} />
          {onClose && (
            <button type="button" className="lc-btn !min-h-8 !px-2" onClick={onClose} aria-label="Close facility details">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-lc-dim">{info.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <dt className="lc-label flex justify-between">
            <span>Condition</span>
            <span className="lc-mono normal-case tracking-normal text-lc-text">{Math.round(f.condition)}%</span>
          </dt>
          <dd className="mt-1.5">
            <Meter value={f.condition} max={100} level={f.condition < 30 ? "critical" : f.condition < 50 ? "warning" : f.condition < 70 ? "caution" : "nominal"} label={`${facilityName(id)} condition`} thresholds={[{ at: CONFIG.repairThreshold, label: "Repair threshold" }, { at: 60, label: "Full output above 60%" }]} />
          </dd>
        </div>
        <div>
          <dt className="lc-label">Power</dt>
          <dd className="lc-mono mt-1 text-[13px] text-lc-text">{id === "power" ? `${num(s.power.solarKw, 1)} kW out` : `${num(f.drawKw, 1)} / ${num(demand, 1)} kW`}</dd>
        </div>
        <div>
          <dt className="lc-label">Effective output</dt>
          <dd className="lc-mono mt-1 text-[13px] text-lc-text">{Math.round(f.efficiency * 100)}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="lc-label">Production</dt>
          <dd className="mt-1 text-[13px] text-lc-text">{out.produces}</dd>
        </div>
        <div className="col-span-2">
          <dt className="lc-label">Consumption</dt>
          <dd className="mt-1 text-[13px] text-lc-text">{out.consumes}</dd>
        </div>
        <div className="col-span-2">
          <dt className="lc-label">Maintenance status</dt>
          <dd className="mt-1 text-[13px] text-lc-text">
            {jobs.length > 0
              ? jobs.map((j) => (
                  <div key={j.id}>
                    {j.label}: {num(j.laborDone, 1)} / {j.laborTotal} crew-hours{j.takesOffline ? " (offline)" : ""}
                  </div>
                ))
              : f.failed
                ? "FAILED — repair required."
                : f.condition < 60
                  ? "Service recommended: output is reduced below 60% condition."
                  : "No work scheduled."}
          </dd>
        </div>
        {mods.length > 0 && (
          <div className="col-span-2">
            <dt className="lc-label">Active effects</dt>
            <dd className="mt-1 space-y-0.5 text-[12.5px] text-lc-dim">
              {mods.map((m) => (
                <div key={m.id}>
                  {m.label}
                  {m.hoursRemaining !== null ? ` · ${m.hoursRemaining} h left` : " · until resolved"}
                </div>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="lc-btn" disabled={!service.ok || ended} title={service.reason} onClick={() => api.dispatch({ type: "startJob", facility: id, kind: "service" })}>
          <Wrench size={14} aria-hidden /> Service · {service.parts} part · {service.labor} h
        </button>
        <button type="button" className={`lc-btn ${f.failed ? "lc-btn-primary" : ""}`} disabled={!repair.ok || ended} title={repair.reason} onClick={() => api.dispatch({ type: "startJob", facility: id, kind: "repair" })}>
          <Hammer size={14} aria-hidden /> Repair · {repair.parts} parts · {repair.labor} h
        </button>
        {id !== "power" && (
          <button type="button" className="lc-btn" disabled={ended} onClick={() => api.dispatch({ type: "toggleFacility", facility: id })} aria-pressed={f.enabled}>
            <Power size={14} aria-hidden /> {f.enabled ? "Power down" : "Power up"}
          </button>
        )}
      </div>
      {(!service.ok || !repair.ok) && (
        <p className="mt-2 text-[11.5px] text-lc-mute">
          {!repair.ok && repair.reason && <span className="block">Repair: {repair.reason}</span>}
          {!service.ok && service.reason && <span className="block">Service: {service.reason}</span>}
        </p>
      )}
      <p className="mt-2 text-[11.5px] text-lc-mute">Jobs are worked by crew assigned to <em>Maintenance &amp; EVA</em> during their shift.</p>

      <div className="mt-5 rounded-lg border border-lc-line bg-[#0b1322] p-3">
        <div className="lc-label">The science</div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-lc-dim">{info.science}</p>
        <SourceLinks ids={info.sourceIds} />
      </div>
    </div>
  );
}
