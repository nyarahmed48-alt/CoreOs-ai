const TONE: Record<string, string> = {
  active: "border-accent/40 bg-accent-soft text-accent-ink",
  pending: "border-warning/40 bg-warning/10 text-warning",
  paid: "border-success/40 bg-success/10 text-success",
  completed: "border-success/40 bg-success/10 text-success",
  paused: "border-line bg-surface-3 text-muted",
  cancelled: "border-danger/40 bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] uppercase tracking-wider ${
        TONE[status] ?? TONE.paused
      }`}
    >
      {status}
    </span>
  );
}
