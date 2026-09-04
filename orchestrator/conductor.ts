/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

import { generateReply, settingsFromProcess, type LabSettings } from "../lab/agents";

import { blockedTasks, readyTasks, validatePlan, waves } from "./graph";
import { asStringArray, parseJson } from "./json";
import { ContextMemory } from "./memory";
import { ROLES, roleMenu, systemPromptFor } from "./roles";
import { executeTool, CHECK_NAMES, type ToolContext } from "./tools";
import {
  isAgentRole,
  type AgentRole,
  type Plan,
  type RunEvent,
  type RunOptions,
  type RunReport,
  type Task,
  type TaskRun,
  type ToolCall,
  type ToolName,
} from "./types";

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
