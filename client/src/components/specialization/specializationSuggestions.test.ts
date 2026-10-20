import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { recommendFor, type RecommendationRequest } from "@/lib/specialization/recommendations";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmActionIds as a, forearmMuscleIds as m, externalContributorIds as ext } from "@shared/specialization/regions/forearm/ids";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval, localDateKey, planWeekInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SpecializationGoal, SpecializationSummary } from "@shared/specialization/types";
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
const bout = (catalogExerciseId: number, side: "left" | "right" | "bilateral" | "unknown" = "bilateral", performedAt = "2026-10-14T18:00:00.000Z"): ExposureBout => {
  const id = `t${++sequence}`;
  // The arm as the set recorded it (lane 0b: a bout carries the raw side; "bilateral" is Both, "unknown" none).
  const armSide: ExposureBout["armSide"] = side === "unknown" ? null : { side: side === "bilateral" ? "both" : side, source: "recorded" };
  return { id, mode: "completed", performedAt, sessionId: `s-${performedAt.slice(0, 10)}`, sessionLabel: "Week 1 · Day 01 · Pull", planWeek: null, dayKey: null, exerciseEntryId: `e${catalogExerciseId}`, catalogExerciseId, exerciseName: names.get(catalogExerciseId) ?? `#${catalogExerciseId}`, matchedBy: "id", armSide, legSide: null, straps: "no", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 12, loadKg: 20, holdSeconds: null }] };
};
const summary = (bouts: ExposureBout[], side: ArmSide = "right", goals: SpecializationGoal[] = []): SpecializationSummary =>
  getSpecializationSummary({ region: forearmRegionData, bouts, interval: calendarWeekInterval(NOW, ZONE), side, mode: "completed", goals, catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });
const plannedSummary = (bouts: ExposureBout[]): SpecializationSummary =>
  getSpecializationSummary({ region: forearmRegionData, bouts: bouts.map((item) => ({ ...item, mode: "planned", performedAt: null, sessionId: null, planWeek: 1, dayKey: "0-Pull" })), interval: planWeekInterval(1), side: "right", mode: "planned", goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });

function candidatesFor(nodeId: string, over: Partial<RecommendationRequest>) {
  const result = recommendFor({ region: forearmRegionData, target: { nodeId }, side: "right", summary: summary([]), plannedExercises: [], catalog: exercises, equipmentProfile: null, ...over });
  if (result.kind !== "candidates") throw new Error(`expected candidates, got ${result.kind}`);
  return result;
}

const BARBELL_CURL = 121;
const WRIST_CURL = 139;
const LEVER_ULNAR_DEVIATION = 408;
const equipmentOf = (catalogExerciseId: number) => exercises.find((exercise) => exercise.id === catalogExerciseId)?.equipment ?? null;
const goal = (id: string, nodeId: string, metric: SpecializationGoal["metric"], target: number): SpecializationGoal => ({
  id, regionId: "forearm", nodeId, actionId: null, side: "right", metric, target, period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: ZONE, createdAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z",
});

describe("a main action with no direct work that no suggestion covers (brief §7: explain a missing action)", () => {
  it("biceps after palms-up curls: supination has no direct work and no reviewed exercise trains it directly, said once and plainly", () => {
    expect(names.get(BARBELL_CURL)).toBe("Barbell Curl");
    const result = candidatesFor(ext.biceps, { summary: summary([bout(BARBELL_CURL), bout(BARBELL_CURL)]) });
    expect(result.missingActions).toEqual([a.supination]);
    // Lever Supination is the only exercise that works it, and only as a helper: no candidate covers it.
    expect(result.candidates.some((candidate) => candidate.missingActions?.includes(a.supination))).toBe(false);
    expect(missingActionNote({ data: forearmRegionData, nodeId: ext.biceps, result, mode: "completed", equipmentOf }))
      .toBe("Supination, a main action of this muscle, has no direct work in this window, and no reviewed exercise trains it directly yet.");
  });

  it("in the plan, says it is not planned", () => {
    const result = candidatesFor(ext.biceps, { summary: plannedSummary([bout(BARBELL_CURL)]) });
    expect(missingActionNote({ data: forearmRegionData, nodeId: ext.biceps, result, mode: "planned" }))
      .toBe("Supination, a main action of this muscle, has no direct work planned in this week, and no reviewed exercise trains it directly yet.");
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
    const exclusions = { catalogExerciseIds: [LEVER_ULNAR_DEVIATION], equipment: [] };
    const result = candidatesFor(m.flexorCarpiUlnaris, { summary: summary([bout(WRIST_CURL, "right")]), exclusions });
    expect(result.missingActions).toEqual([a.ulnarDeviation]);
    expect(result.candidates.some((candidate) => candidate.missingActions?.length)).toBe(false);
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result, mode: "completed", exclusions, equipmentOf }))
      .toBe("Ulnar deviation, a main action of this muscle, has no direct work in this window, and the exercises that train it directly are left out by your choices under What is suggested.");
  });

  it("tells an equipment left out apart, as the recommender does, from the catalog", () => {
    expect(equipmentOf(LEVER_ULNAR_DEVIATION)).toBe("Dumbbells");
    const exclusions = { catalogExerciseIds: [], equipment: ["Dumbbells"] };
    const result = candidatesFor(m.flexorCarpiUlnaris, { summary: summary([bout(WRIST_CURL, "right")]), exclusions });
    expect(result.missingActions).toEqual([a.ulnarDeviation]);
    expect(result.excludedCount).toBeGreaterThan(0);
    const note = "Ulnar deviation, a main action of this muscle, has no direct work in this window, and the exercises that train it directly are left out by your choices under What is suggested.";
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result, mode: "completed", exclusions, equipmentOf })).toBe(note);
    // Without the catalog, nothing was skipped at a target, so the counts still say it was left out.
    expect(result.skippedAtTarget).toBe(0);
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result, mode: "completed", exclusions })).toBe(note);
    // Only when neither the catalog nor the counts can tell does it give both reasons.
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result: { ...result, skippedAtTarget: 1 }, mode: "completed", exclusions }))
      .toBe("Ulnar deviation, a main action of this muscle, has no direct work in this window, and the exercises that train it directly are left out by your choices or answer a target you have already met.");
  });

  it("when the exercises that train it answer a target already met, says that, with the target nothing can fill said apart", () => {
    // FCR: 2 wrist curls meet a dynamic target of 2; a hold target of 3 stays open, and no reviewed FCR exercise is a hold.
    const goals = [goal("dyn", m.flexorCarpiRadialis, "direct_dynamic_bouts", 2), goal("hold", m.flexorCarpiRadialis, "deliberate_hold_bouts", 3)];
    const result = candidatesFor(m.flexorCarpiRadialis, { summary: summary([bout(WRIST_CURL), bout(WRIST_CURL)], "right", goals) });
    expect(result.missingActions).toEqual([a.radialDeviation]);
    // Lever Radial Deviation, the one exercise that trains it directly, is dynamic work for a met target: skipped.
    expect(result.skippedAtTarget).toBeGreaterThan(0);
    expect(result.candidates.map((candidate) => candidate.name)).not.toContain("Lever Radial Deviation");
    expect(missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiRadialis, result, mode: "completed", exclusions: { catalogExerciseIds: [], equipment: [] }, equipmentOf }))
      .toBe("Radial deviation, a main action of this muscle, has no direct work in this window, and the exercises that train it directly answer a target you have already met, so none is suggested.");
    expect(result.targetNote).toBe("No reviewed exercise for flexor carpi radialis counts toward your target of 3 deliberate hold bouts this week.");
  });

  it("with two actions for two reasons, names each with its own reason in one sentence", () => {
    const note = missingActionNote({ data: forearmRegionData, nodeId: m.flexorCarpiUlnaris, result: { missingActions: [a.ulnarDeviation, a.supination], candidates: [], excludedCount: 1, skippedAtTarget: 0 }, mode: "completed", exclusions: { catalogExerciseIds: [LEVER_ULNAR_DEVIATION] }, equipmentOf });
    expect(note).toBe("Ulnar deviation and supination, main actions of this muscle, have no direct work in this window; the exercises that train ulnar deviation directly are left out by your choices under What is suggested; no reviewed exercise trains supination directly yet.");
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
    // A one-arm exercise: a two-handed one with no arm recorded counts on both arms (as the adapter always read it), so only a one-arm set lacks an arm.
    const ONE_ARM_WRIST_CURL = 410;
    const result = candidatesFor(m.flexorCarpiUlnaris, {
      summary: summary([bout(ONE_ARM_WRIST_CURL, "right"), bout(ONE_ARM_WRIST_CURL, "unknown")]),
      plannedExercises: [{ catalogExerciseId: ONE_ARM_WRIST_CURL, name: "One-Arm Dumbbell Wrist Curl", days: [{ key: "0-Pull", label: "Day 01 · Pull" }] }],
    });
    expect(result.alreadyCoveredBy.map(coveredWords)).toEqual(["One-Arm Dumbbell Wrist Curl: planned on Day 01 · Pull; 2 sets logged in this window, 1 with no arm recorded"]);
  });
});

describe("a bar of bouts per day opens the bouts it counts", () => {
  it("lists, for each local day, exactly the distinct bouts on this arm the bar counts", () => {
    const tuesday = "2026-10-13T17:00:00.000Z";
    const thursday = "2026-10-15T07:30:00.000Z";
    // The set with no arm recorded is a one-arm wrist curl (410): a two-handed one with no arm recorded counts on both arms.
    const result = summary([bout(WRIST_CURL, "right", tuesday), bout(132, "bilateral", tuesday), bout(140, "left", tuesday), bout(410, "unknown", thursday), bout(132, "bilateral", thursday)]);
    const dayKeyOf = (iso: string) => localDateKey(iso, ZONE);
    const counts = boutsByDay(result, forearmRegionData, dayKeyOf);
    expect(Array.from(counts.entries()).sort()).toEqual([["2026-10-13", 2], ["2026-10-15", 1]]);
    for (const [key, count] of Array.from(counts.entries())) expect(regionBoutRowsOnDay(result, key, dayKeyOf)).toHaveLength(count);
    // The left-arm set and the set with no arm recorded are in neither bar.
    expect(regionBoutRowsOnDay(result, "2026-10-13", dayKeyOf).map((row) => row.exerciseName).sort()).toEqual(["Hammer Curl", "Wrist Curl"]);
    expect(regionBoutRowsOnDay(result, "2026-10-14", dayKeyOf)).toEqual([]);
  });
});
