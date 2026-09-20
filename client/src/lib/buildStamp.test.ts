import { describe, expect, it } from "vitest";
import { buildStamp, buildStampLabel } from "@/lib/buildStamp";

describe("buildStamp", () => {
  it("never throws when the define was not applied, so a stray build still renders", () => {
    // The declare'd global is absent in the test environment, which is exactly
    // the case that must degrade to a label rather than a blank screen.
    expect(() => buildStamp()).not.toThrow();
    expect(buildStamp().commit).toBe("unknown");
  });
});

describe("buildStampLabel", () => {
  it("names the commit, so two devices can be compared in one glance", () => {
    expect(buildStampLabel({ commit: "a1b2c3d", builtAt: "2026-09-19T04:00:00.000Z" })).toContain("a1b2c3d");
  });

  it("carries the build date, which is what tells a stale device from a current one", () => {
    const label = buildStampLabel({ commit: "a1b2c3d", builtAt: "2026-09-19T04:00:00.000Z" });
    expect(label).toMatch(/2026/);
  });

  it("says so plainly when there is no stamp, rather than printing a broken date", () => {
    expect(buildStampLabel({ commit: "unknown", builtAt: "" })).toBe("Build unknown");
  });

  it("drops the date rather than rendering an invalid one", () => {
    expect(buildStampLabel({ commit: "a1b2c3d", builtAt: "not-a-date" })).toBe("Build a1b2c3d");
  });
});
