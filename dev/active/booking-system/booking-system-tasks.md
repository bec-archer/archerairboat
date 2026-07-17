# Booking System — Tasks

**Last updated:** 2026-07-17 (session 4 — runbook Part 1A-1C done, app live on workers.dev)

## In Progress

- [ ] Telnyx toll-free registration — Bec submits per `Docs/Telnyx_Registration_Pack.md` (~5 business days; everything simulated meanwhile)
- [ ] Confirm with Bobby: solo-rider price and Sunset Tour details (both seeded as flagged placeholders)
- [ ] Get Bobby's + Elise's mobile numbers → profiles + `settings.notifications.operator_phones`
- [ ] Dress rehearsal (runbook Part 1F) — partially done: Bec logged in, poked around, added a manual ride; SMS-side checks wait on Telnyx
- [ ] ~Aug 2: test phone number entry expires — extend, or remove if Telnyx is live by then (reminder scheduled)
- [ ] Availability preview mode — next feature up: migration (get_open_slots honors availability_display_enabled while create_online_booking stays locked), booking-api /config, /book/ third state, Settings warm-up option under the big switch

## Done

- [x] Runbook Part 1A — Supabase auth config (2026-07-17): phone provider on, Send SMS hook wired to send-otp-sms + secret set, verified end-to-end from outside (OTP request → hook 200 → verify → session). Dev login = Bec's real number + fixed test OTP (dashboard-only, not in repo); well-known 15005550101 test user deleted; Bec has a manager profiles row and RLS reads confirmed working
- [x] Runbook Part 1B — Turnstile (2026-07-17): widget live (Managed), hostnames archerairboattours.com + archerairboats.com + account workers.dev subdomain (no wildcards — Turnstile forbids them; apex covers subdomains). Real site key in app/.env.local + baked into deployed bundle; real secret in Edge Function secrets, verified (fake token → 403)
- [x] Runbook Part 1C — first deploy (2026-07-17): https://archer-booking.zydydv9ntn.workers.dev — all routes 200, manifest + SW live, /book/ correctly call-first with flag off
- [x] Calendar ride-day highlight (2026-07-17): days with rides shaded sunset-100 + bold, today = inset ring, dots keep status colors; sunset-100/600 added to palette
- [x] Days off calendar (2026-07-17): Settings blackout picker is now a tap-to-toggle month grid (orange = off, past days disabled); reasons still shown/removable in a list below; tsc clean
- [x] Supabase org mystery solved (2026-07-17): project lives in the slack-tide org on bec@slack-tide.dev (deliberate quota-sidestep account) — fine for free tier; transfer to an Archer-controlled org before any Pro upgrade. Project renamed to "Archer Airboat Tours" in dashboard

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
