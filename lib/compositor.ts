import { buildFilterCss } from './filters';
import { getStickerDefinition } from './stickers';
import type { FilterKey, PlacedSticker } from './store';

export interface CompositeOptions {
  frames: string[];
  filter: FilterKey;
  brightness: number;
  contrast: number;
  themeColor: string;
  caption: string;
  stickers?: PlacedSticker[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const BASE_PADDING = 24;
const BASE_FRAME_W = 640;
const BASE_FRAME_H = 480;
const BASE_GAP = 20;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawSticker(ctx: CanvasRenderingContext2D, sticker: PlacedSticker, canvasWidth: number, canvasHeight: number) {
  const stickerDef = getStickerDefinition(sticker.key);
  const width = (canvasWidth * sticker.size) / 100;
  const height = stickerDef.shape === 'circle' ? width : width * 0.48;
  const x = (canvasWidth * sticker.x) / 100;
  const y = (canvasHeight * sticker.y) / 100;
  const radius = stickerDef.shape === 'ticket' ? width * 0.08 : height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);

  ctx.shadowColor = 'rgba(76, 5, 25, 0.18)';
  ctx.shadowBlur = width * 0.08;
  ctx.shadowOffsetY = width * 0.035;

  roundedRect(ctx, -width / 2, -height / 2, width, height, radius);
  ctx.fillStyle = stickerDef.bg;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(3, width * 0.035);
  ctx.strokeStyle = stickerDef.border;
  ctx.stroke();

  ctx.fillStyle = stickerDef.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.max(20, width * 0.21)}px 'Fredoka', sans-serif`;
  ctx.fillText(stickerDef.text, 0, 1, width * 0.78);
  ctx.restore();
}

export function getStripDimensions(frameCount: number, hasCaption: boolean, scale = 1) {
  const footerH = (hasCaption ? 110 : 70) * scale;
  const padding = BASE_PADDING * scale;
  const frameH = BASE_FRAME_H * scale;
  const gap = BASE_GAP * scale;

  const width = BASE_FRAME_W * scale + padding * 2;
  const height = padding * 2 + frameCount * frameH + Math.max(frameCount - 1, 0) * gap + footerH;

  return { width, height };
}

export async function renderStripCanvas(opts: CompositeOptions, scale = 1): Promise<HTMLCanvasElement> {
  const { frames, filter, brightness, contrast, themeColor, caption, stickers = [] } = opts;
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

  stickers.forEach((sticker) => drawSticker(ctx, sticker, canvas.width, canvas.height));

  return canvas;
}

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
