import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { setEntryFieldsFor, usesHeight } from "./setEntryFields";

const shapeOf = (name: string) =>
  setEntryFieldsFor(exercises.find((exercise) => exercise.name === name)).map((field) => `${field.label} (${field.unit})`);

describe("what a set actually records", () => {
  // Reported: "the non weighted box jump is having me select weight and reps,
  // it should be height and reps, and the weighted one should be weight height
  // and reps."
  it("asks a plain box jump for the box height and nothing about weight", () => {
    expect(shapeOf("Box Jump")).toEqual(["Box height (in)"]);
    expect(shapeOf("Depth Jump")).toEqual(["Box height (in)"]);
    expect(shapeOf("Single-Leg Box Jump")).toEqual(["Box height (in)"]);
  });

  it("asks a weighted box jump for both the added load and the box", () => {
    expect(shapeOf("Weighted Box Jump")).toEqual(["Added weight (lb)", "Box height (in)"]);
  });

  it("keeps the load box on a step-up done holding weight or on a cable", () => {
    // These are box exercises too, but the load is the number driving them —
    // dropping it to show only a height would lose the point of the exercise.
    expect(shapeOf("Step-Up")).toEqual(["Weight (lb)", "Box height (in)"]);
    expect(shapeOf("Cable Step-Up")).toEqual(["Weight (lb)", "Box height (in)"]);
  });

  it("calls load on bodyweight work added weight, where empty is the normal case", () => {
    const [pullUp] = setEntryFieldsFor(exercises.find((exercise) => exercise.name === "Pull-Up"));
    expect(pullUp).toMatchObject({ label: "Added weight", optional: true });
    const [plank] = setEntryFieldsFor(exercises.find((exercise) => exercise.name === "Side Plank"));
    expect(plank).toMatchObject({ label: "Added weight", optional: true });
  });

  it("leaves an ordinary barbell or machine lift exactly as it was", () => {
    expect(shapeOf("Barbell Hip Thrust")).toEqual(["Weight (lb)"]);
    expect(shapeOf("Hack Squat")).toEqual(["Weight (lb)"]);
    expect(shapeOf("Barbell Bench Press")).toEqual(["Weight (lb)"]);
  });

  it("invents a unit for nothing it is unsure about", () => {
    // Everything outside the narrow named cases keeps the plain weight box.
    const heightUsers = exercises.filter((exercise) => usesHeight(exercise)).map((exercise) => exercise.name).sort();
    expect(heightUsers).toEqual([
      "Box Jump", "Cable Lateral Step-Up", "Cable Step-Up", "Depth Jump",
      "Explosive Step-Up", "Peterson Step-Up", "Single-Leg Box Jump", "Step-Up", "Weighted Box Jump",
    ]);
  });

  it("falls back to a plain weight box for an exercise it cannot find", () => {
    expect(setEntryFieldsFor(undefined)).toEqual([{ measure: "weight", label: "Weight", unit: "lb", optional: false }]);
  });
});
