import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./WorkoutHealthPanel.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

describe("WorkoutHealthPanel progressive disclosure", () => {
  it("keeps diagnostic detail closed by default while preserving an accessible Stack Review summary", () => {
    expect(source).toContain('id="stack-review"');
    expect(source).toContain('<details className="workout-health-disclosure">');
    expect(source).toContain("<summary>");
    expect(source).toContain("Stack review");
    expect(source).toContain("Coach scan");
    expect(source).toContain("planning signal");
    expect(source).toContain("Review");
    expect(source).not.toContain('<details className="workout-health-disclosure" open>');
  });

  it("retains all diagnostic content inside the expandable disclosure with keyboard-focusable summary styling", () => {
    expect(source).toContain('className="workout-health-content"');
    expect(source).toContain("planned work sets");
    expect(source).toContain("overlap estimate");
    expect(source).toContain("Planning estimates use the current prescription");
    expect(styles).toContain(".workout-health-disclosure > summary");
    expect(styles).toContain(".workout-health-disclosure > summary:focus-visible");
    expect(styles).toContain("cursor: pointer");
    expect(styles).toContain("min-height: 72px");
  });
});
