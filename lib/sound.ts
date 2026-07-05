// Lightweight capture sound effects, synthesized with the Web Audio API
// rather than shipping audio files — keeps the bundle small.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    // Browsers require a user gesture to resume — capture is always
    // triggered by a click/tap, so this succeeds in practice.
    audioCtx.resume();
  }
  return audioCtx;
}

function tone(frequency: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.15) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000);
}

/** Short tick played each second during the capture countdown. */
export function playCountdownTick() {
  tone(880, 90, 'sine', 0.12);
}

/** Two-tone shutter click played at the moment a frame is captured. */
export function playShutter() {
  tone(220, 60, 'square', 0.18);
  setTimeout(() => tone(1200, 40, 'triangle', 0.1), 40);
}
