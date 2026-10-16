import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { gymAccessProfiles } from "@/lib/equipmentProfile";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { externalContributorIds as ext, forearmActionIds as a, forearmMuscleIds as m } from "@shared/specialization/ids";
import { calendarWeekInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SpecializationGoal, SpecializationRegionData, SpecializationSummary } from "@shared/specialization/types";
import { previewPlannedChange, recommendFor, type RecommendationRequest } from "./recommendations";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { deltoidIds, deltoidRegionData } from "./__fixtures__/deltoidRegion";
import { syntheticForearm } from "./__fixtures__/syntheticForearm";

/**
 * "Exercises for this muscle" (brief §7, design §8): reviewed mappings only, ranked by
 * relevance → equipment → overlap → laterality, exclusions removed, and nothing suggested
 * merely to raise a number.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const names = new Map(exercises.map((exercise) => [exercise.id, exercise.name] as const));
let sequence = 0;
const bout = (catalogExerciseId: number, side: ExposureBout["side"] = "bilateral"): ExposureBout => {
  const id = `r${++sequence}`;
  return { id, mode: "completed", performedAt: "2026-10-14T18:00:00.000Z", sessionId: "s", sessionLabel: "Week 1 · Day 01 · Pull", planWeek: null, dayKey: null, exerciseEntryId: "e", catalogExerciseId, exerciseName: names.get(catalogExerciseId)!, matchedBy: "id", side, sideSource: "recorded", straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 12, loadKg: 20, holdSeconds: null }] };
};

function summary(region: SpecializationRegionData, bouts: ExposureBout[], side: ArmSide = "left", goals: SpecializationGoal[] = []): SpecializationSummary {
  return getSpecializationSummary({ region, bouts, interval: WEEK, side, mode: "completed", goals, catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });
}

function request(over: Partial<RecommendationRequest> & Pick<RecommendationRequest, "target">): RecommendationRequest {
  return { region: syntheticForearm, side: "left", summary: summary(syntheticForearm, []), plannedExercises: [], catalog: exercises, equipmentProfile: null, ...over };
}

const goal = (over: Partial<SpecializationGoal>): SpecializationGoal => ({ id: "g", regionId: "forearm", nodeId: m.flexorCarpiRadialis, actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 10, period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "Europe/London", createdAt: "", updatedAt: "", ...over });

const candidatesOf = (result: ReturnType<typeof recommendFor>) => {
  if (result.kind !== "candidates") throw new Error(`expected candidates, got ${result.kind}`);
  return result;
};

describe("when nothing should be suggested", () => {
  it("asks for the mapping to be reviewed, not for more training, when a muscle has no reviewed mapping", () => {
    for (const nodeId of [m.extensorIndicis, m.flexorPollicisLongus]) {
      const result = recommendFor(request({ target: { nodeId } }));
      expect(result.kind).toBe("mapping_not_reviewed");
      if (result.kind === "mapping_not_reviewed") expect(result.message).toMatch(/^This muscle's exercise mapping is not reviewed yet\./);
    }
  });

  it("offers no more of a kind of work whose target is met, even while another target is not", () => {
    const hold = (): ExposureBout => ({ ...bout(145), segments: [{ id: `h${++sequence}`, reps: null, loadKg: 32, holdSeconds: 30 }] });
    const goals = [
      goal({ id: "holds", nodeId: m.flexorDigitorumSuperficialis, metric: "deliberate_hold_bouts", target: 1 }),
      goal({ id: "dynamic", nodeId: m.flexorDigitorumSuperficialis, metric: "direct_dynamic_bouts", target: 5 }),
    ];
    const met = candidatesOf(recommendFor(request({ target: { nodeId: m.flexorDigitorumSuperficialis }, summary: summary(syntheticForearm, [hold()], "left", goals) })));
    expect([met.candidates, met.skippedAtTarget, met.emptyReason]).toEqual([[], 2, "The exercises that train this answer a target you have already met. Nothing is suggested to add more."]);
    const notMet = candidatesOf(recommendFor(request({ target: { nodeId: m.flexorDigitorumSuperficialis }, summary: summary(syntheticForearm, [], "left", goals) })));
    expect([notMet.candidates.map((candidate) => candidate.name), notMet.skippedAtTarget]).toEqual([["Dead Hang", "Farmer Hold"], 0]);
  });

  it("gives a muscle at or above the athlete's target a neutral note and no exercise", () => {
    const goals = [goal({ target: 2 })];
    const result = recommendFor(request({ target: { nodeId: m.flexorCarpiRadialis }, summary: summary(syntheticForearm, [bout(139), bout(139)], "left", goals) }));
    expect(result).toMatchObject({ kind: "at_target", note: "Flexor carpi radialis already has 2 of your 2 direct dynamic bouts this week. Nothing is suggested to add more." });
  });
});

describe("candidates", () => {
  it("lists reviewed exercises for the muscle with why each fits and every other muscle it loads", () => {
    const result = candidatesOf(recommendFor(request({ target: { nodeId: m.flexorCarpiRadialis }, summary: summary(syntheticForearm, [bout(139)]) })));
    expect(result.candidates.map((candidate) => [candidate.name, candidate.relevance])).toEqual([["Wrist Curl", "direct_dynamic"], ["Wrist Roller", "direct_dynamic"]]);
    const [curl] = result.candidates;
    expect(curl.why).toBe("Direct wrist flexion for flexor carpi radialis; 1 direct dynamic and 0 hold bouts in this window, no target set.");
    expect(curl.alsoLoads.map((item) => [item.nodeId, item.category])).toEqual([
      [m.flexorCarpiUlnaris, "direct_dynamic"],
      [m.palmarisLongus, "contributing_dynamic"],
      [m.flexorDigitorumSuperficialis, "incidental_isometric"],
      [m.flexorDigitorumProfundus, "incidental_isometric"],
    ]);
    // Only the mapping that makes it relevant; the roller's wrist steadying is not a reason to suggest it.
    expect(result.candidates[1].mappingIds).toEqual(["sm-141-fcr-wrist.flexion"]);
  });

  it("names the target gap when there is one", () => {
    const result = candidatesOf(recommendFor(request({ target: { nodeId: m.flexorCarpiRadialis }, summary: summary(syntheticForearm, [bout(139)], "left", [goal({ target: 10 })]) })));
    expect(result.candidates[0].why).toBe("Direct wrist flexion for flexor carpi radialis; 1 of your 10 direct dynamic bouts this week.");
  });

  it("ranks an exercise already in the plan week lower and lists it under already covered", () => {
    const planned = [{ catalogExerciseId: 139, name: "Wrist Curl", days: [{ key: "0-Pull", label: "Day 01 · Pull" }] }];
    const result = candidatesOf(recommendFor(request({ target: { nodeId: m.flexorCarpiRadialis }, plannedExercises: planned })));
    expect(result.candidates.map((candidate) => [candidate.name, candidate.alreadyPlanned])).toEqual([["Wrist Roller", false], ["Wrist Curl", true]]);
    expect(result.candidates[1].why).toContain("Already in this plan week.");
    expect(result.alreadyCoveredBy).toEqual([{ catalogExerciseId: 139, name: "Wrist Curl", days: planned[0].days, category: "direct_dynamic" }]);
  });

  it("says when the evidence cannot split the work between muscles", () => {
    const result = candidatesOf(recommendFor(request({ target: { nodeId: m.extensorCarpiRadialisLongus } })));
    expect(result.candidates.map((candidate) => candidate.name)).toEqual(["Reverse Wrist Curl"]);
    expect(result.candidates[0].why).toContain("The work is shared with extensor carpi radialis brevis; the evidence does not split it between them.");
  });

  it("suggests for a movement only what performs it, not what merely steadies it", () => {
    const result = candidatesOf(recommendFor(request({ target: { actionId: a.wristExtension } })));
    expect(result.candidates.map((candidate) => candidate.name)).toEqual(["Reverse Wrist Curl"]);
    expect(result.candidates[0].why).toBe("Direct wrist extension; no target set.");
  });

  it("ranks direct dynamic above direct holds above contributing, and lists external contributors among what else it loads", () => {
    const result = candidatesOf(recommendFor({ region: deltoidRegionData, target: { nodeId: deltoidIds.anterior }, side: "left", summary: summary(deltoidRegionData, []), plannedExercises: [], catalog: exercises, equipmentProfile: null }));
    expect(result.candidates.map((candidate) => [candidate.name, candidate.relevance])).toEqual([["Barbell Overhead Press", "direct_dynamic"], ["Dumbbell Lateral Raise", "contributing"]]);
    // The press's lateral-head mapping is a draft: not listed. The triceps is an external contributor.
    expect(result.candidates[0].alsoLoads).toEqual([{ nodeId: deltoidIds.triceps, name: "Triceps brachii", role: "external", category: "contributing_dynamic" }]);
    const holds = candidatesOf(recommendFor(request({ target: { nodeId: m.flexorDigitorumSuperficialis } })));
    expect(holds.candidates.map((candidate) => [candidate.name, candidate.relevance])).toEqual([["Dead Hang", "direct_isometric"], ["Farmer Hold", "direct_isometric"]]);
    expect(candidatesOf(recommendFor(request({ target: { nodeId: ext.biceps } }))).candidates.map((candidate) => candidate.relevance)).toEqual(["contributing"]);
  });

  it("puts what the athlete's equipment allows first, and says what the rest needs", () => {
    const base = { region: deltoidRegionData, target: { nodeId: deltoidIds.posterior }, side: "left" as const, summary: summary(deltoidRegionData, []), plannedExercises: [], catalog: exercises };
    expect(candidatesOf(recommendFor({ ...base, equipmentProfile: null })).candidates.map((candidate) => candidate.name)).toEqual(["Bent-Over Rear-Delt Fly", "Single-Arm Cable Rear-Delt Fly"]);
    const cableOnly = candidatesOf(recommendFor({ ...base, equipmentProfile: { gymAccess: "Small gym", availableEquipment: ["Cable"] } }));
    expect(cableOnly.candidates.map((candidate) => [candidate.name, candidate.equipmentAvailable])).toEqual([["Single-Arm Cable Rear-Delt Fly", true], ["Bent-Over Rear-Delt Fly", false]]);
    expect(cableOnly.candidates[1].why).toContain("Needs free weights, which is not in your equipment.");
    expect(candidatesOf(recommendFor({ ...base, equipmentProfile: { gymAccess: "Commercial gym", availableEquipment: gymAccessProfiles["Commercial gym"] } })).candidates.every((candidate) => candidate.equipmentAvailable)).toBe(true);
  });

  it("prefers one-arm work when the selected arm is behind the other", () => {
    const left = summary(deltoidRegionData, [], "left");
    const right = summary(deltoidRegionData, [bout(93, "right"), bout(93, "right")], "right");
    const base = { region: deltoidRegionData, target: { nodeId: deltoidIds.posterior }, plannedExercises: [], catalog: exercises, equipmentProfile: null };
    const behind = candidatesOf(recommendFor({ ...base, side: "left", summary: left, otherSideSummary: right }));
    expect(behind.candidates.map((candidate) => candidate.name)).toEqual(["Single-Arm Cable Rear-Delt Fly", "Bent-Over Rear-Delt Fly"]);
    expect(behind.candidates[0].why).toContain("Done one arm at a time, so the left arm can be trained on its own.");
    const ahead = candidatesOf(recommendFor({ ...base, side: "right", summary: right, otherSideSummary: left }));
    expect(ahead.candidates.map((candidate) => candidate.name)).toEqual(["Bent-Over Rear-Delt Fly", "Single-Arm Cable Rear-Delt Fly"]);
  });

  it("removes exercises and equipment the athlete excluded, and says so when nothing is left", () => {
    const base = { region: deltoidRegionData, target: { nodeId: deltoidIds.posterior }, side: "left" as const, summary: summary(deltoidRegionData, []), plannedExercises: [], catalog: exercises, equipmentProfile: null };
    const one = candidatesOf(recommendFor({ ...base, exclusions: { catalogExerciseIds: [93] } }));
    expect([one.candidates.map((candidate) => candidate.catalogExerciseId), one.excludedCount]).toEqual([[90], 1]);
    const none = candidatesOf(recommendFor({ ...base, exclusions: { catalogExerciseIds: [93], equipment: ["Free weights"] } }));
    expect([none.candidates, none.excludedCount, none.emptyReason]).toEqual([[], 2, "Every reviewed exercise for this is excluded by your settings."]);
  });
});

describe("previewPlannedChange", () => {
  it("shows a swap's effect on planned totals, per affected muscle, before and after", () => {
    const planned = (catalogExerciseId: number, count: number) => Array.from({ length: count }, (_, index) => ({ ...bout(catalogExerciseId), id: `plan/1/0-Pull/${catalogExerciseId}/${index + 1}`, mode: "planned" as const, performedAt: null, planWeek: 1 }));
    const preview = previewPlannedChange({ region: syntheticForearm, before: planned(139, 3), after: planned(140, 3), side: "left", planWeek: 1 });
    expect(preview.nodes.find((node) => node.nodeId === m.flexorCarpiRadialis)).toMatchObject({ before: { directDynamicBouts: 3 }, after: { directDynamicBouts: 0 } });
    expect(preview.nodes.find((node) => node.nodeId === m.extensorCarpiUlnaris)).toMatchObject({ before: { directDynamicBouts: 0 }, after: { directDynamicBouts: 3 } });
    // Grip is incidental in both: unchanged, so not listed.
    expect(preview.nodes.some((node) => node.nodeId === m.flexorDigitorumSuperficialis)).toBe(false);
    expect(preview.regionDistinctBouts).toEqual({ before: 3, after: 3 });
  });

  it("ignores completed work handed to it", () => {
    const preview = previewPlannedChange({ region: syntheticForearm, before: [], after: [bout(139)], side: "left", planWeek: 1 });
    expect(preview.nodes).toEqual([]);
  });
});
