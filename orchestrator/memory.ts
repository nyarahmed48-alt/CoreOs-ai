/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The shared context bus.
 *
 * Agents do not see each other's transcripts. They write named entries here,
 * and a downstream task receives only the entries it named in `needs`. That
 * is the whole token-discipline strategy, and it is deliberately a rule about
 * *who asks for what* rather than a summarisation step: summarising a chain of
 * agents loses the exact API path or column name that the next one needs,
 * which is precisely the detail that must survive.
 *
 * Two guards keep it honest:
 *
 *   - A per-entry character budget. An agent that returns an entire file as
 *     its summary would otherwise poison every task downstream of it.
 *   - Truncation says so, in the text, where the reading model can see it.
 *     Silent truncation produces an agent confidently working from half a
 *     schema, which is worse than one that knows it is missing something.
 */

export interface MemoryEntry {
  key: string;
  value: string;
  /** Task that wrote it, for the build log and for provenance in prompts. */
  from: string;
  at: string;
}

export interface MemoryOptions {
  /** Characters kept per entry. Roughly four characters to a token. */
  maxEntryChars: number;
}

export const DEFAULT_MEMORY_OPTIONS: MemoryOptions = { maxEntryChars: 6_000 };

export class ContextMemory {
  private readonly entries = new Map<string, MemoryEntry>();

  constructor(private readonly options: MemoryOptions = DEFAULT_MEMORY_OPTIONS) {}

  /**
   * Store one entry, truncating past the budget.
   *
   * Last write wins: a retried task overwrites its earlier, rejected output,
   * so a task reading it never sees the version QA already turned down.
   */
  write(key: string, value: string, from: string): MemoryEntry {
    const limit = this.options.maxEntryChars;
    const clipped =
      value.length > limit
        ? value.slice(0, limit) +
          `\n\n[... truncated: ${value.length - limit} more characters. ` +
          `Ask for the file directly with read_file if you need the rest.]`
        : value;

    const entry: MemoryEntry = {
      key,
      value: clipped,
      from,
      at: new Date().toISOString(),
    };
    this.entries.set(key, entry);
    return entry;
  }

  read(key: string): MemoryEntry | undefined {
    return this.entries.get(key);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  keys(): string[] {
    return [...this.entries.keys()];
  }

  /**
   * Render the requested entries as a prompt block.
   *
   * A key that was asked for but never written is reported as missing rather
   * than omitted. An agent told "SCHEMA: (not available)" asks for it or works
   * around it; an agent shown nothing at all invents one.
   */
  render(keys: string[]): string {
    if (!keys.length) return "";

    const blocks = keys.map((key) => {
      const entry = this.entries.get(key);
      if (!entry) {
        return `### ${key}\n(not available — no completed task produced this)`;
      }
      return `### ${key}\n(from task "${entry.from}")\n${entry.value}`;
    });

    return `## Context from earlier tasks\n\n${blocks.join("\n\n")}`;
  }

  /** Everything, for the build log. */
  snapshot(): MemoryEntry[] {
    return [...this.entries.values()];
  }
}
