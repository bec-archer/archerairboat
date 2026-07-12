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

Reuses patterns Bec already runs: Supabase Edge Functions + webhooks (job-scraper pattern), Resend, Twilio A2P 10DLC (QRSTKR), ntfy.sh (Bec & Call). Stack: React/Next.js PWA + Supabase (Postgres, Auth, Realtime, Edge Functions).

---

## Milestone: Foundation & Data Layer

**Status:** in_progress
**Description:** Database schema, security, and phone-based auth that everything else builds on.

### Features

- Supabase schema — bookings, customers, tour_types, availability_rules, blackout_dates, profiles tables
- Row Level Security policies — operator-only read/write on bookings; public insert-only on booking_requests
- Phone-number authentication — Supabase SMS OTP login for Bobby and Elise, no email required
- Realtime on bookings — operator views update live when a booking changes
- Seed data — tour types and Bobby's default weekly availability

---

## Milestone: Operator PWA

**Status:** planned
**Description:** The installable web app Bobby & Elise use to see and manage rides on any device.

### Features

- Installable PWA shell — add-to-home-screen, service worker, app icon
- Calendar view — month/week/day view of confirmed rides and pending requests
- Booking detail screen — the deep-link target opened from an SMS alert
- Manual booking management — create, edit, confirm, and cancel a ride by hand
- Today glance view — simplified read-only "today's rides" for Bobby
- Offline read caching — today and upcoming rides viewable with no signal
- Device recovery via OTP — new phone logs back in via SMS code with all data intact

---

## Milestone: Public Requests & Booking

**Status:** planned
**Description:** The customer-facing request form now, and true online booking gated behind an Elise-controlled switch.

### Features

- Request a Ride form — public website form writing to booking_requests (call-first phase)
- Availability display — public "here's Bobby's availability" view
- Live online booking — customer books an open slot, writes a confirmed booking that appears on the calendar instantly
- Go-live toggle — feature flag Bobby & Elise control to turn public online booking on or off

---

## Milestone: Notifications

**Status:** planned
**Description:** SMS alerts to operators and customers, driven by database events.

### Features

- Booking-created webhook — Supabase database webhook on new booking fires an Edge Function
- Operator SMS alert — Twilio SMS to Bobby and Elise with ride details and a deep link to the calendar
- Customer confirmation SMS — text to the customer when their ride is confirmed
- Morning-of reminder SMS — scheduled reminder the day of the ride to cut no-shows
- Twilio A2P 10DLC registration — dedicated brand and campaign for Archer Airboat Tours

---

## Milestone: Reply-to-Confirm (v2)

**Status:** planned
**Description:** Let Bobby confirm or release a slot by replying to the alert text, no app needed.

### Features

- Inbound SMS webhook — Bobby texts back yes or no to confirm or release a slot

---

## Out of Scope

- Online payment and deposits — call-first for now; payment is a later phase
- Native iOS or Android apps — PWA covers both platforms, no app-store builds
- Multi-boat or multi-captain scheduling — single operator (Bobby) only
- Peace River / fossil-trip booking — Archer is concentrating on Matlacha tours only
- Customer accounts and login — customers book without creating an account
- Email notifications — SMS only, since there may be no email for Bobby or Elise
