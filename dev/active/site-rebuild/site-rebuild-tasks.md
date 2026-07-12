# Site Rebuild — Tasks

**Last updated:** 2026-07-12 (session 3, GO LIVE: hero/rates/mobile + domain cutover)

## In Progress

- [ ] archerairboat.com (singular) 301 forwarding at GoDaddy → tours: **saved** (apex + www, https, 301, 2FA'd by Bobby/Elise) but GoDaddy activation pending (up to a few hours, SSL cert). Claude checks again ~8pm ET 2026-07-12
- [ ] Retire GoDaddy **Business Website Builder** plan on archerairboattours.com (billing action, Bec clicks) — **only after the singular's forwarding is confirmed live** (the builder currently answers on archerairboat.com). Also: GoDaddy "Email Marketing Starter" expires 8/4/2026 — unused, let it lapse, do NOT renew

## Done

- [x] **SITE IS LIVE at https://archerairboattours.com** (2026-07-12) — apex + www, indexable, canonical correct. Bobby & Elise gave the all-clear on the staging build first.
- [x] First push to GitHub (bec-archer/archerairboat) + staging deploy to archerairboats.com → link sent to Bobby & Elise. Pre-push fix: `images/flats-hero.psd` (156MB, over GitHub's 100MB limit) stripped from history via amend; `*.psd` gitignored; local branch `backup-pre-psd-strip` holds the old history (never push it)
- [x] Mobile polish round (2026-07-12, from Bec's phone review): header overflow fix (no h-scroll 320–430px), hero reframed so the boat sits between headline and lede, Rates prices to Montserrat (Fraunces top-heavy 8), crew copy (Elise + Beauregard), site-wide em-dash purge
- [x] DNS cutover (2026-07-12): archerairboattours.com zone added to Bec's Cloudflare (free), all 15 records imported DNS-only **including the Microsoft 365 MX/SPF/autodiscover set — ask Bobby if he ever had an @archerairboattours.com mailbox; no active M365 product in the GoDaddy account, likely leftovers**. DNSSEC was off. NS swapped at GoDaddy → jean/rocky.ns.cloudflare.com, propagated in minutes. Old apex A records deleted; Workers custom domains attached (tours + plural, apex + www each)
- [x] 301 redirect rule on archerairboats.com zone → tours (all requests, path + query preserved, verified live)

- [x] Lane decision — Lane B: Astro + Keystatic on Cloudflare (2026-07-12, verified pricing/maintenance first)
- [x] Scaffold `site/` — Astro 7 + Keystatic (dev-only admin), content schemas, homepage skeleton with verified facts
- [x] Production build verified green; `/` and `/keystatic` smoke-tested in dev
- [x] Design direction chosen — **bright coastal** (sand/aqua/deep-sea-ink, coral accent)
- [x] Design pass v1 — tokens (`src/styles/tokens.css`), self-hosted type (Fraunces Variable display + Nunito Sans Variable body via @fontsource), component structure (SiteHeader, Hero, Wildlife, WhyCoastal, PhotoStrip, VideoSection, BookCta, SiteFooter), homepage rebuilt. Build green; desktop + mobile screenshots verified.
- [x] Real photography integrated from `images/` — hero: boat on sandbar; photo strip: mangroves / sandbar walk / sunset. Astro `<Image>` optimization (1MB+ JPGs → 16–98kB webp). Skipped: trailer shot, fish photo (Meet-the-Captain candidate, ask Bobby).
- [x] Full-bleed hero (2026-07-12) — new `flats-hero` drone shot spans the viewport, copy overlaid left with scrim; light text, mobile bottom-anchored variant. Source PNG (6.5MB) converted to 890kB JPEG in `src/assets`; Astro emits 158–553kB webp variants. Desktop + mobile screenshots verified.
- [x] **Rates section** (2026-07-12) — confirmed by Elise via Bec: **couple ride $180 flat; 3+ riders $65/person; ~1.5 hr ride; 6 person max**. New `Rates.astro` between video and BookCta. These are the ONLY confirmed numbers — no sunset/solo pricing invented.
- [x] Draft-depth copy corrections from Bobby (2026-07-12) — wildlife blurb now "draws about two inches" (was "quarter inch"); hero lede softened to "float in inches of water" to stay consistent.

## Up Next

- [ ] Tours / Meet the Captain / FAQ / Contact pages (keyword-driven titles per handoff tiers)
- [ ] schema.org JSON-LD (LocalBusiness + TouristTrip) + sitemap
- [ ] Google Business Profile claim/optimize (biggest free SEO lever) — setup pack ready at `Docs/GBP_Setup_Pack.md`; blocked on the 4-item ASK list in that doc (address, hours, opening year, photo sign-off)
- [ ] Request-a-Ride form embed → Supabase booking_requests
- [ ] Decide Elise editing flow (Keystatic Cloud / GitHub mode / Bec-only)
- [ ] Wire homepage copy to the Keystatic `site` singleton (currently verified constants in index.astro)
- [ ] Tour cards from the `tours` collection — rates are live on the homepage (2026-07-12); still need tour names/types/sunset details from Elise before creating collection entries

## Blocked / Parked

_(nothing currently blocked)_

## Notes

- **Before launch: confirm the two people in the sandbar-walk photo are OK being on the site** (PXL_20240728_162717294.jpg).
- **Do NOT lift images from archerairboat.com** — the builder template uses Getty stock (licensing risk). Old site *copy* (Bobby's own text in Google's index) is fine.
- Rates seed data for the booking system now partially exists (see Rates section entry) — booking-system seed still needs tour type names/durations beyond the single 1.5hr ride.
- `astro preview` needs an adapter in Astro 7 — preview the static build with any static server (`python3 -m http.server` in `dist/`) or just use `npm run dev`.
- Video embed shows broken in sandboxed screenshots only (YouTube blocked there) — fine in real browsers.
