// Records each mapped photograph's intrinsic size beside its source id, so the app can reserve
// the frame before the bytes arrive. Reads the first 64 KB of every frame at the pinned commit
// (enough for the JPEG header after any EXIF block) and writes [source, frames, width, height]
// back into client/src/data/exercisePhotos.json. Frames whose two photographs differ in size
// are reported; the first frame's size is recorded.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const ref = process.argv[2] || 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const file = new URL('../../client/src/data/exercisePhotos.json', import.meta.url);
const mapping = JSON.parse(readFileSync(file, 'utf8'));
const jpegSize = (buffer) => {
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) { i += 1; continue; }
    const marker = buffer[i + 1];
    if (marker >= 0xc0 && marker <= 0xc3) return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) };
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  return null;
};
const fetchHead = (source, frame) => {
  const url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${ref}/exercises/${source}/${frame}.jpg`;
  try { return jpegSize(execFileSync('curl', ['-sS', '-f', '-r', '0-65535', url], { timeout: 30000, maxBuffer: 1 << 20 })); } catch { return null; }
};
const mismatches = []; const missing = [];
for (const [id, entry] of Object.entries(mapping)) {
  const [source, count] = entry;
  const first = fetchHead(source, 0);
  if (!first) { missing.push(`${id} ${source}`); continue; }
  if (count > 1) { const second = fetchHead(source, 1); if (second && (second.width !== first.width || second.height !== first.height)) mismatches.push(`${id} ${source}: ${first.width}x${first.height} vs ${second.width}x${second.height}`); }
  mapping[id] = [source, count, first.width, first.height];
  process.stderr.write(`${id} ${source} ${first.width}x${first.height}\n`);
}
writeFileSync(file, JSON.stringify(mapping));
console.log(JSON.stringify({ sized: Object.values(mapping).filter((entry) => entry.length === 4).length, missing, mismatches }, null, 1));
