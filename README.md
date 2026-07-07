# ClickStudio 📸✨

A browser-based Y2K photo booth: shoot a strip, edit it with filters, export a
high-res PNG, and get a shareable link + QR code — no signup required.

Flow: **Landing → Studio (shoot) → Editor (filters/caption) → Export (upload
+ share) → Share Page (public reveal)**.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **Supabase** — Storage (the exported PNGs) + Postgres (a `strips` table for
  share links). No auth: each browser gets an anonymous id stored in
  `localStorage`, used only to namespace storage paths.
- **Vercel** for hosting, deployed straight from GitHub.

## 1. Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project's URL and anon key (see
below), then:

```bash
npm run dev
```

Visit `http://localhost:3000`. The camera step needs `getUserMedia`, which
requires either `localhost` or HTTPS — both work fine locally and on Vercel.

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor**, paste the contents of `supabase/schema.sql`, and run
   it. This creates:
   - a public `strips` table (id, session_id, image_url, theme, filter,
     caption, created_at) with RLS policies allowing public insert/select
   - a public `strips` Storage bucket with matching policies
3. Go to **Settings → API** and copy the **Project URL** and **anon public
   key** into `.env.local` (and later into Vercel's env vars).

This app intentionally skips auth — it's meant to be a fun, frictionless
public booth. That means the anon key can insert rows/files directly from
the browser. Fine for a casual/public app; if you want to lock it down
later, look at Supabase Auth (anonymous sign-ins still work well here) or a
serverless function that mediates the upload.

## 3. GitHub → Vercel deploy

1. Push this project to a new GitHub repo.
2. In [Vercel](https://vercel.com), **New Project → Import** your repo.
3. Framework preset should auto-detect as Next.js.
4. Add the two environment variables from `.env.example` under **Settings →
   Environment Variables** (both Production and Preview).
5. Deploy. Every push to `main` will auto-redeploy.

## Project structure

```
app/
  page.tsx              landing page
  studio/page.tsx        camera capture (step 2)
  editor/page.tsx         filters, adjustments, caption (step 3)
  export/page.tsx         composite, upload, share link + QR (step 4)
  s/[id]/page.tsx          public share page (server component)
  manifest.ts              PWA install metadata
components/               CameraCapture, StripPreview, EditorPanel, ExportPanel, ...
lib/
  store.ts                Zustand store holding captured frames + edits (sessionStorage-backed)
  filters.ts               CSS filter presets shared by live preview + canvas export
  compositor.ts             canvas compositor that renders the final PNG; also exposes
                            renderStripCanvas() and getStripDimensions(), shared with lib/print.ts
  print.ts                  print-page compositor (300dpi, size presets) + window.print() trigger
  supabase.ts               Supabase client
  session.ts                anonymous per-browser session id
supabase/schema.sql        table + RLS + storage bucket setup
public/                    PWA icons served as static assets
```

## What's stubbed / next steps

This is a real, working scaffold end-to-end, but a few things from the
original designs are intentionally simplified so you have a solid
foundation to build on:

- **Sticker packs** — the Stickers tab is a "coming soon" placeholder.
  Adding draggable stickers would mean moving the preview from plain
  `<img>` layers to an absolutely-positioned canvas/layer system.
- **Templates gallery** (the "37 templates" browser from the mockup) is
  simplified to 3 frame-color themes. Easy to expand into a real template
  picker backed by a `templates` table if you want more variety.
- **QR codes** are generated via the free `api.qrserver.com` endpoint to
  avoid an extra dependency — swap in a local QR library (e.g. `qrcode`) if
  you'd rather not depend on a third-party service.
- **Social share buttons** (Instagram/TikTok/Message) from the mockups
  aren't wired up — most of those platforms don't support arbitrary web
  share intents, so this would use the native `navigator.share()` API on
  supported devices as a first pass.
- **Print export** (`lib/print.ts`) opens the browser's native print
  dialog rather than generating a PDF directly — "Save as PDF" from that
  dialog covers the PDF use case without adding a library like `jspdf`.
  `@page` size support varies by browser (particularly Safari), so it's
  worth a manual print-preview check across Chrome/Firefox/Safari,
  desktop and iOS, before relying on it for real print jobs.
- **PWA support** currently covers install metadata and app icons. A
  service worker/offline shell is intentionally left for later because
  upload, share links, gallery, and the feedback wall depend on networked
  Supabase calls.
