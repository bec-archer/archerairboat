# Site Rebuild — Tasks

**Last updated:** 2026-07-12 (session 3, full-bleed hero + rates)

## In Progress

- [ ] First push to GitHub (bec-archer/archerairboat) + first `npm run deploy:staging` → site live at **archerairboats.com** (apex + www, noindex) → text link to Bobby & Elise

## Done

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
- [ ] Cloudflare deploy (Workers static assets) from the GitHub repo → custom domain **archerairboats.com** (already on Cloudflare NS, Bec's account). Build with `PUBLIC_NOINDEX=1` until the tours domain cuts over — the plural must not accumulate SEO equity
- [ ] Google Business Profile claim/optimize (biggest free SEO lever)
- [ ] Request-a-Ride form embed → Supabase booking_requests
- [ ] Decide Elise editing flow (Keystatic Cloud / GitHub mode / Bec-only)
- [ ] Wire homepage copy to the Keystatic `site` singleton (currently verified constants in index.astro)
- [ ] Tour cards from the `tours` collection — rates are live on the homepage (2026-07-12); still need tour names/types/sunset details from Elise before creating collection entries

## Blocked / Parked

- [ ] DNS cutover + domain forwarding fix + Website Builder retirement — blocked by: GoDaddy delegate access

## Notes

- **Before launch: confirm the two people in the sandbar-walk photo are OK being on the site** (PXL_20240728_162717294.jpg).
- **Do NOT lift images from archerairboat.com** — the builder template uses Getty stock (licensing risk). Old site *copy* (Bobby's own text in Google's index) is fine.
- Rates seed data for the booking system now partially exists (see Rates section entry) — booking-system seed still needs tour type names/durations beyond the single 1.5hr ride.
- `astro preview` needs an adapter in Astro 7 — preview the static build with any static server (`python3 -m http.server` in `dist/`) or just use `npm run dev`.
- Video embed shows broken in sandboxed screenshots only (YouTube blocked there) — fine in real browsers.
