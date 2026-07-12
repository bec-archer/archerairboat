# Site Rebuild — Context

## Key Files

- `site/astro.config.mjs` — integrations; Keystatic excluded from prod builds via `SKIP_KEYSTATIC`
- `site/keystatic.config.ts` — CMS schemas: `site` singleton, `tours` + `testimonials` collections (local storage mode)
- `site/src/content.config.ts` — Astro content collections mirroring the Keystatic schemas
- `site/src/layouts/Base.astro` — HTML shell, meta/OG tags, global styles
- `site/src/pages/index.astro` — homepage skeleton (verified facts only)
- `site/content/` — where Keystatic writes entries (empty until Elise's data)

## Decisions

- **Lane B (Astro + Keystatic on Cloudflare), decided 2026-07-12** — $0/mo vs Framer Basic $10/mo; content in Git; portfolio value. Verified same day: Keystatic actively maintained by Thinkmill (production-tested on their client sites, ~15K npm weekly downloads); Framer Basic is $10/mo not $30 (handoff's number was Pro tier) but still recurring.
- **Cloudflare Workers static assets, not Pages** — Pages remains supported, but Cloudflare steers new projects to Workers; same free tier and git workflow, avoids a later migration.
- **Keystatic dev-only for now** — `storage: { kind: 'local' }`, admin at `/keystatic` in dev; prod build fully static (no adapter). Elise-editing story is an open question, don't promise it yet.
- **youtube-nocookie embed** for the 2012 promo video (privacy-enhanced, no consent banner needed).
- **Booking integration** — public form will INSERT into Supabase `booking_requests` with the anon key (insert-only RLS already deployed).

## Gotchas

- **Astro is v7 now** (not v5 as older docs/memory assume). `@keystatic/astro@5.2.0` peer-supports astro 7 — checked via `npm view`.
- **`create-astro` template fetch fails in the Cowork sandbox** (GitHub template download blocked). Scaffold was hand-authored; installs from npm registry work fine.
- **Keystatic README still says "experimental"** — it's said that for years; Thinkmill ships client sites on it. Not a blocker, but pin versions and test before upgrading.
- **Don't invent tour data** — `tours` collection stays empty until Elise confirms names/durations/prices. Same for availability.
- **No repair/build/parts marketing anywhere** — negative SEO keywords per handoff; 30 years experience framing only.

## Dependencies

- npm: astro ^7, @keystatic/core ^0.5, @keystatic/astro ^5, @astrojs/react, @astrojs/markdoc, react 19
- Cloudflare account (deploy + later DNS + Email Routing for Archer email)
- GoDaddy delegate access (cutover only)
- Real content: tour data from Elise, photos from Bobby
