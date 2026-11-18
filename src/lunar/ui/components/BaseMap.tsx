import type { KeyboardEvent, ReactElement } from "react";
import { facilityName } from "../../engine/mutators";
import type { FacilityId, GameState } from "../../engine/types";
import { sunAzimuthAt } from "../../engine/illumination";
import { facilityLevel, facilityStatus } from "../selectors";
import { LEVEL_COLOR, LEVEL_TEXT, StatusIcon } from "./Status";

/** Status glyph: the same icon shapes as the badges, so status never relies on color alone. */
function Glyph({ x, y, level }: { x: number; y: number; level: ReturnType<typeof facilityLevel> }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill="#070b14" />
      <StatusIcon level={level} size={15} x={x - 7.5} y={y - 7.5} />
    </g>
  );
}

const SHORT_NAME: Record<FacilityId, string> = {
  habitat: "Habitat",
  power: "Power",
  oxygen: "Oxygen",
  water: "Water recovery",
  food: "Food production",
  lab: "Laboratory",
  comms: "Communications",
  storage: "Storage",
};

const STATUS_WORD: Record<string, string> = {
  online: "ONLINE",
  degraded: "DEGRADED",
  offline: "OFFLINE",
  failed: "FAILED",
  maintenance: "MAINT",
};

export function BaseMap({ s, selected, onSelect, compact = false }: { s: GameState; selected?: FacilityId | null; onSelect: (id: FacilityId) => void; compact?: boolean }) {
  const illum = s.power.illumination;
  const az = sunAzimuthAt(s.hour);
  const inShadow = illum < 0.3;
  const sunRad = ((az - 90) * Math.PI) / 180;

  const node = (id: FacilityId, x: number, y: number, w: number, h: number, shape: ReactElement, labelY?: number) => {
    const level = facilityLevel(s, id);
    const st = facilityStatus(s, id);
    const isSel = selected === id;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(id);
      }
    };
    return (
      <g
        key={id}
        role="button"
        tabIndex={0}
        aria-label={`${facilityName(id)}: ${STATUS_WORD[st]}, ${LEVEL_TEXT[level]}, condition ${Math.round(s.facilities[id].condition)} percent. Open details.`}
        aria-pressed={isSel}
        onClick={() => onSelect(id)}
        onKeyDown={onKey}
        className="cursor-pointer outline-none [&:focus-visible>rect.lc-hit]:stroke-[#4fd8eb]"
      >
        <rect className="lc-hit" x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx="12" fill={isSel ? "rgba(79,216,235,0.07)" : "transparent"} stroke={isSel ? "#4fd8eb" : "transparent"} strokeWidth="1.5" strokeDasharray={isSel ? undefined : "4 4"} />
        <g style={{ color: LEVEL_COLOR[level] }}>{shape}</g>
        <Glyph x={x + w - 2} y={y + 2} level={level} />
        {!compact && (
          <g>
            <text x={x + w / 2} y={(labelY ?? y + h + 18)} textAnchor="middle" fontSize="11.5" fill="#e6ecf5" fontWeight="600" stroke="#070b14" strokeWidth="4" paintOrder="stroke">
              {SHORT_NAME[id]}
            </text>
            <text x={x + w / 2} y={(labelY ?? y + h + 18) + 13} textAnchor="middle" fontSize="9.5" fill={LEVEL_COLOR[level]} className="lc-mono" letterSpacing="1" stroke="#070b14" strokeWidth="4" paintOrder="stroke">
              {STATUS_WORD[st]} · {Math.round(s.facilities[id].condition)}%
            </text>
          </g>
        )}
      </g>
    );
  };

  const flowOn = (id: FacilityId) => s.facilities[id].powerFraction > 0 && facilityStatus(s, id) !== "failed";
  const conduit = (d: string, id: FacilityId) => (
    <path key={`c-${id}`} d={d} fill="none" stroke={flowOn(id) ? "#1f9fb8" : "#2a3b5e"} strokeWidth="1.5" strokeDasharray="5 5" className={flowOn(id) ? "lc-flow" : undefined} />
  );

  const module = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2.2} fill="#0d1729" stroke="currentColor" strokeWidth="1.6" />
      <line x1={x + 12} y1={y + h / 2} x2={x + w - 12} y2={y + h / 2} stroke="#2a3b5e" strokeWidth="1" />
    </g>
  );

  return (
    <svg viewBox="0 0 800 470" className="h-auto w-full" role="group" aria-label="Schematic of the lunar outpost. Each facility can be selected for details.">
      <defs>
        <radialGradient id="lc-terrain" cx="40%" cy="60%" r="70%">
          <stop offset="0" stopColor="#0d1526" />
          <stop offset="1" stopColor="#05080f" />
        </radialGradient>
        <linearGradient id="lc-sun" x1="0" x2="1">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </linearGradient>
        <style>{`.lc-flow{animation:lcflow 1.2s linear infinite}@keyframes lcflow{to{stroke-dashoffset:-20}}@media (prefers-reduced-motion: reduce){.lc-flow{animation:none}}`}</style>
      </defs>
      <rect width="800" height="470" fill="url(#lc-terrain)" rx="12" />
      {/* Terrain contours (original illustration, not survey data) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx={690} cy={430} rx={120 + i * 55} ry={60 + i * 26} fill="none" stroke="#14203a" strokeWidth="1" />
      ))}
      <path d="M0,150 C120,120 200,95 320,110 S560,150 800,120" fill="none" stroke="#1b2740" strokeWidth="1.2" />
      <path d="M0,175 C140,150 240,128 360,140 S600,178 800,150" fill="none" stroke="#141f36" strokeWidth="1" />
      <text x="16" y="138" fontSize="9.5" fill="#56658a" className="lc-mono" letterSpacing="1.5">
        RIDGE CREST
      </text>
      <text x="610" y="455" fontSize="9.5" fill="#56658a" className="lc-mono" letterSpacing="1.5">
        CRATER RIM ↘
      </text>

      {/* Sun direction indicator */}
      <g transform="translate(740,52)" aria-hidden>
        <circle r="26" fill="none" stroke="#1b2740" />
        <line x1="0" y1="0" x2={Math.cos(sunRad) * 26} y2={Math.sin(sunRad) * 26} stroke={inShadow ? "#56658a" : "#ffd36b"} strokeWidth="2" />
        <circle cx={Math.cos(sunRad) * 26} cy={Math.sin(sunRad) * 26} r="4" fill={inShadow ? "#56658a" : "#ffd36b"} />
        <text y="42" textAnchor="middle" fontSize="9" fill="#7d8ca8" className="lc-mono">
          SUN AZ {Math.round(az)}°
        </text>
      </g>

      {/* Conduits from power to each consumer */}
      {conduit("M195,190 C190,210 300,230 330,236", "habitat")}
      {conduit("M195,190 C190,260 170,300 160,322", "storage")}
      {conduit("M195,190 C230,300 320,320 330,350", "oxygen")}
      {conduit("M195,190 C300,250 450,310 470,350", "water")}
      {conduit("M195,190 C330,190 560,170 590,236", "lab")}
      {conduit("M195,190 C400,80 560,80 640,100", "comms")}
      {conduit("M195,190 C260,260 600,330 610,350", "food")}

      {/* Corridors */}
      <path d="M300,262 L470,262 M470,262 L540,262 M250,262 L300,262 M400,290 L400,330 M470,290 L520,330 M330,290 L300,330" stroke="#22314f" strokeWidth="6" strokeLinecap="round" />

      {node(
        "power",
        110,
        44,
        170,
        96,
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={118 + i * 42} y={50} width="30" height="74" rx="2" fill={inShadow ? "#0a1120" : "#0f2440"} stroke="currentColor" strokeWidth="1.3" />
              {[0, 1, 2, 3, 4].map((j) => (
                <line key={j} x1={118 + i * 42} x2={148 + i * 42} y1={62 + j * 13} y2={62 + j * 13} stroke="#1b3358" strokeWidth="0.8" />
              ))}
              <line x1={133 + i * 42} x2={133 + i * 42} y1={124} y2={140} stroke="currentColor" strokeWidth="1.3" />
            </g>
          ))}
          {s.facilities.power.dust > 20 && <rect x={116} y={48} width={160} height={78} fill="#8a7a5c" opacity={Math.min(0.35, s.facilities.power.dust / 200)} />}
          {inShadow && (
            <text x={195} y={92} textAnchor="middle" fontSize="10" fill="#a3b0c6" className="lc-mono" letterSpacing="1.5">
              IN SHADOW
            </text>
          )}
        </g>,
        165,
      )}

      {node(
        "comms",
        610,
        64,
        64,
        70,
        <g>
          <path d="M618,100 A28,28 0 0 1 666,76" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="642" y1="88" x2="642" y2="134" stroke="currentColor" strokeWidth="1.6" />
          <line x1="630" y1="134" x2="654" y2="134" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="642" cy="88" r="3" fill="currentColor" />
          {s.science.linkQuality >= 0.15 && <path d="M672,70 q8,-8 16,0 M676,62 q12,-12 24,0" fill="none" stroke="#1f9fb8" strokeWidth="1.2" />}
        </g>,
      )}

      {node("habitat", 330, 220, 140, 70, module(330, 220, 140, 70))}
      {node("lab", 540, 226, 110, 58, module(540, 226, 110, 58))}
      {node("storage", 120, 322, 100, 50, module(120, 322, 100, 50))}
      {node("food", 560, 350, 110, 50, module(560, 350, 110, 50))}
      {node(
        "oxygen",
        300,
        350,
        90,
        50,
        <g>
          <rect x="300" y="350" width="90" height="50" rx="8" fill="#0d1729" stroke="currentColor" strokeWidth="1.6" />
          <text x="345" y="380" textAnchor="middle" fontSize="12" fill="#a3b0c6" className="lc-mono">
            O₂
          </text>
        </g>,
      )}
      {node(
        "water",
        430,
        350,
        90,
        50,
        <g>
          <rect x="430" y="350" width="90" height="50" rx="8" fill="#0d1729" stroke="currentColor" strokeWidth="1.6" />
          <text x="475" y="380" textAnchor="middle" fontSize="12" fill="#a3b0c6" className="lc-mono">
            H₂O
          </text>
        </g>,
      )}
    </svg>
  );
}
