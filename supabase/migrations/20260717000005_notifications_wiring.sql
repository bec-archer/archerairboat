-- v5: notification wiring (applied 2026-07-17 via MCP as notifications_wiring).
-- pg_net triggers -> notify-booking Edge Function; pg_cron -> morning-reminders.
-- The gateway values below (function URL + publishable key) are public by
-- definition; the real secrets (Telnyx) live only in Edge Function env.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

insert into public.settings (key, value)
values ('notifications', jsonb_build_object(
  'app_base_url', 'https://app.archerairboattours.com',
  'operator_phones', '[]'::jsonb
))
on conflict (key) do nothing;

create or replace function public.notify_edge()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text := 'https://htvtwuudbbclmxgpzmet.supabase.co/functions/v1/notify-booking';
  v_key text := 'sb_publishable_VU0Ase9keYYfdT-K_RNtmw_EmEu9tqY';
begin
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key,
      'apikey', v_key
    ),
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'record', to_jsonb(new),
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

revoke all on function public.notify_edge() from public, anon;

drop trigger if exists bookings_notify_insert on public.bookings;
create trigger bookings_notify_insert
  after insert on public.bookings
  for each row execute function public.notify_edge();

drop trigger if exists bookings_notify_status on public.bookings;
create trigger bookings_notify_status
  after update of status on public.bookings
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_edge();

drop trigger if exists booking_requests_notify_insert on public.booking_requests;
create trigger booking_requests_notify_insert
  after insert on public.booking_requests
  for each row execute function public.notify_edge();

select cron.schedule(
  'archer-morning-reminders',
  '0 11 * * *',
  $cron$
  select net.http_post(
    url := 'https://htvtwuudbbclmxgpzmet.supabase.co/functions/v1/morning-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_VU0Ase9keYYfdT-K_RNtmw_EmEu9tqY',
      'apikey', 'sb_publishable_VU0Ase9keYYfdT-K_RNtmw_EmEu9tqY'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $cron$
);
