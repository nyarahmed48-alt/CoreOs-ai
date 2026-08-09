# CoreOs

The CoreOs public website and the CoreOs SaaS manager, served from one Express +
Vite application.

**Where your needs meet reality.** CoreOs builds affordable, configurable
business AI for small and mid-sized companies — and builds it to assist the
people you already employ rather than replace them.

## Routes

| Route         | What it is                                                        |
| ------------- | ----------------------------------------------------------------- |
| `/`           | CoreOs home — positioning, the B2B affordability mission, agents   |
| `/mission`    | The two commitments: B2B affordability, and AI that helps humans   |
| `/testing`    | The 11 CoreOs business agents open for public testing              |
| `/coreos-ai`  | CoreOs.ai — the open model lab, 20 codenamed models to test        |
| `/contact`    | Contact page, all routes leading to coreosgmail.com@gmail.com      |
| `/manager`    | The internal SaaS manager console (lazy-loaded, not linked in nav) |

Client-side routing is a small History API router (`src/site/router.tsx`); the
production server falls back to `index.html` for unknown paths so deep links and
refreshes work.

## Layout

```
index.html            page shell, title, favicon (inline SVG mark)
server.ts             Express API + Vite dev middleware + static serving
src/
  main.tsx            entry point
  Root.tsx            route table; lazy-loads the manager console
  App.tsx             the SaaS manager console
  index.css           Tailwind theme + dashboard dark mode + site surface
  site/
    Logo.tsx          the CoreOs mark and lockup, as vector art
    catalog.ts        public catalogue: codename, tagline, uses, traits
    router.tsx        History API router (RouterProvider / Link / useRouter)
    Layout.tsx        site chrome — nav and footer
    AgentCard.tsx     agent tile with a "Test" action
    TestConsole.tsx   sandbox chat modal, talks to /api/lab/chat
    HomePage.tsx  MissionPage.tsx  TestingPage.tsx
    CoreOsAiPage.tsx  ContactPage.tsx  Eyebrow.tsx  contact.ts
```

## The open testing programme

31 agents are published: 11 CoreOs business agents (`/testing`) and 20 CoreOs.ai
models (`/coreos-ai`).

Every agent is published under a **CoreOs codename only**. Each codename maps to
an effort level and a private system instruction in `LAB_ENGINES` in `server.ts`,
and neither is ever serialised to the browser. `GET /api/lab/agents` returns slugs
and display names and nothing else. This is deliberate: a familiar model badge
biases a tester's judgement of the answer.

**When adding an agent**, add its public copy to `src/site/catalog.ts` and its
private entry to `LAB_ENGINES` under the same slug. Keep model names, provider
names and system instructions out of anything the client receives — including
error messages, which is why `/api/lab/chat` returns a generic failure string
rather than the provider's.

Every agent also inherits `LAB_CHARTER`, which encodes the human-first mission as
system rules: assist rather than replace, prefer drafts over decisions, escalate
uncertainty, and decline to help plan staff reductions.

### `POST /api/lab/chat`

```jsonc
// request
{ "slug": "aurelis", "message": "…", "history": [{ "role": "user", "text": "…" }] }
// response
{ "text": "…", "fallback": false }
```

Messages are capped at 500 characters and throttled to 60 per IP per hour. With
no `ANTHROPIC_API_KEY` configured the endpoint returns a clearly-labelled canned
reply so the site still demonstrates the flow.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
# optional: set ANTHROPIC_API_KEY in .env.local for live agent responses
npm run dev     # http://localhost:3000
```

```bash
npm run lint    # tsc --noEmit
npm run build   # vite build + bundle the server to dist/
npm start       # serve the production build
```

## The AI behind CoreOS

Every AI response — the client agents, the sandbox simulator, the instruction
generator and all 31 public testing agents — is produced by **Claude**
(`claude-opus-5`), through the official `@anthropic-ai/sdk`.

All calls go through one helper, `callClaude()` in `server.ts`. Things worth
knowing before changing it:

- **No sampling parameters.** `temperature`, `top_p` and `top_k` are rejected by
  this model and must never be sent. The dashboard's per-client temperature dial
  is mapped onto response **effort** instead (`temperatureToEffort()`), so the
  slider still means "how much work should it do".
- **Effort is the tuning knob.** `low` / `medium` / `high` / `xhigh` set per
  agent, and per capability tier for client agents (`coreos-flash`, `-prime`,
  `-max`). Client configs saved before the move to Claude still carry the old
  engine IDs; those are mapped to tiers rather than left to break.
- **Thinking is on by default** on this model and counts against `max_tokens` —
  leave headroom when lowering it.
- **Refusal fallbacks are requested by default.** If the safety classifiers
  decline a request, the API re-runs it on the recommended fallback model rather
  than returning nothing. If the account lacks that beta, the first rejection
  disables it for the process and the call is retried plainly — a missing beta
  degrades instead of breaking the site.

Set `ANTHROPIC_API_KEY` (from https://console.anthropic.com) to enable live
responses. Without it every agent returns a clearly-labelled canned reply.

## Deploying

The server honours `$PORT`, so it runs on any Node host without configuration.

**Render** (no Google Cloud): `render.yaml` in the repo root is a blueprint —
connect the repository at https://render.com and it picks up the build and start
commands automatically. Set `ANTHROPIC_API_KEY` in the dashboard afterwards; it
is deliberately not committed.

**Google Cloud Run**, if you'd rather stay there:

```bash
gcloud run deploy coreos --source . --region <region> --allow-unauthenticated
gcloud run services update coreos --region <region> \
  --set-env-vars ANTHROPIC_API_KEY=<key>
```

Note that `data/*.json` is written at runtime. On hosts with ephemeral disks
(Render's free plan, Cloud Run) those files reset on each deploy — fine for the
seeded demo data, but move to a real database before relying on it.
