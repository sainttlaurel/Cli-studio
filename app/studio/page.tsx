'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X, Camera, Upload, Image } from 'lucide-react';
import { useBoothStore, type AspectRatio, type FrameShape } from '@/lib/store';
import { playCountdownTick, playShutter } from '@/lib/sound';
import { WizardHeader } from '@/components/WizardHeader';
import { SparkleOverlay } from '@/components/SparkleOverlay';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TIMER_OPTIONS = [
  { label: '3s', value: 3 },
  { label: '5s', value: 5 },
  { label: 'Off', value: 0 },
];

const FRAME_OPTIONS = [
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
];

const ASPECT_RATIO_CONFIGS: Record<AspectRatio, { width: number; height: number; aspect: number }> = {
  portrait:  { width: 960,  height: 1280, aspect: 3 / 4 },
  square:    { width: 960,  height: 960,  aspect: 1      },
  landscape: { width: 1280, height: 960,  aspect: 4 / 3  },
};

const ASPECT_OPTIONS: { label: string; value: AspectRatio }[] = [
  { label: 'Portrait',  value: 'portrait'  },
  { label: 'Square',    value: 'square'    },
  { label: 'Landscape', value: 'landscape' },
];

const SHAPE_OPTIONS: { label: string; value: FrameShape }[] = [
  { label: 'Classic',  value: 'classic'  },
  { label: 'Rounded',  value: 'rounded'  },
  { label: 'Polaroid', value: 'polaroid' },
  { label: 'Circular', value: 'circular' },
];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-7 px-2.5 text-xs font-semibold rounded-full transition-all border-2 focus:outline-none focus:ring-2 focus:ring-ring/50 ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
          : 'bg-card text-foreground border-border hover:border-primary/50'
      }`}
    >
      {children}
    </button>
  );
}

export default function StudioPage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamError,  setStreamError]  = useState<string | null>(null);
  const [countdown,    setCountdown]    = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(3);

  const {
    frames, addFrame, removeFrame,
    mirror, toggleMirror,
    soundEnabled,
    maxFrames, setMaxFrames,
    aspectRatio, setAspectRatio,
    frameShape, setFrameShape,
  } = useBoothStore();

  const config = ASPECT_RATIO_CONFIGS[aspectRatio];

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: config.width, height: config.height, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setStreamError('Camera access denied or unavailable. You can upload a photo instead.');
      }
    }

    start();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [config.width, config.height]);

  const capture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || frames.length >= maxFrames) return;
    const w = video.videoWidth  || 640;
    const h = video.videoHeight || 480;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    addFrame(canvas.toDataURL('image/jpeg', 0.92));
  }, [addFrame, frames.length, mirror, maxFrames]);

  const triggerCapture = useCallback(() => {
    if (frames.length >= maxFrames) return;
    if (timerSeconds === 0) {
      if (soundEnabled) playShutter();
      capture();
      return;
    }
    setCountdown(timerSeconds);
  }, [capture, frames.length, timerSeconds, soundEnabled, maxFrames]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (soundEnabled) playShutter();
      capture();
      setCountdown(null);
      return;
    }
    if (soundEnabled) playCountdownTick();
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, capture, soundEnabled]);

  // ── Upload fallback
  const onUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || frames.length >= maxFrames) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') addFrame(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [addFrame, frames.length, maxFrames]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <SparkleOverlay />
      <WizardHeader step={2} />

      <main className="relative z-10 flex-1 max-w-[1160px] mx-auto w-full px-6 py-8">
        <ErrorBoundary page="studio">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6 lg:items-stretch">

            {/* Left: camera preview */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden h-full">
              <div className="relative w-full h-full min-h-[280px] bg-foreground/10">

                {streamError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                      <Camera className="text-primary/60" size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-heading font-bold text-foreground">Camera unavailable</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
                        Camera access was denied or not supported. Upload a photo to continue.
                      </p>
                    </div>
                    <label className="h-10 px-5 flex items-center gap-2 text-xs font-heading font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-all shadow-md shadow-primary/20">
                      <Upload size={14} />
                      Upload a Photo
                      <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`}
                  />
                )}

                {/* Live badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/55 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 z-10">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Flip button */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={toggleMirror}
                    className="w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-xl flex items-center justify-center transition-colors"
                    aria-label="Flip camera"
                  >
                    {/* Flip icon inline to avoid extra import */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M8 16H3v5" />
                    </svg>
                  </button>
                </div>

                {/* Countdown overlay */}
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                    <span className="text-white text-7xl font-heading font-bold drop-shadow-lg">
                      {countdown}
                    </span>
                  </div>
                )}

                {/* Bottom banner */}
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-block px-4 py-2 bg-primary text-primary-foreground text-xs font-heading font-semibold rounded-full shadow-lg shadow-primary/30 whitespace-nowrap">
                    ✨ Own your beauty — you look incredible!
                  </span>
                </div>
              </div>
            </div>

            {/* Right: controls + frames */}
            <div className="flex flex-col gap-3">

              {/* Frames Preview */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Frames Preview
                </h3>
                <div className={`grid gap-1.5 ${maxFrames === 6 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {Array.from({ length: maxFrames }).map((_, i) => {
                    const frame = frames[i];
                    return (
                      <div
                        key={i}
                        className="aspect-square w-full border-2 border-dashed border-border rounded-xl bg-muted flex flex-col items-center justify-center gap-1 relative group overflow-hidden"
                      >
                        {frame ? (
                          <>
                            <img
                              src={frame}
                              alt={`Frame ${i + 1}`}
                              className="absolute inset-0 w-full h-full object-cover rounded-xl"
                            />
                            <button
                              onClick={() => removeFrame(i)}
                              className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              aria-label={`Remove frame ${i + 1}`}
                            >
                              <X size={11} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Image className="text-muted-foreground/50" size={14} />
                            <span className="text-[10px] font-medium text-muted-foreground">Frame {i + 1}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Link
                  href={frames.length >= maxFrames ? '/editor' : '#'}
                  aria-disabled={frames.length < maxFrames}
                  className={`mt-3 w-full h-10 flex items-center justify-center gap-1.5 text-sm font-heading font-bold rounded-xl transition-all ${
                    frames.length >= maxFrames
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                      : 'bg-muted text-muted-foreground pointer-events-none'
                  }`}
                >
                  <ArrowRight size={15} />
                  Continue to editor
                </Link>
                {frames.length < maxFrames && (
                  <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                    Capture all {maxFrames} frames to continue
                  </p>
                )}
              </div>

              {/* Camera Settings */}
              <div className="bg-muted rounded-xl p-3 border border-border">
                <h4 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Camera Settings
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Timer */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">Timer</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {TIMER_OPTIONS.map((opt) => (
                        <Pill
                          key={opt.value}
                          active={timerSeconds === opt.value}
                          onClick={() => setTimerSeconds(opt.value)}
                        >
                          {opt.value === 0 ? 'Off' : opt.label}
                        </Pill>
                      ))}
                    </div>
                  </div>
                  {/* Aspect ratio */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">Aspect Ratio</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {ASPECT_OPTIONS.map((opt) => (
                        <Pill
                          key={opt.value}
                          active={aspectRatio === opt.value}
                          onClick={() => setAspectRatio(opt.value)}
                        >
                          {opt.label}
                        </Pill>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Composition */}
              <div className="bg-muted rounded-xl p-3 border border-border">
                <h4 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Composition
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Frame count */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">Frames</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {FRAME_OPTIONS.map((opt) => (
                        <Pill
                          key={opt.value}
                          active={maxFrames === opt.value}
                          onClick={() => setMaxFrames(opt.value)}
                        >
                          {opt.label}
                        </Pill>
                      ))}
                    </div>
                  </div>
                  {/* Frame style */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">Frame Style</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {SHAPE_OPTIONS.map((opt) => (
                        <Pill
                          key={opt.value}
                          active={frameShape === opt.value}
                          onClick={() => setFrameShape(opt.value)}
                        >
                          {opt.label}
                        </Pill>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row — Upload | Capture (dominant) | Counter */}
              <div className="bg-muted rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between gap-3">
                  {/* Upload */}
                  <label className="h-10 px-4 flex items-center gap-2 text-xs font-heading font-semibold rounded-full border-2 border-border bg-card text-foreground hover:border-primary/50 cursor-pointer transition-all shrink-0">
                    <Upload size={14} />
                    Upload
                    <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                  </label>

                  {/* Capture — most dominant */}
                  <button
                    onClick={triggerCapture}
                    disabled={frames.length >= maxFrames || countdown !== null}
                    aria-label="Capture photo"
                    className="w-16 h-16 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all ring-4 ring-primary/20 shrink-0"
                  >
                    <Camera className="text-primary-foreground" size={28} />
                  </button>

                  {/* Counter */}
                  <span className="text-xs font-semibold text-muted-foreground text-right shrink-0 leading-tight">
                    {frames.length} / {maxFrames}
                    <br />
                    <span className="text-[10px] font-normal">captured</span>
                  </span>
                </div>
              </div>

            </div>{/* end right column */}
          </div>{/* end grid */}
        </ErrorBoundary>
      </main>

      <footer className="relative z-10 w-full py-6 border-t border-border bg-background/40 mt-auto text-center">
        <p className="text-xs text-muted-foreground">
          ✨ ClickStudio processes your camera entirely in your browser. Your privacy is safe with us.
        </p>
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
