/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
