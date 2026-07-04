'use client';

import Link from 'next/link';
import { Download, Camera } from 'lucide-react';

export function ShareActions({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <a
          href={imageUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 px-4 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Download size={16} />
          <span>Save Strip</span>
        </a>
        <Link
          href="/studio"
          className="py-3 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-heading font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Camera size={16} />
          <span>Create Yours</span>
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Love this photo strip? Create your own in 2 minutes, completely free!
      </p>
    </div>
  );
}
