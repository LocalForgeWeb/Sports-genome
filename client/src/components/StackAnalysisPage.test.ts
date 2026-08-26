import { describe, expect, it } from "vitest";
import { resolveStackMuscleSelection } from "./StackAnalysisPage";

describe("Stack Analysis selected muscle", () => {
  it("keeps a valid selected muscle and resets to the leading current muscle when the workout changes", () => {
    expect(resolveStackMuscleSelection("chest", ["chest", "triceps"])).toBe("chest");
    expect(resolveStackMuscleSelection("chest", ["hamstrings", "glutes"])).toBe("hamstrings");
    expect(resolveStackMuscleSelection("chest", [])).toBe("");
  });
});
