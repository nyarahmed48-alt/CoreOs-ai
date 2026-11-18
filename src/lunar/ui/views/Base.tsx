import { useEffect } from "react";
import { facilityName } from "../../engine/mutators";
import { FACILITY_IDS, type FacilityId } from "../../engine/types";
import { BaseMap } from "../components/BaseMap";
import { FacilityDetail } from "../components/FacilityDetail";
import { Panel, SimNote } from "../components/Panel";
import { StatusIcon } from "../components/Status";
import { facilityLevel, facilityStatus } from "../selectors";
import type { ViewProps } from "./types";

export function Base({ s, api, selected, setSelected }: ViewProps & { selected: FacilityId | null; setSelected: (f: FacilityId | null) => void }) {
  useEffect(() => {
    if (selected && !s.tutorialSteps.includes("facility")) api.dispatch({ type: "tutorialStep", step: "facility" });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
      <div className="space-y-4">
        <Panel title="Lunar base overview" eyebrow="Interactive schematic — original illustration" bodyClass="p-2 sm:p-3">
          <BaseMap s={s} selected={selected} onSelect={setSelected} />
        </Panel>
        <Panel title="All facilities" bodyClass="p-2">
          <ul className="grid gap-1 sm:grid-cols-2">
            {FACILITY_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setSelected(id)}
                  aria-pressed={selected === id}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-[#0f1a2e] ${selected === id ? "bg-[#0f1a2e] ring-1 ring-lc-cyan/50" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <StatusIcon level={facilityLevel(s, id)} />
                    {facilityName(id)}
                  </span>
                  <span className="lc-mono text-[11px] text-lc-mute">
                    {facilityStatus(s, id).toUpperCase()} · {Math.round(s.facilities[id].condition)}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="xl:sticky xl:top-4 xl:self-start">
        <Panel>
          {selected ? (
            <FacilityDetail s={s} id={selected} api={api} onClose={() => setSelected(null)} />
          ) : (
            <div className="py-10 text-center text-[13.5px] text-lc-dim">
              Select a facility on the schematic or in the list to see its condition, power use, output, maintenance options and the science behind it.
            </div>
          )}
        </Panel>
        <SimNote />
      </div>
    </div>
  );
}
