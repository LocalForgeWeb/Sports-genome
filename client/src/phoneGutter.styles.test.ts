import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Sep 30 brief §8: one horizontal gutter on narrow phones. The content sat 12px from the
 * edge while the sheets used 16px and 18.4px and the tab row 4px, so no two left edges
 * agreed. There is now one token, --sg-gutter, and every phone surface reads it.
 */
const app = readFileSync(new URL("./index.css", import.meta.url), "utf8");
const mobile = readFileSync(new URL("./mobile-navigation.css", import.meta.url), "utf8");

/** The bodies of every `@media (max-width: 640px)` block, braces matched. */
function phoneBlocks(css: string): { start: number; body: string }[] {
  const blocks: { start: number; body: string }[] = [];
  const opener = "@media (max-width: 640px) {";
  for (let at = css.indexOf(opener); at !== -1; at = css.indexOf(opener, at + 1)) {
    let depth = 0;
    let end = at + opener.length - 1;
    for (; end < css.length; end += 1) {
      if (css[end] === "{") depth += 1;
      else if (css[end] === "}" && --depth === 0) break;
    }
    blocks.push({ start: at, body: css.slice(at + opener.length, end) });
  }
  return blocks;
}

/** The last phone rule naming `selector` in its selector list: the one that wins the cascade. */
function phoneRuleFor(css: string, selector: string): { start: number; declarations: string } | null {
  let last: { start: number; declarations: string } | null = null;
  for (const block of phoneBlocks(css)) {
    for (const match of block.body.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const selectors = match[1].replace(/\/\*[\s\S]*?\*\//g, "").split(",").map((part) => part.trim());
      if (selectors.includes(selector)) last = { start: block.start, declarations: match[2] };
    }
  }
  return last;
}

describe("the phone gutter", () => {
  it("is one token, 16px on the narrowest phone and never past 20px", () => {
    expect(app).toMatch(/--sg-gutter:\s*clamp\(16px, 4\.5vw, 20px\);/);
  });

  it("is the content's inline padding at phone widths, with no 12px left behind", () => {
    const content = phoneRuleFor(mobile, ".apex-content");
    expect(content?.declarations).toContain("padding: 12px var(--sg-gutter);");
    expect(mobile).not.toMatch(/\.apex-content \{ padding: 12px; \}/);
  });

  it.each([
    ".apex-topbar",
    ".search-return-bar",
    ".workspace-top-switcher-shell .workspace-top-switcher",
    ".exercise-intelligence-bar", ".exercise-intelligence-body", ".exercise-intelligence-actions",
    ".exercise-compare-bar", ".exercise-compare-body", ".exercise-compare-actions",
    ".day-picker-sheet-head", ".day-picker-sheet .day-exercise-picker-content", ".day-picker-sheet-foot",
    ".genome-learn-card",
  ])("is applied to %s at phone widths", (selector) => {
    const rule = phoneRuleFor(app, selector);
    expect(rule?.declarations).toContain("padding-inline: var(--sg-gutter)");
  });

  /**
   * Same specificity, so source order decides: the gutter block must come after the rules
   * that set those surfaces' padding with a shorthand, or they would put 12px and 1rem back.
   */
  it("comes after the shorthand paddings it replaces", () => {
    const gutter = phoneRuleFor(app, ".exercise-compare-actions")!.start;
    for (const earlier of [
      ".apex-topbar { min-height: 64px; padding: 8px 12px;",
      ".workspace-top-switcher-shell .workspace-top-switcher { min-height: 48px; padding: 0 .25rem; }",
      ".exercise-intelligence-bar { display: flex;",
      ".exercise-intelligence-actions { display: grid;",
      ".exercise-compare-bar { display: flex;",
      ".exercise-compare-actions { display: grid;",
      ".search-return-bar {",
    ]) {
      const at = app.indexOf(earlier);
      expect(at, earlier).toBeGreaterThan(-1);
      expect(at, earlier).toBeLessThan(gutter);
    }
  });

  it("is not padded twice: the Plan's coverage wrapper takes no second gutter", () => {
    expect(phoneRuleFor(app, ".day-exercise-picker")?.declarations).toContain("padding-inline: 0");
  });

  it("changes only the inline sides, so each edge keeps its one safe-area inset", () => {
    const gutterRules = phoneBlocks(app).filter((block) => block.body.includes("var(--sg-gutter)")).map((block) => block.body).join("\n");
    expect(gutterRules).not.toMatch(/safe-area-inset/);
    expect(gutterRules).not.toMatch(/padding(?:-top|-bottom)?:\s*[^;]*var\(--sg-gutter\)/);
  });
});
