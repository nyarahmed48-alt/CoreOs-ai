import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currency";
import { ENTRY_CODE_PATTERN } from "@/lib/codes";

export const ENTRY_STATUSES = [
  "active",
  "pending",
  "paid",
  "completed",
  "paused",
  "cancelled",
] as const;

export type EntryStatus = (typeof ENTRY_STATUSES)[number];

/** Statuses that count as money already in the door. */
export const SETTLED_STATUSES: EntryStatus[] = ["paid", "completed"];

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v === "" ? null : (v ?? null)));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v === "" ? null : (v ?? null)))
  .refine(
    (v) => v === null || /^https?:\/\/\S+$/i.test(v),
    "Link must start with http:// or https://",
  );

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format");

const optionalDateString = z
  .union([dateString, z.literal("")])
  .optional()
  .transform((v) => (v === "" ? null : (v ?? null)));

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const createEntrySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.string().trim().min(1, "Type is required").max(120),
  amount: z.coerce.number().min(0, "Amount cannot be negative").max(1e12),
  currency: z.enum(CURRENCY_CODES as [string, ...string[]]).default("USD"),
  status: z.enum(ENTRY_STATUSES).default("active"),
  date: dateString,
  dueDate: optionalDateString,
  notes: optionalText,
  linkUrl: optionalUrl,
  /** Optional — omit it and the server generates one automatically. */
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ENTRY_CODE_PATTERN, "Code must be 2 letters followed by 4 digits")
    .optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

/** Turn a zod error into `{ field: message }` for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
