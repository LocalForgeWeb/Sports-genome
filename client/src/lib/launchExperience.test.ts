import { describe, expect, it } from "vitest";
import { isLaunchExperienceEnabled } from "./launchExperience";

describe("launch experience preference", () => {
  it("defaults to enabled unless the athlete explicitly turns it off", () => {
    expect(isLaunchExperienceEnabled(null)).toBe(true);
    expect(isLaunchExperienceEnabled("on")).toBe(true);
    expect(isLaunchExperienceEnabled("off")).toBe(false);
  });

  it("has no workspace-overlay or seen-once state because the document handles the boot screen before React mounts", () => {
    expect("shouldShowLaunchExperience" in { isLaunchExperienceEnabled }).toBe(false);
  });
});
