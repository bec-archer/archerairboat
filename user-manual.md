# Archer Airboat Tours — Booking App Manual

For Captain Bobby and Elise. No tech background needed. If anything here doesn't work like it says, call Bec.

---

## The one-sentence version

Your whole schedule lives in the app at **app.archerairboattours.com**, it updates itself the moment anything changes, and you both get a text whenever someone books a ride.

## Getting in

1. Open **app.archerairboattours.com** on your phone.
2. Type your phone number, tap **Text me a code**, type the 6-digit code from the text. You're in.
3. To make it feel like a real app: your phone will offer "Add to Home screen" (or use the browser menu). Tap it, and the Archer icon shows up next to your other apps.

**Dropped your phone in the water?** Nothing is lost. Every booking lives safely in the cloud, not on the phone. Get any phone, keep the same number, log in the same way, and everything is exactly where you left it.

## The Calendar tab

- Dots on a day mean rides. Tap any day to see them listed with time, name, party size, and tour.
- An orange dot is a ride that is not confirmed yet; blue means confirmed.
- When Elise confirms or adds a ride, Bobby's screen updates by itself within a second or two. No refreshing.
- **+ Add ride** puts a booking in by hand: name, phone, date, time, tour, number of guests. Same as writing it in the paper book, except the app also knows the price and texts you both.
- No signal out on the water? The app still shows the last schedule it saw and tells you it's offline.

## The Today tab

Bobby's view. Today's rides in big letters: time, name, how many guests, phone number. Tap the phone number to call the customer. Nothing to press wrong.

## The Requests tab

When someone fills out the "request a ride" form on the website, it lands here (and you both get a text). For each request:

- **Called them** marks that you reached out.
- **Book it** turns the request into a real ride on the calendar (name and phone come along for the ride).
- **Close** removes it if it went nowhere.

## Tapping a ride (from a text or the calendar)

The text alerts include a link straight to that ride. Open it and you can:

- **Confirm** a pending ride (this also texts the customer their confirmation)
- **Edit** anything about it
- **Cancel** it
- **Mark done** after the ride happens

## The Settings tab

- **Online booking** — THE switch. See below.
- **Tours & prices** — change names, prices, length, guest limits. Anything with a ⚠ is a number Bec had to guess at; fix it when you know the real answer.
- **Days & hours** — which days you run and between what hours. Tap a closed day to open it, hit ✕ to close a day. Add **days off** for holidays, weather, doctor visits, whatever. Online customers can never book a closed day.
- **Online booking rules** — how much heads-up you need (starts at 48 hours) and how far ahead people can book (starts at 90 days).

Every change here takes effect immediately, including on the public website.

## The big switch: online booking

Right now the website tells people to **call you**, and the most they can do is send a request. That doesn't change until YOU change it.

When you're ready: Settings → Online booking → flip it ON. From that moment, customers can see your open times and book them directly. Every online booking:

1. shows up on your calendar instantly,
2. texts you both the details with a link to the ride,
3. texts the customer a confirmation, and a reminder the morning of.

They pay at the dock like always; the app just tells them the price up front.

Feels like too much? Flip it OFF. The website goes right back to call-us mode. Nothing is lost, and you can flip it on again whenever. The paper book keeps working alongside the app the whole time; the app is a helper, not a replacement.

---

## For Bec (technical quick reference)

- Setup + go-live steps: `Docs/Booking_GoLive_Runbook.md`
- Telnyx/SMS registration: `Docs/Telnyx_Registration_Pack.md`
- App code: `app/` (Next.js static export → Cloudflare Workers, `npm run deploy`)
- Backend: `supabase/` (migrations + booking-api / notify-booking / morning-reminders / send-otp-sms Edge Functions)
- Business rules all live in SQL; the flag is `settings.online_booking_enabled`
