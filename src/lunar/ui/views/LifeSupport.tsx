import { CONFIG, ENV_BANDS, co2Level, pressureLevel, temperatureLevel } from "../../engine/config";
import { modProduct } from "../../engine/mutators";
import type { StatusLevel } from "../../engine/types";
import { LineChart } from "../components/LineChart";
import { Panel, SimNote } from "../components/Panel";
import { SourceLinks } from "../components/Sources";
import { StatusBadge } from "../components/Status";
import { Term } from "../components/Term";
import { met, num } from "../format";
import { lifeSupportLevel, resourceLevel } from "../selectors";
import { ResourceCard } from "./Resources";
import type { ViewProps } from "./types";

function Metric({ label, value, unit, level, explain }: { label: React.ReactNode; value: string; unit: string; level: StatusLevel; explain: string }) {
  return (
    <div className="lc-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="lc-label">{label}</div>
        <StatusBadge level={level} />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="lc-mono text-[26px] text-lc-text">{value}</span>
        <span className="lc-mono text-[12px] text-lc-mute">{unit}</span>
      </div>
      <p className="mt-2 text-[12.5px] leading-snug text-lc-dim">{explain}</p>
    </div>
  );
}

export function LifeSupport({ s, go }: ViewProps) {
  const h = s.habitat;
  const filtration = Math.min(1, s.facilities.habitat.efficiency) * modProduct(s, "co2Removal");
  const filtLevel: StatusLevel = filtration >= 0.9 ? "nominal" : filtration >= 0.6 ? "caution" : filtration >= 0.3 ? "warning" : "critical";
  const hist = s.history;
  const b = ENV_BANDS;
  return (
    <div className="space-y-4">
      <div className="lc-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="lc-label">Environmental Control &amp; Life Support (<Term term="ECLSS" />)</div>
          <div className="mt-1 font-display text-[17px] font-semibold">Overall life-support status</div>
        </div>
        <StatusBadge level={lifeSupportLevel(s)} size="md" pulse />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label={<>Cabin pressure (<Term term="kPa" />)</>} value={num(h.pressure, 2)} unit="kPa" level={pressureLevel(h.pressure)} explain={`Held near ${CONFIG.nominalPressure} kPa by make-up gas from storage. Leaks pull it down; a powered habitat restores up to ${CONFIG.makeupKpaPerHour} kPa/h.`} />
        <Metric label="Cabin temperature" value={num(h.temperature, 1)} unit="°C" level={temperatureLevel(h.temperature)} explain="Active thermal control keeps the cabin comfortable. Without power, the habitat loses heat to its cold surroundings." />
        <Metric label={<>Carbon dioxide (<Term term="ppCO2" />)</>} value={num(h.co2, 2)} unit="mmHg" level={co2Level(h.co2)} explain="Crew exhale CO₂ continuously; sorbent beds remove it. If removal falls behind, CO₂ climbs within hours." />
        <Metric label="Air filtration / CO₂ removal capacity" value={`${Math.round(filtration * 100)}`} unit="%" level={filtLevel} explain="Share of design CO₂-removal capacity available now — reduced by low power, poor habitat condition or sorbent problems." />
        <ResourceCard s={s} id="oxygen" />
        <ResourceCard s={s} id="water" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="CO₂ partial pressure" eyebrow="mmHg">
          <LineChart title="CO₂" unit="mmHg" series={[{ key: "co2", label: "CO₂", color: "#1f9fb8", points: hist.map((x) => ({ x: x.h, y: x.co2 })) }]} thresholds={[{ y: b.co2.cautionMax, label: "Caution", level: "caution" }, { y: b.co2.warningMax, label: "Warning", level: "warning" }]} xLabel={met} yMin={0} yMax={10} decimals={2} />
        </Panel>
        <Panel title="Cabin temperature" eyebrow="°C">
          <LineChart title="Temperature" unit="°C" series={[{ key: "t", label: "Temperature", color: "#1f9fb8", points: hist.map((x) => ({ x: x.h, y: x.temperature })) }]} thresholds={[{ y: b.temperature.nominal[0], label: "Nominal min", level: "caution" }]} xLabel={met} yMin={5} yMax={30} />
        </Panel>
        <Panel title="Cabin pressure" eyebrow="kPa">
          <LineChart title="Pressure" unit="kPa" series={[{ key: "p", label: "Pressure", color: "#1f9fb8", points: hist.map((x) => ({ x: x.h, y: x.pressure })) }]} thresholds={[{ y: b.pressure.cautionMin, label: "Caution", level: "caution" }, { y: b.pressure.warningMin, label: "Warning", level: "warning" }]} xLabel={met} yMin={90} yMax={103} decimals={2} />
        </Panel>
      </div>

      <Panel title="What each system does — and what the bands mean">
        <div className="grid gap-4 text-[13px] leading-relaxed text-lc-dim md:grid-cols-2">
          <div>
            <p>
              <strong className="text-lc-text">Oxygen</strong> comes from the electrolysis assembly (Base → Oxygen generation). Each crew member uses roughly {CONFIG.o2PerCrewDay} kg per day.
            </p>
            <p className="mt-2">
              <strong className="text-lc-text">CO₂ removal and air filtration</strong> run in the habitat module. They depend on habitat power and condition.
            </p>
            <p className="mt-2">
              <strong className="text-lc-text">Water</strong> is recycled by the water recovery system and is also the feedstock for oxygen.
            </p>
            <button type="button" className="lc-btn mt-3" onClick={() => go("base", "habitat")}>
              Inspect the habitat module
            </button>
          </div>
          <div className="rounded-lg border border-lc-amber/40 bg-[#1a1308] p-3">
            <div className="lc-label !text-lc-amber">Educational simplification</div>
            <p className="mt-1.5 text-[12.5px]">
              The NOMINAL / CAUTION / WARNING / CRITICAL bands on this page are <strong>gameplay values</strong> chosen to make trade-offs visible. They are <strong>not</strong> human safety limits or engineering specifications. Real crew-environment requirements are defined in NASA-STD-3001.
            </p>
            <table className="lc-mono mt-2 w-full text-[11.5px]">
              <tbody>
                <tr><td className="pr-2 text-lc-mute">Pressure</td><td>nominal ≥ {b.pressure.nominalMin} · warning &lt; {b.pressure.cautionMin} · critical &lt; {b.pressure.warningMin} kPa</td></tr>
                <tr><td className="pr-2 text-lc-mute">Temperature</td><td>nominal {b.temperature.nominal[0]}–{b.temperature.nominal[1]} · critical outside {b.temperature.warning[0]}–{b.temperature.warning[1]} °C</td></tr>
                <tr><td className="pr-2 text-lc-mute">CO₂</td><td>nominal ≤ {b.co2.nominalMax} · critical &gt; {b.co2.warningMax} mmHg</td></tr>
              </tbody>
            </table>
            <SourceLinks ids={["nasa-std-3001", "bvad"]} />
          </div>
        </div>
      </Panel>
      <SimNote>Oxygen reserve status: {resourceLevel(s, "oxygen").toUpperCase()}. All values are simulated estimates.</SimNote>
    </div>
  );
}
