-- ParkSwift Lite Supabase schema
-- Run this in Supabase SQL Editor before deploying the Vercel API.

create extension if not exists pgcrypto;

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  business_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  user_id text not null,
  parking_lot_id uuid references public.parking_lots(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, parking_lot_id)
);

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

-- For this POC, Vercel serverless functions use the Supabase service role key.
-- Keep tables private in Supabase; do not expose the service role key to the browser.
