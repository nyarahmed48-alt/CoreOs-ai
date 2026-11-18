import { CONFIG, RESOURCES } from "../../engine/config";
import { LineChart } from "../components/LineChart";
import { Panel, SimNote, Stat } from "../components/Panel";
import { SourceLinks } from "../components/Sources";
import { StatusBadge } from "../components/Status";
import { met, num, pct } from "../format";
import { facilityLevel, facilityStatus, resourceLevel } from "../selectors";
import type { ViewProps } from "./types";

function Policy({ label, desc, on, disabled, onToggle }: { label: string; desc: string; on: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-lc-line bg-[#0b1322] p-3">
      <div>
        <div className="text-[13.5px] text-lc-text">{label}</div>
        <div className="mt-0.5 text-[12px] text-lc-dim">{desc}</div>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={`lc-btn !min-h-8 w-20 ${on ? "lc-btn-primary" : ""}`} onClick={onToggle}>
        {on ? "ON" : "OFF"}
      </button>
    </div>
  );
}

export function FoodWater({ s, api, go }: ViewProps) {
  const crew = s.crew.length;
  const foodDaily = (CONFIG.foodPerCrewDay * crew * (s.policies.foodRationing ? CONFIG.rationingFoodFactor : 1));
  const waterDaily = CONFIG.waterPerCrewDay * crew * (s.policies.waterConservation ? CONFIG.conservationWaterFactor : 1);
  const recEff = s.facilities.water.efficiency;
  const ended = s.status === "ended";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Food" eyebrow="Stored food + hydroponics" actions={<StatusBadge level={resourceLevel(s, "food")} />}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Available" value={num(s.resources.food, 1)} unit="kg" hint={`≈ ${num(s.resources.food / foodDaily, 1)} days of stored use`} />
            <Stat label="Daily consumption" value={num(foodDaily, 1)} unit="kg/day" />
            <Stat label="Hydroponic output" value={num(s.rates.food.production * 24, 2)} unit="kg/day" hint={`Max ${num(CONFIG.foodGenMaxPerHour * 24, 2)}`} />
            <Stat label="Production efficiency" value={pct(Math.min(1, s.facilities.food.efficiency))} hint={facilityStatus(s, "food").toUpperCase()} />
            <Stat label="Storage capacity" value={RESOURCES.food.capacity} unit="kg" />
            <Stat label="Spoiled to date" value={num(s.stats.foodSpoiledKg, 1)} unit="kg" />
          </div>
          <Policy label="Food rationing" desc={`Cuts stored-food use by ${Math.round((1 - CONFIG.rationingFoodFactor) * 100)}%. Gradually lowers crew wellbeing while active.`} on={s.policies.foodRationing} disabled={ended} onToggle={() => api.dispatch({ type: "setPolicy", policy: "foodRationing", value: !s.policies.foodRationing })} />
          <button type="button" className="lc-btn mt-3" onClick={() => go("base", "food")}>
            Food production module · {facilityLevel(s, "food").toUpperCase()}
          </button>
        </Panel>

        <Panel title="Water" eyebrow="Closed-loop recovery" actions={<StatusBadge level={resourceLevel(s, "water")} />}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Available" value={num(s.resources.water, 0)} unit="kg" />
            <Stat label="Crew consumption" value={num(waterDaily, 1)} unit="kg/day" />
            <Stat label="Recycling efficiency" value={pct(CONFIG.wrsRecoveryFraction)} hint={`Running at ${pct(Math.min(1, recEff))} throughput`} />
            <Stat label="Recovered (last hour)" value={num(s.rates.water.production, 2)} unit="kg" />
            <Stat label="Wastewater buffer" value={num(s.wastewater, 1)} unit={`/ ${CONFIG.wastewaterTankCapacity} kg`} hint="Overflow is lost" />
            <Stat label="System condition" value={`${Math.round(s.facilities.water.condition)}%`} hint={facilityStatus(s, "water").toUpperCase()} />
          </div>
          <Policy label="Water conservation" desc={`Cuts crew water use by ${Math.round((1 - CONFIG.conservationWaterFactor) * 100)}%. Small wellbeing cost while active.`} on={s.policies.waterConservation} disabled={ended} onToggle={() => api.dispatch({ type: "setPolicy", policy: "waterConservation", value: !s.policies.waterConservation })} />
          <button type="button" className="lc-btn mt-3" onClick={() => go("base", "water")}>
            Water recovery system · {facilityLevel(s, "water").toUpperCase()}
          </button>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Food reserve" eyebrow="kg">
          <LineChart title="Food" unit="kg" series={[{ key: "food", label: "Food", color: "#1f9fb8", points: s.history.map((x) => ({ x: x.h, y: x.food })) }]} thresholds={[{ y: RESOURCES.food.warning, label: "Warning", level: "warning" }]} xLabel={met} yMin={0} area />
        </Panel>
        <Panel title="Water reserve" eyebrow="kg">
          <LineChart title="Water" unit="kg" series={[{ key: "water", label: "Water", color: "#1f9fb8", points: s.history.map((x) => ({ x: x.h, y: x.water })) }]} thresholds={[{ y: RESOURCES.water.warning, label: "Warning", level: "warning" }]} xLabel={met} yMin={0} area />
        </Panel>
      </div>

      <Panel title="Why recycling and careful consumption matter">
        <div className="grid gap-4 text-[13px] leading-relaxed text-lc-dim md:grid-cols-2">
          <div>
            <p>
              Every kilogram delivered to the Moon is expensive. A crew of four using {CONFIG.waterPerCrewDay} kg of water each per day would need {num(CONFIG.waterPerCrewDay * 4 * 30, 0)} kg a month with no recycling. At {pct(CONFIG.wrsRecoveryFraction)} recovery, the loop loses only about {num(CONFIG.waterPerCrewDay * 4 * 30 * (1 - CONFIG.wrsRecoveryFraction), 0)} kg (before oxygen generation, which also consumes water).
            </p>
            <p className="mt-2">Water also feeds the oxygen generator, so a recycler outage eventually becomes an oxygen problem. A power shortage stops the recycler; wastewater then waits in the buffer tank until power returns.</p>
            <SourceLinks ids={["iss-water-98", "bvad"]} />
          </div>
          <div>
            <p>Plants grown in space so far have supplemented, not replaced, stored food. The hydroponic module here supplies a small amount of fresh produce, needs power for its grow lights and water for its roots, and is throttled when water reserves are critical.</p>
            <SourceLinks ids={["veggie"]} />
          </div>
        </div>
      </Panel>
      <SimNote />
    </div>
  );
}
