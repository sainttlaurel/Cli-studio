'use client';

import Link from 'next/link';
import { Camera, Home, Images, Clock, MessageCircle } from 'lucide-react';

const STEPS = ['Start', 'Shoot', 'Edit', 'Export'];

export function WizardHeader({ step }: { step: number }) {
  return (
    <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
          <Camera className="text-primary-foreground" size={16} />
        </div>
        <span className="text-xl font-heading font-bold text-primary tracking-wide">
          Click<span className="text-secondary-foreground">Studio</span>
        </span>
      </Link>

      <div className="hidden sm:flex items-center gap-2 md:gap-4">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-2 md:gap-4">
              {i > 0 && <div className={`w-6 h-[2px] ${n <= step ? 'bg-primary' : 'bg-border'}`} />}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : done
                      ? 'bg-primary/20 text-primary'
                      : 'bg-border text-muted-foreground'
                  }`}
                >
                  {n}
                </span>
                <span
                  className={`hidden md:inline text-xs font-semibold ${
                    active ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-3">
        <Link
          href="/gallery"
          title="Public Gallery"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-1.5 sm:px-2"
        >
          <Images size={14} />
          <span className="hidden lg:inline">Gallery</span>
        </Link>
        <Link
          href="/wall"
          title="Feedback Wall"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-1.5 sm:px-2"
        >
          <MessageCircle size={14} />
          <span className="hidden lg:inline">Wall</span>
        </Link>
        <Link
          href="/history"
          title="My Strips"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-1.5 sm:px-2"
        >
          <Clock size={14} />
          <span className="hidden lg:inline">My Strips</span>
        </Link>
        <Link
          href="/"
          className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1"
        >
          <Home size={14} />
          <span>Exit Studio</span>
        </Link>
      </div>
    </header>
  );
}