'use client';

import { PointerEvent, useRef } from 'react';
import { useBoothStore } from '@/lib/store';
import { buildFilterCss } from '@/lib/filters';
import { getStickerDefinition } from '@/lib/stickers';

const THEME_STYLES: Record<string, { border: string; text: string }> = {
  pink: { border: 'border-primary/20', text: 'text-primary' },
  lavender: { border: 'border-secondary-foreground/20', text: 'text-secondary-foreground' },
  blue: { border: 'border-tertiary/40', text: 'text-tertiary' },
  mint: { border: 'border-emerald-400/45', text: 'text-emerald-600' },
  lemon: { border: 'border-amber-300/60', text: 'text-amber-600' },
  coral: { border: 'border-orange-400/50', text: 'text-orange-600' },
  grape: { border: 'border-violet-500/40', text: 'text-violet-700' },
  lime: { border: 'border-lime-400/55', text: 'text-lime-700' },
  mono: { border: 'border-gray-900/35', text: 'text-gray-900' },
};

export function StripPreview() {
  const { frames, filter, adjustments, theme, caption, stickers, updateSticker } = useBoothStore();
  const stripRef = useRef<HTMLDivElement>(null);
  const filterCss = buildFilterCss(filter, adjustments.brightness, adjustments.contrast);
  const themeStyle = THEME_STYLES[theme] ?? THEME_STYLES.pink;

  const moveSticker = (id: string, event: PointerEvent<HTMLButtonElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;

    updateSticker(id, {
      x: Math.min(96, Math.max(4, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(96, Math.max(4, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  };

  return (
    <div
      className={`w-full max-w-xs bg-background p-4 rounded-[2rem] shadow-2xl border-4 ${themeStyle.border} relative`}
    >
      <div ref={stripRef} className="relative flex flex-col gap-3 bg-background p-3 rounded-2xl border border-border/40">
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
        {stickers.map((sticker) => {
          const stickerDef = getStickerDefinition(sticker.key);
          return (
            <button
              key={sticker.id}
              type="button"
              title="Drag sticker"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                moveSticker(sticker.id, event);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  moveSticker(sticker.id, event);
                }
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              className={`absolute z-20 flex select-none touch-none items-center justify-center border-2 px-2 font-heading font-extrabold shadow-md transition-transform hover:scale-105 ${
                stickerDef.shape === 'circle'
                  ? 'rounded-full aspect-square'
                  : stickerDef.shape === 'ticket'
                    ? 'rounded-md'
                    : 'rounded-full'
              }`}
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                width: `${sticker.size}%`,
                minWidth: 36,
                minHeight: 28,
                backgroundColor: stickerDef.bg,
                color: stickerDef.fg,
                borderColor: stickerDef.border,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                fontSize: `clamp(9px, ${sticker.size * 0.12}rem, 14px)`,
              }}
            >
              {stickerDef.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
