"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pause, Play, Trash2 } from "lucide-react";
import { usePreferences } from "@/components/PreferencesProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Money } from "@/components/Money";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/client-api";
import { convert, formatMoney } from "@/lib/currency";
import { SETTLED_STATUSES } from "@/lib/validation";
import type { EntryDTO } from "@/lib/entries";

export function StatsDashboard({ entries }: { entries: EntryDTO[] }) {
  const router = useRouter();
  const { currency: base } = usePreferences();
  const [pendingDelete, setPendingDelete] = useState<EntryDTO | null>(null);
  const [pendingPause, setPendingPause] = useState<EntryDTO | null>(null);

  /** All totals are normalised into the viewer's base currency. */
  const stats = useMemo(() => {
    let total = 0;
    let settled = 0;
    let open = 0;
    let paused = 0;
    const byType = new Map<string, number>();

    for (const entry of entries) {
      const value = convert(entry.amount, entry.currency, base);
      total += value;
      if (SETTLED_STATUSES.includes(entry.status)) settled += value;
      else if (entry.status !== "cancelled") open += value;
      if (entry.status === "paused") paused += 1;
      byType.set(entry.type, (byType.get(entry.type) ?? 0) + value);
    }

    const types = [...byType.entries()].sort((a, b) => b[1] - a[1]);
    return { total, settled, open, paused, types };
  }, [entries, base]);

  async function commitDelete() {
    if (!pendingDelete) return;
    await apiRequest(`/api/entries/${pendingDelete.id}`, { method: "DELETE" });
    setPendingDelete(null);
    router.refresh();
  }

  async function commitPause() {
    if (!pendingPause) return;
    const next = pendingPause.status === "paused" ? "active" : "paused";
    await apiRequest(`/api/entries/${pendingPause.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    setPendingPause(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total entries" value={String(entries.length)} />
        <StatCard label="Total value" value={formatMoney(stats.total, base)} />
        <StatCard
          label="Paid / completed"
          value={formatMoney(stats.settled, base)}
          tone="success"
        />
        <StatCard
          label="Open / pending"
          value={formatMoney(stats.open, base)}
          tone="warning"
        />
        <StatCard label="Paused" value={String(stats.paused)} />
      </div>

      <section className="card space-y-5">
        <h2 className="label">Revenue by type</h2>
        {stats.types.length === 0 ? (
          <p className="text-sm text-muted">No entries to summarise yet.</p>
        ) : (
          <div className="space-y-4">
            {stats.types.map(([type, value]) => {
              const share = stats.total > 0 ? (value / stats.total) * 100 : 0;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="chip">{type}</span>
                    <span className="text-sm text-muted">
                      {formatMoney(value, base)} ({share.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
                    role="img"
                    aria-label={`${type}: ${share.toFixed(1)} percent of total value`}
                  >
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(share, 0.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="label">Manage clients</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Code", "Name", "Type", "Amount", "Status", ""].map((heading) => (
                  <th
                    key={heading}
                    className="px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-muted"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-4 font-medium text-accent-ink">
                    {entry.code}
                  </td>
                  <td className="px-3 py-4">{entry.name}</td>
                  <td className="px-3 py-4">
                    <span className="chip">{entry.type}</span>
                  </td>
                  <td className="px-3 py-4">
                    <Money amount={entry.amount} currency={entry.currency} />
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/receipt?entry=${entry.id}`}
                        className="btn-ghost px-3 py-2"
                      >
                        details
                      </Link>
                      <button
                        type="button"
                        className="btn-ghost px-3 py-2"
                        onClick={() => setPendingPause(entry)}
                      >
                        {entry.status === "paused" ? (
                          <>
                            <Play className="h-3.5 w-3.5" aria-hidden />
                            resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-3.5 w-3.5" aria-hidden />
                            pause
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-danger px-3 py-2"
                        onClick={() => setPendingDelete(entry)}
                        aria-label={`Delete ${entry.code}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-muted">
                    No clients yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {pendingPause ? (
        <ConfirmDialog
          title={
            pendingPause.status === "paused" ? "Resume entry?" : "Pause entry?"
          }
          confirmLabel="Confirm"
          message={
            <>
              <strong className="text-ink">{pendingPause.code}</strong> will move
              to{" "}
              <strong className="text-ink">
                {pendingPause.status === "paused" ? "active" : "paused"}
              </strong>
              .
            </>
          }
          onConfirm={commitPause}
          onCancel={() => setPendingPause(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete entry?"
          tone="danger"
          confirmLabel="Delete"
          message={
            <>
              <strong className="text-ink">{pendingDelete.code}</strong> —{" "}
              {pendingDelete.name} will be removed permanently.
            </>
          }
          onConfirm={commitDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-ink";

  return (
    <div className="card">
      <p className="label">{label}</p>
      <p
        className={`mt-3 text-3xl font-semibold tracking-tight ${toneClass}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}
