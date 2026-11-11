/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The two promises in the issue-code work that are worth a test rather than
 * a look: that the registry is complete in all three languages, and that
 * nothing about a customer can reach the log.
 */

import { describe, expect, it } from "vitest";
import { ALL_CODES, ISSUES, issueText } from "./issues";
import { scrub } from "./report";
import { LANGS } from "./i18n";

describe("the issue registry", () => {
  it("carries the codes the support desk was given", () => {
    expect(ALL_CODES).toEqual([
      "SW-01", "SW-02", "SW-03", "SW-04", "SW-05",
      "SW-06", "SW-07", "SW-08", "SW-09",
      "DT-01", "DT-02", "DT-03", "DT-04", "DT-05", "DT-09",
      "AC-01", "AC-02", "AC-03", "AC-04", "AC-05", "AC-09",
      "TB-02", "TB-04", "TB-05", "TB-09",
    ]);
  });

  it("is finished in all three languages", () => {
    /* A card that falls back to English is a shopkeeper who cannot read the
       one screen that was written for them. */
    const gaps: string[] = [];
    for (const code of ALL_CODES) {
      for (const { id } of LANGS) {
        const words = issueText(code, id);
        if (!words.title.trim()) gaps.push(`${code} ${id} title`);
        if (!words.body.trim()) gaps.push(`${code} ${id} body`);
        if (words.steps.length < 1 || words.steps.length > 3) {
          gaps.push(`${code} ${id} has ${words.steps.length} steps`);
        }
        if (words.steps.some((step) => !step.trim())) gaps.push(`${code} ${id} blank step`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it("gives every code a priority and a note for the technician", () => {
    for (const code of ALL_CODES) {
      expect(["P1", "P2", "P3"], code).toContain(ISSUES[code].priority);
      expect(ISSUES[code].note.length, code).toBeGreaterThan(20);
    }
  });

  it("keeps the shop's words free of our words", () => {
    /* No stack traces, no English jargon on an Arabic card. A spot check on
       the vocabulary that tends to leak out of a codebase. */
    const jargon = /\b(null|undefined|exception|stack|API|IndexedDB|localStorage|fetch)\b/i;
    for (const code of ALL_CODES) {
      for (const { id } of LANGS) {
        const words = issueText(code, id);
        const all = [words.title, words.body, ...words.steps].join(" ");
        expect(jargon.test(all), `${code} ${id}: ${all}`).toBe(false);
      }
    }
  });

  it("marks the codes no browser can detect", () => {
    const manual = ALL_CODES.filter((code) => ISSUES[code].manual);
    expect(manual).toEqual(["DT-04", "AC-03", "AC-05", "AC-09"]);
  });
});

describe("what the log is allowed to remember", () => {
  it("takes phone numbers out", () => {
    expect(scrub("customer 0770 123 4567 owes")).toBe("customer [number] owes");
    expect(scrub("called +964 770 1234567")).toBe("called [number]");
  });

  it("takes email addresses out", () => {
    expect(scrub("signed in as shop1@corecashier.test")).toBe(
      "signed in as [email]",
    );
  });

  it("leaves the technical detail a support desk needs", () => {
    /* Short numbers are counts, codes and versions, not people. */
    expect(scrub("lines 3500 vs subtotal 3000")).toBe("lines 3500 vs subtotal 3000");
    expect(scrub("printing: noChannel")).toBe("printing: noChannel");
  });

  it("will not let one entry run away with the log", () => {
    expect(scrub("x".repeat(5000)).length).toBe(300);
  });
});
