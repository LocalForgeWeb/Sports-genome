import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./mobile-navigation.css", import.meta.url), "utf8");

describe("mobile contextual navigation styling", () => {
  it("keeps contextual tabs readable, horizontally discoverable, and touch-safe", () => {
    expect(source).toContain("overflow-x: auto");
    expect(source).toContain("overscroll-behavior-x: contain");
    expect(source).toContain("scroll-snap-type: x proximity");
    expect(source).toContain("min-height: 46px");
    expect(source).toContain('button[aria-current="page"]');
    expect(source).toContain("box-shadow: inset 0 -3px 0 #f2c14d");
  });
});
