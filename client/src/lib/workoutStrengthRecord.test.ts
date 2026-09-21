import { describe, expect, it } from "vitest";
import { strengthRegionIdsForExerciseName, workoutStrengthObservations } from "./workoutStrengthRecord";
import { strengthRegionIdsForCatalogMuscles } from "../../../shared/strengthGenomeDefinitions";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";
import { recordBodyWeight } from "./bodyWeightLog";

const set = (weight: string, reps: string, extra: Partial<{ completed: boolean; skipped: boolean; height: string }> = {}) =>
  ({ weight, reps, height: "", completed: true, skipped: false, ...extra });

const session = (over: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession => ({
  id: "s1",
  title: "Legs workout",
  dayLabel: "Week 1 · Legs",
  startedAt: "2026-09-15T18:00:00.000Z",
  completedAt: "2026-09-15T19:00:00.000Z",
  status: "completed",
  exercises: [{ id: "hack-squat", exerciseName: "Hack Squat", plannedPrescription: "3 × 8–12", sets: [set("205", "10"), set("245", "8"), set("225", "12")] }],
  ...over,
});

describe("carrying a finished workout into the Strength Genome", () => {
  it("records one observation per exercise: the heaviest logged set, with the rest counted", () => {
    const [observation, ...rest] = workoutStrengthObservations([session()]);
    expect(rest).toHaveLength(0);
    expect(observation.exerciseName).toBe("Hack Squat");
    expect(observation.repetitions).toBe(8);
    expect(observation.setCount).toBe(3);
    expect(observation.source).toBe("workout");
    expect(observation.sessionLabel).toBe("Week 1 · Legs");
    // 245 lb, to kilograms.
    expect(observation.loadKg).toBeCloseTo(111.13, 1);
  });

  it("breaks a tie on load by reps, so the harder set of the same weight is the one kept", () => {
    const [observation] = workoutStrengthObservations([session({
      exercises: [{ id: "a", exerciseName: "Hack Squat", plannedPrescription: "2 × 8", sets: [set("225", "8"), set("225", "12")] }],
    })]);
    expect(observation.repetitions).toBe(12);
  });

  it("calls a working set a working set — never a measured maximum", () => {
    expect(workoutStrengthObservations([session()])[0].measurementType).toBe("MULTI_REP");
  });

  it("ignores sessions still running, and sets that were skipped or never logged", () => {
    expect(workoutStrengthObservations([session({ status: "active" })])).toHaveLength(0);
    const partial = workoutStrengthObservations([session({
      exercises: [{ id: "a", exerciseName: "Hack Squat", plannedPrescription: "3 × 8", sets: [
        set("400", "5", { skipped: true }),
        set("500", "5", { completed: false }),
        set("225", "10"),
      ] }],
    })]);
    expect(partial[0].loadKg).toBeCloseTo(102.06, 1);
  });

  it("keeps an unloaded exercise on the record without inventing a weight for it", () => {
    const [observation] = workoutStrengthObservations([session({
      exercises: [{ id: "a", exerciseName: "Box Jump", plannedPrescription: "3 × 5", sets: [set("", "5", { height: "30" })] }],
    })]);
    expect(observation.loadKg).toBeUndefined();
    expect(observation.repetitions).toBe(5);
  });

  it("drops an exercise with nothing recorded rather than logging an empty entry", () => {
    expect(workoutStrengthObservations([session({
      exercises: [{ id: "a", exerciseName: "Hack Squat", plannedPrescription: "3 × 8", sets: [set("", "")] }],
    })])).toHaveLength(0);
  });

  it("returns newest first across sessions", () => {
    const older = session({ id: "s0", completedAt: "2026-09-08T19:00:00.000Z" });
    expect(workoutStrengthObservations([older, session()]).map((o) => o.observedAt))
      .toEqual(["2026-09-15T19:00:00.000Z", "2026-09-08T19:00:00.000Z"]);
  });

  it("reads the athlete's own unit rather than assuming pounds", () => {
    expect(workoutStrengthObservations([session()], "kg")[0].loadKg).toBe(245);
  });
});

describe("routing a logged exercise to the muscle groups it trains", () => {
  it("prefers the reviewed alias route where one exists", () => {
    expect(strengthRegionIdsForExerciseName("Back Squat")).toEqual(["quadriceps", "glutes", "hamstrings"]);
  });

  it("falls back to the catalog's own primary muscles for everything else", () => {
    // The alias list never named these, which is why a whole logged leg day used
    // to leave the body map empty.
    expect(strengthRegionIdsForExerciseName("Hack Squat")).toContain("quadriceps");
    expect(strengthRegionIdsForExerciseName("Seated Leg Curl")).toContain("hamstrings");
    expect(strengthRegionIdsForExerciseName("Standing Calf Raise")).toContain("calves");
  });

  it("uses primary muscles only, so one lift does not light up the whole body", () => {
    expect(strengthRegionIdsForExerciseName("Hack Squat").length).toBeLessThanOrEqual(3);
  });

  it("returns nothing for a name the app does not know, rather than guessing a region", () => {
    expect(strengthRegionIdsForExerciseName("Interpretive Dance")).toEqual([]);
  });

  it("maps every muscle the catalog actually uses except the ones with no region of their own", () => {
    expect(strengthRegionIdsForCatalogMuscles(["quads", "glutes"])).toEqual(["glutes", "quadriceps"]);
    expect(strengthRegionIdsForCatalogMuscles(["feet"])).toEqual([]);
  });
});

describe("stamping a session with the weight in effect that day", () => {
  it("uses the weight from the session's own date, not the athlete's current weight", () => {
    let log = recordBodyWeight([], 200, "lb", "2026-09-01T12:00:00.000Z");
    log = recordBodyWeight(log, 180, "lb", "2026-09-20T12:00:00.000Z");
    // The session is on the 15th, between the two weigh-ins.
    const [observation] = workoutStrengthObservations([session()], "lb", log);
    expect(observation.bodyMassKgAtTest).toBeCloseTo(90.72, 1);
  });

  it("leaves body mass unset for a session that predates any weigh-in", () => {
    const log = recordBodyWeight([], 180, "lb", "2026-12-01T12:00:00.000Z");
    expect(workoutStrengthObservations([session()], "lb", log)[0].bodyMassKgAtTest).toBeUndefined();
    expect(workoutStrengthObservations([session()], "lb", [])[0].bodyMassKgAtTest).toBeUndefined();
  });

  /**
   * The weight stamped when the session was finished covers the days the log does not reach.
   * Without it the panel fell through to whatever the profile said *now*, so a weight edited
   * months later quietly rewrote what an old workout had been measured against.
   */
  it("falls back to the weight stamped when the session was finished", () => {
    const stamped = { ...session(), bodyMassKgAtCompletion: 84 };
    expect(workoutStrengthObservations([stamped], "lb", [])[0].bodyMassKgAtTest).toBe(84);
  });

  it("prefers the dated weigh-in over the completion stamp when the log covers that day", () => {
    const log = recordBodyWeight([], 200, "lb", "2026-09-01T12:00:00.000Z");
    const stamped = { ...session(), bodyMassKgAtCompletion: 60 };
    expect(workoutStrengthObservations([stamped], "lb", log)[0].bodyMassKgAtTest).toBeCloseTo(90.72, 1);
  });
});
