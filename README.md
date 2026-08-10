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
| —             | Mail arriving there is triaged and answered by the inbox responder |
| `/manager`    | The internal SaaS manager console (lazy-loaded, not linked in nav) |

Client-side routing is a small History API router (`src/site/router.tsx`); the
production server falls back to `index.html` for unknown paths so deep links and
refreshes work.

## Layout

```
index.html            page shell, title, favicon (inline SVG mark)
server.ts             Express API + Vite dev middleware + static serving
lab/agents.ts         shared agent runtime — roster, charter, provider calls
lab/gmail.ts          small Gmail REST client, fetch only, no SDK
lab/inbox.ts          the inbox responder — triage, drafting, hold, notify
api/lab/chat.ts       Vercel serverless entry point for the sandbox
api/inbox/            Vercel entry points for the responder
netlify/functions/    Netlify entry points (the responder's scan is scheduled)
scripts/              one-shot tooling: Gmail auth, manual scan, self-test
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
no provider configured the endpoint says so plainly rather than
pretending to answer.

## The inbox responder

People who fill in the form at `/contact` end up sending an ordinary email to
`coreosgmail.com@gmail.com`. The responder answers the routine ones for you —
and tells you before it does, every time.

**It never sends anything you haven't seen first.** When it decides a message
can be answered, it writes the reply, saves it as a real Gmail draft on the
thread, and emails you what is about to go out. Then it waits
`INBOX_HOLD_MINUTES` (20 by default). If the draft is still there when the
window closes, it sends. Three ways to stop it, all of which work from a phone:

- click **Stop it** in the notification
- delete the draft in Gmail — a missing draft is read as a cancellation
- label the thread `CoreOs-Auto/Off` and it is left alone for good

There is no database. Gmail's own drafts and labels are the state, which is
what makes the hold window survive the site running on serverless hosts with no
disk — and means you can inspect and change everything from any mail client.

### What it will and won't answer

Two gates, cheap one first. A deterministic filter drops anything a machine
wrote — `List-Unsubscribe`, `Auto-Submitted`, `Precedence: bulk`, no-reply and
mailer-daemon addresses, bulk-mail domains, delivery failures, anything blasted
to more than five recipients. Those never reach the model, so they cost
nothing. Then the model classifies what's left.

| Answered automatically | Always left for you |
| --- | --- |
| general enquiry, capability question, setup request, pricing, testing feedback | complaints, legal, invoices and refunds, partnerships, recruitment, existing-customer matters, security reports, sales pitches, personal mail, anything unclear |

Anything the classifier is less than 60% sure about goes in the right-hand
column too. Uncertainty is a reason to hand it over, not to guess.

The draft is written under stricter rules than the sandbox agents get, because
it goes out under the company's name to a stranger: **no prices, no dates, no
commitments, no invented facts**, and instructions inside the incoming email
are ignored rather than followed. That last one matters — the email is data
being processed, not a brief. A regex check runs over the finished draft as a
backstop and holds back anything quoting a figure, offering a discount,
promising, or committing to a deadline, however it got there.

Every auto-reply says plainly that it was drafted automatically and that a
person has been notified. Ceilings: 20 sends a rolling day, and never twice to
the same person inside a week.

### Labels it uses

| Label | Meaning |
| --- | --- |
| `CoreOs-Auto/Pending` | drafted and announced, sending shortly |
| `CoreOs-Auto/Replied` | an auto-reply went out |
| `CoreOs-Auto/Needs-You` | deliberately not answered — your pile |
| `CoreOs-Auto/Ignored` | a machine wrote it |
| `CoreOs-Auto/Off` | **you** apply this; the responder never touches the thread |

### Setting it up

It stays completely switched off until the three Google variables are set, so
the rest of the site is unaffected until you finish this.

1. **A Google OAuth client.** At
   [console.cloud.google.com](https://console.cloud.google.com/): make a
   project, enable the **Gmail API**, set the OAuth consent screen to
   **External**, then create credentials → **OAuth client ID** → **Desktop
   app**. Put the id and secret in `.env.local`.

   **Publish the app** — Audience → *Publish app* → "In production". This is
   not optional: while the consent screen sits in **Testing**, Google revokes
   the refresh token after **7 days** and the responder stops with an
   `invalid_grant`. Publishing without verification is fine for your own
   mailbox; you'll see an "unverified app" warning at the consent screen and
   Advanced → Continue is the expected path.

   The scope is `gmail.modify` — read, label, draft and send, but never
   permanently delete.

2. **A refresh token**, granted once for the mailbox being answered:

   ```bash
   npm run inbox:auth
   ```

   It opens Google's consent screen, catches the redirect, and prints
   `GOOGLE_REFRESH_TOKEN`. Nothing is written to disk — treat it like a
   password, and revoke it at
   [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
   if it leaks.

   That flow needs the browser and the terminal on one machine. When they are
   not — approving from a phone, running the script on a server — use:

   ```bash
   npm run inbox:auth -- --manual
   ```

   It prints the URL, you approve it anywhere, and the browser then fails to
   load a `localhost` page. That failure is expected and harmless: the
   authorization code is in the address bar. Copy the whole URL, paste it back,
   and the exchange happens server-to-server.

3. **A secret for the one-click links**: `openssl rand -hex 32` into
   `INBOX_ACTION_SECRET`. Without it the notification still arrives, just
   without buttons.

4. **Set them on the host.** On Netlify: Site configuration → Environment
   variables. The full list is in `.env.example`.

Watch it work before trusting it. With `INBOX_AUTOSEND=false` it drafts and
notifies but never sends on its own — a drafting assistant rather than an
auto-responder:

```bash
npm run inbox:test   # the full self-test, against a fake Gmail and a fake model
npm run inbox:scan   # one real cycle, printed to the terminal
```

### How it runs on a schedule

On **Netlify**, `netlify/functions/inbox-scan.ts` declares
`config.schedule = "*/10 * * * *"` and Netlify registers the cron at deploy
time. Nothing else to configure. Netlify does not expose scheduled functions
over HTTP in production, so the cron is their only trigger — which is also why
`inbox-scan` has no redirect in `netlify.toml` while `inbox-action` does.

On **Vercel**, the schedule is the `crons` entry in `vercel.json` (hourly —
Hobby projects are capped at daily, so change it if you are on that plan).

On **a long-lived server** (Render, Cloud Run) there is no built-in scheduler:
point any external cron at `POST /api/inbox/scan` with `INBOX_SCAN_SECRET` in
an `X-Inbox-Secret` header. Without that variable set the route only answers
localhost, so a half-configured deployment fails closed.

How often it runs decides how quickly a new enquiry gets noticed;
`INBOX_HOLD_MINUTES` decides how long you have to intervene. They are separate
knobs on purpose.

### Endpoints

| | |
| --- | --- |
| `GET /api/inbox/status` | what's configured, what's pending, what's waiting on you |
| `POST /api/inbox/scan` | run one cycle (secret required off localhost) |
| `GET /api/inbox/action` | backs the Stop it / Send now links; HMAC-signed |

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
# optional: set a provider key in .env.local for live agent responses (see .env.example)
npm run dev     # http://localhost:3000
```

```bash
npm run lint       # tsc --noEmit
npm run build      # vite build + bundle the Express server to dist/
npm run build:web  # vite build only — for Vercel / Netlify / static hosts
npm start          # serve the production build

npm run inbox:test # the responder's self-test — no real mailbox involved
npm run inbox:auth # mint a Gmail refresh token (once, on your own machine)
npm run inbox:scan # run one inbox cycle and print what it decided
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
