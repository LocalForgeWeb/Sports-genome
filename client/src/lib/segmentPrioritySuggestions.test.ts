import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { getSegmentPrioritySuggestions } from "./segmentPrioritySuggestions";

describe("segment-priority exercise suggestions", () => {
  it("returns optional direct lateral-deltoid candidates that are absent from the active day and respect equipment", () => {
    const active = exercises.find((exercise) => exercise.name === "Dumbbell Lateral Raise") || exercises[0];
    const suggestions = getSegmentPrioritySuggestions(
      { muscle: "deltoid_lateral", family: "Deltoid", status: "review", contributingExercises: [active.name], confidence: "medium", rationale: "Review", boundary: "Boundary" },
      [active.id],
      exercises,
      ["Dumbbell"],
    );
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((suggestion) => suggestion.exerciseId !== active.id)).toBe(true);
    expect(suggestions.every((suggestion) => suggestion.equipment.toLowerCase().startsWith("dumbbell"))).toBe(true);
    expect(suggestions.every((suggestion) => suggestion.targetMuscle === "deltoid_lateral")).toBe(true);
  });

  it("does not propose additions for segments that are progressing or lack enough data", () => {
    const base = { muscle: "deltoid_anterior", family: "Deltoid", contributingExercises: [], confidence: "low" as const, rationale: "", boundary: "" };
    expect(getSegmentPrioritySuggestions({ ...base, status: "progressing" }, [], exercises)).toEqual([]);
    expect(getSegmentPrioritySuggestions({ ...base, status: "insufficient_data" }, [], exercises)).toEqual([]);
  });
});
