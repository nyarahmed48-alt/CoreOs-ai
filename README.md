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

Every agent is published under a **CoreOs codename only**. The codename → engine
mapping, along with each agent's system instruction, lives in `LAB_ENGINES` in
`server.ts` and is never serialised to the browser. `GET /api/lab/agents` returns
slugs and display names and nothing else. This is deliberate: a familiar model
badge biases a tester's judgement of the answer.

**When adding an agent**, add its public copy to `src/site/catalog.ts` and its
private engine entry to `LAB_ENGINES` under the same slug. Keep engine names,
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
no `GEMINI_API_KEY` configured the endpoint returns a clearly-labelled canned
reply so the site still demonstrates the flow.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
# optional: set GEMINI_API_KEY in .env.local for live agent responses
npm run dev     # http://localhost:3000
```

```bash
npm run lint    # tsc --noEmit
npm run build   # vite build + bundle the server to dist/
npm start       # serve the production build
```
