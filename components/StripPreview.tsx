"use client";

import React, { PointerEvent, useRef } from "react";
import { useBoothStore } from "@/lib/store";
import { buildFilterCss } from "@/lib/filters";
import { getStickerDefinition } from "@/lib/stickers";
import Image from "next/image";

const THEME_STYLES: Record<string, { border: string; text: string }> = {
  pink: { border: "border-primary/20", text: "text-primary" },
  lavender: {
    border: "border-secondary-foreground/20",
    text: "text-secondary-foreground",
  },
  blue: { border: "border-tertiary/40", text: "text-tertiary" },
  mint: { border: "border-emerald-400/45", text: "text-emerald-600" },
  lemon: { border: "border-amber-300/60", text: "text-amber-600" },
  coral: { border: "border-orange-400/50", text: "text-orange-600" },
  grape: { border: "border-violet-500/40", text: "text-violet-700" },
  lime: { border: "border-lime-400/55", text: "text-lime-700" },
  mono: { border: "border-gray-900/35", text: "text-gray-900" },
};

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
  } = useBoothStore();
  const stripRef = useRef<HTMLDivElement>(null);
  const filterCss = buildFilterCss(
    filter,
    adjustments.brightness,
    adjustments.contrast,
  );
  const themeStyle = THEME_STYLES[theme] ?? THEME_STYLES.pink;

  const FONT_PREVIEW_MAP: Record<string, string> = {
    fredoka: "var(--font-heading)",
    inter: "var(--font-sans)",
    mono: "monospace",
  };

  const moveSticker = (id: string, event: PointerEvent<HTMLButtonElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;

    updateSticker(id, {
      x: Math.min(
        96,
        Math.max(4, ((event.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.min(
        96,
        Math.max(4, ((event.clientY - rect.top) / rect.height) * 100),
      ),
    });
  };

  const moveTextLayer = (
    id: string,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;

    updateTextLayer(id, {
      x: Math.min(
        96,
        Math.max(4, ((event.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.min(
        96,
        Math.max(4, ((event.clientY - rect.top) / rect.height) * 100),
      ),
    });
  };

  return (
    <div
      className={`w-full min-h-[28rem] lg:min-h-[32rem] bg-background rounded-3xl border border-border/80 shadow-lg overflow-hidden flex flex-col p-5 sm:p-6 lg:p-8`}
    >
      <div
        className={`w-full h-full flex-1 bg-background p-4 sm:p-5 rounded-[2rem] shadow-2xl border-4 ${themeStyle.border} relative flex flex-col justify-center`}
      >
      <div
        ref={stripRef}
        className="relative flex flex-col gap-3 sm:gap-4 bg-background p-3 sm:p-4 rounded-2xl border border-border/40 [container-type:inline-size] h-full"
      >
        {frames.length === 0 && (
          <div className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
            No frames yet
          </div>
        )}
        {frames.map((src, i) => (
          <div
            key={i}
            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-primary/10"
          >
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
          <span
            className={`text-[11px] font-heading font-extrabold tracking-widest ${themeStyle.text}`}
          >
            CLICKSTUDIO.APP
          </span>
          <span className="text-[10px] text-muted-foreground font-bold">
            {new Date().toLocaleDateString("en-US", {
              month: "2-digit",
              year: "2-digit",
            })}{" "}
            ✨
          </span>
        </div>
        {caption && (
          <div className="text-center text-xs font-heading font-bold text-foreground pb-1">
            {caption}
          </div>
        )}
        {stickers.map((sticker) => {
          const stickerDef = getStickerDefinition(sticker.key);
          const sharedPointerProps = {
            onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              moveSticker(sticker.id, event);
            },
            onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                moveSticker(sticker.id, event);
              }
            },
            onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            },
          };
          const sharedStyle: React.CSSProperties = {
            left: `${sticker.x}%`,
            top: `${sticker.y}%`,
            width: `${sticker.size}%`,
            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
            opacity: (sticker.opacity ?? 100) / 100,
          };

          if (stickerDef.type === "image") {
            return (
              <button
                key={sticker.id}
                type="button"
                title="Drag sticker"
                {...sharedPointerProps}
                className="absolute z-20 select-none touch-none transition-transform hover:scale-105 drop-shadow-md"
                style={sharedStyle}
              >
                <Image
                  src={stickerDef.src}
                  alt={stickerDef.label}
                  width={120}
                  height={120}
                  className="w-full h-auto pointer-events-none"
                  draggable={false}
                />
              </button>
            );
          }

          return (
            <button
              key={sticker.id}
              type="button"
              title="Drag sticker"
              {...sharedPointerProps}
              className={`absolute z-20 flex select-none touch-none items-center justify-center border-2 px-2 font-heading font-extrabold shadow-md transition-transform hover:scale-105 ${
                stickerDef.shape === "circle"
                  ? "rounded-full aspect-square"
                  : stickerDef.shape === "ticket"
                    ? "rounded-md"
                    : "rounded-full"
              }`}
              style={{
                ...sharedStyle,
                minWidth: 36,
                minHeight: 28,
                backgroundColor: stickerDef.bg,
                color: stickerDef.fg,
                borderColor: stickerDef.border,
                fontSize: `clamp(9px, ${sticker.size * 0.12}rem, 14px)`,
              }}
            >
              {stickerDef.text}
            </button>
          );
        })}
        {textLayers.map((layer) => (
          <button
            key={layer.id}
            type="button"
            title="Drag text"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              moveTextLayer(layer.id, event);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                moveTextLayer(layer.id, event);
              }
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            className="absolute z-30 select-none touch-none whitespace-nowrap font-extrabold drop-shadow-md transition-transform hover:scale-105"
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
              color: layer.color,
              fontSize: `clamp(8px, ${layer.size}cqw, 64px)`,
              fontFamily: FONT_PREVIEW_MAP[layer.fontFamily] ?? "inherit",
              textShadow: "0 1px 4px rgba(0,0,0,0.22)",
              opacity: (layer.opacity ?? 100) / 100,
            }}
          >
            {layer.text}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
