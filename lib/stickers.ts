import type { PlacedSticker, TextStickerKey, ImageStickerKey } from "./store";

export interface TextStickerDefinition {
  type: "text";
  key: TextStickerKey;
  label: string;
  text: string;
  bg: string;
  fg: string;
  border: string;
  shape: "pill" | "circle" | "ticket";
}

export const TEXT_STICKERS: TextStickerDefinition[] = [
  { type: "text", key: "love",  label: "Love",  text: "LOVE",  bg: "#FFE4F1", fg: "#BE185D", border: "#FF1493", shape: "pill"   },
  { type: "text", key: "xoxo",  label: "XOXO",  text: "XOXO",  bg: "#EDE9FE", fg: "#6D28D9", border: "#A78BFA", shape: "ticket" },
  { type: "text", key: "bff",   label: "BFF",   text: "BFF",   bg: "#D1FAE5", fg: "#047857", border: "#34D399", shape: "circle" },
  { type: "text", key: "wow",   label: "Wow",   text: "WOW",   bg: "#FEF3C7", fg: "#B45309", border: "#FBBF24", shape: "pill"   },
  { type: "text", key: "cute",  label: "Cute",  text: "CUTE",  bg: "#DBEAFE", fg: "#1D4ED8", border: "#60A5FA", shape: "ticket" },
  { type: "text", key: "flash", label: "Flash", text: "FLASH", bg: "#FCE7F3", fg: "#9D174D", border: "#F472B6", shape: "pill"   },
];

export interface ImageStickerDefinition {
  type: "image";
  key: ImageStickerKey;
  label: string;
  src: string;
}

export interface StickerPack {
  id: string;
  label: string;
  emoji: string;
  stickers: ImageStickerDefinition[];
}

function makeImagePack(
  id: "collage" | "flowers" | "ribbon" | "y2k",
  label: string,
  emoji: string,
  count: number,
): StickerPack {
  return {
    id,
    label,
    emoji,
    stickers: Array.from({ length: count }, (_, i) => ({
      type: "image" as const,
      key: `${id}-${i + 1}` as ImageStickerKey,
      label: `${label} ${i + 1}`,
      src: `/stickers/${id}/${i + 1}.png`,
    })),
  };
}

export const IMAGE_PACKS: StickerPack[] = [
  makeImagePack("collage", "Collage", "🎓", 10),
  makeImagePack("flowers", "Flowers", "🌸", 10),
  makeImagePack("ribbon",  "Ribbon",  "🎀", 10),
  makeImagePack("y2k",     "Y2K",     "⭐", 10),
];

export const STICKERS = TEXT_STICKERS;

export function getTextStickerDefinition(key: TextStickerKey): TextStickerDefinition {
  return TEXT_STICKERS.find((s) => s.key === key) ?? TEXT_STICKERS[0];
}

export function getImageStickerDefinition(key: ImageStickerKey): ImageStickerDefinition | undefined {
  for (const pack of IMAGE_PACKS) {
    const found = pack.stickers.find((s) => s.key === key);
    if (found) return found;
  }
  return undefined;
}

export function getStickerDefinition(key: string): TextStickerDefinition | ImageStickerDefinition {
  if (key.includes("-")) {
    const img = getImageStickerDefinition(key as ImageStickerKey);
    if (img) return img;
  }
  return getTextStickerDefinition(key as TextStickerKey);
}

export function getNextStickerPosition(count: number): Pick<PlacedSticker, "x" | "y" | "rotation"> {
  const positions = [
    { x: 18, y: 16, rotation: -9 },
    { x: 78, y: 24, rotation:  8 },
    { x: 24, y: 62, rotation:  7 },
    { x: 74, y: 76, rotation: -6 },
    { x: 50, y: 43, rotation:  3 },
    { x: 40, y: 84, rotation: -4 },
  ];
  return positions[count % positions.length];
}
