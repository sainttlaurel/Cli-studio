-- Migration: v3.4 — Emoji reactions on wall messages + yearbook strip signing.

-- 1. Add strip_id to messages so a message can optionally be tied to a
--    specific strip (yearbook signing). NULL = global wall message (existing
--    behaviour). Non-null = a signature on a particular share page.

alter table public.messages
  add column if not exists strip_id text references public.strips(id) on delete cascade;

create index if not exists messages_strip_id_idx on public.messages (strip_id)
  where strip_id is not null;

-- 2. Emoji reactions on wall messages.
--    One row per (message_id, session_id, emoji) — unique constraint
--    prevents double-reacting with the same emoji.

create table if not exists public.message_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.messages(id) on delete cascade,
  session_id  text not null,
  emoji       text not null check (emoji in ('❤️', '✨', '😂', '🔥')),
  created_at  timestamptz not null default now(),
  unique (message_id, session_id, emoji)
);

create index if not exists reactions_message_id_idx
  on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

-- Anyone can read reactions (needed to show counts).
drop policy if exists "Reactions are readable by everyone" on public.message_reactions;
create policy "Reactions are readable by everyone"
  on public.message_reactions for select
  using (true);

-- Authenticated users can insert their own reactions.
drop policy if exists "Users can add their own reactions" on public.message_reactions;
create policy "Users can add their own reactions"
  on public.message_reactions for insert
  with check (auth.uid()::text = session_id);

-- Users can delete (un-react) only their own reactions.
drop policy if exists "Users can remove their own reactions" on public.message_reactions;
create policy "Users can remove their own reactions"
  on public.message_reactions for delete
  using (auth.uid()::text = session_id);

-- 3. Allow inserting yearbook messages (strip_id is not null).
--    The existing insert policy covers global wall messages
--    (auth.uid()::text = session_id). We need to also allow strip
--    messages via the same policy — it already covers both since
--    strip_id is just a nullable column on the same insert path.
--    No additional policy needed; existing policy applies to all inserts.
