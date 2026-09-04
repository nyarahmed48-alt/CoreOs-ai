/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The task graph: validation, and deciding what may run next.
 *
 * The plan arrives from a language model, so it is untrusted structurally as
 * well as semantically. A plan that names a role that does not exist, depends
 * on a task that was never declared, or contains a cycle will not fail at
 * planning time — it will fail halfway through a run, after agents have
 * already written files. So everything checkable is checked up front, once,
 * and a bad plan is rejected before any work starts.
 *
 * Scheduling is a ready-set rather than a fixed order: at each step, every
 * task whose dependencies have all succeeded may run, and they run together.
 * That is what makes the frontend and the backend agent work in parallel once
 * the designer has settled the API contract between them.
 */

import { isAgentRole, type Plan, type Task, type TaskRun, type TaskStatus } from "./types";

export class PlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanError";
  }
}

/** Fail on the first structural problem, naming the task so it can be fixed. */
export function validatePlan(plan: Plan): void {
  if (!plan.tasks.length) throw new PlanError("The plan has no tasks.");

  const seen = new Set<string>();
  for (const task of plan.tasks) {
    if (!task.id) throw new PlanError("A task has no id.");
    if (seen.has(task.id)) throw new PlanError(`Two tasks share the id "${task.id}".`);
    seen.add(task.id);

    if (!isAgentRole(task.role)) {
      throw new PlanError(`Task "${task.id}" names role "${task.role}", which does not exist.`);
    }
    if (!task.goal || !task.goal.trim()) {
      throw new PlanError(`Task "${task.id}" has no goal, so there is nothing to assign.`);
    }
  }

  for (const task of plan.tasks) {
    for (const dep of task.dependsOn) {
      if (!seen.has(dep)) {
        throw new PlanError(`Task "${task.id}" depends on "${dep}", which is not in the plan.`);
      }
      if (dep === task.id) throw new PlanError(`Task "${task.id}" depends on itself.`);
    }
  }

  const cycle = findCycle(plan.tasks);
  if (cycle) {
    throw new PlanError(`The plan has a dependency cycle: ${cycle.join(" → ")}.`);
  }
}

/**
 * The first cycle found, as the path around it, or null.
 *
 * Depth-first with an explicit "on the current path" set. Reporting the path
 * rather than a bare "cycle detected" is the difference between a message the
 * planner can be told to fix and one a person has to reverse-engineer.
 */
export function findCycle(tasks: Task[]): string[] | null {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const settled = new Set<string>();
  const onPath = new Set<string>();
  const path: string[] = [];

  const walk = (id: string): string[] | null => {
    if (settled.has(id)) return null;
    if (onPath.has(id)) return [...path.slice(path.indexOf(id)), id];

    onPath.add(id);
    path.push(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      const found = walk(dep);
      if (found) return found;
    }
    path.pop();
    onPath.delete(id);
    settled.add(id);
    return null;
  };

  for (const task of tasks) {
    const found = walk(task.id);
    if (found) return found;
  }
  return null;
}

/**
 * Every task that can start right now: still pending, and with all of its
 * dependencies already done.
 */
export function readyTasks(runs: TaskRun[]): TaskRun[] {
  const statusOf = new Map<string, TaskStatus>(runs.map((r) => [r.task.id, r.status]));
  return runs.filter(
    (run) =>
      run.status === "pending" &&
      run.task.dependsOn.every((dep) => statusOf.get(dep) === "done"),
  );
}

/**
 * Tasks that can never run now, because something they depend on failed.
 *
 * Marking these explicitly is what stops a run from reporting success while
 * silently having skipped half the plan — and it lets the report say which
 * failure caused which omission, rather than leaving a gap.
 */
export function blockedTasks(runs: TaskRun[]): TaskRun[] {
  const bad = new Set(
    runs.filter((r) => r.status === "failed" || r.status === "skipped").map((r) => r.task.id),
  );
  if (!bad.size) return [];

  /* A dependency that is itself skipped blocks in turn, so this has to close
     over the set rather than look one level down. */
  let changed = true;
  while (changed) {
    changed = false;
    for (const run of runs) {
      if (run.status !== "pending" || bad.has(run.task.id)) continue;
      if (run.task.dependsOn.some((dep) => bad.has(dep))) {
        bad.add(run.task.id);
        changed = true;
      }
    }
  }

  return runs.filter((r) => r.status === "pending" && bad.has(r.task.id));
}

/**
 * The plan in dependency order, as parallel waves.
 *
 * Used for display and for the build log — the executor uses readyTasks(),
 * which reacts to what actually happened rather than to what was foreseen.
 */
export function waves(tasks: Task[]): Task[][] {
  const remaining = new Map(tasks.map((t) => [t.id, t]));
  const placed = new Set<string>();
  const out: Task[][] = [];

  while (remaining.size) {
    const wave = [...remaining.values()].filter((t) =>
      t.dependsOn.every((d) => placed.has(d)),
    );
    /* validatePlan rules this out; if it is ever reached, stopping beats
       looping forever. */
    if (!wave.length) break;
    for (const t of wave) {
      remaining.delete(t.id);
      placed.add(t.id);
    }
    out.push(wave);
  }
  return out;
}
