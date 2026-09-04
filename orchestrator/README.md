# The Conductor

A multi-agent orchestrator: you give it a goal, it breaks the goal into a task
graph, assigns each task to a specialist agent, runs independent tasks in
parallel, has a QA agent review anything that wrote code, and sends rejected
work back to whoever wrote it.

```bash
npm run orchestrate -- "Add a /api/waitlist endpoint that stores signups"
```

Nothing is written to disk without `--apply`.

---

## Why it is built this way

**It is a graph, not a pipeline.** Four prompts in a row cannot express "the
frontend and the backend can start once the API contract is settled, and both
must be reviewed before we are done". A DAG can, and the scheduler runs
everything whose dependencies have succeeded at the same time.

**QA reviews; it does not fix.** A reviewer that silently repairs what it finds
produces a run where nobody can tell what was wrong — and the same defect
returns next time, because nothing upstream learned. So QA has no write access.
When it rejects a task, the Conductor re-assigns that task to its original
author with the defects attached verbatim, and re-runs the review afterwards.

**Agents do not see each other's transcripts.** Each task declares the memory
keys it needs, and gets those and nothing else. This is the token strategy, and
it is a rule about who asks for what rather than a summarisation pass —
summarising a chain of agents loses the exact column name the next one needs,
which is the detail that has to survive.

**No agent framework.** LangGraph and CrewAI patterns are implemented directly:
typed state, a validated graph, conditional routing on the QA verdict. This
repository calls OpenRouter with `fetch` and carries no provider SDK; adding a
framework's dependency tree to get a state machine that fits in one file would
be a bad trade. The concepts are theirs; the code is small enough to read.

**It runs on the same provider as the site.** Model calls go through
`generateReply()` in `lab/agents.ts`, so the orchestrator inherits the
OpenRouter fallback chain: a planning call that hits a free model's daily cap
moves to the next id instead of ending the run.

---

## Setup

**Prerequisites:** Node.js 20+, and an OpenRouter key.

```bash
npm install
```

Set these in `.env.local`, or in your shell:

| Variable | |
| --- | --- |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | https://openrouter.ai/models — one id, or several comma-separated |
| `OPENROUTER_BASE_URL` | optional; a proxy or a stand-in endpoint |

`OPENROUTER_MODEL` takes a **comma-separated chain**, tried in order. Use it.
Orchestration makes many calls per run, so a free model's daily cap is a real
risk mid-run; a second id is what turns that from a failed run into a slower
one. Anything ending `:free` costs nothing.

```
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free, google/gemma-2-9b-it:free
```

Pick a model that is good at instruction-following and returns clean JSON. Every
agent replies with a JSON object, and a model that narrates around it will work
— the parser recovers from fences and preamble — but it wastes turns.

---

## Running it

```bash
# See the plan and what would be written. Nothing touches disk.
npm run orchestrate -- "Add rate limiting to the contact form"

# Actually write the files.
npm run orchestrate -- "Add rate limiting to the contact form" --apply

# Confine it to a subdirectory, and save the build log.
npm run orchestrate -- "Refactor the settings store" \
  --workspace ./lab --apply --out build-log.md
```

| Option | |
| --- | --- |
| `--apply` | Write files. Without it, `write_file` reports what it would do. |
| `--workspace <dir>` | The only directory agents may read or write. Default: cwd. |
| `--out <file>` | Write the build log as Markdown instead of to stdout. |
| `--max-attempts <n>` | Times a task may be re-assigned after QA rejects it. Default 2. |

Exit codes: `0` all tasks succeeded · `1` some failed · `2` bad arguments ·
`3` no provider configured · `4` the plan was unusable.

Progress goes to stderr, the build log to stdout, so you can pipe one without
losing the other.

---

## The agents

| Role | Does | May use |
| --- | --- | --- |
| **designer** | Architecture, schemas, API contracts | read, list |
| **frontend** | React / TypeScript / Tailwind | read, list, **write** |
| **backend** | API routes, serverless functions, SQL | read, list, **write** |
| **qa** | Review, typecheck, tests, the verdict | read, list, **run checks** |

The grants are the design. The designer cannot write, because an architect who
edits the code is not reviewable. QA cannot write, for the reason above. Only
QA can run checks, so nothing else can spend three minutes on a build.

Edit `roles.ts` to change a brief or a grant. Both are in one place per role,
and the tool allowlist is enforced in `tools.ts` rather than merely requested in
the prompt — an agent that asks for a tool it was not granted gets a refusal it
can read, not a silently dropped call.

---

## The tool highway

Everything above this layer is a model deciding what it would like to do, and
models can be talked into things — by a stray line in a file they were asked to
read, or simply by being wrong. So `tools.ts` trusts nothing:

- **Paths are confined to the workspace**, checked after resolution *and* after
  symlinks are followed. `..` is not filtered out of strings, which is a game
  you lose; the resolved location is compared to the root.
- **Commands are never built from model output.** An agent asks for a named
  check; the argv lives in `CHECKS`. There is no shell — `spawn` is called with
  an argv array and `shell: false` — so `;`, `$(...)` and backticks are inert
  data. A check name containing them is looked up, missed, and refused.
- **Checks are bounded**: 180s timeout, output capped, killed rather than left
  to hold the run open.
- **Ordinary failures come back as results**, not exceptions. An agent that
  asks for a bad path is told so and gets another turn; crashing the run would
  discard every other task's work.

Adding a check adds a capability to every agent allowed to run checks. Add the
argv to `CHECKS` deliberately; there is no way to pass one in, and that is the
point.

---

## Layout

```
types.ts       the vocabulary — roles, tools, tasks, runs
graph.ts       plan validation, cycle detection, ready-set scheduling
memory.ts      the shared context bus and its budgets
roles.ts       the four agents: briefs, temperatures, tool grants
tools.ts       the security boundary — file I/O and check execution
json.ts        getting JSON back out of a model that added a code fence
conductor.ts   plan → schedule → run → verify → re-assign
log.ts         the build log
cli.ts         the entry point
```

---

## Tests

```bash
npm test
```

56 cases, no key and no network — the provider is injected, so the whole
orchestration loop runs against a scripted stand-in. The ones worth knowing
about:

- **`tools.test.mts`** exercises the boundary against a real temporary
  directory with real symlinks: traversal, absolute paths, a link pointing out
  of the workspace, a sibling directory whose name starts with the root's, and
  a shell metacharacter in a check name.
- **`conductor.test.mts`** drives the QA rejection path — that the defects reach
  the retry prompt verbatim, that the run fails rather than passes when the
  author is out of attempts, and that a task depending on a failure is marked
  skipped instead of left pending.
- **`graph.test.mts`** covers the plans a model will eventually emit: a cycle,
  a dependency on a task nobody declared, a duplicate id.

`npm run lint` type-checks the repository, then this directory again under
`strict`.

---

## What it does not do

- **No checkpointing.** A run is one process; interrupt it and the plan is
  gone. Files already written stay written — run with `--apply` inside a clean
  git worktree so you can see exactly what changed.
- **No cost accounting.** A run makes many calls. On a `:free` model that costs
  nothing; on a paid one, watch it.
- **No concurrency limit.** A wide plan step calls the provider once per task
  at the same time, which can trip a rate limit. The chain handles the failure;
  it does not pace the requests.
- **QA judges, and can be wrong.** It is another model call. A passing verdict
  means a model read the diff and ran the type checker — worth a great deal
  more than nothing, and less than a person.
