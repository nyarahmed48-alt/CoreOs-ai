/**
 * Core types for the LUNAR COMMAND simulation.
 *
 * Time unit: the whole engine runs on 1-hour ticks. Every rate in the config
 * is expressed per hour unless its name says otherwise (e.g. `perCrewDay`).
 *
 * The game state is plain JSON (no class instances, no functions) so it can be
 * saved to localStorage and restored verbatim.
 */

export type ResourceId = "oxygen" | "water" | "food" | "energy" | "spares" | "sciSupplies";

export const RESOURCE_IDS: ResourceId[] = ["oxygen", "water", "food", "energy", "spares", "sciSupplies"];

export type FacilityId = "habitat" | "power" | "water" | "oxygen" | "food" | "lab" | "comms" | "storage";

export const FACILITY_IDS: FacilityId[] = ["habitat", "power", "oxygen", "water", "food", "lab", "comms", "storage"];

/** Power priority groups the commander can reorder. */
export type PowerCategory = "lifeSupport" | "comms" | "research" | "food" | "general";

export type StatusLevel = "nominal" | "caution" | "warning" | "critical";

export type CrewTask = "operations" | "maintenance" | "research" | "hydroponics" | "rest";

export type FacilityStatus = "online" | "degraded" | "offline" | "failed" | "maintenance";

export type Severity = "advisory" | "caution" | "warning" | "critical";

export interface FacilityState {
  id: FacilityId;
  /** 0–100. Wears down with use; restored by service/repair jobs. */
  condition: number;
  /** Commander's on/off switch. */
  enabled: boolean;
  /** True after a failure; the facility produces nothing until repaired. */
  failed: boolean;
  /** 0–100 dust coverage. Only meaningful for external equipment (power, comms). */
  dust: number;
  /** Fraction of requested power delivered in the last hour (0–1). */
  powerFraction: number;
  /** Effective output multiplier in the last hour (0–1+). */
  efficiency: number;
  /** Power drawn in the last hour (kW). */
  drawKw: number;
}

export type ModifierKind =
  | "solarMultiplier" // multiplies solar output
  | "extraDemand" // adds kW of demand to a facility
  | "wearMultiplier" // multiplies wear on a facility
  | "commsQuality" // multiplies comms link quality
  | "facilityEfficiency" // multiplies a facility's output
  | "foodSpoilage" // fraction of stored food lost per hour
  | "leakRate" // extra cabin pressure loss (kPa/h)
  | "co2Removal" // multiplies CO2 removal capacity
  | "researchBonus" // adds a fraction to research output
  | "shelter" // crew in shielded area: no research, no EVA
  | "evaHold" // EVA jobs paused
  | "loadShed"; // facility temporarily powered down (no demand, no output)

export interface Modifier {
  id: string;
  kind: ModifierKind;
  target?: FacilityId;
  value: number;
  /** null = lasts until removed by a job or decision. */
  hoursRemaining: number | null;
  label: string;
  /** Groups modifiers so a job or decision can remove/adjust them together. */
  source: string;
}

export type JobEffect =
  | { type: "restoreCondition"; facility: FacilityId; amount: number; clearFailure: boolean }
  | { type: "reduceDust"; facility: FacilityId; amount: number }
  | { type: "removeModifiers"; source: string }
  | { type: "setModifierValue"; source: string; kind: ModifierKind; value: number };

export type JobKind = "service" | "repair" | "eva" | "task";

export interface Job {
  id: string;
  label: string;
  kind: JobKind;
  facility?: FacilityId;
  laborTotal: number;
  laborDone: number;
  /** Facility is taken offline while this job is in the queue. */
  takesOffline: boolean;
  /** EVA jobs pause during radiation shelter / EVA holds. */
  eva: boolean;
  effects: JobEffect[];
  createdHour: number;
  /** Parts spent when the job was created (refunded if cancelled before work starts). */
  partsSpent: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  specialty: CrewTask;
  task: CrewTask;
  /** 0–100. Rises while working, falls while resting/sleeping. */
  workload: number;
  /** 0–100 gameplay wellbeing indicator (not a medical measure). */
  wellbeing: number;
}

export interface HabitatEnv {
  /** Cabin pressure, kPa. */
  pressure: number;
  /** Cabin air temperature, °C. */
  temperature: number;
  /** CO2 partial pressure, mmHg. */
  co2: number;
}

export interface PowerSnapshot {
  illumination: number;
  solarKw: number;
  demandKw: number;
  suppliedKw: number;
  /** + charging, – discharging (kW at the battery terminals). */
  batteryFlowKw: number;
  deficitKw: number;
  overheadKw: number;
}

export interface Rates {
  production: number;
  consumption: number;
}

export type TimelineKind =
  | "start"
  | "event"
  | "decision"
  | "objective"
  | "failure"
  | "repair"
  | "science"
  | "resupply"
  | "alert"
  | "system"
  | "end";

export interface TimelineEntry {
  id: string;
  hour: number;
  kind: TimelineKind;
  title: string;
  detail?: string;
  severity: Severity;
}

export interface PendingEvent {
  defId: string;
  triggeredHour: number;
  deadlineHour: number;
}

export interface EventRecord {
  defId: string;
  title: string;
  hour: number;
  severity: Severity;
  optionId?: string;
  optionLabel?: string;
  resolvedHour?: number;
  auto: boolean;
}

export interface Snapshot {
  h: number;
  oxygen: number;
  water: number;
  food: number;
  energy: number;
  solarKw: number;
  demandKw: number;
  suppliedKw: number;
  co2: number;
  temperature: number;
  pressure: number;
  illumination: number;
}

export interface ObjectiveProgress {
  completed: boolean;
  completedHour?: number;
  failed?: boolean;
}

export interface MissionStats {
  hoursLifeSupportOk: number;
  failures: number;
  repairsCompleted: number;
  servicesCompleted: number;
  energyShortfallKwh: number;
  foodSpoiledKg: number;
  waterUsedKg: number;
  waterRecoveredKg: number;
  waterLostKg: number;
  oxygenProducedKg: number;
  foodGrownKg: number;
  exposureIndex: number;
  minReserves: Record<ResourceId, number>;
  /** Consecutive hours each abort condition has held. */
  criticalStreaks: Record<string, number>;
}

export type MissionOutcome = "accomplished" | "limited" | "unsuccessful";

export interface Resupply {
  hour: number;
  delivered: boolean;
  cargo: Partial<Record<ResourceId, number>>;
}

export interface GameState {
  version: number;
  scenarioId: string;
  seed: number;
  rngState: number;
  hour: number;
  status: "active" | "ended";
  outcome?: MissionOutcome;
  endReason?: string;
  resources: Record<ResourceId, number>;
  wastewater: number;
  rates: Record<ResourceId, Rates>;
  power: PowerSnapshot;
  facilities: Record<FacilityId, FacilityState>;
  priorities: PowerCategory[];
  /** Battery fraction (0–0.6) reserved for the top power priority only. */
  batteryFloor: number;
  policies: { waterConservation: boolean; foodRationing: boolean };
  crew: CrewMember[];
  habitat: HabitatEnv;
  modifiers: Modifier[];
  jobs: Job[];
  pendingEvent: PendingEvent | null;
  eventCooldownUntil: number;
  eventHistory: EventRecord[];
  eventLastSeen: Record<string, number>;
  scriptedFired: string[];
  science: { points: number; dataMb: number; downlinkedMb: number; linkQuality: number };
  resupply: Resupply | null;
  stats: MissionStats;
  objectives: Record<string, ObjectiveProgress>;
  timeline: TimelineEntry[];
  history: Snapshot[];
  lastStatus: Record<string, StatusLevel>;
  tutorialSteps: string[];
  nextId: number;
}
