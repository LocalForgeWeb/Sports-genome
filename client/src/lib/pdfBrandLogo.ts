import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";

export type PdfLogo = { jpeg: Uint8Array; width: number; height: number };

let pending: Promise<PdfLogo | null> | null = null;

/**
 * The app's own logo, flattened onto the document's white ground as a JPEG the
 * PDF can embed without decoding (Oct 2 brief §12). Its proportions are the
 * file's own. If the image cannot be fetched or read - offline, or a browser
 * that refuses it - the document is drawn with the wordmark alone, never with a
 * stand-in mark.
 */
export function loadPdfLogo(url: string = sportsGenomeAssets.officialLogo, timeoutMs = 2500): Promise<PdfLogo | null> {
  if (pending) return pending;
  pending = Promise.race([readLogo(url), new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))])
    .catch(() => null)
    .then((logo) => { if (!logo) pending = null; return logo; });
  return pending;
}

async function readLogo(url: string): Promise<PdfLogo | null> {
  if (typeof document === "undefined" || typeof fetch === "undefined") return null;
  const response = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" });
  if (!response.ok) return null;
  const blob = await response.blob();
  const image = await decode(blob);
  if (!image || !image.width || !image.height) return null;
  // Drawn at up to 240px tall: crisp at the 34pt it prints at, and a few kilobytes.
  const scale = Math.min(1, 240 / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!jpeg) return null;
  return { jpeg: new Uint8Array(await jpeg.arrayBuffer()), width, height };
}

async function decode(blob: Blob): Promise<CanvasImageSource & { width: number; height: number } | null> {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(blob); } catch { /* fall through to <img> */ }
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
