"use client";

import {
  TEXT_STICKERS as ALL_TEXT_STICKERS,
  IMAGE_PACKS as ALL_IMAGE_PACKS,
  type TextStickerDefinition,
  type StickerPack,
} from "./stickers";

const STICKER_CONFIG_KEY = "clickstudio-sticker-config";

interface StickerConfig {
  packs: Record<string, { is_active: boolean; stickers: Record<string, boolean> }>;
  version: number;
}

const DEFAULT_CONFIG: StickerConfig = {
  version: 1,
  packs: {
    "y2k-text": {
      is_active: true,
      stickers: Object.fromEntries(ALL_TEXT_STICKERS.map((s) => [s.key, true])),
    },
    collage: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "collage")?.stickers.map((s) => [s.key, true]) ?? []
      ),
    },
    flowers: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "flowers")?.stickers.map((s) => [s.key, true]) ?? []
      ),
    },
    ribbon: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "ribbon")?.stickers.map((s) => [s.key, true]) ?? []
      ),
    },
    y2k: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "y2k")?.stickers.map((s) => [s.key, true]) ?? []
      ),
    },
  },
};

export function getStickerConfig(): StickerConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(STICKER_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StickerConfig;
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        packs: { ...DEFAULT_CONFIG.packs, ...parsed.packs },
      };
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_CONFIG;
}

export function setStickerConfig(config: StickerConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STICKER_CONFIG_KEY, JSON.stringify(config));
  }
}

export function savePacksConfig(
  packs: { id: string; is_active: boolean; stickers: { id: string; name: string; file: string; is_active: boolean }[] }[]
): void {
  const config = getStickerConfig();
  packs.forEach((pack) => {
    if (!config.packs[pack.id]) {
      config.packs[pack.id] = { is_active: true, stickers: {} };
    }
    config.packs[pack.id].is_active = pack.is_active;
    pack.stickers.forEach((sticker) => {
      const stickerKey = getStickerKeyFromAdminId(pack.id, sticker.id);
      if (stickerKey) {
        config.packs[pack.id].stickers[stickerKey] = sticker.is_active;
      }
    });
  });
  setStickerConfig(config);
}

function getStickerKeyFromAdminId(packId: string, adminStickerId: string): string | null {
  if (packId === "y2k-text") {
    const textKeys = ["love", "xoxo", "bff", "wow", "cute", "flash"];
    const index = parseInt(adminStickerId.split("-").pop() ?? "");
    return textKeys[index] ?? null;
  }
  const parts = adminStickerId.split("-");
  if (parts.length >= 2) {
    const pack = parts[0];
    const index = parseInt(parts[parts.length - 1]);
    if (!isNaN(index)) return `${pack}-${index + 1}`;
  }
  return null;
}

export function getAvailableTextStickers(): TextStickerDefinition[] {
  const config = getStickerConfig();
  const packConfig = config.packs["y2k-text"];
  if (!packConfig?.is_active) return [];
  return ALL_TEXT_STICKERS.filter((s) => packConfig.stickers[s.key] !== false);
}

export function getAvailableImagePacks(): StickerPack[] {
  const config = getStickerConfig();
  return ALL_IMAGE_PACKS.filter((pack) => {
    const packConfig = config.packs[pack.id];
    if (!packConfig?.is_active) return false;
    return pack.stickers.some((s) => packConfig.stickers[s.key] !== false);
  }).map((pack) => {
    const packConfig = config.packs[pack.id];
    return {
      ...pack,
      stickers: pack.stickers.filter((s) => packConfig?.stickers[s.key] !== false),
    };
  });
}

export function getAvailableStickers() {
  return {
    text: getAvailableTextStickers(),
    imagePacks: getAvailableImagePacks(),
  };
}

export function isStickerAvailable(key: string): boolean {
  const config = getStickerConfig();
  // Check text stickers
  if (ALL_TEXT_STICKERS.some((s) => s.key === key)) {
    const packConfig = config.packs["y2k-text"];
    return packConfig?.is_active !== false && packConfig?.stickers[key] !== false;
  }
  // Check image stickers
  for (const pack of ALL_IMAGE_PACKS) {
    if (pack.stickers.find((s) => s.key === key)) {
      const packConfig = config.packs[pack.id];
      return packConfig?.is_active !== false && packConfig?.stickers[key] !== false;
    }
  }
  return true;
}
