'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Copy, Loader2, RotateCcw, Share2, Printer } from 'lucide-react';
import { useBoothStore } from '@/lib/store';
import { compositeStrip } from '@/lib/compositor';
import { compositePrintPage, printPageImage, PRINT_SIZES } from '@/lib/print';
import type { PrintSizeKey } from '@/lib/print';
import { THEME_HEX } from '@/lib/theme-colors';
import { uploadStrip } from '@/lib/api';

type Status = 'idle' | 'rendering' | 'uploading' | 'done' | 'error';
type PrintStatus = 'idle' | 'rendering' | 'error';
type ShareNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
};

const PRINT_SIZE_ORDER: PrintSizeKey[] = ['2x6', '4x6', 'a4', 'letter'];

export function ExportPanel() {
  const { frames, filter, adjustments, theme, caption, stickers } = useBoothStore();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [printSize, setPrintSize] = useState<PrintSizeKey>('2x6');
  const [printStatus, setPrintStatus] = useState<PrintStatus>('idle');
  const [printError, setPrintError] = useState<string | null>(null);

  const run = useCallback(async () => {
    try {
      setError(null);
      setStatus('rendering');
      const renderedBlob = await compositeStrip({
        frames,
        filter,
        brightness: adjustments.brightness,
        contrast: adjustments.contrast,
        themeColor: THEME_HEX[theme] ?? THEME_HEX.pink,
        caption,
        stickers,
      });
      setBlob(renderedBlob);
      setBlobUrl(URL.createObjectURL(renderedBlob));

      setStatus('uploading');
      // sessionId is no longer passed here — the upload-strip edge
      // function derives the caller's identity itself from the verified
      // access token that lib/api.ts's uploadStrip() attaches.
      const result = await uploadStrip({
        file: renderedBlob,
        theme,
        filter,
        caption,
      });

      setShareUrl(`${window.location.origin}/s/${result.id}`);
      setStatus('done');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong exporting your strip.');
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, filter, adjustments.brightness, adjustments.contrast, theme, caption, stickers]);

  useEffect(() => {
    if (frames.length === 0) return;
    run();
    // Re-runs when "Try Again" bumps `attempt`. `run` intentionally
    // omitted from deps — it's stable enough for this per-export-session flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const retry = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setShareUrl(null);
    setAttempt((a) => a + 1);
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (!shareUrl) return;
    const nav = navigator as ShareNavigator;
    const shareData: ShareData = {
      title: 'My ClickStudio strip',
      text: 'Check out my photo strip! ✨',
      url: shareUrl,
    };

    try {
      if (nav.share) {
        await nav.share(shareData);
      } else {
        await copyLink();
      }
    } catch {
      // User cancelled the share sheet — nothing to surface.
    }
  };

  const handlePrint = async () => {
    let pageUrl: string | null = null;
    try {
      setPrintError(null);
      setPrintStatus('rendering');
      const pageBlob = await compositePrintPage({
        frames,
        filter,
        brightness: adjustments.brightness,
        contrast: adjustments.contrast,
        themeColor: THEME_HEX[theme] ?? THEME_HEX.pink,
        caption,
        stickers,
        printSize,
      });
      pageUrl = URL.createObjectURL(pageBlob);
      await printPageImage(pageUrl, printSize);
      setPrintStatus('idle');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setPrintError(err instanceof Error ? err.message : 'Something went wrong preparing the print page.');
      setPrintStatus('error');
    } finally {
      if (pageUrl) URL.revokeObjectURL(pageUrl);
    }
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
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={retry}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Try Again</span>
            </button>
          </div>
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

      <div className="bg-background p-6 rounded-3xl border border-border/80 shadow-lg flex flex-col gap-4">
        <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
          <Printer className="text-primary" size={18} />
          <span>Print-Ready Copy</span>
        </h2>

        <div>
          <span className="text-xs font-semibold text-muted-foreground block mb-2">Choose a size</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRINT_SIZE_ORDER.map((key) => {
              const spec = PRINT_SIZES[key];
              return (
                <button
                  key={key}
                  onClick={() => setPrintSize(key)}
                  disabled={printStatus === 'rendering'}
                  className={`px-2 py-2.5 text-xs font-bold rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    printSize === key
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-background border-border text-foreground/70 hover:border-primary/50'
                  }`}
                >
                  {spec.label}
                </button>
              );
            })}
          </div>
          {PRINT_SIZES[printSize].copies > 1 && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Prints two copies side by side, so you can share one and keep one. ✂️
            </p>
          )}
        </div>

        {printStatus === 'error' && <p className="text-sm text-destructive">{printError}</p>}

        <button
          onClick={handlePrint}
          disabled={printStatus === 'rendering' || frames.length === 0}
          className="w-full py-3 px-4 bg-secondary-foreground hover:bg-secondary-foreground/90 disabled:opacity-50 text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {printStatus === 'rendering' ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Preparing print page...</span>
            </>
          ) : (
            <>
              <Printer size={18} />
              <span>Print or Save as PDF</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Opens your browser&apos;s print dialog at 300dpi — choose &ldquo;Save as PDF&rdquo; there if you want a file instead of paper.
        </p>
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
            <h3 className="text-sm font-heading font-bold text-foreground">Scan or Share Instantly</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scan with a phone camera, or use the share sheet to send it straight to your apps.
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
                className="px-3 py-2 bg-secondary-foreground hover:bg-secondary-foreground/90 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1"
              >
                <Copy size={14} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={nativeShare}
                className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
