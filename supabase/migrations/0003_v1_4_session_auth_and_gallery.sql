-- Migration: v1.4 — real session isolation (Supabase anonymous auth) +
-- gallery opt-in.
--
-- Run this in the Supabase SQL editor after 0002_v1_1_hardening.sql.

-- 1. Gallery opt-in flag. Defaults to false — strips are private unless
--    someone explicitly makes them public from Session History.
alter table public.strips add column if not exists is_public boolean not null default false;

-- 2. Tighten select.
--
-- The previous policy was `using (true)` — unconditional. Nothing in the
-- UI ever ran an unfiltered `select *`, so it was never exploited, but it
-- meant anyone with the anon key technically could. Session History and
-- Gallery are exactly the features that make that matter: History relies
-- on filtering by session_id, and Gallery is supposed to be opt-in via
-- is_public — neither of those holds if the table is readable
-- unconditionally regardless of the filter a client happens to apply.
--
-- `session_id` now holds a real Supabase Auth `auth.uid()` (populated
-- server-side in upload-strip, from the caller's verified JWT — see that
-- function for details), not a client-supplied string. That's what makes
-- `auth.uid()::text = session_id` an actual enforceable check rather than
-- cosmetic.
drop policy if exists "Public strips are readable by everyone" on public.strips;
drop policy if exists "Owners and public gallery strips are readable" on public.strips;
create policy "Owners and public gallery strips are readable"
  on public.strips for select
  using (is_public = true or auth.uid()::text = session_id);

-- 3. Share pages (`/s/[id]`) need to fetch ANY strip by its exact,
--    unguessable id — that's the entire point of a share link, regardless
--    of is_public or who owns it. RLS operates row-by-row and can't tell
--    "looked up by a known id" apart from "scanned the whole table", so
--    that lookup has to go through a SECURITY DEFINER function instead
--    of a direct table select. This keeps the policy above locked to
--    own/public rows while still letting anyone with a link view that
--    one strip. The app's share page (app/s/[id]/page.tsx) calls this via
--    supabase.rpc('get_strip_by_id', { p_id: id }) instead of .select().
create or replace function public.get_strip_by_id(p_id text)
returns setof public.strips
language sql
security definer
set search_path = public
as $$
  select * from public.strips where id = p_id;
$$;

grant execute on function public.get_strip_by_id(text) to anon, authenticated;

-- 4. Owners can delete their own strips (DB row) — powers the delete
--    button on Session History. No separate edge function needed now
--    that ownership is provable via auth.uid() rather than a
--    client-supplied string.
drop policy if exists "Owners can delete their own strips" on public.strips;
create policy "Owners can delete their own strips"
  on public.strips for delete
  using (auth.uid()::text = session_id);

-- 5. Owners can update their own strips — currently only used to flip
--    is_public from Session History (the gallery opt-in toggle).
drop policy if exists "Owners can update their own strips" on public.strips;
create policy "Owners can update their own strips"
  on public.strips for update
  using (auth.uid()::text = session_id)
  with check (auth.uid()::text = session_id);

-- 6. Matching delete policy on Storage, so deleting a strip from History
--    also removes the underlying PNG, not just the DB row. Relies on the
--    upload-strip convention of storing files under `${userId}/${id}.png`
--    — storage.foldername(name) splits the path, so [1] is the top-level
--    folder (the uploader's auth.uid()).
drop policy if exists "Owners can delete their own strip images" on storage.objects;
create policy "Owners can delete their own strip images"
  on storage.objects for delete
  using (bucket_id = 'strips' and (storage.foldername(name))[1] = auth.uid()::text);

-- Note on existing data: strips created before this migration have a
-- client-generated nanoid in session_id, which will never match a real
-- auth.uid(). Those rows become unreachable from Session History (there's
-- no way for any browser to "re-claim" them) but remain reachable via
-- their direct share link through get_strip_by_id above. There's no
-- generic way to backfill ownership for old rows after the fact.
