'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { Download, FileText, Copy, Loader2 } from 'lucide-react';
import { useBoothStore } from '@/lib/store';
import { compositeStrip } from '@/lib/compositor';
import { THEME_HEX } from '@/lib/theme-colors';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';

type Status = 'idle' | 'rendering' | 'uploading' | 'done' | 'error';

export function ExportPanel() {
  const { frames, filter, adjustments, theme, caption } = useBoothStore();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let localBlobUrl: string | null = null;

    async function run() {
      try {
        setStatus('rendering');
        const blob = await compositeStrip({
          frames,
          filter,
          brightness: adjustments.brightness,
          contrast: adjustments.contrast,
          themeColor: THEME_HEX[theme] ?? THEME_HEX.pink,
          caption,
        });
        if (cancelled) return;
        localBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(localBlobUrl);

        setStatus('uploading');
        const id = nanoid(8);
        const sessionId = getSessionId();
        const path = `${sessionId}/${id}.png`;

        const { error: uploadError } = await supabase.storage.from('strips').upload(path, blob, {
          contentType: 'image/png',
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('strips').getPublicUrl(path);
        const imageUrl = publicUrlData.publicUrl;

        const { error: insertError } = await supabase.from('strips').insert({
          id,
          session_id: sessionId,
          image_url: imageUrl,
          theme,
          filter,
          caption: caption || null,
        });
        if (insertError) throw insertError;

        if (cancelled) return;
        setShareUrl(`${window.location.origin}/s/${id}`);
        setStatus('done');
      } catch (err) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error(err);
          setError(err instanceof Error ? err.message : 'Something went wrong exporting your strip.');
          setStatus('error');
        }
      }
    }

    if (frames.length > 0) run();

    return () => {
      cancelled = true;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
    // Runs once on mount for this export session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrSrc = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`
    : null;

  return (
    <section className="md:col-span-7 flex flex-col gap-6">
      <div className="bg-background p-6 rounded-3xl border border-border/80 shadow-lg flex flex-col gap-4">
        <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
          <Download className="text-primary" size={18} />
          <span>Get Your Digital Copy</span>
        </h2>

        {status === 'rendering' || status === 'uploading' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="animate-spin" size={18} />
            <span>{status === 'rendering' ? 'Compositing your strip...' : 'Uploading to the cloud...'}</span>
          </div>
        ) : status === 'error' ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={blobUrl ?? '#'}
              download="clickstudio-strip.png"
              className="py-3 px-4 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              <span>Download PNG</span>
            </a>
            <a
              href={shareUrl ?? '#'}
              className="py-3 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-heading font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              <span>View Share Page</span>
            </a>
          </div>
        )}
      </div>

      {status === 'done' && shareUrl && (
        <div className="bg-background p-6 rounded-3xl border border-border/80 shadow-lg grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-4 flex justify-center">
            <div className="p-3 bg-secondary/40 rounded-2xl border border-border/60 max-w-[140px]">
              {qrSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt="Share QR Code" className="w-full h-auto rounded-lg" />
              )}
            </div>
          </div>
          <div className="sm:col-span-8 flex flex-col gap-3">
            <h3 className="text-sm font-heading font-bold text-foreground">Scan to Share Instantly</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scan with a phone camera to open the interactive reveal page.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-xs font-mono text-muted-foreground outline-none"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-secondary-foreground hover:bg-secondary-foreground/90 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1"
              >
                <Copy size={14} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
