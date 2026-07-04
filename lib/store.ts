'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  addFrame: (dataUrl: string) => void;
  removeFrame: (index: number) => void;
  resetFrames: () => void;
  setTheme: (t: ThemeKey) => void;
  setFilter: (f: FilterKey) => void;
  setAdjustments: (a: Partial<Adjustments>) => void;
  setCaption: (c: string) => void;
  toggleMirror: () => void;
  resetAll: () => void;
}

const initial = {
  frames: [] as string[],
  theme: 'pink' as ThemeKey,
  filter: 'cherry' as FilterKey,
  adjustments: { brightness: 0, contrast: 0 },
  caption: '',
  mirror: true,
};

export const useBoothStore = create<BoothState>()(
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
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'clickstudio-booth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
