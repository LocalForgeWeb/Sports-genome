import { describe, expect, it } from "vitest";
import { boundedQuizStep, convertBodyWeight } from "./AthleteBaselineQuiz";

describe("Athlete Baseline quiz navigation", () => {
  it("keeps Back and Continue navigation inside the available quiz steps", () => {
    expect(boundedQuizStep(-3)).toBe(0);
    expect(boundedQuizStep(3)).toBe(3);
    expect(boundedQuizStep(99)).toBe(10);
  });

  it("converts an entered optional bodyweight instead of silently reinterpreting it when the unit changes", () => {
    expect(convertBodyWeight(200, "lb", "kg")).toBe(90.7);
    expect(convertBodyWeight(90.7, "kg", "lb")).toBe(200);
    expect(convertBodyWeight(200, "lb", "lb")).toBe(200);
  });
});
