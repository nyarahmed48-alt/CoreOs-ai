/**
 * A simple rule-based "competent commander" used by tests to prove that each
 * scenario is achievable with sensible play (and to catch balance regressions).
 */
import { applyAction, jobSpec, type Action } from "../actions";
import { RESOURCES, CONFIG } from "../config";
import { getEventDef } from "../events";
import { illuminationAt } from "../illumination";
import { getScenario } from "../scenarios";
import { isSleepHour } from "../step";
import type { FacilityId, GameState } from "../types";

const PREFS: Record<string, string[]> = {
  "terrain-shadow": ["shed", "ride"],
  "terrain-shadow-forecast": ["precharge", "proceed"],
  "wrs-filter": ["replace", "defer"],
  dust: ["eva-clean", "accept"],
  "comms-interference": ["low-rate", "wait"],
  "storage-thermal": ["repair-now", "relocate"],
  "experiment-power": ["reduced", "decline"],
  "resupply-delay": ["boost-hydro", "accept"],
  "cargo-slot": ["spares"],
  "oga-maintenance": ["now", "defer"],
  spe: ["shelter"],
  "hab-leak": ["patch", "makeup"],
  "co2-bed": ["canisters", "bakeout"],
  "hydro-pump": ["repair", "manual"],
};

function act(s: GameState, a: Action): GameState {
  return applyAction(s, a).state;
}

export function commanderTurn(input: GameState): GameState {
  let s = input;
  const sc = getScenario(s.scenarioId);

  if (s.pendingEvent) {
    const def = getEventDef(s.pendingEvent.defId)!;
    for (const id of PREFS[def.id] ?? [def.defaultOption]) {
      const r = applyAction(s, { type: "resolveEvent", optionId: id });
      if (!r.error) {
        s = r.state;
        break;
      }
    }
    if (s.pendingEvent) s = act(s, { type: "resolveEvent", optionId: def.defaultOption });
  }

  // Maintenance: repairs first, then services on the most worn critical systems.
  const order: FacilityId[] = ["habitat", "power", "oxygen", "water", "storage", "food", "comms", "lab"];
  for (const f of order) {
    const fac = s.facilities[f];
    if ((fac.failed || fac.condition < CONFIG.repairThreshold) && jobSpec(s, f, "repair").ok) s = act(s, { type: "startJob", facility: f, kind: "repair" });
  }
  if (s.resources.spares > 3 && s.jobs.length < 2) {
    const worn = order.filter((f) => !s.facilities[f].failed && s.facilities[f].condition < 70).sort((a, b) => s.facilities[a].condition - s.facilities[b].condition)[0];
    if (worn && jobSpec(s, worn, "service").ok) s = act(s, { type: "startJob", facility: worn, kind: "service" });
  }

  // Crew: engineer researches when the job queue is empty; anyone overloaded rests.
  for (const c of s.crew) {
    let task = c.specialty;
    if (c.specialty === "maintenance" && s.jobs.length === 0) task = "research";
    if (!isSleepHour(s.hour) && c.workload > 88) task = "rest";
    if (c.task !== task) s = act(s, { type: "assignCrew", crewId: c.id, task });
  }

  // Power management around shadows.
  const batt = s.resources.energy / CONFIG.batteryCapacityKwh;
  const now = illuminationAt(sc, s.hour);
  let minAhead = 1;
  for (let h = s.hour; h < s.hour + 10; h++) minAhead = Math.min(minAhead, illuminationAt(sc, h));
  const want = (f: FacilityId, on: boolean) => {
    if (s.facilities[f].enabled !== on) s = act(s, { type: "toggleFacility", facility: f });
  };
  const dark = now < 0.35;
  const shadowSoon = minAhead < 0.3;
  want("lab", !(dark || (shadowSoon && batt < 0.95)));
  want("food", !(dark && batt < 0.7));
  want("oxygen", !(dark && batt < 0.45 && s.resources.oxygen > RESOURCES.oxygen.warning + 2));
  return s;
}

export function playMission(scenarioId: string, seed: number, smart = true): GameState {
  let s = applyAction(createFresh(scenarioId, seed), { type: "advance", hours: 0 }).state;
  let guard = 0;
  while (s.status !== "ended" && guard++ < 2000) {
    if (smart) s = commanderTurn(s);
    s = applyAction(s, { type: "advance", hours: 1, stopOnEvent: false }).state;
  }
  return s;
}

import { createMission } from "../init";
function createFresh(id: string, seed: number) {
  return createMission(id, seed);
}
