import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { recommendFor, type RecommendationRequest } from "@/lib/specialization/recommendations";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmActionIds as a, forearmMuscleIds as m, externalContributorIds as ext } from "@shared/specialization/ids";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval, localDateKey, planWeekInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SpecializationSummary } from "@shared/specialization/types";
import { boutsByDay, coveredWords, missingActionNote, regionBoutRowsOnDay } from "./model";

/**
 * What the exercises for a muscle say beyond each suggestion (pre-release review, wave 1
 * open items): a main action of the muscle with no direct work that no suggestion covers is
 * said plainly, with why; the recommender's "logged" entry in "Already covered by" is words,
 * never a day; and a bar of bouts per day opens exactly the bouts it counts. Real forearm
 * content and the real calculator.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const ZONE = "Europe/London";
const names = new Map(exercises.map((exercise) => [exercise.id, exercise.name] as const));
let sequence = 0;
const bout = (catalogExerciseId: number, side: ExposureBout["side"] = "bilateral", performedAt = "2026-10-14T18:00:00.000Z"): ExposureBout => {
  const id = `t${++sequence}`;
  return { id, mode: "completed", performedAt, sessionId: `s-${performedAt.slice(0, 10)}`, sessionLabel: "Week 1 · Day 01 · Pull", planWeek: null, dayKey: null, exerciseEntryId: `e${catalogExerciseId}`, catalogExerciseId, exerciseName: names.get(catalogExerciseId) ?? `#${catalogExerciseId}`, matchedBy: "id", side, sideSource: "recorded", straps: "no", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 12, loadKg: 20, holdSeconds: null }] };
};
const summary = (bouts: ExposureBout[], side: ArmSide = "right"): SpecializationSummary =>
  getSpecializationSummary({ region: forearmRegionData, bouts, interval: calendarWeekInterval(NOW, ZONE), side, mode: "completed", goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });
const plannedSummary = (bouts: ExposureBout[]): SpecializationSummary =>
  getSpecializationSummary({ region: forearmRegionData, bouts: bouts.map((item) => ({ ...item, mode: "planned", performedAt: null, sessionId: null, planWeek: 1, dayKey: "0-Pull", sideSource: "structural" })), interval: planWeekInterval(1), side: "right", mode: "planned", goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });

function candidatesFor(nodeId: string, over: Partial<RecommendationRequest>) {
  const result = recommendFor({ region: forearmRegionData, target: { nodeId }, side: "right", summary: summary([]), plannedExercises: [], catalog: exercises, equipmentProfile: null, ...over });
  if (result.kind !== "candidates") throw new Error(`expected candidates, got ${result.kind}`);
  return result;
}

const BARBELL_CURL = 121;
const WRIST_CURL = 139;
const LEVER_ULNAR_DEVIATION = 408;

describe("a main action with no direct work that no suggestion covers (brief §7: explain a missing action)", () => {
  it("biceps after palms-up curls: supination has no direct work and no reviewed exercise trains it directly, said once and plainly", () => {
    expect(names.get(BARBELL_CURL)).toBe("Barbell Curl");
    const result = candidatesFor(ext.biceps, { summary: summary([bout(BARBELL_CURL), bout(BARBELL_CURL)]) });
    expect(result.missingActions).toEqual([a.supination]);
    // Lever Supination is the only exercise that works it, and only as a helper: no candidate covers it.
    expect(result.candidates.some((candidate) => candidate.missingActions?.includes(a.supination))).toBe(false);
    expect(missingActionNote({ data: forearmRegionData, nodeId: ext.biceps, result, mode: "completed" }))
      .toBe("Supination, one of this muscle's main actions, has no direct work in this window. No reviewed exercise trains it directly yet, so none is suggested for it.");
  });

  it("in the plan, says it is not planned", () => {
    const result = candidatesFor(ext.biceps, { summary: plannedSummary([bout(BARBELL_CURL)]) });
    expect(missingActionNote({ data: forearmRegionData, nodeId: ext.biceps, result, mode: "planned" }))
      .toBe("Supination, one of this muscle's main actions, has no direct work planned in this week. No reviewed exercise trains it directly yet, so none is suggested for it.");
  });

  it("says nothing when a suggestion covers the missing action: its own why already leads with it", () => {
    const result = candidatesFor(m.flexorCarpiUlnaris, { summary: summary([bout(WRIST_CURL, "right"), bout(WRIST_CURL, "right")]) });
    expect(result.missingActions).toEqual([a.ulnarDeviation]);
    expect(result.candidates[0].missingActions).toEqual([a.ulnarDeviation]);
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result, mode: "completed" })).toBeNull();
  });

  it("says nothing when no main action is missing", () => {
    const result = candidatesFor(m.flexorCarpiUlnaris, {});
    expect(result.missingActions).toEqual([]);
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result, mode: "completed" })).toBeNull();
  });

  it("when the athlete left out the exercise that trains it, says so rather than that none exists", () => {
    const result = candidatesFor(m.flexorCarpiUlnaris, { summary: summary([bout(WRIST_CURL, "right")]), exclusions: { catalogExerciseIds: [LEVER_ULNAR_DEVIATION] } });
    expect(result.missingActions).toEqual([a.ulnarDeviation]);
    expect(result.candidates.some((candidate) => candidate.missingActions?.length)).toBe(false);
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result, mode: "completed", excludedExerciseIds: [LEVER_ULNAR_DEVIATION] }))
      .toBe("Ulnar deviation, one of this muscle's main actions, has no direct work in this window. The exercises that train it directly are left out by your choices under What is suggested.");
  });

  it("when the exercises that train it answer a target already met, says that", () => {
    const note = missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result: { missingActions: [a.ulnarDeviation], candidates: [], excludedCount: 0, skippedAtTarget: 2 }, mode: "completed" });
    expect(note).toBe("Ulnar deviation, one of this muscle's main actions, has no direct work in this window. The exercises that train it directly answer a target you have already met, so none is suggested.");
  });

  it("never states a shortfall or a target it was not given", () => {
    const result = candidatesFor(ext.biceps, { summary: summary([bout(BARBELL_CURL)]) });
    const note = missingActionNote({ data: forearmRegionData, nodeId: ext.biceps, result, mode: "completed" })!;
    expect(note).not.toMatch(/behind|lacking|deficit|should|need|target/i);
  });
});

describe("Already covered by, in words", () => {
  it("names the plan days, and says logged work as the phrase it is, never as a day", () => {
    expect(coveredWords({ name: "Wrist Curl", days: [{ key: "0-Pull", label: "Day 01 · Pull" }] })).toBe("Wrist Curl: planned on Day 01 · Pull");
    expect(coveredWords({ name: "Wrist Curl", days: [{ key: "0-Pull", label: "Day 01 · Pull" }, { key: "2-Push", label: "Day 03 · Push" }] })).toBe("Wrist Curl: planned on Day 01 · Pull and Day 03 · Push");
    expect(coveredWords({ name: "Wrist Curl", days: [{ key: "logged", label: "4 sets logged in this window" }] })).toBe("Wrist Curl: 4 sets logged in this window");
    expect(coveredWords({ name: "Wrist Curl", days: [{ key: "0-Pull", label: "Day 01 · Pull" }, { key: "logged", label: "2 sets logged in this window, 1 with no arm recorded" }] }))
      .toBe("Wrist Curl: planned on Day 01 · Pull; 2 sets logged in this window, 1 with no arm recorded");
  });

  it("reads the recommender's own entries that way", () => {
    const result = candidatesFor(m.flexorCarpiUlnaris, {
      summary: summary([bout(WRIST_CURL, "right"), bout(WRIST_CURL, "unknown")]),
      plannedExercises: [{ catalogExerciseId: WRIST_CURL, name: "Wrist Curl", days: [{ key: "0-Pull", label: "Day 01 · Pull" }] }],
    });
    expect(result.alreadyCoveredBy.map(coveredWords)).toEqual(["Wrist Curl: planned on Day 01 · Pull; 2 sets logged in this window, 1 with no arm recorded"]);
  });
});

describe("a bar of bouts per day opens the bouts it counts", () => {
  it("lists, for each local day, exactly the distinct bouts on this arm the bar counts", () => {
    const tuesday = "2026-10-13T17:00:00.000Z";
    const thursday = "2026-10-15T07:30:00.000Z";
    const result = summary([bout(WRIST_CURL, "right", tuesday), bout(132, "bilateral", tuesday), bout(140, "left", tuesday), bout(WRIST_CURL, "unknown", thursday), bout(132, "bilateral", thursday)]);
    const dayKeyOf = (iso: string) => localDateKey(iso, ZONE);
    const counts = boutsByDay(result, forearmRegionData, dayKeyOf);
    expect(Array.from(counts.entries()).sort()).toEqual([["2026-10-13", 2], ["2026-10-15", 1]]);
    for (const [key, count] of Array.from(counts.entries())) expect(regionBoutRowsOnDay(result, key, dayKeyOf)).toHaveLength(count);
    // The left-arm set and the set with no arm recorded are in neither bar.
    expect(regionBoutRowsOnDay(result, "2026-10-13", dayKeyOf).map((row) => row.exerciseName).sort()).toEqual(["Hammer Curl", "Wrist Curl"]);
    expect(regionBoutRowsOnDay(result, "2026-10-14", dayKeyOf)).toEqual([]);
  });
});
