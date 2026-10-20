import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { regionDataFor, specializationRegions } from "@shared/specialization/registry";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SpecializationGoal, SpecializationRegionData } from "@shared/specialization/types";
import { boutsFromSessions } from "./bouts";
import { boutsFromPlan } from "./planBouts";
import { previewPlannedChange, recommendFor } from "./recommendations";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { deltoidIds, deltoidRegionData } from "./__fixtures__/deltoidRegion";
import { exercise, finished, workSet } from "./__fixtures__/syntheticForearm";

/**
 * Brief §1 "Deltoid specialization can be added without a new schema or calculator" and
 * §11 "New deltoid region fixture: same components/API work without forearm-specific
 * branches". The deltoid region is data only; the calculator, adapters and suggestions
 * run on it unchanged, and a source check keeps region names out of that code and out of the
 * page's components (SpecializationPanel.deltoid.render.test.ts renders the page on it).
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const WED = "2026-10-14T18:00:00.000Z";
const catalogMusclesFor = catalogMusclesLookup(exercises);

function summarize(region: SpecializationRegionData, bouts: readonly ExposureBout[], side: ArmSide, goals: SpecializationGoal[] = []) {
  return getSpecializationSummary({ region, bouts, interval: WEEK, side, mode: "completed", goals, catalogMusclesFor, sourceRevision: "src", planRevision: null, now: NOW });
}

describe("the deltoid fixture is data, over real catalog exercises", () => {
  it("names catalog exercises exactly as the catalog does", () => {
    for (const variant of deltoidRegionData.variants) {
      expect(exercises.find((item) => item.id === variant.catalogExerciseId)?.name).toBe(variant.catalogName);
    }
  });

  it("is a test fixture and is never registered in production", () => {
    expect(deltoidRegionData.region.status).toBe("fixture");
    expect(regionDataFor("deltoid")).toBeNull();
    expect(specializationRegions.every((data) => data.region.status === "production")).toBe(true);
  });

  it("is drawn from its own views, in its own words, each selectable path one of its own nodes", () => {
    const drawing = deltoidRegionData.diagram!;
    expect(drawing.viewOrder).toEqual([{ id: "front", label: "Front" }, { id: "side", label: "Side" }, { id: "rear", label: "Rear" }]);
    expect(Object.keys(drawing.views).sort()).toEqual(drawing.viewOrder.map((view) => view.id).sort());
    const nodeIds = new Set(deltoidRegionData.nodes.map((node) => node.id));
    const bellies = (view: string) => Object.values(drawing.views[view] ?? {}).flatMap((layer) => layer?.paths ?? []).filter((path) => path.kind === "belly");
    expect(bellies("front").map((path) => path.nodeId)).toEqual([deltoidIds.lateral, deltoidIds.anterior]);
    // The lateral head is drawn from the side, where it is the middle of the shoulder.
    expect(bellies("side").map((path) => path.nodeId)).toEqual([deltoidIds.posterior, deltoidIds.lateral, deltoidIds.anterior]);
    expect(bellies("rear").map((path) => path.nodeId)).toEqual([deltoidIds.posterior, deltoidIds.lateral]);
    for (const { id } of drawing.viewOrder) expect(bellies(id).every((path) => path.nodeId !== null && nodeIds.has(path.nodeId) && path.id.startsWith(`${id}__`)), id).toBe(true);
  });

  it("has its own page words and offers circumference only, where the forearm offers grip too", () => {
    expect(deltoidRegionData.region.wording).toEqual({ externalGroup: "Other muscles credited here", externalHeading: "Deltoid muscles credited here", incidentalWork: "bracing", progressSubtitle: "Circumference, by arm", sideWord: "arm", sideWordPlural: "arms", onSideTemplate: "your {side} shoulder" });
    expect(deltoidRegionData.region.measurementMetrics).toEqual(["circumference_cm"]);
    expect(forearmRegionData.region.measurementMetrics).toEqual(["circumference_cm", "grip_force_n"]);
    expect(forearmRegionData.diagram!.viewOrder.map((view) => view.label)).toEqual(["Palm", "Back", "Thumb side"]);
  });
});

describe("the same calculator on the deltoid region", () => {
  const sessions = [finished("s1", WED, [
    exercise("e1", "Dumbbell Lateral Raise", 111, [workSet(), workSet(), workSet()]),
    exercise("e2", "Barbell Overhead Press", 101, [workSet(), workSet()]),
    exercise("e3", "Bent-Over Rear-Delt Fly", 90, [workSet(), workSet()]),
    exercise("e4", "Single-Arm Cable Rear-Delt Fly", 93, [workSet({ side: "left" }), workSet({ side: "left" })]),
    exercise("e5", "Cable Upright Row", 317, [workSet()]),
  ])];
  const bouts = boutsFromSessions(sessions, { catalog: exercises, variants: deltoidRegionData.variants, fallbackUnit: "kg" });
  const row = (summary: ReturnType<typeof summarize>, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;

  it("counts each head, keeps the external contributor out of the region total, and keeps unmapped work at region level", () => {
    const left = summarize(deltoidRegionData, bouts, "left");
    expect(row(left, deltoidIds.lateral)).toMatchObject({ directDynamicBouts: 3, pendingReviewBouts: 2, mappingCoverage: "reviewed" });
    expect(row(left, deltoidIds.anterior)).toMatchObject({ directDynamicBouts: 2, contributingDynamicBouts: 3 });
    expect(row(left, deltoidIds.posterior).directDynamicBouts).toBe(4);
    expect(row(left, deltoidIds.triceps).contributingDynamicBouts).toBe(2);
    expect(left.regionDistinctBouts).toBe(9);
    expect(left.regionUnclassified).toEqual({ bouts: 1, exercises: [{ name: "Cable Upright Row", catalogExerciseId: 317, bouts: 1 }] });

    const right = summarize(deltoidRegionData, bouts, "right");
    expect(row(right, deltoidIds.posterior).directDynamicBouts).toBe(2);
    expect(right.regionDistinctBouts).toBe(7);
  });

  it("reads deltoid targets, plans, previews and suggestions through the same functions", () => {
    const goal: SpecializationGoal = { id: "d", regionId: "deltoid", nodeId: deltoidIds.lateral, actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 20, period: "calendar_week", startsOn: "2026-10-12", endsOn: null, timezone: "Europe/London", createdAt: "", updatedAt: "" };
    const summary = summarize(deltoidRegionData, bouts, "left", [goal]);
    expect(summary.goals[0].label).toBe("3 of your 20");

    const slots = buildDaySlots(["Upper"]);
    const store = (ids: number[]): WeeklyDayStore => ({ ...emptyDayStore(), plan: { [slots[0].key]: ids.map((id) => exercises.find((item) => item.id === id)!) } });
    const plan = (ids: number[]) => boutsFromPlan({ week: 1, slots, store: store(ids), variants: deltoidRegionData.variants });
    const preview = previewPlannedChange({ region: deltoidRegionData, before: plan([111]), after: plan([111, 90]), side: "left", planWeek: 1 });
    expect(preview.nodes.map((node) => [node.nodeId, node.before.directDynamicBouts, node.after.directDynamicBouts])).toEqual([[deltoidIds.posterior, 0, 3]]);

    const suggestions = recommendFor({ region: deltoidRegionData, target: { nodeId: deltoidIds.lateral }, side: "left", summary, plannedExercises: [], catalog: exercises, equipmentProfile: null });
    expect(suggestions.kind === "candidates" && suggestions.candidates.map((candidate) => candidate.name)).toEqual(["Dumbbell Lateral Raise"]);
  });
});

/** Region and muscle words that region-agnostic code must never contain. */
const regionWords = /forearm|deltoid|delts?\b|\bfc[ru]\b|\bfd[sp]\b|\becr[lb]\b|\becu\b|brachioradialis|wrist|biceps|triceps|pronat|supinat/i;

describe("no region is named in the calculator, the windows, the goals or the adapters", () => {
  const files = [
    "shared/specialization/exposure.ts",
    "shared/specialization/time.ts",
    "shared/specialization/goals.ts",
    "client/src/lib/specialization/bouts.ts",
    "client/src/lib/specialization/planBouts.ts",
    "client/src/lib/specialization/revision.ts",
    "client/src/lib/specialization/stores.ts",
    "client/src/lib/specialization/recommendations.ts",
    "client/src/lib/specialization/useSpecializationSummary.ts",
  ];

  for (const file of files) {
    it(file, () => {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      const hits = source.split("\n").map((line, index) => [index + 1, line] as const).filter(([, line]) => regionWords.test(line));
      expect(hits).toEqual([]);
    });
  }
});

/**
 * The page's components (every source file here: the .tsx components, the page model and the
 * drawing's geometry, which once listed the forearm's views itself) by the same rule, plus the words
 * the forearm page once hard-coded (its view names, "upper-arm"): a region's words come from its
 * data (`region.wording`, `measurementMetrics`, the drawing's `viewOrder`). Comments are not
 * read, since they may cite the forearm brief or give a forearm id as an example; strings and
 * code are. `grip` is not on the list: it is also a measure (`grip_force_n`, offered only when the
 * region lists it) and a kind of mapping (straps), which the components name as such. The muscle
 * sheet and the exposure sentence take the incidental word from `region.wording` too, and
 * SpecializationPanel.deltoid.render.test.ts checks the deltoid's sheet for forearm words.
 */
describe("no region is named in the page's components", () => {
  const dir = "client/src/components/specialization";
  const files = readdirSync(join(process.cwd(), dir)).filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)).sort();
  const pageWords = new RegExp(`${regionWords.source}|thumb.side|pinky|\\bpalm|upper.arm`, "i");
  /** Lines that must stay, by file and exact code, each with its reason. */
  const allowed: { file: string; code: string; why: string }[] = [
    {
      file: "ActionGlyph.tsx",
      code: 'if (/pronation|supination|rotation/.test(actionId)) return "rotate";',
      why: "Picks the glyph's shape from the verb in any region's action id (shoulder.internal_rotation, foot pronation): joint-action vocabulary, not a branch on a region.",
    },
  ];

  /** The file's lines with every comment blanked out, by the TypeScript parser (JSX text is text, not a comment). */
  const codeLines = (file: string, text: string) => {
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const chars = text.split("");
    const blank = (ranges: readonly ts.CommentRange[] | undefined) => {
      for (const range of ranges ?? []) for (let index = range.pos; index < range.end; index++) if (chars[index] !== "\n") chars[index] = " ";
    };
    const startsWithText = (node: ts.Node) => node.getChildren(source)[0]?.kind === ts.SyntaxKind.JsxText;
    const visit = (node: ts.Node) => {
      // A doc comment is blanked whole; JSX text is never trivia, so it is never scanned for comments.
      if (ts.isJSDoc(node)) { blank([{ pos: node.pos, end: node.end, kind: ts.SyntaxKind.MultiLineCommentTrivia }]); return; }
      if (node.kind === ts.SyntaxKind.JsxText) return;
      if (!startsWithText(node)) blank(ts.getLeadingCommentRanges(text, node.pos));
      const children = node.getChildren(source);
      if (!children.length && node.kind !== ts.SyntaxKind.GreaterThanToken) blank(ts.getTrailingCommentRanges(text, node.end));
      children.forEach(visit);
    };
    visit(source);
    return chars.join("").split("\n");
  };

  it("finds the page's components, and reads strings and code but not comments", () => {
    expect(files).toEqual(expect.arrayContaining(["SpecializationPanel.tsx", "SpecializationDiagram.tsx", "MeasurementsPanel.tsx", "MuscleSheet.tsx", "model.ts", "diagramGeometry.ts"]));
    expect(files.some((name) => name.includes(".test."))).toBe(false);
    const sample = 'const a = "Thumb side"; // forearm\n/** forearm */\nconst b = <p>{/* forearm */}upper-arm</p>;';
    expect(codeLines("sample.tsx", sample).map((line) => pageWords.test(line))).toEqual([true, false, true]);
    expect(codeLines("sample.tsx", sample)[0].trimEnd()).toBe('const a = "Thumb side";');
  });

  for (const file of files) {
    it(file, () => {
      const lines = codeLines(file, readFileSync(join(process.cwd(), dir, file), "utf8"));
      const hits = lines
        .map((line, index) => [index + 1, line.trim()] as const)
        .filter(([, line]) => pageWords.test(line) && !allowed.some((entry) => entry.file === file && entry.code === line));
      expect(hits).toEqual([]);
    });
  }

  it("keeps the allow-list short and true: every entry is still a line of its file", () => {
    expect(allowed.length).toBeLessThanOrEqual(3);
    for (const entry of allowed) {
      expect(entry.why.length, entry.code).toBeGreaterThan(40);
      const lines = codeLines(entry.file, readFileSync(join(process.cwd(), dir, entry.file), "utf8")).map((line) => line.trim());
      expect(lines, `${entry.file}: ${entry.code}`).toContain(entry.code);
    }
  });
});

describe("the forearm content, whatever it holds today", () => {
  it("runs through the calculator without error and reports coverage for every node", () => {
    const bouts = boutsFromSessions([finished("s1", WED, [exercise("e1", "Wrist Curl", 139, [workSet({ side: "both" })]), exercise("e2", "Barbell Bent-Over Row", 43, [workSet()])])], { catalog: exercises, variants: forearmRegionData.variants, fallbackUnit: "kg" });
    for (const side of ["left", "right"] as const) {
      const summary = summarize(forearmRegionData, bouts, side);
      expect(summary.nodes.map((node) => node.nodeId)).toEqual(forearmRegionData.nodes.map((node) => node.id));
      expect(summary.nodes.every((node) => ["reviewed", "pending_review", "none"].includes(node.mappingCoverage))).toBe(true);
      expect(summary.mappingVersion).toBe(forearmRegionData.mappingVersion.key);
      // Both bouts are forearm work by catalog tag at least: mapped, pending or region-only, never lost.
      expect(summary.completeness.boutsConsidered).toBe(2);
    }
  });
});
