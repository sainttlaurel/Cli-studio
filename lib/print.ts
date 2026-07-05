import { renderStripCanvas, getStripDimensions } from './compositor';
import type { CompositeOptions } from './compositor';

export type PrintSizeKey = '2x6' | '4x6' | 'a4' | 'letter';

interface PrintSizeSpec {
  label: string;
  widthIn: number;
  heightIn: number;
  /** How many copies of the strip to place side by side on the page. */
  copies: number;
  /** Passed straight into the `@page { size: ... }` print rule. */
  pageCss: string;
}

const DPI = 300;

// Ideal render scale for the strip unit before placing it on the page
// canvas — high enough to stay crisp once printed at 300dpi. The actual
// scale used is clamped below this by getSafeUnitScale().
const IDEAL_UNIT_RENDER_SCALE = 4;

// iOS Safari caps a single canvas at ~4096px per side AND ~16.7M total
// pixels (whichever hits first). A 4-frame strip with a caption, at 4x,
// blows past the area limit (~23.5M px) even though neither side alone
// looks unreasonable — Safari fails silently in that case (blank/garbled
// canvas, no thrown error), so this has to be checked up front rather
// than caught.
const MAX_CANVAS_DIMENSION = 4096;
const MAX_CANVAS_AREA = 16_777_216; // 4096 * 4096
const SAFETY_MARGIN = 0.92; // stay a bit under the hard limit, not right at it

/**
 * Computes the largest scale (up to IDEAL_UNIT_RENDER_SCALE) that keeps
 * the rendered strip canvas within known browser limits, given the
 * actual frame count and caption presence for this export. Falls back
 * toward 1 only in extreme cases; a normal 1-4 frame strip comfortably
 * fits at or near the ideal scale.
 */
function getSafeUnitScale(frameCount: number, hasCaption: boolean): number {
  const base = getStripDimensions(frameCount, hasCaption, 1);

  const maxByDimension = Math.min(MAX_CANVAS_DIMENSION / base.width, MAX_CANVAS_DIMENSION / base.height);
  const maxByArea = Math.sqrt(MAX_CANVAS_AREA / (base.width * base.height));

  const safeMax = Math.min(maxByDimension, maxByArea) * SAFETY_MARGIN;
  const scale = Math.min(IDEAL_UNIT_RENDER_SCALE, safeMax);

  if (scale < IDEAL_UNIT_RENDER_SCALE) {
    // eslint-disable-next-line no-console
    console.warn(
      `[print] Reducing print render scale from ${IDEAL_UNIT_RENDER_SCALE}x to ${scale.toFixed(
        2
      )}x for a ${frameCount}-frame strip to stay within canvas size limits.`
    );
  }

  return Math.max(1, scale);
}

export const PRINT_SIZES: Record<PrintSizeKey, PrintSizeSpec> = {
  '2x6': { label: '2×6" Strip', widthIn: 2, heightIn: 6, copies: 1, pageCss: '2in 6in' },
  '4x6': { label: '4×6" Photo', widthIn: 4, heightIn: 6, copies: 2, pageCss: '4in 6in' },
  a4: { label: 'A4', widthIn: 8.2677, heightIn: 11.6929, copies: 2, pageCss: '210mm 297mm' },
  letter: { label: 'US Letter', widthIn: 8.5, heightIn: 11, copies: 2, pageCss: '8.5in 11in' },
};

/**
 * Renders a print-ready page at 300dpi: the composited strip, repeated
 * side-by-side (2 copies, classic double-strip layout) for sizes bigger
 * than the strip itself, or as a single copy filling the page for 2x6.
 */
export async function compositePrintPage(
  opts: CompositeOptions & { printSize: PrintSizeKey }
): Promise<Blob> {
  const { printSize, ...stripOpts } = opts;
  const spec = PRINT_SIZES[printSize];

  const unitScale = getSafeUnitScale(stripOpts.frames.length, Boolean(stripOpts.caption));
  const unitCanvas = await renderStripCanvas(stripOpts, unitScale);

  const pageW = Math.round(spec.widthIn * DPI);
  const pageH = Math.round(spec.heightIn * DPI);

  const canvas = document.createElement('canvas');
  canvas.width = pageW;
  canvas.height = pageH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageW, pageH);

  const MARGIN = Math.round(0.1 * DPI);
  const GUTTER = spec.copies > 1 ? Math.round(0.15 * DPI) : 0;

  const availW = pageW - MARGIN * 2 - GUTTER * (spec.copies - 1);
  const availH = pageH - MARGIN * 2;
  const perCopyMaxW = availW / spec.copies;

  // Fit each copy within its share of the page, preserving aspect ratio.
  const scale = Math.min(perCopyMaxW / unitCanvas.width, availH / unitCanvas.height);
  const drawW = unitCanvas.width * scale;
  const drawH = unitCanvas.height * scale;

  const blockW = drawW * spec.copies + GUTTER * (spec.copies - 1);
  const startX = (pageW - blockW) / 2;
  const startY = (pageH - drawH) / 2;

  for (let i = 0; i < spec.copies; i++) {
    const x = startX + i * (drawW + GUTTER);
    ctx.drawImage(unitCanvas, x, startY, drawW, drawH);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to render print page.'))),
      'image/png',
      0.98
    );
  });
}

/**
 * Injects a print-only <img> sized to the page plus a matching @page
 * rule, opens the browser's native print dialog, then cleans up. No PDF
 * library needed — the print dialog's "Save as PDF" destination covers
 * that use case for free, per the roadmap's bundle-size guidance.
 */
export function printPageImage(blobUrl: string, printSize: PrintSizeKey): Promise<void> {
  const spec = PRINT_SIZES[printSize];

  return new Promise((resolve) => {
    const style = document.createElement('style');
    style.id = 'clickstudio-print-style';
    style.textContent = `
      @media print {
        @page { size: ${spec.pageCss}; margin: 0; }
        body * { visibility: hidden; }
        #clickstudio-print-image { visibility: visible; }
        #clickstudio-print-image {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          object-fit: contain;
        }
      }
    `;
    document.head.appendChild(style);

    const img = document.createElement('img');
    img.id = 'clickstudio-print-image';
    img.src = blobUrl;
    img.alt = 'Print-ready photo strip page';
    document.body.appendChild(img);

    const cleanup = () => {
      style.remove();
      img.remove();
      window.removeEventListener('afterprint', cleanup);
      resolve();
    };

    img.onload = () => {
      window.addEventListener('afterprint', cleanup);
      window.print();
      // Fallback in case `afterprint` doesn't fire on some browser/OS
      // combos — safe no-op if cleanup already ran via the event.
      setTimeout(cleanup, 60000);
    };
  });
}