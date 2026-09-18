"use client";

import { useMemo, useState } from "react";
import { Eye, FileDown, Search } from "lucide-react";
import { CURRENCY_CODES, coerceCurrency, formatMoney } from "@/lib/currency";
import type { EntryDTO } from "@/lib/entries";

/**
 * Receipt builder. The preview is an HTML mirror of the PDF produced by
 * /api/entries/:id/pdf — same layout, same "VOID IF COPIED" watermark — so what
 * is on screen is what downloads.
 */
export function ReceiptStudio({
  entries,
  initialEntryId,
}: {
  entries: EntryDTO[];
  initialEntryId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialEntryId ?? entries[0]?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [currency, setCurrency] = useState<string>(
    entries.find((entry) => entry.id === (initialEntryId ?? entries[0]?.id))
      ?.currency ?? "USD",
  );

  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      `${entry.code} ${entry.name} ${entry.type}`.toLowerCase().includes(needle),
    );
  }, [entries, search]);

  const amount =
    customPrice.trim() !== "" && Number.isFinite(Number(customPrice))
      ? Number(customPrice)
      : (selected?.amount ?? 0);

  const downloadUrl = selected
    ? `/api/entries/${selected.id}/pdf?amount=${encodeURIComponent(
        amount,
      )}&currency=${encodeURIComponent(currency)}`
    : "#";

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="card space-y-4">
        <h2 className="label">Choose client</h2>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            className="field pl-11"
            placeholder="Search…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search clients"
          />
        </div>

        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(entry.id);
                  setCurrency(entry.currency);
                  setCustomPrice("");
                }}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                  entry.id === selectedId
                    ? "bg-accent-soft text-ink"
                    : "hover:bg-surface-2"
                }`}
              >
                <span>
                  <span className="font-medium text-accent-ink">{entry.code}</span>
                  <span className="text-muted"> — {entry.name}</span>
                </span>
                <span className="shrink-0 text-[11px] uppercase tracking-wider text-muted">
                  {entry.type}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">
              No matching clients.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="card space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="label">Custom price (optional)</span>
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              placeholder={selected ? String(selected.amount) : "0"}
              value={customPrice}
              onChange={(event) => setCustomPrice(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="label">Currency</span>
            <select
              className="field"
              value={currency}
              onChange={(event) => setCurrency(coerceCurrency(event.target.value))}
            >
              {CURRENCY_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <a
              className={`btn-primary flex-1 ${selected ? "" : "pointer-events-none opacity-50"}`}
              href={downloadUrl}
            >
              <FileDown className="h-4 w-4" aria-hidden />
              Download PDF
            </a>
            <a
              className={`btn-ghost ${selected ? "" : "pointer-events-none opacity-50"}`}
              href={selected ? `${downloadUrl}&inline=1` : "#"}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open PDF in a new tab"
            >
              <Eye className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>

        {selected ? (
          <ReceiptPreview
            entry={selected}
            amountLabel={formatMoney(amount, coerceCurrency(currency))}
            currency={currency}
          />
        ) : (
          <p className="py-16 text-center text-sm text-muted">
            Add an entry first — receipts are generated from entries.
          </p>
        )}
      </section>
    </div>
  );
}

function ReceiptPreview({
  entry,
  amountLabel,
  currency,
}: {
  entry: EntryDTO;
  amountLabel: string;
  currency: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4">
      <div className="relative overflow-hidden rounded-xl bg-white text-[#111827] shadow-xl">
        {/* Watermark: same phrase and ~8% opacity as the generated PDF. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-around py-6"
        >
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <span
              key={row}
              className="whitespace-nowrap text-3xl font-bold tracking-[0.2em] text-[#4338ca]"
              style={{ opacity: 0.08, transform: "rotate(-30deg)" }}
            >
              VOID IF COPIED
            </span>
          ))}
        </div>

        <div className="relative flex items-start justify-between bg-[#6d6ef0] px-8 py-7 text-white">
          <div>
            <p className="text-3xl font-bold">CoreOS</p>
            <p className="mt-1 text-[10px] tracking-[0.25em] text-white/80">
              OFFICIAL RECEIPT
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.25em] text-white/80">
              CLIENT CODE
            </p>
            <p className="mt-1 text-2xl font-bold">{entry.code}</p>
          </div>
        </div>

        <div className="relative space-y-6 px-8 py-7">
          <div className="grid grid-cols-2 gap-5 text-sm">
            <Meta label="RECEIPT NO." value={`R-${entry.code}`} />
            <Meta
              label="DATE ISSUED"
              value={new Date().toISOString().slice(0, 10)}
            />
            <Meta label="BILLED TO" value={entry.name} />
            <Meta label="TYPE" value={entry.type} />
            <Meta label="ENTRY DATE" value={entry.date} />
            <Meta label="STATUS" value={entry.status.toUpperCase()} />
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f3f4f6] text-left text-[10px] tracking-[0.15em] text-[#6b7280]">
                <th className="px-3 py-2">DESCRIPTION</th>
                <th className="px-3 py-2 text-right">CURRENCY</th>
                <th className="px-3 py-2 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#e5e7eb]">
                <td className="px-3 py-4">
                  {entry.type} service — {entry.name}
                </td>
                <td className="px-3 py-4 text-right">{currency}</td>
                <td className="px-3 py-4 text-right">{amountLabel}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t-2 border-[#111827] pt-4">
            <span className="text-[10px] tracking-[0.25em] text-[#6b7280]">
              TOTAL DUE
            </span>
            <span className="text-2xl font-bold text-[#4338ca]">{amountLabel}</span>
          </div>

          {entry.notes ? (
            <div className="rounded-lg bg-[#f9fafb] p-4 text-sm">
              <p className="text-[10px] tracking-[0.15em] text-[#6b7280]">NOTES</p>
              <p className="mt-1">{entry.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] text-[#6b7280]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
