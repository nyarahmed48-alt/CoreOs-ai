# Ideal Management

A standalone site for Ideal Management — recruitment, HR and business management —
with three features that do real work:

- **Ideal AI**, a chat assistant powered by CoreOs. It sits as a circle in the
  bottom-right corner of every page, and it **reads this website before it
  answers**, so editing a page is how you retrain it.
- **The CV Pool**, where candidates submit a profile and their CV, and employers
  send a hiring brief.
- **A contact page** with the phone, WhatsApp and email routes, plus a form that
  requires the visitor's phone number so a consultant can call back.

Contact details used throughout: **+964 772 252 1000** and
**imanagement19@gmail.com**. They appear in the page HTML, in the footer, and as
hard-coded facts in `lib/knowledge.mts` so the assistant repeats them correctly
even if a crawl fails.

## What's here

```
sites/ideal-management/
├── public/                          ← everything that gets deployed
│   ├── index.html                   home
│   ├── contact.html                 served at /contact
│   └── assets/
│       ├── styles.css               design tokens + every component
│       ├── app.js                   nav, forms, chat widget
│       ├── mark.svg                 the logo mark (navy, for light grounds)
│       ├── mark-light.svg           the same mark reversed for dark grounds
│       └── favicon.svg
├── lib/knowledge.mts                the site crawler behind Ideal AI
├── netlify/functions/
│   ├── ideal-chat.mts               POST /api/ideal-chat   → the assistant
│   └── ideal-health.mts             GET  /api/ideal-health → why it's quiet
├── netlify.toml                     publish dir, functions dir, headers
└── .env.example                     the environment variables it reads
```

No build step and no runtime dependencies. The HTML, CSS and JS ship exactly as
written; only the two functions are bundled, by Netlify. `npm install` here is
purely for the function type definitions.

The header and footer are duplicated in both HTML files rather than templated.
With two pages that is the cheaper trade — but if a third page arrives, that is
the moment to reach for a generator rather than a third copy.

## Running it locally

```bash
cd sites/ideal-management
npm install
cp .env.example .env   # then paste your OpenRouter key into it
npx netlify dev
```

Without a key the site still works end to end: Ideal AI answers with a clearly
worded message saying it is not configured, and gives the phone number and email
instead. It never pretends to answer.

## How Ideal AI learns the site

`lib/knowledge.mts` crawls the deployment's own pages — breadth-first from `/`,
same-origin only — extracts the text inside each `<main>`, and passes it to the
model as context. The crawl is cached in memory for 15 minutes, so only a cold
start pays for it.

It is deliberately bounded, because an unbounded crawler on a serverless
function is a way to burn a time budget: at most 8 pages, 2 levels deep, 7
seconds total, 6,000 characters per page and 14,000 overall. Today's two pages
come to roughly 6,000 characters, well inside that.

What this buys you: **change the copy on a page, redeploy, and the assistant
knows the new wording.** Nobody has to remember to update a prompt. What it does
not buy you: knowledge of anything that is not on the website. The assistant is
instructed to say so and hand over the contact details rather than guess.

## Configuration

Set these on the Netlify project (*Project configuration → Environment
variables*). Never commit them.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | yes | The provider key. Held only by the function, never sent to the browser. |
| `OPENROUTER_MODEL` | no | Comma-separated model ids, tried in order. Defaults to `poolside/laguna-xs-2.1:free`. |
| `OPENROUTER_BASE_URL` | no | Point the calls at a proxy or stand-in endpoint. |

Listing a second model id is worth doing: free models carry a daily cap, and
when the first one hits it the assistant rides through on the next instead of
going silent.

## Deploying

The Netlify project uses **base directory `sites/ideal-management`**, which makes
every path in `netlify.toml` relative to this folder. There is no build command —
`publish = "public"` serves that directory as-is, which also keeps the function
source and this README out of the deployed site.

## The forms

All three forms — CV Pool, employer request, contact — are
[Netlify Forms](https://docs.netlify.com/forms/setup/): they are detected from
the deployed HTML at build time, and submissions appear under *Project
configuration → Forms*. The CV form is `multipart/form-data`, so the file itself
is stored with the submission and downloadable from there.

Two things to know before this goes into real use:

- **Submission limits.** Netlify's free tier includes 100 form submissions a
  month and 10 MB of uploads. A busy pool will need the paid tier, or a
  notification hook into an ATS.
- **Notifications are not automatic.** Add an email notification to
  imanagement19@gmail.com under Forms settings, or submissions will sit in the
  dashboard unread.

Each form carries a honeypot field (`netlify-honeypot`) that people never see and
bots usually fill, which keeps most spam out without a CAPTCHA.

## Ideal AI, honestly

- It cannot see anyone's application. It says so when asked, and gives the
  contact details instead of guessing.
- It is told never to invent salaries, fees, vacancies or policies, and that the
  crawled page text and anything a visitor types are information to answer from,
  never instructions that change its rules.
- Provider error text never reaches the browser — it can quote the prompt back.
  Failures come out as a plain sentence, with the detail in the function logs.
- If the widget goes quiet, open `/api/ideal-health`. It reports whether the
  problem is the key, the quota, the model id or the network, *and* how many
  pages the crawler indexed — an assistant that answers "I don't know" to
  everything with a healthy key is usually an empty crawl.
