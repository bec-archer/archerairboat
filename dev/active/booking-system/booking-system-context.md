# Booking System — Context

## Key Files

_(to be filled in as the build starts)_
- `supabase/migrations/` — schema + RLS
- `supabase/functions/on-booking-created/` — webhook target, Twilio SMS
- `supabase/functions/morning-reminders/` — scheduled reminder cron
- `app/` (Next.js) — PWA operator app
- `app/a/[id]/` — deep-link booking detail route
- `public/manifest.json` + service worker — installability + offline cache

## Decisions

- **PWA, not native Android** — Bec is iOS-only, and a PWA is more phone-loss-resilient than native (nothing to reinstall, just log in). Covers Bobby's Android + Elise + any replacement device.
- **Phone OTP auth, no email** — there may be no email for Bobby/Elise; SMS is their channel; OTP doubles as the device-recovery mechanism.
- **All state in Supabase, nothing on device** — the phone-overboard requirement. Device is a window, not storage.
- **Go-live behind a `settings` flag, not a redeploy** — Elise controls when public online booking turns on. Respects "at your own pace."
- **SMS as primary notification channel** — text-native, survives new-phone (same number), and needed for customers anyway. Push/ntfy is an optional free extra.
- **Separate A2P 10DLC brand for Archer** — Archer is a different LLC (ARCHERAIRBOATTOURS on SunBiz) than QRSTKR; carriers filter on brand/campaign match, especially when texting customers.
- **Peace River / fossil trips excluded** — Matlacha focus only.

## Gotchas

- **Twilio 10DLC filtering** — using QRSTKR's campaign for a different brand risks carrier filtering eating messages. Register Archer's own campaign.
- **iOS web push is limited** — not a blocker since operators are on Android, but don't design a flow that *depends* on iOS web push.
- **Public form must not read the schedule** — anon should INSERT only. Use a separate `booking_requests` table (or an Edge Function) so the anon key can't SELECT existing bookings.
- **Deep-link auth bounce** — if the SMS link opens on a fresh/logged-out phone, OTP first, then redirect back to the booking. Preserve the target id through the login round-trip.
- **Realtime + offline cache can disagree** — on reconnect, refetch the visible range rather than trusting stale cache.

## Dependencies

- Supabase (Postgres, Auth w/ phone provider, Realtime, Edge Functions, database webhooks)
- Twilio (SMS send + A2P 10DLC brand/campaign; optionally Twilio Verify for OTP)
- Hosting: Cloudflare Pages or Vercel (align with main site)
- Optional: ntfy.sh (free push bonus, reuse Bec & Call pattern), Resend (if any email ever added)
- Real tour data from Bobby/Elise (types, prices, durations, availability) before seeding
