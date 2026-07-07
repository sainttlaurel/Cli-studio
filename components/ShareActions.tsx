'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Camera, Share2, Check, Sparkles } from 'lucide-react';
import { canShareToInstagramStories, shareToInstagramStories } from '@/lib/share';

type ShareNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
};

export function ShareActions({ imageUrl, id }: { imageUrl: string; id: string }) {
  const [copied, setCopied] = useState(false);
  const [canIgStories, setCanIgStories] = useState(false);

  useEffect(() => {
    setCanIgStories(canShareToInstagramStories());
  }, []);

  const nativeShare = async () => {
    const shareUrl = `${window.location.origin}/s/${id}`;
    const nav = navigator as ShareNavigator;

    if (nav.share) {
      try {
        await nav.share({
          title: 'A ClickStudio strip',
          text: 'Check this out! ✨',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled the native sheet — fall through to clipboard.
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // This page only has the image's URL, not a Blob (unlike ExportPanel,
  // which just rendered it) — fetch it first, then hand off the same way.
  // Note: because of the fetch, this can't guarantee it's still within
  // the original click's user-gesture window on every browser, which the
  // clipboard-write step depends on — if Safari ever starts rejecting it
  // here, that's why; ExportPanel's version doesn't have this risk.
  const shareToInstagram = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const opened = await shareToInstagramStories(blob);
      if (!opened) {
        await nativeShare();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      await nativeShare();
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <div className={`grid gap-3 ${canIgStories ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        <a
          href={imageUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 px-3 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Download size={16} />
          <span>Save</span>
        </a>
        <button
          onClick={nativeShare}
          className="py-3 px-3 bg-secondary-foreground hover:bg-secondary-foreground/90 text-primary-foreground font-heading font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
        {canIgStories && (
          <button
            onClick={shareToInstagram}
            className="py-3 px-3 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90 text-white font-heading font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles size={16} />
            <span>IG Stories</span>
          </button>
        )}
        <Link
          href="/studio"
          className="py-3 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-heading font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Camera size={16} />
          <span>Create</span>
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Love this photo strip? Create your own in 2 minutes, completely free!
      </p>
    </div>
  );
}
