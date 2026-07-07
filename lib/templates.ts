import { supabase } from './supabase';

export interface TemplateRow {
  id: string;
  name: string;
  hex_color: string;
  border_class: string;
  accent_class: string;
  paper_class: string;
  category: string;
  sort_order: number;
}

// Hardcoded fallback — mirrors the 9 classic themes seeded in the DB.
// Used as the initial state and as a fallback when the fetch fails or offline.
export const LOCAL_TEMPLATES: TemplateRow[] = [
  { id: 'pink',     name: 'Y2K Pink',       hex_color: '#FF1493', border_class: 'border-primary',             accent_class: 'bg-primary',              paper_class: 'bg-pink-50',    category: 'classic', sort_order: 1 },
  { id: 'lavender', name: 'Lavender Dream', hex_color: '#4B0082', border_class: 'border-secondary-foreground', accent_class: 'bg-secondary-foreground',  paper_class: 'bg-violet-50',  category: 'classic', sort_order: 2 },
  { id: 'blue',     name: 'Baby Blue',      hex_color: '#0EA5E9', border_class: 'border-tertiary',             accent_class: 'bg-tertiary',              paper_class: 'bg-sky-50',     category: 'classic', sort_order: 3 },
  { id: 'mint',     name: 'Mint Pop',       hex_color: '#10B981', border_class: 'border-emerald-400',          accent_class: 'bg-emerald-500',           paper_class: 'bg-emerald-50', category: 'classic', sort_order: 4 },
  { id: 'lemon',    name: 'Lemon Flash',    hex_color: '#F59E0B', border_class: 'border-amber-300',            accent_class: 'bg-amber-400',             paper_class: 'bg-yellow-50',  category: 'classic', sort_order: 5 },
  { id: 'coral',    name: 'Coral Crush',    hex_color: '#F97316', border_class: 'border-orange-400',           accent_class: 'bg-orange-500',            paper_class: 'bg-orange-50',  category: 'classic', sort_order: 6 },
  { id: 'grape',    name: 'Grape Beam',     hex_color: '#7C3AED', border_class: 'border-violet-500',           accent_class: 'bg-violet-600',            paper_class: 'bg-purple-50',  category: 'classic', sort_order: 7 },
  { id: 'lime',     name: 'Lime Glow',      hex_color: '#84CC16', border_class: 'border-lime-400',             accent_class: 'bg-lime-500',              paper_class: 'bg-lime-50',    category: 'classic', sort_order: 8 },
  { id: 'mono',     name: 'Mono Star',      hex_color: '#111827', border_class: 'border-gray-900',             accent_class: 'bg-gray-900',              paper_class: 'bg-gray-50',    category: 'classic', sort_order: 9 },
];

export async function fetchTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, hex_color, border_class, accent_class, paper_class, category, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TemplateRow[];
}

const DEFAULT_THEME_HEX = LOCAL_TEMPLATES[0].hex_color;

/** Resolve footer/export color for a template id (DB rows, then local fallback). */
export function resolveThemeHex(
  themeId: string,
  templates: TemplateRow[] = LOCAL_TEMPLATES,
): string {
  return (
    templates.find((t) => t.id === themeId)?.hex_color ??
    LOCAL_TEMPLATES.find((t) => t.id === themeId)?.hex_color ??
    DEFAULT_THEME_HEX
  );
}
