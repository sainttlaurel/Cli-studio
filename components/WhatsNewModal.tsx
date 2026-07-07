'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Layers, Sparkles, Type, X } from 'lucide-react';

const CHANGELOG_VERSION = '2026-07-08-v2.10';
const STORAGE_KEY = 'clickstudio-whats-new-version';
const OPEN_EVENT = 'clickstudio:open-whats-new';

const CHANGES = [
  {
    title: 'Text overlays',
    description: 'Add your own draggable text on top of the strip with fonts, colors, and sizing.',
    icon: Type,
  },
  {
    title: 'Layer opacity',
    description: 'Fade stickers and text layers with a per-layer opacity slider.',
    icon: Layers,
  },
  {
    title: 'Layer stacking',
    description: 'Use the up/down arrows to reorder stickers or text within each layer list.',
    icon: Sparkles,
  },
];

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_VERSION);
    } catch {
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    try {
      setIsOpen(localStorage.getItem(STORAGE_KEY) !== CHANGELOG_VERSION);
    } catch {
      setIsOpen(false);
    }

    const openModal = () => setIsOpen(true);
    window.addEventListener(OPEN_EVENT, openModal);
    return () => window.removeEventListener(OPEN_EVENT, openModal);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [dismiss, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Fresh updates</p>
            <h2 id="whats-new-title" className="mt-1 font-heading text-xl font-extrabold text-foreground">
              What&apos;s New
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">
          {CHANGES.map(({ title, description, icon: Icon }) => (
            <div key={title} className="flex gap-3 rounded-lg border border-border/70 bg-muted/40 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
          >
            <Check size={16} />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function WhatsNewButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      title="What's New"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`${
        compact ? 'hidden sm:inline-flex' : 'inline-flex'
      } items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-primary sm:px-3`}
    >
      <Sparkles size={compact ? 14 : 16} />
      <span className={compact ? 'hidden lg:inline' : 'hidden sm:inline'}>What&apos;s New</span>
    </button>
  );
}
