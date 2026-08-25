-- Reservation demo — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  reservation_date date not null,
  reservation_time time not null,
  guest_count      integer not null check (guest_count > 0 and guest_count <= 50),
  phone_number     text
);

comment on table public.reservations is 'Demo reservation requests submitted from the public booking form.';
comment on column public.reservations.created_at is 'When the booking was submitted (server clock).';
comment on column public.reservations.reservation_date is 'Requested date of the reservation.';
comment on column public.reservations.reservation_time is 'Requested time of the reservation.';
comment on column public.reservations.guest_count is 'Number of people the table is for.';
comment on column public.reservations.phone_number is 'Optional contact number; null when the guest skips it.';

-- Row Level Security: the browser talks to Supabase with the public anon
-- key, so access is controlled entirely by these policies rather than by
-- the key being secret.
alter table public.reservations enable row level security;

-- Anyone can submit a booking from the customer form.
create policy "Anyone can create a reservation"
  on public.reservations
  for insert
  to anon
  with check (true);

-- Anyone holding the anon key can read the list, which is what lets the
-- admin dashboard load and subscribe to it without a login step. This is a
-- deliberate simplification for a self-contained demo: a production build
-- should require an authenticated "staff" role for select instead of anon.
create policy "Anyone can read reservations"
  on public.reservations
  for select
  to anon
  using (true);

-- Stream inserts to subscribers in real time (Dashboard -> Database ->
-- Replication also has a toggle for this, if you prefer the UI).
alter publication supabase_realtime add table public.reservations;
