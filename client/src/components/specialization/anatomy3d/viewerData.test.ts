// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { saveDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { exercise, finished, workSet } from "@/lib/specialization/__fixtures__/syntheticForearm";
import { clearSummaryCache, useSpecializationSummary, type SpecializationPlanInput } from "@/lib/specialization/useSpecializationSummary";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { forearmAdjacentIds, forearmMuscleIds as m } from "@shared/specialization/ids";
import { regionDataFor } from "@shared/specialization/registry";
import { calendarWeekInterval, planWeekInterval, rolling7dInterval } from "@shared/specialization/time";
import type { ArmSide, SpecializationGoal, SpecializationSummary, SummaryInterval, SummaryMode } from "@shared/specialization/types";
import { viewerMuscleData, type ViewerWindow } from "./viewerData";

/**
 * The 3D panel's adapter (SG-FOREARM-INTEGRATION-20261019 §5), traced from real logged workouts
 * through the app's own calculator: the panel shows exactly what the summary says, for the arm
 * and window on screen, and says "unknown" rather than 0 wherever the summary has no number.
 */

const data = regionDataFor("forearm")!;
const NOW = "2026-10-16T12:00:00.000Z";
const ZONE = "Europe/London";
const WEEK = calendarWeekInterval(NOW, ZONE);
const WED = "2026-10-14T18:00:00.000Z";

const summaryFor = (side: ArmSide, over: { interval?: SummaryInterval; mode?: SummaryMode; goals?: SpecializationGoal[]; plan?: SpecializationPlanInput | null } = {}): SpecializationSummary => {
  const { result } = renderHook(() => useSpecializationSummary({ region: data, accountScope: "a", interval: over.interval ?? WEEK, side, mode: over.mode ?? "completed", plan: over.plan ?? null, goals: over.goals ?? [], catalog: exercises, fallbackUnit: "kg", now: NOW }));
  if (result.current.status !== "ready") throw new Error("no summary");
  return result.current.summary;
};
const view = (side: ArmSide, over: Partial<ViewerWindow> = {}): ViewerWindow => ({ mode: "completed", window: "week", side, timeZone: ZONE, ...over });
const panel = (summary: SpecializationSummary, nodeId: string, side: ArmSide, over: Partial<ViewerWindow> = {}) => viewerMuscleData({ data, nodeId, state: { kind: "ready", summary }, view: view(side, over) });
const exposure = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;
const directNodes = (summary: SpecializationSummary) => summary.nodes.filter((node) => node.directDynamicBouts > 0).map((node) => node.nodeId);

const wristCurls = (count: number) => exercise("e1", "Wrist Curl", 139, Array.from({ length: count }, () => workSet({ weight: "30", reps: "15" })));

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearSummaryCache();
});

describe("one real workout, traced to the panel", () => {
  it("shows each muscle's numbers exactly as the calculator gives them, with the exercises behind them", () => {
    saveDeviceWorkoutSessions([finished("s1", WED, [wristCurls(3)])]);
    const summary = summaryFor("right");
    const credited = directNodes(summary);
    expect(credited.length).toBeGreaterThan(0);
    for (const nodeId of credited) {
      const node = exposure(summary, nodeId);
      const shown = panel(summary, nodeId, "right");
      expect(shown.nodeId).toBe(nodeId);
      expect(shown.directDynamicSets).toEqual({ bouts: node.directDynamicBouts, reps: node.directDynamicReps });
      expect(shown.supportingExerciseExposure).toEqual({ value: node.contributingDynamicBouts, unit: "bouts" });
      expect(shown.deliberateIsometricBouts).toBe(node.deliberateHoldBouts);
      expect(shown.incidentalGripExposure).toEqual({ value: node.incidentalBouts, unit: "bouts" });
      expect(shown.exercises).toEqual([expect.objectContaining({ name: "Wrist Curl", catalogExerciseId: 139, bouts: 3 })]);
      expect(shown.dataStatus).toBe("complete");
      expect(shown.dataNote).toBeNull();
    }
    // The flexors of the wrist are the wrist curl's direct movers.
    expect(credited).toEqual(expect.arrayContaining([m.flexorCarpiUlnaris, m.flexorCarpiRadialis]));
    expect(panel(summary, m.flexorCarpiUlnaris, "right").directDynamicSets).toEqual({ bouts: 3, reps: 45 });
  });

  it("reads the muscle's reviewed function and appearance content, not demo text", () => {
    const summary = summaryFor("right");
    const node = data.nodes.find((item) => item.id === m.flexorDigitorumProfundus)!;
    const shown = panel(summary, node.id, "right");
    expect(shown.physicalFunction).toEqual(expect.objectContaining({ text: node.whatItDoes, reviewed: true }));
    expect(shown.physicalFunction.actions.length).toBeGreaterThan(0);
    expect(shown.visibleShapeContribution.text).toBe(node.shapeNote);
    expect(shown.inModel).toBe(true);
  });
});

describe("the calculator's rules come through unchanged", () => {
  it("counts a drop set once, however many stages it had", () => {
    const drop = workSet({ weight: "30", reps: "12", id: "d1", type: "drop", stages: [{ weight: "30", reps: "12" }, { weight: "20", reps: "10" }, { weight: "10", reps: "8" }] } as never);
    saveDeviceWorkoutSessions([finished("s1", WED, [exercise("e1", "Wrist Curl", 139, [workSet({ weight: "30", reps: "15" }), drop])])]);
    const summary = summaryFor("right");
    expect(panel(summary, m.flexorCarpiUlnaris, "right").directDynamicSets?.bouts).toBe(2);
  });

  it("counts two-handed work for each arm, and one arm's work for that arm only (no side leakage)", () => {
    saveDeviceWorkoutSessions([finished("s1", WED, [
      wristCurls(3),
      exercise("e2", "Hammer Curl", 132, [workSet({ side: "right" } as never), workSet({ side: "right" } as never)]),
    ])]);
    const right = summaryFor("right");
    const left = summaryFor("left");
    // Two-handed: the same on both arms.
    expect(panel(right, m.flexorCarpiUlnaris, "right").directDynamicSets?.bouts).toBe(3);
    expect(panel(left, m.flexorCarpiUlnaris, "left").directDynamicSets?.bouts).toBe(3);
    // One arm: the right arm's brachioradialis has the hammer curls; the left's has none of them.
    const rightBr = panel(right, m.brachioradialis, "right");
    const leftBr = panel(left, m.brachioradialis, "left");
    expect(rightBr.exercises.map((item) => item.name)).toContain("Hammer Curl");
    expect(leftBr.exercises.map((item) => item.name)).not.toContain("Hammer Curl");
    expect((rightBr.directDynamicSets?.bouts ?? 0) + (rightBr.supportingExerciseExposure?.value ?? 0)).toBeGreaterThan((leftBr.directDynamicSets?.bouts ?? 0) + (leftBr.supportingExerciseExposure?.value ?? 0));
  });

  it("keeps holds apart, in seconds, and says when a hold has no time instead of showing 0 s", () => {
    saveDeviceWorkoutSessions([finished("s1", WED, [exercise("e1", "Farmer Hold", 145, [workSet({ reps: "", holdSeconds: "40" } as never), workSet({ reps: "", holdSeconds: "35" } as never)])])]);
    const summary = summaryFor("right");
    const held = summary.nodes.filter((node) => node.deliberateHoldBouts > 0);
    expect(held.length).toBeGreaterThan(0);
    for (const node of held) {
      const shown = panel(summary, node.nodeId, "right");
      expect(shown.deliberateIsometricBouts).toBe(node.deliberateHoldBouts);
      expect(shown.isometricHoldSeconds).toBe(node.deliberateHoldSeconds);
      // Holds never become direct dynamic sets.
      expect(shown.directDynamicSets?.bouts).toBe(node.directDynamicBouts);
    }
    localStorage.clear();
    clearSummaryCache();
    saveDeviceWorkoutSessions([finished("s2", WED, [exercise("e1", "Farmer Hold", 145, [workSet({ reps: "", holdSeconds: "" } as never)])])]);
    const untimed = summaryFor("right");
    const node = untimed.nodes.find((item) => item.deliberateHoldBouts > 0);
    if (node && node.deliberateHoldSeconds === 0) expect(panel(untimed, node.nodeId, "right").isometricHoldSeconds).toBeNull();
  });

  it("shows planned work in planned mode, from the plan as written", () => {
    saveDeviceWorkoutSessions([finished("s1", WED, [wristCurls(3)])]);
    const slots = buildDaySlots(["Arms"]);
    const wrist = exercises.find((item) => item.id === 140)!;
    const store: WeeklyDayStore = { ...emptyDayStore(), plan: { [slots[0].key]: [wrist] }, prescriptions: { [slots[0].key]: { 140: "4 × 12" } } };
    const planned = summaryFor("right", { mode: "planned", interval: planWeekInterval(1, ZONE), plan: { week: 1, slots, store } });
    const credited = directNodes(planned);
    expect(credited.length).toBeGreaterThan(0);
    const shown = panel(planned, credited[0], "right", { mode: "planned" });
    expect(shown.directDynamicSets?.bouts).toBe(4);
    expect(shown.exercises.map((item) => item.name)).toEqual([wrist.name]);
    // The logged wrist curls are not planned work.
    expect(panel(planned, m.flexorCarpiUlnaris, "right", { mode: "planned" }).exercises.map((item) => item.name)).not.toContain("Wrist Curl");
  });
});

describe("zero, missing, partial, loading, error and unknown are told apart", () => {
  it("zero: a mapped muscle with no work has 0, said as nothing logged", () => {
    const summary = summaryFor("right");
    const shown = panel(summary, m.extensorIndicis, "right");
    expect(exposure(summary, m.extensorIndicis).mappingCoverage).toBe("reviewed");
    expect(shown.dataStatus).toBe("zero");
    expect(shown.directDynamicSets).toEqual({ bouts: 0, reps: 0 });
    expect(shown.dataNote).toMatch(/^Nothing logged for it on the right arm/);
  });

  it("missing: a muscle no exercise is mapped to has no numbers at all, never 0", () => {
    const summary = summaryFor("right");
    const unmapped = summary.nodes.filter((node) => node.mappingCoverage === "none").map((node) => node.nodeId);
    expect(unmapped).toContain(forearmAdjacentIds.anconeus);
    const shown = panel(summary, forearmAdjacentIds.anconeus, "right");
    expect(shown.dataStatus).toBe("missing");
    expect(shown.directDynamicSets).toBeNull();
    expect(shown.supportingExerciseExposure).toBeNull();
    expect(shown.deliberateIsometricBouts).toBeNull();
    expect(shown.isometricHoldSeconds).toBeNull();
    expect(shown.incidentalGripExposure).toBeNull();
    expect(shown.dataNote).toMatch(/missing mapping, not missing training/);
  });

  it("partial: sets with no arm recorded keep the numbers and say what is left out", () => {
    // A one-arm exercise logged with no arm: kept apart, counted for neither arm.
    saveDeviceWorkoutSessions([finished("s1", WED, [wristCurls(2), exercise("e2", "One-Arm Dumbbell Wrist Curl", 410, [workSet(), workSet()])])]);
    const summary = summaryFor("right");
    const kept = summary.nodes.find((node) => node.unknownSide.bouts > 0)!;
    expect(kept).toBeTruthy();
    const shown = panel(summary, kept.nodeId, "right");
    expect(shown.dataStatus).toBe("partial");
    expect(shown.directDynamicSets).not.toBeNull();
    expect(shown.dataNote).toMatch(/with no arm recorded are kept apart and counted for neither arm/);
  });

  it("loading and error carry no numbers, only what is happening", () => {
    for (const kind of ["loading", "error"] as const) {
      const shown = viewerMuscleData({ data, nodeId: m.flexorCarpiUlnaris, state: { kind, note: kind === "loading" ? "Loading your plan…" : "The totals could not be worked out." }, view: view("right") });
      expect(shown.dataStatus).toBe(kind);
      expect(shown.directDynamicSets).toBeNull();
      expect(shown.exercises).toEqual([]);
      expect(shown.displayName).toBe("Flexor carpi ulnaris");
    }
  });

  it("an id the atlas does not have is unavailable, with no numbers and no other muscle's name", () => {
    saveDeviceWorkoutSessions([finished("s1", WED, [wristCurls(3)])]);
    const summary = summaryFor("right");
    for (const nodeId of ["forearm.nope", "flexor-carpi-ulnaris", "FCU", "forearm.anterior", ""]) {
      const shown = panel(summary, nodeId, "right");
      expect(shown.dataStatus).toBe("unavailable");
      expect(shown.directDynamicSets).toBeNull();
      expect(shown.exercises).toEqual([]);
      expect(shown.displayName).toBe("Muscle not found");
    }
  });
});

describe("targets: the athlete's own, compared only over the same period", () => {
  const goal = (over: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
    id: "g1", regionId: "forearm", nodeId: m.flexorCarpiUlnaris, actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week",
    startsOn: "2026-10-01", endsOn: null, timezone: ZONE, createdAt: NOW, updatedAt: NOW, ...over,
  });

  it("has no target at all when the athlete set none (no default)", () => {
    const summary = summaryFor("right");
    const shown = panel(summary, m.flexorCarpiUlnaris, "right");
    expect(shown.targetSets).toBeNull();
    expect(shown.targets).toEqual([]);
  });

  it("sets a weekly target beside this week's work, and not beside a rolling window's", () => {
    saveDeviceWorkoutSessions([finished("s1", WED, [wristCurls(3)])]);
    const goals = [goal()];
    const week = summaryFor("right", { goals });
    expect(panel(week, m.flexorCarpiUlnaris, "right").targetSets).toEqual(expect.objectContaining({ target: 6, value: 3, label: "3 of your 6", matchesWindow: true }));
    const rolling = summaryFor("right", { goals, interval: rolling7dInterval(NOW, ZONE) });
    const shown = panel(rolling, m.flexorCarpiUlnaris, "right", { window: "7d" });
    expect(shown.targetSets).toBeNull();
    expect(shown.targets).toEqual([expect.objectContaining({ period: "calendar_week", matchesWindow: false })]);
  });

  it("never sets a hold target beside dynamic work", () => {
    const summary = summaryFor("right", { goals: [goal({ metric: "deliberate_hold_seconds", target: 120 })] });
    const shown = panel(summary, m.flexorCarpiUlnaris, "right");
    expect(shown.targetSets).toBeNull();
    expect(shown.targets).toEqual([expect.objectContaining({ metric: "deliberate_hold_seconds" })]);
  });
});
