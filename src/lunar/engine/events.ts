/**
 * MISSION EVENTS
 *
 * Each event has an immediate effect when it triggers (`onTrigger`) and a set
 * of decisions. Every decision changes the simulation — through costs,
 * temporary modifiers, jobs added to the maintenance queue, or policy changes.
 * If the commander does not decide before the deadline, `defaultOption` is
 * applied automatically (usually the passive choice).
 *
 * Event definitions are code (not saved); the save file stores only event ids.
 */
import { CONFIG } from "./config";
import {
  addJob,
  addModifier,
  adjustWellbeing,
  damage,
  hasMod,
  log,
  removeModifiers,
  setModifierHours,
  setModifierValue,
  type Cost,
} from "./mutators";
import type { FacilityId, GameState, Severity } from "./types";

export interface EventOption {
  id: string;
  label: string;
  description: string;
  /** Plain-language list of consequences shown before choosing. */
  consequences: string[];
  cost?: Cost;
  apply: (s: GameState, src: string) => void;
}

export interface EventDef {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  affected: FacilityId[];
  science: string;
  sourceIds: string[];
  weight: number;
  /** Minimum hours before the same event can recur. */
  cooldown: number;
  maxOccurrences: number;
  deadlineHours: number;
  eligible?: (s: GameState) => boolean;
  onTrigger?: (s: GameState, src: string) => void;
  options: EventOption[];
  defaultOption: string;
}

const noop = () => {};

export const EVENTS: EventDef[] = [
  {
    id: "terrain-shadow",
    title: "Unforecast terrain shadowing",
    description:
      "Array output is dropping faster than the illumination forecast predicted. A ridge line not captured at full resolution in the terrain model is shadowing the main arrays. Expect roughly 75% lower solar output for the next 14 hours.",
    severity: "warning",
    affected: ["power"],
    science:
      "At the lunar poles the Sun stays within about 1.5° of the horizon, so even small terrain features cast very long shadows. Illumination at polar sites is forecast from topography models; their accuracy depends on the resolution of the elevation data.",
    sourceIds: ["mazarico2011"],
    weight: 1,
    cooldown: 60,
    maxOccurrences: 2,
    deadlineHours: 4,
    onTrigger: (s, src) => {
      addModifier(s, { kind: "solarMultiplier", value: 0.25, hoursRemaining: 14, label: "Unforecast terrain shadow", source: src });
    },
    options: [
      {
        id: "shed",
        label: "Shed non-essential loads",
        description: "Power down the laboratory and hydroponic lighting for 14 hours.",
        consequences: ["Saves ≈5.2 kW of demand", "No research or food growth for 14 h", "Battery stays well above reserve"],
        apply: (s, src) => {
          addModifier(s, { kind: "loadShed", target: "lab", value: 1, hoursRemaining: 14, label: "Load shed (shadow)", source: src });
          addModifier(s, { kind: "loadShed", target: "food", value: 1, hoursRemaining: 14, label: "Load shed (shadow)", source: src });
        },
      },
      {
        id: "eva-array",
        label: "EVA: reposition the auxiliary array",
        description: "Send a crew member to move the portable array to a sunlit spot on the ridge.",
        consequences: ["Uses 1 spare part and 4 crew-hours of EVA work", "When complete, solar output recovers to ≈55% for the rest of the shadow"],
        cost: { spares: 1 },
        apply: (s, src) => {
          addJob(s, {
            label: "EVA: reposition auxiliary array",
            kind: "eva",
            facility: "power",
            laborTotal: 4,
            takesOffline: false,
            eva: true,
            partsSpent: 1,
            effects: [{ type: "setModifierValue", source: src, kind: "solarMultiplier", value: 0.55 }],
          });
        },
      },
      {
        id: "ride",
        label: "Ride it out on battery",
        description: "Keep all systems running and draw down the battery.",
        consequences: ["No loss of research or food output", "Battery may approach the reserve floor"],
        apply: noop,
      },
    ],
    defaultOption: "ride",
  },
  {
    id: "terrain-shadow-forecast",
    title: "Terrain shadow forecast",
    description:
      "Flight dynamics confirms the Sun will pass behind the crater rim within a few hours. The forecast shows a period of deep shadow on the main arrays (see the Power forecast chart). Decide how to prepare.",
    severity: "caution",
    affected: ["power"],
    science:
      "Because lunar topography is mapped from orbit by laser altimetry, the hours a site will be in shadow can be predicted well in advance. Planning around predictable eclipses is a central part of polar mission design.",
    sourceIds: ["mazarico2011"],
    weight: 0,
    cooldown: 999,
    maxOccurrences: 3,
    deadlineHours: 3,
    options: [
      {
        id: "precharge",
        label: "Pre-charge: pause research & grow lights",
        description: "Shed the lab and hydroponics for 8 hours so the battery tops up before the shadow.",
        consequences: ["≈5 kW extra charging for 8 h", "Loses 8 h of research and food growth"],
        apply: (s, src) => {
          addModifier(s, { kind: "loadShed", target: "lab", value: 1, hoursRemaining: 8, label: "Pre-charge load shed", source: src });
          addModifier(s, { kind: "loadShed", target: "food", value: 1, hoursRemaining: 8, label: "Pre-charge load shed", source: src });
        },
      },
      {
        id: "raise-floor",
        label: "Protect life support: raise battery reserve to 50%",
        description: "Below 50% charge, only your top power priority may draw on the battery.",
        consequences: ["Lower-priority systems lose power earlier in the shadow", "Guarantees energy for your top priority"],
        apply: (s) => {
          s.batteryFloor = 0.5;
        },
      },
      {
        id: "proceed",
        label: "Proceed with the current plan",
        description: "No changes. You can still adjust power settings manually.",
        consequences: ["No immediate effect"],
        apply: noop,
      },
    ],
    defaultOption: "proceed",
  },
  {
    id: "wrs-filter",
    title: "Water processor filter nearing saturation",
    description:
      "Conductivity downstream of the multifiltration beds is rising. The water recovery system has automatically reduced throughput to 60% to protect water quality.",
    severity: "caution",
    affected: ["water"],
    science:
      "Spacecraft water recovery combines distillation, filtration beds and catalytic oxidation. Filter beds are consumables: as they saturate, water quality drops and throughput must be reduced. ISS has demonstrated about 98% total water recovery.",
    sourceIds: ["iss-water-98", "bvad"],
    weight: 1.2,
    cooldown: 72,
    maxOccurrences: 2,
    deadlineHours: 6,
    onTrigger: (s, src) => {
      addModifier(s, { kind: "facilityEfficiency", target: "water", value: 0.6, hoursRemaining: null, label: "Filter bed saturated", source: src });
    },
    options: [
      {
        id: "replace",
        label: "Replace the filter bed now",
        description: "Take water recovery offline for a 3 crew-hour bed change.",
        consequences: ["Uses 1 spare part", "Water recovery offline until the job is done", "Restores full throughput"],
        cost: { spares: 1 },
        apply: (s, src) => {
          addJob(s, {
            label: "Replace water processor filter bed",
            kind: "service",
            facility: "water",
            laborTotal: 3,
            takesOffline: true,
            eva: false,
            partsSpent: 1,
            effects: [
              { type: "removeModifiers", source: src },
              { type: "restoreCondition", facility: "water", amount: 10, clearFailure: false },
            ],
          });
        },
      },
      {
        id: "conserve",
        label: "Defer and start water conservation",
        description: "Run at reduced throughput for 36 h and cut crew water use by 20%.",
        consequences: ["Water conservation policy switched on", "Throughput stays at 60% for 36 h", "Small, gradual wellbeing cost"],
        apply: (s, src) => {
          setModifierHours(s, src, 36);
          s.policies.waterConservation = true;
        },
      },
      {
        id: "defer",
        label: "Defer for 36 hours",
        description: "Keep running degraded until the next maintenance window.",
        consequences: ["Throughput stays at 60% for 36 h", "Double wear on the water processor meanwhile"],
        apply: (s, src) => {
          setModifierHours(s, src, 36);
          addModifier(s, { kind: "wearMultiplier", target: "water", value: 2, hoursRemaining: 36, label: "Running on saturated bed", source: src });
        },
      },
    ],
    defaultOption: "defer",
  },
  {
    id: "dust",
    title: "Dust accumulation on external equipment",
    description:
      "Rover traffic near the landing pad has lofted regolith onto the solar arrays and antenna radome. Array output is reduced.",
    severity: "caution",
    affected: ["power", "comms"],
    science:
      "Lunar dust is fine, abrasive and electrostatically charged, so it clings to surfaces. Apollo crews reported dust degrading seals, radiators, visors and instruments. NASA's Electrodynamic Dust Shield uses electric fields to lift dust off surfaces and was demonstrated on the Moon in 2025.",
    sourceIds: ["gaier2005", "eds2025"],
    weight: 1.3,
    cooldown: 40,
    maxOccurrences: 3,
    deadlineHours: 6,
    onTrigger: (s) => {
      s.facilities.power.dust = Math.min(100, s.facilities.power.dust + 25);
      s.facilities.comms.dust = Math.min(100, s.facilities.comms.dust + 15);
    },
    options: [
      {
        id: "eds",
        label: "Pulse the electrodynamic dust shields",
        description: "Use stored energy to clear the most exposed panels.",
        consequences: ["Costs 12 kWh of battery energy now", "Removes 18% dust from the arrays immediately"],
        cost: { energy: 12 },
        apply: (s) => {
          s.facilities.power.dust = Math.max(0, s.facilities.power.dust - 18);
        },
      },
      {
        id: "eva-clean",
        label: "EVA: brush-clean arrays and radome",
        description: "Schedule a cleaning EVA for the maintenance crew.",
        consequences: ["Takes 4 crew-hours of EVA work", "Removes 30% dust from the arrays and 20% from the antenna"],
        apply: (s) => {
          addJob(s, {
            label: "EVA: clean arrays and radome",
            kind: "eva",
            facility: "power",
            laborTotal: 4,
            takesOffline: false,
            eva: true,
            effects: [
              { type: "reduceDust", facility: "power", amount: 30 },
              { type: "reduceDust", facility: "comms", amount: 20 },
            ],
          });
        },
      },
      {
        id: "accept",
        label: "Accept reduced output",
        description: "No action. Dust remains until cleaned later.",
        consequences: ["Lower solar output for the rest of the mission unless cleaned"],
        apply: noop,
      },
    ],
    defaultOption: "accept",
  },
  {
    id: "comms-interference",
    title: "Communications link degraded",
    description:
      "Signal-to-noise on the Earth link has dropped sharply: Earth is low on the horizon and the relay pass is marginal. Data downlink is down to about 20% of normal for 10 hours.",
    severity: "caution",
    affected: ["comms"],
    science:
      "From the lunar south pole, Earth hangs low on the horizon and can be blocked by terrain, so polar missions plan on relay satellites. NASA's LunaNet concept describes a shared network of lunar relays. Radio signals take about 1.3 seconds to travel between Earth and the Moon.",
    sourceIds: ["lunanet", "moon-facts"],
    weight: 1,
    cooldown: 36,
    maxOccurrences: 3,
    deadlineHours: 4,
    onTrigger: (s, src) => {
      addModifier(s, { kind: "commsQuality", target: "comms", value: 0.2, hoursRemaining: 10, label: "Link interference", source: src });
    },
    options: [
      {
        id: "boost",
        label: "Boost transmitter power",
        description: "Run the high-power amplifier for the duration.",
        consequences: ["+0.8 kW demand on communications for 10 h", "Link quality restored to ≈80%"],
        apply: (s, src) => {
          setModifierValue(s, src, "commsQuality", 0.8);
          addModifier(s, { kind: "extraDemand", target: "comms", value: 0.8, hoursRemaining: 10, label: "High-power amplifier", source: src });
        },
      },
      {
        id: "low-rate",
        label: "Switch to robust low-rate mode",
        description: "Use a more robust coding scheme at a lower data rate.",
        consequences: ["Link quality ≈45% for 10 h", "No extra power"],
        apply: (s, src) => setModifierValue(s, src, "commsQuality", 0.45),
      },
      {
        id: "wait",
        label: "Wait for the next relay pass",
        description: "Buffer science data on board until conditions improve.",
        consequences: ["Downlink stays at ≈20% for 10 h; data is buffered, not lost"],
        apply: noop,
      },
    ],
    defaultOption: "wait",
  },
  {
    id: "storage-thermal",
    title: "Storage module thermal controller fault",
    description:
      "The storage module's heat-rejection loop has tripped. Temperatures in the food store are rising and some stored food will spoil if nothing is done.",
    severity: "warning",
    affected: ["storage", "food"],
    science:
      "Every pressurized module needs active thermal control: heat from electronics and sunlight must be rejected by radiators, and in shadow, heaters must keep equipment warm. Food shelf life depends strongly on storage temperature.",
    sourceIds: [],
    weight: 0.8,
    cooldown: 72,
    maxOccurrences: 2,
    deadlineHours: 6,
    onTrigger: (s, src) => {
      damage(s, "storage", 20);
      addModifier(s, { kind: "foodSpoilage", value: 0.006, hoursRemaining: null, label: "Food store warming", source: src });
    },
    options: [
      {
        id: "repair-now",
        label: "Repair the thermal loop now",
        description: "A 3 crew-hour job with the storage module offline.",
        consequences: ["Uses 2 spare parts", "Spoilage stops when the job completes", "Storage condition +30"],
        cost: { spares: 2 },
        apply: (s, src) => {
          addJob(s, {
            label: "Repair storage thermal loop",
            kind: "repair",
            facility: "storage",
            laborTotal: 3,
            takesOffline: true,
            eva: false,
            partsSpent: 2,
            effects: [
              { type: "removeModifiers", source: src },
              { type: "restoreCondition", facility: "storage", amount: 30, clearFailure: true },
            ],
          });
        },
      },
      {
        id: "relocate",
        label: "Move perishables into the habitat",
        description: "Stow food in habitat lockers until the loop can be fixed.",
        consequences: ["Spoilage stops immediately", "+0.6 kW habitat cooling load for 48 h", "Cramped quarters: small wellbeing cost"],
        apply: (s, src) => {
          removeModifiers(s, src);
          addModifier(s, { kind: "extraDemand", target: "habitat", value: 0.6, hoursRemaining: 48, label: "Extra cooling load", source: `${src}-relocate` });
          adjustWellbeing(s, -5);
        },
      },
      {
        id: "accept",
        label: "Accept spoilage for 24 hours",
        description: "Let the loop cool down and attempt an automatic restart.",
        consequences: ["≈0.6% of stored food lost per hour for 24 h"],
        apply: (s, src) => setModifierHours(s, src, 24),
      },
    ],
    defaultOption: "accept",
  },
  {
    id: "experiment-power",
    title: "Volatiles experiment requests extra power",
    description:
      "The science team wants to heat a regolith core sample from a nearby cold trap to measure released water and other volatiles. The run needs extra power for 10 hours.",
    severity: "advisory",
    affected: ["lab", "power"],
    science:
      "Orbital and impact measurements show that permanently shadowed craters near the south pole are cold enough (tens of kelvin) to trap water ice. LCROSS detected water in the plume from Cabeus crater. Heating samples releases volatiles that instruments can identify.",
    sourceIds: ["colaprete2010", "paige2010"],
    weight: 1.2,
    cooldown: 48,
    maxOccurrences: 3,
    deadlineHours: 6,
    options: [
      {
        id: "approve",
        label: "Approve the full run",
        description: "Supply 2.5 kW extra to the laboratory for 10 hours.",
        consequences: ["Uses 2 science supply kits", "+2.5 kW lab demand for 10 h", "+60% research output for 10 h"],
        cost: { sciSupplies: 2 },
        apply: (s, src) => {
          addModifier(s, { kind: "extraDemand", target: "lab", value: 2.5, hoursRemaining: 10, label: "Sample heating", source: src });
          addModifier(s, { kind: "researchBonus", value: 0.6, hoursRemaining: 10, label: "Volatiles run", source: src });
        },
      },
      {
        id: "reduced",
        label: "Approve a reduced run",
        description: "Lower temperature profile, fewer measurements.",
        consequences: ["Uses 1 science supply kit", "+1.2 kW lab demand for 10 h", "+25% research output for 10 h"],
        cost: { sciSupplies: 1 },
        apply: (s, src) => {
          addModifier(s, { kind: "extraDemand", target: "lab", value: 1.2, hoursRemaining: 10, label: "Sample heating (reduced)", source: src });
          addModifier(s, { kind: "researchBonus", value: 0.25, hoursRemaining: 10, label: "Volatiles run (reduced)", source: src });
        },
      },
      {
        id: "decline",
        label: "Decline",
        description: "Keep the power margin.",
        consequences: ["No extra power use, no bonus science"],
        apply: noop,
      },
    ],
    defaultOption: "decline",
  },
  {
    id: "resupply-delay",
    title: "Cargo lander delayed",
    description:
      "The cargo lander's launch has slipped. Ground now expects it to arrive 36 hours later than planned.",
    severity: "warning",
    affected: ["food", "storage"],
    science:
      "Early lunar outposts will depend on deliveries from Earth for most consumables. Life-support planning therefore keeps reserve margins large enough to absorb schedule slips.",
    sourceIds: ["bvad"],
    weight: 0.9,
    cooldown: 999,
    maxOccurrences: 1,
    deadlineHours: 6,
    eligible: (s) => !!s.resupply && !s.resupply.delivered && s.hour < s.resupply.hour - 12,
    onTrigger: (s) => {
      if (s.resupply) s.resupply.hour += 36;
    },
    options: [
      {
        id: "ration",
        label: "Start food rationing",
        description: "Reduce stored-food consumption by 15% until you switch it off.",
        consequences: ["Food lasts longer", "Gradual wellbeing cost while active"],
        apply: (s) => {
          s.policies.foodRationing = true;
        },
      },
      {
        id: "boost-hydro",
        label: "Extend the hydroponic photoperiod",
        description: "Run grow lights longer for 48 hours.",
        consequences: ["+1.0 kW food-production demand for 48 h", "+25% hydroponic output for 48 h"],
        apply: (s, src) => {
          addModifier(s, { kind: "extraDemand", target: "food", value: 1.0, hoursRemaining: 48, label: "Extended photoperiod", source: src });
          addModifier(s, { kind: "facilityEfficiency", target: "food", value: 1.25, hoursRemaining: 48, label: "Extended photoperiod", source: src });
        },
      },
      {
        id: "accept",
        label: "Accept the new schedule",
        description: "No change to consumption.",
        consequences: ["Rely on current reserves until the lander arrives"],
        apply: noop,
      },
    ],
    defaultOption: "accept",
  },
  {
    id: "cargo-slot",
    title: "Extra cargo slot available",
    description: "Ground has freed up mass on the incoming cargo lander. Choose what to add to the manifest.",
    severity: "advisory",
    affected: ["storage"],
    science:
      "Every kilogram delivered to the lunar surface is expensive, so mission planners trade spares, consumables and science equipment against each other on every manifest.",
    sourceIds: ["bvad"],
    weight: 0.7,
    cooldown: 999,
    maxOccurrences: 1,
    deadlineHours: 8,
    eligible: (s) => !!s.resupply && !s.resupply.delivered && s.hour < s.resupply.hour - 6,
    options: [
      {
        id: "spares",
        label: "Spare parts",
        description: "Add 4 spare-part units.",
        consequences: ["+4 spare parts on delivery"],
        apply: (s) => {
          if (s.resupply) s.resupply.cargo.spares = (s.resupply.cargo.spares ?? 0) + 4;
        },
      },
      {
        id: "water",
        label: "Water",
        description: "Add 50 kg of water.",
        consequences: ["+50 kg water on delivery"],
        apply: (s) => {
          if (s.resupply) s.resupply.cargo.water = (s.resupply.cargo.water ?? 0) + 50;
        },
      },
      {
        id: "science",
        label: "Science supplies",
        description: "Add 8 science supply kits.",
        consequences: ["+8 science kits on delivery"],
        apply: (s) => {
          if (s.resupply) s.resupply.cargo.sciSupplies = (s.resupply.cargo.sciSupplies ?? 0) + 8;
        },
      },
    ],
    defaultOption: "spares",
  },
  {
    id: "oga-maintenance",
    title: "Oxygen generator maintenance due",
    description:
      "The oxygen generation assembly has reached its scheduled maintenance interval. Electrolysis cell stack performance is drifting.",
    severity: "advisory",
    affected: ["oxygen"],
    science:
      "Oxygen generators split water into oxygen and hydrogen by electrolysis — roughly 1.125 kg of water for every kilogram of oxygen. The cells degrade over time and need periodic servicing.",
    sourceIds: ["bvad"],
    weight: 1,
    cooldown: 72,
    maxOccurrences: 2,
    deadlineHours: 8,
    options: [
      {
        id: "now",
        label: "Perform maintenance now",
        description: "Take oxygen generation offline for a 3 crew-hour service.",
        consequences: ["Uses 1 spare part", "No oxygen production until complete", "Condition +25"],
        cost: { spares: 1 },
        apply: (s) => {
          addJob(s, {
            label: "Service oxygen generator",
            kind: "service",
            facility: "oxygen",
            laborTotal: 3,
            takesOffline: true,
            eva: false,
            partsSpent: 1,
            effects: [{ type: "restoreCondition", facility: "oxygen", amount: 25, clearFailure: false }],
          });
        },
      },
      {
        id: "defer",
        label: "Defer 48 hours",
        description: "Keep producing oxygen and accept faster wear.",
        consequences: ["1.8× wear on the oxygen generator for 48 h"],
        apply: (s, src) => {
          addModifier(s, { kind: "wearMultiplier", target: "oxygen", value: 1.8, hoursRemaining: 48, label: "Overdue maintenance", source: src });
        },
      },
    ],
    defaultOption: "defer",
  },
  {
    id: "spe",
    title: "Solar particle event alert",
    description:
      "Space weather forecasters report a solar flare with an associated increase in energetic protons expected within hours. Flight rules call for crew to minimize time outside the most shielded area.",
    severity: "warning",
    affected: ["habitat", "lab"],
    science:
      "The Moon has no global magnetic field and essentially no atmosphere, so crews are exposed to galactic cosmic rays and to bursts of energetic particles from the Sun. Mass — regolith, water or equipment — between the crew and space reduces exposure, which is why habitats plan a shielded refuge.",
    sourceIds: ["nasa-space-radiation"],
    weight: 0.8,
    cooldown: 96,
    maxOccurrences: 1,
    deadlineHours: 3,
    options: [
      {
        id: "shelter",
        label: "Full shelter for 8 hours",
        description: "All crew move to the shielded core.",
        consequences: ["Research and EVAs paused for 8 h", "Crew rest during shelter", "No added exposure"],
        apply: (s, src) => {
          addModifier(s, { kind: "shelter", value: 1, hoursRemaining: 8, label: "Crew in shielded refuge", source: src });
        },
      },
      {
        id: "partial",
        label: "Cancel EVAs only",
        description: "Hold all EVAs for 8 hours; indoor work continues.",
        consequences: ["EVA jobs paused for 8 h", "Small increase to the mission exposure index"],
        apply: (s, src) => {
          addModifier(s, { kind: "evaHold", value: 1, hoursRemaining: 8, label: "EVA hold (radiation)", source: src });
          s.stats.exposureIndex += 1;
        },
      },
      {
        id: "continue",
        label: "Continue normal operations",
        description: "Accept the added exposure to keep the schedule.",
        consequences: ["Large increase to the mission exposure index (affects the safety evaluation)"],
        apply: (s) => {
          s.stats.exposureIndex += 3;
        },
      },
    ],
    defaultOption: "partial",
  },
  {
    id: "hab-leak",
    title: "Slow cabin pressure decay",
    description:
      "Pressure in the habitat is falling slightly faster than the normal leak rate. Make-up gas is compensating, but at a cost in stored oxygen.",
    severity: "warning",
    affected: ["habitat"],
    science:
      "No pressure vessel is perfectly sealed. Habitats replace lost atmosphere from stored gas. Finding small leaks is painstaking; crews isolate modules one at a time and use ultrasonic detectors.",
    sourceIds: [],
    weight: 0.8,
    cooldown: 96,
    maxOccurrences: 1,
    deadlineHours: 6,
    onTrigger: (s, src) => {
      damage(s, "habitat", 8);
      addModifier(s, { kind: "leakRate", value: 0.12, hoursRemaining: null, label: "Cabin leak", source: src });
    },
    options: [
      {
        id: "patch",
        label: "Locate and patch the leak",
        description: "A 4 crew-hour leak hunt and repair.",
        consequences: ["Uses 2 spare parts", "Leak stops when the job completes"],
        cost: { spares: 2 },
        apply: (s, src) => {
          addJob(s, {
            label: "Locate and patch cabin leak",
            kind: "repair",
            facility: "habitat",
            laborTotal: 4,
            takesOffline: false,
            eva: false,
            partsSpent: 2,
            effects: [{ type: "removeModifiers", source: src }],
          });
        },
      },
      {
        id: "isolate",
        label: "Isolate the suspect section",
        description: "Close hatches to the suspect section and live without it.",
        consequences: ["Leak reduced by 75%", "Less living space: wellbeing −6"],
        apply: (s, src) => {
          setModifierValue(s, src, "leakRate", 0.03);
          adjustWellbeing(s, -6);
        },
      },
      {
        id: "makeup",
        label: "Rely on make-up gas",
        description: "Let the atmosphere control system compensate.",
        consequences: [`≈${(0.12 * CONFIG.makeupO2PerKpa).toFixed(2)} kg of extra oxygen per hour until fixed`],
        apply: noop,
      },
    ],
    defaultOption: "makeup",
  },
  {
    id: "co2-bed",
    title: "CO₂ removal bed regeneration lagging",
    description:
      "One of the carbon-dioxide sorbent beds is not desorbing fully between cycles. CO₂ removal capacity is down to 55%.",
    severity: "caution",
    affected: ["habitat"],
    science:
      "Space stations remove CO₂ with regenerable sorbent beds that are heated and exposed to vacuum to release the gas. Apollo used single-use lithium hydroxide canisters instead. Keeping CO₂ low matters because crews exhale roughly a kilogram of it per person per day.",
    sourceIds: ["bvad"],
    weight: 1,
    cooldown: 72,
    maxOccurrences: 2,
    deadlineHours: 5,
    eligible: (s) => !hasMod(s, "co2Removal"),
    onTrigger: (s, src) => {
      addModifier(s, { kind: "co2Removal", value: 0.55, hoursRemaining: null, label: "Sorbent bed degraded", source: src });
    },
    options: [
      {
        id: "bakeout",
        label: "Run an extended bake-out",
        description: "Heat the bed for 6 hours to drive off trapped CO₂ and water.",
        consequences: ["+1.5 kW habitat demand for 6 h", "Capacity restored after 6 h"],
        apply: (s, src) => {
          setModifierHours(s, src, 6);
          addModifier(s, { kind: "extraDemand", target: "habitat", value: 1.5, hoursRemaining: 6, label: "Sorbent bake-out", source: `${src}-bake` });
        },
      },
      {
        id: "canisters",
        label: "Install backup absorber cartridges",
        description: "Swap in single-use cartridges while the bed recovers.",
        consequences: ["Uses 2 spare parts", "Full capacity restored immediately"],
        cost: { spares: 2 },
        apply: (s, src) => removeModifiers(s, src),
      },
      {
        id: "monitor",
        label: "Monitor for 30 hours",
        description: "The bed may recover on its own over many cycles.",
        consequences: ["Capacity stays at 55% for 30 h — CO₂ may rise if the habitat loses power"],
        apply: (s, src) => setModifierHours(s, src, 30),
      },
    ],
    defaultOption: "monitor",
  },
  {
    id: "hydro-pump",
    title: "Hydroponic nutrient pump fault",
    description: "The primary nutrient-delivery pump in the food production module is cavitating. Plant growth is suffering.",
    severity: "warning",
    affected: ["food"],
    science:
      "Plants have been grown on the International Space Station in systems such as Veggie. Without gravity-driven drainage, delivering water and nutrients to roots reliably is one of the main engineering challenges of space agriculture.",
    sourceIds: ["veggie"],
    weight: 0.9,
    cooldown: 72,
    maxOccurrences: 2,
    deadlineHours: 6,
    onTrigger: (s) => damage(s, "food", 35),
    options: [
      {
        id: "repair",
        label: "Replace the pump",
        description: "A 4 crew-hour job with food production offline.",
        consequences: ["Uses 2 spare parts", "Food production offline until done", "Condition +40"],
        cost: { spares: 2 },
        apply: (s) => {
          addJob(s, {
            label: "Replace hydroponic nutrient pump",
            kind: "repair",
            facility: "food",
            laborTotal: 4,
            takesOffline: true,
            eva: false,
            partsSpent: 2,
            effects: [{ type: "restoreCondition", facility: "food", amount: 40, clearFailure: true }],
          });
        },
      },
      {
        id: "manual",
        label: "Switch to backup pump at reduced flow",
        description: "Keep plants alive on the low-capacity backup.",
        consequences: ["Food output ×0.7 for 48 h", "No parts used"],
        apply: (s, src) => {
          addModifier(s, { kind: "facilityEfficiency", target: "food", value: 0.7, hoursRemaining: 48, label: "Backup pump", source: src });
        },
      },
      {
        id: "shutdown",
        label: "Shut down food production",
        description: "Save power and water until a repair is convenient.",
        consequences: ["Food production switched off (re-enable it on the Power page)"],
        apply: (s) => {
          s.facilities.food.enabled = false;
        },
      },
    ],
    defaultOption: "manual",
  },
];

export const EVENT_MAP: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function getEventDef(id: string): EventDef | undefined {
  return EVENT_MAP[id];
}

export function triggerEvent(s: GameState, def: EventDef) {
  const src = `evt:${def.id}:${s.hour}`;
  def.onTrigger?.(s, src);
  s.pendingEvent = { defId: def.id, triggeredHour: s.hour, deadlineHour: s.hour + def.deadlineHours };
  s.eventLastSeen[def.id] = s.hour;
  s.eventHistory.push({ defId: def.id, title: def.title, hour: s.hour, severity: def.severity, auto: false });
  log(s, "event", def.title, def.description, def.severity);
}

/** Source tag of the currently pending event — options use it to address their modifiers. */
export function pendingSource(s: GameState): string | null {
  return s.pendingEvent ? `evt:${s.pendingEvent.defId}:${s.pendingEvent.triggeredHour}` : null;
}

export function resolvePendingEvent(
  s: GameState,
  optionId: string,
  auto: boolean,
): { ok: boolean; reason?: string } {
  const pending = s.pendingEvent;
  if (!pending) return { ok: false, reason: "No event awaiting a decision." };
  const def = getEventDef(pending.defId);
  if (!def) {
    s.pendingEvent = null;
    return { ok: false, reason: "Unknown event." };
  }
  let option = def.options.find((o) => o.id === optionId);
  if (!option) return { ok: false, reason: "Unknown option." };
  // An automatic resolution falls back to the first affordable option if the default is unaffordable.
  const affordable = (o: EventOption) => {
    if (!o.cost) return true;
    return Object.entries(o.cost).every(([k, v]) => !v || s.resources[k as keyof typeof s.resources] >= v);
  };
  if (!affordable(option)) {
    if (!auto) return { ok: false, reason: "Not enough resources for this option." };
    option = def.options.find(affordable) ?? def.options[def.options.length - 1];
  }
  const src = pendingSource(s)!;
  if (option.cost) {
    for (const [k, v] of Object.entries(option.cost)) {
      if (v) s.resources[k as keyof typeof s.resources] = Math.max(0, s.resources[k as keyof typeof s.resources] - v);
    }
  }
  option.apply(s, src);
  const rec = [...s.eventHistory].reverse().find((r) => r.defId === def.id && r.hour === pending.triggeredHour);
  if (rec) {
    rec.optionId = option.id;
    rec.optionLabel = option.label;
    rec.resolvedHour = s.hour;
    rec.auto = auto;
  }
  s.pendingEvent = null;
  log(
    s,
    "decision",
    auto ? `Default action applied: ${option.label}` : `Decision: ${option.label}`,
    auto ? `No decision was made on "${def.title}" before the deadline.` : `Response to "${def.title}".`,
    "advisory",
  );
  return { ok: true };
}
