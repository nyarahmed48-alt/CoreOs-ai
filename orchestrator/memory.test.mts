/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The context bus.
 *
 * Its job is to keep prompts small without keeping them wrong, so the tests
 * are about what a reading agent can and cannot tell: that truncation is
 * visible, that a missing key is stated rather than omitted, and that a retried
 * task's rejected output does not linger.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ContextMemory } from "./memory.ts";
import { parseJson, ParseError } from "./json.ts";

describe("ContextMemory", () => {
  it("returns only the keys a task asked for", () => {
    const m = new ContextMemory();
    m.write("schema", "CREATE TABLE thing (...)", "design");
    m.write("unrelated", "a large pile of other work", "other");

    const rendered = m.render(["schema"]);
    assert.match(rendered, /CREATE TABLE thing/);
    assert.doesNotMatch(rendered, /large pile/);
  });

  it("says so in the text when it truncates", () => {
    /* Silent truncation produces an agent confidently working from half a
       schema, which is worse than one that knows it is missing something. */
    const m = new ContextMemory({ maxEntryChars: 50 });
    m.write("big", "x".repeat(500), "task");
    const value = m.read("big")?.value ?? "";
    assert.ok(value.length < 300);
    assert.match(value, /truncated: 450 more characters/);
    assert.match(value, /read_file/, "it should say how to get the rest");
  });

  it("reports a missing key rather than leaving a silent gap", () => {
    const rendered = new ContextMemory().render(["schema"]);
    assert.match(rendered, /schema/);
    assert.match(rendered, /not available/);
  });

  it("returns nothing at all when a task needs nothing", () => {
    assert.equal(new ContextMemory().render([]), "");
  });

  it("overwrites on retry, so nobody reads the version QA rejected", () => {
    const m = new ContextMemory();
    m.write("code", "first attempt, unvalidated", "build");
    m.write("code", "second attempt, validated", "build");
    assert.equal(m.read("code")?.value, "second attempt, validated");
    assert.doesNotMatch(m.render(["code"]), /unvalidated/);
  });

  it("names the task an entry came from, so context has provenance", () => {
    const m = new ContextMemory();
    m.write("contract", "POST /x", "design");
    assert.match(m.render(["contract"]), /from task "design"/);
  });
});

describe("parseJson", () => {
  it("parses a bare object", () => {
    assert.deepEqual(parseJson<{ a: number }>('{"a":1}'), { a: 1 });
  });

  it("parses through a ```json fence", () => {
    assert.deepEqual(parseJson<{ a: number }>('```json\n{"a":1}\n```'), { a: 1 });
  });

  it("parses through a sentence of preamble", () => {
    assert.deepEqual(parseJson<{ a: number }>('Sure, here it is:\n{"a":1}'), { a: 1 });
  });

  it("does not stop at a brace inside a string", () => {
    /* This system's own payloads are full of braces — system prompts, code
       samples — so a naive scan would cut the object short. */
    const got = parseJson<{ code: string; ok: boolean }>('{"code":"function f() { return {}; }","ok":true}');
    assert.equal(got.ok, true);
    assert.match(got.code, /return \{\}/);
  });

  it("does not stop at an escaped quote", () => {
    const got = parseJson<{ s: string }>('{"s":"he said \\"} \\" and left"}');
    assert.match(got.s, /he said/);
  });

  it("throws with the raw text when there is no JSON at all", () => {
    assert.throws(
      () => parseJson("no json here"),
      (err: unknown) => {
        assert.ok(err instanceof ParseError);
        /* The raw text has to survive: it is what gets shown back to the model
           on the retry, and what a person reads in the log. */
        assert.match(err.raw, /no json here/);
        return true;
      },
    );
  });
});
