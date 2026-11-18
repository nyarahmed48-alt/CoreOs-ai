import { useEffect, useMemo, useRef, useState } from "react";
import type { StatusLevel } from "../../engine/types";
import { LEVEL_COLOR } from "./Status";

export interface Series {
  key: string;
  label: string;
  color: string;
  points: { x: number; y: number }[];
  dashed?: boolean;
}

export interface Threshold {
  y: number;
  label: string;
  level: StatusLevel;
}

/**
 * Lightweight responsive SVG line chart.
 * One y-axis only; 2px lines; crosshair + tooltip on hover/keyboard; legend
 * shown for ≥2 series; a data table toggle for screen readers and print.
 */
export function LineChart({
  series,
  unit,
  title,
  height = 180,
  thresholds = [],
  yMin,
  yMax,
  xLabel = (x: number) => `h${x}`,
  nowX,
  decimals = 1,
  area = false,
}: {
  series: Series[];
  unit: string;
  title: string;
  height?: number;
  thresholds?: Threshold[];
  yMin?: number;
  yMax?: number;
  xLabel?: (x: number) => string;
  nowX?: number;
  decimals?: number;
  area?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(Math.max(240, entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { l: 44, r: 12, t: 10, b: 24 };
  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const x0 = allX.length ? Math.min(...allX) : 0;
  const x1 = allX.length ? Math.max(...allX, x0 + 1) : 1;
  const rawMin = yMin ?? Math.min(0, ...allY, ...thresholds.map((t) => t.y));
  const rawMax = yMax ?? Math.max(1, ...allY, ...thresholds.map((t) => t.y)) * 1.08;
  const y0 = rawMin;
  const y1 = rawMax === rawMin ? rawMin + 1 : rawMax;

  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (width - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - y0) / (y1 - y0)) * (height - pad.t - pad.b);

  const yTicks = useMemo(() => {
    const n = 4;
    return Array.from({ length: n + 1 }, (_, i) => y0 + ((y1 - y0) * i) / n);
  }, [y0, y1]);
  const xTicks = useMemo(() => {
    const span = x1 - x0;
    const step = span <= 30 ? 6 : span <= 80 ? 12 : span <= 200 ? 24 : 48;
    const out: number[] = [];
    for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) out.push(x);
    return out;
  }, [x0, x1]);

  const xs = series[0]?.points.map((p) => p.x) ?? [];
  const hoverX = hover !== null ? xs[hover] : null;

  const onMove = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || xs.length === 0) return;
    const x = x0 + ((clientX - rect.left - pad.l) / (width - pad.l - pad.r)) * (x1 - x0);
    let best = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
    setHover(best);
  };

  const path = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");

  if (xs.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-lc-line text-[12.5px] text-lc-mute" style={{ height }}>
        No data yet — advance the simulation to start recording.
      </div>
    );
  }

  const tipLeft = hoverX !== null ? Math.min(width - 170, Math.max(0, sx(hoverX) + 10)) : 0;

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-[12px] text-lc-dim">
              <svg width="18" height="6" aria-hidden>
                <line x1="0" y1="3" x2="18" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} />
              </svg>
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={wrapRef}
        className="relative select-none"
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
        tabIndex={0}
        role="img"
        aria-label={`${title} chart. Use left and right arrow keys to inspect values.`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((h) => Math.min(xs.length - 1, (h ?? xs.length - 2) + 1));
          if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? xs.length) - 1));
          if (e.key === "Escape") setHover(null);
        }}
        onBlur={() => setHover(null)}
      >
        <svg width={width} height={height} className="block overflow-visible">
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={sy(t)} y2={sy(t)} stroke="#16213a" strokeWidth="1" />
              <text x={pad.l - 6} y={sy(t) + 3.5} textAnchor="end" className="lc-mono" fontSize="10" fill="#7d8ca8">
                {Math.abs(y1 - y0) < 10 ? t.toFixed(1) : Math.round(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={sx(t)} y={height - 6} textAnchor="middle" className="lc-mono" fontSize="10" fill="#7d8ca8">
              {xLabel(t)}
            </text>
          ))}
          {thresholds.map((t) => (
            <g key={t.label}>
              <line x1={pad.l} x2={width - pad.r} y1={sy(t.y)} y2={sy(t.y)} stroke={LEVEL_COLOR[t.level]} strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 4" />
              <text x={width - pad.r} y={sy(t.y) - 4} textAnchor="end" fontSize="10" fill="#a3b0c6">
                {t.label}
              </text>
            </g>
          ))}
          {nowX !== undefined && nowX >= x0 && nowX <= x1 && (
            <g>
              <line x1={sx(nowX)} x2={sx(nowX)} y1={pad.t} y2={height - pad.b} stroke="#4fd8eb" strokeOpacity="0.5" strokeWidth="1" />
              <text x={sx(nowX) + 4} y={pad.t + 9} fontSize="10" fill="#4fd8eb" className="lc-mono">
                NOW
              </text>
            </g>
          )}
          {series.map((s) => (
            <g key={s.key}>
              {area && series.length === 1 && (
                <path
                  d={`${path(s.points)}L${sx(s.points[s.points.length - 1].x)},${sy(y0)}L${sx(s.points[0].x)},${sy(y0)}Z`}
                  fill={s.color}
                  fillOpacity="0.12"
                />
              )}
              <path d={path(s.points)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "5 4" : undefined} />
            </g>
          ))}
          {hoverX !== null && (
            <g>
              <line x1={sx(hoverX)} x2={sx(hoverX)} y1={pad.t} y2={height - pad.b} stroke="#a3b0c6" strokeWidth="1" />
              {series.map((s) => {
                const p = s.points[hover!];
                return p ? <circle key={s.key} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill={s.color} stroke="#0a101c" strokeWidth="2" /> : null;
              })}
            </g>
          )}
        </svg>
        {hoverX !== null && (
          <div className="pointer-events-none absolute top-1 z-10 min-w-[150px] rounded-lg border border-lc-line2 bg-[#0d1626]/95 px-3 py-2 shadow-lg" style={{ left: tipLeft }}>
            <div className="lc-mono text-[10.5px] text-lc-mute">{xLabel(hoverX)}</div>
            {series.map((s) => {
              const p = s.points[hover!];
              return p ? (
                <div key={s.key} className="mt-0.5 flex items-center justify-between gap-3 text-[12px]">
                  <span className="flex items-center gap-1.5 text-lc-dim">
                    <span className="inline-block h-[2px] w-3" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="lc-mono text-lc-text">
                    {p.y.toFixed(decimals)} {unit}
                  </span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
      <button type="button" className="mt-1 text-[11.5px] text-lc-mute underline-offset-2 hover:text-lc-dim hover:underline" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
        {showTable ? "Hide data table" : "Show data table"}
      </button>
      {showTable && (
        <div className="lc-scroll mt-2 max-h-48 overflow-auto rounded-lg border border-lc-line">
          <table className="w-full text-left text-[12px]">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-lc-panel2 text-lc-mute">
              <tr>
                <th className="px-3 py-1.5 font-medium">Time</th>
                {series.map((s) => (
                  <th key={s.key} className="px-3 py-1.5 font-medium">
                    {s.label} ({unit})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="lc-mono text-lc-dim">
              {xs.map((x, i) => (
                <tr key={x} className="border-t border-lc-line">
                  <td className="px-3 py-1">{xLabel(x)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1">
                      {s.points[i]?.y.toFixed(decimals)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
