/**
 * THE HOURLY SIMULATION STEP
 *
 * `stepHour` advances a mission by exactly one simulated hour. It is a pure
 * function: it clones the input state and returns a new one. Order of work:
 *
 *   1. Power: solar generation → allocation by commander priority → battery
 *   2. Facility efficiency (power × condition × modifiers)
 *   3. Crew labor (by assignment, only outside the sleep period)
 *   4. Cabin environment (CO₂, temperature, pressure)
 *   5. Consumables: oxygen, water, food (production − consumption)
 *   6. Science and data downlink
 *   7. Wear, dust and random failures
 *   8. Maintenance jobs
 *   9. Crew workload & wellbeing
 *  10. Resupply, modifier expiry, statistics, alerts, abort checks
 *  11. Objectives, events, end of mission
 *
 * Resource change = production − consumption, then clamped to [0, capacity].
 */
import {
  CONFIG,
  LEVEL_RANK,
  RESOURCES,
  co2Level,
  levelForAmount,
  pressureLevel,
  temperatureLevel,
  worst,
} from "./config";
import { evaluateMission } from "./evaluation";
import { EVENTS, getEventDef, resolvePendingEvent, triggerEvent } from "./events";
import { illuminationAt } from "./illumination";
import {
  applyJobEffect,
  clampResource,
  facilityName,
  failFacility,
  hasMod,
  log,
  modProduct,
  modSum,
} from "./mutators";
import { finalizeObjectives, updateObjectives } from "./objectives";
import { Rng } from "./rng";
import { getScenario } from "./scenarios";
import {
  FACILITY_IDS,
  RESOURCE_IDS,
  type CrewTask,
  type FacilityId,
  type GameState,
  type ResourceId,
  type StatusLevel,
} from "./types";

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Station clock hour-of-day (0–23) for a mission hour. */
export function clockHour(hour: number): number {
  return (hour + CONFIG.startClockHour) % 24;
}

export function isSleepHour(hour: number): boolean {
  const hod = clockHour(hour);
  return CONFIG.sleepStartHour > CONFIG.sleepEndHour
    ? hod >= CONFIG.sleepStartHour || hod < CONFIG.sleepEndHour
    : hod >= CONFIG.sleepStartHour && hod < CONFIG.sleepEndHour;
}

/** Output multiplier from facility condition: full above 60, tapering below. */
export function conditionFactor(condition: number): number {
  if (condition >= 60) return 1;
  return Math.max(0, 0.4 + condition / 100);
}

/** Is a facility able to run at all (not failed, not offline for a job, not switched off/shed)? */
export function isOperable(s: GameState, id: FacilityId): boolean {
  const f = s.facilities[id];
  if (!f.enabled || f.failed) return false;
  if (s.jobs.some((j) => j.facility === id && j.takesOffline)) return false;
  if (hasMod(s, "loadShed", id)) return false;
  return true;
}

export function facilityDemandKw(s: GameState, id: FacilityId): number {
  if (id === "power") return 0;
  if (!isOperable(s, id)) return 0;
  return CONFIG.demandKw[id] + modSum(s, "extraDemand", id);
}

export function crewEfficiency(wellbeing: number, workload: number): number {
  const base = 0.6 + 0.4 * (wellbeing / 100);
  return workload > 90 ? base * 0.8 : base;
}

interface Labor {
  operations: number;
  maintenance: number;
  research: number;
  hydroponics: number;
}

export function computeLabor(s: GameState, hour: number): Labor {
  const labor: Labor = { operations: 0, maintenance: 0, research: 0, hydroponics: 0 };
  const sheltered = hasMod(s, "shelter");
  if (isSleepHour(hour)) return labor;
  for (const c of s.crew) {
    if (c.task === "rest") continue;
    if (sheltered && (c.task === "research" || c.task === "hydroponics")) continue;
    const eff = crewEfficiency(c.wellbeing, c.workload) * (c.task === c.specialty ? CONFIG.specialtyBonus : 1);
    labor[c.task as Exclude<CrewTask, "rest">] += eff;
  }
  return labor;
}

/** Number of crew assigned to a task (ignores sleep) — used for continuous effects like hydroponic tending. */
function assignedEff(s: GameState, task: CrewTask): number {
  return s.crew
    .filter((c) => c.task === task)
    .reduce((sum, c) => sum + crewEfficiency(c.wellbeing, c.workload) * (c.task === c.specialty ? CONFIG.specialtyBonus : 1), 0);
}

export function stepHour(input: GameState): GameState {
  if (input.status === "ended") return input;
  const s = clone(input);
  const sc = getScenario(s.scenarioId);
  const rng = new Rng(s.rngState);
  const h = s.hour;
  const crewN = s.crew.length;

  const prod: Record<ResourceId, number> = { oxygen: 0, water: 0, food: 0, energy: 0, spares: 0, sciSupplies: 0 };
  const cons: Record<ResourceId, number> = { oxygen: 0, water: 0, food: 0, energy: 0, spares: 0, sciSupplies: 0 };

  // ── 1. POWER ────────────────────────────────────────────────────────────
  const pf = s.facilities.power;
  const illumination = Math.max(0, Math.min(1, illuminationAt(sc, h) * modProduct(s, "solarMultiplier")));
  const powerOperable = isOperable(s, "power");
  const dustFactor = 1 - (pf.dust / 100) * CONFIG.dustSolarLossAt100;
  const powerEff = powerOperable ? conditionFactor(pf.condition) * modProduct(s, "facilityEfficiency", "power") : 0;
  const solarKw = CONFIG.solarCapacityKw * illumination * dustFactor * powerEff;

  const battery = s.resources.energy;
  const floorKwh = s.batteryFloor * CONFIG.batteryCapacityKwh;
  const maxOutAll = Math.min(CONFIG.maxDischargeKw, battery * CONFIG.dischargeEfficiency);
  const maxOutAboveFloor = Math.min(CONFIG.maxDischargeKw, Math.max(0, battery - floorKwh) * CONFIG.dischargeEfficiency);

  let solarLeft = solarKw;
  let battOut = 0;
  const draw = (need: number, battLimit: number): number => {
    const fromSolar = Math.min(need, solarLeft);
    solarLeft -= fromSolar;
    const fromBatt = Math.min(need - fromSolar, Math.max(0, battLimit - battOut));
    battOut += fromBatt;
    return fromSolar + fromBatt;
  };

  // Fixed overhead (array drives, avionics) is always served first.
  const overheadSupplied = draw(CONFIG.powerOverheadKw, maxOutAll);
  let totalDemand = CONFIG.powerOverheadKw;
  let totalSupplied = overheadSupplied;

  const fraction: Record<FacilityId, number> = { habitat: 0, power: 1, oxygen: 0, water: 0, food: 0, lab: 0, comms: 0, storage: 0 };
  s.priorities.forEach((cat, idx) => {
    const members = FACILITY_IDS.filter((f) => f !== "power" && CONFIG.categoryOf[f] === cat);
    const need = members.reduce((sum, f) => sum + facilityDemandKw(s, f), 0);
    totalDemand += need;
    const got = need > 0 ? draw(need, idx === 0 ? maxOutAll : maxOutAboveFloor) : 0;
    totalSupplied += got;
    const frac = need > 0 ? got / need : 1;
    for (const f of members) fraction[f] = isOperable(s, f) ? frac : 0;
  });

  const chargeKw = Math.min(solarLeft, CONFIG.maxChargeKw);
  s.resources.energy = battery - battOut / CONFIG.dischargeEfficiency + chargeKw * CONFIG.chargeEfficiency;
  prod.energy = chargeKw * CONFIG.chargeEfficiency;
  cons.energy = battOut / CONFIG.dischargeEfficiency;
  clampResource(s, "energy");

  const deficitKw = Math.max(0, totalDemand - totalSupplied);
  s.power = {
    illumination,
    solarKw,
    demandKw: totalDemand,
    suppliedKw: totalSupplied,
    batteryFlowKw: chargeKw * CONFIG.chargeEfficiency - battOut / CONFIG.dischargeEfficiency,
    deficitKw,
    overheadKw: CONFIG.powerOverheadKw,
  };
  s.stats.energyShortfallKwh += deficitKw;

  // ── 2. FACILITY EFFICIENCY ──────────────────────────────────────────────
  const eff: Record<FacilityId, number> = { habitat: 0, power: powerEff, oxygen: 0, water: 0, food: 0, lab: 0, comms: 0, storage: 0 };
  for (const id of FACILITY_IDS) {
    const f = s.facilities[id];
    if (id === "power") {
      f.powerFraction = powerOperable ? 1 : 0;
      f.efficiency = powerEff * dustFactor;
      f.drawKw = 0;
      continue;
    }
    f.powerFraction = fraction[id];
    f.drawKw = facilityDemandKw(s, id) * fraction[id];
    eff[id] = isOperable(s, id) ? fraction[id] * conditionFactor(f.condition) * modProduct(s, "facilityEfficiency", id) : 0;
    f.efficiency = eff[id];
  }

  // ── 3. CREW LABOR ───────────────────────────────────────────────────────
  const labor = computeLabor(s, h);

  // ── 4. CABIN ENVIRONMENT ────────────────────────────────────────────────
  const hab = s.habitat;
  const hE = Math.min(1, eff.habitat);
  const co2Gen = CONFIG.co2GenPerCrewHour * crewN;
  const co2Removal = CONFIG.co2RemovalMax * hE * modProduct(s, "co2Removal");
  hab.co2 = Math.max(CONFIG.co2Floor, hab.co2 + co2Gen - co2Removal);

  const tempError = CONFIG.targetTemperature - hab.temperature;
  hab.temperature += Math.sign(tempError) * Math.min(Math.abs(tempError), CONFIG.tempRecoveryPerHour * hE);
  hab.temperature -= CONFIG.tempLossPerHourUnpowered * (1 - Math.min(1, s.facilities.habitat.powerFraction * (isOperable(s, "habitat") ? 1 : 0)));
  hab.temperature = Math.max(-20, Math.min(40, hab.temperature));

  const leak = CONFIG.baseLeakKpaPerHour * (1 + (100 - s.facilities.habitat.condition) / 50) + modSum(s, "leakRate");
  hab.pressure -= leak;
  const pressureGap = Math.max(0, CONFIG.nominalPressure - hab.pressure);
  let makeup = Math.min(pressureGap, CONFIG.makeupKpaPerHour * hE);
  const makeupO2 = makeup * CONFIG.makeupO2PerKpa;
  if (makeupO2 > s.resources.oxygen) makeup = s.resources.oxygen / CONFIG.makeupO2PerKpa;
  hab.pressure += makeup;
  s.resources.oxygen -= makeup * CONFIG.makeupO2PerKpa;
  cons.oxygen += makeup * CONFIG.makeupO2PerKpa;

  // ── 5a. OXYGEN ──────────────────────────────────────────────────────────
  const o2Use = (CONFIG.o2PerCrewDay / 24) * crewN;
  const o2Spec = RESOURCES.oxygen;
  let o2Gen = CONFIG.o2GenMaxPerHour * eff.oxygen;
  // Cannot overfill the tank, and cannot electrolyze water we don't have.
  o2Gen = Math.min(o2Gen, Math.max(0, o2Spec.capacity - s.resources.oxygen + o2Use));
  o2Gen = Math.min(o2Gen, s.resources.water / CONFIG.waterPerKgO2);
  const electrolysisWater = o2Gen * CONFIG.waterPerKgO2;
  s.resources.water -= electrolysisWater;
  cons.water += electrolysisWater;
  s.resources.oxygen += o2Gen - o2Use;
  prod.oxygen += o2Gen;
  cons.oxygen += o2Use;
  s.stats.oxygenProducedKg += o2Gen;
  clampResource(s, "oxygen");

  // ── 5b. WATER ───────────────────────────────────────────────────────────
  const waterUse = Math.min(
    s.resources.water,
    (CONFIG.waterPerCrewDay / 24) * crewN * (s.policies.waterConservation ? CONFIG.conservationWaterFactor : 1),
  );
  s.resources.water -= waterUse;
  cons.water += waterUse;
  s.stats.waterUsedKg += waterUse;
  s.wastewater += waterUse * CONFIG.wastewaterReturnFraction;
  s.stats.waterLostKg += waterUse * (1 - CONFIG.wastewaterReturnFraction);

  const hydroWaterWanted = CONFIG.hydroWaterPerHour * Math.min(1, eff.food);
  const hydroWater = Math.min(hydroWaterWanted, s.resources.water);
  s.resources.water -= hydroWater;
  cons.water += hydroWater;
  s.wastewater += hydroWater * CONFIG.hydroCondensateReturn;
  s.stats.waterLostKg += hydroWater * (1 - CONFIG.hydroCondensateReturn);

  const processed = Math.min(s.wastewater, CONFIG.wrsThroughputPerHour * eff.water);
  s.wastewater -= processed;
  const recovered = processed * CONFIG.wrsRecoveryFraction;
  s.resources.water += recovered;
  prod.water += recovered;
  s.stats.waterRecoveredKg += recovered;
  s.stats.waterLostKg += processed - recovered;
  if (s.wastewater > CONFIG.wastewaterTankCapacity) {
    const overflow = s.wastewater - CONFIG.wastewaterTankCapacity;
    s.stats.waterLostKg += overflow;
    s.wastewater = CONFIG.wastewaterTankCapacity;
  }
  clampResource(s, "water");

  // ── 5c. FOOD ────────────────────────────────────────────────────────────
  const foodUse = Math.min(
    s.resources.food,
    (CONFIG.foodPerCrewDay / 24) * crewN * (s.policies.foodRationing ? CONFIG.rationingFoodFactor : 1),
  );
  s.resources.food -= foodUse;
  cons.food += foodUse;
  const waterFactor = hydroWaterWanted > 0 ? hydroWater / hydroWaterWanted : 1;
  const waterStress = s.resources.water <= RESOURCES.water.critical ? 0.4 : 1; // crops throttled when water is critical
  const tending = CONFIG.hydroBaseTending + (1 - CONFIG.hydroBaseTending) * Math.min(1, assignedEff(s, "hydroponics"));
  const grown = CONFIG.foodGenMaxPerHour * eff.food * waterFactor * waterStress * tending;
  s.resources.food += grown;
  prod.food += grown;
  s.stats.foodGrownKg += grown;
  const storageSpoil = CONFIG.storageSpoilagePerHour * (1 - Math.min(1, eff.storage));
  const spoilFraction = storageSpoil + modSum(s, "foodSpoilage");
  const spoiled = s.resources.food * spoilFraction;
  s.resources.food -= spoiled;
  cons.food += spoiled;
  s.stats.foodSpoiledKg += spoiled;
  clampResource(s, "food");

  // ── 6. SCIENCE & COMMS ──────────────────────────────────────────────────
  if (labor.research > 0 && eff.lab > 0 && !hasMod(s, "shelter")) {
    let points = labor.research * CONFIG.researchPerCrewHour * Math.min(1, eff.lab) * (1 + modSum(s, "researchBonus"));
    const suppliesNeeded = points * CONFIG.suppliesPerPoint;
    if (suppliesNeeded > s.resources.sciSupplies) points = s.resources.sciSupplies / CONFIG.suppliesPerPoint;
    const before = Math.floor(s.science.points / 25);
    s.science.points += points;
    s.science.dataMb += points * CONFIG.mbPerPoint;
    s.resources.sciSupplies -= points * CONFIG.suppliesPerPoint;
    cons.sciSupplies += points * CONFIG.suppliesPerPoint;
    clampResource(s, "sciSupplies");
    const after = Math.floor(s.science.points / 25);
    if (after > before) log(s, "science", `Science milestone: ${after * 25} research points`, "Laboratory results are queued for downlink.", "advisory");
  }
  const commsDust = s.facilities.comms.dust;
  const quality = Math.max(0, Math.min(1, eff.comms * modProduct(s, "commsQuality", "comms") * (1 - commsDust / 200)));
  s.science.linkQuality = quality;
  if (quality >= CONFIG.linkDownThreshold) {
    const backlog = s.science.dataMb - s.science.downlinkedMb;
    s.science.downlinkedMb += Math.min(backlog, CONFIG.downlinkMbPerHour * quality);
  }

  // ── 7. WEAR, DUST, FAILURES ─────────────────────────────────────────────
  const opsReduction = Math.min(CONFIG.opsWearReductionMax, CONFIG.opsWearReductionPerCrew * labor.operations);
  for (const id of FACILITY_IDS) {
    const f = s.facilities[id];
    const running = id === "power" ? powerOperable : isOperable(s, id) && f.powerFraction > 0;
    if (running) {
      f.condition -= CONFIG.wearPerHour[id] * modProduct(s, "wearMultiplier", id) * (1 - opsReduction);
    }
    const dustRate = CONFIG.dustPerHour[id];
    if (dustRate) f.dust = Math.min(100, f.dust + dustRate);
    f.condition = Math.max(0, f.condition);
    if (!f.failed) {
      if (f.condition <= 0) failFacility(s, id, "Condition reached zero.");
      else if (running && f.condition < CONFIG.failureThreshold) {
        const p = CONFIG.failureChanceAtZero * (1 - f.condition / CONFIG.failureThreshold);
        if (rng.next() < p) failFacility(s, id, `Worn component failed at ${Math.round(f.condition)}% condition.`);
      }
    }
  }

  // ── 8. MAINTENANCE JOBS ─────────────────────────────────────────────────
  let maint = labor.maintenance;
  const evaBlocked = hasMod(s, "shelter") || hasMod(s, "evaHold");
  for (const job of [...s.jobs]) {
    if (maint <= 0) break;
    if (job.eva && evaBlocked) continue;
    const work = Math.min(maint, job.laborTotal - job.laborDone);
    job.laborDone += work;
    maint -= work;
    if (job.laborDone >= job.laborTotal - 1e-9) {
      s.jobs = s.jobs.filter((j) => j.id !== job.id);
      for (const e of job.effects) applyJobEffect(s, e);
      if (job.kind === "repair") s.stats.repairsCompleted += 1;
      if (job.kind === "service") s.stats.servicesCompleted += 1;
      log(s, "repair", `Completed: ${job.label}`, job.facility ? `${facilityName(job.facility)} condition ${Math.round(s.facilities[job.facility].condition)}%.` : undefined, "advisory");
    }
  }

  // ── 9. CREW WORKLOAD & WELLBEING ────────────────────────────────────────
  const sleeping = isSleepHour(h);
  const sheltered = hasMod(s, "shelter");
  const envStress =
    (temperatureLevel(hab.temperature) !== "nominal" ? 0.3 : 0) + (LEVEL_RANK[co2Level(hab.co2)] >= 1 ? 0.3 : 0);
  for (const c of s.crew) {
    if (sleeping) c.workload -= CONFIG.workloadSleepRecovery;
    else if (c.task === "rest" || (sheltered && (c.task === "research" || c.task === "hydroponics"))) c.workload -= CONFIG.workloadRestRecovery;
    else c.workload += CONFIG.workloadGainPerHour;
    c.workload = Math.max(0, Math.min(100, c.workload));
    let dw = c.workload < 60 ? 0.25 : c.workload > 85 ? -0.5 : 0;
    dw -= envStress;
    if (s.policies.foodRationing) dw -= 0.08;
    if (s.policies.waterConservation) dw -= 0.05;
    if (s.resources.food <= 0) dw -= 1;
    c.wellbeing = Math.max(0, Math.min(100, c.wellbeing + dw));
  }

  // ── 10. RESUPPLY, MODIFIERS, STATS ──────────────────────────────────────
  if (s.resupply && !s.resupply.delivered && h + 1 >= s.resupply.hour) {
    s.resupply.delivered = true;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(s.resupply.cargo) as [ResourceId, number][]) {
      if (!v) continue;
      const before = s.resources[k];
      s.resources[k] += v;
      clampResource(s, k);
      prod[k] += s.resources[k] - before;
      parts.push(`${k === "sciSupplies" ? "science kits" : RESOURCES[k].label.toLowerCase()} +${Math.round(s.resources[k] - before)}`);
    }
    log(s, "resupply", "Cargo lander delivered", parts.join(", ") + ". Anything beyond storage capacity was left on the lander.", "advisory");
  }

  for (const m of s.modifiers) if (m.hoursRemaining !== null) m.hoursRemaining -= 1;
  s.modifiers = s.modifiers.filter((m) => m.hoursRemaining === null || m.hoursRemaining > 0);

  for (const r of RESOURCE_IDS) {
    clampResource(s, r);
    s.rates[r] = { production: prod[r], consumption: cons[r] };
    s.stats.minReserves[r] = Math.min(s.stats.minReserves[r], s.resources[r]);
  }

  const envLevel = worst(pressureLevel(hab.pressure), temperatureLevel(hab.temperature), co2Level(hab.co2));
  if (LEVEL_RANK[envLevel] <= 1 && s.resources.oxygen > 0 && s.resources.water > 0) s.stats.hoursLifeSupportOk += 1;

  // Alerts when a status gets worse.
  const watch: [string, string, StatusLevel][] = [
    ...(["oxygen", "water", "food", "energy"] as ResourceId[]).map(
      (r): [string, string, StatusLevel] => [r, RESOURCES[r].label, levelForAmount(RESOURCES[r], s.resources[r])],
    ),
    ["pressure", "Cabin pressure", pressureLevel(hab.pressure)],
    ["temperature", "Cabin temperature", temperatureLevel(hab.temperature)],
    ["co2", "Cabin CO₂", co2Level(hab.co2)],
  ];
  for (const [key, label, lvl] of watch) {
    const prev = s.lastStatus[key] ?? "nominal";
    if (LEVEL_RANK[lvl] > LEVEL_RANK[prev] && LEVEL_RANK[lvl] >= 2) {
      log(s, "alert", `${label} ${lvl.toUpperCase()}`, undefined, lvl === "critical" ? "critical" : "warning");
    }
    s.lastStatus[key] = lvl;
  }

  // Abort conditions.
  const streak = (key: string, on: boolean) => {
    s.stats.criticalStreaks[key] = on ? (s.stats.criticalStreaks[key] ?? 0) + 1 : 0;
    return s.stats.criticalStreaks[key] >= CONFIG.abortHours[key];
  };
  const aborts: [boolean, string][] = [
    [streak("oxygenEmpty", s.resources.oxygen <= 0), "Oxygen reserves were exhausted for 6 hours."],
    [streak("waterEmpty", s.resources.water <= 0), "Water reserves were exhausted for 24 hours."],
    [streak("foodEmpty", s.resources.food <= 0), "Food reserves were exhausted for 48 hours."],
    [streak("co2Critical", co2Level(hab.co2) === "critical"), "Cabin CO₂ stayed in the CRITICAL band for 12 hours."],
    [streak("temperatureCritical", temperatureLevel(hab.temperature) === "critical"), "Cabin temperature stayed in the CRITICAL band for 12 hours."],
    [streak("pressureCritical", pressureLevel(hab.pressure) === "critical"), "Cabin pressure stayed in the CRITICAL band for 6 hours."],
  ];

  s.hour = h + 1;
  s.rngState = rng.state;

  const abort = aborts.find(([hit]) => hit);
  if (abort) {
    endMission(s, abort[1], true);
    pushSnapshot(s);
    return s;
  }

  // ── 11. OBJECTIVES, EVENTS, END ─────────────────────────────────────────
  updateObjectives(s);

  if (s.pendingEvent && s.hour >= s.pendingEvent.deadlineHour) {
    const def = getEventDef(s.pendingEvent.defId);
    resolvePendingEvent(s, def?.defaultOption ?? "", true);
  }

  if (!s.pendingEvent && s.hour < sc.durationHours) maybeTriggerEvent(s, rng);
  s.rngState = rng.state;

  pushSnapshot(s);

  if (s.hour >= sc.durationHours) endMission(s, "Planned mission duration completed.", false);
  return s;
}

function maybeTriggerEvent(s: GameState, rng: Rng) {
  const sc = getScenario(s.scenarioId);
  const scripted = sc.scriptedEvents.find((e) => e.hour <= s.hour && !s.scriptedFired.includes(`${e.defId}@${e.hour}`));
  if (scripted) {
    const def = getEventDef(scripted.defId);
    s.scriptedFired.push(`${scripted.defId}@${scripted.hour}`);
    if (def) {
      triggerEvent(s, def);
      s.eventCooldownUntil = s.hour + sc.eventMinGapHours;
      return;
    }
  }
  if (s.hour < s.eventCooldownUntil || sc.eventChancePerHour <= 0) return;
  // Keep the final hours quiet so the player isn't punished by a last-minute coin flip.
  if (s.hour > sc.durationHours - 6) return;
  if (rng.next() >= sc.eventChancePerHour) return;
  const count = (id: string) => s.eventHistory.filter((e) => e.defId === id).length;
  const eligible = EVENTS.filter(
    (e) =>
      e.weight > 0 &&
      (!sc.allowedEvents || sc.allowedEvents.includes(e.id)) &&
      count(e.id) < e.maxOccurrences &&
      (s.eventLastSeen[e.id] === undefined || s.hour - s.eventLastSeen[e.id] >= e.cooldown) &&
      (!e.eligible || e.eligible(s)),
  );
  const def = rng.pickWeighted(eligible, (e) => e.weight);
  if (def) {
    triggerEvent(s, def);
    s.eventCooldownUntil = s.hour + sc.eventMinGapHours;
  }
}

function pushSnapshot(s: GameState) {
  s.history.push({
    h: s.hour,
    oxygen: +s.resources.oxygen.toFixed(2),
    water: +s.resources.water.toFixed(1),
    food: +s.resources.food.toFixed(2),
    energy: +s.resources.energy.toFixed(1),
    solarKw: +s.power.solarKw.toFixed(2),
    demandKw: +s.power.demandKw.toFixed(2),
    suppliedKw: +s.power.suppliedKw.toFixed(2),
    co2: +s.habitat.co2.toFixed(2),
    temperature: +s.habitat.temperature.toFixed(2),
    pressure: +s.habitat.pressure.toFixed(2),
    illumination: +s.power.illumination.toFixed(3),
  });
  if (s.history.length > 400) s.history.splice(0, s.history.length - 400);
}

export function endMission(s: GameState, reason: string, aborted: boolean) {
  if (s.status === "ended") return;
  s.status = "ended";
  s.endReason = reason;
  s.pendingEvent = null;
  finalizeObjectives(s, aborted);
  const ev = evaluateMission(s);
  s.outcome = ev.outcome;
  log(s, "end", aborted ? "Mission terminated — crew evacuation ordered" : "Mission complete", reason, aborted ? "critical" : "advisory");
}
