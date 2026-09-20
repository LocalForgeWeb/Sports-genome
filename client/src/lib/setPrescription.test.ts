import { describe, expect, it } from "vitest";
import {
  formatPrescription,
  parsePrescription,
  repsForSet,
  setCount,
  uniformReps,
  withSetCount,
  withSetReps,
  withUniformReps,
} from "@/lib/setPrescription";
import { getWorkoutDiagnostics } from "@/lib/workoutPlanner";
import type { Exercise } from "@/lib/exerciseCatalog";

const reps = (prescription: ReturnType<typeof parsePrescription>) => prescription.sets.map((set) => set.reps);

describe("reading a prescription", () => {
  it("reads the plain form as that many identical sets", () => {
    const parsed = parsePrescription("4 × 8–12");
    expect(reps(parsed)).toEqual(["8–12", "8–12", "8–12", "8–12"]);
    expect(parsed.varied).toBe(false);
    expect(uniformReps(parsed)).toBe("8–12");
  });

  /** The point of the change: a top set and two back-offs, in one exercise. */
  it("reads a slash list as one target per set", () => {
    const parsed = parsePrescription("3 × 10/8/6");
    expect(reps(parsed)).toEqual(["10", "8", "6"]);
    expect(parsed.varied).toBe(true);
    expect(uniformReps(parsed)).toBeNull();
  });

  it("accepts an x as well as a ×, because both get typed and pasted", () => {
    expect(reps(parsePrescription("2 x 5"))).toEqual(["5", "5"]);
  });

  /**
   * "3 × 8 / side" is one instruction about every set. Splitting it would silently
   * turn a bilateral cue into a second set of "side" reps.
   */
  it("does not treat a written qualifier as a per-set list", () => {
    const parsed = parsePrescription("3 × 8 / side");
    expect(reps(parsed)).toEqual(["8 / side", "8 / side", "8 / side"]);
    expect(parsed.varied).toBe(false);
  });

  it("keeps time and distance targets whole", () => {
    expect(reps(parsePrescription("3 × 40 m"))).toEqual(["40 m", "40 m", "40 m"]);
    expect(reps(parsePrescription("2 × 30 sec/20 sec"))).toEqual(["30 sec", "20 sec"]);
  });

  it("lets the written list win when the count disagrees with it", () => {
    // A hand edit can leave "3 × 10/8" behind; the list is the more specific statement.
    expect(reps(parsePrescription("3 × 10/8"))).toEqual(["10", "8"]);
  });

  it("falls back rather than producing an empty plan", () => {
    expect(reps(parsePrescription(""))).toEqual(["8–12", "8–12", "8–12"]);
    expect(reps(parsePrescription(undefined))).toEqual(["8–12", "8–12", "8–12"]);
    expect(reps(parsePrescription("as many as possible"))).toEqual(["as many as possible"]);
  });

  it("refuses an absurd set count rather than rendering 900 rows", () => {
    expect(setCount("900 × 5")).toBe(12);
  });
});

describe("writing a prescription back", () => {
  it("writes the plain form when every set matches", () => {
    expect(formatPrescription([{ reps: "5" }, { reps: "5" }, { reps: "5" }])).toBe("3 × 5");
  });

  it("writes a slash list when they differ", () => {
    expect(formatPrescription([{ reps: "10" }, { reps: "8" }, { reps: "6" }])).toBe("3 × 10/8/6");
  });

  it("round-trips both forms", () => {
    for (const value of ["4 × 8–12", "3 × 10/8/6", "5 × 3", "2 × 30 sec/20 sec"]) {
      expect(formatPrescription(parsePrescription(value).sets)).toBe(value);
    }
  });

  it("never writes a set with nothing in it", () => {
    expect(formatPrescription([{ reps: "  " }])).toBe("1 × 1");
    expect(formatPrescription([])).toBe("1 × 1");
  });
});

describe("editing sets", () => {
  it("copies the last set when adding one, because that is usually the intent", () => {
    const grown = withSetCount(parsePrescription("2 × 10/8"), 4);
    expect(reps(grown)).toEqual(["10", "8", "8", "8"]);
  });

  it("drops from the end when removing", () => {
    expect(reps(withSetCount(parsePrescription("4 × 10/8/6/6"), 2))).toEqual(["10", "8"]);
  });

  it("keeps at least one set and caps the list", () => {
    expect(withSetCount(parsePrescription("3 × 5"), 0).sets).toHaveLength(1);
    expect(withSetCount(parsePrescription("3 × 5"), 99).sets).toHaveLength(12);
  });

  it("varies a uniform plan by changing one set, and says so", () => {
    const varied = withSetReps(parsePrescription("3 × 8"), 0, "12");
    expect(reps(varied)).toEqual(["12", "8", "8"]);
    expect(varied.varied).toBe(true);
    expect(formatPrescription(varied.sets)).toBe("3 × 12/8/8");
  });

  it("goes back to uniform in one move, and writes the plain form again", () => {
    const back = withUniformReps(parsePrescription("3 × 10/8/6"), "8");
    expect(back.varied).toBe(false);
    expect(formatPrescription(back.sets)).toBe("3 × 8");
  });

  it("notices when edits happen to make every set match again", () => {
    let plan = parsePrescription("2 × 10/8");
    plan = withSetReps(plan, 1, "10");
    expect(plan.varied).toBe(false);
    expect(formatPrescription(plan.sets)).toBe("2 × 10");
  });
});

describe("what the rest of the app reads", () => {
  /**
   * Everything downstream reads the count before the `×`. If a varied prescription
   * broke that, the weekly volume map and the session estimate would quietly go wrong.
   */
  it("keeps the set count readable by the leading-number parsers", () => {
    expect("4 × 10/8/6/6".match(/^\s*(\d+)/)?.[1]).toBe("4");
    expect("4 × 10/8/6/6".match(/(\d+)\s*(?:x|×)/i)?.[1]).toBe("4");
  });

  it("gives the session estimate the same set count as a uniform plan", () => {
    const exercise = {
      id: 1, name: "Barbell Bench Press", sourceGroup: "t", category: "Compound", equipment: "Barbell",
      movement: "Horizontal press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], qualities: ["strength"],
      muscleGrade: "A", sportFit: { tennis: { grade: "B", movementHelp: "" }, basketball: { grade: "B", movementHelp: "" }, soccer: { grade: "B", movementHelp: "" }, baseball: { grade: "B", movementHelp: "" }, combat: { grade: "B", movementHelp: "" } },
    } as Exercise;
    const uniform = getWorkoutDiagnostics([exercise], { 1: "4 × 8" }, {}, "Max strength");
    const varied = getWorkoutDiagnostics([exercise], { 1: "4 × 10/8/6/6" }, {}, "Max strength");
    expect(varied.totalSets).toBe(uniform.totalSets);
  });

  it("tells the tracker what a given set is asking for", () => {
    expect(repsForSet("4 × 10/8/6/6", 0)).toBe("10");
    expect(repsForSet("4 × 10/8/6/6", 2)).toBe("6");
    expect(repsForSet("3 × 8–12", 1)).toBe("8–12");
    // Past the end, the last set is the sensible answer rather than a blank.
    expect(repsForSet("2 × 10/8", 5)).toBe("8");
  });
});
