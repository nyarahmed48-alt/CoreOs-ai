import type { StatusLevel } from "../../engine/types";
import { LEVEL_COLOR } from "./Status";

/** Horizontal fill meter with optional threshold ticks. */
export function Meter({
  value,
  max,
  level = "nominal",
  thresholds = [],
  label,
  height = 6,
}: {
  value: number;
  max: number;
  level?: StatusLevel;
  thresholds?: { at: number; label: string }[];
  label: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="relative w-full overflow-hidden rounded-full bg-[#121c2e]"
      style={{ height }}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value * 10) / 10}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: LEVEL_COLOR[level] }} />
      {thresholds.map((t) => (
        <span
          key={t.label}
          title={t.label}
          className="absolute top-0 h-full w-[2px] bg-lc-bg"
          style={{ left: `${Math.max(0, Math.min(100, (t.at / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}
