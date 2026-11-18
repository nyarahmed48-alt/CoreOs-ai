/**
 * Educational content: facility descriptions, glossary and science topics.
 * Engineering statements are general; numbers specific to the game are
 * labeled as simulated in the UI.
 */
import type { FacilityId } from "../engine/types";

export interface FacilityInfo {
  description: string;
  produces: string;
  consumes: string;
  science: string;
  sourceIds: string[];
}

export const FACILITY_INFO: Record<FacilityId, FacilityInfo> = {
  habitat: {
    description: "The pressurized living and working volume for the four-person crew. Houses thermal control, air revitalization (CO₂ removal and filtration) and lighting.",
    produces: "Breathable, temperature-controlled cabin atmosphere",
    consumes: "Electrical power; stored gas to replace leakage",
    science:
      "Habitats on the Moon must hold an Earth-like atmosphere inside a vacuum. Crews exhale roughly a kilogram of CO₂ per person per day, which regenerable sorbent beds remove. Without power, the cabin cools and CO₂ builds up — which is why life support is normally the top power priority.",
    sourceIds: ["bvad", "nasa-std-3001"],
  },
  power: {
    description: "Vertical, sun-tracking solar arrays on the ridge crest plus a battery bank. Generation depends on illumination, dust coverage and array condition.",
    produces: "Electrical power; charges the battery from any surplus",
    consumes: "Small fixed overhead for array drives and power electronics",
    science:
      "At the poles the Sun skims the horizon, so arrays are mounted vertically and rotate to follow it. High ridges can be sunlit for much of the lunar cycle, with interruptions from terrain shadows that can be predicted from topography. At most other sites, the lunar night lasts about two weeks, which is why NASA is also studying fission surface power.",
    sourceIds: ["mazarico2011", "fsp"],
  },
  oxygen: {
    description: "An electrolysis assembly that splits water into oxygen (for the cabin) and hydrogen.",
    produces: "Oxygen",
    consumes: "Water (≈1.125 kg per kg of O₂) and significant power",
    science:
      "Electrolysis splits H₂O into H₂ and O₂. By mass, 36 g of water yields 32 g of oxygen. On the space station, the hydrogen can be combined with exhaled CO₂ to recover some water; that recovery is not modeled here.",
    sourceIds: ["bvad"],
  },
  water: {
    description: "Collects wastewater (humidity condensate, hygiene and urine) and processes it back to potable water.",
    produces: "Potable water from wastewater",
    consumes: "Electrical power; filter consumables",
    science:
      "Closing the water loop is essential because every kilogram launched from Earth is expensive. The ISS system recovered 93–94% of water before adding a brine processor, and has since demonstrated about 98%. This simulation uses 93% and lets backlogged wastewater wait in a buffer tank.",
    sourceIds: ["iss-water-98"],
  },
  food: {
    description: "A hydroponic plant growth module with LED lighting supplying fresh produce to supplement stored food.",
    produces: "A small amount of fresh food",
    consumes: "Power for grow lights; water (most is recovered as condensate)",
    science:
      "Astronauts have grown and eaten lettuce and other leafy greens on ISS. Fresh crops add nutrition and variety, but early lunar outposts would still depend mainly on food shipped from Earth — the module here is deliberately a small supplement.",
    sourceIds: ["veggie"],
  },
  lab: {
    description: "The research laboratory: sample preparation, analytical instruments and data handling.",
    produces: "Research results and science data for downlink",
    consumes: "Power, science supply kits and crew time",
    science:
      "Permanently shadowed craters near the south pole are among the coldest places measured in the solar system and trap water ice. Studying these volatiles is a major reason to go to the lunar south pole.",
    sourceIds: ["paige2010", "colaprete2010"],
  },
  comms: {
    description: "High-gain antenna and radios for the Earth link and lunar relay satellites.",
    produces: "Data downlink and voice/telemetry link with Earth",
    consumes: "Electrical power",
    science:
      "From the south pole, Earth stays low on the horizon and terrain can block it, so polar missions plan on relay satellites. Signals take about 1.3 seconds each way between Earth and the Moon.",
    sourceIds: ["lunanet", "moon-facts"],
  },
  storage: {
    description: "A logistics module storing food, spare parts and science supplies, with its own thermal control.",
    produces: "Temperature-controlled storage",
    consumes: "Electrical power for thermal control",
    science:
      "Logistics dominate the mass of a surface outpost. Spare parts let the crew repair failures without waiting for a delivery; keeping stored food cool extends its shelf life.",
    sourceIds: ["bvad"],
  },
};

export const GLOSSARY: Record<string, string> = {
  MET: "Mission Elapsed Time — hours since the start of the mission.",
  EVA: "Extravehicular activity — work done outside the habitat in a spacesuit.",
  ECLSS: "Environmental Control and Life Support System — keeps the cabin breathable and the water loop closed.",
  ppCO2: "Partial pressure of carbon dioxide in the cabin air, in millimetres of mercury (mmHg).",
  kPa: "Kilopascal, a unit of pressure. Sea-level air pressure on Earth is about 101.3 kPa.",
  kW: "Kilowatt — the rate of electrical power flow.",
  kWh: "Kilowatt-hour — an amount of energy: 1 kW for 1 hour.",
  Regolith: "The layer of loose rock and dust covering the Moon's surface.",
  PSR: "Permanently shadowed region — crater floors near the poles that never see sunlight.",
  SPE: "Solar particle event — a burst of energetic particles from the Sun.",
  Electrolysis: "Using electricity to split water into hydrogen and oxygen.",
  "Battery reserve": "Below this charge, only your top power priority may draw on the battery.",
  "Load shed": "Deliberately powering down systems to reduce demand.",
  Illumination: "Fraction of the solar arrays' capacity the Sun can currently supply, before dust and wear.",
};

export interface ScienceTopic {
  id: string;
  title: string;
  body: string;
  sourceIds: string[];
}

export const SCIENCE_TOPICS: ScienceTopic[] = [
  {
    id: "day-night",
    title: "Lunar day and night",
    body:
      "The Moon rotates once per orbit, so a full day–night cycle lasts about 29.5 Earth days. At most locations that means roughly two weeks of sunlight followed by two weeks of darkness. Near the poles, the Moon's small axial tilt (about 1.5°) keeps the Sun close to the horizon, and some high ridges are sunlit most of the time.",
    sourceIds: ["moon-facts", "mazarico2011"],
  },
  {
    id: "solar",
    title: "Solar power at the poles",
    body:
      "Because the Sun circles near the horizon, polar solar arrays are mounted vertically and rotate to track it. Terrain shadows interrupt generation for hours to days. These shadows can be forecast from orbital topography, so energy storage and load management can be planned. Long lunar nights elsewhere motivate nuclear options such as NASA's Fission Surface Power project.",
    sourceIds: ["mazarico2011", "fsp"],
  },
  {
    id: "life-support",
    title: "Life support",
    body:
      "A crew member uses roughly 0.8 kg of oxygen per day and exhales about a kilogram of CO₂. Life support must supply oxygen, remove CO₂, control temperature and humidity, and replace any atmosphere lost to leaks. Real crew-environment limits are defined in NASA-STD-3001; the bands in this game are simplified gameplay values.",
    sourceIds: ["bvad", "nasa-std-3001"],
  },
  {
    id: "water",
    title: "Water recycling",
    body:
      "Water is heavy to launch, so habitats recycle it. The ISS recovers water from humidity condensate and urine using distillation, filtration and catalytic oxidation; total recovery reached about 98% with the Brine Processor Assembly. Water is also the feedstock for oxygen generation by electrolysis.",
    sourceIds: ["iss-water-98", "bvad"],
  },
  {
    id: "dust",
    title: "Lunar dust and regolith",
    body:
      "Regolith grains were never weathered by wind or water, so they stay sharp. Electrostatically charged dust clings to suits, seals, radiators and solar panels. Apollo crews reported problems ranging from obscured visors to failing seals. Electrodynamic dust shields, demonstrated on the Moon in 2025, use electric fields to clear surfaces.",
    sourceIds: ["gaier2005", "eds2025"],
  },
  {
    id: "radiation",
    title: "Radiation",
    body:
      "The Moon has no global magnetic field and no thick atmosphere, so surface crews lack the protection that astronauts on the ISS get from Earth's magnetosphere. Solar particle events can raise exposure quickly; space-weather monitoring gives warning so crews can shelter behind mass such as water, equipment or piled regolith.",
    sourceIds: ["nasa-space-radiation"],
  },
  {
    id: "volatiles",
    title: "Water ice at the south pole",
    body:
      "Some crater floors near the poles never receive sunlight. Diviner measured temperatures there of only a few tens of kelvin, and LCROSS detected water in material thrown up from Cabeus crater. This ice could one day supply water, oxygen and rocket propellant.",
    sourceIds: ["paige2010", "colaprete2010"],
  },
  {
    id: "comms",
    title: "Communications",
    body:
      "Radio signals cross the ~384,000 km to Earth in about 1.3 seconds. At the south pole Earth is low on the horizon and often hidden by terrain, so missions rely on relay satellites — the idea behind NASA's LunaNet architecture.",
    sourceIds: ["lunanet", "moon-facts"],
  },
];
