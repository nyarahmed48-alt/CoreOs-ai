/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The build log.
 *
 * Written for the person reading it after a run they did not watch, so it
 * leads with what happened rather than with the plan: which tasks failed and
 * why, then the retries, then everything that went fine. A log that buries a
 * failure under thirty lines of success is a log people stop opening.
 */

import { waves } from "./graph";
import type { RunReport, TaskRun } from "./types";

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
export function formatEvent(event: import("./types").RunEvent): string {
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
