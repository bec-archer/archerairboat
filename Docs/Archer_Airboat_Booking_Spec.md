---
milestone_prefix: "Booking System"
---

# Archer Airboat Tours — Booking System Spec

A Supabase-backed booking + scheduling system for Archer Airboat Tours (Capt. Bobby Archer, Matlacha FL).

**Core design constraints (these drive every decision):**

- **Phone-overboard resilience.** Bobby has lost multiple phones to the water. All state lives in Supabase (cloud), never on the device. A lost phone = buy a cheap one, log back in via SMS code, every booking is intact. The device is a window, not a filing cabinet.
- **No native app.** Bobby & Elise are on Android; Bec is iOS-only and has never shipped native Android. A PWA (installable web app) covers both platforms with Bec's existing web stack, and is *more* resilient than native (nothing to reinstall — just log in on any device).
- **No email required.** Auth is phone-number based (Supabase SMS OTP), because there may not be an email address for either Bobby or Elise, and text is the channel they already live in.
- **Elise controls go-live.** Everything gets built, then Bobby & Elise are shown how it works. Public online booking only switches on when *they* decide they're ready — via a feature flag, not a redeploy. Bobby's paper calendar book stays; this is a convenience layer, not a forced replacement.
- **Text-native notifications.** New bookings alert Bobby + Elise by SMS with a deep link straight to the ride on the calendar.

Stack (as built): Next.js 15 static-export PWA on Cloudflare Workers Static Assets + Supabase (Postgres, Auth, Realtime, Edge Functions) + Telnyx SMS + Cloudflare Turnstile. Deployed dark: everything live, public booking gated behind the `online_booking_enabled` flag (currently OFF).

---

## Milestone: Foundation & Data Layer

**Status:** completed
**Description:** Database schema, security, and phone-based auth that everything else builds on.

### Features

- Supabase schema — bookings, customers, tour_types, availability_rules, blackout_dates, profiles tables; v3 added two-tier pricing (flat_rate_cents up to flat_rate_max_party, then per_person_cents) replacing base_price_cents
- Row Level Security policies — operator-only read/write on bookings; anon has ZERO table access (v4/v6 removed the public insert path; all public traffic goes through the booking-api Edge Function)
- Phone-number authentication — Supabase SMS OTP login for Bobby and Elise, no email required; login UI + send-otp-sms hook function deployed; dashboard config completed and verified end-to-end 2026-07-17 (phone provider on, hook wired + secret set, dev login via Bec's real number with a fixed test OTP)
- Realtime on bookings — operator views update live when a booking changes
- Seed data — tour types and Bobby's default weekly availability; Standard + Sunset tours seeded (couples $180 flat for 1-2, $65/person for 3-6, 90 min, max 6), 7 days 8am-4pm; solo price + Sunset details carry PLACEHOLDER flags pending Bobby

---

## Milestone: Operator PWA

**Status:** completed
**Description:** The installable web app Bobby & Elise use to see and manage rides on any device.

### Features

- Installable PWA shell — add-to-home-screen, service worker, app icon; Next.js static export, deployed via wrangler (worker: archer-booking)
- Calendar view — month grid with per-day ride list, live via Realtime; refetches visible range on any change or reconnect; days with rides get an orange highlight (sunset-100) with status dots underneath (added 2026-07-17)
- Booking detail screen — the deep-link target opened from an SMS alert; path /a/?id=<uuid> (query param, stable forever, chosen for static-export compatibility)
- Manual booking management — create, edit, confirm, and cancel a ride by hand
- Today glance view — simplified read-only "today's rides" for Bobby, big type, tap-to-call customer
- Offline read caching — today and upcoming rides viewable with no signal (Cache API snapshot, refetched and overwritten on reconnect)
- Device recovery via OTP — new phone logs back in via SMS code with all data intact; verified working 2026-07-17 (auth config live; any browser + phone number + code = full app)
- Days off calendar — Settings month-grid picker: tap a day to mark it off (orange), tap again to reopen; writes blackout_dates directly and replaces the one-date-at-a-time input, so a week out of town is seven quick taps (added 2026-07-17)

---

## Milestone: Public Requests & Booking

**Status:** in_progress
**Description:** The customer-facing request form now, and true online booking gated behind an Elise-controlled switch. All public traffic goes through the booking-api Edge Function with Cloudflare Turnstile verification and rate limiting; the go-live flag is enforced server-side in SQL. Milestone completes after Turnstile widget config + dress rehearsal (runbook Part 1F).

### Features

- Request a Ride form — public /request/ page (name, phone, preferred date/time, party size, notes) writing to booking_requests via Edge Function; Turnstile-verified, rate-limited (3/day per phone, 10/hour per IP); operators triage in the Requests inbox (called them / book it / close)
- Availability display — open-slot picker driven by get_open_slots() SQL (availability rules minus bookings minus blackouts minus min-notice), 2-hour slot grid within Bobby's windows; returns nothing while the flag is off
- Live online booking — customer books an open slot on /book/; create_online_booking() SQL enforces flag, capacity, overlap (advisory lock), notice, and horizon, then writes a confirmed booking that appears on the calendar instantly; customer gets a confirmation text
- Go-live toggle — online_booking_enabled settings flag, big switch in the app's Settings screen; OFF shows call-first + request form, ON shows the live booker; flipping it is the entire go-live
- Availability preview mode — second Elise-controlled flag (availability_display_enabled): while full booking is off, the website can show open times with "call to grab it" instead of hiding availability entirely; the warm-up rung between call-only and full online booking (requested by Bec 2026-07-17, not yet built)

---

## Milestone: Notifications

**Status:** in_progress
**Description:** SMS alerts to operators and customers, driven by database events. Telnyx is the provider (decision 2026-07-17, replacing the original Twilio plan); until Telnyx creds are set, all sends run in simulated/log mode. Operator numbers + deep-link base URL are editable in settings (key: notifications) without redeploying.

### Features

- Booking-created webhook — pg_net trigger on bookings INSERT/status-UPDATE and booking_requests INSERT fires the notify-booking Edge Function (verified end-to-end 2026-07-17)
- Operator SMS alert — text to Bobby and Elise with ride details, price, source, and a deep link to the ride (app.archerairboattours.com/a/?id=...)
- Customer confirmation SMS — text to the customer when their ride is confirmed (online bookings confirm instantly; manual requested->confirmed also triggers)
- Morning-of reminder SMS — pg_cron (archer-morning-reminders, 11:00 UTC daily) hits the morning-reminders function; reminds each customer + sends operators a day summary
- Telnyx toll-free registration — toll-free verification for an 8XX sending number (no EIN or TCR fees required); registration pack prepped (Docs/Telnyx_Registration_Pack.md), Bec submits; ~$1-2/mo + ~$0.006/msg, approval ~5 business days

---

## Milestone: Reply-to-Confirm (v2)

**Status:** planned
**Description:** Let Bobby confirm or release a slot by replying to the alert text, no app needed.

### Features

- Inbound SMS webhook — Bobby texts back yes or no to confirm or release a slot

---

## Out of Scope

- Online payment and deposits — call-first for now; payment is a later phase (price is quoted and shown as "due at the dock")
- Native iOS or Android apps — PWA covers both platforms, no app-store builds
- Multi-boat or multi-captain scheduling — single operator (Bobby) only
- Peace River / fossil-trip booking — Archer is concentrating on Matlacha tours only
- Customer accounts and login — customers book without creating an account
- Email notifications — SMS only, since there may be no email for Bobby or Elise

---

## Decision Log

- **2026-07-17 — Telnyx over Twilio.** Bec preferred a non-Twilio provider. Research (verified against current pricing/docs): US carrier registration is unavoidable with every provider; Telnyx covers OTP (via Supabase Send SMS hook) + notifications + future inbound on one local 239 number for ~$4-7/mo all-in, cheaper than Twilio with passthrough-only 10DLC fees. Spec feature renamed from "Twilio A2P 10DLC registration" to "Telnyx 10DLC registration".
- **2026-07-17 — Static-export Next.js on Cloudflare Workers Static Assets** (not OpenNext SSR). App is fully client-side + Supabase; static export gives the same wrangler deploy story as the Astro site, zero server bundle, unlimited free asset requests. Server-ish endpoints live in Supabase Edge Functions. OpenNext remains the escape hatch if SSR is ever needed.
- **2026-07-17 — Zero anon table access; Edge Function as the only public door.** Original design had anon INSERT on booking_requests; replaced so Cloudflare Turnstile (server-side verification) + rate limits can't be bypassed by hitting PostgREST directly. Public reads/writes go through booking-api which calls SECURITY DEFINER SQL functions that enforce every rule (flag, capacity, overlap via advisory lock, notice, horizon).
- **2026-07-17 — Deep link is /a/?id=<uuid>** (query param, not /a/[id] path) because static export can't prerender unknown dynamic segments. Goes in every SMS; never change it.
- **2026-07-17 — Pricing model:** flat rate for small parties + per-person above (Standard: $180 flat 1-2, $65pp 3-6). Solo-rider price and all Sunset Tour details are UNCONFIRMED placeholders flagged in tour_types.internal_notes; confirm with Bobby before go-live.
- **2026-07-17 — Slots every 2 hours** (8/10/12/2 within the 8am-4pm default window): 90-min ride + 30-min turnaround. Interval, notice (48h), horizon (90d), and windows all editable in settings.
- **2026-07-17 — All business times in America/New_York**, computed server-side in SQL; slot math and SMS formatting both pin the zone explicitly.
- **2026-07-17 — SMS consent copy** added under the phone field on both public forms (booking-related texts, STOP to opt out) to satisfy carrier opt-in requirements; the registration references it verbatim.
- **2026-07-17 — Dev login = Bec's real number + fixed test OTP.** Supabase "test phone numbers" let any number log in with a fixed code and no SMS, so pre-Telnyx testing uses Bec's real mobile with a private code instead of the well-known 15005550101/123456 pair (which anyone could use; that user was deleted). The code lives only in the Supabase dashboard, never in the repo. When Telnyx goes live, delete the test entry and the same login starts receiving real OTP texts; the operator profile carries over.
- **2026-07-17 — Turnstile hostnames: apex only, no wildcards.** Turnstile rejects wildcards; an apex hostname automatically covers all its subdomains. Widget covers archerairboattours.com, archerairboats.com, and the account workers.dev subdomain (temporary until app.archerairboattours.com is live, then remove).
- **2026-07-17 — Toll-free instead of 10DLC.** The LLC's EIN is unknown and 10DLC brand registration requires one. Toll-free verification needs no EIN or tax ID (verified against Telnyx docs), has zero registration fees, and one 8XX number covers OTP + notifications + future inbound. Trade-off accepted: not a local 239 number. Fallback if verification stalls: sole-proprietor 10DLC under Bobby's personal name. Spec feature renamed from "Telnyx 10DLC registration" to "Telnyx toll-free registration".
