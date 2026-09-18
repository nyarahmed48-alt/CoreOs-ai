"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  FileDown,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Money } from "@/components/Money";
import { StatusBadge } from "@/components/StatusBadge";
import {
  EntryFields,
  emptyEntryForm,
  entryToForm,
  formToPayload,
  type EntryFormValues,
} from "@/components/EntryFields";
import { apiRequest } from "@/lib/client-api";
import { ENTRY_STATUSES } from "@/lib/validation";
import type { EntryDTO } from "@/lib/entries";

type PendingUpdate = {
  entry: EntryDTO;
  values: EntryFormValues;
};

export function EntriesTable({
  entries,
  types,
  openCreateOnMount = false,
}: {
  entries: EntryDTO[];
  types: string[];
  openCreateOnMount?: boolean;
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const [creating, setCreating] = useState(openCreateOnMount);
  const [createValues, setCreateValues] = useState<EntryFormValues>(emptyEntryForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  /** Row currently expanded into its inline editor. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EntryFormValues | null>(null);

  /** Edits waiting on the Confirm/Cancel dialog before they touch the database. */
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EntryDTO | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (status !== "all" && entry.status !== status) return false;
      if (type !== "all" && entry.type !== type) return false;
      if (!needle) return true;
      return [entry.code, entry.name, entry.type, entry.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [entries, query, status, type]);

  function startEdit(entry: EntryDTO) {
    setEditingId(entry.id);
    setEditValues(entryToForm(entry));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  async function createEntry() {
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest("/api/entries", {
        method: "POST",
        body: JSON.stringify(formToPayload(createValues, false)),
      });
      setCreating(false);
      setCreateValues(emptyEntryForm());
      router.refresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setCreatePending(false);
    }
  }

  async function commitUpdate() {
    if (!pendingUpdate) return;
    await apiRequest(`/api/entries/${pendingUpdate.entry.id}`, {
      method: "PATCH",
      body: JSON.stringify(formToPayload(pendingUpdate.values, true)),
    });
    setPendingUpdate(null);
    cancelEdit();
    router.refresh();
  }

  async function commitDelete() {
    if (!pendingDelete) return;
    await apiRequest(`/api/entries/${pendingDelete.id}`, { method: "DELETE" });
    setPendingDelete(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            className="field pl-11"
            placeholder="Search name, code, type, notes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search entries"
          />
        </div>

        <select
          className="field"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ENTRY_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={type}
          onChange={(event) => setType(event.target.value)}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {types.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setCreateValues(emptyEntryForm());
            setCreateError(null);
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Manual entry
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Code", "Name", "Type", "Date", "Amount", "Status", "Due", ""].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-[11px] uppercase tracking-[0.18em] text-muted"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-muted">
                  {entries.length === 0
                    ? "No entries yet — add your first one with Manual entry."
                    : "No entries match these filters."}
                </td>
              </tr>
            ) : null}

            {visible.map((entry) => {
              const isEditing = editingId === entry.id;
              return (
                <tr
                  key={entry.id}
                  className="border-b border-line/70 align-top last:border-0"
                >
                  {isEditing && editValues ? (
                    <td colSpan={8} className="px-4 py-5">
                      <InlineEditor
                        values={editValues}
                        onChange={setEditValues}
                        types={types}
                        onCancel={cancelEdit}
                        onConfirm={() =>
                          setPendingUpdate({ entry, values: editValues })
                        }
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-4 font-medium text-accent-ink">
                        {entry.code}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{entry.name}</div>
                        {entry.notes ? (
                          <div className="mt-1 max-w-xs text-xs text-muted">
                            {entry.notes}
                          </div>
                        ) : null}
                        {entry.linkUrl ? (
                          <a
                            href={entry.linkUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-accent-ink hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            link
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <span className="chip">{entry.type}</span>
                      </td>
                      <td className="px-4 py-4 text-muted">{entry.date}</td>
                      <td className="px-4 py-4">
                        <Money amount={entry.amount} currency={entry.currency} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={entry.status} />
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.dueDate ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn-ghost px-3 py-2"
                            onClick={() => startEdit(entry)}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            edit
                          </button>
                          <a
                            className="btn-ghost px-3 py-2"
                            href={`/api/entries/${entry.id}/pdf`}
                            title="Download watermarked PDF"
                          >
                            <FileDown className="h-3.5 w-3.5" aria-hidden />
                            pdf
                          </a>
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
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Showing {visible.length} of {entries.length} entries.
      </p>

      {/* Create */}
      {creating ? (
        <Modal
          title="New entry"
          description="A unique code (2 letters + 4 digits) is generated automatically."
          wide
          onClose={() => setCreating(false)}
        >
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void createEntry();
            }}
          >
            <EntryFields
              values={createValues}
              onChange={setCreateValues}
              typeSuggestions={types}
            />

            {createError ? (
              <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">
                {createError}
              </p>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createPending}>
                {createPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-4 w-4" aria-hidden />
                )}
                Confirm &amp; save
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* Update confirmation — nothing is written until this is confirmed. */}
      {pendingUpdate ? (
        <ConfirmDialog
          title="Save changes?"
          confirmLabel="Confirm"
          message={
            <ChangeSummary
              before={pendingUpdate.entry}
              after={pendingUpdate.values}
            />
          }
          onConfirm={commitUpdate}
          onCancel={() => setPendingUpdate(null)}
        />
      ) : null}

      {/* Delete confirmation */}
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete entry?"
          tone="danger"
          confirmLabel="Delete"
          message={
            <>
              <strong className="text-ink">{pendingDelete.code}</strong> —{" "}
              {pendingDelete.name} will be removed permanently. This cannot be
              undone.
            </>
          }
          onConfirm={commitDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}

function InlineEditor({
  values,
  onChange,
  types,
  onConfirm,
  onCancel,
}: {
  values: EntryFormValues;
  onChange: (values: EntryFormValues) => void;
  types: string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="space-y-5 rounded-xl border border-accent/30 bg-surface-2 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      <p className="label">Editing inline</p>
      <EntryFields
        values={values}
        onChange={onChange}
        showCode
        typeSuggestions={types}
      />
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden />
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          <Check className="h-4 w-4" aria-hidden />
          Confirm
        </button>
      </div>
    </form>
  );
}

/** Field-by-field diff shown in the confirmation dialog. */
function ChangeSummary({
  before,
  after,
}: {
  before: EntryDTO;
  after: EntryFormValues;
}) {
  const rows: Array<[string, string, string]> = [
    ["Code", before.code, after.code],
    ["Name", before.name, after.name],
    ["Type", before.type, after.type],
    ["Amount", `${before.amount} ${before.currency}`, `${after.amount} ${after.currency}`],
    ["Status", before.status, after.status],
    ["Date", before.date, after.date],
    ["Due", before.dueDate ?? "—", after.dueDate || "—"],
    ["Notes", before.notes ?? "—", after.notes || "—"],
    ["Link", before.linkUrl ?? "—", after.linkUrl || "—"],
  ];
  const changed = rows.filter(([, from, to]) => from !== to);

  if (changed.length === 0) {
    return <>No fields changed — confirming will leave the entry as it is.</>;
  }

  return (
    <div className="space-y-2">
      <p>These changes will be written to the database:</p>
      <ul className="space-y-1.5">
        {changed.map(([label, from, to]) => (
          <li key={label} className="text-xs">
            <span className="label">{label}</span>{" "}
            <span className="text-danger line-through">{from}</span>{" "}
            <span className="text-muted">→</span>{" "}
            <span className="text-success">{to}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
