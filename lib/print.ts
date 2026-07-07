import { renderStripCanvas, getStripDimensions } from "./compositor";
import type { CompositeOptions } from "./compositor";

export type PrintSizeKey = "2x6" | "4x6" | "a4" | "letter";

interface PrintSizeSpec {
  label: string;
  widthIn: number;
  heightIn: number;
  copies: number;
  pageCss: string;
}

const DPI = 300;

const IDEAL_UNIT_RENDER_SCALE = 4;

const MAX_CANVAS_DIMENSION = 4096;
const MAX_CANVAS_AREA = 16_777_216;
const SAFETY_MARGIN = 0.92;

function getSafeUnitScale(frameCount: number, hasCaption: boolean): number {
  const base = getStripDimensions(frameCount, hasCaption, 1);

  const maxByDimension = Math.min(
    MAX_CANVAS_DIMENSION / base.width,
    MAX_CANVAS_DIMENSION / base.height,
  );
  const maxByArea = Math.sqrt(MAX_CANVAS_AREA / (base.width * base.height));

  const safeMax = Math.min(maxByDimension, maxByArea) * SAFETY_MARGIN;
  const scale = Math.min(IDEAL_UNIT_RENDER_SCALE, safeMax);

  if (scale < IDEAL_UNIT_RENDER_SCALE) {
    // eslint-disable-next-line no-console
    console.warn(
      `[print] Reducing print render scale from ${IDEAL_UNIT_RENDER_SCALE}x to ${scale.toFixed(
        2,
      )}x for a ${frameCount}-frame strip to stay within canvas size limits.`,
    );
  }

  return Math.max(1, scale);
}

export const PRINT_SIZES: Record<PrintSizeKey, PrintSizeSpec> = {
  "2x6": {
    label: '2×6" Strip',
    widthIn: 2,
    heightIn: 6,
    copies: 1,
    pageCss: "2in 6in",
  },
  "4x6": {
    label: '4×6" Photo',
    widthIn: 4,
    heightIn: 6,
    copies: 2,
    pageCss: "4in 6in",
  },
  a4: {
    label: "A4",
    widthIn: 8.2677,
    heightIn: 11.6929,
    copies: 2,
    pageCss: "210mm 297mm",
  },
  letter: {
    label: "US Letter",
    widthIn: 8.5,
    heightIn: 11,
    copies: 2,
    pageCss: "8.5in 11in",
  },
};

export async function compositePrintPage(
  opts: CompositeOptions & { printSize: PrintSizeKey },
): Promise<Blob> {
  const { printSize, ...stripOpts } = opts;
  const spec = PRINT_SIZES[printSize];

  const unitScale = getSafeUnitScale(
    stripOpts.frames.length,
    Boolean(stripOpts.caption),
  );
  const unitCanvas = await renderStripCanvas(stripOpts, unitScale);

  const pageW = Math.round(spec.widthIn * DPI);
  const pageH = Math.round(spec.heightIn * DPI);

  const canvas = document.createElement("canvas");
  canvas.width = pageW;
  canvas.height = pageH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, pageW, pageH);

  const MARGIN = Math.round(0.1 * DPI);
  const GUTTER = spec.copies > 1 ? Math.round(0.15 * DPI) : 0;

  const availW = pageW - MARGIN * 2 - GUTTER * (spec.copies - 1);
  const availH = pageH - MARGIN * 2;
  const perCopyMaxW = availW / spec.copies;

  const scale = Math.min(
    perCopyMaxW / unitCanvas.width,
    availH / unitCanvas.height,
  );
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
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Failed to render print page.")),
      "image/png",
      0.98,
    );
  });
}

export function printPageImage(
  blobUrl: string,
  printSize: PrintSizeKey,
): Promise<void> {
  const spec = PRINT_SIZES[printSize];

  return new Promise((resolve) => {
    const style = document.createElement("style");
    style.id = "clickstudio-print-style";
    // Notes on mobile browser compatibility:
    // - @page { size } is ignored by iOS Safari, Chrome for Android, and Samsung Internet.
    //   The canvas is already rendered at the correct physical dimensions at 300 DPI, so
    //   the image itself is correct — it's just the page declaration that browsers may
    //   disregard. We include it anyway for desktop browsers that do honour it.
    // - width/height use percentage + auto (not 100vw/100vh) so the image scales to the
    //   paper width on desktop print dialogs and doesn't overflow on mobile screens.
    // - object-fit: contain ensures the strip is never cropped regardless of paper ratio.
    // - page-break rules prevent the image from being split across multiple pages.
    style.textContent = `
      @media print {
        @page { size: ${spec.pageCss}; margin: 0; }
        body * { visibility: hidden !important; }
        #clickstudio-print-image,
        #clickstudio-print-image * { visibility: visible !important; }
        #clickstudio-print-image {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          object-position: center;
          page-break-inside: avoid;
          break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);

    const img = document.createElement("img");
    img.id = "clickstudio-print-image";
    img.src = blobUrl;
    img.alt = "Print-ready photo strip page";
    document.body.appendChild(img);

    let resolved = false;
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      style.remove();
      img.remove();
      window.removeEventListener("afterprint", cleanup);
      resolve();
    };

    img.onload = () => {
      // afterprint is unreliable on mobile browsers — fall back to a short timeout
      // so cleanup always runs even if the event is never fired.
      window.addEventListener("afterprint", cleanup);
      window.print();
      setTimeout(cleanup, 30000);
    };

    img.onerror = () => {
      cleanup();
    };
  });
}
