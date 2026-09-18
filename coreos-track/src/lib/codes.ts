/**
 * Entry code generator.
 *
 * Format: [2 uppercase letters][4 digits] — e.g. "XN1775", "OL9400".
 * Codes are public-facing (they appear on receipts and in URLs) and unique.
 */
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ENTRY_CODE_PATTERN = /^[A-Z]{2}\d{4}$/;

function randomInt(maxExclusive: number): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % maxExclusive;
}

/** Generate a single candidate code (no uniqueness check). */
export function generateEntryCode(): string {
  const letters =
    LETTERS[randomInt(LETTERS.length)] + LETTERS[randomInt(LETTERS.length)];
  const digits = String(randomInt(10_000)).padStart(4, "0");
  return `${letters}${digits}`;
}

/**
 * Generate a code that is not already taken.
 *
 * `isTaken` is injected so this stays pure/testable; callers pass a database
 * lookup. After `maxAttempts` collisions we surface an error rather than
 * silently handing out a duplicate.
 */
export async function generateUniqueEntryCode(
  isTaken: (code: string) => Promise<boolean>,
  maxAttempts = 25,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateEntryCode();
    if (!(await isTaken(code))) return code;
  }
  throw new Error("Could not generate a unique entry code — try again.");
}
