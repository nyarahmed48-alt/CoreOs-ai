# Reservation demo

A self-contained, no-build reservation MVP: a customer booking page and an
operator dashboard, both talking directly to a shared Supabase project. Plain
HTML/CSS/JS — no `npm install`, no bundler — open the files in a browser or
drop the folder on any static host.

| File | What it is |
| --- | --- |
| `index.html` + `booking.js` | Customer-facing booking form. Arabic (RTL) by default, with a toggle to English (LTR). |
| `admin.html` + `admin.js` | Internal dashboard: live table of all reservations, updates in real time as bookings come in. Pinned English/LTR — it's a staff tool. |
| `styles.css` | Shared dark theme (deep slate `#0F172A` background, gold + emerald accents). |
| `schema.sql` | The Supabase table, Row Level Security policies, and Realtime setup. |
| `config.example.js` | Template for your Supabase credentials — copy to `config.js`. |

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (the free tier is enough for this demo).
2. Open **SQL Editor** in the dashboard, paste the contents of [`schema.sql`](./schema.sql), and run it. This creates the `reservations` table, enables Row Level Security, adds policies that let the anon key insert and read rows, and turns on Realtime for the table.
3. Open **Project Settings -> API** and copy the **Project URL** and the **anon / public key**.

## 2. Configure the app

This is a plain static site with no build step, so there's no bundler to inject
`process.env.*` at build time. The equivalent here is a small config file the
browser loads directly:

```bash
cp reservation-demo/config.example.js reservation-demo/config.js
```

Edit `reservation-demo/config.js`:

```js
window.SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";
```

`config.js` is gitignored — it's never committed, so each deployment points at
its own Supabase project. If you later move this into a bundler-based app
(Vite, Next.js, etc.), these map directly to `VITE_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_URL` and their `_ANON_KEY` counterparts — same two
values, just injected at build time instead of loaded as a script tag.

The anon key is meant to be public (Supabase expects it in the browser); what
actually protects the table is the Row Level Security policies in
`schema.sql`, not the key being secret.

## 3. Run it

Any static file server works — for example:

```bash
cd reservation-demo
npx serve .
# or: python3 -m http.server 8080
```

Then open:

- `http://localhost:.../index.html` — the customer booking form
- `http://localhost:.../admin.html` — the operator dashboard

Opening the files directly via `file://` also works, since everything talks
to Supabase over HTTPS from the browser.

Submit a booking on `index.html` and it shows up instantly on `admin.html` —
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
