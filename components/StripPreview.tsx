'use client';

import { useBoothStore } from '@/lib/store';
import { buildFilterCss } from '@/lib/filters';

const THEME_STYLES: Record<string, { border: string; text: string }> = {
  pink: { border: 'border-primary/20', text: 'text-primary' },
  lavender: { border: 'border-secondary-foreground/20', text: 'text-secondary-foreground' },
  blue: { border: 'border-tertiary/40', text: 'text-tertiary' },
};

export function StripPreview() {
  const { frames, filter, adjustments, theme, caption } = useBoothStore();
  const filterCss = buildFilterCss(filter, adjustments.brightness, adjustments.contrast);
  const themeStyle = THEME_STYLES[theme] ?? THEME_STYLES.pink;

  return (
    <div
      className={`w-full max-w-xs bg-background p-4 rounded-[2rem] shadow-2xl border-4 ${themeStyle.border} relative`}
    >
      <div className="flex flex-col gap-3 bg-background p-3 rounded-2xl border border-border/40">
        {frames.length === 0 && (
          <div className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
            No frames yet
          </div>
        )}
        {frames.map((src, i) => (
          <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-primary/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Shot ${i + 1}`}
              className="w-full h-full object-cover"
              style={{ filter: filterCss }}
            />
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t border-dashed border-border px-1">
          <span className={`text-[11px] font-heading font-extrabold tracking-widest ${themeStyle.text}`}>
            CLICKSTUDIO.APP
          </span>
          <span className="text-[10px] text-muted-foreground font-bold">
            {new Date().toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })} ✨
          </span>
        </div>
        {caption && (
          <div className="text-center text-xs font-heading font-bold text-foreground pb-1">{caption}</div>
        )}
      </div>
    </div>
  );
}
