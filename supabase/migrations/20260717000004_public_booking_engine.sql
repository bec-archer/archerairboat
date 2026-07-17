-- v4: server-side public booking engine (applied 2026-07-17 via MCP as
-- public_booking_engine + grant_booking_engine_to_service_role + fix_get_open_slots_series).
-- The public site talks ONLY to the booking-api Edge Function (service role).
-- Anon has zero table access; Turnstile can't be bypassed via PostgREST.
-- Flag, notice, horizon, blackouts, capacity, and double-booking are all
-- enforced HERE, in SQL, not in the UI.

drop policy if exists "public can submit booking requests" on public.booking_requests;
drop policy if exists "anon_insert_booking_requests" on public.booking_requests;
revoke all on public.booking_requests from anon;

alter table public.booking_requests add column if not exists client_ip inet;

create or replace function public.booking_rules()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value from public.settings where key = 'booking_rules'), '{}'::jsonb);
$$;

revoke all on function public.booking_rules() from public, anon;

create or replace function public.get_open_slots(p_day date, p_tour_type uuid)
returns table (slot_start timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rules jsonb := public.booking_rules();
  v_tz text := coalesce(v_rules->>'timezone', 'America/New_York');
  v_notice_h int := coalesce((v_rules->>'min_notice_hours')::int, 48);
  v_horizon_d int := coalesce((v_rules->>'horizon_days')::int, 90);
  v_interval_min int := coalesce((v_rules->>'slot_interval_min')::int, 120);
  v_duration_min int;
  v_weekday int;
begin
  select duration_min into v_duration_min
  from public.tour_types where id = p_tour_type and active;
  if v_duration_min is null then return; end if;

  if p_day > (now() at time zone v_tz)::date + v_horizon_d then return; end if;
  if exists (select 1 from public.blackout_dates b where b.day = p_day) then return; end if;

  v_weekday := extract(dow from p_day)::int;

  return query
  select s.slot_start
  from public.availability_rules ar
  cross join lateral (
    select t at time zone v_tz as slot_start
    from generate_series(
      p_day::timestamp + ar.start_time,
      p_day::timestamp + ar.end_time - make_interval(mins => v_duration_min),
      make_interval(mins => v_interval_min)
    ) as t
  ) s
  where ar.weekday = v_weekday
    and s.slot_start >= now() + make_interval(hours => v_notice_h)
    and not exists (
      select 1
      from public.bookings bk
      join public.tour_types tt on tt.id = bk.tour_type_id
      where bk.status in ('requested', 'confirmed')
        and bk.starts_at < s.slot_start + make_interval(mins => v_duration_min)
        and bk.starts_at + make_interval(mins => coalesce(tt.duration_min, v_duration_min)) > s.slot_start
    )
  order by s.slot_start;
end;
$$;

revoke all on function public.get_open_slots(date, uuid) from public, anon;

create or replace function public.price_for(p_tour_type uuid, p_party int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_party < 1 or p_party > t.max_guests then null
    when t.flat_rate_cents is not null and p_party <= coalesce(t.flat_rate_max_party, 0)
      then t.flat_rate_cents
    when t.per_person_cents is not null then t.per_person_cents * p_party
    else t.flat_rate_cents
  end
  from public.tour_types t where t.id = p_tour_type;
$$;

revoke all on function public.price_for(uuid, int) from public, anon;

create or replace function public.create_online_booking(
  p_tour_type uuid,
  p_starts_at timestamptz,
  p_party int,
  p_name text,
  p_phone text,
  p_email text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag boolean;
  v_tour public.tour_types%rowtype;
  v_tz text := coalesce(public.booking_rules()->>'timezone', 'America/New_York');
  v_day date;
  v_customer uuid;
  v_booking uuid;
  v_price int;
begin
  select (value = 'true'::jsonb) into v_flag
  from public.settings where key = 'online_booking_enabled';
  if not coalesce(v_flag, false) then
    return jsonb_build_object('ok', false, 'error', 'Online booking is not available right now. Please call us!');
  end if;

  select * into v_tour from public.tour_types where id = p_tour_type and active;
  if v_tour.id is null then
    return jsonb_build_object('ok', false, 'error', 'That tour is not available.');
  end if;
  if p_party < 1 or p_party > v_tour.max_guests then
    return jsonb_build_object('ok', false, 'error', 'Party size not available for this tour.');
  end if;
  if p_name is null or length(trim(p_name)) < 1 or length(p_name) > 200
     or p_phone is null or length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then
    return jsonb_build_object('ok', false, 'error', 'A name and valid phone number are required.');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_starts_at::text, 42));

  v_day := (p_starts_at at time zone v_tz)::date;
  if not exists (
    select 1 from public.get_open_slots(v_day, p_tour_type) s
    where s.slot_start = p_starts_at
  ) then
    return jsonb_build_object('ok', false, 'error', 'That time was just taken. Please pick another slot.');
  end if;

  v_price := public.price_for(p_tour_type, p_party);

  insert into public.customers (name, phone, email)
  values (trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email, '')), ''))
  returning id into v_customer;

  insert into public.bookings (tour_type_id, customer_id, starts_at, party_size, status, source, notes)
  values (p_tour_type, v_customer, p_starts_at, p_party, 'confirmed', 'online', nullif(trim(coalesce(p_notes, '')), ''))
  returning id into v_booking;

  return jsonb_build_object('ok', true, 'booking_id', v_booking, 'price_cents', v_price);
end;
$$;

revoke all on function public.create_online_booking(uuid, timestamptz, int, text, text, text, text) from public, anon;

grant execute on function public.booking_rules() to service_role;
grant execute on function public.get_open_slots(date, uuid) to service_role;
grant execute on function public.price_for(uuid, int) to service_role;
grant execute on function public.create_online_booking(uuid, timestamptz, int, text, text, text, text) to service_role;
