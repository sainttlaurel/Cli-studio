import { buildFilterCss } from './filters';
import type { FilterKey } from './store';

interface CompositeOptions {
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

/**
 * Draws all captured frames onto a single canvas, applying the chosen
 * filter + brightness/contrast, plus branded footer and optional
 * caption, then returns a PNG Blob ready to upload or download.
 */
export async function compositeStrip(opts: CompositeOptions): Promise<Blob> {
  const { frames, filter, brightness, contrast, themeColor, caption } = opts;
  const images = await Promise.all(frames.map(loadImage));

  const PADDING = 24;
  const FRAME_W = 640;
  const FRAME_H = 480;
  const GAP = 20;
  const FOOTER_H = caption ? 110 : 70;

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
    const scale = Math.max(FRAME_W / img.width, FRAME_H / img.height);
    const sw = FRAME_W / scale;
    const sh = FRAME_H / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, PADDING, y, FRAME_W, FRAME_H);
  });
  ctx.filter = 'none';

  const footerY = PADDING + images.length * FRAME_H + (images.length - 1) * GAP + 30;

  ctx.textBaseline = 'middle';
  ctx.font = "bold 22px 'Fredoka', sans-serif";
  ctx.fillStyle = themeColor;
  ctx.textAlign = 'left';
  ctx.fillText('CLICKSTUDIO.APP', PADDING, footerY);

  ctx.font = '16px Inter, sans-serif';
  ctx.fillStyle = '#BE185D';
  ctx.textAlign = 'right';
  ctx.fillText(
    new Date().toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) + ' \u2728',
    canvas.width - PADDING,
    footerY
  );

  if (caption) {
    ctx.font = "bold 20px 'Fredoka', sans-serif";
    ctx.fillStyle = '#4C0519';
    ctx.textAlign = 'center';
    ctx.fillText(caption, canvas.width / 2, footerY + 40);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export image.'))),
      'image/png',
      0.95
    );
  });
}
