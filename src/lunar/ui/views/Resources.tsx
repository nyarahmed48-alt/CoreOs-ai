import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { RESOURCES } from "../../engine/config";
import { RESOURCE_IDS, type ResourceId } from "../../engine/types";
import { LineChart } from "../components/LineChart";
import { Meter } from "../components/Meter";
import { Panel, SimNote } from "../components/Panel";
import { StatusBadge } from "../components/Status";
import { duration, met, num, signed } from "../format";
import { hoursRemaining, netRate, resourceCapacity, resourceLevel } from "../selectors";
import type { ViewProps } from "./types";

const NOTES: Record<ResourceId, string> = {
  oxygen: "Produced by electrolysis of water; consumed by crew metabolism and to replace cabin leakage.",
  water: "Consumed by crew and electrolysis; most is recovered from wastewater by the recycler.",
  food: "Mostly stored food; hydroponics adds a small fresh supplement. Spoils if storage loses thermal control.",
  energy: "Battery charge. Solar surplus charges it; shortfalls draw it down.",
  spares: "Consumed by service and repair jobs and some event responses.",
  sciSupplies: "Consumed by laboratory research.",
};

export function Trend({ value }: { value: number }) {
  if (value > 1e-4) return <TrendingUp size={15} className="text-lc-green" aria-label="Rising" />;
  if (value < -1e-4) return <TrendingDown size={15} className="text-lc-amber" aria-label="Falling" />;
  return <Minus size={15} className="text-lc-mute" aria-label="Stable" />;
}

export function ResourceCard({ s, id }: { s: ViewProps["s"]; id: ResourceId }) {
  const spec = RESOURCES[id];
  const lvl = resourceLevel(s, id);
  const r = s.rates[id];
  const n = netRate(s, id);
  const cap = resourceCapacity(id);
  return (
    <div className="lc-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="lc-label">{spec.label}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="lc-mono text-[26px] text-lc-text">{num(s.resources[id], spec.decimals)}</span>
            <span className="lc-mono text-[12px] text-lc-mute">
              / {cap} {spec.unit}
            </span>
          </div>
        </div>
        <StatusBadge level={lvl} />
      </div>
      <div className="mt-3">
        <Meter value={s.resources[id]} max={cap} level={lvl} label={`${spec.label}: ${num(s.resources[id], spec.decimals)} of ${cap} ${spec.unit}`} thresholds={[{ at: spec.caution, label: "Caution" }, { at: spec.warning, label: "Warning" }]} />
      </div>
      <dl className="lc-mono mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-lc-mute">Production</dt>
        <dd className="text-right text-lc-text">+{num(r.production, 3)} /h</dd>
        <dt className="text-lc-mute">Consumption</dt>
        <dd className="text-right text-lc-text">−{num(r.consumption, 3)} /h</dd>
        <dt className="text-lc-mute">Net trend</dt>
        <dd className="flex items-center justify-end gap-1 text-right text-lc-text">
          <Trend value={n} /> {signed(n, 3)} /h
        </dd>
        <dt className="text-lc-mute">Warning at</dt>
        <dd className="text-right text-lc-text">
          ≤ {spec.warning} {spec.unit}
        </dd>
        <dt className="text-lc-mute">Time to empty</dt>
        <dd className="text-right text-lc-text">{duration(hoursRemaining(s, id))}</dd>
      </dl>
      <p className="mt-3 text-[12px] leading-snug text-lc-dim">{NOTES[id]}</p>
    </div>
  );
}

export function Resources({ s }: ViewProps) {
  const pts = (k: "oxygen" | "water" | "food" | "energy") => s.history.map((h) => ({ x: h.h, y: h[k] }));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {RESOURCE_IDS.map((id) => (
          <ResourceCard key={id} s={s} id={id} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(["oxygen", "water", "food", "energy"] as const).map((k) => (
          <Panel key={k} title={`${RESOURCES[k].label} history`} eyebrow={RESOURCES[k].unit}>
            <LineChart
              title={`${RESOURCES[k].label} history`}
              unit={RESOURCES[k].unit}
              series={[{ key: k, label: RESOURCES[k].label, color: "#1f9fb8", points: pts(k) }]}
              thresholds={[{ y: RESOURCES[k].warning, label: "Warning", level: "warning" }]}
              xLabel={met}
              yMax={resourceCapacity(k)}
              yMin={0}
              area
            />
          </Panel>
        ))}
      </div>
      <SimNote>All quantities, rates and capacities are simulated estimates. Resource change each hour = production − consumption, limited to [0, capacity].</SimNote>
    </div>
  );
}
