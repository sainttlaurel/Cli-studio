"use client";

import { create, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";

export type FilterKey = "none" | "cherry" | "noir" | "cyber" | "vintage";
// Text badge sticker keys (existing Y2K pack)
export type TextStickerKey = "love" | "xoxo" | "bff" | "wow" | "cute" | "flash";
// Image sticker keys: {pack}-{number}, e.g. 'college-1', 'flowers-3'
export type ImageStickerKey =
  | `college-${number}`
  | `flowers-${number}`
  | `ribbon-${number}`
  | `y2k-${number}`;
export type StickerKey = TextStickerKey | ImageStickerKey;
// Kept as a wide string so the store accepts any template id returned from the DB.
// The 9 classic ids (pink, lavender, blue, etc.) are still valid values.
export type ThemeKey = string;

interface Adjustments {
  brightness: number;
  contrast: number;
}

export interface PlacedSticker {
  id: string;
  key: StickerKey;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export type FontFamily = "fredoka" | "inter" | "mono";

export interface PlacedTextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  fontFamily: FontFamily;
}

interface BoothState {
  frames: string[];
  theme: ThemeKey;
  filter: FilterKey;
  adjustments: Adjustments;
  caption: string;
  stickers: PlacedSticker[];
  textLayers: PlacedTextLayer[];
  mirror: boolean;
  soundEnabled: boolean;
  addFrame: (dataUrl: string) => void;
  removeFrame: (index: number) => void;
  resetFrames: () => void;
  setTheme: (t: ThemeKey) => void;
  setFilter: (f: FilterKey) => void;
  setAdjustments: (a: Partial<Adjustments>) => void;
  setCaption: (c: string) => void;
  addSticker: (sticker: Omit<PlacedSticker, "id">) => void;
  updateSticker: (
    id: string,
    patch: Partial<Omit<PlacedSticker, "id" | "key">>,
  ) => void;
  removeSticker: (id: string) => void;
  clearStickers: () => void;
  addTextLayer: (layer: Omit<PlacedTextLayer, "id">) => void;
  updateTextLayer: (
    id: string,
    patch: Partial<Omit<PlacedTextLayer, "id">>,
  ) => void;
  removeTextLayer: (id: string) => void;
  clearTextLayers: () => void;
  toggleMirror: () => void;
  toggleSound: () => void;
  resetAll: () => void;
}

const initial = {
  frames: [] as string[],
  theme: "pink" as ThemeKey,
  filter: "cherry" as FilterKey,
  adjustments: { brightness: 0, contrast: 0 },
  caption: "",
  stickers: [] as PlacedSticker[],
  textLayers: [] as PlacedTextLayer[],
  mirror: true,
  soundEnabled: true,
};

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sticker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useBoothStore = create<BoothState>()(
  temporal(
    persist(
      (set) => ({
        ...initial,
        addFrame: (dataUrl) =>
          set((s) =>
            s.frames.length >= 4 ? s : { frames: [...s.frames, dataUrl] },
          ),
        removeFrame: (index) =>
          set((s) => ({ frames: s.frames.filter((_, i) => i !== index) })),
        resetFrames: () => set({ frames: [] }),
        setTheme: (theme) => set({ theme }),
        setFilter: (filter) => set({ filter }),
        setAdjustments: (a) =>
          set((s) => ({ adjustments: { ...s.adjustments, ...a } })),
        setCaption: (caption) => set({ caption }),
        addSticker: (sticker) =>
          set((s) => ({
            stickers:
              s.stickers.length >= 12
                ? s.stickers
                : [...s.stickers, { id: createId(), ...sticker }],
          })),
        updateSticker: (id, patch) =>
          set((s) => ({
            stickers: s.stickers.map((sticker) =>
              sticker.id === id ? { ...sticker, ...patch } : sticker,
            ),
          })),
        removeSticker: (id) =>
          set((s) => ({
            stickers: s.stickers.filter((sticker) => sticker.id !== id),
          })),
        clearStickers: () => set({ stickers: [] }),
        addTextLayer: (layer) =>
          set((s) => ({
            textLayers:
              s.textLayers.length >= 10
                ? s.textLayers
                : [...s.textLayers, { id: createId(), ...layer }],
          })),
        updateTextLayer: (id, patch) =>
          set((s) => ({
            textLayers: s.textLayers.map((layer) =>
              layer.id === id ? { ...layer, ...patch } : layer,
            ),
          })),
        removeTextLayer: (id) =>
          set((s) => ({
            textLayers: s.textLayers.filter((layer) => layer.id !== id),
          })),
        clearTextLayers: () => set({ textLayers: [] }),
        toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
        toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
        resetAll: () => set({ ...initial }),
      }),
      {
        name: "clickstudio-booth",
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
    {
      partialize: (state) => ({
        filter: state.filter,
        adjustments: state.adjustments,
        theme: state.theme,
        caption: state.caption,
        stickers: state.stickers,
        textLayers: state.textLayers,
      }),
      limit: 50,
    },
  ),
);

export function useBoothTemporal() {
  return useStore(useBoothStore.temporal, (state) => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.pastStates.length > 0,
    canRedo: state.futureStates.length > 0,
  }));
}
