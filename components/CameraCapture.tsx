'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Upload, RefreshCw, Grid3x3, Volume2, VolumeX, Crop, Square, RectangleHorizontal, RectangleVertical, Image } from 'lucide-react';
import { useBoothStore, type AspectRatio, type FrameShape } from '@/lib/store';
import { playCountdownTick, playShutter } from '@/lib/sound';

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
  portrait: { width: 960, height: 1280, aspect: 3 / 4 },
  square: { width: 960, height: 960, aspect: 1 / 1 },
  landscape: { width: 1280, height: 960, aspect: 4 / 3 },
};

const ASPECT_OPTIONS: { label: string; value: AspectRatio; icon: React.ReactNode }[] = [
  { label: 'Portrait', value: 'portrait', icon: <RectangleVertical size={12} /> },
  { label: 'Square', value: 'square', icon: <Square size={12} /> },
  { label: 'Landscape', value: 'landscape', icon: <RectangleHorizontal size={12} /> },
];

const SHAPE_OPTIONS: { label: string; value: FrameShape; icon: React.ReactNode }[] = [
  { label: 'Classic', value: 'classic', icon: <Crop size={12} /> },
  { label: 'Rounded', value: 'rounded', icon: <Image size={12} /> },
  { label: 'Polaroid', value: 'polaroid', icon: <Square size={12} /> },
  { label: 'Circular', value: 'circular', icon: <div className="w-3 h-3 rounded-full border border-current" /> },
];

export function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [showGrid, setShowGrid] = useState(false);

  const [videoAspect, setVideoAspect] = useState<number>(ASPECT_RATIO_CONFIGS.portrait.aspect);

  const { frames, addFrame, mirror, toggleMirror, soundEnabled, toggleSound, maxFrames, setMaxFrames, aspectRatio, setAspectRatio, frameShape, setFrameShape } = useBoothStore();

  const config = ASPECT_RATIO_CONFIGS[aspectRatio];

  // Update video aspect when aspect ratio changes
  useEffect(() => {
    setVideoAspect(config.aspect);
  }, [config.aspect]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: config.width, height: config.height, facingMode: 'user' },
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
  }, [config.width, config.height]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    setVideoAspect(video.videoWidth / video.videoHeight);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || frames.length >= maxFrames) return;
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
    <div className="bg-background p-4 rounded-3xl border-2 border-primary/20 shadow-xl flex flex-col gap-4 relative">
      <div
        className="relative w-full max-h-[70vh] rounded-2xl overflow-hidden bg-primary shadow-inner mx-auto"
        style={{ aspectRatio: String(videoAspect) }}
      >
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
            onLoadedMetadata={handleLoadedMetadata}
            className={`w-full h-full object-contain ${mirror ? '-scale-x-100' : ''}`}
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

      <div className="flex flex-col gap-4 pt-2">
        {/* Settings Groups */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Timer Group */}
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Timer
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimerSeconds(opt.value)}
                  aria-pressed={timerSeconds === opt.value}
                  className={`h-10 px-4 text-xs font-bold rounded-full transition-all border-2 ${
                    timerSeconds === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                >
                  {opt.value === 0 ? 'Off' : `Timer: ${opt.label}`}
                </button>
              ))}
            </div>
          </div>

          {/* Frames Group */}
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Frames
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {FRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMaxFrames(opt.value)}
                  aria-pressed={maxFrames === opt.value}
                  className={`h-10 w-14 text-xs font-bold rounded-full transition-all border-2 ${
                    maxFrames === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  } focus:outline-none focus:ring-2 focus:ring-primary/50 flex flex-col items-center justify-center`}
                >
                  <span className="font-heading">{opt.label}</span>
                  <span className="text-[10px] opacity-70">Frames</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <label
            className="h-10 px-4 flex items-center justify-center text-xs font-bold rounded-full border-2 border-border bg-background text-foreground hover:border-primary/50 cursor-pointer transition-all"
            title="Upload Photo instead"
          >
            <Upload size={16} className="mr-1.5" />
            Upload photo
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>

          <button
            onClick={triggerCapture}
            disabled={frames.length >= maxFrames || countdown !== null}
            className="w-16 h-16 bg-primary hover:bg-primary/90 disabled:opacity-40 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-all"
          >
            <div className="w-12 h-12 rounded-full border-2 border-primary-foreground/20 flex items-center justify-center">
              <Camera className="text-primary-foreground" size={24} />
            </div>
          </button>

          <div className="h-10 px-4 flex items-center justify-center text-xs font-bold text-muted-foreground">
            {frames.length} / {maxFrames} frames captured
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
