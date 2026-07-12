# CLAUDE.md — Archer Airboat Tours

Site rebuild + custom booking system for **Archer Airboat Tours** (Capt. Bobby Archer, Matlacha FL). Client is Bec's father-in-law; Bec has full creative freedom and this is also a portfolio piece, so the bar is high.

## Read first (source of truth — beats anything in memory)

1. `archer-airboat-takeover-handoff.md` — site, SEO, domains, positioning, recovered business facts, the video
2. `Docs/Archer_Airboat_Booking_Spec.md` — booking system milestones + scope
3. `Docs/PROJECT_TODO.md` — current status of every feature
4. `dev/active/*/` — working docs for any in-progress feature (plan / context / tasks)

At the start of a fresh session, use the **session-start** skill to catch up before doing work.

## Working style

- Bec is the developer. **Write code directly into files.** No "here's a prompt to paste into Claude Code" handoffs unless she explicitly asks for one.
- Ask before executing when the goal, audience, or output format is unclear. Don't improvise on a fuzzy request.

## Stack

- **Web project.** Next.js / React **PWA** + **Supabase** (Postgres, Auth, Realtime, Edge Functions) + **Twilio** (SMS). Hosted on Cloudflare Pages or Vercel.
- **Site rebuild: Lane B — Astro 7 + Keystatic on Cloudflare (decided 2026-07-12).** Site lives in `site/`; Keystatic admin is dev-only (`SKIP_KEYSTATIC=1` on prod builds). Deploy target: Cloudflare Workers static assets.

## Skills

- **Apply here:** `session-start`, `project-docs`, `feature-complete`, `bec-voice`.
- **Does NOT apply here:** `swift-build-perf`. This is web, not Swift. That skill is trigger-happy from all the recent iOS work — ignore it in this project.

## Conventions

- **`project-docs` skill governs all specs/TODOs.** Keep milestone names and feature names **exact-match** between spec and TODO — the `.slack-tide.json` sync joins on exact name, so a reword creates a duplicate/ghost DB record.
- No emoji in spec `### Features` lines (emoji live in the TODO only).
- Run the **`feature-complete`** skill when a feature is done (updates spec/TODO/manual, commits, syncs the dashboard).
- Use **`bec-voice`** for anything Bec will send or publish: texts to Bobby/Elise, site copy, etc. No em-dashes ever in her voice.
- Update `dev/active/*/tasks.md` in real time as work completes, not in batches.

## Hard constraints (the design spine — do not drift)

- **All booking state lives in Supabase, never on the device.** This is the phone-overboard requirement (Bobby loses phones to the water). The device is a window, not storage.
- **PWA, not native.** Covers Bobby's Android + Elise + any replacement device, and Bec is iOS-only.
- **Phone-OTP auth, no email.** There may be no email for Bobby or Elise. OTP doubles as device recovery.
- **Public online booking stays behind the Elise-controlled go-live flag** (`settings.online_booking_enabled`). It's built but off until Bobby & Elise decide they're ready. Bobby's paper calendar book stays — this is a convenience layer, not a forced replacement.
- **SMS is the notification channel** (text-native, survives new-phone). Push/ntfy is an optional free extra.
- **Matlacha tours only. No Peace River / fossil trips.** Established competition + Bobby's focus.

## Guardrails

- **Don't invent Bobby's tour types, prices, durations, or availability.** Flag the gap and ask — seed data waits on real numbers from Elise.
- **Verify any tool/library/product before recommending it.** Never name specifics or pricing from memory — search first, answer second.
- Don't market boat **repair/build/parts** — the Archers stopped building. Keep the 30-years-experience credibility, frame it as experience.

## Time-sensitive (kick these off early)

- **Twilio A2P 10DLC** — register a dedicated brand/campaign for Archer (separate LLC from QRSTKR). Carrier approval has lead time; start before you need it.
- **Google Business Profile** — claim + optimize. Biggest free SEO lever for "tourist searches airboat tour, Bobby pops up." Site-side, not booking-side.

## Repo layout

```
.slack-tide.json                     ← dashboard sync config (slug: archer-airboat)
CLAUDE.md                            ← this file
archer-airboat-takeover-handoff.md   ← site / SEO / domains
Docs/
  Archer_Airboat_Booking_Spec.md     ← booking system spec
  PROJECT_TODO.md                    ← status of every feature
dev/active/
  booking-system/
    booking-system-plan.md
    booking-system-context.md
    booking-system-tasks.md
  site-rebuild/
    site-rebuild-plan.md
    site-rebuild-context.md
    site-rebuild-tasks.md
supabase/
  migrations/                        ← applied to the Archer Supabase project
site/                                ← Astro 7 + Keystatic site (Lane B)
```
