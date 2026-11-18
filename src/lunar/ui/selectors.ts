/** Derived, read-only views of the game state for the UI. */
import { CONFIG, LEVEL_RANK, RESOURCES, co2Level, levelForAmount, pressureLevel, temperatureLevel, worst } from "../engine/config";
import { isOperable, clockHour, isSleepHour } from "../engine/step";
import { hasMod } from "../engine/mutators";
import type { CrewMember, FacilityId, FacilityStatus, GameState, ResourceId, StatusLevel } from "../engine/types";

export function facilityStatus(s: GameState, id: FacilityId): FacilityStatus {
  const f = s.facilities[id];
  if (f.failed) return "failed";
  if (s.jobs.some((j) => j.facility === id && j.takesOffline)) return "maintenance";
  if (!f.enabled || hasMod(s, "loadShed", id)) return "offline";
  if (id !== "power" && f.powerFraction === 0) return "offline";
  if (f.efficiency < 0.75 || f.condition < 50) return "degraded";
  return "online";
}

export function facilityLevel(s: GameState, id: FacilityId): StatusLevel {
  const st = facilityStatus(s, id);
  if (st === "failed") return "critical";
  if (st === "offline" && !s.facilities[id].enabled) return "caution";
  if (st === "offline") return "warning";
  if (st === "maintenance") return "caution";
  if (st === "degraded") return s.facilities[id].condition < 30 ? "warning" : "caution";
  return "nominal";
}

export function resourceLevel(s: GameState, id: ResourceId): StatusLevel {
  return levelForAmount(RESOURCES[id], s.resources[id]);
}

export function resourceCapacity(id: ResourceId): number {
  return id === "energy" ? CONFIG.batteryCapacityKwh : RESOURCES[id].capacity;
}

export function lifeSupportLevel(s: GameState): StatusLevel {
  return worst(pressureLevel(s.habitat.pressure), temperatureLevel(s.habitat.temperature), co2Level(s.habitat.co2), resourceLevel(s, "oxygen"), resourceLevel(s, "water"));
}

export function crewLevel(s: GameState): StatusLevel {
  const avg = s.crew.reduce((a, c) => a + c.wellbeing, 0) / s.crew.length;
  const maxLoad = Math.max(...s.crew.map((c) => c.workload));
  if (avg < 35) return "critical";
  if (avg < 55) return "warning";
  if (avg < 70 || maxLoad > 90) return "caution";
  return "nominal";
}

export function powerLevel(s: GameState): StatusLevel {
  if (s.power.deficitKw > 0.05) return s.power.deficitKw > 3 ? "critical" : "warning";
  return resourceLevel(s, "energy");
}

export function commsLevel(s: GameState): StatusLevel {
  const q = s.science.linkQuality;
  if (q < CONFIG.linkDownThreshold) return "critical";
  if (q < 0.5) return "warning";
  if (q < 0.8) return "caution";
  return "nominal";
}

export function baseLevel(s: GameState): StatusLevel {
  return (["habitat", "power", "oxygen", "water", "food", "lab", "comms", "storage"] as FacilityId[]).reduce<StatusLevel>(
    (acc, f) => worst(acc, facilityLevel(s, f) === "caution" && !s.facilities[f].enabled ? "nominal" : facilityLevel(s, f)),
    "nominal",
  );
}

export function missionLevel(s: GameState): StatusLevel {
  const lvl = worst(lifeSupportLevel(s), powerLevel(s), resourceLevel(s, "food"), crewLevel(s));
  if (s.pendingEvent && LEVEL_RANK[lvl] < 1) return "caution";
  return lvl;
}

export function crewStatusLabel(s: GameState, c: CrewMember): string {
  if (isSleepHour(s.hour)) return "Sleep period";
  if (hasMod(s, "shelter")) return "In shielded refuge";
  if (c.task === "rest") return "Resting";
  if (c.workload > 85) return "On duty · high workload";
  return "On duty";
}

export function netRate(s: GameState, id: ResourceId): number {
  return s.rates[id].production - s.rates[id].consumption;
}

/** Hours until a resource runs out at the current net rate, or null if not falling. */
export function hoursRemaining(s: GameState, id: ResourceId): number | null {
  const n = netRate(s, id);
  if (n >= -1e-6) return null;
  return s.resources[id] / -n;
}

export function stationClock(hour: number): string {
  return `${String(clockHour(hour)).padStart(2, "0")}:00`;
}

export function operable(s: GameState, id: FacilityId) {
  return isOperable(s, id);
}
