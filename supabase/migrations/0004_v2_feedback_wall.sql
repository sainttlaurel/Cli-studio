-- Migration: v2 — Global Feedback Wall.
--
-- A site-wide, public message board (not tied to individual strips — see
-- the roadmap's scope decision). Reuses the same anonymous-auth ownership
-- model as strips (0003_v1_4_session_auth_and_gallery.sql): session_id
-- holds a real Supabase Auth auth.uid(), which is what lets RLS enforce
-- "only the poster can delete their own message."

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text check (name is null or char_length(name) <= 40),
  message text not null check (char_length(message) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);

alter table public.messages enable row level security;

-- Unlike the strips table's earlier `using (true)` (which was a mistake —
-- strips are private by default), this one really is supposed to be
-- readable by everyone: it's a public wall.
drop policy if exists "Messages are readable by everyone" on public.messages;
create policy "Messages are readable by everyone"
  on public.messages for select
  using (true);

-- Posting requires the caller to be signed in (anonymous auth counts) and
-- to post as themselves — auth.uid() is verified by Supabase Auth, so
-- this can't be spoofed the way a client-supplied session_id could be.
drop policy if exists "Users can post their own messages" on public.messages;
create policy "Users can post their own messages"
  on public.messages for insert
  with check (auth.uid()::text = session_id);

drop policy if exists "Users can delete their own messages" on public.messages;
create policy "Users can delete their own messages"
  on public.messages for delete
  using (auth.uid()::text = session_id);

-- Known gap, matching the roadmap's own "light moderation for v1" scope:
-- there is no rate limiting on inserts here, unlike upload-strip (which
-- only got that treatment in v1.1, after v1 shipped without it). If spam
-- becomes a real problem, the fix is the same shape as v1.1's: move
-- inserts behind an edge function that checks a per-user rate limit
-- before writing. Manual moderation for now is a Supabase dashboard
-- delete on this table — no admin UI needed yet, per the roadmap.