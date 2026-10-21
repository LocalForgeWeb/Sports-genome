import { describe, expect, it } from "vitest";
import { finalizeSession, removeDeviceWorkoutSession, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { applySwap } from "@/lib/workoutSwap";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { validateGoal } from "@shared/specialization/goals";
import { externalContributorIds as ext, forearmGroupIds as g, forearmMuscleIds as m } from "@shared/specialization/ids";
import { calendarWeekInterval, customInterval, planWeekInterval, rolling7dInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SpecializationGoal, SpecializationSummary, SummaryInterval } from "@shared/specialization/types";
import { boutsFromSessions, excludedRecordsFromSessions } from "./bouts";
import { boutsFromPlan } from "./planBouts";
import { previewPlannedChange } from "./recommendations";
import { sourceRevision } from "./revision";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { exercise, finished, syntheticForearm, workSet, type AtlasSet } from "./__fixtures__/syntheticForearm";

/**
 * The brief's regression table (§11) and worked accounting fixture (§5), run end to end:
 * logged sessions → device adapters → the calculator. The region is the synthetic one in
 * __fixtures__ (test mappings, not reviewed content); the rules under test are the
 * calculator's and the adapters'.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const TZ = "Europe/London";
const WEEK = calendarWeekInterval(NOW, TZ); // Mon 12 – Sun 18 Oct
const WED = "2026-10-14T18:00:00.000Z";
const deps = { catalog: exercises, variants: syntheticForearm.variants, fallbackUnit: "kg" as const };
const catalogMusclesFor = catalogMusclesLookup(exercises);

const boutsOf = (sessions: readonly DeviceWorkoutSession[]) => [...boutsFromSessions(sessions, deps), ...excludedRecordsFromSessions(sessions, deps)];

function summaryOf(sessions: readonly DeviceWorkoutSession[], side: ArmSide, over: { interval?: SummaryInterval; goals?: SpecializationGoal[]; now?: string; extra?: ExposureBout[] } = {}): SpecializationSummary {
  return getSpecializationSummary({
    region: syntheticForearm,
    bouts: [...boutsOf(sessions), ...(over.extra ?? [])],
    interval: over.interval ?? WEEK,
    side,
    mode: "completed",
    goals: over.goals ?? [],
    catalogMusclesFor,
    sourceRevision: sourceRevision(sessions),
    planRevision: null,
    now: over.now ?? NOW,
  });
}

const row = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;
const touched = (summary: SpecializationSummary, nodeId: string) => {
  const node = row(summary, nodeId);
  return node.directDynamicBouts + node.contributingDynamicBouts + node.deliberateHoldBouts + node.incidentalBouts + node.mixedBouts + node.unknownBouts;
};
const sets = (count: number, over: Partial<AtlasSet> = {}) => Array.from({ length: count }, () => workSet(over));
const one = (exercises: Parameters<typeof finished>[2], over: Partial<DeviceWorkoutSession> = {}) => [finished("s1", WED, exercises, over)];

describe("brief §11: sides", () => {
  it("Bilateral 3 sets → 3 per side, not 6 per side", () => {
    const sessions = one([exercise("e1", "Wrist Curl", 139, sets(3, { side: "both" })), exercise("e2", "Reverse Curl", 135, sets(3))]);
    for (const side of ["left", "right"] as const) {
      const summary = summaryOf(sessions, side);
      expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(3);
      // A barbell reverse curl is two-handed by definition; no side needs recording.
      expect(row(summary, m.brachioradialis).directDynamicBouts).toBe(3);
      expect(summary.regionDistinctBouts).toBe(6);
    }
  });

  it("Left-only 3 sets → right remains unchanged", () => {
    const base = finished("s1", WED, [exercise("e1", "Wrist Curl", 139, sets(2, { side: "both" }))]);
    const leftOnly = finished("s2", "2026-10-15T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, sets(3, { side: "left" }))]);
    expect(row(summaryOf([base], "right"), m.flexorCarpiRadialis).directDynamicBouts).toBe(2);
    expect(row(summaryOf([base, leftOnly], "right"), m.flexorCarpiRadialis).directDynamicBouts).toBe(2);
    expect(row(summaryOf([base, leftOnly], "left"), m.flexorCarpiRadialis).directDynamicBouts).toBe(5);
  });

  it("Unknown historical side → unassigned bucket, not guessed", () => {
    // Logged before catalog ids and sides existed: matched by name, side unknown.
    const sessions = one([exercise("e1", "Wrist Curl", undefined, sets(3))]);
    for (const side of ["left", "right"] as const) {
      const summary = summaryOf(sessions, side);
      const fcr = row(summary, m.flexorCarpiRadialis);
      expect(fcr.directDynamicBouts).toBe(0);
      expect(fcr.unknownSide.directDynamicBouts).toBe(3);
      expect(summary.regionDistinctBouts).toBe(0);
      expect(summary.regionUnknownSideBouts).toBe(3);
      expect(fcr.contributions[0].notes).toContain("Matched by name");
      expect(summary.completeness).toMatchObject({ boutsNameMatched: 3, boutsUnknownSide: 3 });
    }
  });

  // Final review F-accounting-2: "never silently duplicated to both arms" holds for work a draft mapping matched, too.
  it("Unknown side on a mapping still under review → kept apart, not under review on both arms", () => {
    // Plate pinch is one-handed and only draft-mapped to FPL: with no arm tapped, its sets have no arm.
    const sessions = one([exercise("e1", "Plate Pinch", 142, sets(2, { holdSeconds: "40" }))]);
    for (const side of ["left", "right"] as const) {
      const fpl = row(summaryOf(sessions, side), m.flexorPollicisLongus);
      expect(fpl.pendingReviewBouts, side).toBe(0);
      expect(fpl.unknownSide, side).toMatchObject({ bouts: 0, pendingReviewBouts: 2 });
      // Still in the ledger, labelled with its missing arm, and counted nowhere.
      expect(fpl.notCounted!.map((item) => [item.side, item.notes]), side).toEqual(Array(2).fill(["unknown", ["Mapping pending review"]]));
      expect(touched(summaryOf(sessions, side), m.flexorPollicisLongus)).toBe(0);
    }
    // With the arm recorded, the same sets are that arm's under-review work, and only that arm's.
    const leftOnly = one([exercise("e1", "Plate Pinch", 142, sets(2, { side: "left", holdSeconds: "40" }))]);
    expect(row(summaryOf(leftOnly, "left"), m.flexorPollicisLongus)).toMatchObject({ pendingReviewBouts: 2, unknownSide: { pendingReviewBouts: 0 } });
    expect(row(summaryOf(leftOnly, "right"), m.flexorPollicisLongus)).toMatchObject({ pendingReviewBouts: 0, unknownSide: { pendingReviewBouts: 0 }, notCounted: [] });
  });
});

describe("brief §11: bouts, segments and categories", () => {
  it("Three-segment drop set → 1 distinct bout, segments retained", () => {
    const drop = workSet({ id: "d1", side: "both", type: "drop", weight: "30", reps: "8", stages: [{ id: "d1-stage-1", weight: "30", reps: "8", unit: "kg" }, { id: "d1-stage-2", weight: "22", reps: "6", unit: "kg" }, { id: "d1-stage-3", weight: "15", reps: "10", unit: "kg" }] });
    const summary = summaryOf(one([exercise("e1", "Wrist Curl", 139, [drop])]), "left");
    const fcr = row(summary, m.flexorCarpiRadialis);
    expect(fcr.directDynamicBouts).toBe(1);
    expect(fcr.contributions[0]).toMatchObject({ kind: "drop", reps: 24 });
    expect(fcr.contributions[0].segments.map((segment) => [segment.loadKg, segment.reps])).toEqual([[30, 8], [22, 6], [15, 10]]);
    expect(summary.regionDistinctBouts).toBe(1);
  });

  it("Two actions in one bout → no duplicate muscle bout count", () => {
    const summary = summaryOf(one([exercise("e1", "Wrist Roller", 141, sets(1))]), "left");
    expect(touched(summary, m.flexorCarpiRadialis)).toBe(1);
    expect(row(summary, m.flexorCarpiRadialis).mixedBouts).toBe(1);
    expect(row(summary, m.flexorCarpiRadialis).contributions[0].parts).toHaveLength(2);
  });

  it("Same bout affects FCR and FCU → both show exposure; regional bout total remains one", () => {
    const summary = summaryOf(one([exercise("e1", "Wrist Curl", 139, sets(1, { side: "both" }))]), "left");
    expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(1);
    expect(row(summary, m.flexorCarpiUlnaris).directDynamicBouts).toBe(1);
    expect(summary.regionDistinctBouts).toBe(1);
  });

  it("Deliberate 30-second hold → hold duration recorded without dynamic-set conversion", () => {
    const summary = summaryOf(one([exercise("e1", "Farmer Hold", 145, sets(1, { side: "both", reps: "", holdSeconds: "30" }))]), "left");
    const fds = row(summary, m.flexorDigitorumSuperficialis);
    expect([fds.deliberateHoldBouts, fds.deliberateHoldSeconds, fds.directDynamicBouts, fds.contributingDynamicBouts, fds.directDynamicReps]).toEqual([1, 30, 0, 0, 0]);
    expect(fds.contributions[0]).toMatchObject({ category: "deliberate_isometric", holdSeconds: 30, reps: 0 });
  });

  it("Reverse curl → dynamic elbow flexion and wrist stabilization separately represented", () => {
    const summary = summaryOf(one([exercise("e1", "Reverse Curl", 135, sets(1))]), "left");
    expect(row(summary, m.brachioradialis).directDynamicBouts).toBe(1);
    for (const extensor of [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris]) {
      expect(row(summary, extensor).incidentalBouts).toBe(1);
      expect(row(summary, extensor).directDynamicBouts).toBe(0);
    }
    expect(row(summary, ext.biceps).contributingDynamicBouts).toBe(1);
    expect(summary.regionDistinctBouts).toBe(1);
  });
});

describe("brief §11: straps", () => {
  it("Row with straps → applicable reviewed grip mapping; no blanket full finger-flexor credit", () => {
    const strapped = summaryOf(one([exercise("e1", "Barbell Bent-Over Row", 43, sets(3), { straps: "yes" })]), "left");
    for (const flexor of [m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus]) {
      expect(touched(strapped, flexor)).toBe(0);
      expect(row(strapped, flexor).notCounted!.map((item) => item.notes[0])).toEqual(Array(3).fill("Strapped: grip not counted"));
    }
    // Without straps the row's grip is incidental holding, never direct finger-flexor work.
    const bare = summaryOf(one([exercise("e1", "Barbell Bent-Over Row", 43, sets(3), { straps: "no" })]), "left");
    expect(row(bare, m.flexorDigitorumSuperficialis)).toMatchObject({ incidentalBouts: 3, directDynamicBouts: 0, deliberateHoldBouts: 0 });
  });

  it("Unknown straps → uncertainty preserved", () => {
    const summary = summaryOf(one([exercise("e1", "Barbell Bent-Over Row", 43, sets(2))]), "left");
    const fds = row(summary, m.flexorDigitorumSuperficialis);
    expect(fds.incidentalBouts).toBe(2);
    expect(fds.contributions.every((item) => item.notes.includes("Straps not recorded"))).toBe(true);
  });
});

describe("brief §11: what is not node credit", () => {
  it("Generic forearm mapping → no automatic detailed-muscle credit", () => {
    const summary = summaryOf(one([exercise("e1", "Towel Dead Hang", 144, sets(2)), exercise("e2", "Rope Climb", 80, sets(1))]), "left");
    expect(summary.regionUnclassified.bouts).toBe(2);
    expect(row(summary, g.anterior).incidentalBouts).toBe(1);
    for (const node of syntheticForearm.nodes.filter((item) => item.role === "target")) expect(touched(summary, node.id)).toBe(0);
  });

  it("Warm-up/skipped set → not in completed work totals", () => {
    const sessions = one([exercise("e1", "Wrist Curl", 139, [workSet({ side: "both", warmup: true }), workSet({ side: "both", completed: false, skipped: true }), ...sets(2, { side: "both" })])]);
    const summary = summaryOf(sessions, "left");
    expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(2);
    expect(summary.completeness.boutsExcluded).toEqual({ warmup: 1, notCompleted: 1 });
  });

  it("Mapping unavailable → hatched/unknown, not untrained", () => {
    const summary = summaryOf(one([exercise("e1", "Wrist Curl", 139, sets(2, { side: "both" }))]), "left");
    // No reviewed mapping can credit EI at all: unknown. ECU is mapped and simply had no work: zero.
    expect([row(summary, m.extensorIndicis).mappingCoverage, touched(summary, m.extensorIndicis)]).toEqual(["none", 0]);
    expect([row(summary, m.extensorCarpiUlnaris).mappingCoverage, touched(summary, m.extensorCarpiUlnaris)]).toEqual(["reviewed", 0]);
  });

  it("Mapping revision → one active generation; no double-counting", () => {
    // The fixture keeps an older mapping generation for the wrist curl beside the current one.
    expect(row(summaryOf(one([exercise("e1", "Wrist Curl", 139, sets(3, { side: "both" }))]), "left"), m.flexorCarpiRadialis).directDynamicBouts).toBe(3);
  });
});

describe("brief §11: changes to the records and the plan", () => {
  it("Mid-workout swap → completed original sets preserved; the rest is the new exercise's", () => {
    const live: DeviceWorkoutSession = {
      ...finished("s1", WED, [exercise("e1", "Wrist Curl", 139, [...sets(2, { side: "both" }), workSet({ completed: false, weight: "", reps: "" }), workSet({ completed: false, weight: "", reps: "" })])]),
      status: "active",
      completedAt: undefined,
    };
    const { session: swapped } = applySwap(live, "e1", { name: "Reverse Wrist Curl", id: 140 }, { swapId: "sw1", newExerciseId: "e2", at: "2026-10-14T17:30:00.000Z" }, exercises);
    const replacement = swapped.exercises.find((item) => item.id === "e2")!;
    replacement.sets[0] = { ...workSet({ side: "both" }) };
    const { session: done } = finalizeSession(swapped, WED);
    const summary = summaryOf([done], "left");
    expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(2);
    expect(row(summary, m.flexorCarpiRadialis).contributions.every((item) => item.exerciseName === "Wrist Curl")).toBe(true);
    expect(row(summary, m.extensorCarpiUlnaris).directDynamicBouts).toBe(1);
    expect(row(summary, m.extensorCarpiUlnaris).contributions[0].exerciseName).toBe("Reverse Wrist Curl");
    expect(summary.regionDistinctBouts).toBe(3);
  });

  it("Add exercise preview → planned summary changes; completed summary does not", () => {
    const slots = buildDaySlots(["Pull"]);
    const key = slots[0].key;
    const byId = (id: number) => exercises.find((item) => item.id === id)!;
    const before: WeeklyDayStore = { ...emptyDayStore(), plan: { [key]: [byId(139)] }, prescriptions: { [key]: { 139: "3 × 12" } } };
    const after: WeeklyDayStore = { ...before, plan: { [key]: [byId(139), byId(140)] }, prescriptions: { [key]: { 139: "3 × 12", 140: "3 × 15" } } };
    const planned = (store: WeeklyDayStore) => boutsFromPlan({ week: 1, slots, store, variants: syntheticForearm.variants });

    const preview = previewPlannedChange({ region: syntheticForearm, before: planned(before), after: planned(after), side: "left", planWeek: 1 });
    expect(preview.regionDistinctBouts).toEqual({ before: 3, after: 6 });
    expect(preview.nodes.map((node) => node.nodeId)).toEqual([m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus, m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris]);
    expect(preview.nodes.find((node) => node.nodeId === m.extensorCarpiUlnaris)).toMatchObject({ before: { directDynamicBouts: 0 }, after: { directDynamicBouts: 3 } });
    expect(preview.nodes.find((node) => node.nodeId === m.flexorDigitorumSuperficialis)).toMatchObject({ before: { incidentalBouts: 3 }, after: { incidentalBouts: 6 } });

    const sessions = one([exercise("e1", "Wrist Curl", 139, sets(2, { side: "both" }))]);
    expect(summaryOf(sessions, "left", { extra: planned(after) })).toEqual(summaryOf(sessions, "left", { extra: planned(before) }));
  });

  it("Edit/delete old record → relevant historical total recalculated", () => {
    const lastWeek = customInterval("2026-10-05", "2026-10-11", TZ);
    const old = finished("old", "2026-10-07T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, sets(3, { side: "both" }))]);
    const recent = finished("recent", WED, [exercise("e1", "Wrist Curl", 139, sets(2, { side: "both" }))]);
    const before = summaryOf([old, recent], "left", { interval: lastWeek });
    expect(row(before, m.flexorCarpiRadialis).directDynamicBouts).toBe(3);

    const edited = { ...old, exercises: [{ ...old.exercises[0], sets: [old.exercises[0].sets[0], { ...old.exercises[0].sets[1], warmup: true } as AtlasSet, old.exercises[0].sets[2]] }] };
    const afterEdit = summaryOf([edited, recent], "left", { interval: lastWeek });
    expect(row(afterEdit, m.flexorCarpiRadialis).directDynamicBouts).toBe(2);
    expect(afterEdit.sourceRevision).not.toBe(before.sourceRevision);

    const afterDelete = summaryOf(removeDeviceWorkoutSession([old, recent], "old"), "left", { interval: lastWeek });
    expect(row(afterDelete, m.flexorCarpiRadialis).directDynamicBouts).toBe(0);
    // This week's total is untouched by either change.
    expect(row(summaryOf(removeDeviceWorkoutSession([old, recent], "old"), "left"), m.flexorCarpiRadialis).directDynamicBouts).toBe(2);
  });
});

describe("brief §11: targets", () => {
  const goal = (over: Partial<SpecializationGoal> = {}): SpecializationGoal => ({ id: "g20", regionId: "forearm", nodeId: m.flexorCarpiRadialis, actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 20, period: "calendar_week", startsOn: "2026-10-12", endsOn: null, timezone: TZ, createdAt: "", updatedAt: "", ...over });

  it("Goal 20 direct bouts → supported; displayed as the athlete's target, not a prescription", () => {
    expect(validateGoal(goal(), [])).toEqual({ ok: true });
    const sessions = one([exercise("e1", "Wrist Curl", 139, sets(3, { side: "both" }))]);
    const withGoal = summaryOf(sessions, "left", { goals: [goal()] });
    expect(withGoal.goals[0]).toMatchObject({ value: 3, fraction: 0.15, label: "3 of your 20" });
    // A target changes nothing that is counted.
    expect(withGoal.nodes).toEqual(summaryOf(sessions, "left").nodes);
  });

  it("Goal unset → no fake deficit", () => {
    const summary = summaryOf(one([exercise("e1", "Wrist Curl", 139, sets(3, { side: "both" }))]), "left");
    expect(summary.goals).toEqual([]);
    expect(Object.keys(row(summary, m.flexorCarpiRadialis)).some((key) => /target|deficit|gap/i.test(key))).toBe(false);
  });
});

describe("brief §11: windows", () => {
  it("Calendar week → correct boundaries, including the week London's clocks go back", () => {
    const week = calendarWeekInterval("2026-10-22T12:00:00.000Z", TZ); // Mon 19 (BST) – Sun 25 Oct (ends in GMT)
    const at = (completedAt: string) => finished(completedAt, completedAt, [exercise("e1", "Wrist Curl", 139, sets(1, { side: "both" }))]);
    const inWeek = (completedAt: string) => summaryOf([at(completedAt)], "left", { interval: week }).regionDistinctBouts;
    expect(inWeek("2026-10-18T22:59:59.999Z")).toBe(0); // Sun 18 Oct 23:59:59.999 BST
    expect(inWeek("2026-10-18T23:00:00.000Z")).toBe(1); // Mon 19 Oct 00:00 BST
    expect(inWeek("2026-10-25T23:59:59.999Z")).toBe(1); // Sun 25 Oct 23:59:59.999 GMT
    expect(inWeek("2026-10-26T00:00:00.000Z")).toBe(0); // Mon 26 Oct 00:00 GMT
  });

  it("Rolling 7 days → exactly 168 hours back, across the change", () => {
    const now = "2026-10-26T12:00:00.000Z";
    const rolling = rolling7dInterval(now, TZ);
    const at = (completedAt: string) => finished(completedAt, completedAt, [exercise("e1", "Wrist Curl", 139, sets(1, { side: "both" }))]);
    expect(summaryOf([at("2026-10-19T12:00:00.000Z")], "left", { interval: rolling, now }).regionDistinctBouts).toBe(1);
    expect(summaryOf([at("2026-10-19T11:59:59.999Z")], "left", { interval: rolling, now }).regionDistinctBouts).toBe(0);
  });
});

describe("brief §5: the worked accounting fixture", () => {
  // Two bilateral wrist curls, two bilateral reverse wrist curls, three bilateral 30-second holds.
  const sessions = one([
    exercise("e1", "Wrist Curl", 139, sets(2, { side: "both" })),
    exercise("e2", "Reverse Wrist Curl", 140, sets(2, { side: "both" })),
    exercise("e3", "Farmer Hold", 145, sets(3, { side: "both", reps: "", weight: "32", holdSeconds: "30" })),
  ]);

  for (const side of ["left", "right"] as const) {
    it(`${side} arm: 7 distinct bouts; flexors 2, extensors 2, grip 3 holds = 90 s; wrist-exercise grip incidental`, () => {
      const summary = summaryOf(sessions, side);
      expect(summary.regionDistinctBouts).toBe(7);
      for (const flexor of [m.flexorCarpiRadialis, m.flexorCarpiUlnaris]) expect(row(summary, flexor).directDynamicBouts).toBe(2);
      for (const extensor of [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris]) expect(row(summary, extensor).directDynamicBouts).toBe(2);
      for (const grip of [m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus]) {
        expect(row(summary, grip)).toMatchObject({ deliberateHoldBouts: 3, deliberateHoldSeconds: 90, incidentalBouts: 4, directDynamicBouts: 0, contributingDynamicBouts: 0 });
      }
    });
  }

  it("FCR and FCU both appearing in two bouts is two wrist-curl bouts, not four", () => {
    const summary = summaryOf(sessions, "left");
    const ids = new Set([...row(summary, m.flexorCarpiRadialis).contributions, ...row(summary, m.flexorCarpiUlnaris).contributions].map((item) => item.boutId));
    expect(ids.size).toBe(2);
  });

  it("makes no claim that any muscle received seven hypertrophy sets", () => {
    const summary = summaryOf(sessions, "left");
    // At most two dynamic bouts for any muscle; the only muscles touched by all seven bouts
    // got three deliberate holds and four incidental grips, never seven of one kind.
    expect(Math.max(...summary.nodes.map((node) => node.directDynamicBouts + node.contributingDynamicBouts))).toBe(2);
    for (const node of summary.nodes.filter((item) => touched(summary, item.nodeId) === 7)) {
      expect([node.deliberateHoldBouts, node.incidentalBouts]).toEqual([3, 4]);
    }
    expect(summary.nodes.some((node) => [node.directDynamicBouts, node.contributingDynamicBouts, node.deliberateHoldBouts, node.incidentalBouts, node.mixedBouts].includes(7))).toBe(false);
  });
});

describe("planned mode reads the plan week by name", () => {
  it("labels the window as the plan as written", () => {
    const summary = getSpecializationSummary({ region: syntheticForearm, bouts: [], interval: planWeekInterval(2, TZ), side: "left", mode: "planned", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: "plan-x", now: NOW });
    expect(summary.interval.label).toBe("Plan Week 2, as written");
  });
});
