-- v2.7 Template Packs: move local frame themes into a Supabase table
--
-- Seeded with the 9 existing hardcoded themes so nothing breaks on first deploy.
-- New templates can be inserted via the Supabase dashboard or a future admin UI
-- without a code deploy.

-- 1. Templates table
create table if not exists public.templates (
  id text primary key,           -- matches the current ThemeKey values
  name text not null,
  hex_color text not null,       -- used by the canvas compositor
  border_class text not null,    -- Tailwind border class for editor preview
  accent_class text not null,    -- Tailwind accent/dot class for editor preview
  paper_class text not null,     -- Tailwind background class for editor preview
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

-- No insert/update/delete for anon — manage via Supabase dashboard or service role.

-- 2. Seed the 9 existing local themes
insert into public.templates (id, name, hex_color, border_class, accent_class, paper_class, category, sort_order)
values
  ('pink',     'Y2K Pink',        '#FF1493', 'border-primary',            'bg-primary',             'bg-pink-50',    'classic', 1),
  ('lavender', 'Lavender Dream',  '#4B0082', 'border-secondary-foreground','bg-secondary-foreground','bg-violet-50',  'classic', 2),
  ('blue',     'Baby Blue',       '#0EA5E9', 'border-tertiary',           'bg-tertiary',            'bg-sky-50',     'classic', 3),
  ('mint',     'Mint Pop',        '#10B981', 'border-emerald-400',        'bg-emerald-500',         'bg-emerald-50', 'classic', 4),
  ('lemon',    'Lemon Flash',     '#F59E0B', 'border-amber-300',          'bg-amber-400',           'bg-yellow-50',  'classic', 5),
  ('coral',    'Coral Crush',     '#F97316', 'border-orange-400',         'bg-orange-500',          'bg-orange-50',  'classic', 6),
  ('grape',    'Grape Beam',      '#7C3AED', 'border-violet-500',         'bg-violet-600',          'bg-purple-50',  'classic', 7),
  ('lime',     'Lime Glow',       '#84CC16', 'border-lime-400',           'bg-lime-500',            'bg-lime-50',    'classic', 8),
  ('mono',     'Mono Star',       '#111827', 'border-gray-900',           'bg-gray-900',            'bg-gray-50',    'classic', 9)
on conflict (id) do nothing;
