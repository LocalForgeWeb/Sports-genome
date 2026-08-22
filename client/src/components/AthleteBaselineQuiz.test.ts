import { describe, expect, it } from "vitest";
import { boundedQuizStep } from "./AthleteBaselineQuiz";

describe("Athlete Baseline quiz navigation", () => {
  it("keeps Back and Continue navigation inside the available quiz steps", () => {
    expect(boundedQuizStep(-3)).toBe(0);
    expect(boundedQuizStep(3)).toBe(3);
    expect(boundedQuizStep(99)).toBe(10);
  });
});
