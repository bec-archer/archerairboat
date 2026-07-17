-- v6: advisor cleanup (applied 2026-07-17 via MCP as advisor_cleanup_lockdown).
-- 1) The v1 public-insert policy survived under its real name; remove it.
drop policy if exists "public can submit a request" on public.booking_requests;

-- 2) Supabase default privileges grant EXECUTE to authenticated explicitly;
--    operators don't call these — only service_role (Edge Functions) does.
revoke execute on function public.booking_rules() from authenticated;
revoke execute on function public.get_open_slots(date, uuid) from authenticated;
revoke execute on function public.price_for(uuid, int) from authenticated;
revoke execute on function public.create_online_booking(uuid, timestamptz, int, text, text, text, text) from authenticated;
revoke execute on function public.notify_edge() from authenticated, anon;
-- is_operator() stays executable by authenticated ON PURPOSE: RLS policies call it.
