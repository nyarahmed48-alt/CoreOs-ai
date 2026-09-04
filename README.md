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
lab/agents.ts         shared agent runtime — roster, charter, provider calls
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

## Languages

The site is **Arabic first**, with an English toggle in the nav. The choice is
remembered in `localStorage`, so it is a one-time press.

- `src/site/strings.ts` — every UI string, in both languages. One file, so the
  Arabic can be proofread in one sitting.
- `src/site/catalog.ts` — agent copy is bilingual inline, so adding an agent is
  still one edit in one place and the languages cannot drift apart.
- `src/site/i18n.tsx` — the provider. Sets `lang` and `dir` on `<html>`;
  `index.html` ships `lang="ar" dir="rtl"` so there is no flash of LTR before
  React mounts.

**Layout is direction-agnostic**: the site uses logical CSS properties (`ps-`,
`me-`, `start-`, `rounded-es-`) rather than physical ones, so RTL is a `dir`
flip rather than a second stylesheet. Chat bubbles carry `dir="auto"` so a
conversation can mix languages without punctuation jumping ends.

Brand names, agent codenames and monograms stay in Latin script — they are
names, and the codenames are the point of the testing programme. The manager
console at `/manager` is pinned `dir="ltr"`: it is an internal English tool and
was never laid out for RTL.

The visitor's language is sent to `/api/lab/chat` as `lang`, and the charter
tells the agent to answer in it — unless the visitor writes in a third
language, in which case the agent follows the visitor.

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
no provider configured the endpoint says so plainly rather than
pretending to answer.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
# optional: set a provider key in .env.local for live agent responses (see .env.example)
npm run dev     # http://localhost:3000
```

```bash
npm test           # the provider fallback chain, against a stand-in endpoint
npm run lint       # tsc --noEmit
npm run build      # vite build + bundle the Express server to dist/
npm run build:web  # vite build only — for Vercel / Netlify / static hosts
npm start          # serve the production build
```

## The AI behind CoreOS

Every agent — all 31 in the testing programme, plus the console's simulator and
instruction generator — goes through one function, `generateReply()` in
`lab/agents.ts`. Agents differ by persona brief and `temperature`, not by model.

Everything runs through **OpenRouter**: one key across many providers, one
bill, and models that are free to call. Which model serves the whole site is a
deployment setting rather than a code change, so switching is an environment
variable, not a release.

| Variable | |
| --- | --- |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | https://openrouter.ai/models — anything ending `:free` costs nothing |
| `OPENROUTER_SITE_URL` | optional; attribution header |
| `OPENROUTER_BASE_URL` | optional; point at a proxy or a stand-in endpoint |

Without them the site still runs and every page works; the agents reply saying
no key is configured.

OpenRouter speaks the OpenAI chat-completions shape, so the system prompt goes
in as the first message rather than its own field. It is called with `fetch` —
there is no provider SDK in the dependency list.

`OPENROUTER_MODEL` takes **one id or several, comma-separated and tried in
order**. This is the site's failover: free models carry a daily cap, and when
the sandbox hits one every agent goes silent at once. With a second id listed,
the site rides that out instead of going dark until somebody notices.

A model is skipped when it is over its cap, unknown or retired, unreachable, or
simply too slow to answer — anything except a rejected key, which fails
identically down the whole list and is reported straight away rather than
rediscovered five times. The whole chain runs against one budget, and each
attempt is capped at roughly half of what is left so a slow model cannot spend
the turn the next one needed. `/api/lab/health` reports *which position*
answered, so running on a backup can be told apart from running on the primary
while there is still a fallback left to lose.

`npm test` covers this end to end, since it is the part of the runtime whose
job is to behave well only when something else is behaving badly.

**`OPENROUTER_MODEL` has no default and is required.** Model ids on aggregators
get renamed and retired, and a stale hardcoded one fails as "model not found" —
an error that points nowhere near the cause. Being unconfigured and saying so is
better. Setting the key without the model logs what to do and leaves the agents
switched off.

## Deploying

The server honours `$PORT`, so it runs on any Node host with no extra config.

**Vercel or Netlify**: `vercel.json` and `netlify.toml` are both in the repo.
Import the repository on either platform and it picks up the build command, the
SPA rewrite, and the sandbox function (`api/lab/chat.ts` on Vercel,
`netlify/functions/lab-chat.ts` on Netlify). Add your provider key in the
project's environment variables.

**Render**: `render.yaml` is a blueprint — connect the repository at
render.com and set your provider key in the dashboard.

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
