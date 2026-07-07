-- v2.6 Analytics: view and download counts per strip
--
-- Adds two counter columns to the strips table and two SECURITY DEFINER
-- functions that let the anon key increment them. Writes still bypass RLS
-- (only these specific RPCs can update the counters — no direct UPDATE policy
-- is granted to anon or authenticated roles).

-- 1. Add counter columns
alter table public.strips
  add column if not exists view_count integer not null default 0,
  add column if not exists download_count integer not null default 0;

-- 2. Increment view count — called fire-and-forget from the share page server component
create or replace function public.increment_strip_view(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.strips
  set view_count = view_count + 1
  where id = p_id;
$$;

-- 3. Increment download count — called fire-and-forget from the Save button
create or replace function public.increment_strip_download(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.strips
  set download_count = download_count + 1
  where id = p_id;
$$;

-- Allow the anon role to call both functions
grant execute on function public.increment_strip_view(text) to anon;
grant execute on function public.increment_strip_download(text) to anon;
