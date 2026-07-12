-- Tighten EXECUTE grants on helper functions.
-- The initial migration revoked is_operator() from anon, but the default
-- grant to PUBLIC still let anon call it via /rest/v1/rpc. Revoke from
-- PUBLIC and grant back only what RLS policy evaluation needs.

revoke execute on function public.is_operator() from public, anon;
grant execute on function public.is_operator() to authenticated;

-- set_updated_at is a trigger function; nothing should call it via RPC.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
