# Booking System — Tasks

**Last updated:** 2026-07-12 (session 2)

## In Progress

- [ ] Confirm tour types / prices / durations / availability with Elise (next unblocked step — seed data waits on this)

## Done

- [x] System designed and speced — spec, TODO, and dev docs created
- [x] Repo folder structure fixed — `Docs/` + `dev/active/booking-system/` now match CLAUDE.md and `.slack-tide.json`
- [x] Supabase project created — dedicated **Archer Supabase account** (free plan, $0, off the shop billing). Project URL: `https://htvtwuudbbclmxgpzmet.supabase.co`, connected via "Archer Airboats Supabase MCP"
- [x] Initial schema + RLS migration written AND applied — `supabase/migrations/20260712000001_initial_schema.sql` (8 tables, operator RLS, anon insert-only booking_requests, Realtime on bookings, go-live flag seeded OFF)
- [x] Function grant lockdown applied — `supabase/migrations/20260712000002_lock_down_function_grants.sql` (is_operator not callable by anon/PUBLIC)
- [x] Security + performance advisors run — remaining warnings are intentional (public INSERT policy = the request form; authenticated exec on is_operator = needed for RLS)

## Up Next

- [ ] Decide Twilio approach (new campaign, same account) + kick off A2P 10DLC registration (lead time)
- [ ] Wire phone OTP auth (Bobby + Elise profiles; own Twilio as SMS provider)
- [ ] Scaffold Next.js PWA shell (manifest + service worker)
- [ ] Calendar + booking detail views
- [ ] `on-booking-created` Edge Function + database webhook + Twilio SMS
- [ ] Public "Request a Ride" form → booking_requests
- [ ] Go-live toggle in settings

## Blocked / Parked

- [ ] Live online booking (Phase 2) — parked until Bobby & Elise are ready to flip the go-live flag
- [ ] Reply-to-confirm inbound SMS — v2, after core ships
- [ ] Twilio A2P 10DLC approval — blocked by: carrier registration lead time (start early)
- [ ] Free-tier caveat at launch: free projects pause after 1 week of inactivity — revisit plan tier (or add keep-alive traffic) before real customers depend on it
- [ ] Swap Archer Supabase account email to a proper @archerairboattours.com address once DNS moves to Cloudflare
