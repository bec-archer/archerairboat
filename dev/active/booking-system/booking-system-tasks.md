# Booking System — Tasks

**Last updated:** 2026-07-17 (session 3 — go-live-ready build)

## In Progress

- [ ] Bec setup checklist — `Docs/Booking_GoLive_Runbook.md` Part 1: Supabase auth config (phone provider, OTP hook, test numbers, operator profiles), Turnstile widget + secrets, first wrangler deploy, Telnyx registration
- [ ] Confirm with Bobby: solo-rider price and Sunset Tour details (both seeded as flagged placeholders)
- [ ] Get Bobby's + Elise's mobile numbers → profiles + `settings.notifications.operator_phones`

## Done

- [x] System designed and speced — spec, TODO, and dev docs created
- [x] Repo folder structure fixed — `Docs/` + `dev/active/booking-system/` match CLAUDE.md and `.slack-tide.json`
- [x] Supabase project created — dedicated Archer account (free plan), `https://htvtwuudbbclmxgpzmet.supabase.co`
- [x] Initial schema + RLS + function-grant lockdown (migrations 1-2, session 2)
- [x] SMS provider decision — **Telnyx toll-free** (not Twilio, not 10DLC): no EIN required, free verification, one 8XX number for everything; research verified 2026-07-17; registration pack written (`Docs/Telnyx_Registration_Pack.md`)
- [x] Migration v3 — two-tier pricing (couples flat / per-person), Standard + Sunset seed, 7-day 8am-4pm availability, booking_rules settings (48h notice / 90d horizon / 120min slots / America/New_York)
- [x] Migration v4 — public booking engine: anon table access fully revoked; `get_open_slots`, `price_for`, `create_online_booking` (advisory-lock race safety, flag enforced in SQL)
- [x] Migration v5 — pg_net triggers → notify-booking; pg_cron `archer-morning-reminders` @ 11:00 UTC
- [x] Migration v6 — advisor cleanup (dropped legacy public-insert policy, revoked authenticated execute on internal functions)
- [x] Edge Functions deployed — `booking-api` (Turnstile + rate limits), `notify-booking`, `morning-reminders`, `send-otp-sms` (auth hook); all SMS in simulated/log mode until Telnyx creds
- [x] Operator PWA built — Next.js 15 static export in `app/`: login (OTP), calendar (Realtime), today glance, booking detail (`/a/?id=`), manual create/edit, requests inbox, settings (tours/hours/rules/go-live toggle), offline snapshot, service worker, manifest, icons; production build passes
- [x] Public pages built — `/request/` + `/book/` with Turnstile and SMS consent copy; flag-off shows call-first
- [x] Verification pass — flag OFF confirmed; anon PostgREST access 401s; bookings without Turnstile 403; slot engine returns correct ET slots (8/10/12/2); full booking round-trip tested with flag temporarily on (pricing correct: $180 couple / $260 x4), test data purged; notify pipeline fired on INSERT + confirm; morning-reminders runs; security advisors clean (only intentional `is_operator`)

## Blocked / Parked

- [ ] Live online booking go-live — parked ON PURPOSE until Bobby & Elise flip the flag (their call, not a task)
- [ ] Telnyx toll-free verification — ~5 business days after Bec submits (no sends possible until approved; simulated mode covers meanwhile)
- [ ] `app.archerairboattours.com` custom domain — blocked by GoDaddy 2FA / DNS move; deploy to workers.dev meanwhile; NO real SMS sends before the domain is live (deep links point at it)
- [ ] Reply-to-confirm inbound SMS — v2, after core ships
- [ ] Supabase free-tier pause — decide Pro upgrade (~$10/mo, Archer's own billing) vs keep-alive BEFORE real customers depend on it (runbook Part 1A-6)
- [ ] Swap Archer Supabase + Telnyx account emails to @archerairboattours.com once DNS moves
