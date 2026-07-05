'use client';

import { create, useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';

export type FilterKey = 'none' | 'cherry' | 'noir' | 'cyber' | 'vintage';
export type ThemeKey = 'pink' | 'lavender' | 'blue';

interface Adjustments {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
}

interface BoothState {
  frames: string[];
  theme: ThemeKey;
  filter: FilterKey;
  adjustments: Adjustments;
  caption: string;
  mirror: boolean;
  soundEnabled: boolean;
  addFrame: (dataUrl: string) => void;
  removeFrame: (index: number) => void;
  resetFrames: () => void;
  setTheme: (t: ThemeKey) => void;
  setFilter: (f: FilterKey) => void;
  setAdjustments: (a: Partial<Adjustments>) => void;
  setCaption: (c: string) => void;
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
  mirror: true,
  soundEnabled: true,
};

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
