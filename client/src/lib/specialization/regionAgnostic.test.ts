import { readFileSync } from "node:fs";
import { join } from "node:path";
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
 * run on it unchanged, and a source check keeps region names out of that code.
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

  it("draws every selectable path for one of its own nodes", () => {
    const nodeIds = new Set(deltoidRegionData.nodes.map((node) => node.id));
    const paths = Object.values(deltoidRegionData.diagram!.views).flatMap((view) => Object.values(view ?? {}).flatMap((layer) => layer?.paths ?? []));
    const bellies = paths.filter((path) => path.kind === "belly");
    expect(bellies.map((path) => path.nodeId)).toEqual([deltoidIds.anterior, deltoidIds.lateral, deltoidIds.posterior]);
    expect(bellies.every((path) => path.nodeId !== null && nodeIds.has(path.nodeId))).toBe(true);
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
  const regionWords = /forearm|deltoid|delts?\b|\bfc[ru]\b|\bfd[sp]\b|\becr[lb]\b|\becu\b|brachioradialis|wrist|biceps|triceps|pronat|supinat/i;

  for (const file of files) {
    it(file, () => {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      const hits = source.split("\n").map((line, index) => [index + 1, line] as const).filter(([, line]) => regionWords.test(line));
      expect(hits).toEqual([]);
    });
  }
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
