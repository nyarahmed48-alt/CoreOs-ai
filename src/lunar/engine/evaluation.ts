/**
 * END-OF-MISSION EVALUATION
 *
 * The outcome is decided by explicit rules, not by a hidden score:
 *   - Mission unsuccessful: an abort condition forced evacuation.
 *   - Mission accomplished: every primary objective met AND at least 75% of
 *     secondary objective points earned.
 *   - Completed with limitations: anything in between.
 * A points total is reported alongside, with its full breakdown.
 */
import { CONFIG, RESOURCES } from "./config";
import { uptimeRatio } from "./objectives";
import { getScenario } from "./scenarios";
import { FACILITY_IDS, type EventRecord, type GameState, type MissionOutcome } from "./types";

export interface Metric {
  label: string;
  value: string;
  note?: string;
}

export interface Evaluation {
  outcome: MissionOutcome;
  headline: string;
  reasons: string[];
  aborted: boolean;
  durationHours: number;
  plannedHours: number;
  objectives: { title: string; primary: boolean; completed: boolean; points: number; earned: number }[];
  points: { earned: number; possible: number };
  resourceEfficiency: Metric[];
  reliability: Metric[];
  decisions: EventRecord[];
  majorEvents: EventRecord[];
  safety: Metric[];
}

export const OUTCOME_LABELS: Record<MissionOutcome, string> = {
  accomplished: "Mission accomplished",
  limited: "Mission completed with limitations",
  unsuccessful: "Mission unsuccessful",
};

export function evaluateMission(s: GameState): Evaluation {
  const sc = getScenario(s.scenarioId);
  const aborted = s.status === "ended" && s.hour < sc.durationHours;
  const objectives = sc.objectives.map((o) => {
    const done = !!s.objectives[o.id]?.completed;
    return { title: o.title, primary: o.primary, completed: done, points: o.points, earned: done ? o.points : 0 };
  });
  const primaries = objectives.filter((o) => o.primary);
  const secondaries = objectives.filter((o) => !o.primary);
  const secPossible = secondaries.reduce((a, o) => a + o.points, 0);
  const secEarned = secondaries.reduce((a, o) => a + o.earned, 0);
  const allPrimary = primaries.every((o) => o.completed);
  const secRatio = secPossible ? secEarned / secPossible : 1;

  let outcome: MissionOutcome;
  const reasons: string[] = [];
  if (aborted) {
    outcome = "unsuccessful";
    reasons.push(`The mission ended early at day ${(s.hour / 24).toFixed(1)}: ${s.endReason ?? "abort condition reached."}`);
  } else if (allPrimary && secRatio >= 0.75) {
    outcome = "accomplished";
    reasons.push("All primary objectives were met.");
    reasons.push(`${Math.round(secRatio * 100)}% of secondary objective points were earned (75% required).`);
  } else {
    outcome = "limited";
    if (!allPrimary) for (const p of primaries.filter((o) => !o.completed)) reasons.push(`Primary objective not met: ${p.title}.`);
    if (secRatio < 0.75) reasons.push(`Only ${Math.round(secRatio * 100)}% of secondary objective points were earned (75% needed for full success).`);
  }

  const uptime = uptimeRatio(s);
  if (!aborted && uptime < 0.95) reasons.push(`Life support was out of its safe operating bands ${(100 - uptime * 100).toFixed(1)}% of the time.`);
  if (s.stats.failures > 0) reasons.push(`${s.stats.failures} facility failure${s.stats.failures > 1 ? "s" : ""} occurred; ${s.stats.repairsCompleted} repair job${s.stats.repairsCompleted === 1 ? " was" : "s were"} completed.`);
  if (s.stats.energyShortfallKwh > 5) reasons.push(`Power demand went unmet by ${s.stats.energyShortfallKwh.toFixed(0)} kWh in total, forcing systems to run below full capacity.`);
  if (s.stats.foodSpoiledKg > 1) reasons.push(`${s.stats.foodSpoiledKg.toFixed(1)} kg of food was lost to spoilage.`);

  const waterRecovery = s.stats.waterUsedKg > 0 ? s.stats.waterRecoveredKg / s.stats.waterUsedKg : 0;
  const avgCondition = FACILITY_IDS.reduce((a, f) => a + s.facilities[f].condition, 0) / FACILITY_IDS.length;

  const resourceEfficiency: Metric[] = [
    { label: "Water recovered vs. used", value: `${(waterRecovery * 100).toFixed(0)}%`, note: `${s.stats.waterRecoveredKg.toFixed(0)} kg recovered, ${s.stats.waterLostKg.toFixed(0)} kg lost` },
    { label: "Oxygen generated", value: `${s.stats.oxygenProducedKg.toFixed(1)} kg`, note: `Crew needed ≈${((CONFIG.o2PerCrewDay * s.crew.length * s.hour) / 24).toFixed(1)} kg` },
    { label: "Food grown", value: `${s.stats.foodGrownKg.toFixed(1)} kg`, note: `${s.stats.foodSpoiledKg.toFixed(1)} kg spoiled` },
    { label: "Unmet power demand", value: `${s.stats.energyShortfallKwh.toFixed(0)} kWh` },
    ...(["oxygen", "water", "food"] as const).map((r) => ({
      label: `Final ${RESOURCES[r].label.toLowerCase()}`,
      value: `${s.resources[r].toFixed(RESOURCES[r].decimals)} ${RESOURCES[r].unit}`,
      note: `Lowest point ${s.stats.minReserves[r].toFixed(RESOURCES[r].decimals)}; minimum reserve ${RESOURCES[r].minReserve}`,
    })),
  ];

  const reliability: Metric[] = [
    { label: "Life-support uptime", value: `${(uptime * 100).toFixed(1)}%` },
    { label: "Facility failures", value: `${s.stats.failures}` },
    { label: "Repairs completed", value: `${s.stats.repairsCompleted}` },
    { label: "Services completed", value: `${s.stats.servicesCompleted}` },
    { label: "Average facility condition at end", value: `${avgCondition.toFixed(0)}%` },
  ];

  const safety: Metric[] = [
    { label: "Radiation exposure index", value: `${s.stats.exposureIndex}`, note: "Gameplay index: rises when operations continue through a solar particle event." },
    { label: "Average crew wellbeing", value: `${(s.crew.reduce((a, c) => a + c.wellbeing, 0) / s.crew.length).toFixed(0)} / 100`, note: "Gameplay indicator, not a medical measure." },
  ];
  if (s.stats.exposureIndex >= 3) reasons.push("Crew radiation exposure was higher than necessary (operations continued through a solar particle event).");

  const decisions = s.eventHistory.filter((e) => e.optionId);
  const majorEvents = s.eventHistory.filter((e) => e.severity === "warning" || e.severity === "critical");

  return {
    outcome,
    headline: OUTCOME_LABELS[outcome],
    reasons,
    aborted,
    durationHours: s.hour,
    plannedHours: sc.durationHours,
    objectives,
    points: { earned: objectives.reduce((a, o) => a + o.earned, 0), possible: objectives.reduce((a, o) => a + o.points, 0) },
    resourceEfficiency,
    reliability,
    decisions,
    majorEvents,
    safety,
  };
}
