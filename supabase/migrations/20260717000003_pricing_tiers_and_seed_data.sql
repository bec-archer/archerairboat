-- v3: two-tier pricing, seed data, booking rules
-- Applied to the Archer Supabase project 2026-07-17 via MCP (migration name: pricing_tiers_and_seed_data).
-- Pricing model (per Bec 2026-07-17):
--   parties of 1..flat_rate_max_party pay flat_rate_cents flat;
--   larger parties pay per_person_cents * party_size.

alter table public.tour_types drop column base_price_cents;

alter table public.tour_types
  add column flat_rate_cents integer check (flat_rate_cents is null or flat_rate_cents >= 0),
  add column flat_rate_max_party integer check (flat_rate_max_party is null or flat_rate_max_party >= 1),
  add column per_person_cents integer check (per_person_cents is null or per_person_cents >= 0),
  add column internal_notes text,
  add constraint tour_types_priceable check (flat_rate_cents is not null or per_person_cents is not null);

comment on column public.tour_types.flat_rate_cents is 'Flat price for parties up to flat_rate_max_party (e.g. couples rate)';
comment on column public.tour_types.per_person_cents is 'Per-person price for parties larger than flat_rate_max_party';
comment on column public.tour_types.internal_notes is 'Operator-only notes; never shown to customers';

create unique index if not exists tour_types_name_key on public.tour_types (lower(name));

-- Seed tour types (idempotent)
insert into public.tour_types (name, duration_min, max_guests, flat_rate_cents, flat_rate_max_party, per_person_cents, active, internal_notes)
select * from (values
  ('Standard Tour', 90, 6, 18000, 2, 6500, true,
   'PLACEHOLDER FLAG: solo-rider price not confirmed with Bobby (currently 1-2 guests pay the $180 couples rate). Confirm before go-live.'),
  ('Sunset Tour', 90, 6, 18000, 2, 6500, true,
   'Added 2026-07-17 with same pricing as Standard per Bec. PLACEHOLDER FLAG: confirm departure time, pricing, and details with Bobby before go-live.')
) as v(name, duration_min, max_guests, flat_rate_cents, flat_rate_max_party, per_person_cents, active, internal_notes)
where not exists (select 1 from public.tour_types t where lower(t.name) = lower(v.name));

-- Seed default availability: 7 days a week, 8am-4pm (editable in the app)
insert into public.availability_rules (weekday, start_time, end_time)
select w, time '08:00', time '16:00'
from generate_series(0, 6) as w
where not exists (select 1 from public.availability_rules);

-- Booking rules (editable in settings screen)
insert into public.settings (key, value)
values (
  'booking_rules',
  jsonb_build_object(
    'min_notice_hours', 48,
    'horizon_days', 90,
    'slot_interval_min', 120,
    'timezone', 'America/New_York'
  )
)
on conflict (key) do update set value = excluded.value, updated_at = now();
