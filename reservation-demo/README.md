# Reservation demo

A self-contained reservation MVP: two single-file HTML pages, one shared
Supabase project. No build step, no `npm install` — open the files in a
browser or drop the folder on any static host.

| File | What it is |
| --- | --- |
| `booking.html` | Customer-facing booking form. Arabic (RTL) by default, with a toggle to English (LTR). |
| `admin.html` | Internal dashboard: live table of all reservations, updates in real time as bookings come in. Pinned English/LTR — it's a staff tool. |
| `schema.sql` | The Supabase table, Row Level Security policies, and Realtime setup. |

Each HTML file has its CSS and JS inlined — dark slate `#0F172A` theme with
gold/emerald accents, logical CSS so RTL just works.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (the free tier is enough for this demo).
2. Open **SQL Editor** in the dashboard, paste the contents of [`schema.sql`](./schema.sql), and run it. This creates the `reservations` table, enables Row Level Security, adds policies that let the anon key insert and read rows, and turns on Realtime for the table.
3. Open **Project Settings -> API** and copy the **Project URL** and the **anon / public key**.

## 2. Configure the app

There's no bundler here to inject `process.env.*` at build time, so each file
carries its own small config block instead. Open **both** `booking.html` and
`admin.html`, find the `<script>` block near the bottom (search for `TODO`),
and fill in:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";
```

Same two values in both files, since they talk to the same project. If you
later move this into a bundler-based app (Vite, Next.js, etc.), these map
directly to `VITE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` and their
`_ANON_KEY` counterparts — same two values, injected at build time instead of
hardcoded in the file.

The anon key is meant to be public (Supabase expects it in the browser); what
actually protects the table is the Row Level Security policies in
`schema.sql`, not the key being secret. Since the key lives in these files
once filled in, don't commit real project credentials to a public repo — keep
a local, unpushed copy for anything beyond a demo.

## 3. Run it

Open the files directly (`file://...`) — both talk to Supabase over HTTPS —
or serve the folder with any static file server:

```bash
cd reservation-demo
npx serve .
# or: python3 -m http.server 8080
```

Then open `booking.html` (customer form) and `admin.html` (operator
dashboard). Submit a booking on one and it shows up instantly on the other —
no refresh needed, via a Supabase Realtime subscription.

## Schema

```sql
create table public.reservations (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  reservation_date date not null,
  reservation_time time not null,
  guest_count      integer not null check (guest_count > 0 and guest_count <= 50),
  phone_number     text  -- optional, null when the guest skips it
);
```

## Notes on this being a demo

- **Access control**: `schema.sql` allows the anon key to both insert and
  select rows, which is what lets the dashboard load with no login. That's
  fine for a demo; a real deployment should require an authenticated "staff"
  role for `select` (and probably `delete`/`update`) instead of leaving the
  table world-readable to anyone holding the anon key.
- **No auth, no cancellation/editing flows, no double-booking checks** — this
  is intentionally the smallest slice that proves the booking → live
  dashboard loop end to end.
