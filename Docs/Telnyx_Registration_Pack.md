# Telnyx 10DLC Registration Pack — Archer Airboat Tours

**Purpose:** everything prefilled so Bec can complete Telnyx signup + A2P 10DLC registration in one sitting. Carrier approval has lead time (LLC path is typically 1-3 weeks), so submit this early. Nothing else in the booking system waits on it: SMS runs in simulated/logged mode until the creds exist.

**Cost summary:** ~$20 one-time (brand $4.50 + campaign vetting $15), then ~$2.50/mo ($1 number + $1.50 Low Volume Mixed campaign), ~$0.007 per message all-in. Expect roughly $4-7/mo at Archer's volume.

---

## Step 1 — Create the Telnyx account

1. Sign up at telnyx.com with an email Bec controls (swap to an @archerairboattours.com address later, same note as the Supabase account).
2. Add a payment method and a small balance ($20 is plenty to start).
3. Mission Control Portal is the dashboard; everything below happens there.

## Step 2 — Buy the number

1. Numbers → Search & Buy. Filter: **local**, area code **239** (Fort Myers / Cape Coral). Pick something readable if available.
2. Buy it ($1/mo). This becomes `TELNYX_FROM`.
3. Create a **Messaging Profile** (Messaging → Profiles → new, defaults are fine, name it `archer-booking`) and assign the number to it.

## Step 3 — Register the 10DLC brand (the LLC)

Messaging → 10DLC → Brands → create. Values:

| Field | Value |
|---|---|
| Entity type | Private company (LLC) |
| Legal business name | **ARCHERAIRBOATTOURS LLC** (exactly as on SunBiz) |
| DBA / brand name | Archer Airboat Tours |
| EIN | **NEEDED FROM BOBBY** (the LLC's federal EIN; SunBiz shows the document number, not the EIN) |
| Country | US |
| Address | The LLC's registered address (SunBiz has it; confirm with Bobby) |
| Website | https://archerairboattours.com |
| Vertical | Travel / Leisure (or Tourism if listed) |
| Contact | Bec's email + phone as the point of contact |

Brand fee: $4.50 one-time.

## Step 4 — Register the campaign

Messaging → 10DLC → Campaigns → create, linked to the brand:

| Field | Value |
|---|---|
| Use case | **Low Volume Mixed** ($1.50/mo, covers OTP + notifications together) |
| Description | Booking notifications and account sign-in codes for a small airboat tour operator in Matlacha, FL. Customers receive a booking confirmation and a morning-of reminder for tours they booked. The two business operators receive new-booking alerts and sign-in codes. |
| Message flow / opt-in description | Customers opt in by submitting the booking or ride-request form on archerairboattours.com, which states: "By booking you agree to receive booking-related texts (confirmation and a morning-of reminder) from Archer Airboat Tours. Message and data rates may apply. Reply STOP to opt out." Operators opt in by having their numbers configured in the business's own booking app. |
| Sample message 1 | You're booked with Archer Airboat Tours! Standard Tour, Fri Aug 7 at 10:00 AM, 4 guests. $260 due at the dock. We launch from Matlacha — questions? Call (239) 633-6645. |
| Sample message 2 | Reminder: your Archer Airboat Tour is TODAY at 10:00 AM! We launch from Matlacha (near D&D Bait & Tackle, 3922 Pine Island Rd NW). Running late or need us? (239) 633-6645 |
| Sample message 3 | Your Archer Airboat Tours sign-in code is 123456. It expires in 5 minutes. |
| Sample message 4 | Archer: Jane Smith — Standard Tour, Fri Aug 7 at 10:00 AM, 4 guests ($260) [BOOKED ONLINE]. Details: https://app.archerairboattours.com/a/?id=... |
| Embedded links | Yes (deep links to the booking app) |
| Embedded phone numbers | Yes ((239) 633-6645 appears in messages) |
| Age-gated / direct lending | No |
| Opt-out | STOP handling: leave Telnyx's automatic opt-out handling ON (default) |

Vetting fee: $15 one-time. Then assign the campaign to the number / messaging profile.

> Sample messages above match what the deployed Edge Functions actually send (notify-booking, morning-reminders, send-otp-sms). If the copy changes later, it doesn't need re-registration unless the use case itself changes.

## Step 5 — Wire the creds into Supabase

Once the campaign is approved and the number is assigned:

1. Telnyx portal → API Keys → create key.
2. Supabase dashboard (Archer project) → Edge Functions → Secrets, add:
   - `TELNYX_API_KEY` = the key
   - `TELNYX_FROM` = the purchased number in E.164 (+1239XXXXXXX)
3. That's it. All three functions (notify-booking, morning-reminders, send-otp-sms) flip from simulated-log mode to real sends automatically. No redeploy.

## Step 6 — Smoke test

1. Put Bec's own number in `settings.notifications.operator_phones` (app Settings screen or SQL).
2. Add a manual test booking in the operator app → Bec's phone should get the operator alert text.
3. Delete the test booking after.

---

*Prepared 2026-07-17. Pricing/fees verified against telnyx.com pricing pages and 10DLC support docs on that date.*
