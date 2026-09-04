/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The entry point: `npm run orchestrate -- "<goal>"`.
 *
 * Dry by default. A tool that writes files across a repository the first time
 * anyone tries it, before they know what it does, is a tool people run once.
 * Passing --apply is a deliberate act, and it prints what it is about to do.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { isConfigured, settingsFromProcess } from "../lab/agents";
import { conduct } from "./conductor";
import { formatEvent, formatReport } from "./log";
import { PlanError } from "./graph";
import { ParseError } from "./json";

interface Args {
  goal: string;
  workspace: string;
  apply: boolean;
  out?: string;
  maxAttempts: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    goal: "",
    workspace: process.cwd(),
    apply: false,
    maxAttempts: 2,
  };
  const rest: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--workspace") args.workspace = argv[++i] ?? args.workspace;
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--max-attempts") args.maxAttempts = Number(argv[++i]) || args.maxAttempts;
    else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}`);
    else rest.push(arg);
  }

  args.goal = rest.join(" ").trim();
  return args;
}

const USAGE = `
Usage: npm run orchestrate -- "<goal>" [options]

  --apply              Write files. Without it, nothing touches disk.
  --workspace <dir>    Root the agents may read and write. Default: cwd.
  --out <file>         Write the build log here as Markdown.
  --max-attempts <n>   Times a task may be re-assigned after QA rejects it.

Requires OPENROUTER_API_KEY and OPENROUTER_MODEL. See orchestrator/README.md.
`.trim();

async function main(): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error(`\n${USAGE}`);
    return 2;
  }

  if (!args.goal) {
    console.error(USAGE);
    return 2;
  }

  const settings = settingsFromProcess();
  if (!isConfigured(settings)) {
    console.error(
      "No provider is configured. Set OPENROUTER_API_KEY and OPENROUTER_MODEL\n" +
        "(one id, or several comma-separated as a fallback chain).\n\n" +
        "See orchestrator/README.md.",
    );
    return 3;
  }

  const workspace = path.resolve(args.workspace);
  try {
    const stat = await fs.stat(workspace);
    if (!stat.isDirectory()) throw new Error("not a directory");
  } catch {
    console.error(`Workspace ${workspace} is not a directory.`);
    return 3;
  }

  console.error(`Goal: ${args.goal}`);
  console.error(`Workspace: ${workspace}`);
  console.error(args.apply ? "Mode: APPLY — files will be written." : "Mode: dry run.");
  console.error("");

  try {
    const report = await conduct(args.goal, {
      workspace,
      apply: args.apply,
      maxAttempts: args.maxAttempts,
      onEvent: (event) => console.error(formatEvent(event)),
    });

    const markdown = formatReport(report);
    if (args.out) {
      await fs.writeFile(args.out, markdown, "utf8");
      console.error(`\nBuild log written to ${args.out}`);
    } else {
      console.log(`\n${markdown}`);
    }
    return report.ok ? 0 : 1;
  } catch (err) {
    if (err instanceof PlanError) {
      console.error(`\nThe plan could not be used: ${err.message}`);
      return 4;
    }
    if (err instanceof ParseError) {
      console.error(`\nThe planner did not answer with JSON.\n\n${err.raw}`);
      return 4;
    }
    console.error(`\n${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    return 1;
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
