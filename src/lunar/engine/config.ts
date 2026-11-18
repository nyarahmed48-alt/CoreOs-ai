/**
 * SIMULATION CONFIGURATION
 *
 * Every tunable assumption lives here so the model can be adjusted without
 * touching the engine. All rates are PER HOUR unless the name says otherwise.
 *
 * Provenance of each number is recorded in `source`:
 *   - "reference": taken from (or rounded from) a cited public source — see
 *     src/lunar/science/sources.ts.
 *   - "physics":   follows from basic chemistry/physics.
 *   - "gameplay":  an illustrative value chosen for playability. These are NOT
 *     real lunar-base engineering specifications or human safety limits.
 */
import type { CrewTask, FacilityId, PowerCategory, ResourceId, StatusLevel } from "./types";

export const SAVE_VERSION = 1;

export const HOURS_PER_DAY = 24;
/** Synodic month ≈ 29.53 Earth days — one full lunar day/night cycle. */
export const LUNAR_SYNODIC_HOURS = 29.53 * 24;

export interface Assumption {
  key: string;
  label: string;
  value: number | string;
  unit: string;
  source: "reference" | "physics" | "gameplay";
  sourceId?: string;
  note?: string;
}

export const CONFIG = {
  crewSize: 4,

  // ── Crew metabolic / consumable rates ─────────────────────────────────
  o2PerCrewDay: 0.82, // kg — ≈ BVAD nominal metabolic O2 consumption
  waterPerCrewDay: 4.0, // kg — gameplay (drinking, food prep, hygiene; real use varies widely)
  foodPerCrewDay: 1.6, // kg — gameplay (stored food incl. some packaging)
  conservationWaterFactor: 0.8,
  rationingFoodFactor: 0.85,

  // ── Oxygen generation (water electrolysis) ────────────────────────────
  o2GenMaxPerHour: 0.16, // kg O2/h at full power and health — gameplay
  /** Mass of water split per kg of O2: H2O molar mass 18 / O 16 = 1.125. */
  waterPerKgO2: 1.125, // physics

  // ── Water recovery ────────────────────────────────────────────────────
  wrsThroughputPerHour: 1.4, // kg wastewater processed per hour — gameplay
  wrsRecoveryFraction: 0.93, // ≈ ISS before the Brine Processor (93–94%)
  wastewaterReturnFraction: 0.95, // fraction of used water that reaches the wastewater tank — gameplay
  wastewaterTankCapacity: 60, // kg; overflow is lost — gameplay

  // ── Food production (hydroponics) ─────────────────────────────────────
  foodGenMaxPerHour: 0.045, // kg/h edible biomass — gameplay, deliberately a small supplement
  hydroWaterPerHour: 0.08, // kg/h
  hydroCondensateReturn: 0.85, // transpired water recovered as condensate — gameplay
  hydroBaseTending: 0.7, // output fraction with no crew tending
  storageSpoilagePerHour: 0.004, // fraction of food lost per hour when storage is unpowered/failed

  // ── Power system ──────────────────────────────────────────────────────
  solarCapacityKw: 22, // vertical sun-tracking arrays — gameplay
  batteryCapacityKwh: 240,
  maxDischargeKw: 14,
  maxChargeKw: 12,
  chargeEfficiency: 0.95,
  dischargeEfficiency: 0.95,
  powerOverheadKw: 0.5, // array drives, inverters, avionics — always on
  dustSolarLossAt100: 0.8, // 100% dust coverage removes 80% of output — gameplay

  demandKw: {
    habitat: 3.6, // thermal control, air revitalization, lighting
    power: 0,
    oxygen: 3.2,
    water: 1.2,
    food: 2.8, // LED grow lights & pumps
    lab: 2.4,
    comms: 0.7,
    storage: 0.6,
  } as Record<FacilityId, number>,

  categoryOf: {
    habitat: "lifeSupport",
    oxygen: "lifeSupport",
    water: "lifeSupport",
    comms: "comms",
    lab: "research",
    food: "food",
    storage: "general",
    power: "general",
  } as Record<FacilityId, PowerCategory>,

  // ── Wear & failure ────────────────────────────────────────────────────
  wearPerHour: {
    habitat: 0.08,
    power: 0.06,
    oxygen: 0.12,
    water: 0.12,
    food: 0.1,
    lab: 0.06,
    comms: 0.05,
    storage: 0.05,
  } as Record<FacilityId, number>,
  dustPerHour: { power: 0.12, comms: 0.05 } as Partial<Record<FacilityId, number>>,
  failureThreshold: 30, // below this condition, random failures can occur
  failureChanceAtZero: 0.03, // per-hour chance scaled linearly below threshold
  opsWearReductionPerCrew: 0.12,
  opsWearReductionMax: 0.3,

  // ── Cabin environment ─────────────────────────────────────────────────
  nominalPressure: 101.3, // kPa, sea-level-like (as on ISS)
  baseLeakKpaPerHour: 0.01,
  makeupKpaPerHour: 0.6,
  makeupO2PerKpa: 0.35, // kg — simplification: makeup gas drawn from O2 stores
  targetTemperature: 22,
  tempRecoveryPerHour: 1.5,
  tempLossPerHourUnpowered: 0.8, // °C/h with no thermal control — gameplay
  co2GenPerCrewHour: 0.12, // mmHg/h rise per crew member in a closed cabin — gameplay
  co2RemovalMax: 0.9, // mmHg/h at full scrubber capacity — gameplay
  co2Floor: 2.0,

  // ── Crew ──────────────────────────────────────────────────────────────
  /** Station clock time when the mission starts (hour 0). */
  startClockHour: 8,
  sleepStartHour: 22, // station clock hour
  sleepEndHour: 6,
  workloadGainPerHour: 5.5,
  workloadSleepRecovery: 10,
  workloadRestRecovery: 5,
  specialtyBonus: 1.25,

  // ── Science ───────────────────────────────────────────────────────────
  researchPerCrewHour: 1.0,
  suppliesPerPoint: 0.15,
  mbPerPoint: 25,
  downlinkMbPerHour: 300,
  linkDownThreshold: 0.15,

  // ── Jobs ──────────────────────────────────────────────────────────────
  service: { parts: 1, labor: 3, restore: 25 },
  repair: { parts: 3, labor: 8, restoreTo: 85 },
  repairThreshold: 40,

  // ── Abort rules (consecutive hours) ───────────────────────────────────
  abortHours: {
    oxygenEmpty: 6,
    waterEmpty: 24,
    foodEmpty: 48,
    co2Critical: 12,
    temperatureCritical: 12,
    pressureCritical: 6,
  } as Record<string, number>,
};

export type Config = typeof CONFIG;

export interface ResourceSpec {
  id: ResourceId;
  label: string;
  unit: string;
  capacity: number;
  /** Status thresholds: amount at or below → that level. */
  caution: number;
  warning: number;
  critical: number;
  /** Minimum reserve to hold at mission end (for the reserves objective). */
  minReserve: number;
  decimals: number;
}

export const RESOURCES: Record<ResourceId, ResourceSpec> = {
  oxygen: { id: "oxygen", label: "Oxygen", unit: "kg", capacity: 60, caution: 18, warning: 10, critical: 4, minReserve: 10, decimals: 1 },
  water: { id: "water", label: "Water", unit: "kg", capacity: 300, caution: 100, warning: 60, critical: 25, minReserve: 60, decimals: 0 },
  food: { id: "food", label: "Food", unit: "kg", capacity: 120, caution: 20, warning: 12, critical: 6, minReserve: 10, decimals: 1 },
  energy: { id: "energy", label: "Battery energy", unit: "kWh", capacity: 240, caution: 96, warning: 48, critical: 24, minReserve: 0, decimals: 0 },
  spares: { id: "spares", label: "Spare parts", unit: "units", capacity: 30, caution: 4, warning: 2, critical: -1, minReserve: 0, decimals: 0 },
  sciSupplies: { id: "sciSupplies", label: "Science supplies", unit: "kits", capacity: 40, caution: 8, warning: 4, critical: 1, minReserve: 0, decimals: 1 },
};

/** Gameplay bands for cabin environment. NOT human safety limits. */
export const ENV_BANDS = {
  pressure: { nominalMin: 99, cautionMin: 97, warningMin: 94 },
  temperature: { nominal: [18, 26], caution: [16, 28], warning: [12, 32] },
  co2: { nominalMax: 3, cautionMax: 5, warningMax: 8 },
} as const;

export function levelForAmount(spec: ResourceSpec, amount: number): StatusLevel {
  if (amount <= spec.critical) return "critical";
  if (amount <= spec.warning) return "warning";
  if (amount <= spec.caution) return "caution";
  return "nominal";
}

export function pressureLevel(p: number): StatusLevel {
  const b = ENV_BANDS.pressure;
  if (p >= b.nominalMin) return "nominal";
  if (p >= b.cautionMin) return "caution";
  if (p >= b.warningMin) return "warning";
  return "critical";
}

export function temperatureLevel(t: number): StatusLevel {
  const b = ENV_BANDS.temperature;
  const within = (r: readonly [number, number]) => t >= r[0] && t <= r[1];
  if (within(b.nominal)) return "nominal";
  if (within(b.caution)) return "caution";
  if (within(b.warning)) return "warning";
  return "critical";
}

export function co2Level(c: number): StatusLevel {
  const b = ENV_BANDS.co2;
  if (c <= b.nominalMax) return "nominal";
  if (c <= b.cautionMax) return "caution";
  if (c <= b.warningMax) return "warning";
  return "critical";
}

export const LEVEL_RANK: Record<StatusLevel, number> = { nominal: 0, caution: 1, warning: 2, critical: 3 };

export function worst(...levels: StatusLevel[]): StatusLevel {
  return levels.reduce((a, b) => (LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a), "nominal" as StatusLevel);
}

export const CATEGORY_LABELS: Record<PowerCategory, string> = {
  lifeSupport: "Life support",
  comms: "Communications",
  research: "Scientific research",
  food: "Food production",
  general: "General operations",
};

export const TASK_LABELS: Record<CrewTask, string> = {
  operations: "Systems operations",
  maintenance: "Maintenance & EVA",
  research: "Research",
  hydroponics: "Hydroponics",
  rest: "Rest",
};

/** Human-readable assumption table shown in the Science section. */
export const ASSUMPTIONS: Assumption[] = [
  { key: "tick", label: "Simulation time step", value: 1, unit: "hour", source: "gameplay", note: "Every rate is applied once per simulated hour." },
  { key: "o2", label: "Metabolic oxygen use", value: CONFIG.o2PerCrewDay, unit: "kg / crew / day", source: "reference", sourceId: "bvad", note: "Rounded from NASA's Baseline Values and Assumptions Document nominal value." },
  { key: "electrolysis", label: "Water split per kg of O₂", value: CONFIG.waterPerKgO2, unit: "kg", source: "physics", note: "2H₂O → 2H₂ + O₂; 36 g of water yields 32 g of O₂. Hydrogen recovery (e.g. Sabatier) is not modeled." },
  { key: "wrs", label: "Water recovery fraction", value: `${Math.round(CONFIG.wrsRecoveryFraction * 100)}%`, unit: "", source: "reference", sourceId: "iss-water-98", note: "Comparable to ISS before the Brine Processor Assembly (93–94%); ISS has since demonstrated 98%." },
  { key: "water", label: "Crew water use", value: CONFIG.waterPerCrewDay, unit: "kg / crew / day", source: "gameplay" },
  { key: "food", label: "Stored food use", value: CONFIG.foodPerCrewDay, unit: "kg / crew / day", source: "gameplay" },
  { key: "hydro", label: "Hydroponic output (max)", value: +(CONFIG.foodGenMaxPerHour * 24).toFixed(2), unit: "kg / day", source: "gameplay", note: "A small fresh-food supplement; early lunar outposts are expected to rely mostly on stored food." },
  { key: "solar", label: "Solar array capacity", value: CONFIG.solarCapacityKw, unit: "kW", source: "gameplay" },
  { key: "battery", label: "Battery capacity", value: CONFIG.batteryCapacityKwh, unit: "kWh", source: "gameplay" },
  { key: "pressure", label: "Cabin pressure set point", value: CONFIG.nominalPressure, unit: "kPa", source: "reference", sourceId: "nasa-std-3001", note: "Sea-level-like pressure, as maintained on ISS. Exploration habitats may use lower pressures." },
  { key: "bands", label: "Status bands (pressure, temperature, CO₂)", value: "see Life Support", unit: "", source: "gameplay", note: "Gameplay bands only. Real crew-health limits are set in NASA-STD-3001 and are not reproduced here." },
  { key: "makeup", label: "Leak make-up gas", value: CONFIG.makeupO2PerKpa, unit: "kg O₂ / kPa", source: "gameplay", note: "Simplification: real habitats replenish a nitrogen/oxygen mix." },
  { key: "dust", label: "Dust accumulation on arrays", value: CONFIG.dustPerHour.power ?? 0, unit: "% cover / hour", source: "gameplay", note: "Real dust deposition rates depend strongly on nearby activity (landings, rovers, EVAs)." },
  { key: "comms", label: "Earth–Moon one-way light time", value: "≈1.3", unit: "s", source: "physics", note: "Average distance ≈ 384,400 km ÷ speed of light. Not a gameplay factor." },
];
