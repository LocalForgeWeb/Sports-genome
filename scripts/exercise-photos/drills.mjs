// Warm-up drill photographs (Oct 7): the preparation library's drills and stretches
// (client/src/lib/preTrainingMobility.ts), by drill id, from the same Free Exercise DB set as the
// exercises and at the same pinned commit.
//
//   node scripts/exercise-photos/drills.mjs <cacheDir>
//
// Writes client/src/data/drillPhotos.json as { drillId: [sourceFolder, frames, width, height] },
// reading every frame's size from the file itself, and leaves the frames in <cacheDir> as
// {source}__{frame}.jpg for thumbnails.mjs. A drill is listed here only where a curator viewed the
// source's frames, two independent reviewers confirmed them, and they were checked again by eye:
// the photo must show that drill's position, equipment and action, never another drill for the
// same region. Every decision, including the drills left without a photo, is in docs/drill-photos/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [cacheDir] = process.argv.slice(2);
if (!cacheDir) { console.error("usage: drills.mjs <cacheDir>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const ref = /exercisePhotoSourceRef = "([0-9a-f]{40})"/.exec(readFileSync(path.join(root, "client/src/lib/exercisePhotos.ts"), "utf8"))[1];
const library = readFileSync(path.join(root, "client/src/lib/preTrainingMobility.ts"), "utf8");
const drillIds = new Set([...library.matchAll(/\{ id: "([a-z0-9-]+)"/g)].map((match) => match[1]));

/** drill id -> source folder. */
const curated = {
  // Raise and rehearse: gait, squat, step, carry.
  "easy-skip": "Fast_Skipping", "tempo-squat": "Bodyweight_Squat", "low-box-step": "Step-up_with_Knee_Raise", "farmer-carry-march": "Farmers_Walk",
  // Ankle and hip.
  "ankle-circle": "Ankle_Circles", "quadruped-hip-circle": "Hip_Circles_prone", "band-lateral-walk": "Monster_Walk",
  // Shoulder and wrist.
  "band-pull-apart": "Band_Pull_Apart", "scap-pullup": "Scapular_Pull-Up", "band-external-rotation": "External_Rotation_with_Band", "arm-circle": "Arm_Circles", "wrist-circle": "Wrist_Circles",
  // A light rehearsal of a lift shows the lift, with its implement: the load is not what is learned.
  "landmine-press-rehearsal": "Single-Arm_Linear_Jammer", "empty-bar-hinge": "Romanian_Deadlift", "goblet-squat-rehearsal": "Goblet_Squat",
};

const unknown = Object.keys(curated).filter((id) => !drillIds.has(id));
if (unknown.length) { console.error("not in the preparation library:", unknown); process.exit(1); }
mkdirSync(cacheDir, { recursive: true });

/** Width and height from a JPEG's start-of-frame segment. */
function jpegSize(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if (marker >= 0xc0 && marker <= 0xc3) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  return null;
}

function frame(source, index) {
  const file = path.join(cacheDir, `${source}__${index}.jpg`);
  if (!existsSync(file)) {
    const url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${ref}/exercises/${source}/${index}.jpg`;
    try { execFileSync("curl", ["-sS", "-f", "-o", file, "--max-time", "30", url]); } catch { return null; }
  }
  const bytes = readFileSync(file);
  return bytes[0] === 0xff && bytes[1] === 0xd8 ? jpegSize(bytes) : null;
}

const out = {};
for (const [id, source] of Object.entries(curated).sort(([a], [b]) => a.localeCompare(b))) {
  const first = frame(source, 0);
  if (!first) { console.error(`no frame 0 for ${id} -> ${source}`); process.exit(1); }
  const second = frame(source, 1);
  out[id] = [source, second ? 2 : 1, first.width, first.height];
}
writeFileSync(path.join(root, "client/src/data/drillPhotos.json"), JSON.stringify(out) + "\n");
console.log(`${Object.keys(out).length} of ${drillIds.size} drills photographed, from ${new Set(Object.values(out).map(([source]) => source)).size} source pairs`);
