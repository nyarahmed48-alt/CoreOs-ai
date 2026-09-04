# The manager ledger

`migrations/` holds the schema behind the console at `/manager`: clients, the
owners who buy them, the customers underneath, and the chat sessions they
produce.

## Why the console needs a database

`server.ts` keeps all of it in `data/*.json` on local disk, which works for
`npm run dev` and nowhere else:

| Target | What happens to `data/*.json` |
| --- | --- |
| `npm run dev` (Express) | Works. This is the only place it does. |
| Cloudflare Workers | No filesystem at all — and this is what serves the site |
| Netlify / Vercel functions | Reset between invocations |
| Render free plan | Reset on every deploy and every idle spin-down |

The seven endpoints the console calls (`/api/clients`, `/api/owners`,
`/api/chats`, …) exist **only** in `server.ts`. The Worker answers all of them
with `{"error":"NOT_FOUND"}`. So `/manager` in production is a UI with nothing
behind it, and this schema is what the endpoints read once they are ported.

## Applying it

The project is `kaligixkamddjricpbps`. It is currently **paused** — Supabase
pauses free projects after inactivity, and nothing can be applied until it is
restored from the dashboard.

```bash
supabase link --project-ref kaligixkamddjricpbps
supabase db push
```

Or paste `migrations/20260904000000_manager_ledger.sql` into the SQL editor. It
is one transaction: it either all lands or none of it does.

To move the existing seed data across afterwards, `data/clients.json` maps
column-for-column — the ids (`client-1`, `owner-2`) are the primary keys, kept
as text on purpose so nothing has to be renumbered.

## Access, and why there are no policies

**Row Level Security is on for every table, and there is no policy granting
`anon` or `authenticated` anything.** In Postgres that is a deny, not an
oversight: RLS enabled with no matching policy means no row is readable and
none writable. Only the `service_role` key, which bypasses RLS, can reach this
data.

That is the right posture here rather than a placeholder, because the
application has **no Supabase Auth**. There are no end-user identities to scope
rows against, so there is no such thing as "the rows this signed-in user may
see". What there *is* is a publishable key that ships to every visitor by
design. A permissive policy — even `using (true)` limited to `authenticated` —
would put the whole client ledger, every system instruction and every recorded
conversation behind a key printed in the page source.

So the shape is: **the browser talks to the server, and the server talks to
Postgres with the service role.** The database is not a public API. The service
role key goes in the host's environment (`SUPABASE_SERVICE_ROLE_KEY`) next to
`OPENROUTER_API_KEY`, and never anywhere a build can inline it — in particular
never behind a `VITE_` prefix, which is the one naming mistake that publishes a
secret to `dist/` without any warning.

The grants are revoked as well as RLS being enabled. The two are tested
independently, and they catch different mistakes:

| | Result for `anon` |
| --- | --- |
| As shipped | `ERROR: permission denied for table clients` |
| If someone re-grants `select` but leaves RLS on | `0 rows` |

Either layer alone is enough; the second is there because "someone grants a
privilege back" and "someone disables RLS at the wrong prompt" are both things
that happen, and neither should be sufficient on its own.

### If per-owner login is added later

That is the seam. Give `owners` an `auth.users` reference, then write policies
of this shape and only then hand the browser a publishable key:

```sql
create policy owners_read_own on public.clients for select to authenticated
  using (id in (select linked_client_id from public.owners
                 where user_id = (select auth.uid())));
```

Note `(select auth.uid())` rather than a bare `auth.uid()` — called bare it is
re-evaluated once per row.

## What the schema is careful about

- **Text primary keys, not `uuid`.** The application already mints its own ids
  and `BusinessOwner.linkedClientId` points at a client by that string.
- **Every foreign key is indexed.** Postgres does not do this for you, and all
  four are followed on ordinary renders.
- **Deleting a client does not delete its owner** (`on delete set null`). An
  owner with no client is what a churned account looks like, and it should be
  visible rather than gone. Customers and chat sessions *do* cascade — they have
  no meaning without the client.
- **`chat_messages.created_at` is a real `timestamptz`.** The JSON store keeps
  `timestamp` as `toLocaleTimeString()` output — `"02:30 PM"`, no date, no
  timezone, and unsortable as text past twelve o'clock. That is a display string
  and belongs in the renderer; `ordinal` keeps same-transaction messages in the
  order they were said.
- **Check constraints mirror the unions in `src/types.ts`.** The type there also
  allows a bare `string` for `status`, which is how a typo becomes a status
  nobody filters on.
- **`ai_config` stays one `jsonb` column.** It is read and written whole, never
  queried field by field, and splitting it would mean a migration every time a
  provider adds a knob.

Verified against PostgreSQL 16 by applying the migration, importing the real
`data/clients.json`, and checking each of the above — including that `anon` is
refused and `service_role` is not.
