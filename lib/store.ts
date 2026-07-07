'use client';

import { create, useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';

export type FilterKey = 'none' | 'cherry' | 'noir' | 'cyber' | 'vintage';
export type StickerKey = 'love' | 'xoxo' | 'bff' | 'wow' | 'cute' | 'flash';
export type ThemeKey =
  | 'pink'
  | 'lavender'
  | 'blue'
  | 'mint'
  | 'lemon'
  | 'coral'
  | 'grape'
  | 'lime'
  | 'mono';

interface Adjustments {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
}

export interface PlacedSticker {
  id: string;
  key: StickerKey;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface BoothState {
  frames: string[];
  theme: ThemeKey;
  filter: FilterKey;
  adjustments: Adjustments;
  caption: string;
  stickers: PlacedSticker[];
  mirror: boolean;
  soundEnabled: boolean;
  addFrame: (dataUrl: string) => void;
  removeFrame: (index: number) => void;
  resetFrames: () => void;
  setTheme: (t: ThemeKey) => void;
  setFilter: (f: FilterKey) => void;
  setAdjustments: (a: Partial<Adjustments>) => void;
  setCaption: (c: string) => void;
  addSticker: (sticker: Omit<PlacedSticker, 'id'>) => void;
  updateSticker: (id: string, patch: Partial<Omit<PlacedSticker, 'id' | 'key'>>) => void;
  removeSticker: (id: string) => void;
  clearStickers: () => void;
  toggleMirror: () => void;
  toggleSound: () => void;
  resetAll: () => void;
}

const initial = {
  frames: [] as string[],
  theme: 'pink' as ThemeKey,
  filter: 'cherry' as FilterKey,
  adjustments: { brightness: 0, contrast: 0 },
  caption: '',
  stickers: [] as PlacedSticker[],
  mirror: true,
  soundEnabled: true,
};

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `sticker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useBoothStore = create<BoothState>()(
  temporal(
    persist(
      (set) => ({
        ...initial,
        addFrame: (dataUrl) =>
          set((s) => (s.frames.length >= 4 ? s : { frames: [...s.frames, dataUrl] })),
        removeFrame: (index) =>
          set((s) => ({ frames: s.frames.filter((_, i) => i !== index) })),
        resetFrames: () => set({ frames: [] }),
        setTheme: (theme) => set({ theme }),
        setFilter: (filter) => set({ filter }),
        setAdjustments: (a) => set((s) => ({ adjustments: { ...s.adjustments, ...a } })),
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
              sticker.id === id ? { ...sticker, ...patch } : sticker
            ),
          })),
        removeSticker: (id) =>
          set((s) => ({ stickers: s.stickers.filter((sticker) => sticker.id !== id) })),
        clearStickers: () => set({ stickers: [] }),
        toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
        toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
        resetAll: () => set({ ...initial }),
      }),
      {
        name: 'clickstudio-booth',
        storage: createJSONStorage(() => sessionStorage),
      }
    ),
    {
      // Only the fields it makes sense to step back/forward through in the
      // editor go into undo history. Frames, mirror, and sound preference
      // are deliberately excluded.
      partialize: (state) => ({
        filter: state.filter,
        adjustments: state.adjustments,
        theme: state.theme,
        caption: state.caption,
        stickers: state.stickers,
      }),
      limit: 50,
    }
  )
);

/**
 * React hook exposing undo/redo controls. zundo keeps its history on a
 * separate vanilla store at `useBoothStore.temporal` — this wraps it with
 * zustand's `useStore` so components re-render as history changes.
 */
export function useBoothTemporal() {
  return useStore(useBoothStore.temporal, (state) => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.pastStates.length > 0,
    canRedo: state.futureStates.length > 0,
  }));
}
