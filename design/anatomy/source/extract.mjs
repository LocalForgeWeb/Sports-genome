/**
 * Adapts the muscle_mapper anatomy to the Sports Genome canonical taxonomy.
 *
 * Source: https://github.com/suryamolly/muscle_mapper (MIT, © 2026 Surya Mouly)
 * Only the vector geometry is used; none of the package's UI.
 *
 * Nothing here redraws a body. The source already has interlocking anatomical
 * tissue at the quality the reference apps show; the job is to rename its groups
 * onto Sports Genome keys, assign sides from geometry, and emit neutral paths
 * the app recolours at runtime.
 *
 * Sides come from each path's measured centroid against the figure's own
 * midline, never from document order: the source alternates order between groups
 * (`gastrocnemius` is viewer-right first, `rectus-femoris` viewer-left first),
 * so ordering would silently mirror half the body.
 */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Source group → Sports Genome canonical key (+ optional visual part).
 * `null` means the group is body shell, not a scored muscle.
 */
const MAP = {
  front: {
    "upper-pectoralis": ["chest", "clavicular"],
    "mid-lower-pectoralis": ["chest", "sternal"],
    "anterior-deltoid": ["frontDelts", null],
    "lateral-deltoid": ["sideDelts", null],
    "long-head-bicep": ["biceps", "long_head"],
    "short-head-bicep": ["biceps", "short_head"],
    "wrist-flexors": ["forearms", "flexors"],
    // The front extensor mass is the radial side of the forearm, which is the
    // brachioradialis ridge Sports Genome scores separately.
    "wrist-extensors": ["brachioradialis", null],
    "upper-abdominals": ["abs", "upper"],
    "lower-abdominals": ["abs", "lower"],
    obliques: ["obliques", null],
    // The inguinal region the source calls `groin` is the hip-flexor triangle.
    groin: ["hipFlexors", null],
    "outer-quadricep": ["quads", "vastus_lateralis"],
    "rectus-femoris": ["quads", "rectus_femoris"],
    "inner-quadricep": ["quads", "vastus_medialis"],
    "inner-thigh": ["adductors", null],
    tibialis: ["tibialis", null],
    gastrocnemius: ["calves", "gastrocnemius_medial"],
    soleus: ["soleus", null],
    "upper-trapezius": ["traps", "upper"],
    feet: ["feet", null],
    neck: null, hands: null, body: null,
  },
  back: {
    "upper-trapezius": ["traps", "upper"],
    "lower-trapezius": ["traps", "lower"],
    "traps-middle": ["upperBack", "interscapular"],
    "posterior-deltoid": ["rearDelts", null],
    "lateral-deltoid": ["sideDelts", null],
    lats: ["lats", null],
    lowerback: ["lowerBack", "erector_spinae"],
    "long-head-triceps": ["triceps", "long_head"],
    "lateral-head-triceps": ["triceps", "lateral_head"],
    "medial-head-triceps": ["triceps", "medial_head"],
    "wrist-extensors": ["forearms", "extensors"],
    "wrist-flexors": ["forearms", "ulnar"],
    "gluteus-maximus": ["glutes", null],
    "gluteus-medius": ["abductors", null],
    "inner-thigh": ["adductors", "magnus"],
    "lateral-hamstrings": ["hamstrings", "biceps_femoris"],
    "medial-hamstrings": ["hamstrings", "semimembranosus"],
    gastrocnemius: ["calves", "gastrocnemius"],
    soleus: ["soleus", null],
    feet: ["feet", null],
    neck: null, hands: null, body: null,
  },
};

/** Canonical keys Body Lab can hand the figure that this source does not draw. */
const UNRESOLVED = {
  front: ["brachialis", "serratusAnterior", "tfl", "peroneals"],
  back: ["rotatorCuff", "obliques", "peroneals"],
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 1500 } });

const views = {};
const report = [];

for (const [view, file] of [["front", "front_src.svg"], ["back", "back_src.svg"]]) {
  const svg = readFileSync(join(here, file), "utf8");
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.waitForTimeout(200);

  const data = await page.evaluate((mapping) => {
    const svg = document.querySelector("svg");
    const viewBox = svg.getAttribute("viewBox").split(/\s+/).map(Number);
    const figure = svg.getBBox();
    const mid = figure.x + figure.width / 2;

    const shell = [];
    const linework = [];
    const muscles = {};
    const structural = [];

    for (const g of svg.querySelectorAll("g[id]")) {
      const id = g.id;
      const paths = [...g.querySelectorAll("path")];
      if (id === "body") {
        for (const p of paths) {
          const b = p.getBBox();
          const d = p.getAttribute("d");
          // The two big half-body outlines become the filled shell so joints
          // are body rather than holes; everything else stays stroke-only.
          if (b.width > 150 && b.height > 400) shell.push(d);
          else linework.push(d);
        }
        for (const l of g.querySelectorAll("line")) {
          linework.push(`M${l.getAttribute("x1")},${l.getAttribute("y1")}L${l.getAttribute("x2")},${l.getAttribute("y2")}`);
        }
        continue;
      }
      const target = mapping[id];
      if (target === null || target === undefined) {
        paths.forEach((p) => structural.push({ source: id, d: p.getAttribute("d") }));
        continue;
      }
      const [key, part] = target;
      for (const p of paths) {
        const b = p.getBBox();
        const d = p.getAttribute("d");
        // Spanning means genuinely paired across the midline, not merely
        // touching it: the right gluteus maximus crosses by 0.2 units, while a
        // true midline structure sits ~half on each side. Measured minShare is
        // 0.002 for that glute and 0.489-0.500 for every real one.
        const leftOfMid = Math.max(0, mid - b.x);
        const rightOfMid = Math.max(0, b.x + b.width - mid);
        const spans = b.width > 0 && Math.min(leftOfMid, rightOfMid) / b.width >= 0.15;
        const cx = b.x + b.width / 2;
        (muscles[key] ||= []).push({
          part, d, spans,
          viewerSide: cx < mid ? "L" : "R",
          area: +(b.width * b.height).toFixed(0),
        });
      }
    }
    return { viewBox, figure: { x: figure.x, y: figure.y, w: figure.width, h: figure.height }, mid, shell, linework, muscles, structural };
  }, MAP[view]);

  // Viewer side → subject side. On an anterior view the subject's right is the
  // viewer's left; on a posterior view it is the viewer's right.
  const subjectSide = (viewerSide) =>
    view === "front" ? (viewerSide === "L" ? "right" : "left") : (viewerSide === "L" ? "left" : "right");

  const muscles = [];
  for (const [key, entries] of Object.entries(data.muscles)) {
    const paths = [];
    for (const e of entries) {
      const name = (side) => ["muscle", key, e.part, side].filter(Boolean).join("__");
      if (e.spans) {
        // A single drawn shape crossing the midline is a paired muscle the
        // source merged. Clipping to each half recovers the pair exactly,
        // without cutting path data by hand.
        for (const side of ["left", "right"]) {
          paths.push({ id: name(side), part: e.part ?? null, side, d: e.d, clipHalf: side === "left" ? viewerHalfFor(view, "left") : viewerHalfFor(view, "right") });
        }
      } else {
        const side = subjectSide(e.viewerSide);
        paths.push({ id: name(side), part: e.part ?? null, side, d: e.d, clipHalf: null });
      }
    }
    muscles.push({ key, paths, area: entries.reduce((n, e) => n + e.area, 0) });
  }
  muscles.sort((a, b) => b.area - a.area);

  views[view] = {
    viewBox: data.viewBox,
    mid: +data.mid.toFixed(2),
    shell: data.shell,
    linework: data.linework,
    structural: data.structural.map((s, i) => ({ id: `base__${view}__${s.source}__${i}`, d: s.d })),
    muscles,
  };

  report.push({
    view,
    keys: muscles.length,
    paths: muscles.reduce((n, m) => n + m.paths.length, 0),
    shell: data.shell.length,
    linework: data.linework.length,
    structural: data.structural.length,
    unresolved: UNRESOLVED[view],
  });
}

/** Which viewer half a subject side occupies, per view. */
function viewerHalfFor(view, subject) {
  if (view === "front") return subject === "right" ? "viewerLeft" : "viewerRight";
  return subject === "left" ? "viewerLeft" : "viewerRight";
}

await browser.close();
writeFileSync(join(here, "extracted.json"), JSON.stringify(views, null, 2));

for (const r of report) {
  console.log(`${r.view}: ${r.keys} canonical keys, ${r.paths} muscle paths, ${r.shell} shell, ${r.linework} linework, ${r.structural} structural`);
  console.log(`  unresolved (source has no geometry): ${r.unresolved.join(", ")}`);
}
for (const view of ["front", "back"]) {
  const bad = views[view].muscles.flatMap((m) => m.paths).filter((p) => !/__(left|right)$/.test(p.id));
  console.log(`${view}: paths missing a side suffix: ${bad.length}`);
  const sides = {};
  views[view].muscles.forEach((m) => m.paths.forEach((p) => { sides[p.side] = (sides[p.side] ?? 0) + 1; }));
  console.log(`  side balance: ${JSON.stringify(sides)}`);
}
