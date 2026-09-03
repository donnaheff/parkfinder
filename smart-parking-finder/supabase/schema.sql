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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
