"use client";

import { CURRENCY_CODES } from "@/lib/currency";
import { ENTRY_STATUSES } from "@/lib/validation";
import type { EntryDTO } from "@/lib/entries";

export type EntryFormValues = {
  code: string;
  name: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  date: string;
  dueDate: string;
  notes: string;
  linkUrl: string;
};

export function emptyEntryForm(): EntryFormValues {
  return {
    code: "",
    name: "",
    type: "",
    amount: "0",
    currency: "USD",
    status: "active",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    notes: "",
    linkUrl: "",
  };
}

export function entryToForm(entry: EntryDTO): EntryFormValues {
  return {
    code: entry.code,
    name: entry.name,
    type: entry.type,
    amount: String(entry.amount),
    currency: entry.currency,
    status: entry.status,
    date: entry.date,
    dueDate: entry.dueDate ?? "",
    notes: entry.notes ?? "",
    linkUrl: entry.linkUrl ?? "",
  };
}

/** Payload for POST/PATCH — empty optional strings become nulls server-side. */
export function formToPayload(values: EntryFormValues, includeCode: boolean) {
  return {
    ...(includeCode && values.code ? { code: values.code.toUpperCase() } : {}),
    name: values.name,
    type: values.type,
    amount: Number(values.amount || 0),
    currency: values.currency,
    status: values.status,
    date: values.date,
    dueDate: values.dueDate,
    notes: values.notes,
    linkUrl: values.linkUrl,
  };
}

type Props = {
  values: EntryFormValues;
  onChange: (values: EntryFormValues) => void;
  errors?: Record<string, string>;
  /** Codes are generated on create, so the field only shows when editing. */
  showCode?: boolean;
  typeSuggestions?: string[];
};

export function EntryFields({
  values,
  onChange,
  errors = {},
  showCode = false,
  typeSuggestions = [],
}: Props) {
  const set = <K extends keyof EntryFormValues>(
    key: K,
    value: EntryFormValues[K],
  ) => onChange({ ...values, [key]: value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" error={errors.name} className="sm:col-span-2">
        <input
          className="field"
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          placeholder="Client or project name"
          required
        />
      </Field>

      {showCode ? (
        <Field label="Code" error={errors.code}>
          <input
            className="field font-mono uppercase"
            value={values.code}
            onChange={(event) => set("code", event.target.value.toUpperCase())}
            placeholder="XN1775"
            maxLength={6}
          />
        </Field>
      ) : null}

      <Field label="Type" error={errors.type}>
        <input
          className="field"
          list="entry-type-suggestions"
          value={values.type}
          onChange={(event) => set("type", event.target.value)}
          placeholder="Website, Tracking system…"
          required
        />
        <datalist id="entry-type-suggestions">
          {typeSuggestions.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
      </Field>

      <Field label="Amount" error={errors.amount}>
        <input
          className="field"
          type="number"
          min="0"
          step="0.01"
          value={values.amount}
          onChange={(event) => set("amount", event.target.value)}
        />
      </Field>

      <Field label="Currency">
        <select
          className="field"
          value={values.currency}
          onChange={(event) => set("currency", event.target.value)}
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Status">
        <select
          className="field"
          value={values.status}
          onChange={(event) => set("status", event.target.value)}
        >
          {ENTRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Date" error={errors.date}>
        <input
          className="field"
          type="date"
          value={values.date}
          onChange={(event) => set("date", event.target.value)}
          required
        />
      </Field>

      <Field label="Due date (optional)" error={errors.dueDate}>
        <input
          className="field"
          type="date"
          value={values.dueDate}
          onChange={(event) => set("dueDate", event.target.value)}
        />
      </Field>

      <Field label="Link URL (optional)" error={errors.linkUrl} className="sm:col-span-2">
        <input
          className="field"
          type="url"
          value={values.linkUrl}
          onChange={(event) => set("linkUrl", event.target.value)}
          placeholder="https://example.com"
        />
      </Field>

      <Field label="Notes (optional)" error={errors.notes} className="sm:col-span-2">
        <textarea
          className="field min-h-24 resize-y"
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder="Anything worth remembering about this entry"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
