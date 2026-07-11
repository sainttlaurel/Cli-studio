"use client";

import Link from "next/link";
import { ArrowRight, X, Camera, Upload, Bolt, Settings, Check, Image, RefreshCw, RectangleVertical, Square, RectangleHorizontal, Crop } from "lucide-react";
import { useBoothStore, type AspectRatio, type FrameShape } from "@/lib/store";
import { useCallback, useEffect, useRef, useState } from 'react';
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

const ASPECT_RATIO_CONFIGS = {
  portrait: { width: 960, height: 1280, aspect: 3 / 4 },
  square: { width: 960, height: 960, aspect: 1 / 1 },
  landscape: { width: 1280, height: 960, aspect: 4 / 3 },
};

const STEPS = ['Start', 'Shoot', 'Edit', 'Export'];

const NAV_LINKS = [
  { href: '/gallery', label: 'Gallery' },
  { href: '/wall', label: 'Visit' },
  { href: '/history', label: 'My Stripe' },
  { href: '/', label: "What's new" },
];

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

export default function StudioPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [videoAspect, setVideoAspect] = useState<number>(ASPECT_RATIO_CONFIGS.portrait.aspect);

  const { frames, addFrame, removeFrame, mirror, toggleMirror, soundEnabled, maxFrames, setMaxFrames, aspectRatio, setAspectRatio, frameShape, setFrameShape } = useBoothStore();
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
    <div className="min-h-screen w-full bg-[#FFF6FA] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#F0D9E6] bg-white">
        <div className="max-w-[1160px] mx-auto px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5.5 h-5.5 bg-[#D4247E] rounded-xl flex items-center justify-center text-white text-xs font-bold">
              <Camera size={12} />
            </div>
            <span className="text-xl font-bold text-[#3A2432]">ClickStudio</span>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => {
              const stepNum = i + 1;
              const isDone = stepNum < 2; // Start is done, Shoot is active
              const isActive = stepNum === 2;
              const isUpcoming = stepNum > 2;
              
              return (
                <>
                  {i > 0 && (
                    <div className={`w-9 h-0.5 ${isDone ? 'bg-[#F3B4D2]' : 'bg-[#F0D9E6]'}`} />
                  )}
                  <div className="flex items-center gap-2 px-3.5">
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone ? 'bg-[#D4247E] text-white' :
                      isActive ? 'bg-[#D4247E] text-white ring-2 ring-[#F9DCE9]' :
                      'bg-[#F9DCE9] text-[#AB1D65]'
                    }`}>
                      {isDone ? <Check size={12} /> : stepNum}
                    </div>
                    <span className={`text-sm font-medium ${
                      isDone ? 'text-[#3A2432]' :
                      isActive ? 'text-[#D4247E] font-bold' :
                      'text-[#8A7482]'
                    }`}>
                      {label}
                    </span>
                  </div>
                </>
              );
            })}
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-[22px]">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-[#8A7482] hover:text-[#3A2432] transition-colors"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/"
              className="px-4 py-2 bg-[#D4247E] text-white text-sm font-semibold rounded-xl hover:bg-[#AB1D65] transition-colors"
            >
              Sell studio
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1">
        <div className="max-w-[1160px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6">
            {/* Camera Preview Card */}
            <div className="bg-white border border-[#F0D9E6] rounded-2xl overflow-hidden">
              <div 
                className="relative bg-gradient-to-br from-[#3a2a3a] via-[#8899bb] to-[#dfc9b0]"
                style={{ aspectRatio: String(videoAspect) }}
              >
                {streamError ? (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm text-center px-6">
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

                {/* Live indicator */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/55 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Top controls */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={toggleMirror}
                    className="w-7 h-7 bg-black/40 text-white rounded-xl flex items-center justify-center hover:bg-black/60 transition-colors"
                    aria-label="Flip camera"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    className="w-7 h-7 bg-black/40 text-white rounded-xl flex items-center justify-center hover:bg-black/60 transition-colors"
                    aria-label="Settings"
                  >
                    <Settings size={14} />
                  </button>
                </div>

                {/* Countdown overlay */}
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-white text-7xl font-bold">{countdown}</span>
                  </div>
                )}

                {/* Banner */}
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-4.5 py-2 bg-[#D4247E] text-white text-sm font-semibold rounded-full shadow-lg">
                    Own your beauty — you look incredible
                  </span>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="p-5 border-t border-[#F0D9E6]">
                {/* Settings Groups - Organized in a clean grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Timer Group */}
                  <div>
                    <p className="text-xs font-bold text-[#8A7482] uppercase tracking-wider mb-2">Timer</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {TIMER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTimerSeconds(opt.value)}
                          aria-pressed={timerSeconds === opt.value}
                          className={`h-9 px-3 text-sm font-medium rounded-full transition-all border-2 ${
                            timerSeconds === opt.value
                              ? 'bg-[#D4247E] text-white border-[#D4247E]'
                              : 'bg-white text-[#3A2432] border-[#F0D9E6] hover:border-[#F3B4D2]'
                          }`}
                        >
                          {opt.value === 0 ? 'Off' : `Timer: ${opt.label}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frames Group */}
                  <div>
                    <p className="text-xs font-bold text-[#8A7482] uppercase tracking-wider mb-2">Frames</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {FRAME_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setMaxFrames(opt.value)}
                          aria-pressed={maxFrames === opt.value}
                          className={`h-9 px-3 text-sm font-medium rounded-full transition-all border-2 ${
                            maxFrames === opt.value
                              ? 'bg-[#D4247E] text-white border-[#D4247E]'
                              : 'bg-white text-[#3A2432] border-[#F0D9E6] hover:border-[#F3B4D2]'
                          }`}
                        >
                          {opt.label} Frames
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio Group */}
                  <div>
                    <p className="text-xs font-bold text-[#8A7482] uppercase tracking-wider mb-2">Aspect Ratio</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {ASPECT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAspectRatio(opt.value)}
                          aria-pressed={aspectRatio === opt.value}
                          className={`h-9 px-3 text-sm font-medium rounded-full transition-all border-2 flex items-center gap-1.5 ${
                            aspectRatio === opt.value
                              ? 'bg-[#D4247E] text-white border-[#D4247E]'
                              : 'bg-white text-[#3A2432] border-[#F0D9E6] hover:border-[#F3B4D2]'
                          }`}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Shape Group */}
                  <div>
                    <p className="text-xs font-bold text-[#8A7482] uppercase tracking-wider mb-2">Frame Shape</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {SHAPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFrameShape(opt.value)}
                          aria-pressed={frameShape === opt.value}
                          className={`h-9 px-3 text-sm font-medium rounded-full transition-all border-2 flex items-center gap-1.5 ${
                            frameShape === opt.value
                              ? 'bg-[#D4247E] text-white border-[#D4247E]'
                              : 'bg-white text-[#3A2432] border-[#F0D9E6] hover:border-[#F3B4D2]'
                          }`}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Row - Centered with frames count beside camera */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-[#F0D9E6]">
                  <label className="h-9 px-3.5 flex items-center justify-center text-sm font-medium rounded-full border-2 border-[#F0D9E6] bg-white text-[#D4247E] hover:border-[#F3B4D2] cursor-pointer transition-all">
                    <Upload size={14} className="mr-1.5" />
                    Upload photo
                    <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                  </label>

                  <span className="text-sm font-semibold text-[#8A7482]">
                    YOUR CAPTURED FRAMES ({frames.length} / {maxFrames})
                  </span>

                  <button
                    onClick={triggerCapture}
                    disabled={frames.length >= maxFrames || countdown !== null}
                    className="w-13 h-13 bg-[#D4247E] hover:bg-[#AB1D65] disabled:opacity-40 rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center">
                      <Camera className="text-white" size={20} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Frames Sidebar */}
            <div className="bg-white border border-[#F0D9E6] rounded-2xl p-5 h-fit">
              <h3 className="text-sm font-bold text-[#8A7482] uppercase tracking-wider mb-3.5">
                Frames Preview
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: maxFrames }).map((_, i) => {
                  const frame = frames[i];
                  return (
                    <div
                      key={i}
                      className="aspect-[4/5] min-h-0 border-2 border-dashed border-[#F3B4D2] rounded-xl bg-[#FDF2F7] flex flex-col items-center justify-center gap-1.5 relative group"
                    >
                      {frame ? (
                        <>
                          <img
                            src={frame}
                            alt={`Frame ${i + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <button
                            onClick={() => removeFrame(i)}
                            className="absolute top-1 right-1 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Image className="text-[#F3B4D2]" size={18} />
                          <span className="text-xs font-medium text-[#8A7482]">Frame {i + 1}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <Link
                href={frames.length >= maxFrames ? "/editor" : "#"}
                aria-disabled={frames.length < maxFrames}
                className={`mt-4.5 w-full h-11 flex items-center justify-center gap-1.5 text-sm font-bold rounded-xl transition-all ${
                  frames.length >= maxFrames
                    ? 'bg-[#D4247E] text-white hover:bg-[#AB1D65]'
                    : 'bg-[#E8E2E5] text-[#8A7482] pointer-events-none'
                }`}
              >
                <ArrowRight size={16} />
                Continue to editor
              </Link>
              {frames.length < maxFrames && (
                <p className="text-xs text-[#8A7482] text-center mt-2">
                  Capture all {maxFrames} frames to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#F0D9E6] bg-white">
        <div className="max-w-[1160px] mx-auto px-6 py-4.5 text-center">
          <p className="text-xs text-[#8A7482] flex items-center justify-center gap-1.5">
            <Bolt size={12} />
            ClickStudio processes your camera entirely in your browser. Your privacy is safe with us.
          </p>
        </div>
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
