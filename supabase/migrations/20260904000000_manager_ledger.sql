-- The manager console's ledger: clients, the owners who buy them, the
-- customers underneath, and the chat sessions they produce.
--
-- WHY THIS EXISTS
--
-- server.ts keeps all of this in data/*.json on local disk. That works for
-- `npm run dev` and nowhere else. The site is served by a Cloudflare Worker,
-- which has no filesystem at all, and every other target the repo carries
-- (Netlify, Vercel, Render's free plan) resets its disk between invocations.
-- So the console at /manager is, in production, a UI with nothing behind it:
-- its seven endpoints are served only by Express, and the Worker answers them
-- with {"error":"NOT_FOUND"}.
--
-- This schema is what those endpoints read instead.
--
-- ON THE PRIMARY KEYS
--
-- Text, not uuid, and deliberately. The application already mints its own ids
-- ("client-1", "owner-2", "session-k3f9a2b1x-1730900000000") and BusinessOwner
-- points at a client by that string. Swapping in uuids would mean rewriting id
-- generation, rewriting every stored reference, and migrating data that is
-- currently readable by eye. The ids are unique and stable; that is the whole
-- job of a key.

begin;

-- Keeps updated_at honest without every caller having to remember it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================== clients ===
-- The AI deployments themselves. aiConfig stays a single jsonb column: it is
-- read and written whole by the console, never queried field by field, and
-- splitting it into columns would mean a migration every time a provider adds
-- a knob.

create table public.clients (
  id            text primary key,
  name          text        not null,
  description   text        not null default '',
  website_url   text,
  logo_url      text,
  status        text        not null default 'configuring',
  needs         text        not null default '',
  ai_config     jsonb       not null default '{}'::jsonb,
  char_limit    integer,
  monitored_chars text,
  limit_type    text,
  language      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Mirrors the union in src/types.ts. The type there also allows a bare
  -- string, which is how a typo becomes a status nobody filters on.
  constraint clients_status_valid
    check (status in ('active', 'configuring', 'paused', 'deactivated')),
  constraint clients_limit_type_valid
    check (limit_type is null or limit_type in ('all', 'specific')),
  constraint clients_char_limit_positive
    check (char_limit is null or char_limit > 0)
);

comment on column public.clients.ai_config is
  'The AIConfig object from src/types.ts: model, systemInstruction, temperature, topP, safetySettings, customVariables.';

create index clients_status_idx     on public.clients (status);
create index clients_created_at_idx on public.clients (created_at desc);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();


-- ============================================================== owners ====
-- The business owner who bought a client deployment.
--
-- linked_client_id is ON DELETE SET NULL rather than CASCADE: deleting a
-- deployment must not silently delete the record of who was paying for it.
-- An owner with no client is a real state — it is what a churned account looks
-- like — and it should be visible rather than gone.

create table public.owners (
  id               text primary key,
  name             text        not null,
  company_name     text        not null default '',
  email            text        not null,
  linked_client_id text        references public.clients (id) on delete set null,
  plan             text        not null default 'standard',
  status           text        not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint owners_plan_valid   check (plan in ('standard', 'growth', 'enterprise')),
  constraint owners_status_valid check (status in ('active', 'suspended')),
  constraint owners_email_shaped check (position('@' in email) > 1)
);

-- One account per address. If importing the existing owners.json trips this,
-- that is a duplicate worth knowing about rather than routing around: two rows
-- for one address means two places to suspend an account and one of them gets
-- missed.
create unique index owners_email_key on public.owners (lower(email));

-- Postgres does not index a foreign key for you, and this one is followed on
-- every render of the owners table.
create index owners_linked_client_id_idx on public.owners (linked_client_id);

create trigger owners_set_updated_at
  before update on public.owners
  for each row execute function public.set_updated_at();


-- ============================================================ customers ===
-- Nested inside Client as `customers?: Customer[]` in src/types.ts, and empty
-- in the seed data. A table rather than more jsonb because these carry usage
-- counters — sentences_used against sentence_limit — and a counter you cannot
-- increment without rewriting the whole parent document is a counter that will
-- eventually be wrong under two concurrent writes.

create table public.customers (
  id                     text primary key,
  client_id              text        not null references public.clients (id) on delete cascade,
  name                   text        not null,
  email                  text        not null,
  sentences_used         integer     not null default 0,
  sentence_limit         integer     not null default 70,
  char_limit_per_sentence integer    not null default 115,
  status                 text        not null default 'active',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint customers_status_valid check (status in ('active', 'suspended')),
  constraint customers_counts_sane  check (
    sentences_used >= 0
    and sentence_limit > 0
    and char_limit_per_sentence > 0
  )
);

create index customers_client_id_idx on public.customers (client_id);
create unique index customers_client_email_key on public.customers (client_id, lower(email));

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();


-- ======================================================= chat_sessions ====
-- The audit ledger the console calls "session history". server.ts groups
-- messages into a session when the same client and channel speak again within
-- fifteen minutes, and keeps the fifty most recent.

create table public.chat_sessions (
  id          text primary key,
  client_id   text        not null references public.clients (id) on delete cascade,
  -- Denormalised on purpose: the ledger should still read correctly after the
  -- client is renamed, because it records what happened at the time.
  client_name text        not null default '',
  model_used  text,
  channel     text        not null default 'web',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index chat_sessions_client_id_idx  on public.chat_sessions (client_id);
-- The console lists sessions newest-first and finds the open one by
-- (client, channel, recency). Both are this index.
create index chat_sessions_recent_idx     on public.chat_sessions (updated_at desc);
create index chat_sessions_client_channel_idx
  on public.chat_sessions (client_id, channel, updated_at desc);


-- ======================================================= chat_messages ====
-- Note created_at is a real timestamptz. The JSON store keeps `timestamp` as
-- the output of toLocaleTimeString() — "02:30 PM", no date, no timezone, and
-- unsortable as text past twelve o'clock. That is a display string and belongs
-- in the renderer; the ordering fact belongs here. `ordinal` keeps two messages
-- written in the same transaction in the order they were said.

create table public.chat_messages (
  id         text primary key,
  session_id text        not null references public.chat_sessions (id) on delete cascade,
  sender     text        not null,
  body       text        not null,
  ordinal    integer     not null,
  created_at timestamptz not null default now(),

  constraint chat_messages_sender_valid check (sender in ('user', 'assistant', 'system')),
  constraint chat_messages_ordinal_sane check (ordinal >= 0)
);

-- Every read of a session is "its messages, in order", so make that one index.
create unique index chat_messages_session_ordinal_key
  on public.chat_messages (session_id, ordinal);


-- ================================================================ RLS ====
--
-- Enabled on every table, with NO policy granting anon or authenticated
-- anything. In Postgres that is a deny: RLS on with no matching policy means
-- no row is visible and no row can be written. Only the service_role key,
-- which bypasses RLS, can reach this data — and that key lives in the server's
-- environment and is never sent to a browser.
--
-- That is the correct posture here rather than a placeholder, because this
-- application has no Supabase Auth. There are no end-user identities to scope
-- rows against, so there is no such thing as "the rows this signed-in user may
-- see". What there is instead is a publishable key that ships to every visitor
-- by design. A permissive policy — even `using (true)` for authenticated only
-- — would put the whole client ledger, every system instruction, and every
-- recorded conversation behind a key printed in the page source.
--
-- So: the server talks to Postgres with the service role, and the browser talks
-- to the server. The database is not a public API.
--
-- IF PER-OWNER LOGIN IS ADDED LATER, this is the seam. Give owners an
-- auth.users id, then add policies of the shape
--
--   create policy owners_read_own on public.clients for select to authenticated
--     using (id in (select linked_client_id from public.owners
--                    where user_id = (select auth.uid())));
--
-- and only then hand the browser a publishable key. Wrap auth.uid() in a
-- subselect as above: called bare, it is re-evaluated per row.

alter table public.clients       enable row level security;
alter table public.owners        enable row level security;
alter table public.customers     enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Belt and braces. Supabase's default privileges hand new tables in `public`
-- to anon and authenticated, so RLS is the only thing standing between the
-- ledger and the publishable key. Dropping the grants as well means a policy
-- added in haste, or an `alter table ... disable row level security` typed at
-- the wrong prompt, still does not open the door on its own.
revoke all on public.clients       from anon, authenticated;
revoke all on public.owners        from anon, authenticated;
revoke all on public.customers     from anon, authenticated;
revoke all on public.chat_sessions from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;

commit;
