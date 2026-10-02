import { describe, expect, it } from "vitest";
import { MUSCLE_RANK_LIFT_LIMIT, liftBodyMass, liftPartInRank, muscleRankLiftSelection, previousRanksForSameGroup, rankProvenance } from "./muscleRankLifts";
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
    expect(selection.profileWeightLifts).toEqual([{ exerciseName: "Back Squat", fromWorkout: false }]);
  });

  /** Only a typed lift's record can take the weight of its day, so the map must know which is which. */
  it("says which of them came from a finished workout", () => {
    const selection = muscleRankLiftSelection([
      { exerciseName: "Back Squat", loadKg: 100, repetitions: 5, observedAt: "2026-07-02T10:00:00.000Z", source: "workout" },
      { exerciseName: "Barbell Bench Press", loadKg: 80, repetitions: 5, observedAt: "2026-07-01T10:00:00.000Z" },
    ], history, 80);
    expect(selection.profileWeightLifts).toEqual([
      { exerciseName: "Back Squat", fromWorkout: true },
      { exerciseName: "Barbell Bench Press", fromWorkout: false },
    ]);
  });

  it("does not name a profile-weight lift that is not sent", () => {
    // The saved-weight single is the stronger lift both ways, so the lighter one stays home.
    const selection = muscleRankLiftSelection([
      { exerciseName: "Bench", loadKg: 100, repetitions: 1, bodyMassKgAtTest: 80, observedAt: "2026-09-01T10:00:00.000Z" },
      { exerciseName: "Bench", loadKg: 60, repetitions: 1, observedAt: "2026-07-01T10:00:00.000Z" },
    ], history, 80);
    expect(selection.lifts.map((lift) => lift.loadKg)).toEqual([100]);
    expect(selection.profileWeightLifts).toEqual([]);
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

describe("Which lifts a rank came from, traced on this device (Sep 30 §6)", () => {
  const bench = { id: "device-bench", exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, bodyMassKgAtTest: 80, observedAt: "2026-09-12T12:00:00.000Z" };
  const pecDeck = (id: string, loadKg: number, observedAt: string) => ({ id, exerciseName: "Pec Deck Fly", loadKg, repetitions: 10, observedAt });

  it("keeps each sent lift's record, date, load, reps and body-weight source beside it, in the same order", () => {
    const selection = muscleRankLiftSelection([bench, pecDeck("device-pec-1", 40, "2026-09-01T12:00:00.000Z")], history, 90);
    expect(selection.sources).toHaveLength(selection.lifts.length);
    selection.sources.forEach((source, index) => expect(source.exerciseName).toBe(selection.lifts[index].exerciseName));
    expect(selection.sources.find((source) => source.exerciseName === "Barbell Bench Press")).toMatchObject({
      observationId: "device-bench", observedAt: "2026-09-12T12:00:00.000Z", loadKg: 100, repetitions: 5, bodyMassKg: 80, bodyMassSource: "recorded", repsOnly: false, fromWorkout: false,
    });
    expect(selection.sources.find((source) => source.exerciseName === "Pec Deck Fly")).toMatchObject({ observationId: "device-pec-1", bodyMassKg: 82, bodyMassSource: "dated" });
  });

  it("names the exercise behind a rank with the lift that was sent for it, strongest placement first", () => {
    const { sources } = muscleRankLiftSelection([bench, pecDeck("device-pec-1", 40, "2026-09-01T12:00:00.000Z")], history, 90);
    const entries = rankProvenance([
      { exerciseName: "Pec Deck Fly", role: "primary", exercisePercentile: null },
      { exerciseName: "Incline Dumbbell Press", role: "primary", exercisePercentile: 40 },
      { exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 86 },
    ], sources);
    // An exercise the rank could not place is not behind it.
    expect(entries.map((entry) => entry.exerciseName)).toEqual(["Barbell Bench Press", "Incline Dumbbell Press"]);
    expect(entries[0].lifts.map((lift) => lift.observationId)).toEqual(["device-bench"]);
    expect(entries[0].lifts[0].observedAt).toBe("2026-09-12T12:00:00.000Z");
    // Nothing logged here was sent for it, so it is named without a dated lift.
    expect(entries[1].lifts).toEqual([]);
  });

  it("keeps every lift sent for an exercise, so more than one reads as a best of N rather than a guess", () => {
    // Lighter body, lighter bar: the best relative and the best absolute lift are different
    // lifts, so both are sent, and the server does not say which placed best.
    const { sources } = muscleRankLiftSelection([
      { ...bench, id: "light", loadKg: 90, bodyMassKgAtTest: 70 },
      { ...bench, id: "heavy", loadKg: 100, bodyMassKgAtTest: 95, observedAt: "2026-08-01T12:00:00.000Z" },
    ], history, 90);
    const [entry] = rankProvenance([{ exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 70 }], sources);
    expect(entry.lifts.map((lift) => lift.observationId)).toEqual(["light", "heavy"]);
  });

  it("orders the exercises by the share of the rank each carried, and keeps that share (D-016)", () => {
    const { sources } = muscleRankLiftSelection([bench, pecDeck("device-pec-1", 40, "2026-09-01T12:00:00.000Z")], history, 90);
    const entries = rankProvenance([
      { exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 86, directness: 0.24, weightShare: 0.35 },
      { exerciseName: "Pec Deck Fly", role: "primary", exercisePercentile: 60, directness: 0.9, weightShare: 0.65 },
    ], sources);
    // The more direct lift carried more of the rank, so it leads although it placed lower on its own.
    expect(entries.map((entry) => [entry.exerciseName, entry.weightShare])).toEqual([["Pec Deck Fly", 0.65], ["Barbell Bench Press", 0.35]]);
    // Without shares from the route the order falls back to placement.
    expect(rankProvenance([
      { exerciseName: "Pec Deck Fly", role: "primary", exercisePercentile: 60 },
      { exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 86 },
    ], sources).map((entry) => [entry.exerciseName, entry.weightShare])).toEqual([["Barbell Bench Press", null], ["Pec Deck Fly", null]]);
  });

  it("matches by catalog id first and by name otherwise", () => {
    const { sources } = muscleRankLiftSelection([{ ...bench, exerciseName: "barbell bench press" }], history, 90);
    expect(rankProvenance([{ exerciseName: "Barbell Bench Press", role: null, exercisePercentile: 50 }], sources)[0].lifts).toHaveLength(1);
  });
});

describe("Whether one record's lift is behind a rank", () => {
  const bench = { id: "device-bench", exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, bodyMassKgAtTest: 80, observedAt: "2026-09-12T12:00:00.000Z" };
  const pecDeck = { id: "device-pec", exerciseName: "Pec Deck Fly", loadKg: 40, repetitions: 10, observedAt: "2026-09-01T12:00:00.000Z" };
  const benchRank = [{ exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 86 }];

  it("counts the one lift sent for an exercise, and says another lift is not part of it", () => {
    const provenance = rankProvenance(benchRank, muscleRankLiftSelection([bench, pecDeck], history, 90).sources);
    expect(liftPartInRank(provenance, "device-bench")).toEqual({ considered: 1 });
    expect(liftPartInRank(provenance, "device-pec")).toBe(false);
  });

  it("says each of several lifts sent for one exercise was considered, since the server keeps only the best", () => {
    const provenance = rankProvenance(benchRank, muscleRankLiftSelection([
      { ...bench, id: "light", loadKg: 90, bodyMassKgAtTest: 70 },
      { ...bench, id: "heavy", loadKg: 100, bodyMassKgAtTest: 95, observedAt: "2026-08-01T12:00:00.000Z" },
    ], history, 90).sources);
    expect(liftPartInRank(provenance, "light")).toEqual({ considered: 2 });
    expect(liftPartInRank(provenance, "heavy")).toEqual({ considered: 2 });
  });

  it("says nothing when an exercise behind the rank cannot be traced to a lift sent, or nothing is traced", () => {
    const { sources } = muscleRankLiftSelection([bench, pecDeck], history, 90);
    // The rank names an exercise none of the sent lifts matches: this lift could be behind it.
    const untraced = rankProvenance([...benchRank, { exerciseName: "Machine Chest Press", role: "primary", exercisePercentile: 60 }], sources);
    expect(liftPartInRank(untraced, "device-bench")).toEqual({ considered: 1 });
    expect(liftPartInRank(untraced, "device-pec")).toBeNull();
    expect(liftPartInRank(rankProvenance([{ exerciseName: "Machine Chest Press", role: "primary", exercisePercentile: 60 }], sources), "device-bench")).toBeNull();
    expect(liftPartInRank([], "device-bench")).toBeNull();
  });
});

describe("The ranks kept on screen while new ones load", () => {
  const keyFor = (sex: string | null) => ({ queryKey: [["strengthProfile", "muscleRanks"], { input: { sex, lifts: [] }, type: "query" }] as const });

  it("keeps the previous answer for the same comparison group", () => {
    expect(previousRanksForSameGroup("male")({ status: "ok" }, keyFor("male"))).toEqual({ status: "ok" });
  });

  it("keeps nothing when the comparison group changed, or there was no previous request", () => {
    expect(previousRanksForSameGroup("female")({ status: "ok" }, keyFor("male"))).toBeUndefined();
    expect(previousRanksForSameGroup("male")(undefined, undefined)).toBeUndefined();
  });
});
