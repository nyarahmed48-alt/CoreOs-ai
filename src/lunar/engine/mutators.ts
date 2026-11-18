/**
 * Small helpers that mutate a (cloned) GameState. Used by the step function,
 * the action reducer and event decisions. Nothing here touches React.
 */
import { CONFIG, RESOURCES } from "./config";
import type {
  FacilityId,
  GameState,
  Job,
  JobEffect,
  Modifier,
  ModifierKind,
  ResourceId,
  Severity,
  TimelineKind,
} from "./types";

export function nextId(s: GameState, prefix: string): string {
  s.nextId += 1;
  return `${prefix}-${s.nextId}`;
}

export function log(s: GameState, kind: TimelineKind, title: string, detail?: string, severity: Severity = "advisory") {
  s.timeline.push({ id: nextId(s, "tl"), hour: s.hour, kind, title, detail, severity });
  if (s.timeline.length > 500) s.timeline.splice(0, s.timeline.length - 500);
}

export function addModifier(s: GameState, m: Omit<Modifier, "id">): Modifier {
  const mod = { ...m, id: nextId(s, "mod") };
  s.modifiers.push(mod);
  return mod;
}

export function removeModifiers(s: GameState, source: string) {
  s.modifiers = s.modifiers.filter((m) => m.source !== source);
}

export function setModifierValue(s: GameState, source: string, kind: ModifierKind, value: number) {
  for (const m of s.modifiers) if (m.source === source && m.kind === kind) m.value = value;
}

export function setModifierHours(s: GameState, source: string, hours: number | null) {
  for (const m of s.modifiers) if (m.source === source) m.hoursRemaining = hours;
}

/** Product of multiplicative modifiers of a kind (optionally for a target). */
export function modProduct(s: GameState, kind: ModifierKind, target?: FacilityId): number {
  return s.modifiers
    .filter((m) => m.kind === kind && (target === undefined || m.target === target))
    .reduce((p, m) => p * m.value, 1);
}

/** Sum of additive modifiers of a kind (optionally for a target). */
export function modSum(s: GameState, kind: ModifierKind, target?: FacilityId): number {
  return s.modifiers
    .filter((m) => m.kind === kind && (target === undefined || m.target === target))
    .reduce((p, m) => p + m.value, 0);
}

export function hasMod(s: GameState, kind: ModifierKind, target?: FacilityId): boolean {
  return s.modifiers.some((m) => m.kind === kind && (target === undefined || m.target === target));
}

export function clampResource(s: GameState, id: ResourceId) {
  const cap = id === "energy" ? CONFIG.batteryCapacityKwh : RESOURCES[id].capacity;
  s.resources[id] = Math.min(cap, Math.max(0, s.resources[id]));
}

export interface Cost {
  spares?: number;
  energy?: number;
  sciSupplies?: number;
  water?: number;
  food?: number;
}

export function canAfford(s: GameState, cost: Cost | undefined): { ok: boolean; reason?: string } {
  if (!cost) return { ok: true };
  for (const [k, v] of Object.entries(cost) as [ResourceId, number][]) {
    if (v && s.resources[k] < v - 1e-9) {
      return { ok: false, reason: `Requires ${v} ${RESOURCES[k].unit} of ${RESOURCES[k].label.toLowerCase()} (have ${Math.floor(s.resources[k] * 10) / 10}).` };
    }
  }
  return { ok: true };
}

export function spend(s: GameState, cost: Cost | undefined): boolean {
  if (!canAfford(s, cost).ok) return false;
  if (!cost) return true;
  for (const [k, v] of Object.entries(cost) as [ResourceId, number][]) {
    if (v) {
      s.resources[k] -= v;
      clampResource(s, k);
    }
  }
  return true;
}

export function damage(s: GameState, facility: FacilityId, amount: number) {
  const f = s.facilities[facility];
  f.condition = Math.max(0, f.condition - amount);
  if (f.condition <= 0 && !f.failed) failFacility(s, facility, "Condition reached zero.");
}

export function failFacility(s: GameState, facility: FacilityId, why: string) {
  const f = s.facilities[facility];
  if (f.failed) return;
  f.failed = true;
  s.stats.failures += 1;
  log(s, "failure", `${facilityName(facility)} failure`, `${why} Output has stopped until a repair is completed.`, "critical");
}

export function addJob(s: GameState, job: Omit<Job, "id" | "laborDone" | "createdHour" | "partsSpent"> & { partsSpent?: number }): Job {
  const j: Job = { ...job, id: nextId(s, "job"), laborDone: 0, createdHour: s.hour, partsSpent: job.partsSpent ?? 0 };
  s.jobs.push(j);
  return j;
}

export function applyJobEffect(s: GameState, e: JobEffect) {
  switch (e.type) {
    case "restoreCondition": {
      const f = s.facilities[e.facility];
      f.condition = Math.min(100, f.condition + e.amount);
      if (e.clearFailure) f.failed = false;
      break;
    }
    case "reduceDust": {
      const f = s.facilities[e.facility];
      f.dust = Math.max(0, f.dust - e.amount);
      break;
    }
    case "removeModifiers":
      removeModifiers(s, e.source);
      break;
    case "setModifierValue":
      setModifierValue(s, e.source, e.kind, e.value);
      break;
  }
}

export function adjustWellbeing(s: GameState, delta: number) {
  for (const c of s.crew) c.wellbeing = Math.min(100, Math.max(0, c.wellbeing + delta));
}

export const FACILITY_NAMES: Record<FacilityId, string> = {
  habitat: "Habitat module",
  power: "Power generation",
  oxygen: "Oxygen generation",
  water: "Water recovery",
  food: "Food production",
  lab: "Research laboratory",
  comms: "Communications",
  storage: "Storage module",
};

export function facilityName(id: FacilityId): string {
  return FACILITY_NAMES[id];
}
