/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The tool highway: the only way an agent touches the machine.
 *
 * This is the security boundary of the whole system. Everything above it is a
 * language model deciding what it would like to do, and models can be talked
 * into things — by a stray instruction in a file they were asked to read, by a
 * dependency's README, or simply by being wrong. So nothing here trusts the
 * caller:
 *
 *   - Every path is resolved and confined to one workspace root, including
 *     after symlinks are followed. ".." is not filtered out of strings, which
 *     is a game you lose; the resolved location is compared to the root.
 *
 *   - Commands are NEVER assembled from model output. An agent asks for a
 *     named check ("typecheck"); the argv for it is written here. There is no
 *     path from a generated string to a shell, because there is no shell:
 *     spawn is called with an argv array and shell:false, so quoting, `;`,
 *     `$(...)` and backticks are inert data rather than syntax.
 *
 *   - Every check has a timeout and an output cap, so a hung build cannot
 *     hold a run open and a chatty one cannot exhaust memory or the context
 *     window of whichever agent reads the result.
 *
 * The consequence to keep in mind when extending this: adding a check is
 * adding a capability to every agent allowed to run checks. Add the argv here,
 * deliberately, rather than adding a way to pass one in.
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import type { ToolCall, ToolName, ToolResult } from "./types";

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

/* ============================================================== checks === */

/**
 * The commands an agent may cause to run, by name.
 *
 * Read-only or idempotent by design: type checking, tests, a build. Nothing
 * here installs, publishes, deletes, or reaches the network on purpose.
 */
export const CHECKS: Readonly<Record<string, readonly string[]>> = {
  typecheck: ["npm", "run", "lint"],
  test: ["npm", "test"],
  build: ["npm", "run", "build:web"],
};

export const CHECK_NAMES = Object.keys(CHECKS);

const CHECK_TIMEOUT_MS = 180_000;
const MAX_OUTPUT_CHARS = 12_000;
const MAX_FILE_CHARS = 60_000;

/* =============================================================== paths === */

/**
 * Resolve a workspace-relative path, or throw.
 *
 * Rejects absolute paths outright — an agent has no business naming one — then
 * resolves the rest against the root and checks it is genuinely inside. The
 * check is on the resolved string plus a separator, so a sibling directory
 * whose name merely starts with the root's ("/work" vs "/workspace-other")
 * does not pass.
 */
export async function resolveInside(root: string, relative: string): Promise<string> {
  if (!relative || !relative.trim()) throw new ToolError("No path was given.");
  if (path.isAbsolute(relative)) {
    throw new ToolError(`"${relative}" is an absolute path; give one relative to the workspace.`);
  }

  const rootReal = await fs.realpath(root);
  const target = path.resolve(rootReal, relative);
  if (target !== rootReal && !target.startsWith(rootReal + path.sep)) {
    throw new ToolError(`"${relative}" resolves outside the workspace.`);
  }

  /* Confinement has to survive symlinks: a link inside the workspace pointing
     out of it would otherwise read or write anywhere. The target may not exist
     yet (a file about to be written), so walk up to the nearest ancestor that
     does and check where that really is. */
  let probe = target;
  for (;;) {
    try {
      const real = await fs.realpath(probe);
      const suffix = path.relative(probe, target);
      const finalPath = suffix ? path.join(real, suffix) : real;
      if (finalPath !== rootReal && !finalPath.startsWith(rootReal + path.sep)) {
        throw new ToolError(`"${relative}" resolves outside the workspace through a symlink.`);
      }
      return finalPath;
    } catch (err) {
      if (err instanceof ToolError) throw err;
      const parent = path.dirname(probe);
      if (parent === probe) return target; // nothing on this path exists yet
      probe = parent;
    }
  }
}

/* =============================================================== files === */

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);

async function listFiles(root: string, relative: string): Promise<string> {
  const dir = await resolveInside(root, relative || ".");
  const out: string[] = [];

  const walk = async (current: string, depth: number): Promise<void> => {
    if (depth > 4 || out.length > 400) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      const shown = path.relative(root, full);
      if (entry.isDirectory()) {
        out.push(`${shown}/`);
        await walk(full, depth + 1);
      } else if (entry.isFile()) {
        out.push(shown);
      }
    }
  };

  await walk(dir, 0);
  return out.length ? out.join("\n") : "(empty)";
}

/* ============================================================== running === */

export interface CheckOutcome {
  ok: boolean;
  code: number | null;
  output: string;
  timedOut: boolean;
}

/**
 * Run one named check. No shell, argv only, bounded in time and output.
 *
 * stdout and stderr are interleaved because that is how a failing build reads:
 * separating them puts the error somewhere other than the line that caused it.
 */
export function runCheck(name: string, cwd: string): Promise<CheckOutcome> {
  const argv = CHECKS[name];
  if (!argv) {
    return Promise.resolve({
      ok: false,
      code: null,
      timedOut: false,
      output: `"${name}" is not a known check. Available: ${CHECK_NAMES.join(", ")}.`,
    });
  }

  return new Promise<CheckOutcome>((resolve) => {
    const [command, ...args] = argv;
    const child = spawn(command, args, {
      cwd,
      shell: false, // the whole point: no interpolation, no metacharacters
      env: { ...process.env, CI: "1", NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let timedOut = false;
    const append = (chunk: Buffer) => {
      if (output.length < MAX_OUTPUT_CHARS) output += chunk.toString("utf8");
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, CHECK_TIMEOUT_MS);

    const finish = (code: number | null) => {
      clearTimeout(timer);
      const clipped =
        output.length > MAX_OUTPUT_CHARS
          ? output.slice(0, MAX_OUTPUT_CHARS) + "\n[... output truncated]"
          : output;
      resolve({
        ok: !timedOut && code === 0,
        code,
        timedOut,
        output: timedOut
          ? `${clipped}\n[killed after ${CHECK_TIMEOUT_MS}ms]`
          : clipped || "(no output)",
      });
    };

    /* spawn failed outright — the binary is missing, or not executable. That
       is a real result for the agent to read, not a crash for the run. */
    child.on("error", (err) => {
      output += `\n[could not start ${command}: ${err.message}]`;
      finish(null);
    });
    child.on("close", finish);
  });
}

/* ========================================================== the highway === */

export interface ToolContext {
  workspace: string;
  /** False makes write_file report what it would do without touching disk. */
  apply: boolean;
  /** Tools this role is permitted. Anything else is refused, not ignored. */
  allowed: readonly ToolName[];
  /** Workspace-relative paths written so far, appended to in place. */
  written: string[];
}

/**
 * Execute one tool call.
 *
 * Never throws for an ordinary failure — a refused or failed call comes back as
 * a result the agent reads on its next turn and can respond to. An agent that
 * asks for a path outside the workspace should be told so and given another
 * turn, not crash the run.
 */
export async function executeTool(call: ToolCall, ctx: ToolContext): Promise<ToolResult> {
  const fail = (detail: string): ToolResult => ({ tool: call.tool, ok: false, detail });

  if (!ctx.allowed.includes(call.tool)) {
    return fail(
      `This role may not use ${call.tool}. Allowed here: ${ctx.allowed.join(", ") || "none"}.`,
    );
  }

  try {
    switch (call.tool) {
      case "read_file": {
        const full = await resolveInside(ctx.workspace, call.path ?? "");
        const body = await fs.readFile(full, "utf8");
        const clipped =
          body.length > MAX_FILE_CHARS
            ? body.slice(0, MAX_FILE_CHARS) + "\n[... file truncated]"
            : body;
        return { tool: call.tool, ok: true, detail: `Read ${call.path}`, output: clipped };
      }

      case "list_files": {
        const output = await listFiles(ctx.workspace, call.path ?? ".");
        return { tool: call.tool, ok: true, detail: `Listed ${call.path || "."}`, output };
      }

      case "write_file": {
        if (typeof call.content !== "string") {
          return fail("write_file needs `content`.");
        }
        const full = await resolveInside(ctx.workspace, call.path ?? "");
        const rel = path.relative(ctx.workspace, full);
        if (!ctx.apply) {
          if (!ctx.written.includes(rel)) ctx.written.push(rel);
          return {
            tool: call.tool,
            ok: true,
            detail: `Would write ${rel} (${call.content.length} chars) — dry run, nothing was saved.`,
          };
        }
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, call.content, "utf8");
        if (!ctx.written.includes(rel)) ctx.written.push(rel);
        return { tool: call.tool, ok: true, detail: `Wrote ${rel} (${call.content.length} chars)` };
      }

      case "run_check": {
        const name = call.check ?? "";
        const outcome = await runCheck(name, ctx.workspace);
        return {
          tool: call.tool,
          ok: outcome.ok,
          detail: outcome.ok
            ? `${name} passed`
            : `${name} failed${outcome.code === null ? "" : ` (exit ${outcome.code})`}`,
          output: outcome.output,
        };
      }

      default: {
        /* Exhaustiveness: adding a ToolName without handling it stops the
           build here rather than silently doing nothing at runtime. */
        const never: never = call.tool;
        return fail(`Unknown tool ${String(never)}.`);
      }
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}
