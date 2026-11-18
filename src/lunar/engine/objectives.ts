import { RESOURCES } from "./config";
import { log } from "./mutators";
import { getScenario, type ObjectiveDef } from "./scenarios";
import type { GameState } from "./types";

export interface ObjectiveView {
  def: ObjectiveDef;
  completed: boolean;
  failed: boolean;
  /** 0–1 */
  progress: number;
  current: string;
  /** End-evaluated objectives can only be confirmed at mission end. */
  evaluatedAtEnd: boolean;
}

function reservesOk(s: GameState): boolean {
  return (["oxygen", "water", "food"] as const).every((r) => s.resources[r] >= RESOURCES[r].minReserve);
}

export function uptimeRatio(s: GameState): number {
  return s.hour === 0 ? 1 : s.stats.hoursLifeSupportOk / s.hour;
}

export function objectiveView(s: GameState, def: ObjectiveDef): ObjectiveView {
  const p = s.objectives[def.id] ?? { completed: false };
  const ended = s.status === "ended";
  let progress = 0;
  let current = "";
  let evaluatedAtEnd = false;
  switch (def.kind) {
    case "survive":
      progress = Math.min(1, s.hour / def.target);
      current = `${(s.hour / 24).toFixed(1)} / ${def.target / 24} days`;
      evaluatedAtEnd = true;
      break;
    case "lifeSupportUptime": {
      const r = uptimeRatio(s);
      progress = Math.min(1, r / def.target);
      current = `${(r * 100).toFixed(1)}% (target ${Math.round(def.target * 100)}%)`;
      evaluatedAtEnd = true;
      break;
    }
    case "research":
      progress = Math.min(1, s.science.points / def.target);
      current = `${s.science.points.toFixed(1)} / ${def.target} points`;
      break;
    case "downlink":
      progress = Math.min(1, s.science.downlinkedMb / def.target);
      current = `${Math.round(s.science.downlinkedMb).toLocaleString()} / ${def.target.toLocaleString()} MB`;
      break;
    case "reserves": {
      const ok = reservesOk(s);
      progress = ok ? 1 : 0.5;
      current = ok ? "All reserves above minimum" : "One or more reserves below minimum";
      evaluatedAtEnd = true;
      break;
    }
    case "repair":
      progress = Math.min(1, s.stats.repairsCompleted / def.target);
      current = `${s.stats.repairsCompleted} / ${def.target} repairs`;
      break;
    case "service":
      progress = Math.min(1, s.stats.servicesCompleted / def.target);
      current = `${s.stats.servicesCompleted} / ${def.target} services`;
      break;
  }
  return { def, completed: p.completed, failed: !!p.failed || (ended && !p.completed), progress, current, evaluatedAtEnd };
}

/** Called every hour: completes count-based objectives as soon as they are reached. */
export function updateObjectives(s: GameState) {
  const sc = getScenario(s.scenarioId);
  for (const def of sc.objectives) {
    const p = s.objectives[def.id];
    if (!p || p.completed) continue;
    const v = objectiveView(s, def);
    if (!v.evaluatedAtEnd && v.progress >= 1) {
      p.completed = true;
      p.completedHour = s.hour;
      log(s, "objective", `Objective complete: ${def.title}`, def.description, "advisory");
    }
  }
}

/** Called once when the mission ends: settles end-evaluated objectives. */
export function finalizeObjectives(s: GameState, aborted: boolean) {
  const sc = getScenario(s.scenarioId);
  for (const def of sc.objectives) {
    const p = s.objectives[def.id];
    if (!p || p.completed) continue;
    let ok = false;
    if (!aborted) {
      if (def.kind === "survive") ok = s.hour >= def.target;
      else if (def.kind === "lifeSupportUptime") ok = uptimeRatio(s) >= def.target;
      else if (def.kind === "reserves") ok = reservesOk(s);
    }
    if (ok) {
      p.completed = true;
      p.completedHour = s.hour;
      log(s, "objective", `Objective complete: ${def.title}`, def.description, "advisory");
    } else {
      p.failed = true;
    }
  }
}
