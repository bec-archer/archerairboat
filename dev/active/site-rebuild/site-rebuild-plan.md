# Site Rebuild — Plan

**Created:** 2026-07-12
**Status:** accepted

## Goal

Rebuild archerairboattours.com as a fast, SEO-focused static site that owns the "coastal airboat tour, no Everglades drive" positioning from the takeover handoff. Lane B chosen (2026-07-12): Astro + Keystatic, hosted free on Cloudflare, content in Git. Keeps recurring cost at $0 (vs Framer Basic $10/mo) and doubles as the design-engineer portfolio piece.

## Approach

**Stack:** Astro 7 (static output) + Keystatic (local mode for now) + Cloudflare Workers static assets (Cloudflare steers new projects there over Pages; same free tier, no future migration). Site lives in `site/` in this repo.

1. Scaffold — DONE. `site/` with Keystatic wired dev-only (`SKIP_KEYSTATIC=1` on build keeps production fully static, no adapter needed). Content collections: `tours`, `testimonials` (schemas only — entries wait on Elise's real data), `site` singleton for phone/location/tagline/video.
2. Design pass — real layout, typography, coastal palette, photography placeholders. Homepage skeleton exists with verified facts only (phone, launch location, 2012 video embed).
3. Pages — Home, Tours (cards from collection once data lands), Meet the Captain (30-years framing, NO repair/build marketing), FAQ, Contact. Tier 1/2 keywords from handoff drive titles/H1s.
4. SEO plumbing — per-page meta, schema.org LocalBusiness + TouristTrip JSON-LD, sitemap, canonical = https://archerairboattours.com (no www, 301 www→apex).
5. Deploy — Cloudflare (Workers static assets), preview URL for Bobby & Elise sign-off.
6. Cutover — DNS for archerairboattours.com → Cloudflare; 301 archerairboat.com + archerairboats.com → tours domain (apex + www both resolving — the www dead-end was the original "outage"); retire GoDaddy Website Builder plan.
7. Post-launch — Google Business Profile claim/optimize; Request-a-Ride form embed posting to Supabase `booking_requests` (anon insert-only, already live).

## Open Questions

- Elise editing flow: Keystatic local mode means only Bec edits (via dev). If Elise should edit content herself, evaluate Keystatic Cloud / GitHub mode and what auth she'd need — verify before promising her a CMS.
- Photography: fresh shoot vs whatever originals Bobby has. TripAdvisor/FB shots are user-uploaded — can't lift them.
- Timing of GoDaddy delegate access + DNS move to Cloudflare (blocks deploy cutover, not the build).
