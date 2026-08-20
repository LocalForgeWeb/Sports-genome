import { describe, expect, it } from "vitest";
import { getGymTimeBudget, normalizeGymMinutes, timeAdjustedSetBand } from "./gymTimeBudget";

describe("gym time budget", () => {
  it("normalizes a rough available-time estimate to a supported planning window", () => {
    expect(normalizeGymMinutes(33)).toBe(30);
    expect(normalizeGymMinutes(68)).toBe(75);
    expect(getGymTimeBudget(45).recommendationLimit).toBe(4);
  });

  it("reduces short-window set targets and expands longer planning windows transparently", () => {
    expect(timeAdjustedSetBand("Athleticism", [10, 20], 30)).toEqual([5, 15]);
    expect(timeAdjustedSetBand("Athleticism", [10, 20], 90)).toEqual([14, 24]);
  });
});
