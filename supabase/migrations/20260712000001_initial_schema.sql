-- Archer Airboat Tours — initial schema + RLS
-- Design spine:
--   * All booking state lives in Supabase, never on the device (phone-overboard requirement).
--   * Operators (Bobby, Elise) authenticate via phone OTP; customers never authenticate.
--   * Public form writes to booking_requests ONLY (anon INSERT, no SELECT) so the anon
--     key can never read the schedule.
--   * Public online booking is gated by settings.online_booking_enabled (Elise's switch).
-- NOTE: no tour_types or availability seed data here on purpose — real numbers come
-- from Elise. Do not invent tours/prices/durations.

-- ============================================================
-- Enums
-- ============================================================

create type public.operator_role as enum ('owner', 'manager');
create type public.booking_status as enum ('requested', 'confirmed', 'cancelled', 'completed');
create type public.booking_source as enum ('manual', 'web_request', 'online');
create type public.request_status as enum ('new', 'contacted', 'converted', 'closed');

-- ============================================================
-- Tables
-- ============================================================

-- Operators only (Bobby & Elise). Linked 1:1 to auth.users (phone OTP).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  phone text not null,
  role public.operator_role not null default 'manager',
  created_at timestamptz not null default now()
);

create table public.tour_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_min integer not null check (duration_min > 0),
  base_price_cents integer not null check (base_price_cents >= 0),
  max_guests integer not null check (max_guests > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create index customers_phone_idx on public.customers (phone);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tour_type_id uuid references public.tour_types (id),
  customer_id uuid references public.customers (id),
  starts_at timestamptz not null,
  party_size integer not null check (party_size > 0),
  status public.booking_status not null default 'requested',
  source public.booking_source not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Calendar range queries + status filters
create index bookings_starts_at_idx on public.bookings (starts_at);
create index bookings_status_starts_at_idx on public.bookings (status, starts_at);
create index bookings_tour_type_id_idx on public.bookings (tour_type_id);
create index bookings_customer_id_idx on public.bookings (customer_id);

-- Public "Request a Ride" inbox. Anon can INSERT only — never SELECT.
-- Deliberately denormalized (no FK to customers): raw form input, triaged by Elise.
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  phone text not null check (char_length(phone) between 7 and 30),
  preferred_date date,
  preferred_time text check (preferred_time is null or char_length(preferred_time) <= 100),
  party_size integer check (party_size is null or party_size between 1 and 50),
  notes text check (notes is null or char_length(notes) <= 2000),
  status public.request_status not null default 'new',
  created_at timestamptz not null default now()
);

create index booking_requests_status_idx on public.booking_requests (status, created_at desc);

-- Bobby's default weekly bookable windows. Seeded later with real hours from Elise.
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.blackout_dates (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

-- Key/value app settings. online_booking_enabled is THE go-live flag.
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Config seed (not business data): public online booking ships OFF.
insert into public.settings (key, value) values ('online_booking_enabled', 'false'::jsonb);

-- ============================================================
-- updated_at trigger
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- Operator check helper
-- ============================================================

-- True when the current authenticated user has a profiles row (i.e. is Bobby or Elise).
-- SECURITY DEFINER so it can read profiles regardless of the caller's RLS.
create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid())
  );
$$;

revoke execute on function public.is_operator() from anon;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.tour_types enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_requests enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blackout_dates enable row level security;
alter table public.settings enable row level security;

-- profiles: operators can see each other; rows are provisioned via service role only.
create policy "operators can read profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_operator()));

-- tour_types / customers / bookings / availability_rules / blackout_dates / settings:
-- full access for operators, nothing for anon.
create policy "operators full access" on public.tour_types
  for all to authenticated
  using ((select public.is_operator()))
  with check ((select public.is_operator()));

create policy "operators full access" on public.customers
  for all to authenticated
  using ((select public.is_operator()))
  with check ((select public.is_operator()));

create policy "operators full access" on public.bookings
  for all to authenticated
  using ((select public.is_operator()))
  with check ((select public.is_operator()));

create policy "operators full access" on public.availability_rules
  for all to authenticated
  using ((select public.is_operator()))
  with check ((select public.is_operator()));

create policy "operators full access" on public.blackout_dates
  for all to authenticated
  using ((select public.is_operator()))
  with check ((select public.is_operator()));

create policy "operators full access" on public.settings
  for all to authenticated
  using ((select public.is_operator()))
  with check ((select public.is_operator()));

-- booking_requests: the public form path.
--   anon + authenticated may INSERT (public site uses the anon key).
--   Only operators may read/update. No SELECT for anon = the schedule stays private.
create policy "public can submit a request"
  on public.booking_requests for insert
  to anon, authenticated
  with check (true);

create policy "operators can read requests"
  on public.booking_requests for select
  to authenticated
  using ((select public.is_operator()));

create policy "operators can update requests"
  on public.booking_requests for update
  to authenticated
  using ((select public.is_operator()))
  with check ((select public.is_operator()));

create policy "operators can delete requests"
  on public.booking_requests for delete
  to authenticated
  using ((select public.is_operator()));

-- Belt & suspenders: revoke table-level SELECT from anon on everything.
-- (RLS already blocks it; this makes the intent explicit and survives policy edits.)
revoke select on public.profiles, public.tour_types, public.customers,
  public.bookings, public.booking_requests, public.availability_rules,
  public.blackout_dates, public.settings from anon;

-- ============================================================
-- Realtime
-- ============================================================

-- Live calendar updates: Elise confirms on her phone, Bobby's view updates instantly.
alter publication supabase_realtime add table public.bookings;
