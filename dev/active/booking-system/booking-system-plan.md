# Booking System — Plan

**Created:** 2026-07-12
**Status:** built (2026-07-17) — deployed dark; remaining work is config + confirmations, tracked in booking-system-tasks.md and Docs/Booking_GoLive_Runbook.md

## Goal

A cloud-backed booking + scheduling system for Archer Airboat Tours that survives Bobby losing his phone in the water, works on any device without a native app, requires no email, and only exposes public online booking when Bobby & Elise flip a switch. Operators get an SMS the instant a ride is booked, with a deep link straight to that ride on the calendar.

## Approach (as built)

**Stack:** Next.js 15 static-export PWA on Cloudflare Workers Static Assets + Supabase (Postgres, Auth, Realtime, Edge Functions) + Telnyx SMS + Cloudflare Turnstile.

**1. Data layer** — as designed (profiles, tour_types, bookings, customers, availability_rules, blackout_dates, settings, booking_requests), plus v3 two-tier pricing (flat couples rate + per-person) and `client_ip` on booking_requests for rate limiting. Realtime on bookings.

**2. Auth** — Supabase phone OTP; delivery via the Send SMS auth hook -> `send-otp-sms` Edge Function -> Telnyx (any provider works through the hook; this is what freed us from Twilio). OTP login is the device-recovery story. Dev uses Supabase test phone numbers.

**3. Security model (evolved from original RLS plan)** — operators: RLS via `is_operator()`. Public: ZERO table access. The `booking-api` Edge Function is the only door; it verifies Turnstile server-side, rate-limits, and calls SECURITY DEFINER SQL (`get_open_slots`, `price_for`, `create_online_booking`) that enforce flag/capacity/overlap/notice/horizon in the database. Advisory lock serializes same-slot races.

**4. Operator PWA** — calendar (month + day list), today glance, `/a/?id=` deep-link detail, manual create/edit/confirm/cancel, requests inbox, settings (tours, hours, blackouts, rules, go-live toggle). Offline read snapshot via Cache API. Service worker network-first shell.

**5. Public request -> booking** — `/request/` form (call-first phase) and `/book/` slot picker, both Turnstile-gated. Flag off = call-first message server-enforced (config hides tours, slots return empty, create refuses in SQL).

**6. Notifications** — pg_net triggers on bookings/booking_requests -> `notify-booking` (operator alert + customer confirmation); pg_cron 11:00 UTC -> `morning-reminders`. All sends through one Telnyx `sms.ts` helper; simulated/log mode until creds exist. Operator numbers + deep-link base editable in `settings.notifications`.

## Open Questions — all resolved 2026-07-17

- Tour data: confirmed by Bec (couples $180 / $65pp, 90 min, max 6, 7 days 8-4); solo price + Sunset details still placeholder pending Bobby.
- SMS provider: Telnyx, own brand/campaign under the Archer LLC (was: which Twilio approach).
- Deep link: `/a/?id=<uuid>`, permanent.
- booking_requests: separate table kept; public path moved from anon-RLS-insert to Edge Function.
- Hosting: Cloudflare Workers Static Assets (aligned with the Astro site).
