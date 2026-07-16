# ClickStudio Roadmap

This tracks what's shipped, what's planned, and open ideas for ClickStudio.
Update it as priorities shift — it's meant to be a living doc, not a locked
spec.

**Scope note (updated):** ClickStudio is a web-only photo booth — no native
app, no PWA install push. PWA/offline/kiosk features are deprioritized
accordingly. Focus stays on the core shoot → edit → export → share web flow.

Status legend: ✅ Done | 🔄 In progress | 📋 Planned | 💡 Idea (not committed)

---

## v1 — Core Booth ✅ Done

- Landing page
- Camera capture (timer, mirror, grid, upload fallback, up to 4 frames)
- Editor (5 filter presets, brightness/contrast, 3 frame-color themes, text caption)
- Export (canvas compositing to PNG, upload to Supabase Storage, DB row insert)
- Public share page with QR code and copy link
- Anonymous sessions (no login required)

---

## v1.1 — Polish & Hardening ✅ Done

- 30-day auto-delete via `cleanup-expired-strips` edge function (pg_cron + pg_net)
- Uploads routed through `upload-strip` edge function — 12 strips/hour/session
  rate limit, anonymous-auth JWT required, service role key does the write
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
- Instagram deep-linking removed (unreliable on mobile web)
- Tier 2 (Meta/TikTok API posting) on hold — requires user accounts

---

## v2.1 — PWA Support ✅ Done (deprioritized going forward)

- Web app manifest, app icons, standalone display mode
- Service worker / offline shell shipped but not a focus area —
  ClickStudio is web-only, no install push

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
- Not a focus going forward — web-only scope

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

- `/admin` dashboard: total strips, views, downloads, active sessions
- `/admin/stickers`: upload, organize, enable/disable sticker packs
- `/admin/gallery`: moderation, flag, delete, feature strips
- `/admin/sessions`: session view/count, block/unblock, IP tracking
- `/admin/analytics`: time-series charts, popular templates/filters, device breakdown
- `/admin/settings`: rate limits, maintenance mode, feature flags, default template
- `/admin/audit`: action log with timestamps, admin id, IP, user agent

---

## v3.0.2 — Platform Hardening ✅ Done

- Upload edge function in place (rate limiting, JWT, service role key)
- PWA offline scope acknowledged and intentionally limited
- Session-based rate limiting documented (IP-based is a future upgrade)

---

## v3.1 — Accessibility & Dark Mode ✅ Done

- Soft dark mode via `prefers-color-scheme` across all CSS tokens
- Dark mode works automatically on all pages including studio (post-refactor)

---

## v3.1 — Studio Page Design System Refactor ✅ Done (July 2026)

The `/studio` page was rebuilt to be consistent with the rest of the app:

- Replaced hand-rolled header + stepper with shared `<WizardHeader step={2} />`
- Added `<SparkleOverlay />` (dot-grid texture used on all other pages)
- Wrapped content in `<ErrorBoundary page="studio" />`
- All hardcoded hex colors (`#D4247E`, `#FFF6FA`, etc.) replaced with CSS
  design tokens (`bg-primary`, `bg-card`, `bg-muted`, `border-border`,
  `text-muted-foreground`, etc.)
- Typography aligned to `font-heading` (Fredoka) and `font-sans` (Inter)
- Dark mode now works on the studio page automatically
- Extracted local `Pill` component for all toggle buttons (Timer / Aspect
  Ratio / Frames / Frame Style) — DRY, consistent border/active states
- Default frame count changed to 2
- All camera functionality preserved (timer, aspect ratio, mirror/flip,
  countdown, upload fallback, frame preview, remove frame, continue to editor)

---

## v3.2 — i18n / Multi-language ⬜ Skipped

Dropped — web-only photo booth targeting English speakers. Not worth the
maintenance overhead at this stage.

---

## Next Up — UI & Flow Quality Pass ✅ Done (July 2026)

### 1. Landing page hero ✅
Replaced the static camera-icon placeholder with a styled simulated photo
strip showing two frames (Cherry Blossom and Noir Classic tints) with a
real strip footer (date + CLICKSTUDIO.APP branding) and a "5 filters" badge.
The strip tilts slightly and settles on hover, matching the card's existing
rotation animation.

### 2. End-to-end flow smoke test ✅
Reviewed all four flow pages (Studio → Editor → Export → Share). All pages
are fully wired:
- Supabase upload goes through the `upload-strip` edge function
- Share page loads from `get_strip_by_id` RPC and increments view count
- QR code renders via local `qrcode` library (no external API)
- Print dialog opens via `window.print()` with `lib/print.ts`
- History page queries strips by `session_id`
Remaining: `.env` values must be filled in before upload/share work in production.

### 3. Mobile layout review ✅
- Studio: removed stale `order-*` classes from right-column flex children
  (DOM order was already correct; the classes added noise without effect)
- Gallery: changed grid from `grid-cols-2 sm:grid-cols-3` to
  `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` — single
  column at 375px gives cards ~343px wide, much more comfortable
- History: same grid fix; also added `truncate` and `shrink-0` to card
  metadata row so date + stats don't overflow on narrow cards; `min-w-0`
  on the public toggle button prevents label overflow

### 4. Empty-state and error-state polish ✅
- Gallery empty: icon (`Images`), heading, descriptive copy, CTA button
  linking to `/studio`
- History empty: icon (`Clock`), heading, descriptive copy, CTA button
  — consistent visual treatment with gallery
- Studio camera denied: replaced plain muted text with a styled card
  (icon + heading + copy + prominent "Upload a Photo" pink button surfaced
  directly in the camera area, not buried in the action row below)

### 5. Bundle check ✅
- Dependencies are lean: no `jspdf`, no `react-query`, no charting lib
- `qrcode` (~50KB) was the only third-party import worth lazy-loading —
  it was imported statically at the top of `ExportPanel.tsx` but only
  ever used after a successful upload. Switched to `import("qrcode")`
  inside the `useEffect` that fires when `shareUrl` is set, so it's
  excluded from the initial export page bundle
- All other imports (`supabase`, `zustand`, `zundo`, `serwist`,
  `lucide-react`) are appropriate for their usage patterns

---

## v3.3 — Export & Share Polish ✅ Done (July 2026)

### Export PNG — per-frame filters wired through ✅
`frameFilters` was missing from `CompositeOptions` entirely — the compositor
was using a single global `filter` for every frame regardless of per-frame
selections made in the editor. Fixed:
- Added `frameFilters?: FilterKey[]` to `CompositeOptions`
- `renderStripCanvas` now draws each frame with its own `frameFilters[i] ?? filter`
  CSS filter, applied per-`drawImage` call rather than once for the whole canvas
- `ExportPanel` now pulls `frameFilters` from the store and passes it to both
  `compositeStrip` and `compositePrintPage`
- Print compositor inherits the fix automatically via `renderStripCanvas`

### Sticker coordinate system — verified correct ✅
The `framesAreaTop` / `framesAreaHeight` constants were being re-computed
inside the layer render loop (once per sticker). Moved outside the loop —
single computation, same result, cleaner code. Coordinate space confirmed
correct: sticker `x/y` percentages map to the frames area only (matching
`StripPreview`'s `stripRef`), not the full canvas including footer/padding.

### Print compositor — verified clean ✅
`lib/print.ts` calls `renderStripCanvas` directly — all fixes (per-frame
filters, correct coordinate space) apply automatically. No separate changes
needed. `compositePrintPage` now also receives `frameFilters` from
`ExportPanel`.

### Share page — redesigned ✅
Replaced the centered single-column layout with a two-column desktop layout:
- **Left**: strip image in a card (max-w-[320px]) with caption below it and
  engagement stats (views + saves) underneath
- **Right**: heading, `ShareActions` buttons, a 30-day expiry notice
  (Clock icon + plain-language copy), and a "Love this vibe?" CTA card with
  a full-width "Start the Studio" button
- Not-found state improved: icon + clearer expired copy + CTA button
- Mobile: columns stack, strip first then actions
- Caption now shown directly beneath the strip image in the card, not buried

--- (HOLD)

Deprioritized given web-only scope. If ClickStudio ever adds event hosting:

- Custom event slug (`/e/emmas-wedding`) with shared theme + gallery
- Sponsor/partnership dismissible footer banner

---

## v3.3 — Advanced Media Features 💡 Idea (not committed)

- Boomerang/GIF mode — `MediaRecorder` canvas capture, significant
  cross-browser complexity, changes the whole export/storage pipeline
- Scale handles directly on canvas for sticker/text layers

---

## Ideas Parking Lot 💡 Not committed

- More sticker packs — just drop PNGs into `public/stickers/{pack}/` and
  register in `IMAGE_PACKS`, no code change required
- Reactions on the feedback wall (instead of just text messages)
- "Sign a strip like a yearbook" — let visitors leave a name on someone's
  share page

---

## How to use this doc

When picking up a feature: move it from Planned to In progress, sketch
the data model change (if any) here, then build it. Move to Done once
shipped and the flow works end-to-end.
