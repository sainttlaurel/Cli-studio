"use client";

import { TEXT_STICKERS as ALL_TEXT_STICKERS, IMAGE_PACKS as ALL_IMAGE_PACKS, type TextStickerDefinition, type StickerPack } from "./stickers";

// Storage key for admin sticker configuration
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
      stickers: Object.fromEntries(
        ALL_TEXT_STICKERS.map((s) => [s.key, true])
      ),
    },
    collage: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "collage")?.stickers.map((s) => [s.key, true]) || []
      ),
    },
    flowers: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "flowers")?.stickers.map((s) => [s.key, true]) || []
      ),
    },
    ribbon: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "ribbon")?.stickers.map((s) => [s.key, true]) || []
      ),
    },
    y2k: {
      is_active: true,
      stickers: Object.fromEntries(
        ALL_IMAGE_PACKS.find((p) => p.id === "y2k")?.stickers.map((s) => [s.key, true]) || []
      ),
    },
  },
};

/**
 * Get the current sticker configuration from localStorage
 */
export function getStickerConfig(): StickerConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STICKER_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StickerConfig;
      // Merge with defaults to ensure all packs/stickers are present
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        packs: {
          ...DEFAULT_CONFIG.packs,
          ...parsed.packs,
        },
      };
    }
  } catch {
    // If parsing fails, return defaults
  }

  return DEFAULT_CONFIG;
}

/**
 * Set the sticker configuration in localStorage
 */
export function setStickerConfig(config: StickerConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STICKER_CONFIG_KEY, JSON.stringify(config));
  }
}

/**
 * Save a complete packs configuration (for admin page)
 */
export function savePacksConfig(packs: { id: string; is_active: boolean; stickers: { id: string; name: string; file: string; is_active: boolean }[] }[]): void {
  const config = getStickerConfig();

  packs.forEach((pack) => {
    if (!config.packs[pack.id]) {
      config.packs[pack.id] = { is_active: true, stickers: {} };
    }
    config.packs[pack.id].is_active = pack.is_active;

    pack.stickers.forEach((sticker) => {
      // Extract the actual sticker key from the id (e.g., "y2k-text-0" -> "love")
      // For text stickers, we need to map the id to the actual key
      const stickerKey = getStickerKeyFromAdminId(pack.id, sticker.id);
      if (stickerKey) {
        config.packs[pack.id].stickers[stickerKey] = sticker.is_active;
      }
    });
  });

  setStickerConfig(config);
}

/**
 * Map admin sticker id to actual sticker key
 */
function getStickerKeyFromAdminId(packId: string, adminStickerId: string): string | null {
  if (packId === "y2k-text") {
    // Admin uses ids like "y2k-text-0", "y2k-text-1", etc.
    // Map to actual text sticker keys: love, xoxo, bff, wow, cute, flash
    const textKeys = ["love", "xoxo", "bff", "wow", "cute", "flash"];
    const index = parseInt(adminStickerId.split("-").pop() || "");
    return textKeys[index] || null;
  }

  // For image packs, the admin id format is "{pack}-{index}" and sticker key is "{pack}-{index+1}"
  const parts = adminStickerId.split("-");
  if (parts.length >= 2) {
    const pack = parts[0];
    const index = parseInt(parts[parts.length - 1]);
    if (!isNaN(index)) {
      return `${pack}-${index + 1}`;
    }
  }

  return null;
}

/**
 * Get available text stickers based on configuration
 */
export function getAvailableTextStickers(): TextStickerDefinition[] {
  const config = getStickerConfig();
  const packConfig = config.packs["y2k-text"];

  if (!packConfig?.is_active) {
    return [];
  }

  return ALL_TEXT_STICKERS.filter((sticker) => packConfig.stickers[sticker.key] !== false);
}

/**
 * Get available image sticker packs based on configuration
 */
export function getAvailableImagePacks(): StickerPack[] {
  const config = getStickerConfig();

  return ALL_IMAGE_PACKS.filter((pack) => {
    const packConfig = config.packs[pack.id];
    if (!packConfig?.is_active) {
      return false;
    }

    // Check if at least one sticker in the pack is active
    const activeStickers = pack.stickers.filter(
      (sticker) => packConfig.stickers[sticker.key] !== false
    );
    return activeStickers.length > 0;
  }).map((pack) => {
    const packConfig = config.packs[pack.id];
    return {
      ...pack,
      stickers: pack.stickers.filter(
        (sticker) => packConfig?.stickers[sticker.key] !== false
      ),
    };
  });
}

/**
 * Get all available stickers (both text and image) based on configuration
 */
export function getAvailableStickers() {
  return {
    text: getAvailableTextStickers(),
    imagePacks: getAvailableImagePacks(),
  };
}

/**
 * Check if a specific sticker key is available
 */
export function isStickerAvailable(key: string): boolean {
  const config = getStickerConfig();

  // Check text stickers
  if (ALL_TEXT_STICKERS.some((s) => s.key === key)) {
    const packConfig = config.packs["y2k-text"];
    return packConfig?.is_active !== false && packConfig?.stickers[key] !== false;
  }

  // Check image stickers
  for (const pack of ALL_IMAGE_PACKS) {
    const sticker = pack.stickers.find((s) => s.key === key);
    if (sticker) {
      const packConfig = config.packs[pack.id];
      return packConfig?.is_active !== false && packConfig?.stickers[key] !== false;
    }
  }

  return true; // Default to true if sticker not found
}
