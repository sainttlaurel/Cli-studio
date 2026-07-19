-- Migration: v3.5 — Admin support tables.
-- Adds a lightweight admin action log and a key-value settings store.

-- 1. Admin action log (replaces the mock audit log)
create table if not exists public.admin_actions (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  resource   text not null,
  detail     text,
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_created_at_idx
  on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;

-- Only service role can read/write (called from API routes, not browser)
-- No anon policies — admin API routes use the service role key.

-- 2. Admin settings (key-value store)
create table if not exists public.admin_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

-- Seed default settings
insert into public.admin_settings (key, value) values
  ('rateLimitStripsPerHour', '12'),
  ('rateLimitStripsPerDay',  '50'),
  ('isMaintenanceMode',      'false'),
  ('maintenanceMessage',     ''),
  ('showGallery',            'true'),
  ('showFeedbackWall',       'true'),
  ('defaultTemplate',        'pink')
on conflict (key) do nothing;
