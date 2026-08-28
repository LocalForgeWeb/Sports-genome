import { describe, expect, it } from "vitest";
import { isLaunchExperienceEnabled, shouldShowLaunchExperience } from "./launchExperience";

describe("launch experience preference", () => {
  it("defaults to enabled unless the athlete explicitly turns it off", () => {
    expect(isLaunchExperienceEnabled(null)).toBe(true);
    expect(isLaunchExperienceEnabled("on")).toBe(true);
    expect(isLaunchExperienceEnabled("off")).toBe(false);
  });

  it("runs only for an enabled first entry", () => {
    expect(shouldShowLaunchExperience(true, false)).toBe(true);
    expect(shouldShowLaunchExperience(true, true)).toBe(false);
    expect(shouldShowLaunchExperience(false, false)).toBe(false);
    expect(shouldShowLaunchExperience(true, false, true)).toBe(false);
  });
});
