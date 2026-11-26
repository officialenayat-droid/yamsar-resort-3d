-- The Yamsar Resort website: bookings & admin data.
-- Lives in its own "website" schema. It is NOT exposed through the Data API;
-- only the Node server (connecting as the database owner, DATABASE_URL=postgres://…) reads/writes it.
create schema if not exists website;

create table if not exists website.kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists website.bookings (
  ref text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null check (status in ('pending','confirmed','cancelled','checked_in','completed')),
  cabin text not null check (cabin in ('aframe','riverfront','glacier')),
  stay_name text not null,
  check_in date not null,
  check_out date not null,
  nights integer not null,
  adults integer not null,
  children integer not null,
  addons jsonb not null default '[]',
  name text not null,
  phone text not null,
  email text not null default '',
  notes text not null default '',
  admin_notes text not null default '',
  quote jsonb not null,
  total integer not null,
  source text not null default 'website',
  check (check_out > check_in)
);
create index if not exists bookings_dates on website.bookings (cabin, check_in, check_out);
create index if not exists bookings_status on website.bookings (status);

create table if not exists website.blocks (
  id bigint generated always as identity primary key,
  cabin text not null check (cabin in ('aframe','riverfront','glacier')),
  from_date date not null,
  to_date date not null,
  units integer not null default 1 check (units > 0),
  reason text not null default '',
  check (to_date > from_date)
);

-- defence in depth: no client role can touch these tables even if the schema were exposed
alter table website.kv enable row level security;
alter table website.bookings enable row level security;
alter table website.blocks enable row level security;
revoke all on schema website from anon, authenticated;
revoke all on all tables in schema website from anon, authenticated;
