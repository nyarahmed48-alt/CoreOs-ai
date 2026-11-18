import { CONFIG, RESOURCES, SAVE_VERSION } from "./config";
import { illuminationAt } from "./illumination";
import { log } from "./mutators";
import { getScenario } from "./scenarios";
import { FACILITY_IDS, RESOURCE_IDS, type CrewMember, type FacilityState, type GameState, type ResourceId } from "./types";

export const DEFAULT_CREW: Omit<CrewMember, "workload" | "wellbeing">[] = [
  { id: "c1", name: "Mira Castellanos", role: "Flight Engineer", specialty: "maintenance", task: "maintenance" },
  { id: "c2", name: "Kenji Watanabe-Hale", role: "Science Officer", specialty: "research", task: "research" },
  { id: "c3", name: "Amara Okoye", role: "Life Support Specialist", specialty: "operations", task: "operations" },
  { id: "c4", name: "Tomas Lindqvist", role: "Habitat & Botany Specialist", specialty: "hydroponics", task: "hydroponics" },
];

export function createMission(scenarioId: string, seed: number): GameState {
  const sc = getScenario(scenarioId);
  const facilities = Object.fromEntries(
    FACILITY_IDS.map((id): [string, FacilityState] => [
      id,
      {
        id,
        condition: sc.startCondition[id] ?? 90,
        enabled: true,
        failed: false,
        dust: id === "power" ? 6 : id === "comms" ? 4 : 0,
        powerFraction: 1,
        efficiency: 1,
        drawKw: CONFIG.demandKw[id],
      },
    ]),
  ) as GameState["facilities"];

  const resources = { ...sc.startResources };
  const zeroRates = Object.fromEntries(RESOURCE_IDS.map((r) => [r, { production: 0, consumption: 0 }])) as GameState["rates"];

  const s: GameState = {
    version: SAVE_VERSION,
    scenarioId,
    seed,
    rngState: seed >>> 0,
    hour: 0,
    status: "active",
    resources,
    wastewater: 8,
    rates: zeroRates,
    power: { illumination: illuminationAt(sc, 0), solarKw: 0, demandKw: 0, suppliedKw: 0, batteryFlowKw: 0, deficitKw: 0, overheadKw: CONFIG.powerOverheadKw },
    facilities,
    priorities: ["lifeSupport", "comms", "food", "research", "general"],
    batteryFloor: 0.2,
    policies: { waterConservation: false, foodRationing: false },
    crew: DEFAULT_CREW.map((c, i) => ({ ...c, workload: 10 + i * 5, wellbeing: 88 - i * 2 })),
    habitat: { pressure: CONFIG.nominalPressure, temperature: CONFIG.targetTemperature, co2: 2.4 },
    modifiers: [],
    jobs: [],
    pendingEvent: null,
    eventCooldownUntil: sc.firstRandomEventHour,
    eventHistory: [],
    eventLastSeen: {},
    scriptedFired: [],
    science: { points: 0, dataMb: 0, downlinkedMb: 0, linkQuality: 1 },
    resupply: sc.resupply ? { hour: sc.resupply.hour, delivered: false, cargo: { ...sc.resupply.cargo } } : null,
    stats: {
      hoursLifeSupportOk: 0,
      failures: 0,
      repairsCompleted: 0,
      servicesCompleted: 0,
      energyShortfallKwh: 0,
      foodSpoiledKg: 0,
      waterUsedKg: 0,
      waterRecoveredKg: 0,
      waterLostKg: 0,
      oxygenProducedKg: 0,
      foodGrownKg: 0,
      exposureIndex: 0,
      minReserves: { ...resources } as Record<ResourceId, number>,
      criticalStreaks: {},
    },
    objectives: Object.fromEntries(sc.objectives.map((o) => [o.id, { completed: false }])),
    timeline: [],
    history: [],
    lastStatus: {},
    tutorialSteps: [],
    nextId: 0,
  };
  for (const id of RESOURCE_IDS) {
    s.resources[id] = Math.min(s.resources[id], id === "energy" ? CONFIG.batteryCapacityKwh : RESOURCES[id].capacity);
  }
  log(s, "start", `${sc.codename} mission start`, `${sc.name}: ${sc.summary}`, "advisory");
  return s;
}
