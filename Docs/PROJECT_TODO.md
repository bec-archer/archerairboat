---
project: archer-airboat
last_updated: 2026-07-17
---

# Archer Airboat Tours — Project TODO

**Status legend:** ✅ Done | 🔧 In Progress | ⬜ Not Started

> Booking system tracking. Site rebuild + SEO + domains are tracked in `archer-airboat-takeover-handoff.md` (not synced).

---

## Foundation & Data Layer

- ✅ Supabase schema
- ✅ Row Level Security policies
- ✅ Phone-number authentication — dashboard config done + verified end-to-end 2026-07-17 (provider, hook + secret, dev test login)
- ✅ Realtime on bookings
- ✅ Seed data — Standard + Sunset seeded; solo price + Sunset details are PLACEHOLDER pending Bobby

---

## Operator PWA

- ✅ Installable PWA shell
- ✅ Calendar view
- ✅ Booking detail screen
- ✅ Manual booking management
- ✅ Today glance view
- ✅ Offline read caching
- ✅ Device recovery via OTP — verified 2026-07-17; any device + phone number + code = full app
- ✅ Days off calendar — tap-to-toggle month grid in Settings for out-of-town stretches (2026-07-17)

---

## Public Requests & Booking

- ✅ Request a Ride form
- ✅ Availability display
- ✅ Live online booking — built + verified server-side; stays dark behind the flag
- ✅ Go-live toggle
- ⬜ Availability preview mode — show open times on the site with call-to-book; warm-up rung before full online booking

---

## Notifications

- ✅ Booking-created webhook
- ✅ Operator SMS alert — simulated mode until Telnyx creds set
- ✅ Customer confirmation SMS — simulated mode until Telnyx creds set
- ✅ Morning-of reminder SMS — cron scheduled 11:00 UTC daily; verified run
- ⬜ Telnyx toll-free registration — pack prepped (Docs/Telnyx_Registration_Pack.md); Bec submits; no EIN needed; ~5 business day approval

---

## Reply-to-Confirm (v2)

- ⬜ Inbound SMS webhook

---

## Scope Changes

> Items moved in from Out of Scope — each entry triggers a scope_log event

- 2026-07-17: "Twilio A2P 10DLC registration" renamed to "Telnyx 10DLC registration" (provider decision), then same day to "Telnyx toll-free registration" (no-EIN path; see spec Decision Log; not out-of-scope moves, recorded so the sync renames are documented)
