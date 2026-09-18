import "server-only";

import type { Entry } from "@prisma/client";
import { coerceCurrency, type CurrencyCode } from "@/lib/currency";
import type { EntryStatus } from "@/lib/validation";

/** Plain, JSON-safe shape handed to client components and API responses. */
export type EntryDTO = {
  id: string;
  code: string;
  name: string;
  type: string;
  amount: number;
  currency: CurrencyCode;
  status: EntryStatus;
  date: string;
  dueDate: string | null;
  notes: string | null;
  linkUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDateString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/**
 * Prisma returns `Decimal` and `Date` objects, neither of which can cross the
 * server/client boundary — normalise to numbers and ISO date strings.
 */
export function serializeEntry(entry: Entry): EntryDTO {
  return {
    id: entry.id,
    code: entry.code,
    name: entry.name,
    type: entry.type,
    amount: Number(entry.amount),
    currency: coerceCurrency(entry.currency),
    status: entry.status as EntryStatus,
    date: toDateString(entry.date) ?? "",
    dueDate: toDateString(entry.dueDate),
    notes: entry.notes,
    linkUrl: entry.linkUrl,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

/** Parse a `YYYY-MM-DD` form value into a UTC date (no timezone drift). */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
