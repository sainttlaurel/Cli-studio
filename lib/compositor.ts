import { buildFilterCss } from './filters';
import type { FilterKey } from './store';

export interface CompositeOptions {
  frames: string[];
  filter: FilterKey;
  brightness: number;
  contrast: number;
  themeColor: string;
  caption: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Base (scale=1) layout constants, shared between renderStripCanvas and
// getStripDimensions so the two can never drift apart.
const BASE_PADDING = 24;
const BASE_FRAME_W = 640;
const BASE_FRAME_H = 480;
const BASE_GAP = 20;

/**
 * Returns the pixel dimensions renderStripCanvas will produce for a given
 * frame count / caption presence, at a given scale — without actually
 * rendering anything. Used by lib/print.ts to figure out how far a strip
 * can be scaled up before hitting canvas size limits on some browsers
 * (notably iOS Safari, which caps canvases around 4096px per side and
 * ~16.7M total pixels).
 */
export function getStripDimensions(frameCount: number, hasCaption: boolean, scale = 1) {
  const footerH = (hasCaption ? 110 : 70) * scale;
  const padding = BASE_PADDING * scale;
  const frameH = BASE_FRAME_H * scale;
  const gap = BASE_GAP * scale;

  const width = BASE_FRAME_W * scale + padding * 2;
  const height = padding * 2 + frameCount * frameH + Math.max(frameCount - 1, 0) * gap + footerH;

  return { width, height };
}

/**
 * Draws all captured frames onto a single canvas, applying the chosen
 * filter + brightness/contrast, plus branded footer and optional
 * caption. `scale` multiplies every dimension, so the same layout can
 * be rendered at screen resolution (scale=1, used by compositeStrip)
 * or at a higher resolution for crisp print output — see lib/print.ts.
 */
export async function renderStripCanvas(opts: CompositeOptions, scale = 1): Promise<HTMLCanvasElement> {
  const { frames, filter, brightness, contrast, themeColor, caption } = opts;
  const images = await Promise.all(frames.map(loadImage));

  const PADDING = BASE_PADDING * scale;
  const FRAME_W = BASE_FRAME_W * scale;
  const FRAME_H = BASE_FRAME_H * scale;
  const GAP = BASE_GAP * scale;
  const FOOTER_H = (caption ? 110 : 70) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W + PADDING * 2;
  canvas.height = PADDING * 2 + images.length * FRAME_H + (images.length - 1) * GAP + FOOTER_H;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.filter = buildFilterCss(filter, brightness, contrast) || 'none';
  images.forEach((img, i) => {
    const y = PADDING + i * (FRAME_H + GAP);
    // Cover-fit crop, matching the object-cover behaviour of the live preview.
    const scaleFit = Math.max(FRAME_W / img.width, FRAME_H / img.height);
    const sw = FRAME_W / scaleFit;
    const sh = FRAME_H / scaleFit;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, PADDING, y, FRAME_W, FRAME_H);
  });
  ctx.filter = 'none';

  const footerY = PADDING + images.length * FRAME_H + (images.length - 1) * GAP + 30 * scale;

  ctx.textBaseline = 'middle';
  ctx.font = `bold ${22 * scale}px 'Fredoka', sans-serif`;
  ctx.fillStyle = themeColor;
  ctx.textAlign = 'left';
  ctx.fillText('CLICKSTUDIO.APP', PADDING, footerY);

  ctx.font = `${16 * scale}px Inter, sans-serif`;
  ctx.fillStyle = '#BE185D';
  ctx.textAlign = 'right';
  ctx.fillText(
    new Date().toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) + ' \u2728',
    canvas.width - PADDING,
    footerY
  );

  if (caption) {
    ctx.font = `bold ${20 * scale}px 'Fredoka', sans-serif`;
    ctx.fillStyle = '#4C0519';
    ctx.textAlign = 'center';
    ctx.fillText(caption, canvas.width / 2, footerY + 40 * scale);
  }

  return canvas;
}

/**
 * Renders the strip at screen resolution and returns a PNG Blob, ready
 * to upload or download. Behaviour/output is unchanged from pre-v1.3.
 */
export async function compositeStrip(opts: CompositeOptions): Promise<Blob> {
  const canvas = await renderStripCanvas(opts, 1);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export image.'))),
      'image/png',
      0.95
    );
  });
}