import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Phone and iOS first (CLAUDE.md; owner, 15 Oct 2026): a control added for the phone is clearly
 * visible at rest and a full thumb target. These pin the controls added that day - set effort, and
 * adding or removing exercises - so they cannot drift back to faded or undersized.
 */
const css = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
/** The rule that applies: the last one for the selector, as the cascade reads equal selectors. */
const rule = (styles: string, selector: string) => {
  const start = styles.lastIndexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return styles.slice(start, styles.indexOf("}", start));
};
const remOf = (declaration: string) => Number(/min-height:\s*([\d.]+)rem/.exec(declaration)?.[1] ?? 0);

describe("Controls built for the phone", () => {
  it("never fade the effort controls at rest", () => {
    expect(css("./set-effort.css")).not.toMatch(/opacity\s*:/);
  });

  it("give every new control at least a 44 pt target", () => {
    const effort = css("./set-effort.css");
    const tracker = css("./workout-planner.css");
    const plan = css("./mobile-training-card.css");
    for (const [styles, selector] of [
      [effort, ".set-effort-chip"],
      [effort, ".set-effort-options button"],
      [tracker, ".live-set-secondary .live-set-skip"],
      [tracker, ".live-done-add"],
      [tracker, ".session-add-exercise"],
    ] as const) expect(remOf(rule(styles, selector)), selector).toBeGreaterThanOrEqual(2.75);
    // The base rule, at the start of its line; later rules only hide it while reordering.
    expect(plan).toMatch(/^\.day-row-remove \{[^}]*width: 44px; height: 44px/m);
  });

  it("keep moving exercises visible at rest, in reach, and clear of the screen's edge (21 Oct)", () => {
    const card = css("./mobile-training-card.css");
    // The hint is the only sign that holding works, so it is never faded.
    expect(rule(card, ".day-arrange-hint")).not.toMatch(/opacity/);
    // Done is a full thumb target, pinned above the navigation and the home indicator.
    expect(remOf(rule(card, ".day-arrange-bar button"))).toBeGreaterThanOrEqual(2.75);
    // The base rule, at the start of its line; the later ones only move it for wider screens.
    const bar = /^\.day-arrange-bar \{[^}]*\}/m.exec(card)?.[0] ?? "";
    expect(bar).toContain("position: sticky");
    expect(bar).toContain("env(safe-area-inset-bottom, 0px)");
    // A long press is the gesture, so iOS's callout and text selection stay out of it.
    expect(card).toContain("-webkit-touch-callout: none");
    expect(card).toMatch(/summary \{ -webkit-user-select: none; user-select: none; \}/);
  });

  it("lay Swap, Skip and Add out as three equal buttons under Log set", () => {
    expect(rule(css("./workout-planner.css"), ".live-set-secondary")).toContain("display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))");
  });
});
