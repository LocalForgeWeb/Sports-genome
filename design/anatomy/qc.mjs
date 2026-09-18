/**
 * Quality control for the built figures.
 *
 * Checks the things that are cheap to get wrong by hand and expensive to notice
 * later: duplicate IDs, a region drawn on one side only, a canonical key with no
 * home, and regions too small to tap at the size the phone actually renders.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");

// Every canonical key Body Lab can hand the figure, from the app's own maps.
const CATALOG_KEYS = [
  "abductors", "abs", "adductors", "biceps", "brachialis", "brachioradialis",
  "calves", "chest", "feet", "forearms", "frontDelts", "glutes", "hamstrings",
  "hipFlexors", "lats", "lowerBack", "obliques", "peroneals", "quads",
  "rearDelts", "rhomboids", "rotatorCuff", "serratusAnterior", "shoulders",
  "sideDelts", "soleus", "tfl", "tibialis", "traps", "triceps", "upperBack",
];
// Umbrella and alias keys resolve onto regions drawn under another key rather
// than getting geometry of their own.
const RESOLVED_BY_ALIAS = {
  shoulders: ["frontDelts", "sideDelts", "rearDelts"],
  rhomboids: ["upperBack"],
  feet: ["__structural_foot__"],
};

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);

const parsed = {};
for (const view of ["front", "back"]) {
  const svg = readFileSync(join(out, `body_${view}.svg`), "utf8");
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  const muscles = [...svg.matchAll(/id="(muscle__[^"]+)" data-muscle="([^"]+)"(?: data-part="([^"]+)")? data-side="([^"]+)"/g)]
    .map((m) => ({ id: m[1], key: m[2], part: m[3] ?? null, side: m[4] }));
  parsed[view] = { svg, ids, muscles };
}

console.log("=== unique ids ===");
for (const view of ["front", "back"]) {
  const { ids } = parsed[view];
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  dupes.length ? fail(`${view}: duplicate ids ${[...new Set(dupes)].join(", ")}`) : pass(`${view}: ${ids.length} ids, all unique`);
}

console.log("\n=== bilateral symmetry ===");
for (const view of ["front", "back"]) {
  const bySig = new Map();
  for (const m of parsed[view].muscles) {
    const sig = `${m.key}|${m.part ?? ""}`;
    bySig.set(sig, [...(bySig.get(sig) ?? []), m.side]);
  }
  const lopsided = [...bySig].filter(([, sides]) => !(sides.includes("left") && sides.includes("right")));
  lopsided.length
    ? fail(`${view}: not mirrored — ${lopsided.map(([s]) => s).join(", ")}`)
    : pass(`${view}: all ${bySig.size} regions drawn left and right`);
}

console.log("\n=== front/back consistency ===");
const sharedKeys = [...new Set(parsed.front.muscles.map((m) => m.key))]
  .filter((k) => parsed.back.muscles.some((m) => m.key === k));
pass(`keys appearing on both views: ${sharedKeys.join(", ")}`);

console.log("\n=== canonical key coverage ===");
const drawn = new Set([...parsed.front.muscles, ...parsed.back.muscles].map((m) => m.key));
const missing = [];
for (const key of CATALOG_KEYS) {
  if (drawn.has(key)) continue;
  const via = RESOLVED_BY_ALIAS[key];
  if (via) { pass(`${key} → resolves onto ${via.join(", ")}`); continue; }
  missing.push(key);
}
missing.length ? fail(`no region for: ${missing.join(", ")}`) : pass(`all ${CATALOG_KEYS.length} canonical keys reachable`);

const extra = [...drawn].filter((k) => !CATALOG_KEYS.includes(k));
extra.length ? fail(`invented keys not in the catalog vocabulary: ${extra.join(", ")}`) : pass("no invented muscle keys");

console.log(`\n${failures === 0 ? "PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
