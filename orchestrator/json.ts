/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Getting JSON back out of a model.
 *
 * Models asked for JSON return JSON most of the time, and the rest of the time
 * they return JSON wrapped in a ```json fence, or with a sentence of
 * introduction, or both. Treating that as a protocol violation and failing the
 * task wastes a whole round trip on a reply that contained exactly what was
 * asked for. So: try the strict parse first, then recover, and only then fail.
 *
 * The recovery is deliberately narrow — find a fenced block, or the outermost
 * balanced braces — rather than anything that repairs malformed JSON. A model
 * that returns genuinely broken JSON should be told so and given another turn;
 * guessing at what it meant is how a plan ends up with a task nobody wrote.
 */

export class ParseError extends Error {
  constructor(
    message: string,
    /** The raw text, so the caller can log or show it back to the model. */
    readonly raw: string,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

/** Strip a leading ```json fence and its closing fence, if present. */
function unfence(text: string): string {
  const fenced = text.match(/```(?:json|jsonc)?\s*\n([\s\S]*?)\n?```/i);
  return fenced ? fenced[1] : text;
}

/**
 * The outermost balanced {...} or [...], ignoring braces inside strings.
 *
 * Scanning with string- and escape-awareness rather than a regex, because a
 * brace inside a system prompt or a code sample is extremely common in this
 * system's own payloads and would otherwise cut the object short.
 */
function outermostBlock(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start === -1) return null;

  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Parse a model reply as JSON, recovering from the usual wrappings. */
export function parseJson<T>(text: string): T {
  const attempts = [text, unfence(text), outermostBlock(unfence(text))];

  for (const candidate of attempts) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate.trim()) as T;
    } catch {
      /* Try the next, more forgiving, extraction. */
    }
  }

  throw new ParseError(
    "The reply was not JSON, even after unwrapping a code fence.",
    text.slice(0, 800),
  );
}

/** Narrow an unknown to a string array, dropping anything else. */
export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
