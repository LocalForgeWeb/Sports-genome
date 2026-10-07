import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { usesBarbellPlates } from "./utilityTools";

const of = (name: string) => { const exercise = exercises.find((item) => item.name === name); if (!exercise) throw new Error(name); return usesBarbellPlates(exercise.equipment, exercise.name); };

describe("where Load the bar is offered", () => {
  it("offers it for lifts loaded with plates on both ends of a bar", () => {
    for (const name of ["Barbell Bench Press", "Back Squat", "Front Squat", "Conventional Deadlift", "Romanian Deadlift", "Push Press", "EZ-Bar Curl", "Trap-Bar Deadlift", "Safety-Bar Squat", "Zercher Deadlift", "Sumo Deadlift"]) expect(of(name), name).toBe(true);
  });
  it("does not offer it for dumbbells, machines, cables, landmines, jumps or one-sided work", () => {
    for (const name of ["Goblet Squat", "Lat Pulldown", "Box Jump", "Hack Squat", "T-Bar Row", "Single-Leg Romanian Deadlift", "Hammer Curl", "Pallof Press", "Smith Machine Romanian Deadlift", "Farmer’s Walk"]) expect(of(name), name).toBe(false);
  });
});
