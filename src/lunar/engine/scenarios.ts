/**
 * Mission scenarios. The site is a fictional outpost on a high-illumination
 * ridge near the lunar south pole. Real polar ridges see long periods of
 * sunlight broken by terrain shadowing that can be predicted from topography
 * (Mazarico et al., 2011). The specific shadow windows below are ILLUSTRATIVE,
 * not computed from real terrain data.
 */
import type { FacilityId, ResourceId } from "./types";

export type ObjectiveKind = "survive" | "lifeSupportUptime" | "research" | "downlink" | "reserves" | "repair" | "service";

export interface ObjectiveDef {
  id: string;
  kind: ObjectiveKind;
  title: string;
  description: string;
  target: number;
  primary: boolean;
  points: number;
}

export interface ShadowWindow {
  start: number;
  end: number;
  /** 1 = full shadow, 0.5 = half the array shadowed. */
  depth: number;
}

export interface Scenario {
  id: string;
  name: string;
  codename: string;
  difficulty: "Tutorial" | "Standard" | "Challenging";
  summary: string;
  durationHours: number;
  startResources: Record<ResourceId, number>;
  startCondition: Partial<Record<FacilityId, number>>;
  baseIllumination: number;
  shadows: ShadowWindow[];
  eventChancePerHour: number;
  eventMinGapHours: number;
  firstRandomEventHour: number;
  scriptedEvents: { hour: number; defId: string }[];
  /** Restrict random events to this list (tutorial keeps things gentle). */
  allowedEvents?: string[];
  resupply: { hour: number; cargo: Partial<Record<ResourceId, number>> } | null;
  objectives: ObjectiveDef[];
  guided: boolean;
}

const surviveObj = (hours: number): ObjectiveDef => ({
  id: "survive",
  kind: "survive",
  title: `Sustain operations for ${hours / 24} mission days`,
  description: "Keep the outpost habitable until the end of the planned mission without triggering an evacuation.",
  target: hours,
  primary: true,
  points: 30,
});

const uptimeObj = (pct: number): ObjectiveDef => ({
  id: "uptime",
  kind: "lifeSupportUptime",
  title: `Keep essential systems operational ≥ ${pct}% of the time`,
  description: "Cabin pressure, temperature and CO₂ held out of WARNING/CRITICAL bands, with oxygen and water available.",
  target: pct / 100,
  primary: true,
  points: 25,
});

export const SCENARIOS: Scenario[] = [
  {
    id: "tutorial",
    name: "Shakedown Cruise",
    codename: "SELENE-T",
    difficulty: "Tutorial",
    summary:
      "A guided 3-day systems check-out. Gentle events, generous reserves and step-by-step hints. Learn how power, life support and crew assignments connect.",
    durationHours: 72,
    startResources: { oxygen: 34, water: 200, food: 40, energy: 210, spares: 12, sciSupplies: 20 },
    startCondition: { habitat: 92, power: 95, oxygen: 85, water: 82, food: 88, lab: 90, comms: 94, storage: 35 },
    baseIllumination: 0.92,
    shadows: [{ start: 44, end: 50, depth: 0.8 }],
    eventChancePerHour: 0,
    eventMinGapHours: 12,
    firstRandomEventHour: 999,
    scriptedEvents: [
      { hour: 4, defId: "dust" },
      { hour: 22, defId: "experiment-power" },
      { hour: 38, defId: "terrain-shadow-forecast" },
      { hour: 56, defId: "wrs-filter" },
    ],
    resupply: null,
    objectives: [
      surviveObj(72),
      uptimeObj(90),
      { id: "research", kind: "research", title: "Complete the regolith baseline study", description: "Accumulate 25 research points in the laboratory.", target: 25, primary: false, points: 15 },
      { id: "repair", kind: "repair", title: "Restore the storage module", description: "The storage module's thermal control unit is malfunctioning. Complete one repair job.", target: 1, primary: false, points: 15 },
      { id: "service", kind: "service", title: "Complete scheduled maintenance", description: "Complete one preventive service job on any facility.", target: 1, primary: false, points: 15 },
    ],
    guided: true,
  },
  {
    id: "standard",
    name: "Ridge Station Rotation",
    codename: "SELENE-1",
    difficulty: "Standard",
    summary:
      "A 7-day crew rotation on the polar ridge. Two forecast terrain shadows, a mid-mission cargo lander and unpredictable operational events. Challenging but achievable.",
    durationHours: 168,
    startResources: { oxygen: 30, water: 180, food: 45, energy: 200, spares: 10, sciSupplies: 24 },
    startCondition: { habitat: 90, power: 92, oxygen: 78, water: 80, food: 85, lab: 88, comms: 90, storage: 35 },
    baseIllumination: 0.9,
    shadows: [
      { start: 30, end: 40, depth: 1 },
      { start: 100, end: 108, depth: 0.6 },
      { start: 130, end: 145, depth: 1 },
    ],
    eventChancePerHour: 0.06,
    eventMinGapHours: 10,
    firstRandomEventHour: 8,
    scriptedEvents: [{ hour: 26, defId: "terrain-shadow-forecast" }],
    resupply: { hour: 96, cargo: { food: 30, water: 60, spares: 4, sciSupplies: 8, oxygen: 10 } },
    objectives: [
      surviveObj(168),
      uptimeObj(95),
      { id: "research", kind: "research", title: "Complete the volatiles survey", description: "Accumulate 120 research points.", target: 120, primary: false, points: 15 },
      { id: "downlink", kind: "downlink", title: "Transmit science data to Earth", description: "Downlink 2,800 MB of laboratory data.", target: 2800, primary: false, points: 10 },
      { id: "reserves", kind: "reserves", title: "Hand over with adequate reserves", description: "End the mission with oxygen, water and food above their minimum reserves.", target: 1, primary: false, points: 10 },
      { id: "repair", kind: "repair", title: "Restore a malfunctioning facility", description: "Complete at least one repair job.", target: 1, primary: false, points: 10 },
      { id: "service", kind: "service", title: "Complete scheduled maintenance", description: "Complete two preventive service jobs.", target: 2, primary: false, points: 10 },
    ],
    guided: false,
  },
  {
    id: "challenge",
    name: "Long Shadow",
    codename: "SELENE-2",
    difficulty: "Challenging",
    summary:
      "A 10-day rotation as the Sun's path takes the ridge into longer terrain shadows, including a 30-hour eclipse. Tighter reserves and more frequent events.",
    durationHours: 240,
    startResources: { oxygen: 26, water: 160, food: 50, energy: 190, spares: 9, sciSupplies: 24 },
    startCondition: { habitat: 86, power: 88, oxygen: 72, water: 74, food: 80, lab: 85, comms: 84, storage: 38 },
    baseIllumination: 0.86,
    shadows: [
      { start: 20, end: 32, depth: 1 },
      { start: 80, end: 90, depth: 0.7 },
      { start: 150, end: 180, depth: 1 },
      { start: 210, end: 218, depth: 0.8 },
    ],
    eventChancePerHour: 0.08,
    eventMinGapHours: 8,
    firstRandomEventHour: 6,
    scriptedEvents: [{ hour: 140, defId: "terrain-shadow-forecast" }],
    resupply: { hour: 132, cargo: { food: 28, water: 60, spares: 4, sciSupplies: 6, oxygen: 8 } },
    objectives: [
      surviveObj(240),
      uptimeObj(92),
      { id: "research", kind: "research", title: "Complete the extended volatiles survey", description: "Accumulate 160 research points.", target: 160, primary: false, points: 15 },
      { id: "downlink", kind: "downlink", title: "Transmit science data to Earth", description: "Downlink 3,800 MB of laboratory data.", target: 3800, primary: false, points: 10 },
      { id: "reserves", kind: "reserves", title: "Hand over with adequate reserves", description: "End the mission with oxygen, water and food above their minimum reserves.", target: 1, primary: false, points: 10 },
      { id: "repair", kind: "repair", title: "Restore a malfunctioning facility", description: "Complete at least one repair job.", target: 1, primary: false, points: 10 },
      { id: "service", kind: "service", title: "Complete scheduled maintenance", description: "Complete three preventive service jobs.", target: 3, primary: false, points: 10 },
    ],
    guided: false,
  },
];

export function getScenario(id: string): Scenario {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}
