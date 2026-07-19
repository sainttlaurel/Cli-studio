# ClickStudio Roadmap

This tracks what's shipped, what's planned, and open ideas for ClickStudio.
Update it as priorities shift — it's meant to be a living doc, not a locked spec.

**Scope:** ClickStudio is a web-only photo booth. No native app, no PWA install push.
Focus stays on the core shoot → edit → export → share web flow.

Status legend: ✅ Done | 📋 Planned | 💡 Idea (not committed)

---

## v1 — Core Booth ✅ Done

- Landing page
- Camera capture (timer, mirror, upload fallback, up to 4 frames)
- Editor (5 filter presets, brightness/contrast, 3 frame-color themes, text caption)
- Export (canvas compositing to PNG, upload to Supabase Storage, DB row insert)
- Public share page with QR code and copy link
- Anonymous sessions (no login required)

---

## v1.1 — Polish & Hardening ✅ Done

- 30-day auto-delete via `cleanup-expired-strips` edge function (pg_cron + pg_net)
- Uploads routed through `upload-strip` edge function — 12 strips/hour/session rate limit, anonymous-auth JWT required, service role key does the write
- Native share sheet (`navigator.share()`) on Export + Share page, clipboard fallback
- Retry handling on export — "Try Again" button replaces dead-end error

---

## v1.2 — Editor Quality-of-Life ✅ Done

- Live filter thumbnails
- Real frame previews (border/shadow/corner styling)
- Undo/redo via `zundo` temporal middleware
- Countdown sound on capture (Web Audio API)
- Tab transition polish

---

## v1.3 — Real Print Export ✅ Done

- Size picker: 2×6 strip, 4×6, A4, US Letter
- Native print dialog via `window.print()` with print-specific stylesheet
- Mobile recommendation to download PNG and print from Photos app

---

## v1.4 — Session History & Gallery ✅ Done

- `/history` — strips from this browser, search/sort/delete
- `/gallery` — public opt-in browse, opt-in at export time

---

## v2 — Feedback Wall ✅ Done

- `messages` table with per-strip and site-wide support
- `/wall` page for site-wide messages
- Profanity filter (client + server)
- Light moderation via Supabase dashboard

---

## v2 — Social Sharing ✅ Done (Tier 1 only)

- `navigator.share()` URL-only sharing on Export + Share pages
- Clipboard fallback
- Tier 2 (Meta/TikTok API posting) on hold — requires user accounts

---

## v2.1 — PWA Support ✅ Done (deprioritized)

- Web app manifest, app icons, standalone display mode
- Service worker / offline shell shipped but not a focus area — web-only scope

---

## v2.2 — Expanded Template Gallery ✅ Done

- 9 local frame themes with live swatches
- Preview + export use selected template color

---

## v2.3 — What's New Changelog Modal ✅ Done

- Auto-opens once per browser per version, stored in `localStorage`
- Manual trigger in header

---

## v2.4 — Sticker Packs ✅ Done

- 6 Y2K-style text badge sticker presets
- Drag, resize, rotate, remove, undo/redo
- Exported into final PNG and print output

---

## v2.5 — Offline Shell / Service Worker ✅ Done (deprioritized)

- `serwist` + `@serwist/next`, precaching, stale-while-revalidate for CDN images
- Offline fallback page at `/offline`

---

## v2.6 — Analytics: View & Download Counts ✅ Done

- `view_count` + `download_count` on `strips` table
- `increment_strip_view` / `increment_strip_download` RPCs
- Counts shown on share page and history page

---

## v2.7 — Template Packs in Database ✅ Done

- `templates` table in Supabase, seeded with 9 themes
- Editor fetches from DB with local fallback
- RLS: public SELECT, service role writes

---

## v2.8 — Custom Image Sticker Packs ✅ Done

- 4 image packs: College 🎓, Flowers 🌸, Ribbon 🎀, Y2K ⭐ (10 stickers each)
- PNGs in `public/stickers/{pack}/`
- Pack switcher in Stickers tab, thumbnails in placed-layer list
- Canvas compositor draws image stickers with correct aspect + drop shadow

---

## v2.8 — Advanced Layer Editor: Text Overlays ✅ Done

- Draggable/resizable/rotatable text layers
- 8-color palette, 3 fonts (Fredoka/Sans/Mono), size slider
- Up to 10 text layers, included in undo/redo
- `cqw` font sizing matches preview to export output

---

## v2.9 — Layer Opacity & Z-Order ✅ Done

- Per-layer opacity slider (10–100%) for stickers and text
- Up/down reorder, unified Layers tab with drag reorder
- `globalAlpha` applied in compositor

---

## v2.10 — Editor Layout Polish ✅ Done

- 50/50 `lg:grid-cols-2` split, preview sticky on scroll
- Strip preview fills column, scales up on large screens
- Frame tab tightened to match Filters tab

---

## v3.0 — Hardening & Viral Mechanics ✅ Done

- Local `qrcode` library replaces `api.qrserver.com`
- React Error Boundaries on `/studio`, `/editor`, `/export`
- Mobile print layout improvements in `lib/print.ts`
- Drag-reorder z-order via unified Layers tab
- Admin template management UI at `/admin/templates`

---

## v3.0.1 — Admin Management Suite ✅ Done

- `/admin` dashboard: real metrics from Supabase (total strips, views, downloads, active sessions, recently created)
- `/admin/gallery`: real strip images from Supabase, search/filter/sort, flag/feature/delete
- `/admin/stickers`: enable/disable sticker packs and individual stickers, persisted to localStorage
- `/admin/sessions`: session view/count aggregated from strips table
- `/admin/analytics`: time-series charts, popular templates/filters, real data from Supabase
- `/admin/settings`: load from and save to `admin_settings` key-value table in DB
- `/admin/audit`: action log from `admin_actions` table (real data, no mock)
- `/admin/templates`: full CRUD wired to Supabase `templates` table; modal always-visible bug fixed

---

## v3.0.2 — Platform Hardening ✅ Done

- Upload edge function in place (rate limiting, JWT, service role key)
- PWA offline scope acknowledged and intentionally limited
- Session-based rate limiting documented

---

## v3.1 — Accessibility & Dark Mode ✅ Done

- Soft dark mode via `prefers-color-scheme` across all CSS tokens
- Dark mode works automatically on all pages

---

## v3.1 — Studio Page Design System Refactor ✅ Done

- Replaced hand-rolled header with shared `<WizardHeader step={2} />`
- Added `<SparkleOverlay />` and `<ErrorBoundary page="studio" />`
- All hardcoded hex colors replaced with CSS design tokens
- Default frame count changed to 2

---

## v3.2 — UI & Flow Quality Pass ✅ Done

- Landing hero: replaced camera-icon placeholder with styled simulated strip
- Gallery/History: single-column mobile grid, proper empty states with icons + CTAs
- Studio camera denied: styled error card with Upload button surfaced in camera area
- Template swatches: compacted to `grid-cols-5`, fixed `h-10` height
- `qrcode` lazy-loaded in `ExportPanel`
- All `eslint-disable` and redundant `import React` cleaned up across codebase

---

## v3.3 — Export & Share Polish ✅ Done

- `frameFilters` wired through compositor — per-frame filter choices now export correctly in PNG and print
- Sticker/text coordinate system verified correct (x/y maps to frames area only, not full canvas)
- Share page redesigned: two-column desktop layout, caption in card, 30-day expiry notice, stronger CTA
- Not-found state improved with icon and expiry copy

---

## v3.4 — Reactions & Yearbook Signing ✅ Done (July 2026)

Community features that make strips social:

- **Emoji reactions on wall messages** — ❤️ ✨ 😂 🔥 reaction buttons on each `/wall` message card; optimistic UI with DB fallback; one reaction per session per emoji; backed by `message_reactions` table with RLS
- **Yearbook signing on share page** — "Sign this strip ✍️" section below the CTA on every `/s/[id]` share page; name + message (max 80 chars); stored in `messages` table using the existing `strip_id` column; profanity filtered; signatures listed oldest-first
- Migrations: `0007_v3_4_reactions_and_yearbook.sql` (strip_id on messages, message_reactions table + RLS)

---

## v3.5 — Admin Tables ✅ Done (July 2026)

- `admin_actions` table — lightweight action log backing the audit page (replaces mock data)
- `admin_settings` table — key-value store backing the settings page save/load
- Migration: `0008_v3_5_admin_tables.sql`

---

## 🚀 Shipped to Production (July 2026)

ClickStudio is live. Core flow verified end-to-end:
- Camera capture → editor → export → share link ✅
- Sticker positions match between editor preview and exported PNG ✅
- Reactions and yearbook signing tested and working ✅
- Admin panel wired to real Supabase data ✅
- Both DB migrations applied ✅

---

## What's Next — Post-Launch

These are things to do based on how real users actually use the app.
Nothing is committed until real usage data points at a gap.

**Low-effort, high-value if users ask:**
- More sticker packs — drop PNGs into `public/stickers/{pack}/`, register in `IMAGE_PACKS`, done
- Reactions on yearbook signatures (currently only on wall messages)
- Rate limiting on wall/yearbook inserts (same shape as upload-strip edge function)

**Medium lift:**
- GIF/Boomerang mode — `MediaRecorder` canvas capture; cross-browser rough edges; changes the export pipeline
- Scale handles directly on canvas for sticker/text layers

**Bigger product decisions (not committed):**
- Custom event branding with host slugs (`/e/emmas-wedding`)
- Sponsor/partnership banner

---

## How to use this doc

When picking up a feature: move it to In progress, sketch the data model change (if any), build it. Move to Done once shipped and the flow works end-to-end.
