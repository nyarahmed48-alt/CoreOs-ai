/**
 * SCIENTIFIC SOURCES
 *
 * Every source below was checked to exist when this file was written. Claims
 * in the app reference these by id. Where the app uses an illustrative value,
 * it says so (see CONFIG/ASSUMPTIONS) rather than attributing it to a source.
 */
export interface Source {
  id: string;
  title: string;
  authors?: string;
  publisher: string;
  year: string;
  url: string;
  usedFor: string;
}

export const SOURCES: Source[] = [
  {
    id: "bvad",
    title: "Life Support Baseline Values and Assumptions Document (NASA/TP-2015-218570/REV1)",
    authors: "M. S. Anderson, M. K. Ewert, J. F. Keener",
    publisher: "NASA Technical Reports Server",
    year: "2018",
    url: "https://ntrs.nasa.gov/citations/20180001338",
    usedFor: "Crew metabolic oxygen use (~0.82 kg/crew-day), CO₂ production, and general life-support planning assumptions.",
  },
  {
    id: "iss-water-98",
    title: "ISS Environmental Control and Life Support System reaches 98% water recovery (Brine Processor Assembly)",
    publisher: "NASA (reported by Space.com)",
    year: "2023",
    url: "https://www.space.com/astronaut-pee-iss-water-recycling-98-percent-milestone",
    usedFor: "Water recovery on ISS was 93–94% before the Brine Processor Assembly and has since been demonstrated at about 98%.",
  },
  {
    id: "mazarico2011",
    title: "Illumination conditions of the lunar polar regions using LOLA topography",
    authors: "E. Mazarico, G. A. Neumann, D. E. Smith, M. T. Zuber, M. H. Torrence",
    publisher: "Icarus 211, 1066–1081 (doi:10.1016/j.icarus.2010.10.030)",
    year: "2011",
    url: "https://ntrs.nasa.gov/citations/20120010094",
    usedFor: "Polar illumination is computed from laser-altimetry topography; ridges see long sunlit periods broken by predictable terrain shadow.",
  },
  {
    id: "gaier2005",
    title: "The Effects of Lunar Dust on EVA Systems During the Apollo Missions (NASA/TM-2005-213610/REV1)",
    authors: "J. R. Gaier",
    publisher: "NASA Glenn Research Center",
    year: "2005, rev. 2007",
    url: "https://ntrs.nasa.gov/citations/20070021819",
    usedFor: "Apollo dust problems: vision obscuration, coatings, clogged mechanisms, abrasion, thermal-control problems and seal failures.",
  },
  {
    id: "eds2025",
    title: "NASA Demonstrates Its Electric Moon Dust Shield Works on Lunar Surface (Blue Ghost Mission 1)",
    publisher: "AIAA / NASA Kennedy Space Center",
    year: "2025",
    url: "https://aiaa.org/2025/04/04/nasa-demonstrates-its-electric-moon-dust-shield-works-on-lunar-surface/",
    usedFor: "The Electrodynamic Dust Shield removed most dust from glass and radiator test surfaces on the Moon.",
  },
  {
    id: "paige2010",
    title: "Diviner Lunar Radiometer Observations of Cold Traps in the Moon's South Polar Region",
    authors: "D. A. Paige et al.",
    publisher: "Science 330, 479–482",
    year: "2010",
    url: "https://pubs.usgs.gov/publication/70036393",
    usedFor: "Permanently shadowed craters near the south pole reach temperatures of only a few tens of kelvin, cold enough to trap water ice.",
  },
  {
    id: "colaprete2010",
    title: "Detection of Water in the LCROSS Ejecta Plume",
    authors: "A. Colaprete et al.",
    publisher: "Science 330, 463–468 (doi:10.1126/science.1186986)",
    year: "2010",
    url: "https://www.nasa.gov/centers/ames/news/releases/2010/10-89AR.html",
    usedFor: "Water ice was detected in material excavated from the permanently shadowed crater Cabeus.",
  },
  {
    id: "lunanet",
    title: "Lunar Communications and Navigation Architecture",
    publisher: "NASA Space Communications and Navigation (SCaN)",
    year: "2024",
    url: "https://www.nasa.gov/wp-content/uploads/2024/01/lunar-communications-and-navigation-architecture.pdf",
    usedFor: "Relay-based lunar networking (LunaNet), including relays serving the south polar region.",
  },
  {
    id: "moon-facts",
    title: "Moon Facts",
    publisher: "NASA Science",
    year: "accessed 2026",
    url: "https://science.nasa.gov/moon/facts/",
    usedFor: "Basic lunar facts: average Earth–Moon distance, length of the lunar day, surface temperature extremes.",
  },
  {
    id: "nasa-space-radiation",
    title: "How NASA Will Protect Astronauts From Space Radiation at the Moon",
    publisher: "NASA Science",
    year: "2024",
    url: "https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/",
    usedFor: "No magnetospheric protection at the Moon; space-weather monitoring and sheltering from solar particle events, including regolith shielding.",
  },
  {
    id: "nasa-std-3001",
    title: "NASA-STD-3001 Spaceflight Human-System Standard, Volume 2: Human Factors, Habitability and Environmental Health",
    publisher: "NASA Office of the Chief Health and Medical Officer",
    year: "Rev. E, 2025",
    url: "https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/",
    usedFor: "The authoritative source for real crew-environment requirements. The game's bands are NOT taken from it.",
  },
  {
    id: "veggie",
    title: "Veggie (Vegetable Production System) on the International Space Station",
    publisher: "NASA",
    year: "accessed 2026",
    url: "https://www.nasa.gov/mission_pages/station/research/news/veggie",
    usedFor: "Salad crops have been grown and eaten on ISS using LED lighting and wicking 'plant pillows'.",
  },
  {
    id: "fsp",
    title: "Fission Surface Power project",
    publisher: "NASA Glenn Research Center / U.S. Department of Energy",
    year: "2022–2025",
    url: "https://www.energy.gov/node/4542141",
    usedFor: "NASA's 40 kW-class fission reactor concept for power through the ~14-day lunar night.",
  },
];

export const SOURCE_MAP: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
