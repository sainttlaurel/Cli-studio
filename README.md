# ClickStudio

A browser-based Y2K photo booth: shoot a strip, edit it with filters and stickers, export a high-res PNG, and get a shareable link + QR code — no signup required.

Flow: **Landing → Studio (shoot) → Editor (filters/stickers/text) → Export (upload + share) → Share Page (public reveal)**.

Live: [clickstudio.vercel.app](https://clickstudio.vercel.app) *(update with your URL)*

---

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **Supabase** — Storage (exported PNGs) + Postgres (`strips`, `messages`, `templates`, `message_reactions`, `admin_actions`, `admin_settings` tables)
- **Vercel** for hosting, deployed from GitHub
- **Serwist** for PWA / service worker / offline shell

No auth: each browser gets an anonymous session id stored in `localStorage` used only to namespace storage paths and rate-limit uploads.

---

## Features

**Core booth**
- Camera capture with countdown timer, mirror mode, and upload fallback (up to 4 frames)
- 5 filter presets with live thumbnails, brightness/contrast sliders
- 9 frame themes with real border/shadow/corner previews
- Text caption on the strip

**Layers & stickers**
- 4 image sticker packs: College 🎓, Flowers 🌸, Ribbon 🎀, Y2K ⭐ (10 stickers each)
- 6 Y2K-style text badge presets
- Draggable, resizable, rotatable sticker and text layers
- Per-layer opacity, z-order reorder, undo/redo (`zundo`)
- All layers exported correctly into the final PNG and print output

**Export & share**
- Canvas compositor renders the final PNG with correct per-frame filters, stickers, and text
- Upload to Supabase Storage via edge function (rate-limited: 12 strips/hour/session)
- Public share page with QR code (local `qrcode` library, no third-party dependency) and copy link
- Native `navigator.share()` on export + share page, clipboard fallback
- 30-day auto-delete via `cleanup-expired-strips` edge function

**Print**
- Size picker: 2×6 strip, 4×6, A4, US Letter
- Native print dialog via `window.print()` with print-specific stylesheet
- Mobile: recommendation to download PNG and print from Photos app

**Social**
- Emoji reactions (❤️ ✨ 😂 🔥) on wall messages — one per session per emoji
- Yearbook signing on every share page — name + message, profanity filtered
- `/wall` — public site-wide message feed
- `/gallery` — public opt-in browse (users opt in at export time)
- `/history` — strips from this browser, search/sort/delete

**PWA**
- Web app manifest, app icons, standalone display mode
- Service worker with offline fallback page

**Admin** (`/admin`, password-protected)
- Dashboard: real metrics from Supabase (strips, views, downloads, sessions)
- Gallery: flag/feature/delete strips
- Sticker packs: enable/disable per pack and per sticker
- Analytics: time-series charts, popular templates/filters
- Templates: full CRUD wired to Supabase `templates` table
- Sessions, Settings, Audit log — all backed by real DB tables

---

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase credentials (see below), then:

```bash
npm run dev
```

Visit `http://localhost:3000`. Camera requires `getUserMedia`, which needs either `localhost` or HTTPS — both work fine locally and on Vercel.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the migrations in order from `supabase/migrations/`:
   - `0001_initial_schema.sql` — `strips` table + RLS + storage bucket
   - `0002` through `0008` — additive migrations for messages, reactions, admin tables, etc.
3. Deploy the two edge functions in `supabase/functions/`:
   - `upload-strip` — mediates uploads with JWT + service role key + rate limiting
   - `cleanup-expired-strips` — scheduled via pg_cron to delete strips older than 30 days
4. Go to **Settings → API** and copy the **Project URL** and **anon public key** into `.env.local`.

> The app uses anonymous sessions — no user accounts. The anon key can read public data; all writes go through the edge function with the service role key, keeping your service role key off the client.

---

## GitHub → Vercel deploy

1. Push this repo to GitHub (already done if you're reading this there).
2. In [Vercel](https://vercel.com), **New Project → Import** your repo.
3. Framework preset auto-detects as Next.js.
4. Add all four env vars from `.env.example` under **Settings → Environment Variables** (Production + Preview).
5. Deploy. Every push to `main` auto-redeploys.

---

## Project structure

```
app/
  page.tsx                  landing page
  studio/page.tsx           camera capture
  editor/page.tsx           filters, stickers, text layers, adjustments
  export/page.tsx           composite, upload, share link + QR
  s/[id]/page.tsx           public share page (server component)
  gallery/page.tsx          public opt-in gallery
  history/page.tsx          per-browser strip history
  wall/page.tsx             site-wide message feed
  offline/page.tsx          PWA offline fallback
  admin/                    password-protected admin suite
  api/                      Next.js route handlers (admin APIs)
  manifest.ts               PWA install metadata

components/                 CameraCapture, StripPreview, EditorPanel, ExportPanel,
                            WizardHeader, SparkleOverlay, ErrorBoundary, ...

lib/
  store.ts                  Zustand store (sessionStorage-backed)
  filters.ts                CSS filter presets (live preview + canvas export)
  stickers.ts               sticker preset registry
  compositor.ts             canvas compositor — renders final PNG; exposes
                            renderStripCanvas() and getStripDimensions()
  print.ts                  print compositor (300dpi, size presets) + window.print()
  supabase.ts               Supabase client
  session.ts                anonymous per-browser session id

supabase/
  migrations/               numbered SQL migrations (run in order)
  functions/                edge functions (upload-strip, cleanup-expired-strips)

public/
  stickers/{pack}/          PNG sticker assets (college, flowers, ribbon, y2k)
  icons + PWA assets
```

---

## Environment variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `ADMIN_PASSWORD` | Choose a strong password — used for `/admin` access |

---

## What's next

See [`docs/roadmap.md`](docs/roadmap.md) for the full history and post-launch ideas. The short list of low-effort additions if there's demand:

- More sticker packs — drop PNGs into `public/stickers/{pack}/`, register in `IMAGE_PACKS`, done
- Reactions on yearbook signatures (currently only on wall messages)
- Rate limiting on wall/yearbook inserts
- GIF/Boomerang mode (`MediaRecorder` canvas capture)

---

## License

MIT
