-- Migration: v1.1 hardening
-- Run this in the Supabase SQL editor if you already ran the original
-- schema.sql and have an existing `strips` table / bucket. If you're
-- setting up a fresh project instead, just run the updated schema.sql —
-- it already includes these changes.

-- 1. Track the exact storage path per strip so the cleanup function can
--    delete the right file without guessing it back out of the URL.
alter table public.strips
  add column if not exists storage_path text;

-- 2. Remove the old public insert policies. Uploads now go through the
--    `upload-strip` edge function, which uses the service role key and
--    therefore bypasses RLS entirely — these policies are no longer
--    needed and were the actual abuse surface (anyone with the anon key
--    could previously insert unlimited rows/files directly).
drop policy if exists "Anyone can insert a strip" on public.strips;
drop policy if exists "Anyone can upload strip images" on storage.objects;

-- Public read access is unchanged and still required for the share pages
-- and displaying images:
--   "Public strips are readable by everyone" (select on public.strips)
--   "Public read for strip images" (select on storage.objects)
