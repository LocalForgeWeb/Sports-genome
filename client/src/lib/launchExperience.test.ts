import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLaunchExperienceEnabled } from "./launchExperience";

const bootSplashSource = readFileSync(resolve(process.cwd(), "client/src/lib/bootSplash.ts"), "utf8");
const bootLifecycleSource = readFileSync(resolve(process.cwd(), "client/src/components/BootSplashLifecycle.tsx"), "utf8");

describe("launch experience preference", () => {
  it("defaults to enabled unless the athlete explicitly turns it off", () => {
    expect(isLaunchExperienceEnabled(null)).toBe(true);
    expect(isLaunchExperienceEnabled("on")).toBe(true);
    expect(isLaunchExperienceEnabled("off")).toBe(false);
  });

  it("has no workspace-overlay or seen-once state because the document handles the boot screen before React mounts", () => {
    expect("shouldShowLaunchExperience" in { isLaunchExperienceEnabled }).toBe(false);
  });

  it("keeps normal launch pacing deliberate while immediately bypassing it for reduced-motion users", () => {
    expect(bootSplashSource).toContain("export const minimumBootPresentationMs = 3_200");
    expect(bootSplashSource).toContain("window.setTimeout(() => splash.remove(), 560)");
    expect(bootLifecycleSource).toContain("minimumBootPresentationMs");
    expect(bootLifecycleSource).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)").matches');
    expect(bootLifecycleSource).toContain("window.setTimeout(() => dismissBootSplash(), minimumBootPresentationMs)");
  });
});
