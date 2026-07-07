-- ClickStudio Supabase schema
-- Run this in the Supabase SQL editor for a fresh project.
--
-- Anonymous, no-auth model: anyone can READ a strip and its image, but
-- writes only happen through the `upload-strip` edge function (using the
-- service role key, which bypasses RLS). This is what keeps the anon key
-- from being usable to spam uploads directly from the browser — see
-- supabase/functions/upload-strip for the actual write path and its
-- rate limiting.

-- 1. Table for finished photo strips
create table if not exists public.strips (
  id text primary key,
  session_id text not null,
  image_url text not null,
  storage_path text,
  theme text,
  filter text,
  caption text,
  is_public boolean not null default false,
  view_count integer not null default 0,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.strips enable row level security;

drop policy if exists "Public strips are readable by everyone" on public.strips;
create policy "Public strips are readable by everyone"
  on public.strips for select
  using (true);

-- No insert/update/delete policies for anon/authenticated on purpose.
-- Writes happen only via the upload-strip and cleanup-expired-strips
-- edge functions, which use the service role key and bypass RLS.

-- 2. Storage bucket for the exported PNG strips
insert into storage.buckets (id, name, public)
values ('strips', 'strips', true)
on conflict (id) do nothing;

drop policy if exists "Public read for strip images" on storage.objects;
create policy "Public read for strip images"
  on storage.objects for select
  using (bucket_id = 'strips');

-- No public insert policy here either — same reasoning as above.

-- 3. Cleanup
-- Preferred approach: deploy and schedule the `cleanup-expired-strips`
-- edge function (see supabase/functions/cleanup-expired-strips). It
-- deletes both the DB row and the Storage object together, which SQL
-- alone can't do since storage.objects isn't foreign-keyed to this table.
--
-- If you'd rather not deploy an edge function yet, this pg_cron + pg_net
-- alternative calls that same function's URL on a schedule directly from
-- Postgres (enable both extensions first: Database -> Extensions):
--
-- select cron.schedule(
--   'cleanup-expired-strips',
--   '0 3 * * *',
--   $$
--   select net.http_post(
--     url := 'https://<your-project-ref>.functions.supabase.co/cleanup-expired-strips',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer <your-service-role-key>',
--       'Content-Type', 'application/json'
--     )
--   );
--   $$
-- );
--
-- A DB-only fallback (rows only, leaves orphaned files in Storage) if you
-- want something running immediately without touching edge functions:
--
-- select cron.schedule(
--   'delete-old-strip-rows',
--   '0 3 * * *',
--   $$ delete from public.strips where created_at < now() - interval '30 days'; $$
-- );

-- 4. Analytics RPCs (v2.6)
-- SECURITY DEFINER so the anon key can increment counters without a direct
-- UPDATE policy. The functions only touch view_count / download_count.

create or replace function public.increment_strip_view(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.strips set view_count = view_count + 1 where id = p_id;
$$;

create or replace function public.increment_strip_download(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.strips set download_count = download_count + 1 where id = p_id;
$$;

grant execute on function public.increment_strip_view(text) to anon;
grant execute on function public.increment_strip_download(text) to anon;

-- 5. Templates table (v2.7)
-- Stores frame/theme definitions. Seeded with the 9 classic themes.
-- New templates can be added via the Supabase dashboard without a code deploy.

create table if not exists public.templates (
  id text primary key,
  name text not null,
  hex_color text not null,
  border_class text not null,
  accent_class text not null,
  paper_class text not null,
  category text not null default 'classic',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.templates enable row level security;

drop policy if exists "Active templates are readable by everyone" on public.templates;
create policy "Active templates are readable by everyone"
  on public.templates for select
  using (is_active = true);
