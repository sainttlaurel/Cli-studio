"use client";

import React, { PointerEvent, useRef } from "react";
import {
  useBoothStore,
  resolveLayerOrder,
  type AspectRatio,
  type FrameShape,
} from "@/lib/store";
import { buildFilterCss } from "@/lib/filters";
import { getStickerDefinition } from "@/lib/stickers";
import Image from "next/image";

// ─── Per-frame aspect ratio ────────────────────────────────────────────────────
// These drive the actual shape of each frame via CSS aspect-ratio.
const ASPECT_RATIO_STYLES: Record<AspectRatio, React.CSSProperties> = {
  portrait:  { aspectRatio: "3 / 4"  },
  square:    { aspectRatio: "1 / 1"  },
  landscape: { aspectRatio: "4 / 3"  },
};

// ─── Frame corner / style ─────────────────────────────────────────────────────
const SHAPE_CLASSES: Record<FrameShape, string> = {
  classic:  "rounded-md",
  rounded:  "rounded-2xl",
  polaroid: "rounded-xl border-[6px] border-white shadow-xl",
  circular: "rounded-full",
};

// ─── Theme border + label color ───────────────────────────────────────────────
const THEME_STYLES: Record<string, { border: string; text: string }> = {
  pink:     { border: "border-primary/20",              text: "text-primary"              },
  lavender: { border: "border-secondary-foreground/20", text: "text-secondary-foreground" },
  blue:     { border: "border-tertiary/40",             text: "text-tertiary"             },
  mint:     { border: "border-emerald-400/45",          text: "text-emerald-600"          },
  lemon:    { border: "border-amber-300/60",            text: "text-amber-600"            },
  coral:    { border: "border-orange-400/50",           text: "text-orange-600"           },
  grape:    { border: "border-violet-500/40",           text: "text-violet-700"           },
  lime:     { border: "border-lime-400/55",             text: "text-lime-700"             },
  mono:     { border: "border-gray-900/35",             text: "text-gray-900"             },
};

const FONT_MAP: Record<string, string> = {
  fredoka: "var(--font-heading)",
  inter:   "var(--font-sans)",
  mono:    "monospace",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StripPreview() {
  const {
    frames,
    filter,
    adjustments,
    theme,
    caption,
    stickers,
    updateSticker,
    textLayers,
    updateTextLayer,
    layerOrder,
    aspectRatio,
    frameShape,
    frameFilters,
  } = useBoothStore();

  const shapeClass  = SHAPE_CLASSES[frameShape] ?? SHAPE_CLASSES.classic;
  const frameStyle  = ASPECT_RATIO_STYLES[aspectRatio] ?? ASPECT_RATIO_STYLES.portrait;
  const themeStyle  = THEME_STYLES[theme] ?? THEME_STYLES.pink;
  const stack       = resolveLayerOrder(layerOrder, stickers, textLayers);
  const stripRef    = useRef<HTMLDivElement>(null);

  // ── Drag helpers ─────────────────────────────────────────────────────────────
  const dragSticker = (id: string, e: PointerEvent<HTMLButtonElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateSticker(id, {
      x: Math.min(96, Math.max(4, ((e.clientX - rect.left)  / rect.width)  * 100)),
      y: Math.min(96, Math.max(4, ((e.clientY - rect.top)   / rect.height) * 100)),
    });
  };

  const dragText = (id: string, e: PointerEvent<HTMLButtonElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateTextLayer(id, {
      x: Math.min(96, Math.max(4, ((e.clientX - rect.left)  / rect.width)  * 100)),
      y: Math.min(96, Math.max(4, ((e.clientY - rect.top)   / rect.height) * 100)),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    /*
      The strip is intentionally narrow and tall — like a real film strip.
      Width is capped at 320px so portrait frames look portrait, circular
      frames look circular, etc.  The column is sticky so it stays visible
      while the user scrolls through editor controls on the right.
    */
    <div className="w-full flex justify-center">
      <div
        className={`
          w-full max-w-[320px]
          bg-background rounded-3xl border-4 ${themeStyle.border}
          shadow-2xl p-3 flex flex-col gap-2
        `}
      >
        {/* ── Strip frames ──────────────────────────────────────────────── */}
        <div
          ref={stripRef}
          className="relative flex flex-col gap-2 bg-background rounded-2xl [container-type:inline-size]"
        >
          {frames.length === 0 && (
            <div
              className={`w-full ${shapeClass} bg-muted flex items-center justify-center text-xs text-muted-foreground`}
              style={{ ...frameStyle, minHeight: 120 }}
            >
              No frames yet
            </div>
          )}

          {frames.map((src, i) => {
            const frameFilter    = frameFilters[i] ?? filter;
            const frameFilterCss = buildFilterCss(frameFilter, adjustments.brightness, adjustments.contrast);
            return (
              <div
                key={i}
                className={`relative w-full overflow-hidden ${shapeClass} bg-white shadow-md`}
                style={frameStyle}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Shot ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: frameFilterCss }}
                />
              </div>
            );
          })}

          {/* ── Sticker / text layers (positioned relative to the strip) ── */}
          {stack.map((ref) => {
            // ── Stickers ──
            if (ref.kind === "sticker") {
              const sticker = stickers.find((s) => s.id === ref.id);
              if (!sticker || !sticker.visible) return null;
              const def = getStickerDefinition(sticker.key);

              const pointerProps = {
                onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragSticker(sticker.id, e);
                },
                onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) dragSticker(sticker.id, e);
                },
                onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
                },
              };

              const pos: React.CSSProperties = {
                left:      `${sticker.x}%`,
                top:       `${sticker.y}%`,
                width:     `${sticker.size}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                opacity:   (sticker.opacity ?? 100) / 100,
              };

              if (def.type === "image") {
                return (
                  <button
                    key={`s-${sticker.id}`}
                    type="button"
                    title="Drag sticker"
                    {...pointerProps}
                    className="absolute select-none touch-none transition-transform hover:scale-105 drop-shadow-md"
                    style={pos}
                  >
                    <Image src={def.src} alt={def.label} width={120} height={120}
                      className="w-full h-auto pointer-events-none" draggable={false} />
                  </button>
                );
              }

              return (
                <button
                  key={`s-${sticker.id}`}
                  type="button"
                  title="Drag sticker"
                  {...pointerProps}
                  className={`absolute flex select-none touch-none items-center justify-center border-2 px-2 font-heading font-extrabold shadow-md transition-transform hover:scale-105 ${
                    def.shape === "circle"  ? "rounded-full aspect-square" :
                    def.shape === "ticket"  ? "rounded-md" :
                    "rounded-full"
                  }`}
                  style={{
                    ...pos,
                    minWidth: 36, minHeight: 28,
                    backgroundColor: def.bg,
                    color:           def.fg,
                    borderColor:     def.border,
                    fontSize: `clamp(9px, ${sticker.size * 0.12}rem, 14px)`,
                  }}
                >
                  {def.text}
                </button>
              );
            }

            // ── Text layers ──
            const layer = textLayers.find((t) => t.id === ref.id);
            if (!layer || !layer.visible) return null;

            return (
              <button
                key={`t-${layer.id}`}
                type="button"
                title="Drag text"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragText(layer.id, e); }}
                onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) dragText(layer.id, e); }}
                onPointerUp={(e)   => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
                className="absolute select-none touch-none whitespace-nowrap font-extrabold drop-shadow-md transition-transform hover:scale-105"
                style={{
                  left:       `${layer.x}%`,
                  top:        `${layer.y}%`,
                  transform:  `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                  color:      layer.color,
                  fontSize:   `clamp(8px, ${layer.size}cqw, 64px)`,
                  fontFamily: FONT_MAP[layer.fontFamily] ?? "inherit",
                  textShadow: "0 1px 4px rgba(0,0,0,0.22)",
                  opacity:    (layer.opacity ?? 100) / 100,
                }}
              >
                {layer.text}
              </button>
            );
          })}
        </div>

        {/* ── Strip footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-dashed border-border/80 pt-1.5 px-1">
          <span className={`text-[10px] font-heading font-extrabold tracking-widest ${themeStyle.text}`}>
            CLICKSTUDIO.APP
          </span>
          <span className="text-[10px] text-muted-foreground font-bold">
            {new Date().toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" })} ✨
          </span>
        </div>

        {caption && (
          <div className="text-center text-xs font-heading font-bold text-foreground pb-0.5">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
