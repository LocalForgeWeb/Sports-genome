import { describe, expect, it } from "vitest";
import {
  displayPrescription,
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
    // A prescription that names no set count still has to offer the logger some
    // number of rows; three is what every surface has always assumed.
    expect(reps(parsePrescription("as many as possible"))).toEqual(["as many as possible", "as many as possible", "as many as possible"]);
  });

  /**
   * Reading is not editing. Clamping here silently rewrote a pasted "20 × 15" down
   * to twelve sets and disagreed with the weekly volume map, which reads the leading
   * number straight. The cap belongs to the editor, which is the only thing that has
   * to draw a control per set.
   */
  it("reports what was written, however many sets that is", () => {
    expect(setCount("20 × 15")).toBe(20);
    expect(setCount("900 × 5")).toBe(900);
  });

  it("caps the count only where controls are built for it", () => {
    expect(withSetCount(parsePrescription("20 × 15"), 20).sets).toHaveLength(12);
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

  it("writes the per-set form as soon as the targets differ, asked for or not", () => {
    const edited = withSetReps(parsePrescription("3 × 8"), 0, "12");
    expect(reps(edited)).toEqual(["12", "8", "8"]);
    // There is no other way to say three different things, so the flag is not consulted.
    expect(formatPrescription(edited.sets)).toBe("3 × 12/8/8");
  });

  it("goes back to uniform in one move, and writes the plain form again", () => {
    const back = withUniformReps(parsePrescription("3 × 10/8/6"), "8");
    expect(back.varied).toBe(false);
    expect(formatPrescription(back.sets)).toBe("3 × 8");
  });

  /**
   * `varied` is a statement about how the prescription is written, not about whether
   * the numbers happen to agree. When it meant the latter, editing the last set to
   * match the others yanked the per-set fields away mid-edit, and the athlete's
   * choice to write it set by set was lost on the next reload.
   */
  it("keeps the per-set form when edits happen to make every set agree", () => {
    let plan = parsePrescription("2 × 10/8");
    expect(plan.varied).toBe(true);
    plan = withSetReps(plan, 1, "10");
    expect(plan.varied).toBe(true);
    expect(formatPrescription(plan.sets, plan.varied)).toBe("2 × 10/10");
    // ...and a reader still sees the plain form.
    expect(displayPrescription("2 × 10/10")).toBe("2 × 10");
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

/**
 * The invariant the editor rests on. When it did not hold, typing the "-" of "12-15"
 * into one set's field collapsed the whole plan into a single shared field holding
 * "10/12-/6", and the next keystroke re-joined that with slashes and doubled it.
 */
describe("anything written can be read back the same shape", () => {
  const awkward = [
    "12-", "12–", "8-12", "", "   ", "8 / side", "/5", "10/8", "as many as possible",
    "30 sec", "40 m", "AMRAP", "5x5", "8—12", "1.5", "½", "12 ", " 8", "8//12", "rep out",
  ];

  it("keeps the set count through a write and a read, whatever is in the fields", () => {
    for (const value of awkward) {
      for (const count of [1, 2, 3, 12]) {
        const sets = Array.from({ length: count }, () => ({ reps: value }));
        for (const varied of [false, true]) {
          const written = formatPrescription(sets, varied);
          const read = parsePrescription(written);
          expect(read.sets.length, `"${value}" x${count} (varied=${varied}) -> ${written}`).toBe(count);
        }
      }
    }
  });

  it("keeps a mixed plan's targets through a write and a read", () => {
    const sets = [{ reps: "12-" }, { reps: "8–12" }, { reps: "6" }];
    const written = formatPrescription(sets, true);
    expect(parsePrescription(written).sets.map((set) => set.reps)).toEqual(["12-", "8–12", "6"]);
  });

  it("never lets a typed slash become a set boundary", () => {
    // "/" is this module's delimiter, so it cannot also be someone's rep target.
    expect(parsePrescription(formatPrescription([{ reps: "8 / side" }, { reps: "6" }], true)).sets).toHaveLength(2);
    expect(formatPrescription([{ reps: "10/5" }, { reps: "8" }], true)).toBe("2 × 10 5/8");
  });

  it("carries a trailing unit back across the sets that share it", () => {
    // "3 × 30/20/10 sec" is how a person writes it; reading it literally gave the
    // first two sets a bare number and the live card said "Set 1 of 3 · 30".
    expect(parsePrescription("3 × 30/20/10 sec").sets.map((set) => set.reps)).toEqual(["30 sec", "20 sec", "10 sec"]);
  });
});
