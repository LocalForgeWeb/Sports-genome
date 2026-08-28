import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const bootLifecycle = readFileSync(resolve(process.cwd(), "client/src/components/BootSplashLifecycle.tsx"), "utf8");
const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const documentShell = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("silent document boot screen", () => {
  it("is a deep-navy pre-React visual treatment with no audio and reduced-motion suppression", () => {
    expect(documentShell).toContain('id="sports-genome-boot-splash"');
    expect(documentShell).toContain('background:#07182e');
    expect(documentShell).toContain('data-sports-genome-boot');
    expect(documentShell).toContain('@media (prefers-reduced-motion:reduce)');
    expect(documentShell).not.toMatch(/<audio|new Audio|AudioContext/i);
    expect(documentShell.indexOf('sports-genome-boot-splash')).toBeLessThan(documentShell.indexOf('id="root"'));
    expect(bootLifecycle).toContain("dismissBootSplash");
  });

  it("keeps a More setting that controls the next document boot and never renders an app-layer launch overlay", () => {
    expect(home).toContain("Launch video");
    expect(home).toContain("Play video while app opens");
    expect(home).toContain("Preview intro video");
    expect(home).toContain("Your supplied visual plays silently");
	    expect(home).toContain("plays silently");
    expect(home).toContain("replayBootSplash()");
    expect(home).not.toContain("showLaunchExperience");
    expect(home).not.toContain("<LaunchExperience");
  });
});
