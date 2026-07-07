import { buildFilterCss } from "./filters";
import { getStickerDefinition } from "./stickers";
import type { FilterKey, LayerRef, PlacedSticker, PlacedTextLayer } from "./store";
import { resolveLayerOrder } from "./store";
import type { TextStickerDefinition } from "./stickers";

export interface CompositeOptions {
  frames: string[];
  filter: FilterKey;
  brightness: number;
  contrast: number;
  themeColor: string;
  caption: string;
  stickers?: PlacedSticker[];
  textLayers?: PlacedTextLayer[];
  layerOrder?: LayerRef[];
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

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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

function drawTextSticker(
  ctx: CanvasRenderingContext2D,
  sticker: PlacedSticker,
  def: TextStickerDefinition,
  canvasWidth: number,
  canvasHeight: number,
) {
  const width = (canvasWidth * sticker.size) / 100;
  const height = def.shape === "circle" ? width : width * 0.48;
  const x = (canvasWidth * sticker.x) / 100;
  const y = (canvasHeight * sticker.y) / 100;
  const radius = def.shape === "ticket" ? width * 0.08 : height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);

  ctx.shadowColor = "rgba(76, 5, 25, 0.18)";
  ctx.shadowBlur = width * 0.08;
  ctx.shadowOffsetY = width * 0.035;

  roundedRect(ctx, -width / 2, -height / 2, width, height, radius);
  ctx.fillStyle = def.bg;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.lineWidth = Math.max(3, width * 0.035);
  ctx.strokeStyle = def.border;
  ctx.stroke();

  ctx.fillStyle = def.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(20, width * 0.21)}px 'Fredoka', sans-serif`;
  ctx.fillText(def.text, 0, 1, width * 0.78);
  ctx.restore();
}

function drawImageStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: PlacedSticker,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  const width = (canvasWidth * sticker.size) / 100;
  const height = (width / img.naturalWidth) * img.naturalHeight;
  const x = (canvasWidth * sticker.x) / 100;
  const y = (canvasHeight * sticker.y) / 100;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = width * 0.06;
  ctx.shadowOffsetY = width * 0.03;
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
}

const FONT_FAMILY_MAP: Record<string, string> = {
  fredoka: "'Fredoka', sans-serif",
  inter: "Inter, sans-serif",
  mono: "'Courier New', monospace",
};

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: PlacedTextLayer,
  canvasWidth: number,
  canvasHeight: number,
) {
  const fontSize = (canvasWidth * layer.size) / 100;
  const x = (canvasWidth * layer.x) / 100;
  const y = (canvasHeight * layer.y) / 100;
  const fontFamily = FONT_FAMILY_MAP[layer.fontFamily] ?? FONT_FAMILY_MAP.inter;

  ctx.save();
  ctx.globalAlpha = (layer.opacity ?? 100) / 100;
  ctx.translate(x, y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = layer.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = fontSize * 0.08;
  ctx.shadowOffsetY = fontSize * 0.04;
  ctx.fillText(layer.text, 0, 0);
  ctx.restore();
}

async function drawSticker(
  ctx: CanvasRenderingContext2D,
  sticker: PlacedSticker,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.save();
  ctx.globalAlpha = (sticker.opacity ?? 100) / 100;
  const def = getStickerDefinition(sticker.key);
  if (def.type === "image") {
    const img = await loadImage(def.src);
    drawImageStickerOnCanvas(ctx, sticker, img, canvasWidth, canvasHeight);
  } else {
    drawTextSticker(ctx, sticker, def, canvasWidth, canvasHeight);
  }
  ctx.restore();
}

export function getStripDimensions(
  frameCount: number,
  hasCaption: boolean,
  scale = 1,
) {
  const footerH = (hasCaption ? 110 : 70) * scale;
  const padding = BASE_PADDING * scale;
  const frameH = BASE_FRAME_H * scale;
  const gap = BASE_GAP * scale;

  const width = BASE_FRAME_W * scale + padding * 2;
  const height =
    padding * 2 +
    frameCount * frameH +
    Math.max(frameCount - 1, 0) * gap +
    footerH;

  return { width, height };
}

export async function renderStripCanvas(
  opts: CompositeOptions,
  scale = 1,
): Promise<HTMLCanvasElement> {
  const {
    frames,
    filter,
    brightness,
    contrast,
    themeColor,
    caption,
    stickers = [],
    textLayers = [],
    layerOrder,
  } = opts;
  const images = await Promise.all(frames.map(loadImage));

  const PADDING = BASE_PADDING * scale;
  const FRAME_W = BASE_FRAME_W * scale;
  const FRAME_H = BASE_FRAME_H * scale;
  const GAP = BASE_GAP * scale;
  const FOOTER_H = (caption ? 110 : 70) * scale;

  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W + PADDING * 2;
  canvas.height =
    PADDING * 2 +
    images.length * FRAME_H +
    (images.length - 1) * GAP +
    FOOTER_H;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.filter = buildFilterCss(filter, brightness, contrast) || "none";
  images.forEach((img, i) => {
    const y = PADDING + i * (FRAME_H + GAP);
    const scaleFit = Math.max(FRAME_W / img.width, FRAME_H / img.height);
    const sw = FRAME_W / scaleFit;
    const sh = FRAME_H / scaleFit;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, PADDING, y, FRAME_W, FRAME_H);
  });
  ctx.filter = "none";

  const footerY =
    PADDING + images.length * FRAME_H + (images.length - 1) * GAP + 30 * scale;

  ctx.textBaseline = "middle";
  ctx.font = `bold ${22 * scale}px 'Fredoka', sans-serif`;
  ctx.fillStyle = themeColor;
  ctx.textAlign = "left";
  ctx.fillText("CLICKSTUDIO.APP", PADDING, footerY);

  ctx.font = `${16 * scale}px Inter, sans-serif`;
  ctx.fillStyle = "#BE185D";
  ctx.textAlign = "right";
  ctx.fillText(
    new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      year: "2-digit",
    }) + " \u2728",
    canvas.width - PADDING,
    footerY,
  );

  if (caption) {
    ctx.font = `bold ${20 * scale}px 'Fredoka', sans-serif`;
    ctx.fillStyle = "#4C0519";
    ctx.textAlign = "center";
    ctx.fillText(caption, canvas.width / 2, footerY + 40 * scale);
  }

  const stack = resolveLayerOrder(layerOrder, stickers, textLayers);
  for (const ref of stack) {
    if (ref.kind === "sticker") {
      const sticker = stickers.find((s) => s.id === ref.id);
      if (sticker) await drawSticker(ctx, sticker, canvas.width, canvas.height);
    } else {
      const layer = textLayers.find((t) => t.id === ref.id);
      if (layer) drawTextLayer(ctx, layer, canvas.width, canvas.height);
    }
  }

  return canvas;
}

export async function compositeStrip(opts: CompositeOptions): Promise<Blob> {
  const canvas = await renderStripCanvas(opts, 1);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Failed to export image.")),
      "image/png",
      0.95,
    );
  });
}
