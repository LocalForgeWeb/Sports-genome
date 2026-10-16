import { describe, expect, it } from "vitest";
import type { DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { boutsFromSessions, excludedRecordsFromSessions, resolveCatalogExercise } from "./bouts";
import { boutsFromPlan, plannedExercisesInWeek, plannedTarget } from "./planBouts";
import { planRevision, sourceRevision, stableStringify } from "./revision";
import { exercise, finished, syntheticForearm, workSet } from "./__fixtures__/syntheticForearm";

/**
 * The device adapters (01-reconciliation.md, adapter map): the workout log and the plan as
 * exposure bouts, and the revisions the summary cache is keyed on.
 */

const deps = { catalog: exercises, variants: syntheticForearm.variants, fallbackUnit: "lb" as const };
const byId = (id: number) => exercises.find((item) => item.id === id)!;

describe("boutsFromSessions", () => {
  it("reads only completed sets of finished workouts, one bout each, with ids that point back at the record", () => {
    const sessions: DeviceWorkoutSession[] = [
      finished("s1", "2026-10-14T18:00:00.000Z", [
        exercise("e1", "Wrist Curl", 139, [workSet({ id: "set-a" }), workSet({ completed: false, skipped: true }), workSet()]),
      ]),
      { ...finished("s2", "2026-10-15T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, [workSet()])]), status: "active", completedAt: undefined },
    ];
    const bouts = boutsFromSessions(sessions, deps);
    expect(bouts.map((bout) => bout.id)).toEqual(["set-a", "s1/e1/2"]);
    expect(bouts[0]).toMatchObject({ mode: "completed", performedAt: "2026-10-14T18:00:00.000Z", sessionId: "s1", sessionLabel: "Week 1 · Day 01 · Pull", exerciseEntryId: "e1", catalogExerciseId: 139, matchedBy: "id", planWeek: null, dayKey: null });
  });

  it("finds the catalog exercise by recorded id, else by exact name (labelled), never by a near match", () => {
    expect(resolveCatalogExercise({ catalogId: 139, exerciseName: "Anything" }, exercises)).toEqual({ catalogExerciseId: 139, matchedBy: "id" });
    expect(resolveCatalogExercise({ exerciseName: "Wrist Curl" }, exercises)).toEqual({ catalogExerciseId: 139, matchedBy: "name" });
    expect(resolveCatalogExercise({ exerciseName: "wrist curl" }, exercises)).toEqual({ catalogExerciseId: null, matchedBy: "none" });
    expect(resolveCatalogExercise({ exerciseName: "Wrist Curls" }, exercises)).toEqual({ catalogExerciseId: null, matchedBy: "none" });
  });

  it("keeps a drop set as one bout whose stages are its segments, each with its own load in kg", () => {
    const drop = workSet({ id: "d1", type: "drop", weight: "45", reps: "8", unit: "lb", stages: [{ id: "d1-stage-1", weight: "45", reps: "8", unit: "lb" }, { id: "d1-stage-2", weight: "35", reps: "6", unit: "lb" }, { id: "d1-stage-3", weight: "10", reps: "10", unit: "kg" }] });
    const [bout] = boutsFromSessions([finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, [drop])])], deps);
    expect(bout.kind).toBe("drop");
    expect(bout.segments.map((segment) => [segment.id, segment.reps, Math.round(segment.loadKg! * 1000) / 1000])).toEqual([
      ["d1-stage-1", 8, 20.412],
      ["d1-stage-2", 6, 15.876],
      ["d1-stage-3", 10, 10],
    ]);
  });

  it("reads the load in the unit it was typed in: the set's own, else the session's, else the profile's", () => {
    const session = finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, [workSet({ weight: "100", unit: undefined }), workSet({ weight: "100", unit: "lb" })])], { weightUnit: undefined });
    const [fromProfile, fromSet] = boutsFromSessions([session], { ...deps, fallbackUnit: "kg" });
    expect(fromProfile.segments[0].loadKg).toBe(100);
    expect(Math.round(fromSet.segments[0].loadKg! * 100) / 100).toBe(45.36);
    expect(boutsFromSessions([finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, [workSet({ weight: "" })])])], deps)[0].segments[0].loadKg).toBeNull();
  });

  it("takes the side the athlete recorded, else a two-handed exercise's, else leaves it unknown", () => {
    const session = finished("s1", "2026-10-14T18:00:00.000Z", [
      exercise("e1", "Wrist Curl", 139, [workSet({ side: "left" }), workSet({ side: "right" }), workSet({ side: "both" }), workSet()]),
      exercise("e2", "Reverse Curl", 135, [workSet()]),
      exercise("e3", "Barbell Bench Press", 1, [workSet()]),
    ]);
    expect(boutsFromSessions([session], deps).map((bout) => [bout.side, bout.sideSource])).toEqual([
      ["left", "recorded"],
      ["right", "recorded"],
      ["bilateral", "recorded"],
      ["unknown", "unknown"],
      ["bilateral", "structural"],
      ["unknown", "unknown"],
    ]);
  });

  it("passes straps, hold seconds, effort and warm-up through without inventing any of them", () => {
    const session = finished("s1", "2026-10-14T18:00:00.000Z", [
      exercise("e1", "Farmer Hold", 145, [workSet({ reps: "", holdSeconds: "30", effort: "failure" }), workSet({ reps: "", holdSeconds: "0" }), workSet({ reps: "", holdSeconds: "abc", warmup: true })], { straps: "yes" }),
      exercise("e2", "Barbell Bent-Over Row", 43, [workSet()]),
    ]);
    const bouts = boutsFromSessions([session], deps);
    expect(bouts.map((bout) => [bout.straps, bout.segments[0].holdSeconds, bout.segments[0].reps, bout.effort, bout.warmup])).toEqual([
      ["yes", 30, null, "failure", false],
      ["yes", null, null, null, false],
      ["yes", null, null, null, true],
      ["unknown", null, 12, null, false],
    ]);
  });
});

describe("excludedRecordsFromSessions", () => {
  it("lists skipped sets, typed-but-unlogged sets and unfinished workouts' logged sets as not completed, once each", () => {
    const done = finished("s1", "2026-10-14T18:00:00.000Z", [
      exercise("e1", "Wrist Curl", 139, [workSet(), workSet({ completed: false, skipped: true })], { skippedSets: 2 }),
      exercise("e2", "Reverse Wrist Curl", 140, [workSet(), workSet({ completed: false, weight: "20", reps: "" })]),
    ], { notPerformed: [{ exerciseName: "Farmer Hold", catalogId: 145, plannedSets: 3, skipped: true }, { exerciseName: "Plate Pinch", catalogId: 142, plannedSets: 2, skipped: false }] });
    const live = { ...finished("s2", "2026-10-15T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, [workSet(), workSet({ completed: false, weight: "20" })])]), status: "active" as const, completedAt: undefined };
    const records = excludedRecordsFromSessions([done, live], deps);
    expect(records.every((record) => record.excluded === "not_completed")).toBe(true);
    expect(records.map((record) => record.id)).toEqual([
      "s1/e1/1", // the skipped set still on the record
      "s1/e1/skipped-2", // the stamp says 2 were skipped; one is above
      "s1/e2/1", // typed, never logged
      "s1/not-performed/0/1",
      "s1/not-performed/0/2",
      "s1/not-performed/0/3",
      "s2/e1/0", // logged, but the workout is not finished
    ]);
    expect(records.find((record) => record.id === "s1/not-performed/0/1")).toMatchObject({ catalogExerciseId: 145, exerciseName: "Farmer Hold" });
  });
});

describe("boutsFromPlan", () => {
  const slots = buildDaySlots(["Pull", "Push"]);
  const pullKey = slots[0].key;
  const store: WeeklyDayStore = {
    ...emptyDayStore(),
    plan: {
      [pullKey]: [byId(139), byId(145), byId(135), byId(1), { ...byId(139), id: -501, catalogExerciseId: 139 } as never],
      "9-Legs": [byId(140)],
    },
    prescriptions: { [pullKey]: { 139: "4 × 8–12", 145: "3 × 30 sec", [-501]: "2 × 15" } },
  };

  it("makes one bout per planned set, by the same set count every plan reader uses", () => {
    const bouts = boutsFromPlan({ week: 2, slots, store, variants: syntheticForearm.variants });
    const perEntry = new Map<string, number>();
    for (const bout of bouts) perEntry.set(bout.exerciseEntryId, (perEntry.get(bout.exerciseEntryId) ?? 0) + 1);
    expect(Object.fromEntries(perEntry)).toEqual({ "139": 4, "145": 3, "135": 3, "1": 3, "-501": 2 });
    expect(bouts[0]).toMatchObject({ id: `plan/2/${pullKey}/139/1`, mode: "planned", performedAt: null, sessionId: null, planWeek: 2, dayKey: pullKey, sessionLabel: "Week 2 · Day 01 · Pull", matchedBy: "id", effort: null, warmup: false });
    // A duplicated entry has its own id and names its catalog exercise separately.
    expect(bouts.filter((bout) => bout.exerciseEntryId === "-501").every((bout) => bout.catalogExerciseId === 139)).toBe(true);
    // Hidden days of a lowered frequency are not planned work.
    expect(bouts.some((bout) => bout.catalogExerciseId === 140)).toBe(false);
  });

  it("reads reps or seconds from the written target, never a load", () => {
    const bouts = boutsFromPlan({ week: 2, slots, store, variants: syntheticForearm.variants });
    expect(bouts.find((bout) => bout.catalogExerciseId === 139)!.segments[0]).toMatchObject({ reps: 8, holdSeconds: null, loadKg: null });
    expect(bouts.find((bout) => bout.catalogExerciseId === 145)!.segments[0]).toMatchObject({ reps: null, holdSeconds: 30, loadKg: null });
  });

  it("plans a two-handed exercise for both arms, a one-arm one for each arm (labelled as assumed), and leaves the rest unknown", () => {
    const bouts = boutsFromPlan({ week: 2, slots, store, variants: syntheticForearm.variants });
    const sideOf = (id: number) => { const bout = bouts.find((item) => item.catalogExerciseId === id)!; return [bout.side, bout.sideSource]; };
    expect(sideOf(135)).toEqual(["bilateral", "structural"]);
    expect(sideOf(139)).toEqual(["bilateral", "plan_assumption"]);
    expect(sideOf(1)).toEqual(["unknown", "unknown"]);
  });

  it("reads written targets the way a person writes them", () => {
    expect(plannedTarget("8–12")).toEqual({ reps: 8, holdSeconds: null });
    expect(plannedTarget("10 reps")).toEqual({ reps: 10, holdSeconds: null });
    expect(plannedTarget("45s")).toEqual({ reps: null, holdSeconds: 45 });
    expect(plannedTarget("20–30 sec")).toEqual({ reps: null, holdSeconds: 20 });
    expect(plannedTarget("1 min")).toEqual({ reps: null, holdSeconds: 60 });
    expect(plannedTarget("2 minutes")).toEqual({ reps: null, holdSeconds: 120 });
    expect(plannedTarget("40 m")).toEqual({ reps: null, holdSeconds: null });
    expect(plannedTarget("AMRAP")).toEqual({ reps: null, holdSeconds: null });
  });

  it("lists the week's exercises once each, with every day they are on", () => {
    const twoDays: WeeklyDayStore = { ...store, plan: { [slots[0].key]: [byId(139)], [slots[1].key]: [byId(139), byId(140)] } };
    expect(plannedExercisesInWeek(slots, twoDays)).toEqual([
      { catalogExerciseId: 139, name: "Wrist Curl", days: [{ key: slots[0].key, label: slots[0].label }, { key: slots[1].key, label: slots[1].label }] },
      { catalogExerciseId: 140, name: "Reverse Wrist Curl", days: [{ key: slots[1].key, label: slots[1].label }] },
    ]);
  });
});

describe("revisions for the summary cache", () => {
  const base = () => [finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "Wrist Curl", 139, [workSet(), workSet()])]), finished("s2", "2026-10-15T18:00:00.000Z", [exercise("e1", "Hammer Curl", 132, [workSet()])])];

  it("does not move for key order, session order, a rest timer or a note", () => {
    const revision = sourceRevision(base());
    expect(revision).toMatch(/^src-[0-9a-f]{8}$/);
    expect(sourceRevision([...base()].reverse())).toBe(revision);
    expect(sourceRevision(base().map((session) => ({ ...session, restEndsAt: "2026-10-15T18:01:00.000Z", note: "felt good" })))).toBe(revision);
    expect(stableStringify({ b: 1, a: [2, { d: 3, c: undefined }] })).toBe('{"a":[2,{"d":3}],"b":1}');
  });

  it("moves when a set is logged, edited, removed, or given a side, hold or straps", () => {
    const revision = sourceRevision(base());
    const edit = (change: (sessions: DeviceWorkoutSession[]) => void) => { const sessions = base(); change(sessions); return sourceRevision(sessions); };
    expect(edit((sessions) => { sessions[0].exercises[0].sets[0].reps = "11"; })).not.toBe(revision);
    expect(edit((sessions) => { sessions[0].exercises[0].sets.pop(); })).not.toBe(revision);
    expect(edit((sessions) => { sessions.pop(); })).not.toBe(revision);
    expect(edit((sessions) => { (sessions[0].exercises[0].sets[0] as { side?: string }).side = "left"; })).not.toBe(revision);
    expect(edit((sessions) => { (sessions[0].exercises[0] as { straps?: string }).straps = "yes"; })).not.toBe(revision);
  });

  it("moves the plan revision when the week, a day's exercises or a prescription change", () => {
    const slots = buildDaySlots(["Pull"]);
    const store: WeeklyDayStore = { ...emptyDayStore(), plan: { [slots[0].key]: [byId(139)] }, prescriptions: { [slots[0].key]: { 139: "3 × 12" } } };
    const revision = planRevision(store, slots, 1);
    expect(revision).toMatch(/^plan-[0-9a-f]{8}$/);
    expect(planRevision(store, slots, 1)).toBe(revision);
    expect(planRevision(store, slots, 2)).not.toBe(revision);
    expect(planRevision({ ...store, prescriptions: { [slots[0].key]: { 139: "4 × 12" } } }, slots, 1)).not.toBe(revision);
    expect(planRevision({ ...store, plan: { [slots[0].key]: [byId(139), byId(140)] } }, slots, 1)).not.toBe(revision);
  });
});
