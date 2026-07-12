# Archer Airboat Tours — Site Takeover Handoff

**Prepared for:** Bec (Slack Tide LLC)
**Business:** Archer Airboat Tours — Capt. Bobby Archer, Matlacha FL
**Status:** Site is *live and paid up*, but it's an empty GoDaddy Website Builder template. No actual outage ever happened. The "down" reports were local DNS + a `www` dead-end + a phantom domain spelling.

---

## TL;DR

- Nothing was ever broken at hosting/DNS. Payment went through, servers respond, HTTPS is valid.
- The live site is a blank GoDaddy Website Builder 8.0 template (Getty stock, placeholder headlines, © 2026, no phone/address/booking).
- **Canonical domain = `archerairboattours.com`** — it owns all the SEO/reviews/LLC name. This is not a close call.
- Current forwarding is **backwards**: the strong domain forwards into the empty one. Flip it.
- The old real site copy still exists in Google's index — recoverable for the rebuild.
- Plan: take over account access → fix forwarding + `www` → rebuild on your stack → repoint DNS → kill the Website Builder plan.
- **Promo video found** — Bobby's old overview clip is live on his own YouTube channel (embed as placeholder, swap in your drone/GoPro footage as the hero).
- **Booking:** staying call-first for now; a Supabase-backed **PWA** booking system is speced separately (`Archer_Airboat_Booking_Spec.md`) and goes live only when Bobby & Elise are ready.
- **Focus:** Matlacha coastal tours only. Peace River / fossil trips are *out* — established competitors, and Bobby wants to concentrate on Matlacha.

---

## The three domains you now manage

| Domain | Role | State | Action needed |
|---|---|---|---|
| **archerairboattours.com** | The real/canonical name (SEO, reviews, LLC) | Resolves; currently *forwards* to archerairboat.com | Make this the **primary** — the site should LIVE here |
| **archerairboat.com** (singular) | Where the empty builder site sits | Live, HTTP 200, empty template | Demote to a **forward → tours** once rebuilt |
| **archerairboats.com** (plural, NEW) | Defensive typo-catch you just bought | **On Cloudflare NS as of 2026-07-12** (Bec's account — registered via Cloudflare, GoDaddy 2FA still blocking the other two) | **Interim home for the new site (built with `PUBLIC_NOINDEX=1` — do NOT let Google index the plural).** After tours-domain cutover: 301 → tours (apex + www) |

**All three are on GoDaddy nameservers (`domaincontrol.com`)** so they're almost certainly in one account.

---

## SEO verdict: archerairboattours.com wins, hard

Evidence that "tours" is the canonical name:

- **TripAdvisor** — "Archer Airboat Tours," 5.0 ★ from 40 reviews, #5 of 21 in Matlacha, reviews dating to ~2017.
- **Old site indexed at `www.archerairboattours.com`** with real copy (mangroves of Matlacha Pass, dolphins/stingrays/redfish/snook/manatees). Google still holds it.
- **Florida SunBiz** LLC registration: **ARCHERAIRBOATTOURS**.
- **Facebook:** "BobbyArcherairboattours."
- Local backlinks (e.g. come-to-cape-coral.com) all say "Archer Airboat Tours."

**Implication:** the current `archerairboattours.com → archerairboat.com` forward pushes a decade of link authority into a blank page. Reverse it so the equity concentrates on the tours domain where the rebuilt site will live.

### Positioning: he owns an empty category

Every operator ranking for "airboat tour Fort Myers / Cape Coral / Naples" is an **Everglades** play — they van tourists out to a gator swamp, an hour-plus each way. Bobby is the opposite: **coastal saltwater, mangroves, dolphins, manatees, stingrays, sandbar walks, launched right in Matlacha.** Nobody else occupies that lane. The whole site + SEO thesis: don't fight the Everglades crowd for volume — own "coastal airboat, no Everglades drive, dolphins not gators."

### #1 free lever: Google Business Profile

Bobby shows up on TripAdvisor and Yahoo Local but I found **no Google Business Profile.** For "tourist searches 'airboat tour near me' and he pops up in the map pack," a claimed + optimized GBP moves the needle harder than anything on the site itself, and it's free. Verify/claim it during the account work — put it at the top of the list.

### Keyword tiers (Matlacha-focused)

- **Tier 1 — own outright (low competition, he's the only coastal option):** "Matlacha airboat tour," "Pine Island airboat tour," "Cape Coral airboat tour/ride," "airboat tour near Fort Myers," "Charlotte Harbor airboat tour," "Matlacha Pass / Pine Island Sound airboat."
- **Tier 2 — win on differentiation:** "airboat dolphin tour," "manatee airboat tour Southwest Florida," "private airboat tour SWFL," "sunset airboat tour Fort Myers," "family airboat tour Cape Coral."
- **Negative keywords (do NOT rank for):** airboat *repair*, *build*, *parts*, *sales* — the Archers stopped building boats. Keep the 30-years-experience credibility, but frame it as experience, not a service.
- **Trip-planning intent:** tourists search from out of state before arrival, so target "things to do in Cape Coral / Matlacha," not just "near me."

> Peace River / fossil trips: **cut.** Established competition + Bobby wants Matlacha focus.

---

## The `www` gotcha (this is likely the real "outage")

- `www.archerairboattours.com` → **NXDOMAIN**. The `www` record was never created.
- `www.archerairboat.com` → resolves fine.
- If Bobby's cards / signage / truck say **www.archerairboattours.com**, that URL dead-ends for *every visitor*. That alone explains "the site is down."

**Fix:** whatever domain ends up primary, make sure both apex **and** `www` resolve to the site. GoDaddy's forwarding UI has a "forward domain and www" option — tick it, or add the `www` CNAME manually.

---

## GoDaddy in-account checklist (do this during the Chrome/Cowork login)

1. **Confirm all 3 domains live in the same account.** If tours or plural is in a different account, the takeover gets messier — flag it.
2. **Products / renewals list:** GoDaddy bills domain renewal, the website plan, and email as *separate* line items. Confirm the "paid bill" hit the right product. Classic trap: domain renewed, website plan lapsed (or vice versa).
3. **Forwarding config** on archerairboattours.com + archerairboats.com → point both at the real site, apex + www. (Interim: forward to archerairboat.com. Post-rebuild: forward to wherever the new site lives.)
4. **Hunt for salvageable content:** in the Website Builder editor look for version history / unpublished drafts, or a separate older product (old GoCentral / WordPress). Determines if original photos/copy survived anywhere.
5. **Don't nuke his email.** Check for GoDaddy/Microsoft 365 email on the domain *before* touching DNS — repointing records can break his inbox.
6. **Get delegate access, not his password.** GoDaddy "Delegate Access" invitations exist for exactly this. Cleaner than sharing creds.

---

## Recovered business facts (raw material for the rebuild)

Pulled from public listings — verify with Bobby, but this is the starting content:

- **Operator:** Captain Bobby Archer (~30 years experience; built his own airboats). **Note:** no longer building or repairing boats — don't market repair/build. Co-captain wife Elise; shop dog Bo.
- **Phone:** (239) 633-6645
- **Location/launch:** Matlacha, FL — near D&D Bait & Tackle, 3922 Pine Island Rd NW ("big pink building" area).
- **What it is:** private airboat tours of Matlacha Pass, mangrove backwaters, Pine Island Sound / Charlotte Harbor. Boats reach ~1/4" of water — goes where nothing else can.
- **Wildlife:** dolphins, manatees, stingrays, snook, redfish, sharks, hermit crabs, wading birds; sandbar walk stops.
- **Tour types:** private ~1.5–2 hr tours; sunset tours. (Peace River fossil trips are *out* — Matlacha focus.)
- **Pricing referenced (old, VERIFY):** ~$250 for 1.5 hr / up to ~5–6 people; also seen as ~$50/person.
- **Social proof:** 5.0 ★ / 40 TripAdvisor reviews; Facebook page active.

> Note: the old tagline copy ("your very own private airboat tour through the mangroves of Matlacha Pass…") is still in Google's index — grab it as a starting voice reference, then make it yours.

---

## Promo video — FOUND ✅

- **URL:** `https://www.youtube.com/watch?v=yqt7Pe0jS9o` — title "ARCHER AIRBOAT TOURS (OVERVIEW)."
- **On Bobby's own channel** (@archerairboattours), posted June 2012. Confirmed live + embeddable. It's the only video on the channel, so this is the one Elise meant.
- **Rights:** his channel, so embedding is clean.
- **Use it:** SD and dated — embed as a placeholder now (Elise gets her win), then swap in your drone + GoPro cut as the hero the moment you have it. You inherit the channel too — reuse it for the new footage.

---

## Rebuild plan (the portfolio piece)

1. **Get account access** (delegate) + confirm domains/plan/email are clean.
2. **Fix forwarding now** so the live (empty) site at least stops dead-ending on `www` while you build.
3. **Build the real site on your stack.** Two lanes (pick one): **(A) Framer** — design-forward, built-in CMS, ~$30/mo Pro, zero maintenance, "designed it" portfolio piece; **(B) Astro + Keystatic on Cloudflare Pages** — ~free hosting, content in Git, you maintain it, full design-*engineer* portfolio piece. Leaning **B** for you; A only if you don't want to be the in-laws' permanent IT. Either way: don't rebuild inside Website Builder. **→ Lane B chosen 2026-07-12.**
4. **Point DNS** for `archerairboattours.com` at the new host (apex + www). Make it the canonical/primary.
5. **Forward** `archerairboat.com` + `archerairboats.com` → `archerairboattours.com` (301, apex + www).
6. **Retire the Website Builder plan** once the new site is live — stops Bobby's monthly builder fee too. 💸
7. Later, optional: transfer domains to Cloudflare (you already run Email Routing there) for cleaner DNS + free.

---

## Open decisions before you build

- **Canonical URL:** recommend `https://archerairboattours.com` (no www, 301 www→apex). SEO already backs the tours name.
- **Keep or migrate registrar:** GoDaddy is fine short-term; Cloudflare later for DNS sanity.
- **Content sourcing:** confirm you can get original photos from Bobby (the TripAdvisor/FB shots are user-uploaded — don't lift those). Fresh shoot = better portfolio anyway.
- **Stack lane: DECIDED 2026-07-12 → Lane B (Astro + Keystatic on Cloudflare).** Cost driver: $0/mo vs. Framer Basic $10/mo (handoff's $30 figure was the Pro tier). Keystatic verified actively maintained (Thinkmill, production-tested). Scaffold lives in `site/`; working docs in `dev/active/site-rebuild/`.
- **Booking:** resolved — call-first now, online booking built but toggled off until Bobby & Elise flip it on. Full build plan in `Archer_Airboat_Booking_Spec.md` + `dev/active/booking-system/`. Editing = **Keystatic-friendly** so Elise can manage content occasionally.

---

*Everything here is confirmed as of the investigation on 2026-07-12. Site was live and serving the whole time; no hosting outage occurred.*
