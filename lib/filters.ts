import type { FilterKey } from './store';

export const FILTER_PRESETS: Record<FilterKey, string> = {
  none: '',
  cherry: 'saturate(1.4) contrast(1.05) brightness(1.05) hue-rotate(-5deg)',
  noir: 'grayscale(1) contrast(1.15)',
  cyber: 'contrast(1.3) saturate(1.25) hue-rotate(15deg)',
  vintage: 'sepia(0.5) contrast(0.95) brightness(1.05)',
};

export function buildFilterCss(filter: FilterKey, brightness: number, contrast: number): string {
  const preset = FILTER_PRESETS[filter] ?? '';
  const b = `brightness(${1 + brightness / 100})`;
  const c = `contrast(${1 + contrast / 100})`;
  return [preset, b, c].filter(Boolean).join(' ');
}
