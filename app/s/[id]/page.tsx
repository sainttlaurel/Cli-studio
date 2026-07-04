import Link from 'next/link';
import { Camera, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ShareActions } from '@/components/ShareActions';
import type { Strip } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getStrip(id: string): Promise<Strip | null> {
  const { data, error } = await supabase.from('strips').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Strip;
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const strip = await getStrip(params.id);

  if (!strip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">This strip has vanished ✨</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          It may have expired or the link is incorrect. Why not make your own?
        </p>
        <Link
          href="/studio"
          className="px-6 py-3 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md"
        >
          Start the Studio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 sparkle-bg pointer-events-none" />

      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="text-xl font-heading font-bold text-primary tracking-wide">
            Click<span className="text-secondary-foreground">Studio</span>
          </span>
        </Link>
        <Link
          href="/studio"
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-heading font-bold rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
        >
          <Zap size={14} />
          <span>Shoot Your Own Strip</span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-6 py-12 flex flex-col items-center gap-8 w-full text-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground">A Wild Vibe Appeared! ✨</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Captured {new Date(strip.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="w-full max-w-sm bg-background p-5 rounded-[2.25rem] shadow-2xl border-4 border-primary/20 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={strip.image_url} alt="Shared photo strip" className="w-full h-auto rounded-2xl" />
        </div>

        <ShareActions imageUrl={strip.image_url} />
      </main>

      <footer className="relative z-10 w-full py-8 border-t border-border bg-background/40 mt-auto text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ClickStudio. Built for self-expression and loving your vibe.
        </p>
      </footer>
    </div>
  );
}
