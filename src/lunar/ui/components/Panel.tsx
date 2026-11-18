import type { ReactNode } from "react";

export function Panel({
  title,
  eyebrow,
  actions,
  children,
  className = "",
  bodyClass = "p-4",
  id,
}: {
  title?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
  id?: string;
}) {
  return (
    <section className={`lc-panel min-w-0 ${className}`} aria-labelledby={id && title ? `${id}-title` : undefined}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-lc-line px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <div className="lc-label mb-0.5">{eyebrow}</div>}
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className="font-display text-[15px] font-semibold tracking-[-0.01em] text-lc-text">
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, unit, hint, tone }: { label: ReactNode; value: ReactNode; unit?: string; hint?: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="lc-label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="lc-mono text-[20px] font-medium text-lc-text" style={tone ? { color: tone } : undefined}>
          {value}
        </span>
        {unit && <span className="lc-mono text-[11.5px] text-lc-mute">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-[12px] text-lc-dim">{hint}</div>}
    </div>
  );
}

export function SimNote({ children = "Simulated estimate — illustrative values, not real lunar-base data." }: { children?: ReactNode }) {
  return <p className="mt-3 text-[11.5px] italic text-lc-mute">{children}</p>;
}
