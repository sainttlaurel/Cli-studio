import Link from 'next/link';
import { Camera, Sparkles, Zap, Images } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Strip } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getPublicStrips(): Promise<Strip[]> {
  const { data, error } = await supabase
    .from('strips')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return [];
  }
  return (data ?? []) as Strip[];
}

export default async function GalleryPage() {
  const strips = await getPublicStrips();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="text-xl font-heading font-bold text-primary tracking-wide">
            Click<span className="text-secondary-foreground">Studio</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-heading font-bold rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <Zap size={14} />
            <span>Shoot Your Own</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" size={20} />
          <h1 className="text-2xl font-heading font-extrabold text-foreground">Public Gallery</h1>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Strips people chose to share publicly from their{' '}
          <Link href="/history" className="underline">
            Session History
          </Link>
          . Nothing appears here unless someone opted in.
        </p>

        {strips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Images className="text-primary/50" size={28} />
            </div>
            <div>
              <p className="text-base font-heading font-bold text-foreground">No public strips yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Be the first! Capture your strip, then flip it to Public from{' '}
                <Link href="/history" className="underline hover:text-primary transition-colors">My Strips</Link>.
              </p>
            </div>
            <Link
              href="/studio"
              className="px-6 py-3 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Zap size={14} />
              Start the Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {strips.map((strip) => (
              <Link
                key={strip.id}
                href={`/s/${strip.id}`}
                className="bg-background rounded-2xl border border-border/80 shadow-md overflow-hidden block hover:shadow-lg transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={strip.image_url} alt="Shared photo strip" className="w-full aspect-[4/3] object-contain" />
                {strip.caption && (
                  <p className="text-[11px] font-bold text-foreground p-2 text-center truncate">{strip.caption}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
