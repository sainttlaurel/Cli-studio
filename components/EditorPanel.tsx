'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Sparkles, Sliders, Layout, Heart, Type, Undo2, Redo2 } from 'lucide-react';
import { useBoothStore, useBoothTemporal } from '@/lib/store';
import type { FilterKey, ThemeKey } from '@/lib/store';
import { buildFilterCss } from '@/lib/filters';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'cherry', label: 'Cherry Blossom' },
  { key: 'noir', label: 'Noir Classic' },
  { key: 'cyber', label: 'Y2K Cyber' },
  { key: 'vintage', label: 'Vintage Film' },
  { key: 'none', label: 'Natural' },
];

const THEMES: { key: ThemeKey; label: string; border: string; accent: string; paper: string }[] = [
  { key: 'pink', label: 'Y2K Pink', border: 'border-primary', accent: 'bg-primary', paper: 'bg-pink-50' },
  {
    key: 'lavender',
    label: 'Lavender Dream',
    border: 'border-secondary-foreground',
    accent: 'bg-secondary-foreground',
    paper: 'bg-violet-50',
  },
  { key: 'blue', label: 'Baby Blue', border: 'border-tertiary', accent: 'bg-tertiary', paper: 'bg-sky-50' },
  { key: 'mint', label: 'Mint Pop', border: 'border-emerald-400', accent: 'bg-emerald-500', paper: 'bg-emerald-50' },
  { key: 'lemon', label: 'Lemon Flash', border: 'border-amber-300', accent: 'bg-amber-400', paper: 'bg-yellow-50' },
  { key: 'coral', label: 'Coral Crush', border: 'border-orange-400', accent: 'bg-orange-500', paper: 'bg-orange-50' },
  { key: 'grape', label: 'Grape Beam', border: 'border-violet-500', accent: 'bg-violet-600', paper: 'bg-purple-50' },
  { key: 'lime', label: 'Lime Glow', border: 'border-lime-400', accent: 'bg-lime-500', paper: 'bg-lime-50' },
  { key: 'mono', label: 'Mono Star', border: 'border-gray-900', accent: 'bg-gray-900', paper: 'bg-gray-50' },
];

const TABS = [
  { key: 'filters', label: '1. Filters', icon: Sparkles },
  { key: 'adjust', label: '2. Adjust', icon: Sliders },
  { key: 'frame', label: '3. Frame', icon: Layout },
  { key: 'stickers', label: '4. Stickers', icon: Heart },
  { key: 'text', label: '5. Text', icon: Type },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function EditorPanel() {
  const [tab, setTab] = useState<TabKey>('filters');
  const {
    frames,
    filter,
    setFilter,
    adjustments,
    setAdjustments,
    theme,
    setTheme,
    caption,
    setCaption,
  } = useBoothStore();
  const { undo, redo, canUndo, canRedo } = useBoothTemporal();

  // --- Ctrl/Cmd+Z to undo, Ctrl+Y or Ctrl/Cmd+Shift+Z to redo ---
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  // --- Sliding underline under the active tab ---
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  useEffect(() => {
    function recalc() {
      const el = tabRefs.current[tab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [tab]);

  const thumbnailSrc = frames[0];

  return (
    <div className="bg-background rounded-3xl border border-border/80 shadow-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Editor
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      <div className="relative flex border-b border-border bg-muted/50 overflow-x-auto scrollbar-none">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[key] = el ?? undefined;
            }}
            onClick={() => setTab(key)}
            className={`flex-1 py-4 px-3 text-sm font-heading font-bold flex flex-col items-center gap-1 whitespace-nowrap transition-colors ${
              tab === key ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
        <div
          className="absolute bottom-0 h-[3px] bg-primary rounded-full transition-all duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      <div key={tab} className="p-6 flex-1 flex flex-col gap-6 min-h-[280px] animate-fade-in">
        {tab === 'filters' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-foreground">Select Filter Preset</h3>
              <span className="text-xs text-muted-foreground">{FILTERS.length} gorgeous options</span>
            </div>
            {/* flex-wrap + justify-center (rather than CSS grid) so an
                uneven last row — 5 filters doesn't divide evenly into 3
                or 4 columns — centers itself instead of hugging the left
                edge with an empty gap. */}
            <div className="flex flex-wrap justify-center gap-3">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] p-1.5 rounded-xl border-2 cursor-pointer text-center transition-all ${
                    filter === f.key
                      ? 'bg-primary/5 border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  {/* 4:3 to match the real crop used in the exported strip
                      (compositor.ts FRAME_W:FRAME_H and StripPreview's
                      aspect-[4/3]) — previously aspect-video (16:9) showed
                      a different crop than what people actually got. */}
                  <div className="aspect-[4/3] bg-muted rounded-lg mb-1.5 overflow-hidden">
                    {thumbnailSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailSrc}
                        alt={f.label}
                        className="w-full h-full object-cover"
                        style={{ filter: buildFilterCss(f.key, 0, 0) }}
                      />
                    ) : null}
                  </div>
                  <span className={`text-xs font-bold ${filter === f.key ? 'text-primary' : 'text-foreground/80'}`}>
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'adjust' && (
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground mb-4">Fine-Tune Vibe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Brightness</span>
                  <span className="text-primary font-bold">
                    {adjustments.brightness > 0 ? '+' : ''}
                    {adjustments.brightness}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={adjustments.brightness}
                  onChange={(e) => setAdjustments({ brightness: Number(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Contrast</span>
                  <span className="text-primary font-bold">
                    {adjustments.contrast > 0 ? '+' : ''}
                    {adjustments.contrast}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={adjustments.contrast}
                  onChange={(e) => setAdjustments({ contrast: Number(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'frame' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-foreground">Choose Your Template</h3>
              <span className="text-xs text-muted-foreground">{THEMES.length} frame vibes</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    theme === t.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {/* Full-opacity theme border (was /30, which read as the
                      same pale gray across all three themes) plus a mini
                      2-frame strip mockup instead of one generic dashed
                      box, so the swatch actually previews "a strip with
                      this border color" rather than an abstract icon. */}
                  <div className={`w-full aspect-square rounded-lg mb-2 ${t.paper} border-4 ${t.border} shadow-sm p-1.5 flex flex-col gap-1`}>
                    <div className="flex-1 rounded-sm bg-muted" />
                    <div className="flex-1 rounded-sm bg-muted" />
                    <div className="flex items-center justify-between pt-1">
                      <span className={`h-1.5 w-10 rounded-full ${t.accent}`} />
                      <span className={`h-1.5 w-1.5 rounded-full ${t.accent}`} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-foreground/80">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'stickers' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
            <Heart className="text-primary/40" size={32} />
            <p className="text-sm font-bold text-foreground">Sticker packs coming soon!</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              We&apos;re cooking up draggable Y2K stickers. For now, add a caption in the Text tab. ✨
            </p>
          </div>
        )}

        {tab === 'text' && (
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground mb-4">Add a Caption</h3>
            <input
              type="text"
              maxLength={40}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="best day ever ✨"
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              Shows beneath your strip. {40 - caption.length} characters left.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
