# CoreOs Track

Business operations tracking — entries, statistics, watermarked receipts and an
admin-gated access list. Dark UI with purple accents (light theme included),
built with Next.js (App Router), Tailwind CSS v4, Prisma and PostgreSQL.

> Deliberately **not** included, per the build brief: no AI features or AI chat,
> and no document scanning / OCR verification.

---

## What it does

| Area | Behaviour |
| --- | --- |
| **Auth** | Email + password, bcrypt hashes, HS256 JWT in an httpOnly cookie. |
| **Approval gate** | Every sign-up lands as `pending` and is locked out of all app routes and data APIs until an admin approves it. |
| **Bootstrap admin** | `nyarahmed48@gmail.com` (override with `ADMIN_EMAIL`) is always repaired to `admin` + `approved` on seed, sign-up and sign-in, so access can never be lost. It also cannot be revoked or demoted through the UI/API. |
| **Entries** | Full CRUD, search + status/type filters, inline row editing with a Confirm/Cancel diff dialog, delete confirmation. |
| **Auto codes** | New entries get a unique `[2 letters][4 digits]` code (e.g. `XN1775`), retried on collision. |
| **Stats** | Totals, paid vs open, paused count and revenue-by-type bars, all normalised into your base currency. |
| **Receipts** | Live preview plus a server-rendered PDF with a faint tiled **VOID IF COPIED** watermark (8% opacity). Optional custom price and currency. |
| **Export** | CSV / JSON download of every entry. |
| **Security** | Admin dashboard: approve/deny pending requests, revoke or remove approved members. |
| **Settings** | Base-currency picker with search, plus a converter using built-in mid-market rates. |

---

## Setup

Requirements: **Node 20+** and a **PostgreSQL** database (local, Neon, Render,
Supabase — any Postgres URL works).

```bash
cd coreos-track
npm install
cp .env.example .env          # then edit the values (see below)
npm run db:migrate            # creates the tables
npm run db:seed               # bootstrap admin + demo entries (optional)
npm run dev                   # http://localhost:3000
```

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `AUTH_SECRET` | Signs session cookies. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_EMAIL` | Bootstrap admin address (default `nyarahmed48@gmail.com`). |
| `ADMIN_PASSWORD` | Password used when the bootstrap admin is created by the seed. |

### Using Supabase

Paste the Supabase connection string into `DATABASE_URL` and run
`npm run db:migrate`. The app talks to Postgres through Prisma only — no
Supabase client libraries or RLS policies are required.

### Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server. |
| `npm run build` / `npm start` | Production build / serve. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run db:migrate` | Create + apply a dev migration. |
| `npm run db:deploy` | Apply migrations in production. |
| `npm run db:seed` | Bootstrap admin + demo entries (idempotent). |
| `npm run db:studio` | Prisma Studio. |

Deploying: set the four env vars, run `npm run db:deploy` during release, then
`npm run build && npm start`. Any Node host works (Vercel, Render, Fly, a
container); the PDF route needs the Node runtime, which it declares itself.

---

## Folder structure

```
coreos-track/
├── prisma/
│   ├── schema.prisma          # users + entries models
│   ├── migrations/            # generated SQL migrations
│   └── seed.ts                # bootstrap admin + demo entries
├── src/
│   ├── middleware.ts          # signed-in check + auth-page redirects
│   ├── app/
│   │   ├── layout.tsx         # root shell, theme bootstrap
│   │   ├── globals.css        # design tokens + shared utilities
│   │   ├── login/ register/   # auth screens
│   │   ├── pending/           # approval-gate screen
│   │   ├── (app)/             # signed-in shell (sidebar + top bar)
│   │   │   ├── entries/       # table, filters, inline editing
│   │   │   ├── stats/         # totals + revenue by type
│   │   │   ├── receipt/       # receipt builder + preview
│   │   │   ├── export/        # CSV / JSON export
│   │   │   ├── security/      # admin access dashboard
│   │   │   └── settings/      # currency + converter
│   │   └── api/
│   │       ├── auth/          # register, login, logout
│   │       ├── entries/       # list, create, update, delete, PDF
│   │       └── admin/users/   # approve, deny, revoke, remove
│   ├── components/            # client UI (tables, modals, panels)
│   ├── lib/
│   │   ├── auth.ts            # hashing, sessions, bootstrap admin
│   │   ├── jwt.ts             # edge-safe token helpers
│   │   ├── db.ts              # Prisma singleton
│   │   ├── codes.ts           # [2 letters][4 digits] generator
│   │   ├── currency.ts        # rates, conversion, formatting
│   │   ├── entries.ts         # Prisma → JSON serialisation
│   │   └── validation.ts      # zod schemas + status list
│   └── pdf/
│       ├── ReceiptDocument.tsx  # @react-pdf/renderer layout + watermark
│       └── render.tsx           # renders a receipt to a Buffer
```

---

## Data model

`users` — `id (uuid)`, `email (unique)`, `password_hash`, `role (admin|member)`,
`status (pending|approved|denied)`, `created_at`, `updated_at`.

`entries` — `id (uuid)`, `code (unique, indexed)`, `name`, `type`,
`amount (numeric 14,2)`, `currency`, `status`, `date`, `due_date?`, `notes?`,
`link_url?`, `created_by → users.id`, `created_at`, `updated_at`.

`currency` is an addition to the brief's column list: entry amounts are stored in
their own currency (matching the reference UI's `ع.د 1,000 ≈ $ 0.76` display)
while every total is converted into the viewer's base currency.

---

## API

All routes require a session; data routes additionally require `status=approved`,
and `/api/admin/*` requires `role=admin`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Sign up (lands as `pending`). |
| `POST` | `/api/auth/login` | Sign in. |
| `POST` | `/api/auth/logout` | Clear the session. |
| `GET` | `/api/entries?q=&status=&type=` | List entries. |
| `POST` | `/api/entries` | Create (code auto-generated when omitted). |
| `GET/PATCH/DELETE` | `/api/entries/:id` | Read / partial update / delete. |
| `GET` | `/api/entries/:id/pdf?amount=&currency=&inline=1` | Watermarked receipt PDF. |
| `GET` | `/api/admin/users` | Pending + approved accounts. |
| `PATCH/DELETE` | `/api/admin/users/:id` | Approve, deny, revoke / remove. |

### Security notes

- The session cookie carries **identity only**. Role and status are read from the
  database on every request, so approving or revoking a member takes effect on
  their very next navigation — no sign-out required.
- `middleware.ts` blocks signed-out traffic; the app layout, the `/pending`
  screen and each route handler enforce approval and admin rights against the
  database.
- Passwords are bcrypt-hashed (10 rounds) and never leave the server.

### Watermark

`src/pdf/ReceiptDocument.tsx` tiles `VOID IF COPIED` diagonally (-30°) behind
the content at `WATERMARK_OPACITY = 0.08`. Both constants sit at the top of the
file; keep the opacity in the 0.05–0.10 range so the mark stays visible without
obscuring amounts, codes or transaction text. The on-screen preview in
`ReceiptStudio.tsx` mirrors the same phrase and opacity.
