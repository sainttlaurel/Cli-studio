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

## v1.1 — Polish & Hardening (Implemented, needs deploy) (Done)

Small fixes that make the current flow production-solid before adding new
surface area. Code is in place; each item needs a deploy/config step on
your Supabase project before it's live — see `README.md` section 3.

- Done (needs deploy): 30-day auto-delete via the `cleanup-expired-strips`
  edge function, which removes both the DB row and the Storage object.
  Needs to be deployed and scheduled (Dashboard Cron, or the `pg_cron` +
  `pg_net` alternative in `schema.sql`).
- Done (needs deploy): Uploads now go through the `upload-strip` edge
  function instead of the browser writing directly with the anon key. It
  enforces a 12-strips-per-hour-per-session rate limit and does the actual
  write with the service role key. The old public insert policies were
  removed from `schema.sql` accordingly — existing projects should run
  `supabase/migrations/0002_v1_1_hardening.sql`.
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

## v1.3 — Real Print Export (Planned)

The Export screen already has a "Print-Ready PDF" button — right now it's
a stub `alert()`. Making it real:

- Size picker: 2x6 strip, 4x6, A4, US Letter
- Render at 300 DPI on the existing canvas compositor, then output PDF
- Note: keep it lightweight — reach for the browser's native print dialog
  (`window.print()` with a print-specific stylesheet) before pulling in a
  PDF library. A full library like `jspdf` works but adds real bundle
  weight for something most people will only use occasionally.

---

## v1.4 — Session History & Gallery (Planned)

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

## v2 — Feedback Wall (Planned)

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

## v2 — Social Sharing: TikTok / Instagram (Planned)

Worth splitting into two tiers, since "share to" and "post via API" are very
different amounts of work:

**Tier 1 — Share sheet (low effort, ships fast)**
- `navigator.share()` with the PNG attached — on mobile this already
  surfaces Instagram, TikTok, Messages, WhatsApp, etc. if installed, no API
  keys or app review needed
- Instagram Stories has a documented deep link (`instagram-stories://share`)
  that can pre-load an image as a sticker — mobile web only, no desktop
  equivalent
- TikTok has a similar limited "Share to TikTok" SDK for mobile

**Tier 2 — Real API integration (bigger lift)**
- Actually posting on the user's behalf requires:
  - Instagram: a Meta Developer app, Business/Creator account linkage, app
    review for the required permissions
  - TikTok: a TikTok for Developers app plus their Content Posting API,
    also requires review
- This is realistic if ClickStudio becomes something people log into
  (accounts), less so for a no-login casual booth — worth revisiting if and
  when auth gets added for other reasons

**Recommendation:** ship Tier 1 first (cheap, works today), treat Tier 2 as
a "later, if this takes off" item.

---

## Ideas Parking Lot (Idea, not committed)

- Sticker packs — draggable, resizable, rotatable stickers placed by click,
  plus a text-overlay tool with the same drag/resize behavior. Needs a
  layer-based canvas editor instead of the current flat CSS filters (each
  sticker/text needs its own x/y/scale/rotation state).
- Bigger template gallery — the mockups showed 37 templates; current build
  has 3 color themes. Could back this with a `templates` table and a
  carousel/modal picker.
- PWA support — installable, works offline for the capture/edit steps.
  Moved up in priority — worth doing earlier rather than later since it's
  mostly config (manifest and service worker), not a big feature build.
- "What's New" changelog modal — surface this very roadmap/changelog
  in-app so people notice new features after an update.
- Boomerang/GIF mode — short looping clip instead of a static frame
- Event/kiosk mode — big-screen tablet UI for real parties/weddings, maybe
  a physical printer integration
- Custom event branding — a host picks a slug/theme for their event (e.g.
  `clickstudio.app/e/emmas-wedding`) so all strips from that event share a
  look and land on one gallery page
- Sponsor/partnership banner — a dismissible footer banner, useful if this
  is ever monetized via event sponsors
- Analytics — view/download counts per strip, maybe a simple creator
  dashboard
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
