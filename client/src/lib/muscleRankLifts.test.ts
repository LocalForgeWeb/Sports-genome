import { describe, expect, it } from "vitest";
import { MUSCLE_RANK_LIFT_LIMIT, liftBodyMassKg, muscleRankLifts } from "./muscleRankLifts";
import type { BodyWeightEntry } from "./bodyWeightLog";

const history: BodyWeightEntry[] = [{ bodyMassKg: 82, enteredUnit: "kg", observedAt: "2026-08-01T00:00:00.000Z" }];

describe("The body weight a lift is read against", () => {
  /** The rule: a lift keeps the weight saved with it, whatever the profile says today. */
  it("uses the weight saved with the lift first", () => {
    expect(liftBodyMassKg({ exerciseName: "Bench", observedAt: "2026-09-01", bodyMassKgAtTest: 80 }, history, 90)).toBe(80);
  });
  it("falls back to the weight log for that day", () => {
    expect(liftBodyMassKg({ exerciseName: "Bench", observedAt: "2026-09-01" }, history, 90)).toBe(82);
  });
  it("uses the profile weight only when nothing closer exists", () => {
    expect(liftBodyMassKg({ exerciseName: "Bench", observedAt: "2026-07-01" }, history, 90)).toBe(90);
  });
  it("gives no weight rather than a made-up one", () => {
    expect(liftBodyMassKg({ exerciseName: "Bench", observedAt: "2026-07-01" }, [], null)).toBeNull();
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

  it("sends the newest lifts, up to the route's cap", () => {
    const many = Array.from({ length: 70 }, (_, i) => ({ exerciseName: "Bench", loadKg: 100 + i, repetitions: 5, observedAt: new Date(2026, 0, i + 1).toISOString() }));
    const lifts = muscleRankLifts(many, [], 80);
    expect(lifts).toHaveLength(MUSCLE_RANK_LIFT_LIMIT);
    expect(lifts[0].loadKg).toBe(169);
    expect(lifts.at(-1)?.loadKg).toBe(140);
  });
});
