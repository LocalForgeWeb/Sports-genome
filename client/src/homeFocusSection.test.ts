import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Home's "Movement focus" section and the small workout-focus figure in the next-workout
// card used to share the class name home-focus. The figure's rules (a grid area, a width
// of about a quarter of the screen, and display:none below 360px) then also landed on the
// section, which squeezed it into a narrow column on phones and hid it on small ones.
// Layout cannot be measured in jsdom, so this pins the stylesheet and the markup instead.
const styles = readFileSync(new URL("./index.css", import.meta.url), "utf8");
const home = readFileSync(new URL("./pages/Home.tsx", import.meta.url), "utf8");
const todayPanel = readFileSync(new URL("./components/TodayActionPanel.tsx", import.meta.url), "utf8");

/** Every declaration block whose selector list targets the bare .home-focus class. */
function homeFocusBlocks(css: string): string[] {
  const blocks: string[] = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  for (let match = rule.exec(css); match; match = rule.exec(css)) {
    const selectors = match[1].split(",").map((selector) => selector.trim());
    if (selectors.some((selector) => /\.home-focus(?![\w-])(?!\s*[\s>+~]\s*\S)/.test(selector))) blocks.push(match[2]);
  }
  return blocks;
}

describe("Home movement focus section", () => {
  it("is the only element with the home-focus class", () => {
    // Intentional change, Sep 28 regression brief §3: the section is the compact "Sport focus"
    // preview now, one action and its link to Body Lab.
    expect(home).toContain('<section className="home-focus" aria-label="Sport focus">');
    expect(todayPanel).not.toMatch(/className="home-focus"/);
    expect(todayPanel).toContain('<figure className="today-action-focus">');
  });

  it("is never narrowed, placed in a grid area, or hidden by a stylesheet rule", () => {
    const blocks = homeFocusBlocks(styles);
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block).not.toMatch(/(^|[;\s])width\s*:/);
      expect(block).not.toMatch(/grid-area\s*:/);
      expect(block).not.toMatch(/display\s*:\s*none/);
    }
  });
});
