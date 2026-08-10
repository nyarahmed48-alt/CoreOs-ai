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
lab/agents.ts         shared agent runtime — roster, charter, Claude calls
api/lab/chat.ts       Vercel serverless entry point for the sandbox
netlify/functions/    Netlify entry point for the sandbox
public/_redirects     SPA + function routing for Netlify
vercel.json           Vercel build + rewrite config
netlify.toml          Netlify build + redirect config
render.yaml           Render blueprint
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

Every agent is published under a **CoreOs codename only**. The codename → engine
mapping, along with each agent's system instruction, lives in `LAB_ENGINES` in
`lab/agents.ts` and is never serialised to the browser. `GET /api/lab/agents` returns
slugs and display names and nothing else. This is deliberate: a familiar model
badge biases a tester's judgement of the answer.

**When adding an agent**, add its public copy to `src/site/catalog.ts` and its
private engine entry to `LAB_ENGINES` in `lab/agents.ts` under the same slug —
every deployment target shares that one roster. Keep engine names,
provider names and system instructions out of anything the client receives —
including error messages, which is why `/api/lab/chat` returns a generic failure
string rather than the provider's.

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
no `ANTHROPIC_API_KEY` configured the endpoint says so plainly rather than
pretending to answer.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
# optional: set ANTHROPIC_API_KEY in .env.local for live agent responses
npm run dev     # http://localhost:3000
```

```bash
npm run lint       # tsc --noEmit
npm run build      # vite build + bundle the Express server to dist/
npm run build:web  # vite build only — for Vercel / Netlify / static hosts
npm start          # serve the production build
```

## The AI behind CoreOS

Every agent — all 31 in the testing programme, plus the console's simulator and
instruction generator — runs on **Claude Haiku 4.5** (`claude-haiku-4-5`)
through the official `@anthropic-ai/sdk`. Fast and inexpensive, which is what a
public sandbox anyone can hammer actually needs.

Agents differ by persona brief and `temperature`, not by model. Two API notes
for anyone changing the calls:

- **Haiku 4.5 accepts `temperature`.** Newer Claude models reject sampling
  parameters, so this does not port upward unchanged.
- **Do not send `output_config.effort`** — it errors on Haiku 4.5.

### The API key

Set `ANTHROPIC_API_KEY`, from https://console.anthropic.com — in `.env.local`
locally, or in the hosting provider's environment settings.

Anthropic is pay-as-you-go with no free tier, but Haiku is cheap: a sandbox
exchange costs a fraction of a cent. Without a key the site still runs and
every page works; the agents reply saying no key is configured.

## Deploying

The server honours `$PORT`, so it runs on any Node host with no extra config.

**Vercel or Netlify**: `vercel.json` and `netlify.toml` are both in the repo.
Import the repository on either platform and it picks up the build command, the
SPA rewrite, and the sandbox function (`api/lab/chat.ts` on Vercel,
`netlify/functions/lab-chat.ts` on Netlify). Add `ANTHROPIC_API_KEY` in the
project's environment variables.

**Render**: `render.yaml` is a blueprint — connect the repository at
render.com and set `ANTHROPIC_API_KEY` in the dashboard.

**Google Cloud Run**:

```bash
gcloud run deploy coreos --source . --region <region> --allow-unauthenticated
```

> **Static-only deploys.** Dragging the built `dist/` folder onto a host gives
> you the whole site *except* the agent sandbox — there is no function to answer
> `/api/lab/chat`, so the Test buttons say the sandbox isn't running on this
> deployment and point at the contact address. Deploy from Git instead if you
> want the agents live.

Note that `data/*.json` is written at runtime. On hosts with ephemeral disks
(Render's free plan, Cloud Run, serverless) those files reset — fine for the
seeded demo data, but move to a real database before relying on it.
