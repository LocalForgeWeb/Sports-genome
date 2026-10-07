// Same-origin thumbnails and the provenance manifest for every mapped exercise photograph
// (Oct 6 brief §2). A catalog or plan row shows an 88 x 59 CSS-pixel frame; it used to
// download the 850-pixel source frame from a third-party CDN for it. Each thumbnail here is
// the start frame (in the movement's order, exercisePhotoOrder.json), scaled with the
// browser's high-quality resampler to cover that frame at 3x: 264 pixels wide for a
// landscape photo, 180 high for a portrait or square one. The source is public domain
// (Unlicense), so redistributing scaled copies needs no permission; the manifest still
// records where every byte came from.
//
//   PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright/index.mjs \
//   node scripts/exercise-photos/thumbnails.mjs <cacheDir>
//
// <cacheDir> holds the original frames as audit.mjs fetched them ({source}__{frame}.jpg).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const [cacheDir] = process.argv.slice(2);
if (!cacheDir) { console.error("usage: thumbnails.mjs <cacheDir>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const mapping = JSON.parse(readFileSync(path.join(root, "client/src/data/exercisePhotos.json"), "utf8"));
const order = JSON.parse(readFileSync(path.join(root, "client/src/data/exercisePhotoOrder.json"), "utf8"));
const ref = /exercisePhotoSourceRef = "([0-9a-f]{40})"/.exec(readFileSync(path.join(root, "client/src/lib/exercisePhotos.ts"), "utf8"))[1];
const outDir = path.join(root, "client/public/exercise-thumbs");
mkdirSync(outDir, { recursive: true });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// One thumbnail per source folder: a few exercises share a photograph (Romanian deadlift and
// barbell hip hinge, the landmine jammer variations).
const sources = new Map();
for (const [id, [source, count, width = 850, height = 567]] of Object.entries(mapping)) {
  const entry = sources.get(source) ?? { source, count, width, height, frame: count > 1 && order[source] ? 1 : 0, exerciseIds: [] };
  entry.exerciseIds.push(Number(id));
  sources.set(source, entry);
}

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const browser = await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {});
const page = await browser.newPage();
const manifest = {};
for (const entry of sources.values()) {
  const original = path.join(cacheDir, `${entry.source}__${entry.frame}.jpg`);
  if (!existsSync(original)) throw new Error(`missing cached frame ${original}; run audit.mjs first`);
  const bytes = readFileSync(original);
  const landscape = entry.width > entry.height * 1.2;
  const target = landscape ? { width: 264, height: Math.round((264 * entry.height) / entry.width) } : { width: Math.round((180 * entry.width) / entry.height), height: 180 };
  const base64 = await page.evaluate(async ({ data, target }) => {
    const image = new Image();
    image.src = `data:image/jpeg;base64,${data}`;
    await image.decode();
    // Halve in steps, then the last step to size: one big jump drops detail.
    let canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    while (canvas.width / 2 >= target.width) {
      const next = document.createElement("canvas");
      next.width = Math.round(canvas.width / 2); next.height = Math.round(canvas.height / 2);
      const context = next.getContext("2d"); context.imageSmoothingQuality = "high"; context.drawImage(canvas, 0, 0, next.width, next.height);
      canvas = next;
    }
    const out = document.createElement("canvas");
    out.width = target.width; out.height = target.height;
    const context = out.getContext("2d"); context.imageSmoothingQuality = "high"; context.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL("image/jpeg", 0.8).split(",")[1];
  }, { data: bytes.toString("base64"), target });
  const thumb = Buffer.from(base64, "base64");
  writeFileSync(path.join(outDir, `${entry.source}.jpg`), thumb);
  manifest[entry.source] = {
    exerciseIds: entry.exerciseIds.sort((a, b) => a - b),
    licence: "Unlicense (public domain dedication)",
    origin: `https://github.com/yuhonas/free-exercise-db/blob/${ref}/exercises/${entry.source}/${entry.frame}.jpg`,
    originalFrame: entry.frame,
    originalSha256: sha256(bytes),
    originalSize: [entry.width, entry.height],
    thumbnail: `client/public/exercise-thumbs/${entry.source}.jpg`,
    thumbnailSha256: sha256(thumb),
    thumbnailSize: [target.width, target.height],
    thumbnailBytes: thumb.length,
  };
}
await browser.close();

// A thumbnail whose source is no longer mapped (a withdrawn photo) is removed, so no file can
// be shown for an exercise the review took it away from.
for (const file of readdirSync(outDir)) if (!sources.has(file.replace(/\.jpg$/, ""))) rmSync(path.join(outDir, file));
writeFileSync(path.join(root, "docs/exercise-media-audit/sources.json"), JSON.stringify({ generatedBy: "scripts/exercise-photos/thumbnails.mjs", sourceRepo: "yuhonas/free-exercise-db", sourceRef: ref, sources: manifest }, null, 1) + "\n");
const total = Object.values(manifest).reduce((sum, item) => sum + item.thumbnailBytes, 0);
console.log(`${sources.size} thumbnails, ${(total / 1024).toFixed(0)} KB in all, ${(total / sources.size / 1024).toFixed(1)} KB each on average`);
