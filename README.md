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
| `/pos`        | The market till — a working point of sale (lazy-loaded, not in nav) |
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
  pos/
    PosApp.tsx        the till shell — four tabs, print stylesheet
    store.ts          all state, in localStorage, read through useSyncExternalStore
    types.ts          Product, Sale, Settings — the whole domain
    money.ts          IQD formatting and rounding to the nearest note
    seed.ts           the sample shop a new install opens on
    RegisterView.tsx  the till: shelf, basket, barcode scanning
    CheckoutModal.tsx payment, cash tendering and change
    ProductsView.tsx  products, prices, stock, categories
    SalesView.tsx     sales history and the end-of-day report
    SettingsView.tsx  shop details, till behaviour, backup
    Receipt.tsx       the 72mm receipt, on screen, on paper and as text
    ui.tsx            buttons, fields and the modal
```

## The owner's console (`CoreOS_Owner_Console.html`)

One file, kept on one phone, built by `npm run build:ceo`. **It is not on the
site and must not be put there** — no route, no link, nothing to stumble on.
It does two jobs:

- **Tablets.** Issues the unlock codes that let a till sell, for a week, a
  month, three months, a year or for ever, and keeps a list of what was issued
  to whom.
- **Apps.** Opens everything else — the till, the manager, the site, the demo
  shops, the planning papers — by absolute URL, since it has no site around it.

### How a tablet is let in

A till arrives locked. It shows a **request code** made from its own till
number and a part that changes every time it asks. The shop sends that code —
one WhatsApp button, or read down the phone — and the console turns it into an
**unlock code** that fits that request and no other. The till checks it
locally and starts working until the date runs out, at which point it locks,
**rotates its request code** and asks again. Rotating is what actually spends
a code: without it a shop would simply type last month's code back in for ever
and the expiry date would be decoration.

Nothing behind the lock is touched. A lapsed till still holds every sale and
product, and they come back the moment it is unlocked again.

### Checking in with the office

`src/pos/licenceServer.ts` is the other half of stopping a shop: when the
tablet can reach the network it asks whether it may still sell, so a freeze
lands without anyone picking up a phone. Three rules decide how it behaves,
and they are the whole design:

- **A shop that cannot reach us keeps selling.** The connection drops
  constantly in these shops; a till that stops when the wifi does is worse
  than no till, so an unanswered check changes nothing.
- **But not for ever.** Every answer carries a grace period. A tablet that has
  heard nothing for that many days locks itself — otherwise pulling the wifi
  out would be how a frozen till keeps working.
- **Answers are cached**, so a freeze survives a restart with no network, and
  so does permission.

`LICENCE_URL` is empty until the office has somewhere to run the service, and
with it empty the till behaves exactly as it does today: typed codes only.

### Stopping a shop

Two ways, and both need the shop on the other end of a phone, because nothing
reaches an offline tablet on its own.

- **Don't renew.** Issue short licences and the till locks itself on the date.
  The snowflake against a row in the register is a note to yourself not to
  issue another; the till is never told anything.
- **A stop code.** `F-XXXX-XXXX`, made for one tablet. Typed into the till —
  on the locked screen or in Settings → Licence — it locks that tablet at
  once, rotates the licence code so no old code works, and says plainly that
  CoreOs stopped it rather than letting the shop think the till broke.

**Two numbers, and which one each job takes.** A tablet's **till number**
(`3NR-LET`) never changes: it is on the help screen, on every support report,
and in the office's register. Its **licence code** (`3NR-LET-7K2Q`) is that
number plus a part that rotates every time the till asks for a licence.

Stopping a tablet takes **either** — the office is usually holding the till
number off a support report, and a stop code that first required the shop to
go and read a different number off a screen is a stop code nobody uses.
Letting a tablet sell takes the **full licence code**, because an unlock has
to be spendable: it is the rotation that stops last month's code opening the
till again.

A stop code they never type does nothing. That is the honest limit of an
offline licence, and the reason Settings also shows every till its own code
and expiry date: a shop that can see it is coming can ask before it happens,
and a till that locks mid-morning with no warning is a shop that cannot sell
and does not know why. The last three days carry a banner across the top.

**What this is worth, honestly.** The secret that makes the codes is compiled
into both files, so anyone willing to pull the app apart can mint their own.
It stops a shop copying the till onto a second tablet, or carrying on after
they stop paying. It does not stop an engineer — that needs the server, and
this is deliberately the same shape so the same codes can come from it later.
Keep a copy of the console file somewhere safe: without it, no new tablet can
be activated.

## The till (`/pos`)

A working point of sale for a market, not a demo: goods are rung up, stock
comes off the shelf, receipts are numbered and printed, and the day's takings
are counted.

**Everything lives in the browser.** Two `localStorage` keys — the shop file and
the open basket — read through `useSyncExternalStore`, so a second tab on the
same machine stays in step and a refresh mid-sale loses nothing. There is no
server and no account: a till has to keep ringing when the internet drops, and
one shop on one machine does not need one. `src/pos/store.ts` is the only file
that knows this; putting a backend behind it later means rewriting that file
and nothing else. The flip side is that the browser holds the only copy, so
Settings exports a JSON backup and restores one.

- **Money is whole dinars.** No decimals anywhere in the system, and totals
  round to the nearest 250 — the smallest note in ordinary circulation. The
  rounding shows as its own line on the receipt, and can be switched off.
- **Hand scanners are keyboards**, and that is the whole difficulty: the
  counter scanner types its digits into whatever field happens to have focus,
  so a cashier who has just corrected a quantity and then scans gets thirteen
  digits in the quantity box. `src/pos/wedge.ts` watches the keyboard itself
  and tells a scanner from a person by the one thing a person cannot fake —
  speed. Nothing types thirteen characters 30ms apart. Once a burst reads as a
  scan the keystrokes are taken off the page, and the two characters that
  reached a field before we could be sure are taken back out of it, through
  React's own value setter so its state does not keep them.

  It asks nothing of the device: Enter, Tab or no suffix at all all work, the
  last by waiting out the silence. It runs on every screen — selling on the
  till, searching on Products, filling the barcode in a product, checking
  itself in Settings — and is swallowed on the payment screen, where digits in
  the cash field would mean change handed back on a barcode.

- **A scan with no product behind it** is not an error to shrug at: it is
  usually a new line that arrived that morning, with a customer holding it. The
  till offers to take its name and price there and then, and puts it in the
  basket. Settings carries a scanner check — scan anything and it reports the
  code, the speed and the suffix — so a shop can tell a dead cable from a
  misconfigured device without calling anyone.
- **The camera scans too**, for the shops that have a phone before they have a
  scanner — with two readers behind it. The browser's own `BarcodeDetector`
  where it exists, and a decoder shipped inside the till where it does not.
  That fallback is not a nicety: `BarcodeDetector` is missing from Windows and
  Linux Chrome, from Firefox and from Safari, which is most shop counters, and
  a scanner that works on some machines is one nobody trusts. Both read on the
  device with nothing sent anywhere; the bundled one is loaded only when the
  camera is opened. The scanner stays open so a basket goes through in one
  pass, beeps on each read, and counts a repeat of the same code only once the
  packet has left the view — a timer instead of that rang up an extra tin
  every time a cashier held one still. The same button on a product captures
  its barcode.

  The camera still needs a browser willing to hand one over, and a phone will
  not hand one to a page opened from a file — it answers neither yes nor no,
  so the request hangs. The scanner gives up after seven seconds rather than
  waiting forever, and offers the route that does work there: **take a photo**,
  which goes through the phone's own camera app and needs no permission from
  the page. One photo, one barcode — slower than a live scan, faster than
  typing thirteen digits. For live scanning on a phone, serve the till over
  https.
- **Change is the number that matters.** Notes are tapped in as they are handed
  over — two 10,000s is two taps — and the change is the largest thing on the
  screen after the total.
- **Printing** hides the application rather than opening a second window, which
  these machines block. The receipt is laid out at 72mm, the width of the
  thermal rolls the shops already own; sharing falls back to a text file where
  the Web Share API is missing.
- **Corrections are voids.** A voided sale puts the goods back and leaves the
  takings, but keeps its receipt number, so the book has no holes. Products are
  archived rather than deleted, so old receipts still read correctly.

### Arabic, Kurdish and English

The till opens in **Arabic**, because most of these counters are in Baghdad and
a till that opens in English is a till somebody has to configure before they
can sell anything. **Kurdish (Sorani)** is one press away for Slemani and
Erbil, English for anyone else. The choice carries the receipts and the reports
with it, and it is in the header as well as Settings — a cashier who cannot
read the current language cannot be asked to find Settings to change it.

- `src/pos/i18n.ts` — every string, in all three. One file, so the Arabic and
  the Kurdish can be proofread in one sitting. The three tables are typed
  against each other, so a missing translation is a build error rather than an
  English word in the middle of an Arabic screen.
- **Right-to-left is a `dir` flip**, not a second set of screens: the till was
  written in logical properties (`ps-`, `me-`, `start-`, `text-start`)
  throughout.
- **Digits stay Latin** in all three. Iraqi price lists, shelf labels and bank
  notes are written that way, and a cashier reading ٧٥٠ off a screen against
  750 on the shelf is a mistake waiting to happen. The currency follows the
  language — `د.ع` beside Arabic and Kurdish, `IQD` in English — which also
  stops a right-to-left line reordering the price into "IQD 250".
- **Receipt dates are built by hand** rather than localised. Locale formatting
  puts invisible direction marks between the parts, which a right-to-left line
  reorders into nonsense and a thermal printer handles worse still.
- The **sample shelf is written in all three**, so a shop trying the till in
  Kurdish does not read its own demo stock in Arabic. It follows the language
  until the shop sells something or edits anything; after that the names are
  the shop's own and nothing rewrites them.

The till is not linked from the nav — it is opened directly on the shop's
machine — and it is a lazy chunk, so a visitor reading the website never
downloads it.

### Cashiers, and the drawer count

A shop with nobody on its staff list never sees a login: a one-person market
will not type a PIN to sell its own bread. Add a second person and the till
changes character.

- **PINs** are hashed with a salt apiece. Be clear what that buys: it stops a
  cashier reading a colleague's PIN off the screen or out of a backup file. It
  does not stop whoever holds that file, and it is not meant to — the point of
  the PIN is that the log can say who did a thing.
- **Voids and discounts cost an owner's PIN and a sentence.** Neither is wrong
  — a customer changes their mind, a box is dented — so the answer is not to
  forbid them but to make each one carry a name and a reason. The reason is the
  part an owner actually reads at the end of the week.
- **Signing in opens a shift** with whatever is in the drawer. Closing it asks
  for a count and shows it against what the till expected: float, plus cash
  taken, plus money collected against the book. That difference is the number
  this whole feature exists to produce.
- **Settings is owner-only**, so a cashier cannot quietly change a price.

Whoever adds the first owner is signed in on the spot — otherwise the till
bars them from the screen they are halfway through setting up.

### الدفتر — the book

Neighbourhood shops sell on credit and keep it in a notebook. This is the same
thing with the arithmetic done and every line stamped with who wrote it:
**On the book** is a payment method at checkout, it demands a name, and the
goods leave while the money does not.

It answers the three questions a shopkeeper asks — who owes me, how much, and
what have they paid — and nothing else. No accounts, no journals. Two
consequences worth knowing: a sale on the book is **not** in the day's
takings, because it was not taken; and money collected against a tab **is** in
the drawer count, because it is cash in hand.

### Supporting fifty shops

A shopkeeper cannot be asked to read a browser version down the phone, so the
till gathers it instead. Settings carries:

- **A till number** (`3NR-LET`), made on first run from characters that are
  hard to mishear. It is what a shop reads out when they call, and what their
  report arrives under.
- **Send report on WhatsApp** — the device, the build stamp, storage state,
  product and sale counts, and the last eight errors, which the till records
  for itself through a global error handler. Where no support number is set,
  or the browser blocks the hand-off, it falls back to the clipboard and then
  to a file, so the button never dead-ends on a counter.

The report is written in English whatever language the counter is worked in,
because a support desk reads it rather than the shop. It carries **no product
names, no prices, no customers and no takings** — counts and timings only, and
the panel shows the shop exactly what it is about to send. The one thing
support usually wants beyond it, the shop's own data, is the backup file
below, which the shop chooses to send.

`__POS_BUILD__` is stamped in at build time by both vite configs; without it a
desk cannot tell which of fifty tablets is running old code.

### The portable till

`CoreOS_Market_POS_Portable.html` is the same application as one file. Copy it
onto the shop's machine or a USB stick, double-click it, and the till opens —
no server, no install, no internet, and no requests off the machine at all.
Fonts are whatever the machine already has, for the same reason.

```
npm run build:pos     # rebuild the portable file after changing src/pos
```

The build is `vite.pos.config.ts` (one entry, one chunk, one stylesheet) plus
`scripts/build-portable-pos.mjs`, which inlines the script and the styles and
refuses to finish if anything is still pointing at a file on disk.

Each copy keeps its own books: the file is the program, and the shop's
products and sales live in that browser's storage on that machine. Moving a
shop to another machine is Settings → export, then restore on the other side.

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
