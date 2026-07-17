# Telnyx Toll-Free Registration Pack — Archer Airboat Tours

**Purpose:** everything prefilled so Bec can complete Telnyx signup + toll-free verification in one sitting. Approval is typically ~5 business days (can run longer), so submit early. Nothing else in the booking system waits on it: SMS runs in simulated/logged mode until the creds exist.

**Why toll-free (decision 2026-07-17):** no EIN or tax ID required (the LLC's EIN status is unknown), verification itself is free, and there are no TCR brand/campaign fees at all. One 8XX number covers OTP, booking alerts, customer confirmations, reminders, and future reply-to-confirm inbound. Trade-off accepted: texts come from a toll-free number instead of a local 239 number.

**Cost summary:** $0 verification, ~$1-2/mo for the number, ~$0.0055/msg + carrier passthrough. Expect a few dollars a month at Archer's volume.

---

## Step 1 — Create the Telnyx account

1. Sign up at telnyx.com with an email Bec controls (swap to an @archerairboattours.com address later, same note as the Supabase account).
2. Add a payment method and a small balance ($20 is plenty to start).
3. Mission Control Portal is the dashboard; everything below happens there.

## Step 2 — Buy the toll-free number

1. Numbers → Search & Buy → filter **Toll-free**. Any 8XX works; pick a memorable one if available.
2. Buy it. This becomes `TELNYX_FROM`.
3. Create a **Messaging Profile** (Messaging → Profiles → new, defaults fine, name it `archer-booking`) and assign the number to it.

## Step 3 — Submit toll-free verification

Numbers → the toll-free number → Messaging verification (or Messaging → Toll-free verification). Values:

| Field | Value |
|---|---|
| Business name | Archer Airboat Tours (ARCHERAIRBOATTOURS LLC) |
| Business address | The LLC's registered address (SunBiz has it; confirm with Bobby) |
| Business website | https://archerairboattours.com |
| Business email / contact | Bec's email + phone; contact person: Bec's first + last name (a real person, not a department) |
| Expected volume | Lowest tier (under 1,000/month) |
| Use case | Customer care / appointment notifications (pick the closest offered; 2FA as secondary if multi-select) |
| Use case description | Booking notifications and account sign-in codes for a small airboat tour operator in Matlacha, FL. Customers who book a tour receive a booking confirmation and a morning-of reminder. The two business operators receive new-booking alerts and sign-in codes. Low volume: a handful of messages per day. |
| Opt-in workflow description | Customers opt in by submitting the booking or ride-request form on archerairboattours.com. The phone field displays: "By booking you agree to receive booking-related texts (confirmation and a morning-of reminder) from Archer Airboat Tours. Message and data rates may apply. Reply STOP to opt out." Operators opt in by configuring their own numbers in the business's booking app. |
| Opt-in evidence link | URL of the live booking page showing the consent text under the phone field (use the workers.dev `/request/` URL until the real domain is live; a screenshot link also works) |
| Sample message 1 | You're booked with Archer Airboat Tours! Standard Tour, Fri Aug 7 at 10:00 AM, 4 guests. $260 due at the dock. We launch from Matlacha — questions? Call (239) 633-6645. |
| Sample message 2 | Reminder: your Archer Airboat Tour is TODAY at 10:00 AM! We launch from Matlacha (near D&D Bait & Tackle, 3922 Pine Island Rd NW). Running late or need us? (239) 633-6645 |
| Sample message 3 | Your Archer Airboat Tours sign-in code is 123456. It expires in 5 minutes. |

> No EIN, no tax ID, no TCR brand or campaign anywhere in this flow. Sample messages match what the deployed Edge Functions actually send.

**Important:** toll-free numbers cannot send ANY messages until verification is approved. Simulated mode covers us meanwhile.

## Step 4 — Wire the creds into Supabase

Once verification is approved:

1. Telnyx portal → API Keys → create key.
2. Supabase dashboard (Archer project) → Edge Functions → Secrets, add:
   - `TELNYX_API_KEY` = the key
   - `TELNYX_FROM` = the toll-free number in E.164 (+18XXXXXXXXX)
3. That's it. All three functions (notify-booking, morning-reminders, send-otp-sms) flip from simulated-log mode to real sends automatically. No redeploy.

## Step 5 — Smoke test

1. Put Bec's own number in `settings.notifications.operator_phones` (app Settings screen or SQL).
2. Add a manual test booking in the operator app → Bec's phone should get the operator alert text.
3. Delete the test booking after.

---

## Fallback if verification stalls

If toll-free verification drags past a couple of weeks or gets rejected: the sole-proprietor 10DLC path (registers under Bobby's personal name, no EIN, local 239 number, ~$19 setup + $3/mo, ~1,000 msgs/day cap) is the plan B. Same Telnyx account, buy a local number, register sole-prop brand + campaign, swap `TELNYX_FROM`.

*Prepared 2026-07-17. Requirements verified against Telnyx's toll-free verification guide that date; EIN confirmed not required.*
