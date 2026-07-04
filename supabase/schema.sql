-- ClickStudio Supabase schema
-- Run this in the Supabase SQL editor for your project.
-- Anonymous, no-auth model: anyone can insert/read a strip and its image.
-- This is fine for a fun, public photo-booth app but means anyone with the
-- anon key can write rows/files. Add rate limiting or auth later if abuse
-- becomes a concern.

-- 1. Table for finished photo strips
create table if not exists public.strips (
  id text primary key,
  session_id text not null,
  image_url text not null,
  theme text,
  filter text,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.strips enable row level security;

drop policy if exists "Public strips are readable by everyone" on public.strips;
create policy "Public strips are readable by everyone"
  on public.strips for select
  using (true);

drop policy if exists "Anyone can insert a strip" on public.strips;
create policy "Anyone can insert a strip"
  on public.strips for insert
  with check (true);

-- 2. Storage bucket for the exported PNG strips
insert into storage.buckets (id, name, public)
values ('strips', 'strips', true)
on conflict (id) do nothing;

drop policy if exists "Public read for strip images" on storage.objects;
create policy "Public read for strip images"
  on storage.objects for select
  using (bucket_id = 'strips');

drop policy if exists "Anyone can upload strip images" on storage.objects;
create policy "Anyone can upload strip images"
  on storage.objects for insert
  with check (bucket_id = 'strips');

-- 3. Optional: auto-clean strips older than 30 days (matches the footer
-- copy in the UI). Requires the pg_cron extension, which you can enable
-- from Database > Extensions in the Supabase dashboard.
-- select cron.schedule(
--   'delete-old-strips',
--   '0 3 * * *',
--   $$ delete from public.strips where created_at < now() - interval '30 days'; $$
-- );
-- Note: this only cleans the DB rows. To also remove the files from
-- Storage you'll want a Supabase Edge Function that lists + deletes
-- objects older than 30 days, since storage.objects isn't directly
-- tied to this table by a foreign key.
