import { getEventDef } from "../../engine/events";
import { EventDecision } from "../components/EventDecision";
import { Panel } from "../components/Panel";
import { SeverityBadge } from "../components/Status";
import { met } from "../format";
import type { ViewProps } from "./types";

export function Events({ s, api }: ViewProps) {
  const history = [...s.eventHistory].reverse();
  return (
    <div className="space-y-4">
      <Panel title="Active event" eyebrow="Decisions change the simulation">
        {s.pendingEvent ? (
          <EventDecision s={s} api={api} />
        ) : (
          <p className="text-[13.5px] text-lc-dim">
            No event is awaiting a decision. Events arise from the environment, equipment and logistics as the mission runs. When one appears, the clock pauses (you can change that in Settings).
          </p>
        )}
      </Panel>
      <Panel title="Event log" eyebrow={`${s.eventHistory.length} event${s.eventHistory.length === 1 ? "" : "s"} this mission`}>
        {history.length === 0 ? (
          <p className="text-[13px] text-lc-dim">No events yet.</p>
        ) : (
          <div className="lc-scroll overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="lc-label">
                <tr>
                  <th className="py-2 pr-3 font-normal">Time</th>
                  <th className="py-2 pr-3 font-normal">Event</th>
                  <th className="py-2 pr-3 font-normal">Severity</th>
                  <th className="py-2 font-normal">Decision</th>
                </tr>
              </thead>
              <tbody>
                {history.map((e) => (
                  <tr key={`${e.defId}-${e.hour}`} className="border-t border-lc-line align-top">
                    <td className="lc-mono py-2 pr-3 text-[12px] text-lc-mute">{met(e.hour)}</td>
                    <td className="py-2 pr-3 text-lc-text">
                      {e.title}
                      <div className="text-[11.5px] text-lc-mute">{getEventDef(e.defId)?.affected.join(", ")}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <SeverityBadge severity={e.severity} />
                    </td>
                    <td className="py-2 text-lc-dim">
                      {e.optionLabel ? (
                        <>
                          {e.optionLabel}
                          {e.auto && <span className="block text-[11px] text-lc-amber">Applied automatically (deadline passed)</span>}
                        </>
                      ) : (
                        <span className="text-lc-amber">Awaiting decision</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
