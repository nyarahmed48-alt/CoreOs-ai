# LUNAR COMMAND

**An immersive lunar-base simulation and mission-management platform.**

You are the mission commander of *Ridge Station*, a fictional four-person research outpost on a sunlit ridge near the Moon's south pole. Keep the base operational under tight limits on power, oxygen, water, food and spare parts. Respond to events, manage your crew and complete your science objectives.

> Independent educational project created for the NASA Space Apps Challenge. It is **not** built, endorsed, certified by, or affiliated with NASA. All values in the simulation are simulated estimates. They are not real lunar-base operational data.

---

## Features

| Area | What it does |
|---|---|
| **Mission Control dashboard** | Mission, base, crew, power, O₂, water, food and comms status with NOMINAL / CAUTION / WARNING / CRITICAL labels (icon + text, never color alone), a live base schematic, an activity feed, objectives, and a tutorial checklist in the guided scenario. |
| **Lunar base overview** | Original SVG schematic. Every facility (habitat, power, O₂ generation, water recovery, food production, lab, comms, storage) is clickable and keyboard-operable, and opens its condition, power draw, production, consumption, maintenance status, actions, and the science behind it, with sources. |
| **Resource engine** | Oxygen, water, food, battery energy, spare parts and science supplies, each with quantity, capacity, production, consumption, trend, warning threshold, time-to-empty and history charts. |
| **Life support** | Cabin pressure, temperature, CO₂, CO₂-removal / filtration capacity, O₂ and water, with explanations. Gameplay bands are clearly separated from real safety limits. |
| **Power management** | Solar generation, battery charge and flow, demand, reserve, reorderable power priorities, a battery reserve floor, per-facility load switches, and a 72-hour illumination forecast. |
| **Food & water** | Stocks, consumption, hydroponic output and efficiency, recycling efficiency, wastewater buffer, plus rationing and conservation policies. |
| **Crew** | Four fictional crew members with roles, specialties, assignments, workload and a wellbeing indicator (gameplay only, not medical), and the maintenance job queue. |
| **Mission events** | 14 events, including terrain shadow, dust, comms interference, filter saturation, storage thermal fault, solar particle event, cabin leak, CO₂ sorbent problems, pump failure and cargo delays. Each has a severity, affected systems, 2–3 decisions with real consequences, a deadline with a default action, and an explanation of the underlying science. |
| **Objectives** | Primary and secondary objectives with progress and completion state. |
| **Timeline** | Automatic, filterable log of events, decisions, failures, repairs, alerts, objectives, science milestones and resupply. |
| **Mission report** | Rule-based outcome (*accomplished*, *completed with limitations*, *unsuccessful*) with written reasons, objectives, resource efficiency, reliability, crew safety, decisions and major events. |
| **Science & sources** | Topic explainers, a full assumptions table (each value tagged SOURCED / PHYSICS / ILLUSTRATIVE), a reference list and a glossary. |
| **NASA imagery (optional)** | Live search of the NASA Image and Video Library, with a timeout, rate-limit handling, a 24 h cache and an offline demonstration mode. |
| **Onboarding & tutorial** | A five-step briefing and a guided 3-day *Shakedown Cruise* scenario. |
| **Persistence** | Automatic local save, resume on reload, reset with confirmation, and graceful handling of corrupt or outdated saves (the bad save is moved to a backup key). |
| **Accessibility** | Keyboard operation (Space = run/pause, `.` = +1 h, Esc closes dialogs), visible focus rings, focus-trapped dialogs, labeled meters and switches, chart data tables, status shapes in addition to color, and `prefers-reduced-motion` support. |

## Technology stack

- **React 19 + TypeScript + Vite 6**: the existing stack of this repository, reused unchanged.
- **Tailwind CSS v4**: theme tokens `lc-*` in `src/index.css`.
- **lucide-react** for icons.
- **Vitest** for engine tests.
- Charts are small hand-written SVG components. Recharts was not added because the charts are simple, and hand-written SVG avoids a ~100 KB dependency.

The app is lazy-loaded at **`/lunar`** (`src/Root.tsx`), so visitors to the rest of the site never download it.

## Installation & commands

```bash
npm install            # install dependencies
npx vite               # dev server (frontend only) → http://localhost:5173/lunar
npm run dev            # full dev server of this repo (Express + Vite) → /lunar
npm test               # run the simulation test suite (Vitest)
npm run lint           # TypeScript type-check
npm run build:web      # production build of the static site → dist/
```

Requires Node.js ≥ 20. The existing Netlify, Vercel and Cloudflare configs already serve `index.html` for unknown paths, so `/lunar` works after deployment with no extra configuration.

## Architecture

```
src/lunar/
├── engine/                 Pure TypeScript simulation (no React)
│   ├── types.ts            Serializable GameState and all domain types
│   ├── config.ts           ALL tunable assumptions + status bands + assumptions table
│   ├── scenarios.ts        Tutorial / Standard / Challenging missions and objectives
│   ├── illumination.ts     Polar illumination model and forecast
│   ├── step.ts             The hourly simulation step
│   ├── events.ts           Event definitions, triggering, decision resolution
│   ├── actions.ts          Every commander action (pure reducer with error messages)
│   ├── objectives.ts       Objective progress and completion
│   ├── evaluation.ts       End-of-mission report and outcome rules
│   ├── persistence.ts      Versioned localStorage save/load + validation
│   ├── mutators.ts, rng.ts Helpers; seeded PRNG for deterministic replays
│   └── __tests__/          Vitest suites + a rule-based "competent commander"
├── science/                Sources, educational content, NASA image client
├── state/useMission.ts     React binding: state, real-time clock, autosave
├── ui/                     Components and views
└── LunarApp.tsx            Application shell
```

**Key decisions**

- **Pure, deterministic engine.** `stepHour(state) → state` never mutates its input, and all randomness comes from a seeded PRNG stored in the state. The same seed plus the same actions always gives the same mission, which makes the engine fully testable.
- **One time unit.** Every rate is per simulated hour. The UI's real-time clock just calls `advance(1)` every 2 s ÷ speed. "+1 day" advances 24 steps and stops early when a new event needs a decision.
- **Serializable state.** Event definitions and their consequences live in code. The save stores only ids, numbers and data-only job effects, so saves stay small and robust.
- **Config, not code.** All assumptions are in `engine/config.ts`, and the Science page renders them from there.

## Simulation model (summary)

Every hour, in this order:

1. **Power.** Solar = capacity × illumination × (1 − dust loss) × array condition. Power is allocated by the commander's priority order, using solar first and then the battery (subject to the reserve floor for non-top priorities). Any surplus charges the battery (95% efficiency each way).
2. **Facility output** = power fraction × condition factor (full above 60%, tapering below) × event modifiers. Failed, switched-off, load-shed or under-repair facilities produce nothing.
3. **Cabin.** CO₂ rises with the crew and falls with removal capacity. Temperature falls without thermal power. Leaks are replaced with stored gas.
4. **Consumables.** For each consumable, change = production − consumption, clamped to [0, capacity]. Electrolysis uses 1.125 kg H₂O per kg O₂. Used water goes to a wastewater buffer that the recycler processes at 93% recovery. Hydroponics needs power and water and is throttled when water is critical. Unpowered storage spoils food.
5. **Science.** Crew labor in the lab produces research and data. Comms link quality limits downlink.
6. **Wear and failures.** Facilities wear while running, operations crew reduce wear, and below 30% condition there is a seeded random failure chance.
7. **Jobs.** Maintenance crew work the queue. Repairs and services cost spare parts and crew-hours, and EVA jobs pause during radiation holds.
8. **Crew.** Workload and wellbeing change with shifts (sleep 22:00–06:00), rest, cabin conditions and rationing.
9. **Logistics, alerts and aborts.** Evacuation is triggered if O₂ is empty for 6 h, water for 24 h, food for 48 h, CO₂ or temperature is critical for 12 h, or pressure is critical for 6 h.
10. **Objectives, events and mission end.**

**Balance** is verified by tests. A rule-based "competent commander" accomplishes the Standard mission on every tested seed and survives the Challenging one, while a passive player does not fully succeed.

## Scientific sources

| Topic | Source |
|---|---|
| Crew O₂ use (~0.82 kg/crew-day), life-support planning | Anderson, Ewert & Keener, *Life Support Baseline Values and Assumptions Document*, NASA/TP-2015-218570/REV1 (2018). ntrs.nasa.gov/citations/20180001338 |
| ISS water recovery 93–94% → 98% with Brine Processor | NASA, 2023 (reported by Space.com) |
| Polar illumination from LOLA topography | Mazarico et al., *Icarus* 211, 1066–1081 (2011) |
| Apollo dust effects | Gaier, NASA/TM-2005-213610/REV1 (2007) |
| Electrodynamic Dust Shield lunar demonstration | NASA KSC / Firefly Blue Ghost M1, 2025 |
| South-polar cold traps | Paige et al., *Science* 330, 479–482 (2010) |
| Water in the LCROSS plume | Colaprete et al., *Science* 330, 463–468 (2010) |
| Lunar relay communications (LunaNet) | NASA SCaN, *Lunar Communications and Navigation Architecture* (2024) |
| Basic lunar facts | NASA Science, *Moon Facts* |
| Radiation & sheltering at the Moon | NASA Science, *How NASA Will Protect Astronauts From Space Radiation at the Moon* |
| Crew-environment standards (not used for game bands) | NASA-STD-3001 Vol. 2 |
| Plants on ISS | NASA, *Veggie* |
| Fission Surface Power | NASA / U.S. DOE |

Full links are in `science/sources.ts` and on the in-app **Science & Sources** page.

## NASA data integration

| | |
|---|---|
| **Data source** | NASA Image and Video Library |
| **Endpoint** | `GET https://images-api.nasa.gov/search?q=<query>&media_type=image` |
| **Credentials** | None (this service does not use api.nasa.gov keys, so there is no key to protect) |
| **Update frequency** | Library curated continuously; the app caches results locally for 24 h |
| **Limitations** | Optional and on-demand. Search results are keyword-based. Images are context only and do not drive the simulation. |
| **Attribution** | Each image shows "Credit: NASA/<center>" and its NASA id, and links to images.nasa.gov. NASA media must not be used to imply NASA endorsement. |
| **Failure handling** | Timeout (8 s), HTTP errors, 429 rate limiting, malformed JSON, insecure URLs and offline state each fall back to a labeled demonstration mode. |

Datasets that were considered and not integrated:

- **LOLA illumination maps.** Large PDS raster products not suited to a browser app, so the illumination profile is illustrative instead.
- **APOD.** Not relevant to base operations.

## Known limitations

- The illumination windows, equipment capacities, power demands and most rates are **illustrative**. They are not engineering values for any real lunar base.
- Real habitats replenish an N₂/O₂ mix and may run at lower pressure. Hydrogen and CO₂ recovery (Sabatier) is not modeled.
- The crew model is deliberately simple and non-medical.
- Saves live in one browser's localStorage. There are no accounts and no sync.
- The NASA image search could not be exercised live from the build environment (network-restricted). Its parsing and every failure path are covered by unit tests with mocked responses.
- The UI is English-only and dark-theme only.
