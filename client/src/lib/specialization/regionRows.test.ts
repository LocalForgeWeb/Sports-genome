import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { calendarWeekInterval } from "@shared/specialization/time";
import type { ExposureBout, SpecializationSummary } from "@shared/specialization/types";
import { syntheticForearm } from "./__fixtures__/syntheticForearm";
import { catalogMusclesLookup } from "./useSpecializationSummary";

/**
 * Region totals keep the bouts they count (brief §1, "Every total opens the contributing
 * exercises and actual set records"; §9 source bout ids): the region's distinct bouts on this
 * arm, the bouts with no arm recorded, and the work mapped to no muscle, each as set records
 * with their workout, so the page can open any of the three totals down to the set.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const names = new Map(exercises.map((exercise) => [exercise.id, exercise.name] as const));
const catalogMusclesFor = catalogMusclesLookup(exercises);

function bout(id: string, catalogExerciseId: number, over: Partial<ExposureBout> = {}): ExposureBout {
  return {
    id, mode: "completed", performedAt: "2026-10-14T18:00:00.000Z", sessionId: "s1", sessionLabel: "Week 1 · Day 02 · Pull", planWeek: null, dayKey: null,
    exerciseEntryId: "e1", catalogExerciseId, exerciseName: names.get(catalogExerciseId) ?? "Unknown", matchedBy: "id", armSide: { side: "both", source: "recorded" }, legSide: null,
    straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 12, loadKg: 20, holdSeconds: null }], ...over,
  };
}
const noArm: Partial<ExposureBout> = { armSide: null };

const summarize = (bouts: readonly ExposureBout[], side: "left" | "right" = "left"): SpecializationSummary =>
  getSpecializationSummary({ region: syntheticForearm, bouts, interval: WEEK, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "src", planRevision: null, now: NOW });

describe("the bouts behind region totals", () => {
  const bouts = [
    bout("b2", 139, { performedAt: "2026-10-15T18:00:00.000Z", sessionId: "s2" }),
    bout("b1", 139),
    // Reverse curl: brachioradialis is a region muscle, so it is region work; the upper-arm credit does not add a second bout.
    bout("b3", 135),
    // One-arm work on the other arm says nothing about this one.
    bout("b4", 132, { armSide: { side: "right", source: "recorded" } }),
    bout("u1", 132, noArm),
    // Towel dead hang: tagged with the forearms in the catalog, mapped to no muscle here.
    bout("r1", 144, { segments: [{ id: "r1", reps: null, loadKg: null, holdSeconds: 30 }] }),
    // Dumbbell pullover, the same, with no arm recorded; the shared library has no variant of it, so its sides stay unknown.
    bout("r2", 24, { ...noArm, sessionId: "s3", sessionLabel: "Grip" }),
  ];
  const summary = summarize(bouts);

  it("lists one row per distinct region bout on this arm, oldest first, with its workout and segments", () => {
    expect(summary.regionDistinctBouts).toBe(3);
    expect(summary.regionBoutRows!.map((row) => row.boutId)).toEqual(["b1", "b3", "b2"]);
    expect(summary.regionBoutRows![0]).toEqual({
      boutId: "b1", side: "bilateral", sideSource: "recorded", countedSide: "left", recordedSide: { limb: "arm", side: "both", source: "recorded" }, catalogExerciseId: 139, exerciseName: names.get(139), matchedBy: "id",
      sessionId: "s1", sessionLabel: "Week 1 · Day 02 · Pull", performedAt: "2026-10-14T18:00:00.000Z", kind: "standard", segments: [{ id: "b1", reps: 12, loadKg: 20, holdSeconds: null }],
    });
  });

  it("lists the bouts with no arm recorded apart, as many as the count says", () => {
    expect(summary.regionUnknownSideBouts).toBe(1);
    expect(summary.regionUnknownSideRows!.map((row) => [row.boutId, row.side, row.countedSide])).toEqual([["u1", "unknown", "unknown"]]);
  });

  it("keeps the set records of work mapped to no muscle, every one the region-only count holds", () => {
    expect(summary.regionUnclassified.bouts).toBe(2);
    expect(summary.regionUnclassifiedRows!.map((row) => [row.boutId, row.catalogExerciseId, row.side, row.countedSide, row.sessionId])).toEqual([["r1", 144, "bilateral", "left", "s1"], ["r2", 24, "unknown", "unknown", "s3"]]);
    expect(summary.regionUnclassifiedRows![0].segments).toEqual([{ id: "r1", reps: null, loadKg: null, holdSeconds: 30 }]);
  });

  it("reads one arm at a time: the other arm's one-arm bout is in neither list", () => {
    const right = summarize(bouts, "right");
    expect(right.regionBoutRows!.map((row) => row.boutId)).toEqual(["b1", "b3", "b4", "b2"]);
    expect(summary.regionBoutRows!.some((row) => row.boutId === "b4")).toBe(false);
  });

  it("leaves the totals as they were: the rows are an addition, never a recount", () => {
    expect(summary.regionUnclassified).toEqual({ bouts: 2, exercises: [{ name: names.get(24), catalogExerciseId: 24, bouts: 1 }, { name: names.get(144), catalogExerciseId: 144, bouts: 1 }] });
    expect(summary.regionBoutRows!.length).toBe(summary.regionDistinctBouts);
    expect(summary.regionUnknownSideRows!.length).toBe(summary.regionUnknownSideBouts);
  });
});
