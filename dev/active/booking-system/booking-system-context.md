# Booking System — Context

## Key Files

- `app/` — Next.js 15 static-export PWA (operator app + public pages). `npm run deploy` = build + wrangler deploy (worker `archer-booking`)
  - `src/app/calendar|today|requests|settings|login|new` — operator screens (AppShell requires session)
  - `src/app/a/page.tsx` — deep-link booking detail, `/a/?id=<uuid>` (query param; goes in every SMS, never change)
  - `src/app/request|book` — public pages (Turnstile, consent copy); `/book/` renders call-first when flag off
  - `src/lib/` — supabase client, data hooks (Realtime + refetch-on-event), pricing, dates (ET slot math), offline snapshot, publicApi (Edge Function client)
  - `public/sw.js` — network-first shell cache; never intercepts cross-origin
  - `.env.local` — committed on purpose; public values only (see app/.gitignore note)
- `supabase/migrations/` — 6 files; 3-6 written this session (pricing+seed, booking engine, notifications wiring, advisor cleanup). Applied live via MCP; files are the repo mirror.
- `supabase/functions/` — `booking-api` (public door: config/slots/request/book), `notify-booking` (trigger target), `morning-reminders` (cron target), `send-otp-sms` (auth hook). Each carries its own `sms.ts` copy (co-located on purpose so MCP + CLI deploys behave identically).
- `Docs/Booking_GoLive_Runbook.md` — ordered human steps (Bec setup, Bobby/Elise go-live)
- `Docs/Telnyx_Registration_Pack.md` — prefilled 10DLC registration
- `user-manual.md` — Bobby/Elise-facing manual (repo root)

## Decisions

(Authoritative list with dates: spec Decision Log. Highlights:)

- **Telnyx over Twilio** — one vendor for OTP hook + notifications + future inbound; ~$4-7/mo; carrier registration unavoidable with any provider.
- **Static export on Workers Static Assets, not OpenNext** — app is client-side + Supabase; same wrangler flow as the Astro site; Edge Functions are the server layer.
- **Zero anon table access** — booking-api Edge Function is the only public door; Turnstile verified server-side; rules enforced in SECURITY DEFINER SQL (`get_open_slots`, `create_online_booking` with advisory lock).
- **Deep link `/a/?id=`** — static export can't do dynamic path segments.
- **Config lives in `settings` rows** (flag, booking_rules, notifications: operator_phones + app_base_url) — editable without redeploys; Telnyx creds are the only true env secrets.
- **PWA, phone OTP, all state in Supabase, go-live flag, Matlacha only** — unchanged from original design.

## Gotchas

- **TypeScript 7 breaks Next 15 path aliases** (`@/*` module-not-found at build). Pin `typescript@5.9`.
- **Supabase default privileges** grant function EXECUTE to anon/authenticated/service_role explicitly — `revoke from public` is not enough; revoke each role (v6), and re-grant service_role after a sweep (v4 did this).
- **`generate_series` doesn't accept time-of-day types** — generate over `p_day::timestamp + start_time` instead.
- **The v1 policy name was "public can submit a request"** — dropping guessed policy names silently no-ops; advisors caught the survivor.
- **Publishable key passes verify_jwt** on Edge Functions gateway — pg_net triggers authenticate with it (it's public anyway); Telnyx secrets never appear in SQL or repo.
- **Turnstile fails closed** — no `TURNSTILE_SECRET_KEY` secret = all public submissions 403. Intentional. Set the secret (test value during dev) or the forms are dead air.
- **Don't enable real SMS before `app.archerairboattours.com` is live** — deep links in texts point there (`settings.notifications.app_base_url`).
- **Realtime + offline cache can disagree** — hooks refetch the whole visible range on any event/reconnect instead of patching from payloads.
- **iOS web push still limited** — not a blocker (operators on Android); nothing depends on push.

## Dependencies

- Supabase (Archer's own free account — NOT the SR80 org; see billing-boundaries memory)
- Telnyx (account not yet created — Bec, see registration pack; EIN needed from Bobby)
- Cloudflare (Workers deploy from Bec's Mac; Turnstile widget pending; tours-domain DNS still hostage to GoDaddy 2FA)
- Real data still owed by Bobby: solo price, Sunset details, his + Elise's mobile numbers
