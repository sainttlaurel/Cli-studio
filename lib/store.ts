"use client";

import { create, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";

export type FilterKey = "none" | "cherry" | "noir" | "cyber" | "vintage";
// Text badge sticker keys (existing Y2K pack)
export type TextStickerKey = "love" | "xoxo" | "bff" | "wow" | "cute" | "flash";
// Image sticker keys: {pack}-{number}, e.g. 'collage-1', 'flowers-3'
export type ImageStickerKey =
  | `collage-${number}`
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
  opacity: number; // 10–100
  visible: boolean;
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
  opacity: number; // 10–100
  visible: boolean;
}

export type LayerRef = { kind: "sticker" | "text"; id: string };

/** Merge persisted order with live layers; append any missing ids (stickers, then text). */
export function resolveLayerOrder(
  layerOrder: LayerRef[] | undefined,
  stickers: PlacedSticker[],
  textLayers: PlacedTextLayer[],
): LayerRef[] {
  const stickerIds = new Set(stickers.map((s) => s.id));
  const textIds = new Set(textLayers.map((t) => t.id));

  const resolved = (layerOrder ?? []).filter((ref) =>
    ref.kind === "sticker" ? stickerIds.has(ref.id) : textIds.has(ref.id),
  );

  const seen = new Set(resolved.map((r) => `${r.kind}:${r.id}`));
  for (const sticker of stickers) {
    const key = `sticker:${sticker.id}`;
    if (!seen.has(key)) {
      resolved.push({ kind: "sticker", id: sticker.id });
      seen.add(key);
    }
  }
  for (const layer of textLayers) {
    const key = `text:${layer.id}`;
    if (!seen.has(key)) {
      resolved.push({ kind: "text", id: layer.id });
      seen.add(key);
    }
  }
  return resolved;
}

interface BoothState {
  frames: string[];
  theme: ThemeKey;
  filter: FilterKey;
  adjustments: Adjustments;
  caption: string;
  stickers: PlacedSticker[];
  textLayers: PlacedTextLayer[];
  layerOrder: LayerRef[];
  mirror: boolean;
  soundEnabled: boolean;
  addFrame: (dataUrl: string) => void;
  removeFrame: (index: number) => void;
  resetFrames: () => void;
  setTheme: (t: ThemeKey) => void;
  setFilter: (f: FilterKey) => void;
  setAdjustments: (a: Partial<Adjustments>) => void;
  setCaption: (c: string) => void;
  addSticker: (
    sticker: Omit<PlacedSticker, "id" | "opacity" | "visible"> & {
      opacity?: number;
    },
  ) => void;
  updateSticker: (
    id: string,
    patch: Partial<Omit<PlacedSticker, "id" | "key">>,
  ) => void;
  removeSticker: (id: string) => void;
  clearStickers: () => void;
  addTextLayer: (
    layer: Omit<PlacedTextLayer, "id" | "opacity" | "visible"> & {
      opacity?: number;
    },
  ) => void;
  updateTextLayer: (
    id: string,
    patch: Partial<Omit<PlacedTextLayer, "id">>,
  ) => void;
  removeTextLayer: (id: string) => void;
  clearTextLayers: () => void;
  moveLayer: (kind: LayerRef["kind"], id: string, dir: "up" | "down") => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;
  toggleMirror: () => void;
  toggleSound: () => void;
  toggleStickerVisibility: (id: string) => void;
  toggleTextLayerVisibility: (id: string) => void;
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
  layerOrder: [] as LayerRef[],
  mirror: true,
  soundEnabled: true,
};

// Migration helper: ensure all stickers and text layers have visible property
function migrateState(state: any): any {
  const migrated = { ...state };
  if (migrated.stickers) {
    migrated.stickers = migrated.stickers.map((s: any) =>
      s.visible !== undefined ? s : { ...s, visible: true },
    );
  }
  if (migrated.textLayers) {
    migrated.textLayers = migrated.textLayers.map((t: any) =>
      t.visible !== undefined ? t : { ...t, visible: true },
    );
  }
  return migrated;
}

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
          set((s) => {
            if (s.stickers.length >= 12) return s;
            const id = createId();
            return {
              stickers: [
                ...s.stickers,
                { opacity: 100, visible: true, ...sticker, id },
              ],
              layerOrder: [
                ...resolveLayerOrder(s.layerOrder, s.stickers, s.textLayers),
                { kind: "sticker", id },
              ],
            };
          }),
        updateSticker: (id, patch) =>
          set((s) => ({
            stickers: s.stickers.map((sticker) =>
              sticker.id === id ? { ...sticker, ...patch } : sticker,
            ),
          })),
        removeSticker: (id) =>
          set((s) => ({
            stickers: s.stickers.filter((sticker) => sticker.id !== id),
            layerOrder: s.layerOrder.filter(
              (ref) => !(ref.kind === "sticker" && ref.id === id),
            ),
          })),
        clearStickers: () =>
          set((s) => ({
            stickers: [],
            layerOrder: s.layerOrder.filter((ref) => ref.kind !== "sticker"),
          })),
        addTextLayer: (layer) =>
          set((s) => {
            if (s.textLayers.length >= 10) return s;
            const id = createId();
            return {
              textLayers: [
                ...s.textLayers,
                { opacity: 100, visible: true, ...layer, id },
              ],
              layerOrder: [
                ...resolveLayerOrder(s.layerOrder, s.stickers, s.textLayers),
                { kind: "text", id },
              ],
            };
          }),
        updateTextLayer: (id, patch) =>
          set((s) => ({
            textLayers: s.textLayers.map((layer) =>
              layer.id === id ? { ...layer, ...patch } : layer,
            ),
          })),
        removeTextLayer: (id) =>
          set((s) => ({
            textLayers: s.textLayers.filter((layer) => layer.id !== id),
            layerOrder: s.layerOrder.filter(
              (ref) => !(ref.kind === "text" && ref.id === id),
            ),
          })),
        clearTextLayers: () =>
          set((s) => ({
            textLayers: [],
            layerOrder: s.layerOrder.filter((ref) => ref.kind !== "text"),
          })),
        moveLayer: (kind, id, dir) =>
          set((s) => {
            const order = resolveLayerOrder(
              s.layerOrder,
              s.stickers,
              s.textLayers,
            );
            const idx = order.findIndex(
              (ref) => ref.kind === kind && ref.id === id,
            );
            if (idx === -1) return s;
            const next = dir === "up" ? idx - 1 : idx + 1;
            if (next < 0 || next >= order.length) return s;
            const arr = [...order];
            [arr[idx], arr[next]] = [arr[next], arr[idx]];
            return { layerOrder: arr };
          }),
        reorderLayer: (fromIndex, toIndex) =>
          set((s) => {
            const order = resolveLayerOrder(
              s.layerOrder,
              s.stickers,
              s.textLayers,
            );
            if (
              fromIndex === toIndex ||
              fromIndex < 0 ||
              toIndex < 0 ||
              fromIndex >= order.length ||
              toIndex >= order.length
            )
              return s;
            const arr = [...order];
            const [item] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, item);
            return { layerOrder: arr };
          }),
        toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
        toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
        toggleStickerVisibility: (id) =>
          set((s) => ({
            stickers: s.stickers.map((sticker) =>
              sticker.id === id
                ? { ...sticker, visible: !sticker.visible }
                : sticker,
            ),
          })),
        toggleTextLayerVisibility: (id) =>
          set((s) => ({
            textLayers: s.textLayers.map((layer) =>
              layer.id === id ? { ...layer, visible: !layer.visible } : layer,
            ),
          })),
        resetAll: () => set({ ...initial }),
      }),
      {
        name: "clickstudio-booth",
        storage: createJSONStorage(() => sessionStorage),
        version: 2,
        migrate: migrateState,
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
        layerOrder: state.layerOrder,
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
