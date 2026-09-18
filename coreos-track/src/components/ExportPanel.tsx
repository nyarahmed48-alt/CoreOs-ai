"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { convert, formatMoney } from "@/lib/currency";
import { usePreferences } from "@/components/PreferencesProvider";
import type { EntryDTO } from "@/lib/entries";

const COLUMNS = [
  "code",
  "name",
  "type",
  "amount",
  "currency",
  "status",
  "date",
  "due_date",
  "notes",
  "link_url",
] as const;

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(entries: EntryDTO[]): string {
  const rows = entries.map((entry) =>
    [
      entry.code,
      entry.name,
      entry.type,
      entry.amount,
      entry.currency,
      entry.status,
      entry.date,
      entry.dueDate ?? "",
      entry.notes ?? "",
      entry.linkUrl ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [COLUMNS.join(","), ...rows].join("\n");
}

function download(filename: string, contents: string, mime: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ entries }: { entries: EntryDTO[] }) {
  const { currency: base } = usePreferences();
  const [done, setDone] = useState<string | null>(null);

  const stamp = new Date().toISOString().slice(0, 10);
  const total = entries.reduce(
    (sum, entry) => sum + convert(entry.amount, entry.currency, base),
    0,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card space-y-5">
        <div>
          <h2 className="page-title text-lg">Export data</h2>
          <p className="mt-2 text-sm text-muted">
            Download every entry exactly as stored — amounts keep their own
            currency, so nothing is rounded on the way out.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="label">Entries</dt>
            <dd className="mt-1 text-xl">{entries.length}</dd>
          </div>
          <div>
            <dt className="label">Total ({base})</dt>
            <dd className="mt-1 text-xl">{formatMoney(total, base)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              download(`coreos-track-${stamp}.csv`, toCsv(entries), "text/csv");
              setDone("CSV downloaded.");
            }}
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              download(
                `coreos-track-${stamp}.json`,
                JSON.stringify({ exportedAt: new Date().toISOString(), entries }, null, 2),
                "application/json",
              );
              setDone("JSON downloaded.");
            }}
          >
            <Download className="h-4 w-4" aria-hidden />
            Export JSON
          </button>
        </div>

        {done ? <p className="text-xs text-success">{done}</p> : null}
      </section>

      <section className="card space-y-4">
        <h2 className="label">Preview</h2>
        <pre className="max-h-96 overflow-auto rounded-xl border border-line bg-surface-2 p-4 text-[11px] leading-relaxed text-muted">
          {entries.length === 0
            ? "No entries to export yet."
            : toCsv(entries.slice(0, 12))}
        </pre>
        {entries.length > 12 ? (
          <p className="text-xs text-muted">
            Showing the first 12 rows — the file contains all {entries.length}.
          </p>
        ) : null}
      </section>
    </div>
  );
}
