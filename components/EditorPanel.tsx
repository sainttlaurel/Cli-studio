'use client';

import { useState } from 'react';
import { Sparkles, Sliders, Layout, Heart, Type } from 'lucide-react';
import { useBoothStore } from '@/lib/store';
import type { FilterKey, ThemeKey } from '@/lib/store';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'cherry', label: 'Cherry Blossom' },
  { key: 'noir', label: 'Noir Classic' },
  { key: 'cyber', label: 'Y2K Cyber' },
  { key: 'vintage', label: 'Vintage Film' },
  { key: 'none', label: 'Natural' },
];

const THEMES: { key: ThemeKey; label: string; swatch: string }[] = [
  { key: 'pink', label: 'Y2K Pink', swatch: '#FF1493' },
  { key: 'lavender', label: 'Lavender Dream', swatch: '#4B0082' },
  { key: 'blue', label: 'Baby Blue', swatch: '#89CFF0' },
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
  const { filter, setFilter, adjustments, setAdjustments, theme, setTheme, caption, setCaption } =
    useBoothStore();

  return (
    <div className="bg-background rounded-3xl border border-border/80 shadow-lg overflow-hidden flex flex-col h-full">
      <div className="flex border-b border-border bg-muted/50 overflow-x-auto scrollbar-none">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-4 px-3 border-b-2 text-sm font-heading font-bold flex flex-col items-center gap-1 whitespace-nowrap transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-primary'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6 min-h-[280px]">
        {tab === 'filters' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-foreground">Select Filter Preset</h3>
              <span className="text-xs text-muted-foreground">{FILTERS.length} gorgeous options</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`p-1.5 rounded-xl border-2 cursor-pointer text-center transition-all ${
                    filter === f.key
                      ? 'bg-primary/5 border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-video bg-muted rounded-lg mb-1.5" />
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
            <h3 className="text-sm font-heading font-bold text-foreground mb-4">Choose Your Frame Vibe</h3>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    theme === t.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg mb-2" style={{ backgroundColor: t.swatch }} />
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
