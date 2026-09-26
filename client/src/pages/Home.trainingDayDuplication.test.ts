import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { commitDay, emptyDayStore, loadDay } from "@/lib/trainingDayPlan";
import type { Exercise } from "@/lib/exerciseCatalog";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

const exercise = (id: number, name: string): Exercise => ({
  id,
  name,
  sourceGroup: "test",
  category: "Compound",
  equipment: "Barbell",
  movement: "Horizontal press",
  primaryMuscles: ["chest"],
  secondaryMuscles: ["triceps"],
  qualities: ["strength"],
  muscleGrade: "A",
  sportFit: {
    tennis: { grade: "B", movementHelp: "" },
    basketball: { grade: "B", movementHelp: "" },
    soccer: { grade: "B", movementHelp: "" },
    baseball: { grade: "B", movementHelp: "" },
    combat: { grade: "B", movementHelp: "" },
  },
});

describe("Training Day duplicate prescriptions", () => {
  it("creates a distinct entry with a retained catalog identity rather than rejecting a deliberate duplicate", () => {
    expect(source).toContain("const duplicateWorkoutEntry");
    expect(source).toContain("catalogExerciseId: catalogExerciseIdFor(exercise)");
    expect(source).toContain("const duplicateExercise =");
    expect(source).toContain("setCustomWorkout((current) => [...current, duplicate])");
    expect(source).toContain("[duplicate.id]: prescription");
  });

  it("serializes catalog-backed duplicate records alongside legacy plan IDs so working and test variants restore separately", () => {
    expect(source).toContain("customWorkoutEntries: serializeWorkoutEntries(draft.workout)");
    expect(source).toContain("weeklyPlanEntries:");
    expect(source).toContain("const fromEntries =");
    expect(source).toContain("catalogExerciseId: entry.catalogExerciseId");
  });

  it("keeps a duplicated entry's own prescription when its day is saved and read back", () => {
    const bench = exercise(1, "Barbell Bench Press");
    const duplicate = { ...bench, id: -1701, catalogExerciseId: bench.id } as Exercise;
    const store = commitDay(emptyDayStore(), "0-Push", {
      workout: [bench, duplicate],
      prescriptions: { [bench.id]: "4 × 5", [duplicate.id]: "2 × 12" },
      settings: {},
    });
    const restored = loadDay(store, "0-Push");
    expect(restored.workout).toHaveLength(2);
    expect(restored.prescriptions[bench.id]).toBe("4 × 5");
    expect(restored.prescriptions[duplicate.id]).toBe("2 × 12");
  });

  it("bridges the explicit row action to the Training Day duplicate mutation without changing catalog add behavior", () => {
    expect(source).toContain('window.addEventListener("duplicate-training-exercise", duplicateFromPrescription)');
    expect(source).toContain("if (current.some((item) => catalogExerciseIdFor(item) === exercise.id))");
  });

  /**
   * The active stack used to be a second copy of a day living beside the week, and the two
   * could disagree - which is why reselecting the day you were already on could blank it,
   * and why an empty active snapshot needed a recovery path. There is one copy now.
   */
  it("does nothing when an athlete reselects the day they are already on", () => {
    expect(source).toContain("if (!slot || slot.key === activeSlot.key) return false;");
  });

  it("stores a day's exercises, prescriptions and effort under that day, so no day can be read off another", () => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [exercise(1, "Bench")], prescriptions: { 1: "4 × 5" }, settings: {} });
    store = commitDay(store, "1-Pull", { workout: [exercise(2, "Row")], prescriptions: { 2: "3 × 10" }, settings: {} });
    expect(loadDay(store, "1-Pull").prescriptions[1]).toBeUndefined();
    expect(loadDay(store, "0-Push").prescriptions[1]).toBe("4 × 5");
    expect(source).toContain("setDayStore((current) => commitDay(current, key, { workout: customWorkout, prescriptions, settings: exerciseSettings }));");
  });
});
