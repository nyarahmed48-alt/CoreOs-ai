/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE CONDUCTOR — a multi-agent build orchestrator.
 *
 * Give it a goal. It breaks the goal into a task graph, assigns each task to a
 * specialist agent, runs independent tasks in parallel, has a QA agent review
 * anything that wrote code, and sends rejected work back to whoever wrote it.
 *
 *   npm run orchestrate -- "Add a /api/waitlist endpoint"
 *   npm run orchestrate -- "..." --apply --out build-log.md
 *
 * Nothing is written to disk without --apply. Requires OPENROUTER_API_KEY and
 * OPENROUTER_MODEL — see the README.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS BUILT THIS WAY
 *
 * It is a graph, not a pipeline. Four prompts in a row cannot express "the
 * frontend and the backend can both start once the API contract is settled,
 * and both must be reviewed before we are done". A DAG can, and the scheduler
 * runs whatever has its dependencies satisfied at the same time. The plan comes
 * from a model, so it is validated before anything executes — a bad plan fails
 * at planning time rather than halfway through a run that has written files.
 *
 * QA reviews; it does not fix. A reviewer that silently repairs what it finds
 * produces a run where nobody can tell what was wrong, and the same defect
 * returns next time because nothing upstream learned. So QA has no write
 * access: it returns a verdict, and the Conductor re-assigns the task to its
 * author with the defects attached verbatim, then reviews again.
 *
 * Agents do not see each other's transcripts. Each task declares the memory
 * keys it needs and receives those and nothing else. That is a rule about who
 * asks for what rather than a summarisation pass — summarising a chain of
 * agents loses the exact column name the next one needs.
 *
 * The tool highway is the security boundary. Paths are confined to one
 * workspace root, checked after resolution and again after symlinks. Commands
 * are never assembled from model output: agents ask for a named check, the argv
 * is written here, and spawn runs with shell:false so metacharacters are inert.
 *
 * No agent framework. LangGraph and CrewAI patterns — typed state, a validated
 * graph, routing on the QA verdict — are implemented directly.
 *
 * Model calls go through generateReply() in lab/agents.ts, the same path the
 * public agents use, so this inherits the OpenRouter fallback chain: a planning
 * call that hits a free model's daily cap moves to the next id in
 * OPENROUTER_MODEL instead of ending the run. That is also why the provider is
 * imported rather than inlined — one copy of the chain, not two to drift apart.
 *
 * ---------------------------------------------------------------------------
 * CONTENTS
 *
 *   1. Vocabulary ............ roles, tools, tasks, runs
 *   2. Parsing ............... getting JSON back out of a model
 *   3. Context memory ........ what each agent is allowed to see
 *   4. Task graph ............ validation, cycles, scheduling
 *   5. The agents ............ briefs, temperatures, tool grants
 *   6. The tool highway ...... file I/O and check execution
 *   7. The Conductor ......... plan → schedule → run → verify → re-assign
 *   8. Build log
 *   9. Entry point
 *
 * Tested in orchestrator.test.mts — the provider is injectable, so the whole
 * loop runs against a stand-in with no key and no network.
 */


import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { generateReply, isConfigured, settingsFromProcess } from "./lab/agents";
import type { LabSettings } from "./lab/agents";

/* ==========================================================================
   1. VOCABULARY
   ========================================================================== */

/**
 * The vocabulary the whole orchestrator is written in.
 *
 * Everything crossing a boundary — the planner's output, what an agent may
 * touch, what a run produces — has a name here, so the compiler catches a
 * malformed plan before a model gets a chance to act on one.
 */

/* ========================================================== agent roles === */

/**
 * The specialists. Deliberately a closed union rather than a string: a plan
 * naming a role that does not exist is a planning failure, and it should be
 * caught when the plan is validated rather than at the moment of dispatch,
 * halfway through a run that has already written files.
 */
export type AgentRole = "designer" | "frontend" | "backend" | "qa";

export const AGENT_ROLES: readonly AgentRole[] = ["designer", "frontend", "backend", "qa"] as const;

export const isAgentRole = (value: unknown): value is AgentRole =>
  typeof value === "string" && (AGENT_ROLES as readonly string[]).includes(value);

/* ================================================================ tools === */

/** Every capability an agent can be granted. Roles get a subset, never all. */
export type ToolName =
  | "read_file"
  | "write_file"
  | "list_files"
  | "run_check";

export const TOOL_NAMES: readonly ToolName[] = [
  "read_file",
  "write_file",
  "list_files",
  "run_check",
] as const;

/** One tool call an agent asked for, before it has been authorised or run. */
export interface ToolCall {
  tool: ToolName;
  /** Workspace-relative path. Absolute paths and traversal are rejected. */
  path?: string;
  /** File body, for write_file. */
  content?: string;
  /** Which named check to run, for run_check. Never a raw command line. */
  check?: string;
}

export interface ToolResult {
  tool: ToolName;
  ok: boolean;
  /** Human-readable outcome, and what the agent sees on its next turn. */
  detail: string;
  /** Present on a successful read_file or list_files. */
  output?: string;
}

/* ================================================================= plan === */

/**
 * One unit of work. The planner emits these; the scheduler orders them.
 *
 * `needs` is the token-discipline mechanism: a task states which memory keys
 * it wants, and receives those and nothing else. Without it every agent would
 * inherit the whole run's history and the context would grow until it either
 * costs a fortune or is truncated somewhere arbitrary.
 */
export interface Task {
  id: string;
  role: AgentRole;
  /** What this task must achieve, in one or two sentences. */
  goal: string;
  /** Task ids that must succeed first. */
  dependsOn: string[];
  /** Memory keys to inject into this task's prompt. */
  needs: string[];
  /** Memory key this task's result is stored under. Defaults to its id. */
  produces: string;
}

export interface Plan {
  goal: string;
  tasks: Task[];
}

/* ============================================================== running === */

export type TaskStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface TaskRun {
  task: Task;
  status: TaskStatus;
  attempts: number;
  /** The agent's final prose answer for this task. */
  summary?: string;
  /** Why it failed, when it did. Carried into the retry prompt verbatim. */
  failure?: string;
  toolResults: ToolResult[];
  startedAt?: string;
  finishedAt?: string;
  /** Which position in the OPENROUTER_MODEL chain answered, when known. */
  answeredBy?: number;
}

export interface RunOptions {
  /** Root that every file operation is confined to. */
  workspace: string;
  /** How many times a task may be re-assigned after QA rejects it. */
  maxAttempts: number;
  /** Cap on tool calls per task attempt, so a loop cannot run away. */
  maxToolCalls: number;
  /** Write files, or only report what would be written. */
  apply: boolean;
  /** Called for every log line as it happens. */
  onEvent?: (event: RunEvent) => void;
}

export type RunEvent =
  | { kind: "plan"; plan: Plan }
  | { kind: "task-start"; taskId: string; role: AgentRole; attempt: number }
  | { kind: "tool"; taskId: string; result: ToolResult }
  | { kind: "task-end"; taskId: string; status: TaskStatus; summary?: string }
  | { kind: "retry"; taskId: string; reason: string; attempt: number }
  | { kind: "note"; message: string };

export interface RunReport {
  goal: string;
  plan: Plan;
  runs: TaskRun[];
  /** Workspace-relative paths written (or that would be, on a dry run). */
  filesWritten: string[];
  ok: boolean;
  startedAt: string;
  finishedAt: string;
}

/* ==========================================================================
   2. PARSING MODEL REPLIES
   ========================================================================== */

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

/* ==========================================================================
   3. SHARED CONTEXT MEMORY
   ========================================================================== */

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

/* ==========================================================================
   4. TASK GRAPH — VALIDATION AND SCHEDULING
   ========================================================================== */

/**
 * The task graph: validation, and deciding what may run next.
 *
 * The plan arrives from a language model, so it is untrusted structurally as
 * well as semantically. A plan that names a role that does not exist, depends
 * on a task that was never declared, or contains a cycle will not fail at
 * planning time — it will fail halfway through a run, after agents have
 * already written files. So everything checkable is checked up front, once,
 * and a bad plan is rejected before any work starts.
 *
 * Scheduling is a ready-set rather than a fixed order: at each step, every
 * task whose dependencies have all succeeded may run, and they run together.
 * That is what makes the frontend and the backend agent work in parallel once
 * the designer has settled the API contract between them.
 */


export class PlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanError";
  }
}

/** Fail on the first structural problem, naming the task so it can be fixed. */
export function validatePlan(plan: Plan): void {
  if (!plan.tasks.length) throw new PlanError("The plan has no tasks.");

  const seen = new Set<string>();
  for (const task of plan.tasks) {
    if (!task.id) throw new PlanError("A task has no id.");
    if (seen.has(task.id)) throw new PlanError(`Two tasks share the id "${task.id}".`);
    seen.add(task.id);

    if (!isAgentRole(task.role)) {
      throw new PlanError(`Task "${task.id}" names role "${task.role}", which does not exist.`);
    }
    if (!task.goal || !task.goal.trim()) {
      throw new PlanError(`Task "${task.id}" has no goal, so there is nothing to assign.`);
    }
  }

  for (const task of plan.tasks) {
    for (const dep of task.dependsOn) {
      if (!seen.has(dep)) {
        throw new PlanError(`Task "${task.id}" depends on "${dep}", which is not in the plan.`);
      }
      if (dep === task.id) throw new PlanError(`Task "${task.id}" depends on itself.`);
    }
  }

  const cycle = findCycle(plan.tasks);
  if (cycle) {
    throw new PlanError(`The plan has a dependency cycle: ${cycle.join(" → ")}.`);
  }
}

/**
 * The first cycle found, as the path around it, or null.
 *
 * Depth-first with an explicit "on the current path" set. Reporting the path
 * rather than a bare "cycle detected" is the difference between a message the
 * planner can be told to fix and one a person has to reverse-engineer.
 */
export function findCycle(tasks: Task[]): string[] | null {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const settled = new Set<string>();
  const onPath = new Set<string>();
  const path: string[] = [];

  const walk = (id: string): string[] | null => {
    if (settled.has(id)) return null;
    if (onPath.has(id)) return [...path.slice(path.indexOf(id)), id];

    onPath.add(id);
    path.push(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      const found = walk(dep);
      if (found) return found;
    }
    path.pop();
    onPath.delete(id);
    settled.add(id);
    return null;
  };

  for (const task of tasks) {
    const found = walk(task.id);
    if (found) return found;
  }
  return null;
}

/**
 * Every task that can start right now: still pending, and with all of its
 * dependencies already done.
 */
export function readyTasks(runs: TaskRun[]): TaskRun[] {
  const statusOf = new Map<string, TaskStatus>(runs.map((r) => [r.task.id, r.status]));
  return runs.filter(
    (run) =>
      run.status === "pending" &&
      run.task.dependsOn.every((dep) => statusOf.get(dep) === "done"),
  );
}

/**
 * Tasks that can never run now, because something they depend on failed.
 *
 * Marking these explicitly is what stops a run from reporting success while
 * silently having skipped half the plan — and it lets the report say which
 * failure caused which omission, rather than leaving a gap.
 */
export function blockedTasks(runs: TaskRun[]): TaskRun[] {
  const bad = new Set(
    runs.filter((r) => r.status === "failed" || r.status === "skipped").map((r) => r.task.id),
  );
  if (!bad.size) return [];

  /* A dependency that is itself skipped blocks in turn, so this has to close
     over the set rather than look one level down. */
  let changed = true;
  while (changed) {
    changed = false;
    for (const run of runs) {
      if (run.status !== "pending" || bad.has(run.task.id)) continue;
      if (run.task.dependsOn.some((dep) => bad.has(dep))) {
        bad.add(run.task.id);
        changed = true;
      }
    }
  }

  return runs.filter((r) => r.status === "pending" && bad.has(r.task.id));
}

/**
 * The plan in dependency order, as parallel waves.
 *
 * Used for display and for the build log — the executor uses readyTasks(),
 * which reacts to what actually happened rather than to what was foreseen.
 */
export function waves(tasks: Task[]): Task[][] {
  const remaining = new Map(tasks.map((t) => [t.id, t]));
  const placed = new Set<string>();
  const out: Task[][] = [];

  while (remaining.size) {
    const wave = [...remaining.values()].filter((t) =>
      t.dependsOn.every((d) => placed.has(d)),
    );
    /* validatePlan rules this out; if it is ever reached, stopping beats
       looping forever. */
    if (!wave.length) break;
    for (const t of wave) {
      remaining.delete(t.id);
      placed.add(t.id);
    }
    out.push(wave);
  }
  return out;
}

/* ==========================================================================
   5. THE AGENTS
   ========================================================================== */

/**
 * The specialists: what each one is for, what it may touch, and how it answers.
 *
 * Two things are deliberately narrow here.
 *
 * The tool grants. The designer cannot write files — its output is a contract
 * others build against, and an architect that edits the code is not reviewable.
 * QA cannot write files either: a reviewer that silently fixes what it finds
 * produces a run where nobody can tell what was wrong, and the same defect
 * comes back next time because nothing upstream learned. Only frontend and
 * backend write, and only QA runs checks.
 *
 * The reply format. Every agent answers with one JSON object, because the
 * conductor has to distinguish "here is a file" from "I am done" from "this
 * failed review", and prose cannot carry that reliably. The instruction is
 * repeated in each brief rather than appended once centrally: models follow a
 * format stated as part of their job far better than one bolted on at the end.
 */


export interface RoleDefinition {
  role: AgentRole;
  title: string;
  /** What the planner should hand this role. Shown to the planner verbatim. */
  suitedTo: string;
  tools: readonly ToolName[];
  /** Lower for contract and review work, higher where phrasing matters. */
  temperature: number;
  brief: string;
}

/** The reply contract, shared so the parser and the prompts cannot drift. */
const REPLY_CONTRACT = `
Answer with ONE JSON object and nothing else — no prose before it, no code fence:

{
  "thought": "one sentence on what you are doing and why",
  "tools": [ { "tool": "read_file", "path": "src/x.ts" } ],
  "summary": "what you produced, for the agents downstream",
  "done": false
}

- "tools" is what you want run before your next turn. Leave it empty when you
  need nothing.
- Set "done" to true only when your task is finished. You will keep getting
  turns until you do, up to a limit.
- "summary" is the ONLY thing later agents see of your work. Put the API paths,
  file names, types and column names they will need in it. Do not paste whole
  files into it — they can read those.

Tool shapes:
  { "tool": "read_file",  "path": "relative/path.ts" }
  { "tool": "list_files", "path": "src" }
  { "tool": "write_file", "path": "relative/path.ts", "content": "..." }
  { "tool": "run_check",  "check": "typecheck" | "test" | "build" }
`.trim();

const HOUSE_RULES = `
House rules for every file you write:
- TypeScript, strict-safe: no implicit any, no non-null assertions to silence
  the compiler, no @ts-ignore.
- Explain WHY in comments, not what. A comment restating the line above it is
  noise; one naming the failure the code prevents is worth keeping.
- Match the conventions already in the file you are editing over your own
  preference. Read it first.
- Never invent a dependency. If it is not in package.json, it is not installed.
`.trim();

export const ROLES: Readonly<Record<AgentRole, RoleDefinition>> = {
  designer: {
    role: "designer",
    title: "System Designer",
    suitedTo:
      "Architecture decisions, database schemas, API contracts, and deciding what the other agents build against. Give it anything that two later tasks would otherwise each have to guess at.",
    tools: ["read_file", "list_files"],
    temperature: 0.25,
    brief: `
You are the System Designer. You decide the shape of things; you do not build them.

Your output is a contract other agents implement, so it has to be precise
enough to build from and short enough to read. For a schema: table names,
columns with types, keys, and the constraints that matter — plus one line on
why, where a choice is not obvious. For an API: method, path, request shape,
response shape, and status codes for the failure cases people forget.

Say what you decided AGAINST when the alternative was reasonable. The agent
implementing this will otherwise re-litigate it.

You cannot write files. Read what exists before designing around it — the
conventions in this repository beat generic best practice.
`.trim(),
  },

  frontend: {
    role: "frontend",
    title: "Frontend Engineer",
    suitedTo:
      "React components, pages, hooks, styling, client-side state and data fetching. TypeScript and Tailwind.",
    tools: ["read_file", "list_files", "write_file"],
    temperature: 0.3,
    brief: `
You are the Frontend Engineer. You write React and TypeScript.

Read a neighbouring component before writing a new one and match it: the same
import style, the same styling approach, the same way state is handled. A file
that looks foreign is a file that gets rewritten.

Type props and state properly — no \`any\`, no casts to make an error go away.
Handle the loading and error states, not only the happy path; a component that
renders nothing while it waits is a bug report.

If a contract from the designer is in your context, build exactly to it. If it
is missing something you need, say so in your summary rather than inventing a
field the backend will not send.
`.trim(),
  },

  backend: {
    role: "backend",
    title: "Backend Engineer",
    suitedTo:
      "API routes, serverless functions, database queries, migrations, and server-side integration. Node.js, Supabase, PostgreSQL.",
    tools: ["read_file", "list_files", "write_file"],
    temperature: 0.25,
    brief: `
You are the Backend Engineer. You write server-side TypeScript and SQL.

Validate every input at the boundary. A handler that trusts its request body is
the bug, not the caller that sent a bad one.

Never return a provider's raw error to a client — it can echo the prompt or the
query back. Log the detail, return something the caller can act on.

For SQL: index every foreign key, because Postgres will not do it for you and
every one of them gets followed. Enable row level security on anything holding
customer data, and if you write a permissive policy, say in your summary who
you decided may read those rows and why.

Secrets come from the environment. Never put one in a file you write, and never
give one a client-visible prefix such as VITE_ — that inlines it into the
browser bundle at build time with no warning.
`.trim(),
  },

  qa: {
    role: "qa",
    title: "QA & Refactoring",
    suitedTo:
      "Reviewing what the other agents produced, running the type checker and tests, and deciding whether the work is acceptable. Put one of these after any task that writes code.",
    tools: ["read_file", "list_files", "run_check"],
    temperature: 0.15,
    brief: `
You are QA. You review; you do not fix.

Read the files the task under review actually wrote, then run the checks that
apply — typecheck first, since it is fast and catches most of it.

You cannot write files. When you find a defect, describe it precisely enough to
be fixed without you: the file, the line or the function, what is wrong, and
what it would take to be right. The task will be re-assigned to whoever wrote
it, with your words attached.

Judge what was asked for. A task that did its job is a pass even if you would
have written it differently — style preferences are not defects, and rejecting
on them burns a retry that a real bug needed. A failing typecheck, a wrong
type, an unhandled error path, a security mistake, or code that does not do
what the task asked, all are.

Your reply object takes two extra fields:
  "verdict": "pass" | "fail"
  "defects": ["one per finding, specific enough to act on"]

Set "done" to true once you have reached a verdict. Do not set "verdict" until
you have actually run a check or read the files — a pass on a glance is worse
than no review, because it is trusted.
`.trim(),
  },
};

/** The full system prompt for one role. */
export function systemPromptFor(role: AgentRole): string {
  const def = ROLES[role];
  return [def.brief, HOUSE_RULES, REPLY_CONTRACT].join("\n\n---\n\n");
}

/** The role menu the planner picks from, generated so it cannot go stale. */
export function roleMenu(): string {
  return Object.values(ROLES)
    .map((r) => `- "${r.role}" (${r.title}): ${r.suitedTo}`)
    .join("\n");
}

/* ==========================================================================
   6. THE TOOL HIGHWAY — THE SECURITY BOUNDARY
   ========================================================================== */

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

/* ==========================================================================
   7. THE CONDUCTOR
   ========================================================================== */

/**
 * The Conductor: plan, schedule, run, verify, re-assign.
 *
 * The loop it implements is the reason this is not just four prompts in a row:
 *
 *   1. Decompose the goal into a task graph.
 *   2. Run every task whose dependencies have succeeded, together.
 *   3. When QA rejects a task, re-assign the task it reviewed — with the
 *      defects attached — rather than failing the run or, worse, letting QA
 *      quietly fix it and lose the record of what was wrong.
 *   4. Stop when nothing is left that can run.
 *
 * Model calls go through generateReply() in lab/agents.ts, which is the same
 * path the public agents use. That is not laziness — it means the orchestrator
 * inherits the OpenRouter fallback chain, so a planning call that hits a free
 * model's daily cap moves to the next id instead of ending the run.
 *
 * The provider is injectable so the whole loop can be exercised against a
 * stand-in. A system that only runs when a paid API answers is a system nobody
 * can test.
 */



/* ============================================================ provider === */

export interface CompletionRequest {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  temperature: number;
  maxTokens?: number;
}

export interface CompletionResult {
  text: string;
  /** Position in the model chain that answered, when the provider reports it. */
  attempt?: number;
}

export type Complete = (request: CompletionRequest) => Promise<CompletionResult>;

/** The real provider: OpenRouter, through the shared runtime and its chain. */
export function providerFrom(settings: LabSettings = settingsFromProcess()): Complete {
  return async (request) => {
    const reply = await generateReply(
      {
        system: request.system,
        messages: request.messages,
        temperature: request.temperature,
        maxTokens: request.maxTokens ?? 8_000,
      },
      settings,
    );
    return { text: reply.text, attempt: reply.attempt };
  };
}

/* ============================================================= planning === */

const PLANNER_SYSTEM = `
You are the Conductor of a team of software agents. You do not write code. You
decide who does what, and in which order.

Break the goal into the smallest number of tasks that actually get it done.
Three well-chosen tasks beat nine that each do a fragment: every task is a
model call with its own context, and splitting work that belongs together
means neither half can see the other.

The specialists available:

__ROLES__

Rules that make a plan runnable rather than merely plausible:

- Design before building. If two later tasks would each have to guess at the
  same schema or API shape, put a "designer" task in front of them and have
  both depend on it. That is what stops the frontend and the backend
  disagreeing about a field name.
- Put a "qa" task after anything that writes code, depending on the task it
  reviews. QA is what makes a failure recoverable: without it, a broken file
  is simply the output.
- Tasks with no dependency between them run at the same time, so do not chain
  things that are actually independent.
- "needs" lists the "produces" keys of earlier tasks whose output this task
  must see. Ask for what you need and nothing more — each key costs context.

Answer with ONE JSON object and nothing else:

{
  "tasks": [
    {
      "id": "schema",
      "role": "designer",
      "goal": "Design the table for X: columns, keys, and the constraints.",
      "dependsOn": [],
      "needs": [],
      "produces": "schema"
    }
  ]
}
`.trim();

export interface PlanOptions {
  complete: Complete;
  /** Shown to the planner so it can plan around what is already there. */
  workspaceSummary?: string;
}

/** Turn a goal into a validated task graph. Throws PlanError if unusable. */
export async function makePlan(goal: string, options: PlanOptions): Promise<Plan> {
  const context = options.workspaceSummary
    ? `\n\nThe workspace currently contains:\n${options.workspaceSummary}`
    : "";

  const reply = await options.complete({
    system: PLANNER_SYSTEM.replace("__ROLES__", roleMenu()),
    messages: [{ role: "user", content: `Goal:\n${goal}${context}` }],
    temperature: 0.2,
    maxTokens: 3_000,
  });

  const raw = parseJson<{ tasks?: unknown }>(reply.text);
  const tasks: Task[] = (Array.isArray(raw.tasks) ? raw.tasks : []).map((entry, index) => {
    const t = entry as Record<string, unknown>;
    const id = typeof t.id === "string" && t.id.trim() ? t.id.trim() : `task-${index + 1}`;
    return {
      id,
      role: (isAgentRole(t.role) ? t.role : "backend") as AgentRole,
      goal: typeof t.goal === "string" ? t.goal : "",
      dependsOn: asStringArray(t.dependsOn),
      needs: asStringArray(t.needs),
      produces: typeof t.produces === "string" && t.produces.trim() ? t.produces.trim() : id,
    };
  });

  const plan: Plan = { goal, tasks };
  validatePlan(plan);
  return plan;
}

/* ============================================================== agents === */

interface AgentTurn {
  thought?: string;
  tools?: unknown;
  summary?: string;
  done?: boolean;
  verdict?: string;
  defects?: unknown;
}

function readToolCalls(value: unknown, allowed: readonly ToolName[]): ToolCall[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): ToolCall[] => {
    if (!entry || typeof entry !== "object") return [];
    const t = entry as Record<string, unknown>;
    const name = t.tool;
    if (typeof name !== "string" || !(allowed as readonly string[]).includes(name)) {
      /* Kept rather than dropped: the agent gets a result explaining the
         refusal, which is more useful than a turn where nothing happened. */
      return [{ tool: (name as ToolName) ?? "read_file" }];
    }
    return [
      {
        tool: name as ToolName,
        path: typeof t.path === "string" ? t.path : undefined,
        content: typeof t.content === "string" ? t.content : undefined,
        check: typeof t.check === "string" ? t.check : undefined,
      },
    ];
  });
}

export interface AgentOutcome {
  summary: string;
  verdict?: "pass" | "fail";
  defects: string[];
  answeredBy?: number;
}

/**
 * Run one task to completion: turns of model output and tool execution, until
 * the agent says it is done or it runs out of turns.
 *
 * Running out of turns is not a failure of the task — it is a failure to
 * finish, and it is reported as one, with whatever the agent last said. A run
 * that silently accepted an unfinished task would hand QA something half
 * written and blame the author.
 */
export async function runAgent(
  run: TaskRun,
  memory: ContextMemory,
  toolCtx: ToolContext,
  complete: Complete,
  options: Pick<RunOptions, "maxToolCalls" | "onEvent">,
): Promise<AgentOutcome> {
  const def = ROLES[run.task.role];
  const context = memory.render(run.task.needs);

  const opening = [
    `## Your task\n${run.task.goal}`,
    context,
    run.failure
      ? `## This task was returned to you\nQA rejected the previous attempt:\n\n${run.failure}\n\nFix exactly these points. Do not start over.`
      : "",
    `## Checks you can run\n${CHECK_NAMES.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: CompletionRequest["messages"] = [{ role: "user", content: opening }];
  let outcome: AgentOutcome = { summary: "", defects: [] };
  let calls = 0;

  for (let turn = 0; turn < options.maxToolCalls; turn++) {
    const reply = await complete({
      system: systemPromptFor(run.task.role),
      messages,
      temperature: def.temperature,
      maxTokens: 8_000,
    });
    outcome.answeredBy = reply.attempt;

    let parsed: AgentTurn;
    try {
      parsed = parseJson<AgentTurn>(reply.text);
    } catch {
      /* Give it one plain-language nudge rather than failing the task: the
         content is usually right and only the wrapper is wrong. */
      messages.push({ role: "assistant", content: reply.text.slice(0, 2_000) });
      messages.push({
        role: "user",
        content: "That was not a single JSON object. Reply again with only the JSON object.",
      });
      continue;
    }

    if (typeof parsed.summary === "string" && parsed.summary.trim()) {
      outcome.summary = parsed.summary.trim();
    }
    if (parsed.verdict === "pass" || parsed.verdict === "fail") outcome.verdict = parsed.verdict;
    outcome.defects = asStringArray(parsed.defects);

    const wanted = readToolCalls(parsed.tools, def.tools);
    if (!wanted.length || parsed.done === true) {
      if (parsed.done === true) return outcome;
      /* No tools and not done: nothing will change on the next turn. */
      if (!wanted.length) return outcome;
    }

    messages.push({ role: "assistant", content: JSON.stringify(parsed) });

    const results: string[] = [];
    for (const call of wanted) {
      if (calls >= options.maxToolCalls) {
        results.push("Tool budget for this task is spent. Finish with what you have.");
        break;
      }
      calls++;
      const result = await executeTool(call, toolCtx);
      run.toolResults.push(result);
      options.onEvent?.({ kind: "tool", taskId: run.task.id, result });
      results.push(
        `- ${result.tool}: ${result.ok ? "ok" : "FAILED"} — ${result.detail}` +
          (result.output ? `\n\n\`\`\`\n${result.output}\n\`\`\`` : ""),
      );
    }

    messages.push({ role: "user", content: `Tool results:\n\n${results.join("\n\n")}` });
  }

  return outcome;
}

/* ============================================================ the run ==== */

const DEFAULTS: Omit<RunOptions, "workspace"> = {
  maxAttempts: 2,
  maxToolCalls: 12,
  apply: false,
};

export interface ConductorOptions extends Partial<RunOptions> {
  workspace: string;
  complete?: Complete;
}

/**
 * Plan and execute a goal end to end.
 *
 * Returns a report rather than throwing on task failure: a run where two of
 * five tasks failed still produced three tasks' worth of work and a record of
 * why the others did not, and that is more useful than an exception.
 */
export async function conduct(goal: string, options: ConductorOptions): Promise<RunReport> {
  const opts: RunOptions = { ...DEFAULTS, ...options, workspace: options.workspace };
  const complete = options.complete ?? providerFrom();
  const emit = (event: RunEvent) => opts.onEvent?.(event);
  const startedAt = new Date().toISOString();

  const plan = await makePlan(goal, { complete });
  emit({ kind: "plan", plan });

  const memory = new ContextMemory();
  const runs: TaskRun[] = plan.tasks.map((task) => ({
    task,
    status: "pending",
    attempts: 0,
    toolResults: [],
  }));
  const byId = new Map(runs.map((r) => [r.task.id, r]));
  const written: string[] = [];

  for (;;) {
    const ready = readyTasks(runs);
    if (!ready.length) break;

    await Promise.all(
      ready.map(async (run) => {
        run.status = "running";
        run.attempts++;
        run.startedAt = new Date().toISOString();
        emit({
          kind: "task-start",
          taskId: run.task.id,
          role: run.task.role,
          attempt: run.attempts,
        });

        const toolCtx: ToolContext = {
          workspace: opts.workspace,
          apply: opts.apply,
          allowed: ROLES[run.task.role].tools,
          written,
        };

        let outcome: AgentOutcome;
        try {
          outcome = await runAgent(run, memory, toolCtx, complete, opts);
        } catch (err) {
          run.status = "failed";
          run.failure = err instanceof Error ? err.message : String(err);
          run.finishedAt = new Date().toISOString();
          emit({ kind: "task-end", taskId: run.task.id, status: "failed" });
          return;
        }

        run.summary = outcome.summary;
        run.answeredBy = outcome.answeredBy;
        run.finishedAt = new Date().toISOString();

        /* A QA task that fails is not itself a failure — it is a finding, and
           the finding belongs to whoever it reviewed. */
        if (run.task.role === "qa" && outcome.verdict === "fail") {
          const defects = outcome.defects.length
            ? outcome.defects.map((d) => `- ${d}`).join("\n")
            : outcome.summary || "QA rejected the work without naming a defect.";

          const reviewed = run.task.dependsOn
            .map((id) => byId.get(id))
            .filter((r): r is TaskRun => !!r && r.task.role !== "qa");

          const retryable = reviewed.filter((r) => r.attempts < opts.maxAttempts);
          if (retryable.length) {
            for (const target of retryable) {
              target.status = "pending";
              target.failure = defects;
              emit({
                kind: "retry",
                taskId: target.task.id,
                reason: defects,
                attempt: target.attempts + 1,
              });
            }
            run.status = "pending"; // review again once they have had another go
            run.failure = undefined;
            return;
          }

          run.status = "failed";
          run.failure = `QA rejected this and the authoring task is out of attempts:\n${defects}`;
          emit({ kind: "task-end", taskId: run.task.id, status: "failed" });
          return;
        }

        run.status = "done";
        memory.write(run.task.produces, outcome.summary || "(no summary)", run.task.id);
        emit({
          kind: "task-end",
          taskId: run.task.id,
          status: "done",
          summary: outcome.summary,
        });
      }),
    );

    for (const blocked of blockedTasks(runs)) {
      blocked.status = "skipped";
      blocked.failure = "Skipped: a task it depends on did not succeed.";
      emit({ kind: "task-end", taskId: blocked.task.id, status: "skipped" });
    }
  }

  return {
    goal,
    plan,
    runs,
    filesWritten: written,
    ok: runs.every((r) => r.status === "done"),
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

/** The plan as parallel waves, for the log and the CLI. */
export const planWaves = waves;

/* ==========================================================================
   8. BUILD LOG
   ========================================================================== */

/**
 * The build log.
 *
 * Written for the person reading it after a run they did not watch, so it
 * leads with what happened rather than with the plan: which tasks failed and
 * why, then the retries, then everything that went fine. A log that buries a
 * failure under thirty lines of success is a log people stop opening.
 */


const ICON: Record<TaskRun["status"], string> = {
  done: "✓",
  failed: "✗",
  skipped: "–",
  running: "…",
  pending: "·",
};

const duration = (run: TaskRun): string => {
  if (!run.startedAt || !run.finishedAt) return "";
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  return ms >= 1000 ? ` (${(ms / 1000).toFixed(1)}s)` : ` (${ms}ms)`;
};

export function formatReport(report: RunReport): string {
  const out: string[] = [];
  const failed = report.runs.filter((r) => r.status === "failed");
  const skipped = report.runs.filter((r) => r.status === "skipped");
  const retried = report.runs.filter((r) => r.attempts > 1);

  out.push(`# ${report.ok ? "Run complete" : "Run finished with failures"}`);
  out.push("");
  out.push(`**Goal.** ${report.goal}`);
  out.push("");
  out.push(
    `${report.runs.filter((r) => r.status === "done").length} of ${report.runs.length} tasks succeeded` +
      (failed.length ? `, ${failed.length} failed` : "") +
      (skipped.length ? `, ${skipped.length} skipped` : "") +
      ".",
  );

  if (failed.length || skipped.length) {
    out.push("");
    out.push("## What went wrong");
    for (const run of [...failed, ...skipped]) {
      out.push("");
      out.push(`**${run.task.id}** (${run.task.role}) — ${run.status}`);
      out.push("");
      out.push(run.failure ?? "No reason was recorded.");
    }
  }

  if (retried.length) {
    out.push("");
    out.push("## Re-assigned after review");
    for (const run of retried) {
      out.push(`- **${run.task.id}** — ${run.attempts} attempts, ended ${run.status}`);
    }
  }

  out.push("");
  out.push("## Plan");
  out.push("");
  waves(report.plan.tasks).forEach((wave, i) => {
    out.push(`**Step ${i + 1}**${wave.length > 1 ? ` — ${wave.length} tasks in parallel` : ""}`);
    for (const task of wave) {
      const run = report.runs.find((r) => r.task.id === task.id);
      const status = run ? `${ICON[run.status]} ` : "";
      out.push(`- ${status}\`${task.id}\` (${task.role}) — ${task.goal}`);
      if (run?.summary) out.push(`  - ${run.summary.split("\n")[0]}`);
      if (run?.answeredBy && run.answeredBy > 1) {
        out.push(`  - answered by fallback #${run.answeredBy} in the model chain`);
      }
    }
    out.push("");
  });

  out.push("## Files");
  out.push("");
  if (report.filesWritten.length) {
    for (const file of report.filesWritten) out.push(`- \`${file}\``);
  } else {
    out.push("Nothing was written.");
  }

  out.push("");
  out.push("## Tool calls");
  out.push("");
  for (const run of report.runs) {
    if (!run.toolResults.length) continue;
    out.push(`**${run.task.id}**${duration(run)}`);
    for (const result of run.toolResults) {
      out.push(`- ${result.ok ? "ok" : "FAILED"} · ${result.tool} — ${result.detail}`);
    }
    out.push("");
  }

  return out.join("\n");
}

/** A one-line-per-event stream, for watching a run as it happens. */
export function formatEvent(event: RunEvent): string {
  switch (event.kind) {
    case "plan":
      return `plan · ${event.plan.tasks.length} tasks`;
    case "task-start":
      return `▸ ${event.taskId} (${event.role})${event.attempt > 1 ? ` attempt ${event.attempt}` : ""}`;
    case "tool":
      return `  ${event.result.ok ? "·" : "✗"} ${event.result.tool} — ${event.result.detail}`;
    case "task-end":
      return `${ICON[event.status]} ${event.taskId}${event.summary ? ` — ${event.summary.split("\n")[0]}` : ""}`;
    case "retry":
      return `↻ ${event.taskId} sent back (attempt ${event.attempt})`;
    case "note":
      return `  ${event.message}`;
  }
}

/* ==========================================================================
   9. ENTRY POINT
   ========================================================================== */

/**
 * The entry point: `npm run orchestrate -- "<goal>"`.
 *
 * Dry by default. A tool that writes files across a repository the first time
 * anyone tries it, before they know what it does, is a tool people run once.
 * Passing --apply is a deliberate act, and it prints what it is about to do.
 */



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

/* Run only when this file is the program, so the test file can import it. */
const invokedDirectly = process.argv[1]?.endsWith("orchestrator.ts") === true;

if (invokedDirectly) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
