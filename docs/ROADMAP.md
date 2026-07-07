# ClickStudio Roadmap

This tracks what's shipped, what's planned, and open ideas for ClickStudio.
Update it as priorities shift — it's meant to be a living doc, not a locked
spec.

Status legend: Done | In progress | Planned | Idea (not committed)

---

## v1 — Core Booth (Done)

- Landing page
- Camera capture (timer, mirror, grid, upload fallback, up to 4 frames)
- Editor (5 filter presets, brightness/contrast, 3 frame-color themes, text caption)
- Export (canvas compositing to PNG, upload to Supabase Storage, DB row insert)
- Public share page with QR code and copy link
- Anonymous sessions (no login required)

---

## v1.1 — Polish & Hardening (Deployed) (Done)

Small fixes that make the current flow production-solid before adding new
surface area. Code and Supabase project deployment are in place.

- Done: 30-day auto-delete via the `cleanup-expired-strips`
  edge function, which removes both the DB row and the Storage object.
  Deployed and scheduled daily at 3am through `pg_cron` + `pg_net`.
- Done: Uploads now go through the `upload-strip` edge
  function instead of the browser writing directly with the anon key. It
  enforces a 12-strips-per-hour-per-session rate limit, requires a verified
  anonymous-auth JWT, and does the actual write with the service role key.
  The old public insert policies were removed from `schema.sql` accordingly.
- Done: Native share sheet (`navigator.share()`) on both the Export panel
  and the public Share page, with a clipboard fallback.
- Done: Retry handling on the export step — a "Try Again" button replaces
  the old dead-end error message.

---

## v1.2 — Editor Quality-of-Life (Done)

Cheap, high-impact upgrades to the existing editor, no new data model needed.

- Live filter thumbnails — show each filter preset applied to a small real
  preview image instead of a plain gray box, so people can see the effect
  before tapping it
- Real frame previews — the Frame tab currently shows a flat color swatch;
  render the actual border/shadow/corner styling so it matches what you'll
  get
- Undo/redo — Ctrl+Z / Ctrl+Y across filter, adjustment, theme, and caption
  changes. With Zustand this is a small lift (either a manual history
  stack, or the `zundo` temporal middleware)
- Countdown sound on capture (Web Audio API) — small delight touch
- Tab transition polish — crossfade between editor tabs, sliding underline
  on the active tab

---

## v1.3 — Real Print Export (Done)

The Export screen already has a "Print-Ready PDF" button — right now it's
a stub `alert()`. Making it real:

- Size picker: 2x6 strip, 4x6, A4, US Letter
- Render at 300 DPI on the existing canvas compositor, then output PDF
- Note: keep it lightweight — reach for the browser's native print dialog
  (`window.print()` with a print-specific stylesheet) before pulling in a
  PDF library. A full library like `jspdf` works but adds real bundle
  weight for something most people will only use occasionally.

---

## v1.4 — Session History & Gallery (Done)

Since every strip is already tagged with an anonymous `session_id`, we can
give people a "my strips" view without adding real accounts:

- Session History page — list of strips created from this browser (query
  `strips` by `session_id`), with search/sort/delete
- Gallery page — public, opt-in browse of strips (a person could choose
  "show my strip in the gallery" at export time). Pairs naturally with the
  feedback wall below — a gallery entry is a good place to attach a
  message thread.
- Note: both pages read from a table anyone can currently insert into with
  no auth — worth having the abuse/rate-limiting item from v1.1 done first
  if either of these goes fully public.

---

## v2 — Feedback Wall (Done)

A public space for visitors to leave a message — could live on the share
page, or as its own `/wall` page showing recent messages site-wide.

**Proposed shape:**
- New `messages` table: `id, strip_id (nullable), session_id, name, message, created_at`
- If tied to a specific strip: shows under that share page ("say something
  nice about this vibe")
- If site-wide: a `/wall` page, maybe a scrolling marquee of recent messages
  on the landing page
- Needs light moderation from day one — a simple profanity filter (client
  and server-side) and a way to hide/delete a message (even just a manual
  Supabase dashboard delete at first, no admin UI needed for v1)
- Idea for later: reactions instead of just text, or letting people "sign"
  a strip like a yearbook

**Open question for you:** per-strip messages, a global wall, or both? That
changes whether this is scoped into the share page or becomes a new route.

---

## v2 — Social Sharing: Native Share Sheet (HOLD)

Worth splitting into two tiers, since "share to" and "post via API" are very
different amounts of work:

**Tier 1 — Native share sheet (shipped)**
- Current implementation: `navigator.share()` with the public strip URL on
  both the Export panel and public Share page, plus a clipboard fallback.
- Confirmed correction: Instagram Stories deep-linking from mobile web did
  not work reliably on the real iPhone test and was removed. ClickStudio no
  longer shows a separate IG Stories button.
- The share sheet is controlled by the OS/browser and installed apps. If
  TikTok, Facebook, Instagram, or another app does not appear there, code in
  ClickStudio cannot force that destination to show. The reliable web
  capability is sharing the strip URL through the native sheet or copying the
  link.
- File attachments were also removed from the native share payload. URL-only
  sharing is the widest-compatible Tier 1 behavior for this no-login web app.

**Potential Tier 1 follow-up**
- If a real-device test shows that URL-only sharing still hides important
  apps that are installed and normally accept links from Safari, retest the
  installed-app/browser settings before treating it as a ClickStudio bug.

**Tier 2 — Real API integration (bigger lift)**
- Actually posting on the user's behalf requires:
  - Instagram: a Meta Developer app, Business/Creator account linkage, app
    review for the required permissions
  - TikTok: a TikTok for Developers app plus their Content Posting API,
    also requires review
- This is realistic if ClickStudio becomes something people log into
  (accounts), less so for a no-login casual booth — worth revisiting if and
  when auth gets added for other reasons

**Recommendation:** keep Tier 1 as native URL sharing. Treat platform-owned
posting APIs as a later product decision if ClickStudio adds real user
accounts and can justify developer app review.

---

## v2.1 — PWA Support (Done)

Lightweight install support for phone-first booth use:

- Web app manifest via `app/manifest.ts`
- Home-screen/mobile install metadata in the root layout
- App icons for browser, Apple touch icon, and maskable Android icon
- Standalone display mode with ClickStudio theme/background colors

**Later option:** add a service worker/offline shell if the product needs
offline capture/edit behavior. This was intentionally not included in the
first PWA pass because upload, share pages, gallery, and feedback wall all
depend on live Supabase/network behavior.

---

## v2.2 — Expanded Template Gallery (Done)

First pass at more visual variety without adding a database:

- Frame/template picker expanded from 3 themes to 9 local templates
- Live editor swatches show each template's border, paper tint, and accent
- Preview and exported PNG/print output use the selected template color
- No `templates` table yet; this keeps the feature lightweight while the
  app is still a no-login casual booth

**Later option:** move templates into a Supabase-backed gallery if the app
needs many seasonal/event packs, custom branding, or admin-editable
templates.

---

## v2.3 — What's New Changelog Modal (Done)

Small in-app release-notes surface so returning users can see recent product
changes without reading the repo:

- Auto-opens once per browser for a new changelog version, then stores the
  dismissed version in `localStorage`
- Manual "What's New" trigger in the landing and studio headers
- Current content highlights PWA install support, expanded frame templates,
  and native URL sharing

---

## v2.4 — Sticker Packs (Done)

Lightweight sticker layer support inside the current editor/export pipeline:

- Stickers tab now offers 6 local Y2K-style sticker presets
- Stickers can be placed, dragged on the live strip preview, resized,
  rotated, removed, cleared, and included in undo/redo history
- Exported PNGs and print-ready output draw stickers into the final canvas
- No database model yet; sticker definitions remain local like the current
  template gallery

**Later option:** richer sticker packs with custom image assets, text-overlay
layers, and per-sticker z-order controls if the editor moves further toward a
full layer system.

---

## v2.5 — Offline Shell / Service Worker (Done)

PWA offline support on top of the install metadata shipped in v2.1:

- `serwist` + `@serwist/next` integrated via `withSerwist` in `next.config.mjs`
- Service worker at `app/sw.ts` with precaching for static assets, `/`, `/studio`,
  `/editor`, and font files
- Runtime stale-while-revalidate cache for Supabase CDN strip images (60 entries, 7d TTL)
- Offline fallback page at `/offline` — shown when a network-required navigation
  misses the cache, with a link back to `/studio`
- `ExportPanel` detects `navigator.onLine` before the upload step and shows a
  friendly inline message instead of a failed network call
- Service worker is disabled in `development` so Next.js HMR is unaffected

---

## v2.6 — Analytics: View & Download Counts (Done)

Lightweight per-strip engagement counters, no third-party tracking:

- `view_count` and `download_count` integer columns added to `strips` table (default 0)
- Two `SECURITY DEFINER` RPCs (`increment_strip_view`, `increment_strip_download`)
  callable by the anon role — no direct UPDATE policy needed
- Share page (`/s/[id]`) increments the view count fire-and-forget on each load
  and displays "👁 N views / ⬇ N saves" below the strip image
- Save button in `ShareActions` fires `increment_strip_download` before opening
  the image — no new API route required
- History page (`/history`) shows view + download counts in each strip card
- Migration: `supabase/migrations/0005_v2_6_strip_counts.sql`

---

## v2.7 — Template Packs in Database (Done)

Move the local 9-template gallery into a Supabase-backed `templates` table
so templates can be added, updated, or grouped without a code deploy:

**Data model:**
- New `public.templates` table: `id text PK, name text, hex_color text,
  label text, category text, sort_order int, is_active bool, created_at`
- Seeded with the 9 existing local themes (pink, lavender, blue, mint,
  lemon, coral, grape, lime, mono)
- RLS: public SELECT for active templates; writes via service role only

**Editor integration:**
- Frame tab fetches templates from Supabase on mount (with a local fallback
  to the hardcoded list if the fetch fails, so offline still works)
- Loading skeleton shown while fetching; error state falls back silently
- `ThemeKey` union type stays for now — extended dynamically from DB rows

**Migration:** `supabase/migrations/0006_v2_7_templates.sql`

---

## Ideas Parking Lot (Idea, not committed)

- Advanced layer editor — custom sticker image packs, text overlays with the
  same drag/resize behavior, z-order controls, and richer transforms.
- Boomerang/GIF mode — short looping clip instead of a static frame
- Event/kiosk mode — big-screen tablet UI for real parties/weddings, maybe
  a physical printer integration
- Custom event branding — a host picks a slug/theme for their event (e.g.
  `clickstudio.app/e/emmas-wedding`) so all strips from that event share a
  look and land on one gallery page
- Sponsor/partnership banner — a dismissible footer banner, useful if this
  is ever monetized via event sponsors
- More languages — the UI is English-only right now

---

## Recycled Ideas Log

Some of the items above were pulled from the changelog of an earlier,
more built-out version of this concept. Noted here for context on why
they're prioritized the way they are:

- Feedback wall shipped early there (right alongside QR share), suggesting
  it's a lighter lift than it might sound — bumped up accordingly.
- Web Share API with copy-link fallback was already validated as the
  social sharing approach — matches our Tier 1 plan above.
- PWA support shipped in their v1.0.0 — moved up from parking lot into a
  "worth doing early" note.
- Their notes mention removing heavy packages (`jspdf`, `react-query`,
  `qrcode`) to control bundle size — worth keeping in mind so our PDF
  export and other additions don't reach for a heavy dependency by default.

---

## How to use this doc

When picking up a feature: move it from Idea to Planned, sketch the data
model change (if any) here, then build it. Move to Done once shipped and
merged into the main flow described in `README.md`.
