import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const launchComponent = readFileSync(resolve(process.cwd(), "client/src/components/LaunchExperience.tsx"), "utf8");
const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const launchStyles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("silent launch experience", () => {
  it("offers immediate skip and responds to reduced-motion preferences without audio playback", () => {
    expect(launchComponent).toContain("Skip intro");
    expect(launchComponent).toContain("prefers-reduced-motion: reduce");
    expect(launchComponent).not.toMatch(/<audio|new Audio|AudioContext/i);
    expect(launchComponent).toContain("launch-experience-underlay");
    expect(launchComponent).toContain("launch-experience-replay");
    expect(launchComponent).toContain("if (interactive) skipButtonRef.current?.focus()");
  });

  it("keeps a visible More setting for disabling and replaying the first-entry experience", () => {
    expect(home).toContain("Launch experience");
    expect(home).toContain("Show on first entry");
    expect(home).toContain("Replay intro");
    expect(home).toContain("there is no audio");
    expect(home).toContain("prefers-reduced-motion: reduce");
    expect(home).toContain("interactive");
  });

  it("keeps the automatic transition compact so the underlying app remains available", () => {
    expect(launchStyles).toContain(".launch-experience-underlay { pointer-events: none; position: fixed; top:");
    expect(launchStyles).toContain("height: min(220px, 31vh)");
  });
});
