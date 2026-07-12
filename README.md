# Archer Airboat Tours

Site rebuild + booking system for Archer Airboat Tours (Capt. Bobby Archer, Matlacha FL).

- `site/` — public website. Astro 7 + Keystatic (dev-only admin at `/keystatic`), deploys static to Cloudflare. `cd site && npm install && npm run dev`.
- `supabase/migrations/` — schema + RLS, applied to the Archer Supabase project.
- `Docs/` — booking system spec + project TODO (synced to slack-tide dashboard).
- `dev/active/` — working docs for in-progress features.
- `archer-airboat-takeover-handoff.md` — domains, SEO, positioning source of truth.

See `CLAUDE.md` for conventions and hard constraints.
