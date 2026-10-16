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

  it("lay Swap, Skip and Add out as three equal buttons under Log set", () => {
    expect(rule(css("./workout-planner.css"), ".live-set-secondary")).toContain("display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))");
  });
});
