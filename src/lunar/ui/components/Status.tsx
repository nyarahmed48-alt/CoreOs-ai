import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import type { Severity, StatusLevel } from "../../engine/types";

export const LEVEL_TEXT: Record<StatusLevel, string> = {
  nominal: "NOMINAL",
  caution: "CAUTION",
  warning: "WARNING",
  critical: "CRITICAL",
};

export const LEVEL_COLOR: Record<StatusLevel, string> = {
  nominal: "var(--color-lc-green)",
  caution: "var(--color-lc-caution)",
  warning: "var(--color-lc-amber)",
  critical: "var(--color-lc-red)",
};

export const SEVERITY_LEVEL: Record<Severity, StatusLevel> = {
  advisory: "nominal",
  caution: "caution",
  warning: "warning",
  critical: "critical",
};

/** Icon shape differs per level so status never relies on color alone. */
export function StatusIcon({ level, size = 14, x, y }: { level: StatusLevel; size?: number; x?: number; y?: number }) {
  const props = { size, color: LEVEL_COLOR[level], "aria-hidden": true, strokeWidth: 2.2, x, y } as const;
  if (level === "nominal") return <CheckCircle2 {...props} />;
  if (level === "caution") return <Info {...props} />;
  if (level === "warning") return <AlertTriangle {...props} />;
  return <OctagonAlert {...props} />;
}

export function StatusBadge({ level, label, pulse = false, size = "sm" }: { level: StatusLevel; label?: string; pulse?: boolean; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border lc-mono font-semibold whitespace-nowrap ${size === "md" ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[10.5px]"} tracking-[0.1em]`}
      style={{ borderColor: `color-mix(in srgb, ${LEVEL_COLOR[level]} 45%, transparent)`, background: `color-mix(in srgb, ${LEVEL_COLOR[level]} 10%, transparent)`, color: LEVEL_COLOR[level] }}
    >
      <span className={pulse && level === "critical" ? "lc-pulse inline-flex" : "inline-flex"}>
        <StatusIcon level={level} size={size === "md" ? 14 : 12} />
      </span>
      {label ?? LEVEL_TEXT[level]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <StatusBadge level={SEVERITY_LEVEL[severity]} label={severity.toUpperCase()} />;
}
