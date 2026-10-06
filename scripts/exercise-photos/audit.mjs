// Exercise media audit (Oct 6 brief §2): the status of every catalog exercise's photographs, by
// stable catalog id, from the bytes rather than from the presence of a URL.
//
//   node scripts/exercise-photos/audit.mjs <catalog.json> <cacheDir> <outDir>
//
// <catalog.json> is the catalog exported as [{ id, name, equipment, category, movement }].
// For every mapped frame it fetches the file at the pinned commit (raw.githubusercontent.com,
// the same path and bytes the app's jsDelivr URL serves), and records: the HTTP status, any
// redirect, the content type, whether the bytes are a complete JPEG (SOI ... EOI), the size
// read from the JPEG's own frame header, and whether that size matches the manifest the app
// uses to reserve the frame. Every unmapped exercise is given its documented reason.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [catalogPath, cacheDir, outDir] = process.argv.slice(2);
if (!catalogPath || !cacheDir || !outDir) { console.error("usage: audit.mjs <catalog.json> <cacheDir> <outDir>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const mapping = JSON.parse(readFileSync(path.join(root, "client/src/data/exercisePhotos.json"), "utf8"));
const order = JSON.parse(readFileSync(path.join(root, "client/src/data/exercisePhotoOrder.json"), "utf8"));
const decisions = JSON.parse(readFileSync(path.join(root, "docs/exercise-photo-rematch/decisions.json"), "utf8"));
const visual = existsSync(path.join(root, "docs/exercise-media-audit/visual-review.json")) ? JSON.parse(readFileSync(path.join(root, "docs/exercise-media-audit/visual-review.json"), "utf8")) : {};
const ref = /exercisePhotoSourceRef = "([0-9a-f]{40})"/.exec(readFileSync(path.join(root, "client/src/lib/exercisePhotos.ts"), "utf8"))[1];
const curate = readFileSync(path.join(root, "scripts/exercise-photos/curate.mjs"), "utf8");
// The October 1 rejections: an exact or aliased source existed but showed another variation.
const rejected = new Map([...curate.slice(curate.indexOf("const rejected = {"), curate.indexOf("};", curate.indexOf("const rejected = {"))).matchAll(/(\d+):\s*'([^']+)'/g)].map((m) => [Number(m[1]), m[2]]));
mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

/** Width and height from a JPEG's start-of-frame segment, and whether the file ends where a JPEG ends. */
function readJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return { jpeg: false };
  let complete = false;
  for (let end = buffer.length - 1; end > buffer.length - 64 && end > 0; end -= 1) if (buffer[end - 1] === 0xff && buffer[end] === 0xd9) { complete = true; break; }
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { jpeg: true, complete, height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return { jpeg: true, complete, width: null, height: null };
}

function fetchFrame(source, frame) {
  const file = path.join(cacheDir, `${source}__${frame}.jpg`);
  const url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${ref}/exercises/${source}/${frame}.jpg`;
  let status = 0, redirects = 0, contentType = "";
  try {
    const out = execFileSync("curl", ["-sS", "-o", file, "-w", "%{http_code} %{num_redirects} %{content_type}", "--max-time", "30", url], { encoding: "utf8" });
    [status, redirects, contentType] = out.trim().split(" ");
    status = Number(status); redirects = Number(redirects);
  } catch (error) { return { url, status: 0, error: String(error.message).slice(0, 120) }; }
  const bytes = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
  return { url, status, redirects, contentType, bytes: bytes.length, ...readJpeg(bytes) };
}

const rows = [];
for (const exercise of catalog) {
  const entry = mapping[String(exercise.id)];
  if (!entry) {
    const decision = decisions.find((item) => item.id === exercise.id);
    const reason = rejected.get(exercise.id) ? `rejected variation: ${rejected.get(exercise.id)}` : decision?.curator?.why || decision?.why || "no photograph of this exercise in the source";
    rows.push({ id: exercise.id, name: exercise.name, equipment: exercise.equipment, status: rejected.get(exercise.id) ? "wrong_variant_withdrawn" : "missing", source: null, reason, fallback: "equipment icon" });
    continue;
  }
  const [source, count, width = 850, height = 567] = entry;
  const frames = Array.from({ length: Math.min(count, 2) }, (_, index) => index).map((frame) => ({ frame, ...fetchFrame(source, frame) }));
  const problems = [];
  for (const frame of frames) {
    if (frame.status !== 200) problems.push(`frame ${frame.frame}: HTTP ${frame.status}`);
    else if (!frame.jpeg) problems.push(`frame ${frame.frame}: not a JPEG`);
    else if (!frame.complete) problems.push(`frame ${frame.frame}: truncated`);
    else if (frame.width !== width || frame.height !== height) problems.push(`frame ${frame.frame}: is ${frame.width}x${frame.height}, manifest says ${width}x${height}`);
    if (frame.redirects) problems.push(`frame ${frame.frame}: ${frame.redirects} redirect(s)`);
    if (frame.status === 200 && !/image\/jpeg/.test(frame.contentType)) problems.push(`frame ${frame.frame}: served as ${frame.contentType}`);
  }
  const review = visual[String(exercise.id)];
  const status = problems.some((problem) => /HTTP|not a JPEG|truncated/.test(problem)) ? "unreachable_or_invalid"
    : problems.length ? "needs_manifest_fix"
      : review?.verdict === "wrong_variant" ? "wrong_variant"
        : review?.verdict === "unsuitable" ? "unsuitable_crop_or_quality"
          : "verified";
  rows.push({ id: exercise.id, name: exercise.name, equipment: exercise.equipment, status, source, frames: frames.map(({ frame, status: http, bytes, width: w, height: h, contentType }) => ({ frame, http, bytes, width: w, height: h, contentType })), reversed: Boolean(order[source]), problems, review: review?.note });
}

const counts = rows.reduce((all, row) => ({ ...all, [row.status]: (all[row.status] || 0) + 1 }), {});
writeFileSync(path.join(outDir, "inventory.json"), JSON.stringify({ auditedAt: new Date().toISOString(), sourceRef: ref, total: rows.length, counts, rows }, null, 1));
writeFileSync(path.join(outDir, "inventory.tsv"), ["id\tname\tequipment\tstatus\tsource\tnote", ...rows.map((row) => [row.id, row.name, row.equipment, row.status, row.source ?? "", (row.problems?.join("; ") || row.review || row.reason || "").replace(/\s+/g, " ").slice(0, 300)].join("\t"))].join("\n") + "\n");
console.log(JSON.stringify(counts));
