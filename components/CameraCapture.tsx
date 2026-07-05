'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Upload, RefreshCw, Grid3x3, Volume2, VolumeX } from 'lucide-react';
import { useBoothStore } from '@/lib/store';
import { playCountdownTick, playShutter } from '@/lib/sound';

const TIMER_OPTIONS = [
  { label: '3s', value: 3 },
  { label: '5s', value: 5 },
  { label: 'Off', value: 0 },
];

export function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [showGrid, setShowGrid] = useState(false);

  const { frames, addFrame, mirror, toggleMirror, soundEnabled, toggleSound } = useBoothStore();

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 960, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setStreamError('Camera access denied or unavailable. You can upload a photo instead.');
      }
    }
    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || frames.length >= 4) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    addFrame(dataUrl);
  }, [addFrame, frames.length, mirror]);

  const triggerCapture = useCallback(() => {
    if (frames.length >= 4) return;
    if (timerSeconds === 0) {
      if (soundEnabled) playShutter();
      capture();
      return;
    }
    setCountdown(timerSeconds);
  }, [capture, frames.length, timerSeconds, soundEnabled]);

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

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || frames.length >= 4) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') addFrame(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="bg-background p-4 rounded-3xl border-2 border-primary/20 shadow-xl flex flex-col gap-4 relative">
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-primary shadow-inner">
        {streamError ? (
          <div className="w-full h-full flex items-center justify-center text-primary-foreground text-sm text-center px-6">
            {streamError}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`}
          />
        )}

        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/30" />
            ))}
          </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-2.5 py-1 bg-primary/50 text-primary-foreground text-[11px] font-bold tracking-wider uppercase rounded-md backdrop-blur flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live View
          </span>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowGrid((g) => !g)}
            className="p-2 bg-primary/50 hover:bg-primary/70 text-primary-foreground rounded-lg backdrop-blur transition-all"
            title="Toggle Grid"
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={toggleMirror}
            className="p-2 bg-primary/50 hover:bg-primary/70 text-primary-foreground rounded-lg backdrop-blur transition-all"
            title="Mirror Camera"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={toggleSound}
            className="p-2 bg-primary/50 hover:bg-primary/70 text-primary-foreground rounded-lg backdrop-blur transition-all"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-white text-7xl font-heading font-bold">{countdown}</span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-primary text-primary-foreground text-xs font-heading font-bold rounded-full shadow-lg shadow-primary/30">
            ✨ Own your beauty — you look incredible!
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="bg-secondary p-1 rounded-xl flex gap-1">
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimerSeconds(opt.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timerSeconds === opt.value
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-secondary-foreground hover:bg-background/50'
                }`}
              >
                {opt.value === 0 ? 'Off' : `Timer: ${opt.label}`}
              </button>
            ))}
          </div>
          <label
            className="p-2.5 bg-secondary text-secondary-foreground hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
            title="Upload Photo instead"
          >
            <Upload size={18} />
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
        </div>

        <button
          onClick={triggerCapture}
          disabled={frames.length >= 4 || countdown !== null}
          className="group relative w-16 h-16 bg-primary hover:bg-primary/90 disabled:opacity-40 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-all"
        >
          <div className="w-12 h-12 rounded-full border-2 border-border/80 flex items-center justify-center">
            <Camera className="text-primary-foreground" size={24} />
          </div>
        </button>

        <div className="w-full md:w-auto text-center md:text-right text-xs text-muted-foreground font-semibold">
          {frames.length} / 4 frames captured
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
