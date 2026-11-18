import { describe, expect, it } from "vitest";
import { applyAction } from "../actions";
import { CONFIG, RESOURCES } from "../config";
import { getEventDef, triggerEvent } from "../events";
import { evaluateMission } from "../evaluation";
import { createMission } from "../init";
import { addModifier, failFacility } from "../mutators";
import { BACKUP_KEY, MemoryStore, SAVE_KEY, clearSave, loadGame, saveGame } from "../persistence";
import { SCENARIOS } from "../scenarios";
import { clone, stepHour } from "../step";
import { RESOURCE_IDS, type GameState } from "../types";
import { playMission } from "./strategy";

const fresh = (id = "standard", seed = 42) => createMission(id, seed);
const advance = (s: GameState, hours: number, stopOnEvent = false) => applyAction(s, { type: "advance", hours, stopOnEvent }).state;
/** A state with no scripted events, so tests are not interrupted. */
function quiet(id = "standard", seed = 42): GameState {
  const s = fresh(id, seed);
  s.scriptedFired = SCENARIOS.find((x) => x.id === id)!.scriptedEvents.map((e) => `${e.defId}@${e.hour}`);
  s.eventCooldownUntil = 10_000;
  return s;
}

describe("simulation clock", () => {
  it("advances exactly one hour per step and records history", () => {
    const s = advance(fresh(), 1);
    expect(s.hour).toBe(1);
    expect(s.history).toHaveLength(1);
    expect(s.history[0].h).toBe(1);
  });

  it("advancing zero hours (paused) changes nothing", () => {
    const s0 = fresh();
    const s1 = applyAction(s0, { type: "advance", hours: 0 }).state;
    expect(s1).toEqual(s0);
  });

  it("never mutates the input state", () => {
    const s0 = fresh();
    const snapshot = JSON.stringify(s0);
    stepHour(s0);
    applyAction(s0, { type: "toggleFacility", facility: "lab" });
    expect(JSON.stringify(s0)).toBe(snapshot);
  });

  it("is deterministic for the same seed and actions", () => {
    const a = advance(fresh("standard", 7), 120);
    const b = advance(fresh("standard", 7), 120);
    expect(a).toEqual(b);
  });

  it("an ended mission cannot be advanced", () => {
    let s = quiet("tutorial");
    s = advance(s, 500);
    expect(s.status).toBe("ended");
    const r = applyAction(s, { type: "advance", hours: 1 });
    expect(r.error).toBeTruthy();
    expect(r.state.hour).toBe(s.hour);
  });

  it("stops advancing when a new event requires a decision", () => {
    const s = fresh("tutorial");
    const r = applyAction(s, { type: "advance", hours: 24, stopOnEvent: true });
    expect(r.stoppedBecause).toBe("event");
    expect(r.state.pendingEvent?.defId).toBe("dust");
    expect(r.state.hour).toBe(4);
  });
});

describe("resource engine", () => {
  it("keeps every resource within [0, capacity] across full missions", () => {
    for (const sc of SCENARIOS) {
      for (const seed of [1, 2, 3]) {
        let s = fresh(sc.id, seed);
        while (s.status !== "ended") {
          s = stepHour(s);
          for (const r of RESOURCE_IDS) {
            const cap = r === "energy" ? CONFIG.batteryCapacityKwh : RESOURCES[r].capacity;
            expect(s.resources[r]).toBeGreaterThanOrEqual(0);
            expect(s.resources[r]).toBeLessThanOrEqual(cap + 1e-9);
            expect(Number.isFinite(s.resources[r])).toBe(true);
          }
        }
      }
    }
  });

  it("applies change = production − consumption", () => {
    const s0 = quiet();
    const s1 = stepHour(s0);
    for (const r of ["water", "food", "oxygen", "sciSupplies"] as const) {
      const delta = s1.resources[r] - s0.resources[r];
      expect(delta).toBeCloseTo(s1.rates[r].production - s1.rates[r].consumption, 6);
    }
  });

  it("does not exceed maximum capacity", () => {
    const s = quiet();
    s.resources.oxygen = RESOURCES.oxygen.capacity;
    s.resources.water = RESOURCES.water.capacity;
    s.resources.energy = CONFIG.batteryCapacityKwh;
    const after = advance(s, 12);
    expect(after.resources.oxygen).toBeLessThanOrEqual(RESOURCES.oxygen.capacity);
    expect(after.resources.water).toBeLessThanOrEqual(RESOURCES.water.capacity);
    expect(after.resources.energy).toBeLessThanOrEqual(CONFIG.batteryCapacityKwh);
  });

  it("electrolysis uses 1.125 kg of water per kg of oxygen", () => {
    const s = quiet();
    s.resources.oxygen = 10;
    const after = stepHour(s);
    const o2 = after.rates.oxygen.production;
    expect(o2).toBeGreaterThan(0);
    const crewWater = (CONFIG.waterPerCrewDay / 24) * s.crew.length;
    const hydro = CONFIG.hydroWaterPerHour * Math.min(1, after.facilities.food.efficiency);
    expect(after.rates.water.consumption).toBeCloseTo(crewWater + hydro + o2 * CONFIG.waterPerKgO2, 6);
  });

  it("water conservation reduces crew water use", () => {
    const a = stepHour(quiet());
    const b = stepHour({ ...quiet(), policies: { waterConservation: true, foodRationing: false } });
    expect(b.rates.water.consumption).toBeLessThan(a.rates.water.consumption);
  });

  it("produces no solar power with zero illumination and drains the battery", () => {
    const s = quiet();
    addModifier(s, { kind: "solarMultiplier", value: 0, hoursRemaining: null, label: "test", source: "t" });
    const after = stepHour(s);
    expect(after.power.solarKw).toBe(0);
    expect(after.resources.energy).toBeLessThan(s.resources.energy);
  });

  it("a power shortage reduces water recycling and lets wastewater accumulate", () => {
    const s = quiet();
    addModifier(s, { kind: "solarMultiplier", value: 0, hoursRemaining: null, label: "test", source: "t" });
    s.resources.energy = 0;
    const after = stepHour(s);
    expect(after.facilities.water.efficiency).toBe(0);
    expect(after.rates.water.production).toBe(0);
    expect(after.wastewater).toBeGreaterThan(s.wastewater);
  });

  it("powers the top priority first when power is short", () => {
    const s = quiet();
    addModifier(s, { kind: "solarMultiplier", value: 0.5, hoursRemaining: null, label: "test", source: "t" });
    s.resources.energy = 0;
    const after = stepHour(s);
    expect(after.facilities.habitat.powerFraction).toBe(1);
    expect(after.facilities.lab.powerFraction).toBeLessThan(1);
  });

  it("battery reserve floor keeps lower priorities off the battery", () => {
    const s = quiet();
    addModifier(s, { kind: "solarMultiplier", value: 0, hoursRemaining: null, label: "test", source: "t" });
    s.resources.energy = 0.3 * CONFIG.batteryCapacityKwh;
    s.batteryFloor = 0.5;
    const after = stepHour(s);
    expect(after.facilities.habitat.powerFraction).toBe(1);
    expect(after.facilities.lab.powerFraction).toBe(0);
    expect(after.facilities.food.powerFraction).toBe(0);
  });

  it("a water shortage throttles food production", () => {
    const s = quiet();
    const normal = stepHour(s);
    const dry = clone(s);
    dry.resources.water = 5;
    const after = stepHour(dry);
    expect(after.rates.food.production).toBeLessThan(normal.rates.food.production);
  });
});

describe("facilities, failures and repairs", () => {
  it("a failed facility produces nothing", () => {
    const s = quiet();
    s.resources.oxygen = 10;
    failFacility(s, "oxygen", "test");
    const after = stepHour(s);
    expect(after.rates.oxygen.production).toBe(0);
    expect(after.facilities.oxygen.efficiency).toBe(0);
    expect(after.stats.failures).toBe(1);
  });

  it("a switched-off facility draws no power and produces nothing", () => {
    const s = applyAction(quiet(), { type: "toggleFacility", facility: "lab" }).state;
    const after = stepHour(s);
    expect(after.facilities.lab.drawKw).toBe(0);
  });

  it("refuses a repair without enough spare parts", () => {
    const s = quiet();
    s.resources.spares = 0;
    failFacility(s, "oxygen", "test");
    const r = applyAction(s, { type: "startJob", facility: "oxygen", kind: "repair" });
    expect(r.error).toMatch(/spare parts/i);
    expect(r.state).toBe(s);
  });

  it("refuses a service on a failed facility and a repair on a healthy one", () => {
    const s = quiet();
    failFacility(s, "water", "test");
    expect(applyAction(s, { type: "startJob", facility: "water", kind: "service" }).error).toBeTruthy();
    expect(applyAction(s, { type: "startJob", facility: "habitat", kind: "repair" }).error).toBeTruthy();
  });

  it("repairs consume parts and crew time, then restore the facility", () => {
    let s = quiet();
    failFacility(s, "oxygen", "test");
    const spares = s.resources.spares;
    s = applyAction(s, { type: "startJob", facility: "oxygen", kind: "repair" }).state;
    expect(s.resources.spares).toBe(spares - CONFIG.repair.parts);
    expect(s.jobs).toHaveLength(1);
    s = advance(s, 1);
    expect(s.facilities.oxygen.failed).toBe(true); // 8 crew-hours not done yet
    s = advance(s, 24);
    expect(s.jobs).toHaveLength(0);
    expect(s.facilities.oxygen.failed).toBe(false);
    expect(s.facilities.oxygen.condition).toBeGreaterThan(80);
    expect(s.stats.repairsCompleted).toBe(1);
  });

  it("repair work only happens when someone is assigned to maintenance", () => {
    let s = quiet();
    failFacility(s, "oxygen", "test");
    s = applyAction(s, { type: "startJob", facility: "oxygen", kind: "repair" }).state;
    s = applyAction(s, { type: "assignCrew", crewId: "c1", task: "research" }).state;
    s = advance(s, 12);
    expect(s.jobs[0].laborDone).toBe(0);
  });

  it("cancelling an unstarted job refunds parts", () => {
    let s = quiet();
    const spares = s.resources.spares;
    s = applyAction(s, { type: "startJob", facility: "oxygen", kind: "service" }).state;
    s = applyAction(s, { type: "cancelJob", jobId: s.jobs[0].id }).state;
    expect(s.resources.spares).toBe(spares);
  });

  it("facilities wear down while running", () => {
    const s = quiet();
    const after = advance(s, 10);
    expect(after.facilities.oxygen.condition).toBeLessThan(s.facilities.oxygen.condition);
  });
});

describe("life support", () => {
  it("CO₂ rises and temperature falls when the habitat loses power", () => {
    let s = quiet();
    s = applyAction(s, { type: "toggleFacility", facility: "habitat" }).state;
    const after = advance(s, 6);
    expect(after.habitat.co2).toBeGreaterThan(s.habitat.co2 + 2);
    expect(after.habitat.temperature).toBeLessThan(s.habitat.temperature - 3);
  });

  it("empty oxygen reserves force an evacuation", () => {
    let s = quiet();
    s.resources.oxygen = 0;
    s = applyAction(s, { type: "toggleFacility", facility: "oxygen" }).state;
    s = advance(s, 10);
    expect(s.status).toBe("ended");
    expect(s.outcome).toBe("unsuccessful");
    expect(s.endReason).toMatch(/oxygen/i);
    expect(evaluateMission(s).outcome).toBe("unsuccessful");
  });
});

describe("events and decisions", () => {
  it("scripted events trigger at their hour with an immediate effect", () => {
    const s = advance(fresh("tutorial"), 4);
    expect(s.pendingEvent?.defId).toBe("dust");
    expect(s.facilities.power.dust).toBeGreaterThan(25);
  });

  it("decisions have real consequences", () => {
    const s = advance(fresh("tutorial"), 4);
    const r = applyAction(s, { type: "resolveEvent", optionId: "eds" });
    expect(r.error).toBeUndefined();
    expect(r.state.resources.energy).toBeCloseTo(s.resources.energy - 12, 6);
    expect(r.state.facilities.power.dust).toBeCloseTo(s.facilities.power.dust - 18, 6);
    expect(r.state.pendingEvent).toBeNull();
    expect(r.state.eventHistory.at(-1)?.optionId).toBe("eds");

    const r2 = applyAction(s, { type: "resolveEvent", optionId: "eva-clean" });
    expect(r2.state.jobs.some((j) => j.eva)).toBe(true);
  });

  it("rejects an unaffordable option", () => {
    const s = advance(fresh("tutorial"), 4);
    s.resources.energy = 5;
    const r = applyAction(s, { type: "resolveEvent", optionId: "eds" });
    expect(r.error).toBeTruthy();
    expect(r.state.pendingEvent).not.toBeNull();
  });

  it("applies the default option automatically after the deadline", () => {
    let s = advance(fresh("tutorial"), 4);
    s = advance(s, 7);
    expect(s.pendingEvent?.defId).not.toBe("dust");
    const rec = s.eventHistory.find((e) => e.defId === "dust")!;
    expect(rec.auto).toBe(true);
    expect(rec.optionId).toBe("accept");
  });

  it("only one event is pending at a time and later events still occur", () => {
    let s = fresh("standard", 3);
    let maxPending = 0;
    while (s.status !== "ended") {
      s = stepHour(s);
      maxPending = Math.max(maxPending, s.pendingEvent ? 1 : 0);
    }
    expect(maxPending).toBe(1);
    expect(s.eventHistory.length).toBeGreaterThanOrEqual(3);
  });

  it("every event option can be applied without errors", () => {
    for (const id of ["terrain-shadow", "wrs-filter", "dust", "comms-interference", "storage-thermal", "experiment-power", "resupply-delay", "cargo-slot", "oga-maintenance", "spe", "hab-leak", "co2-bed", "hydro-pump", "terrain-shadow-forecast"]) {
      const def = getEventDef(id)!;
      for (const o of def.options) {
        const s = quiet();
        triggerEvent(s, def);
        const r = applyAction(s, { type: "resolveEvent", optionId: o.id });
        expect(r.error, `${id}/${o.id}`).toBeUndefined();
        const after = advance(r.state, 30);
        expect(after.hour).toBeGreaterThan(s.hour);
      }
    }
  });

  it("radiation shelter pauses research", () => {
    const s = quiet();
    triggerEvent(s, getEventDef("spe")!);
    const sheltered = applyAction(s, { type: "resolveEvent", optionId: "shelter" }).state;
    const after = advance(sheltered, 4);
    expect(after.science.points).toBe(sheltered.science.points);
  });
});

describe("objectives and evaluation", () => {
  it("completes count objectives as soon as they are reached", () => {
    const s = quiet("tutorial");
    s.science.points = 24.9;
    const after = advance(s, 1);
    expect(after.objectives.research.completed).toBe(true);
    expect(after.timeline.some((t) => t.kind === "objective")).toBe(true);
  });

  it("a passive commander does not fully accomplish the standard mission", () => {
    const s = playMission("standard", 1, false);
    expect(evaluateMission(s).outcome).not.toBe("accomplished");
  });

  it.each([1, 2, 3, 4])("a competent commander accomplishes the standard mission (seed %i)", (seed) => {
    const s = playMission("standard", seed, true);
    const e = evaluateMission(s);
    expect(e.outcome).toBe("accomplished");
    expect(e.reasons.length).toBeGreaterThan(0);
  });

  it("the challenging scenario is survivable with good play", () => {
    for (const seed of [1, 2, 3]) expect(playMission("challenge", seed, true).outcome).not.toBe("unsuccessful");
  });

  it("the tutorial is fully achievable", () => {
    expect(playMission("tutorial", 1, true).outcome).toBe("accomplished");
  });
});

describe("persistence", () => {
  it("round-trips a saved mission", () => {
    const kv = new MemoryStore();
    const s = advance(fresh(), 30);
    expect(saveGame(s, kv)).toBe(true);
    const r = loadGame(kv);
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.state).toEqual(s);
  });

  it("reports an empty store", () => {
    expect(loadGame(new MemoryStore()).status).toBe("empty");
  });

  it("moves corrupt saves aside instead of crashing", () => {
    const kv = new MemoryStore();
    kv.setItem(SAVE_KEY, "{not json");
    expect(loadGame(kv).status).toBe("corrupt");
    expect(kv.getItem(SAVE_KEY)).toBeNull();
    expect(kv.getItem(BACKUP_KEY)).toBe("{not json");
  });

  it("detects outdated and structurally invalid saves", () => {
    const kv = new MemoryStore();
    kv.setItem(SAVE_KEY, JSON.stringify({ state: { ...fresh(), version: 0 } }));
    expect(loadGame(kv).status).toBe("outdated");
    const broken = { ...fresh(), resources: { oxygen: "lots" } };
    kv.setItem(SAVE_KEY, JSON.stringify({ state: broken }));
    expect(loadGame(kv).status).toBe("corrupt");
  });

  it("restarting produces an independent fresh mission", () => {
    const kv = new MemoryStore();
    saveGame(advance(fresh(), 50), kv);
    clearSave(kv);
    expect(loadGame(kv).status).toBe("empty");
    const restarted = fresh("standard", 99);
    expect(restarted.hour).toBe(0);
    expect(restarted.timeline).toHaveLength(1);
    expect(restarted.stats.failures).toBe(0);
  });
});

describe("evaluation metrics", () => {
  it("reports water loop recovery as a fraction no greater than 100%", () => {
    const s = playMission("standard", 2, true);
    const metric = evaluateMission(s).resourceEfficiency.find((m) => m.label === "Water loop recovery")!;
    const pctValue = parseFloat(metric.value);
    expect(pctValue).toBeGreaterThan(50);
    expect(pctValue).toBeLessThanOrEqual(100);
  });
});
