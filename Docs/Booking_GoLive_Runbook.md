# Booking System — Go-Live Runbook

**State as of 2026-07-17:** everything is built, deployed, and dark. The database schema, RLS, seed data, booking engine, Edge Functions, SMS pipeline (simulated mode), and the operator PWA all exist and passed verification. Public online booking is OFF (`online_booking_enabled = false`) and the public API refuses bookings server-side.

This runbook is the ordered list of remaining human steps, split into what **Bec** does once, and the single step **Bobby & Elise** do when they're ready.

---

## Part 1 — Bec's setup checklist (one sitting each)

### A. Supabase dashboard (Archer project: htvtwuudbbclmxgpzmet)

1. **Enable phone auth:** Authentication → Sign In / Up → enable Phone provider.
2. **Wire the OTP hook:** Authentication → Hooks → "Send SMS" hook → HTTPS endpoint → `https://htvtwuudbbclmxgpzmet.supabase.co/functions/v1/send-otp-sms`. Copy the generated secret.
3. **Set function secrets:** Edge Functions → Secrets:
   - `SEND_SMS_HOOK_SECRET` = the hook secret from step 2
   - `TURNSTILE_SECRET_KEY` = Turnstile secret (step B). Until then, use Cloudflare's always-passes test secret `1x0000000000000000000000000000000AA` for dev testing only.
   - `TELNYX_API_KEY` + `TELNYX_FROM` = after Telnyx approval (see `Telnyx_Registration_Pack.md`)
4. **Test phone numbers (dev):** Authentication → Sign In / Up → Phone → "Test phone numbers": add e.g. `+15005550101` with OTP `123456`. Lets you log into the PWA before Telnyx approval without sending any SMS.
5. **Create operator logins:** after Bobby's and Elise's real mobile numbers are known:
   - Authentication → Users → Add user → their phone numbers (creates auth.users rows), or just have them log in once via OTP after Telnyx is live (auto-creates).
   - Then link profiles (SQL editor):
     ```sql
     insert into public.profiles (id, display_name, phone, role)
     select id, 'Bobby Archer', phone, 'owner' from auth.users where phone = '<bobby e164>';
     insert into public.profiles (id, display_name, phone, role)
     select id, 'Elise Archer', phone, 'manager' from auth.users where phone = '<elise e164>';
     ```
   - **Without a profiles row a login sees no data** (RLS), so this step is what actually authorizes them.
   - Put both numbers in `settings.notifications.operator_phones` (SQL or app Settings later):
     ```sql
     update public.settings set value = jsonb_set(value, '{operator_phones}', '["+1239...","+1239..."]')
     where key = 'notifications';
     ```
6. **Free-tier pause (IMPORTANT before real use):** free projects pause after ~1 week of inactivity. Before Bobby depends on this, either upgrade the Archer project to Pro (~$10/mo, off the shop billing per the billing-boundaries rule) or accept the keep-alive risk. Decide before go-live, not after.

### B. Cloudflare Turnstile (5 minutes)

1. Cloudflare dashboard → Turnstile → Add widget. Hostnames: `archerairboattours.com`, `archerairboats.com`, `*.archerairboattours.com`, plus the workers.dev URL while testing.
2. Widget mode: Managed (invisible for most humans).
3. Copy the **site key** into `app/.env.local` (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and rebuild; copy the **secret key** into Supabase Edge Function secrets (`TURNSTILE_SECRET_KEY`).

### C. Deploy the PWA (from Bec's Terminal, in `app/`)

1. `npm install` then `npm run deploy` (builds static export + `wrangler deploy`, worker name `archer-booking`).
2. First deploy lands on `archer-booking.<account>.workers.dev`. Test everything there.
3. When tours-domain DNS is finally on Cloudflare: add custom domain `app.archerairboattours.com` to the worker. **Do not enable real SMS sends before this domain is live**, because the deep links in texts point at it (`settings.notifications.app_base_url`).
4. The main Astro site's "Book Now" nav can link to `https://app.archerairboattours.com/book/` whenever ready. While the flag is off that page shows the call-first message + request form link, so linking it early is safe.

### D. Telnyx

Follow `Telnyx_Registration_Pack.md`. Submit early; carrier approval is the long pole (1-3 weeks). Everything works in simulated mode meanwhile.

### E. Pre-go-live confirmations with Bobby (business facts, not tech)

- Solo rider price: currently 1-2 guests pay the $180 couples rate. Confirm or change in Settings → Tours.
- Sunset Tour: seeded with Standard pricing as placeholder. Confirm price, departure time behavior, or turn it off in Settings.
- Both flagged with ⚠ in the app's Settings screen until edited.

### F. Full dress rehearsal (after A-D done)

1. Log into the PWA as yourself (test number or real). Add a manual booking; confirm operator phones get the alert text and the deep link opens the ride.
2. Temporarily flip the go-live toggle ON, book a real slot through `/book/` with your own phone, confirm: booking appears on calendar instantly, operator alert arrives, customer confirmation arrives. Cancel the test ride, flip toggle OFF.
3. Check morning-reminder behavior by inserting a booking for today and POSTing the morning-reminders function once (or just trust the 7am cron the next morning).

---

## Part 2 — Bobby & Elise's go-live (the whole point)

When they're ready, and only then:

1. Open the app → Settings → **Online booking** → flip the switch ON.
2. That's it. The website's book page immediately starts showing live availability and taking bookings. Every online booking appears on the calendar in realtime and texts them both.
3. If it ever feels like too much: flip it OFF. The site instantly goes back to "call to book" and the request form. No data is lost, nothing breaks, and the paper calendar book keeps working alongside either way.

---

## Quick reference

| Thing | Where |
|---|---|
| Operator app | `https://app.archerairboattours.com` (interim: workers.dev URL) |
| Public booking page | same domain, `/book/` |
| Request form | `/request/` |
| Go-live flag | app Settings screen, or `settings.online_booking_enabled` |
| Booking rules (notice/horizon) | app Settings screen |
| Operator alert numbers | `settings.notifications.operator_phones` |
| Deep-link base URL | `settings.notifications.app_base_url` |
| Morning reminders | pg_cron `archer-morning-reminders`, 11:00 UTC daily |
| SMS provider | Telnyx (see registration pack); simulated until creds set |
