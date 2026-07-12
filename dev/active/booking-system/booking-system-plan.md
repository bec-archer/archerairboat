# Booking System — Plan

**Created:** 2026-07-12
**Status:** draft

## Goal

A cloud-backed booking + scheduling system for Archer Airboat Tours that survives Bobby losing his phone in the water, works on any device without a native app, requires no email, and only exposes public online booking when Bobby & Elise flip a switch. Operators get an SMS the instant a ride is booked, with a deep link straight to that ride on the calendar.

## Approach

**Stack:** React/Next.js PWA + Supabase (Postgres, Auth, Realtime, Edge Functions) + Twilio (SMS). Deploy the PWA on Cloudflare Pages or Vercel. Same Supabase project family Bec already uses.

**1. Data layer (Supabase)**
- Tables:
  - `profiles` — Bobby & Elise (linked to auth.users), role (`owner`/`manager`).
  - `tour_types` — name, duration_min, base_price, max_guests, active.
  - `bookings` — id, tour_type_id, customer_id, starts_at (timestamptz), status (`requested`/`confirmed`/`cancelled`/`completed`), party_size, source (`manual`/`web_request`/`online`), notes, created_at.
  - `customers` — name, phone, email (nullable), notes.
  - `availability_rules` — weekday, start_time, end_time (Bobby's default bookable windows).
  - `blackout_dates` — one-off closures.
  - `settings` — single-row key/value incl. `online_booking_enabled` (the go-live flag).
- Enable Realtime on `bookings`.
- Index `bookings(starts_at)` for calendar range queries.

**2. Auth (phone OTP, no email)**
- Supabase Auth with phone provider (SMS OTP). Twilio Verify or Supabase's Twilio integration as the SMS sender.
- Only Bobby & Elise get profiles; customers never authenticate.
- OTP login *is* the device-recovery story: new phone → enter number → SMS code → in. No password to lose.

**3. RLS**
- `bookings`, `customers`, `availability_rules`, `blackout_dates`, `settings`: SELECT/INSERT/UPDATE/DELETE only for authenticated users with a `profiles` row.
- Public request path does NOT hit `bookings` directly. Instead: a `booking_requests` table (or an Edge Function with the anon key) that anon can INSERT into only, no SELECT. Keeps the public form from reading the schedule.

**4. Operator PWA**
- Next.js app, `manifest.json` + service worker (Workbox) for installability + offline read cache of today/upcoming.
- Views: Calendar (month/week/day), Booking detail (`/booking/[id]` — the SMS deep-link target), Today glance (Bobby's simple read view), manual create/edit/confirm/cancel.
- Subscribe to Realtime on `bookings` so Elise's confirm updates Bobby's view live.
- Deep link: SMS contains `https://archerairboattours.com/a/[id]`; if session exists, open detail; else OTP login then redirect back to detail.

**5. Public request → booking**
- Phase 1 (now): "Request a Ride" form on the site → INSERT into `booking_requests` (status `requested`). Elise reviews/confirms in the PWA.
- Phase 2 (Elise flips flag): "Availability + Book Online" → reads `availability_rules` minus existing bookings minus blackouts → customer picks an open slot → INSERT confirmed `booking` (source `online`) → appears on the calendar instantly via Realtime.
- `online_booking_enabled` flag in `settings` controls whether the public site shows the request form or the live booker.

**6. Notifications (Edge Functions + Twilio)**
- Supabase **database webhook** on `bookings` INSERT → Edge Function `on-booking-created`.
- Function formats `{customer} booked a ride {when}. Tap: {deep link}` → Twilio SMS to Bobby + Elise.
- Customer confirmation SMS on status → `confirmed`.
- Scheduled Edge Function (cron) each morning → reminder SMS for that day's rides.
- Register a dedicated **A2P 10DLC brand + campaign for Archer Airboat Tours** (separate from QRSTKR — different LLC, and we're texting customers).
- Optional free bonus layer: ntfy.sh topic for push (reuse Bec & Call pattern).

## Open Questions

- Confirm Bobby's real tour types, durations, prices, and default availability windows with Elise before seeding.
- Twilio: reuse existing account with a new brand/campaign, or spin up fresh under the Archer LLC? (Leaning new campaign, same account.)
- Deep-link short path `/a/[id]` vs `/booking/[id]` — pick one and keep it stable (it goes in every SMS).
- Do we want a `booking_requests` table separate from `bookings`, or a single table with a `status`? (Leaning separate table for a clean public-insert RLS boundary.)
- Cloudflare Pages vs Vercel for the PWA (align with whatever the main site lands on).
