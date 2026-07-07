import Link from 'next/link';
import { Camera, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-center px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-md">
          <WifiOff className="text-secondary-foreground" size={28} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground">You're offline</h1>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          This page needs a connection to load. But you can still shoot and edit strips — they'll upload when you're
          back online.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/studio"
          className="px-6 py-3 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md flex items-center gap-2 justify-center"
        >
          <Camera size={16} />
          <span>Go to Studio</span>
        </Link>
        <Link
          href="/"
          className="px-6 py-3 bg-secondary text-secondary-foreground font-heading font-bold text-sm rounded-xl transition-all flex items-center gap-2 justify-center"
        >
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
