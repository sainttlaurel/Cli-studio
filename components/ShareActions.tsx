'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Camera, Share2, Check } from 'lucide-react';

type ShareNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
};

export function ShareActions({ imageUrl, id }: { imageUrl: string; id: string }) {
  const [copied, setCopied] = useState(false);

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
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
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
