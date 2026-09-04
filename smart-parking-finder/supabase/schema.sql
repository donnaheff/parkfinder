-- ParkSwift Lite Supabase schema
-- Run this in Supabase SQL Editor before deploying the Vercel API.

create extension if not exists pgcrypto;

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text not null,
  business_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.owners add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists owners_auth_user_id_idx on public.owners(auth_user_id) where auth_user_id is not null;

-- One row per admin user. Membership is managed directly in the Supabase SQL
-- editor (there's no self-serve "become an admin" flow, deliberately):
--   insert into public.admins (user_id) values ('<uuid of a user who has signed up>');
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.parking_lots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.owners(id) on delete set null,
  name text not null,
  area text not null,
  city text not null default 'Lagos',
  country text not null default 'Nigeria',
  type text not null default 'Open car park',
  address text not null,
  latitude double precision,
  longitude double precision,
  map_x numeric not null default 50,
  map_y numeric not null default 50,
  capacity integer not null check (capacity > 0),
  available_spaces integer not null default 0 check (available_spaces >= 0),
  walk_meters integer not null default 0,
  drive_minutes integer not null default 1,
  rating numeric not null default 4.1,
  amenities jsonb not null default '{}'::jsonb,
  owner_listed boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','more_info_requested')),
  is_open boolean not null default true,
  primary_photo_url text not null default '',
  owner_notes text not null default '',
  opening_hours text not null default '06:00–22:00',
  price_per_hour numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.parking_lots add column if not exists city text not null default 'Lagos';
alter table public.parking_lots add column if not exists country text not null default 'Nigeria';
-- Phase 8: hourly rate. 0 means free/unset (matches existing seed data, which
-- predates pricing) — search/UI treat 0 as "no price listed", not "$0".
alter table public.parking_lots add column if not exists price_per_hour numeric not null default 0;

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  parking_lot_id uuid references public.parking_lots(id) on delete cascade,
  lot_name text not null,
  user_id text,
  user_name text not null default 'Guest',
  status text not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.saved_parks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parking_lot_id uuid references public.parking_lots(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, parking_lot_id)
);
-- If you ran this schema before Phase 1 (auth), saved_parks.user_id was a
-- free-text id like 'user_demo' rather than a real auth.users uuid. Clear
-- the pre-auth demo data, then run the migration:
--   truncate table public.saved_parks;
--   alter table public.saved_parks alter column user_id type uuid using user_id::uuid;
--   alter table public.saved_parks add constraint saved_parks_user_id_fkey
--     foreign key (user_id) references auth.users(id) on delete cascade;

-- Phase 9: one row per end user (renter), for data Supabase Auth itself
-- doesn't store — currently just a phone number for SMS alerts. Same shape
-- as `owners`: a table keyed on auth.users with "own row" RLS, rather than
-- Auth user_metadata, for consistency with the rest of this schema.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "users can manage their own profile"
  on public.profiles for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id text,
  target_type text not null,
  target_id uuid,
  action text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists parking_lots_area_idx on public.parking_lots(area);
create index if not exists parking_lots_status_idx on public.parking_lots(verification_status);
create index if not exists parking_lots_owner_idx on public.parking_lots(owner_id);
create index if not exists community_reports_lot_idx on public.community_reports(parking_lot_id);
create index if not exists saved_parks_user_idx on public.saved_parks(user_id);

-- Row Level Security
--
-- The Vercel API (api/*) always uses the service role key, which bypasses RLS
-- entirely (the `service_role` Postgres role has BYPASSRLS) — so nothing here
-- changes how the API behaves today. This is defense-in-depth for the `anon`/
-- `authenticated` roles, so a leaked anon key (or a future client-side
-- Supabase Auth session, see Phase 1 of the hardening plan) can't read or
-- write more than intended. With RLS enabled and no matching policy, a role
-- gets zero access by default — so only the tables/actions listed below are
-- reachable directly; everything else still has to go through the API.

alter table public.owners enable row level security;
alter table public.parking_lots enable row level security;
alter table public.community_reports enable row level security;
alter table public.saved_parks enable row level security;
alter table public.admin_actions enable row level security;

-- Parking lot listings and community reports are meant to be public data.
create policy "parking_lots are publicly readable"
  on public.parking_lots for select
  to anon, authenticated
  using (true);

create policy "community_reports are publicly readable"
  on public.community_reports for select
  to anon, authenticated
  using (true);

alter table public.admins enable row level security;

-- Phase 1 (real auth): owners can read/manage only their own profile and
-- listings; users can read/manage only their own saved_parks. admins and
-- admin_actions still have no anon/authenticated policies at all — they
-- stay reachable only via the service-role-backed API.

create policy "owners can read their own profile"
  on public.owners for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "owners can update their own profile"
  on public.owners for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "owners can manage their own parking_lots"
  on public.parking_lots for all
  to authenticated
  using (owner_id in (select id from public.owners where auth_user_id = auth.uid()))
  with check (owner_id in (select id from public.owners where auth_user_id = auth.uid()));

create policy "users can manage their own saved_parks"
  on public.saved_parks for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- For this POC, Vercel serverless functions use the Supabase service role key.
-- Keep tables private in Supabase; do not expose the service role key to the browser.

-- Phase 3: reservations (hold -> confirm -> cancel/complete). 'awaiting_payment'
-- sits between held and confirmed for the Phase 8 Flutterwave integration below.
-- Phase 11: user_id is nullable — a guest checkout (no account) fills in
-- guest_name/guest_email/guest_phone instead; the check constraint below
-- requires one or the other.
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.parking_lots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  guest_name text,
  guest_email text,
  guest_phone text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'held' check (status in ('held','awaiting_payment','confirmed','cancelled','completed')),
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (user_id is not null or guest_email is not null)
);
alter table public.reservations alter column user_id drop not null;
alter table public.reservations add column if not exists guest_name text;
alter table public.reservations add column if not exists guest_email text;
alter table public.reservations add column if not exists guest_phone text;
alter table public.reservations drop constraint if exists reservations_user_id_or_guest_check;
alter table public.reservations add constraint reservations_user_id_or_guest_check
  check (user_id is not null or guest_email is not null);
create index if not exists reservations_user_idx on public.reservations(user_id);
create index if not exists reservations_lot_idx on public.reservations(lot_id);
create index if not exists reservations_status_idx on public.reservations(status);

-- Phase 8: payment tracking. amount/currency/payment_reference are set when a
-- 'held' reservation moves to 'awaiting_payment' (see mark_awaiting_payment
-- below); payment_expires_at is a separate, shorter-lived timeout from
-- hold_expires_at so an abandoned Flutterwave checkout doesn't hold a space
-- indefinitely (see the release_expired_holds extension below).
alter table public.reservations add column if not exists amount numeric;
alter table public.reservations add column if not exists currency text not null default 'NGN';
alter table public.reservations add column if not exists payment_reference text;
alter table public.reservations add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid','pending','paid','refunded','failed'));
alter table public.reservations add column if not exists payment_expires_at timestamptz;
create index if not exists reservations_payment_reference_idx on public.reservations(payment_reference);

alter table public.reservations enable row level security;
create policy "users can read their own reservations"
  on public.reservations for select
  to authenticated
  using (user_id = auth.uid());
-- No insert/update/delete policies: every write goes through the functions
-- below (service-role-called from the API) so available_spaces and the
-- reservation row change atomically together.

-- Creates a hold: atomically checks + decrements available_spaces and
-- inserts the reservation row, so two simultaneous requests for the last
-- space can't both succeed. Runs as the function owner (security definer)
-- with a fixed search_path so it can't be tricked by a session-local one.
--
-- Phase 11 added 3 trailing guest_* params. CREATE OR REPLACE only replaces
-- a function with the exact same argument *types* — a changed parameter
-- list creates a second overload instead, which can make PostgREST's
-- named-parameter RPC calls ambiguous. Drop the old 5-arg signature first
-- so re-running this on an existing project ends up with just one version.
drop function if exists public.create_reservation_hold(uuid, uuid, timestamptz, timestamptz, integer);
create or replace function public.create_reservation_hold(
  p_lot_id uuid,
  p_user_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_hold_minutes integer default 10,
  p_guest_name text default null,
  p_guest_email text default null,
  p_guest_phone text default null
) returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot public.parking_lots;
  v_reservation public.reservations;
begin
  if p_end_time <= p_start_time then
    raise exception 'end_time must be after start_time' using errcode = 'P0001';
  end if;
  if p_user_id is null and p_guest_email is null then
    raise exception 'A signed-in user or a guest email is required' using errcode = 'P0001';
  end if;

  select * into v_lot from public.parking_lots where id = p_lot_id for update;
  if not found then
    raise exception 'Parking lot not found' using errcode = 'P0002';
  end if;
  if not v_lot.is_open then
    raise exception 'This car park is currently closed' using errcode = 'P0001';
  end if;
  if v_lot.available_spaces <= 0 then
    raise exception 'No spaces available' using errcode = 'P0001';
  end if;

  update public.parking_lots
    set available_spaces = available_spaces - 1, updated_at = now()
    where id = p_lot_id;

  insert into public.reservations (lot_id, user_id, guest_name, guest_email, guest_phone, start_time, end_time, status, hold_expires_at)
  values (p_lot_id, p_user_id, p_guest_name, p_guest_email, p_guest_phone, p_start_time, p_end_time, 'held', now() + (p_hold_minutes || ' minutes')::interval)
  returning * into v_reservation;

  return v_reservation;
end;
$$;

-- Confirms a held reservation (clears the expiry so the cron sweep leaves it
-- alone). Scoped to the owning user unless p_user_id is null — that bypass
-- is only ever invoked from trusted server-side code (immediately after
-- creating a guest hold in the same request, never from client input), not
-- exposed as something a caller can pass. IS DISTINCT FROM (not <>) so a
-- guest reservation (user_id null) can't be "matched" by an attacker
-- passing a real p_user_id, since NULL <> anything is NULL/skipped, not true.
create or replace function public.confirm_reservation(
  p_reservation_id uuid,
  p_user_id uuid
) returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'Reservation not found' using errcode = 'P0002';
  end if;
  if p_user_id is not null and v_reservation.user_id is distinct from p_user_id then
    raise exception 'Not your reservation' using errcode = 'P0001';
  end if;
  if v_reservation.status <> 'held' then
    raise exception 'Only a held reservation can be confirmed' using errcode = 'P0001';
  end if;

  update public.reservations
    set status = 'confirmed', hold_expires_at = null, updated_at = now()
    where id = p_reservation_id
    returning * into v_reservation;

  return v_reservation;
end;
$$;

-- Releases a hold or confirmed reservation back to available_spaces.
-- p_user_id null bypasses the ownership check (used by the expiry sweep).
-- IS DISTINCT FROM (not <>): a guest reservation's user_id is null, and
-- NULL <> anything evaluates to NULL (skipped by plpgsql's IF, not raised)
-- — which would otherwise let any signed-in caller cancel any guest's
-- reservation. IS DISTINCT FROM treats null as a real, comparable value.
create or replace function public.release_reservation(
  p_reservation_id uuid,
  p_user_id uuid default null
) returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'Reservation not found' using errcode = 'P0002';
  end if;
  if p_user_id is not null and v_reservation.user_id is distinct from p_user_id then
    raise exception 'Not your reservation' using errcode = 'P0001';
  end if;
  if v_reservation.status not in ('held', 'awaiting_payment', 'confirmed') then
    return v_reservation; -- already terminal, no-op
  end if;

  update public.parking_lots
    set available_spaces = least(capacity, available_spaces + 1), updated_at = now()
    where id = v_reservation.lot_id;

  update public.reservations
    set status = 'cancelled', updated_at = now()
    where id = p_reservation_id
    returning * into v_reservation;

  return v_reservation;
end;
$$;

-- Sweeps expired holds AND abandoned payment attempts back into
-- available_spaces. Called on a schedule by api/cron/release-holds.js
-- (Vercel Cron), not exposed to end users.
create or replace function public.release_expired_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_row record;
begin
  for v_row in
    select id, lot_id from public.reservations
    where status = 'held' and hold_expires_at < now()
    for update skip locked
  loop
    update public.parking_lots set available_spaces = least(capacity, available_spaces + 1), updated_at = now() where id = v_row.lot_id;
    update public.reservations set status = 'cancelled', updated_at = now() where id = v_row.id;
    v_count := v_count + 1;
  end loop;

  for v_row in
    select id, lot_id from public.reservations
    where status = 'awaiting_payment' and payment_expires_at < now()
    for update skip locked
  loop
    update public.parking_lots set available_spaces = least(capacity, available_spaces + 1), updated_at = now() where id = v_row.lot_id;
    update public.reservations set status = 'cancelled', payment_status = 'failed', updated_at = now() where id = v_row.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Phase 8: Flutterwave payments. Moves a held reservation into
-- 'awaiting_payment' with its own (shorter) expiry, independent of
-- hold_expires_at, so an abandoned checkout doesn't hold a space forever.
-- Same p_user_id-null-bypass-for-trusted-server-code pattern as
-- confirm_reservation above (guest checkout paying immediately).
create or replace function public.mark_awaiting_payment(
  p_reservation_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_currency text,
  p_reference text,
  p_payment_minutes integer default 15
) returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'Reservation not found' using errcode = 'P0002';
  end if;
  if p_user_id is not null and v_reservation.user_id is distinct from p_user_id then
    raise exception 'Not your reservation' using errcode = 'P0001';
  end if;
  if v_reservation.status <> 'held' then
    raise exception 'Only a held reservation can start payment' using errcode = 'P0001';
  end if;

  update public.reservations
    set status = 'awaiting_payment',
        payment_status = 'pending',
        amount = p_amount,
        currency = p_currency,
        payment_reference = p_reference,
        payment_expires_at = now() + (p_payment_minutes || ' minutes')::interval,
        updated_at = now()
    where id = p_reservation_id
    returning * into v_reservation;

  return v_reservation;
end;
$$;

-- Finalizes a payment attempt. No p_user_id check here by design: this is
-- called from the Flutterwave webhook handler (api/webhooks/flutterwave.js),
-- which has already independently re-verified the transaction against
-- Flutterwave's API before calling this — never trust the webhook payload
-- alone for a financial decision, but by the time this function runs, that
-- verification has already happened server-side.
create or replace function public.finalize_payment(
  p_reservation_id uuid,
  p_reference text,
  p_success boolean
) returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'Reservation not found' using errcode = 'P0002';
  end if;
  if v_reservation.status <> 'awaiting_payment' then
    -- Already finalized (webhook retry) or no longer awaiting payment — no-op.
    return v_reservation;
  end if;
  if v_reservation.payment_reference is distinct from p_reference then
    raise exception 'Payment reference mismatch' using errcode = 'P0001';
  end if;

  if p_success then
    update public.reservations
      set status = 'confirmed', payment_status = 'paid', hold_expires_at = null, payment_expires_at = null, updated_at = now()
      where id = p_reservation_id
      returning * into v_reservation;
  else
    update public.reservations
      set status = 'held', payment_status = 'failed', updated_at = now()
      where id = p_reservation_id
      returning * into v_reservation;
  end if;

  return v_reservation;
end;
$$;

-- Phase 5: reviews. parking_lots.rating (previously a static owner-entered
-- number) becomes a computed average, kept up to date by a trigger rather
-- than aggregated on every /api/parks read.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.parking_lots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating numeric not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lot_id, user_id)
);
create index if not exists reviews_lot_idx on public.reviews(lot_id);

alter table public.reviews enable row level security;
create policy "reviews are publicly readable"
  on public.reviews for select
  to anon, authenticated
  using (true);
-- Insert/update/delete of reviews go through the service-role-backed API
-- (api/reviews.js), which enforces "one review per user per lot" and
-- ownership on delete — no direct anon/authenticated write policy.

create or replace function public.recompute_lot_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot_id uuid := coalesce(new.lot_id, old.lot_id);
  v_avg numeric;
begin
  select round(avg(rating)::numeric, 1) into v_avg from public.reviews where lot_id = v_lot_id;
  update public.parking_lots set rating = coalesce(v_avg, 4.1), updated_at = now() where id = v_lot_id;
  return null;
end;
$$;

drop trigger if exists reviews_recompute_rating on public.reviews;
create trigger reviews_recompute_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_lot_rating();

-- Phase 5: real photo storage instead of the data: URI placeholder in
-- api/uploads/photo.js. Public bucket (lot photos are meant to be visible
-- to anyone browsing listings); only authenticated users can upload, via
-- the service-role-backed API — direct client uploads aren't used, but the
-- policy exists for parity if that changes later.
insert into storage.buckets (id, name, public)
values ('lot-photos', 'lot-photos', true)
on conflict (id) do nothing;

create policy "lot photos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'lot-photos');

create policy "authenticated users can upload lot photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lot-photos');
