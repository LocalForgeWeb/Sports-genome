import type { DiagramPlatePass } from "@shared/specialization/types";
import { decodeLabels, type PlatePixels } from "./plates";

/**
 * Loads a pass's two images (the plate and its labels) and reads their pixels, once per visit:
 * the promise is kept, so returning to a pass, or to the page, shows it without a request. Only the
 * plate renderer calls this, and only for the pass it shows, so nothing is fetched while the page
 * is closed, while the 3D model is chosen, or for a pass nobody opened. A failed load is not kept.
 */
const cache = new Map<string, Promise<PlatePixels>>();
const ready = new Map<string, PlatePixels>();
const keyOf = (pass: DiagramPlatePass) => `${pass.image}|${pass.labels}`;

/** A pass's pixels when they have already loaded in this visit, so going back to it paints at once. */
export function loadedPlatePass(pass: DiagramPlatePass): PlatePixels | null {
  return ready.get(keyOf(pass)) ?? null;
}

const base = (import.meta.env?.BASE_URL as string | undefined) ?? "/";
/** A path under the app's public root, as the page serves it. */
export const platePublicUrl = (path: string) => `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}

function pixelsOf(image: HTMLImageElement, width: number, height: number): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot read the image's pixels");
  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

export function loadPlatePass(pass: DiagramPlatePass, frame: { width: number; height: number }): Promise<PlatePixels> {
  const key = keyOf(pass);
  const known = cache.get(key);
  if (known) return known;
  const next = Promise.all([loadImage(platePublicUrl(pass.image)), loadImage(platePublicUrl(pass.labels))]).then(([plateImage, labelImage]) => {
    const { width, height } = frame;
    const pixels = { width, height, plate: pixelsOf(plateImage, width, height), labels: decodeLabels(pixelsOf(labelImage, width, height), width, height, pass.nodeIds.length) };
    ready.set(key, pixels);
    return pixels;
  });
  next.catch(() => cache.delete(key));
  cache.set(key, next);
  return next;
}
