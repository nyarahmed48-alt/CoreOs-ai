/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The security boundary.
 *
 * Everything above this layer is a language model deciding what it would like
 * to do, and it can be talked into things — by a stray line in a file it was
 * asked to read, or simply by being wrong. These are the cases that must hold
 * whatever it asks for, so they are tested against a real temporary directory
 * with real symlinks rather than by reading the code and agreeing with it.
 */

import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { executeTool, resolveInside, runCheck, ToolError } from "./tools.ts";
import type { ToolContext } from "./tools.ts";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "orch-ws-"));
const outside = await fs.mkdtemp(path.join(os.tmpdir(), "orch-out-"));
after(async () => {
  await fs.rm(root, { recursive: true, force: true });
  await fs.rm(outside, { recursive: true, force: true });
});

await fs.mkdir(path.join(root, "src"), { recursive: true });
await fs.writeFile(path.join(root, "src", "app.ts"), "export const a = 1;\n");
await fs.writeFile(path.join(outside, "secrets.env"), "OPENROUTER_API_KEY=sk-real\n");
/* A link inside the workspace pointing out of it: the case that string
   filtering of ".." does not catch, because the path never contains one. */
await fs.symlink(outside, path.join(root, "escape"), "dir");

const ctx = (over: Partial<ToolContext> = {}): ToolContext => ({
  workspace: root,
  apply: false,
  allowed: ["read_file", "list_files", "write_file", "run_check"],
  written: [],
  ...over,
});

describe("resolveInside", () => {
  it("resolves an ordinary relative path", async () => {
    const got = await resolveInside(root, "src/app.ts");
    assert.equal(got, path.join(await fs.realpath(root), "src", "app.ts"));
  });

  it("refuses an absolute path", async () => {
    await assert.rejects(() => resolveInside(root, "/etc/passwd"), ToolError);
  });

  it("refuses traversal out of the workspace", async () => {
    await assert.rejects(() => resolveInside(root, "../../etc/passwd"), /outside the workspace/);
  });

  it("refuses traversal that dips back in first", async () => {
    /* "src/../../x" normalises out of the root, so the check has to be on the
       resolved location rather than on the shape of the string. */
    await assert.rejects(() => resolveInside(root, "src/../../x"), /outside the workspace/);
  });

  it("refuses to follow a symlink out of the workspace", async () => {
    await assert.rejects(() => resolveInside(root, "escape/secrets.env"), /symlink/);
  });

  it("refuses an empty path", async () => {
    await assert.rejects(() => resolveInside(root, "   "), ToolError);
  });

  it("allows a path that does not exist yet, for a file about to be written", async () => {
    const got = await resolveInside(root, "src/new/deep/file.ts");
    assert.ok(got.startsWith(await fs.realpath(root)));
  });

  it("does not mistake a sibling whose name starts with the root's", async () => {
    /* "/tmp/ws" must not admit "/tmp/ws-other": the prefix check needs the
       separator, and this is the case that catches it if someone drops it. */
    const sibling = root + "-other";
    await fs.mkdir(sibling, { recursive: true });
    try {
      await assert.rejects(
        () => resolveInside(root, path.join("..", path.basename(sibling), "x")),
        /outside the workspace/,
      );
    } finally {
      await fs.rm(sibling, { recursive: true, force: true });
    }
  });
});

describe("executeTool", () => {
  it("reads a file inside the workspace", async () => {
    const r = await executeTool({ tool: "read_file", path: "src/app.ts" }, ctx());
    assert.equal(r.ok, true);
    assert.match(r.output ?? "", /export const a/);
  });

  it("refuses a tool the role was not granted, rather than ignoring it", async () => {
    const r = await executeTool(
      { tool: "write_file", path: "x.ts", content: "x" },
      ctx({ allowed: ["read_file"] }),
    );
    assert.equal(r.ok, false);
    assert.match(r.detail, /may not use write_file/);
  });

  it("returns an escape attempt as a failed result, not a thrown error", async () => {
    /* The agent should get a turn to correct itself; crashing the run on a bad
       path would lose the work every other task has already done. */
    const r = await executeTool({ tool: "read_file", path: "../secrets.env" }, ctx());
    assert.equal(r.ok, false);
    assert.match(r.detail, /outside the workspace/);
  });

  it("does not touch disk on a dry run, but still reports the path", async () => {
    const c = ctx({ apply: false });
    const r = await executeTool({ tool: "write_file", path: "dry.ts", content: "x" }, c);
    assert.equal(r.ok, true);
    assert.match(r.detail, /dry run/);
    assert.deepEqual(c.written, ["dry.ts"]);
    await assert.rejects(() => fs.readFile(path.join(root, "dry.ts")));
  });

  it("writes, and creates missing parents, when applying", async () => {
    const c = ctx({ apply: true });
    const r = await executeTool(
      { tool: "write_file", path: "src/deep/made.ts", content: "export const b = 2;\n" },
      c,
    );
    assert.equal(r.ok, true);
    assert.equal(await fs.readFile(path.join(root, "src/deep/made.ts"), "utf8"), "export const b = 2;\n");
    assert.deepEqual(c.written, ["src/deep/made.ts"]);
  });

  it("rejects write_file with no content instead of writing an empty file", async () => {
    const r = await executeTool({ tool: "write_file", path: "x.ts" }, ctx({ apply: true }));
    assert.equal(r.ok, false);
  });

  it("lists files without descending into node_modules or .git", async () => {
    await fs.mkdir(path.join(root, "node_modules", "pkg"), { recursive: true });
    await fs.writeFile(path.join(root, "node_modules", "pkg", "index.js"), "x");
    const r = await executeTool({ tool: "list_files", path: "." }, ctx());
    assert.equal(r.ok, true);
    assert.doesNotMatch(r.output ?? "", /node_modules/);
    assert.match(r.output ?? "", /src\/app\.ts/);
  });
});

describe("runCheck", () => {
  it("refuses a check that is not on the list", async () => {
    const r = await runCheck("rm -rf /", root);
    assert.equal(r.ok, false);
    assert.match(r.output, /not a known check/);
  });

  it("treats a shell metacharacter as a name, never as syntax", async () => {
    /* There is no shell — spawn is called with an argv array — so this can
       only ever be looked up as a check name and missed. */
    const r = await runCheck("typecheck; touch /tmp/pwned", root);
    assert.equal(r.ok, false);
    assert.match(r.output, /not a known check/);
    await assert.rejects(() => fs.stat("/tmp/pwned"));
  });

  it("reports a real check's failure as a result rather than throwing", async () => {
    /* Nothing to typecheck in the temp workspace, so npm itself fails. What
       matters is that it comes back as a readable outcome. */
    const r = await runCheck("typecheck", root);
    assert.equal(typeof r.ok, "boolean");
    assert.equal(typeof r.output, "string");
  });
});
