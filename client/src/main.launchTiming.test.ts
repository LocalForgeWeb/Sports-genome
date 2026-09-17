import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");

describe("launch workspace timing", () => {
  it("defers the heavy workspace import until the video intro reaches its held final frame", () => {
    expect(source).not.toContain('import App from "./App"');
    expect(source).toContain('const { default: App } = await import("./App")');
    // The deferral protects the intro video from chunk-evaluation jank. A returning
    // launch plays no video, so it waits for nothing.
    expect(source).toContain("Math.max(0, 1_580 - elapsedBootMs)");
    expect(source).toContain("returningLaunch ? 0 :");
    expect(source).toContain("window.setTimeout(() => { void mountWorkspace(); }, workspaceMountDelayMs)");
  });
});
