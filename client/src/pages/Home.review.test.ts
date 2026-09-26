import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const volume = readFileSync(new URL("../components/WeeklyMuscleVolumePanel.tsx", import.meta.url), "utf8");

/**
 * Review was a two-column grid of five panels, each with its own display heading
 * competing with the page's, and the recovery-spacing check was rendered inside
 * the weekly volume map - so "how are my sessions spaced" sat underneath a chart
 * answering a different question.
 */
describe("Review reads as one page", () => {
  it("stacks the sections in the order the answers are wanted", () => {
    const stack = home.slice(home.indexOf('className="day-review-stack"'), home.indexOf('{workspace === "genome"'));
    const order = ["<WarmupPanel", "<WeeklyMuscleVolumePanel", "<RecoverySpacingPanel", "<ProgrammingGuidePanel", "<WorkoutHealthPanel"];
    let cursor = -1;
    for (const panel of order) {
      const at = stack.indexOf(panel);
      expect(at, `${panel} is on Review`).toBeGreaterThan(-1);
      expect(at, `${panel} comes after the one before it`).toBeGreaterThan(cursor);
      cursor = at;
    }
    // One column: the two-column grid put the warm-up beside the coach scan and
    // made the reading order depend on the viewport.
    expect(home).not.toContain('xl:grid-cols-[.9fr_1.1fr]');
  });

  it("gives spacing its own place rather than nesting it inside the volume map", () => {
    expect(volume).not.toContain("<RecoverySpacingPanel");
    expect(home).toContain("<RecoverySpacingPanel plan={weeklyPlan}");
  });

  it("offers the session from the page that reviews it", () => {
    expect(home).toContain('className="day-review-open"');
    expect(home).toContain("Review your week");
  });

  /**
   * Sampled from the rendered page: the recovery-spacing heading was
   * rgb(16,41,71) and its disclosure summary rgb(49,87,124), both on a panel of
   * roughly rgb(13,40,72) — a ratio near 1.0, which is not low contrast, it is
   * invisible. An earlier repaint of these panels caught strong, p and small and
   * stopped there.
   */
  it("paints every heading and summary these panels have for the ground they sit on", () => {
    expect(chrome).toContain(".destination-train .recovery-spacing-head h3,");
    expect(chrome).toContain(".destination-train .programming-guide-panel h3 { color: var(--sg-text-on-dark); }");
    expect(chrome).toContain(".destination-train .programming-guide-disclosure > summary { color: var(--sg-link-on-dark); }");
  });

  /**
   * The first version of that fix repainted the clear state's text without
   * repainting the cream card under it, which put light grey on near-white —
   * the same defect moved rather than fixed.
   */
  it("repaints the clear-state card rather than only the words on it", () => {
    expect(chrome).toContain(".destination-train .recovery-spacing-clear { border-color:");
    expect(chrome).not.toContain(".destination-train .recovery-spacing-panel span {");
  });
});
