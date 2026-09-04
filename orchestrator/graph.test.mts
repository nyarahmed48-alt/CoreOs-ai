/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The plan validator and the scheduler.
 *
 * The plan comes from a language model, so every one of these is a shape a
 * real run will eventually be handed. The point of validating up front is that
 * a bad plan fails before any agent has written a file — so the tests care as
 * much about *when* the failure happens as that it happens at all.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { blockedTasks, findCycle, PlanError, readyTasks, validatePlan, waves } from "./graph.ts";
import type { Plan, Task, TaskRun } from "./types.ts";

const task = (id: string, dependsOn: string[] = [], role: Task["role"] = "backend"): Task => ({
  id,
  role,
  goal: `do ${id}`,
  dependsOn,
  needs: [],
  produces: id,
});

const plan = (tasks: Task[]): Plan => ({ goal: "g", tasks });

const run = (t: Task, status: TaskRun["status"] = "pending"): TaskRun => ({
  task: t,
  status,
  attempts: 0,
  toolResults: [],
});

describe("validatePlan", () => {
  it("accepts a plan that hangs together", () => {
    validatePlan(plan([task("a"), task("b", ["a"]), task("c", ["a"])]));
  });

  it("rejects an empty plan", () => {
    assert.throws(() => validatePlan(plan([])), PlanError);
  });

  it("rejects a role that does not exist", () => {
    const bad = { ...task("a"), role: "devops" as Task["role"] };
    assert.throws(() => validatePlan(plan([bad])), /devops/);
  });

  it("rejects a dependency on a task nobody declared", () => {
    /* The failure mode this prevents: the scheduler would find nothing ready,
       and the run would end reporting success with zero tasks executed. */
    assert.throws(() => validatePlan(plan([task("a", ["ghost"])])), /ghost/);
  });

  it("rejects two tasks sharing an id", () => {
    assert.throws(() => validatePlan(plan([task("a"), task("a")])), /share the id/);
  });

  it("rejects a task with no goal, since there is nothing to assign", () => {
    assert.throws(() => validatePlan(plan([{ ...task("a"), goal: "  " }])), /no goal/);
  });

  it("rejects a cycle, and names the path around it", () => {
    assert.throws(
      () => validatePlan(plan([task("a", ["c"]), task("b", ["a"]), task("c", ["b"])])),
      (err: unknown) => {
        assert.ok(err instanceof PlanError);
        /* A bare "cycle detected" leaves a person to reverse-engineer which
           three tasks; the path around it is the actionable part. */
        for (const id of ["a", "b", "c"]) assert.match(err.message, new RegExp(id));
        return true;
      },
    );
  });

  it("rejects a task depending on itself", () => {
    assert.throws(() => validatePlan(plan([task("a", ["a"])])), /depends on itself/);
  });
});

describe("findCycle", () => {
  it("returns null for a graph that terminates", () => {
    assert.equal(findCycle([task("a"), task("b", ["a"])]), null);
  });

  it("finds a cycle that does not include the first task walked", () => {
    const found = findCycle([task("root"), task("a", ["b"]), task("b", ["a"])]);
    assert.ok(found);
    assert.ok(found.includes("a") && found.includes("b"));
  });
});

describe("readyTasks", () => {
  it("offers only tasks whose dependencies are all done", () => {
    const runs = [run(task("a"), "done"), run(task("b", ["a"])), run(task("c", ["b"]))];
    assert.deepEqual(readyTasks(runs).map((r) => r.task.id), ["b"]);
  });

  it("offers independent tasks together, so they run in parallel", () => {
    const runs = [run(task("a"), "done"), run(task("b", ["a"])), run(task("c", ["a"]))];
    assert.deepEqual(readyTasks(runs).map((r) => r.task.id), ["b", "c"]);
  });

  it("offers nothing while a dependency is merely running", () => {
    assert.deepEqual(readyTasks([run(task("a"), "running"), run(task("b", ["a"]))]), []);
  });
});

describe("blockedTasks", () => {
  it("finds nothing while everything is still viable", () => {
    assert.deepEqual(blockedTasks([run(task("a"), "done"), run(task("b", ["a"]))]), []);
  });

  it("blocks a task whose dependency failed", () => {
    const runs = [run(task("a"), "failed"), run(task("b", ["a"]))];
    assert.deepEqual(blockedTasks(runs).map((r) => r.task.id), ["b"]);
  });

  it("blocks transitively, so no task is left waiting on a skip", () => {
    /* Without the closure, "c" would sit pending forever and the run would
       report success having silently skipped it. */
    const runs = [run(task("a"), "failed"), run(task("b", ["a"])), run(task("c", ["b"]))];
    assert.deepEqual(blockedTasks(runs).map((r) => r.task.id).sort(), ["b", "c"]);
  });
});

describe("waves", () => {
  it("groups the plan into parallel steps in dependency order", () => {
    const got = waves([task("a"), task("b", ["a"]), task("c", ["a"]), task("d", ["b", "c"])]);
    assert.deepEqual(got.map((w) => w.map((t) => t.id)), [["a"], ["b", "c"], ["d"]]);
  });
});
