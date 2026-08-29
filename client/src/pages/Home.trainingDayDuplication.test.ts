import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Training Day duplicate prescriptions", () => {
  it("creates a distinct entry with a retained catalog identity rather than rejecting a deliberate duplicate", () => {
    expect(source).toContain("const duplicateWorkoutEntry");
    expect(source).toContain("catalogExerciseId: catalogExerciseIdFor(exercise)");
    expect(source).toContain("const duplicateExercise =");
    expect(source).toContain("setCustomWorkout((current) => [...current, duplicate])");
    expect(source).toContain("[duplicate.id]: prescription");
  });

  it("serializes catalog-backed duplicate records alongside legacy plan IDs so working and test variants restore separately", () => {
    expect(source).toContain("customWorkoutEntries: serializeWorkoutEntries(customWorkout)");
    expect(source).toContain("weeklyPlanEntries:");
    expect(source).toContain("const fromEntries =");
    expect(source).toContain("catalogExerciseId: entry.catalogExerciseId");
  });

  it("bridges the explicit row action to the Training Day duplicate mutation without changing catalog add behavior", () => {
    expect(source).toContain('window.addEventListener("duplicate-training-exercise", duplicateFromPrescription)');
    expect(source).toContain("if (current.some((item) => catalogExerciseIdFor(item) === exercise.id))");
  });

  it("never clears the active Push stack when an athlete reselects the already active Training Day", () => {
    expect(source).toContain("if (index === activeDayIndex && day === activeSplitDay) return;");
  });

  it("recovers a saved active Push stack when a prior session persisted an empty active snapshot", () => {
    expect(source).toContain("if (index === activeDayIndex && day === activeSplitDay && !customWorkout.length && saved?.length)");
    expect(source).toContain('toast("Saved day restored"');
  });
});
