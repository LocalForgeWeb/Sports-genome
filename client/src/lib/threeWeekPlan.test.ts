import { describe, expect, it } from "vitest";
import { nextWeekToGenerate, visibleWeeks } from "./threeWeekPlan";

describe("three-week planning helpers", () => {
  it("keeps the active week visible and orders the three week labels", () => {
    expect(visibleWeeks([3, 1, 1], 2)).toEqual([1, 2, 3]);
  });

  it("offers the next ungenerated week while respecting the three-week cap", () => {
    expect(nextWeekToGenerate([], 1)).toBe(2);
    expect(nextWeekToGenerate([2], 1)).toBe(3);
    expect(nextWeekToGenerate([1, 2, 3], 2)).toBeUndefined();
  });
});
