import { describe, expect, it } from "vitest";
import { MUSCLE_RANK_LIFT_LIMIT, liftBodyMass, muscleRankLiftSelection } from "./muscleRankLifts";
import type { BodyWeightEntry } from "./bodyWeightLog";

const history: BodyWeightEntry[] = [{ bodyMassKg: 82, enteredUnit: "kg", observedAt: "2026-08-01T00:00:00.000Z" }];
/** The lifts sent, without what rides beside them. */
const muscleRankLifts = (...args: Parameters<typeof muscleRankLiftSelection>) => muscleRankLiftSelection(...args).lifts;

describe("The body weight a lift is read against", () => {
  /** The rule: a lift keeps the weight saved with it, whatever the profile says today. */
  it("uses the weight saved with the lift first", () => {
    expect(liftBodyMass({ exerciseName: "Bench", observedAt: "2026-09-01", bodyMassKgAtTest: 80 }, history, 90)).toEqual({ kg: 80, source: "recorded" });
  });
  it("falls back to the weight log for that day", () => {
    expect(liftBodyMass({ exerciseName: "Bench", observedAt: "2026-09-01" }, history, 90)).toEqual({ kg: 82, source: "dated" });
  });
  it("uses the profile weight only when nothing closer exists", () => {
    expect(liftBodyMass({ exerciseName: "Bench", observedAt: "2026-07-01" }, history, 90)).toEqual({ kg: 90, source: "profile" });
  });
  it("gives no weight rather than a made-up one", () => {
    expect(liftBodyMass({ exerciseName: "Bench", observedAt: "2026-07-01" }, [], null)).toBeNull();
    expect(liftBodyMass({ exerciseName: "Bench", observedAt: "2026-07-01" }, history, null)).toBeNull();
  });
});

describe("Which ranked lifts are read against the profile weight", () => {
  it("names only the lifts with no weight of their own day", () => {
    const selection = muscleRankLiftSelection([
      { exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, bodyMassKgAtTest: 80, observedAt: "2026-09-01T10:00:00.000Z" },
      { exerciseName: "Preacher Curl", loadKg: 30, repetitions: 8, observedAt: "2026-09-02T10:00:00.000Z" },
      { exerciseName: "Back Squat", loadKg: 120, repetitions: 5, observedAt: "2026-07-01T10:00:00.000Z" },
    ], history, 80);
    expect(selection.lifts).toHaveLength(3);
    expect(selection.profileWeightExercises).toEqual(["Back Squat"]);
  });

  it("does not name a profile-weight lift that is not sent", () => {
    // The saved-weight single is the stronger lift both ways, so the lighter one stays home.
    const selection = muscleRankLiftSelection([
      { exerciseName: "Bench", loadKg: 100, repetitions: 1, bodyMassKgAtTest: 80, observedAt: "2026-09-01T10:00:00.000Z" },
      { exerciseName: "Bench", loadKg: 60, repetitions: 1, observedAt: "2026-07-01T10:00:00.000Z" },
    ], history, 80);
    expect(selection.lifts.map((lift) => lift.loadKg)).toEqual([100]);
    expect(selection.profileWeightExercises).toEqual([]);
  });
});

describe("The lifts sent to be ranked", () => {
  it("reads a measured 1RM as one rep and a working set as its reps", () => {
    const lifts = muscleRankLifts([
      { exerciseName: "Barbell Bench Press", loadKg: 120, measurementType: "MEASURED_1RM", observedAt: "2026-09-01", bodyMassKgAtTest: 80 },
      { exerciseName: "Preacher Curl", loadKg: 30, repetitions: 8, measurementType: "MULTI_REP", observedAt: "2026-09-02", bodyMassKgAtTest: 80 },
    ], [], null);
    expect(lifts.map((lift) => [lift.exerciseName, lift.repetitions])).toEqual([["Preacher Curl", 8], ["Barbell Bench Press", 1]]);
  });

  it("carries the catalog id so the server joins exactly", () => {
    expect(muscleRankLifts([{ exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, observedAt: "2026-09-01" }], [], 80)[0].catalogExerciseId).toBe(1);
  });

  it("skips a lift with nothing to score", () => {
    expect(muscleRankLifts([
      { exerciseName: "Plank", loadKg: null, repetitions: 1, observedAt: "2026-09-01" },
      { exerciseName: "Bench", loadKg: 100, repetitions: 0, observedAt: "2026-09-01" },
    ], [], 80)).toEqual([]);
  });

  it("sends an identical lift once", () => {
    const same = { exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, bodyMassKgAtTest: 80 };
    expect(muscleRankLifts([{ ...same, observedAt: "2026-09-01" }, { ...same, observedAt: "2026-09-08" }], [], 80)).toHaveLength(1);
  });

  /** A request stays well inside the URL budget a GET query has. */
  it("keeps the encoded request small", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ exerciseName: "Barbell Bench Press", loadKg: 60 + i, repetitions: 5, bodyMassKgAtTest: 80.5, observedAt: new Date(2026, 0, 1 + i).toISOString() }));
    const encoded = encodeURIComponent(JSON.stringify({ 0: { json: { sex: "female", lifts: muscleRankLifts(many, [], 80) } } }));
    expect(encoded.length).toBeLessThan(6000);
  });

  // Intentional change (Backend V1 EN-02, D-007): the newest 30 lifts used to be sent, so an
  // older best dropped out. Each exercise's strongest lift is sent instead.
  it("sends an exercise's strongest lift, not its newest ones", () => {
    const many = Array.from({ length: 70 }, (_, i) => ({ exerciseName: "Bench", loadKg: 100 + i, repetitions: 5, observedAt: new Date(2026, 0, i + 1).toISOString() }));
    expect(muscleRankLifts(many, [], 80).map((lift) => lift.loadKg)).toEqual([169]);
  });

  it("keeps a best lift from months ago after forty newer, lighter ones", () => {
    const best = { exerciseName: "Bench", loadKg: 100, repetitions: 10, observedAt: "2026-01-05T10:00:00.000Z" };
    const newer = Array.from({ length: 40 }, (_, i) => ({ exerciseName: ["Squat", "Row", "Bench"][i % 3], loadKg: 60, repetitions: 3, observedAt: new Date(2026, 5, i + 1).toISOString() }));
    const benchLifts = muscleRankLifts([best, ...newer], [], 80).filter((lift) => lift.exerciseName === "Bench");
    expect(benchLifts.map((lift) => [lift.loadKg, lift.repetitions])).toEqual([[100, 10]]);
  });

  it("ranks a strong ten ahead of a lighter triple, by the shared e1RM", () => {
    // 100 x 10 is 133.3 kg estimated; 80 x 3 is 84.7 kg. The triple is more confident, not stronger.
    const lifts = muscleRankLifts([
      { exerciseName: "Bench", loadKg: 80, repetitions: 3, observedAt: "2026-06-02T10:00:00.000Z" },
      { exerciseName: "Bench", loadKg: 100, repetitions: 10, observedAt: "2026-06-01T10:00:00.000Z" },
    ], [], 80);
    expect(lifts.map((lift) => [lift.loadKg, lift.repetitions])).toEqual([[100, 10]]);
  });

  it("reads each lift at its own age and body mass when choosing", () => {
    // 80 kg at 16 is placed as 80 / 0.8784 = 91.1 kg; 88 kg at 30 as 88 kg. Same body mass.
    const lifts = muscleRankLifts([
      { exerciseName: "Bench", loadKg: 80, repetitions: 1, bodyMassKgAtTest: 70, observedAt: "2026-03-01T10:00:00.000Z" },
      { exerciseName: "Bench", loadKg: 88, repetitions: 1, bodyMassKgAtTest: 70, observedAt: "2040-03-01T10:00:00.000Z" },
    ], [], 70, 2010);
    expect(lifts[0]).toMatchObject({ loadKg: 80, ageYears: 16 });
  });

  it("sends the heaviest absolute lift too when a lighter body made another lift the best relative one", () => {
    const lifts = muscleRankLifts([
      { exerciseName: "Bench", loadKg: 100, repetitions: 1, bodyMassKgAtTest: 70, observedAt: "2026-03-01T10:00:00.000Z" },
      { exerciseName: "Bench", loadKg: 110, repetitions: 1, bodyMassKgAtTest: 90, observedAt: "2026-04-01T10:00:00.000Z" },
    ], [], 80);
    expect(lifts.map((lift) => lift.loadKg)).toEqual([100, 110]);
  });

  it("gives every exercise its best lift before any exercise a second, and keeps the most recently trained when over the cap", () => {
    const exercisesTrained = Array.from({ length: MUSCLE_RANK_LIFT_LIMIT + 5 }, (_, i) => ({ exerciseName: `Exercise ${i}`, loadKg: 50, repetitions: 5, observedAt: new Date(2026, 0, i + 1).toISOString() }));
    const lifts = muscleRankLifts(exercisesTrained, [], 80);
    expect(lifts).toHaveLength(MUSCLE_RANK_LIFT_LIMIT);
    expect(new Set(lifts.map((lift) => lift.exerciseName)).size).toBe(MUSCLE_RANK_LIFT_LIMIT);
    expect(lifts.map((lift) => lift.exerciseName)).not.toContain("Exercise 0");
    expect(lifts[0].exerciseName).toBe(`Exercise ${MUSCLE_RANK_LIFT_LIMIT + 4}`);
  });

  // Backend V1 EN-09: bodyweight movements never reached the ranks; the policy scores them on reps.
  it("sends a bodyweight movement as its best set of reps, without load", () => {
    const lifts = muscleRankLifts([
      { exerciseName: "Pull-Up", loadKg: null, repetitions: 8, observedAt: "2026-06-01T10:00:00.000Z" },
      { exerciseName: "Pull-Up", loadKg: null, repetitions: 12, observedAt: "2026-05-01T10:00:00.000Z" },
    ], [], 80);
    expect(lifts.map((lift) => [lift.exerciseName, lift.loadKg, lift.repetitions])).toEqual([["Pull-Up", 0, 12]]);
  });

  it("sends a loaded set of a bodyweight movement too, after every exercise's best, so the server can say it is not scored", () => {
    const lifts = muscleRankLifts([
      { exerciseName: "Pull-Up", loadKg: null, repetitions: 10, observedAt: "2026-06-01T10:00:00.000Z" },
      { exerciseName: "Pull-Up", loadKg: 20, repetitions: 5, observedAt: "2026-06-02T10:00:00.000Z" },
      { exerciseName: "Bench", loadKg: 80, repetitions: 5, observedAt: "2026-06-03T10:00:00.000Z" },
    ], [], 80);
    expect(lifts.map((lift) => [lift.exerciseName, lift.loadKg])).toEqual([["Bench", 80], ["Pull-Up", 0], ["Pull-Up", 20]]);
  });

  it("does not send an unloaded set of a loaded exercise", () => {
    expect(muscleRankLifts([{ exerciseName: "Barbell Bench Press", loadKg: null, repetitions: 5, observedAt: "2026-06-01T10:00:00.000Z" }], [], 80)).toEqual([]);
  });

  it("does not send a set the estimator cannot read", () => {
    expect(muscleRankLifts([{ exerciseName: "Bench", loadKg: 40, repetitions: 20, observedAt: "2026-06-01T10:00:00.000Z" }], [], 80)).toEqual([]);
  });
});
