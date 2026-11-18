export function met(hour: number): string {
  const d = Math.floor(hour / 24);
  const h = hour % 24;
  return `D${d + 1} ${String(h).padStart(2, "0")}h`;
}

export function metLong(hour: number): string {
  const d = Math.floor(hour / 24);
  const h = hour % 24;
  return `MET ${String(d).padStart(2, "0")}:${String(h).padStart(2, "0")}:00`;
}

export function num(v: number, decimals = 1): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function signed(v: number, decimals = 2): string {
  if (Math.abs(v) < 0.5 * 10 ** -decimals) return `±${(0).toFixed(decimals)}`;
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(decimals)}`;
}

export function duration(hours: number | null): string {
  if (hours === null) return "Stable or rising";
  if (hours > 24 * 30) return "> 30 days";
  if (hours >= 48) return `≈ ${(hours / 24).toFixed(1)} days`;
  return `≈ ${Math.max(0, hours).toFixed(0)} h`;
}

export function pct(v: number, decimals = 0): string {
  return `${(v * 100).toFixed(decimals)}%`;
}
