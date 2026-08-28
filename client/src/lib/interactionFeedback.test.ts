import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./interactionFeedback.ts", import.meta.url), "utf8");

describe("interaction feedback fallback", () => {
  it("uses vibration only when the browser supports it and keeps failure non-blocking", () => {
    expect(source).toContain('typeof navigator === "undefined"');
    expect(source).toContain('typeof navigator.vibrate !== "function"');
    expect(source).toContain("navigator.vibrate(pattern)");
    expect(source).toContain("interaction remains fully functional");
    expect(source).toContain("Safari may ignore this API");
  });
});
