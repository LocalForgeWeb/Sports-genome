import { describe, expect, it } from "vitest";
import { analyzeSplitStack } from "./splitStackAnalysis";
import type { Exercise } from "./exerciseCatalog";

const exercise = (id: number, primaryMuscles: string[], secondaryMuscles: string[] = []): Exercise => ({ id, name: `Exercise ${id}`, category: "Chest & push", primaryMuscles, secondaryMuscles, movement: "Horizontal push", equipment: "Cable", qualities: ["Strength"], sportFit: { Boxing: "B" } });

describe("split stack analysis", () => {
  it("only scores muscles required by the selected split and flags missing Push coverage", () => {
    const analysis = analyzeSplitStack([exercise(1, ["chest"]), exercise(2, ["chest"]), exercise(5, ["chest"])], [exercise(3, ["triceps"]), exercise(4, ["frontDelts"])], "Push");
    expect(analysis.ratings.every((rating) => ["chest", "frontDelts", "triceps", "sideDelts", "serratusAnterior"].includes(rating.muscle))).toBe(true);
    expect(analysis.gaps.some((rating) => rating.muscle === "triceps")).toBe(true);
    expect(analysis.suggestions.find((suggestion) => suggestion.muscle === "triceps")?.candidate.primaryMuscles).toContain("triceps");
    expect(analysis.suggestions.find((suggestion) => suggestion.muscle === "triceps")?.replaceExercise?.primaryMuscles).toContain("chest");
  });

  it("declares fixed catalog coverage weights as a planning model rather than activation data", () => {
    const analysis = analyzeSplitStack([], [], "Push");
    expect(analysis.boundary).toMatch(/measure activation/i);
  });

  it("recommends only split-compatible candidates when a Push target muscle is missing", () => {
    const lowerBodyTaggedTriceps = { ...exercise(30, ["triceps"]), category: "Knee dominant", movement: "Split squat" };
    const pushTricepsOption = { ...exercise(31, ["triceps"]), category: "Arms & push", movement: "Cable pressdown" };
    const chestAndFrontDeltWork = [exercise(40, ["chest", "frontDelts"]), exercise(41, ["chest", "frontDelts"])];
    const analysis = analyzeSplitStack(chestAndFrontDeltWork, [lowerBodyTaggedTriceps, pushTricepsOption], "Push");
    expect(analysis.suggestions.find((suggestion) => suggestion.muscle === "triceps")?.candidate.id).toBe(31);
  });
});
