/**
 * COMMANDER ACTIONS
 *
 * `applyAction` is the single entry point for everything the player can do.
 * It never mutates its input. Invalid actions return the unchanged state and a
 * human-readable `error` so the UI can explain why nothing happened.
 */
import { CONFIG, RESOURCES } from "./config";
import { getEventDef, resolvePendingEvent } from "./events";
import { addJob, canAfford, facilityName, log } from "./mutators";
import { clone, stepHour } from "./step";
import type { CrewTask, FacilityId, GameState, Job, PowerCategory } from "./types";

export type Action =
  | { type: "advance"; hours: number; stopOnEvent?: boolean }
  | { type: "resolveEvent"; optionId: string }
  | { type: "toggleFacility"; facility: FacilityId }
  | { type: "movePriority"; category: PowerCategory; direction: -1 | 1 }
  | { type: "setBatteryFloor"; value: number }
  | { type: "assignCrew"; crewId: string; task: CrewTask }
  | { type: "startJob"; facility: FacilityId; kind: "service" | "repair" }
  | { type: "cancelJob"; jobId: string }
  | { type: "setPolicy"; policy: "waterConservation" | "foodRationing"; value: boolean }
  | { type: "tutorialStep"; step: string };

export interface ActionResult {
  state: GameState;
  error?: string;
  /** For "advance": why it stopped early, if it did. */
  stoppedBecause?: "event" | "ended";
  hoursAdvanced?: number;
}

export interface JobCheck {
  ok: boolean;
  reason?: string;
  parts: number;
  labor: number;
}

export function jobSpec(s: GameState, facility: FacilityId, kind: "service" | "repair"): JobCheck {
  const f = s.facilities[facility];
  const heavy = facility === "power" || facility === "habitat";
  const parts = kind === "repair" ? CONFIG.repair.parts + (heavy ? 1 : 0) : CONFIG.service.parts;
  const labor = kind === "repair" ? CONFIG.repair.labor : CONFIG.service.labor;
  if (s.status === "ended") return { ok: false, reason: "The mission has ended.", parts, labor };
  if (s.jobs.some((j) => j.facility === facility && (j.kind === "repair" || j.kind === "service")))
    return { ok: false, reason: "A maintenance job for this facility is already queued.", parts, labor };
  if (kind === "service") {
    if (f.failed) return { ok: false, reason: "The facility has failed — it needs a repair, not a service.", parts, labor };
    if (f.condition >= 95) return { ok: false, reason: "Condition is already above 95%.", parts, labor };
  } else {
    if (!f.failed && f.condition >= CONFIG.repairThreshold)
      return { ok: false, reason: `Repairs are for failed facilities or condition below ${CONFIG.repairThreshold}%. Use a service instead.`, parts, labor };
  }
  const afford = canAfford(s, { spares: parts });
  if (!afford.ok) return { ok: false, reason: afford.reason, parts, labor };
  return { ok: true, parts, labor };
}

export function applyAction(state: GameState, action: Action): ActionResult {
  if (state.status === "ended" && action.type !== "tutorialStep") {
    return { state, error: "The mission has ended. Start a new mission to continue." };
  }
  switch (action.type) {
    case "advance": {
      let s = state;
      const stopOnEvent = action.stopOnEvent ?? true;
      let n = 0;
      for (let i = 0; i < action.hours; i++) {
        if (s.pendingEvent && stopOnEvent && i > 0) return { state: s, stoppedBecause: "event", hoursAdvanced: n };
        const hadEvent = !!s.pendingEvent;
        s = stepHour(s);
        n++;
        if (s.status === "ended") return { state: s, stoppedBecause: "ended", hoursAdvanced: n };
        if (stopOnEvent && s.pendingEvent && !hadEvent) return { state: s, stoppedBecause: "event", hoursAdvanced: n };
      }
      return { state: s, hoursAdvanced: n };
    }

    case "resolveEvent": {
      const s = clone(state);
      const r = resolvePendingEvent(s, action.optionId, false);
      if (!r.ok) return { state, error: r.reason };
      return { state: s };
    }

    case "toggleFacility": {
      const s = clone(state);
      const f = s.facilities[action.facility];
      f.enabled = !f.enabled;
      log(s, "system", `${facilityName(action.facility)} ${f.enabled ? "powered on" : "powered down"}`, "Commander action.", f.enabled ? "advisory" : "caution");
      return { state: s };
    }

    case "movePriority": {
      const s = clone(state);
      const i = s.priorities.indexOf(action.category);
      const j = i + action.direction;
      if (i < 0 || j < 0 || j >= s.priorities.length) return { state };
      [s.priorities[i], s.priorities[j]] = [s.priorities[j], s.priorities[i]];
      return { state: s };
    }

    case "setBatteryFloor": {
      if (!Number.isFinite(action.value)) return { state, error: "Invalid reserve value." };
      const s = clone(state);
      s.batteryFloor = Math.max(0, Math.min(0.6, action.value));
      return { state: s };
    }

    case "assignCrew": {
      const s = clone(state);
      const c = s.crew.find((x) => x.id === action.crewId);
      if (!c) return { state, error: "Unknown crew member." };
      c.task = action.task;
      return { state: s };
    }

    case "startJob": {
      const check = jobSpec(state, action.facility, action.kind);
      if (!check.ok) return { state, error: check.reason };
      const s = clone(state);
      s.resources.spares -= check.parts;
      const job: Omit<Job, "id" | "laborDone" | "createdHour" | "partsSpent"> & { partsSpent: number } =
        action.kind === "repair"
          ? {
              label: `Repair ${facilityName(action.facility).toLowerCase()}`,
              kind: "repair",
              facility: action.facility,
              laborTotal: check.labor,
              takesOffline: true,
              eva: action.facility === "power" || action.facility === "comms",
              partsSpent: check.parts,
              effects: [
                {
                  type: "restoreCondition",
                  facility: action.facility,
                  amount: Math.max(0, CONFIG.repair.restoreTo - s.facilities[action.facility].condition),
                  clearFailure: true,
                },
              ],
            }
          : {
              label: `Service ${facilityName(action.facility).toLowerCase()}`,
              kind: "service",
              facility: action.facility,
              laborTotal: check.labor,
              takesOffline: false,
              eva: action.facility === "power" || action.facility === "comms",
              partsSpent: check.parts,
              effects: [{ type: "restoreCondition", facility: action.facility, amount: CONFIG.service.restore, clearFailure: false }],
            };
      addJob(s, job);
      log(s, "system", `Job queued: ${job.label}`, `${check.parts} spare part${check.parts > 1 ? "s" : ""}, ${check.labor} crew-hours.`, "advisory");
      return { state: s };
    }

    case "cancelJob": {
      const s = clone(state);
      const job = s.jobs.find((j) => j.id === action.jobId);
      if (!job) return { state, error: "Job not found." };
      s.jobs = s.jobs.filter((j) => j.id !== action.jobId);
      if (job.laborDone === 0 && job.partsSpent > 0) {
        s.resources.spares = Math.min(RESOURCES.spares.capacity, s.resources.spares + job.partsSpent);
      }
      log(s, "system", `Job cancelled: ${job.label}`, job.laborDone === 0 ? "Parts returned to stores." : "Work already started; parts were consumed.", "advisory");
      return { state: s };
    }

    case "setPolicy": {
      const s = clone(state);
      s.policies[action.policy] = action.value;
      log(s, "system", `${action.policy === "waterConservation" ? "Water conservation" : "Food rationing"} ${action.value ? "enabled" : "disabled"}`, undefined, "advisory");
      return { state: s };
    }

    case "tutorialStep": {
      if (state.tutorialSteps.includes(action.step)) return { state };
      const s = clone(state);
      s.tutorialSteps.push(action.step);
      return { state: s };
    }
  }
}

export function pendingEventDef(s: GameState) {
  return s.pendingEvent ? getEventDef(s.pendingEvent.defId) : undefined;
}
