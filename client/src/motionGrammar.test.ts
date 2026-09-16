import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cssDir = join(process.cwd(), "client/src");
const cssFiles = readdirSync(cssDir).filter(name => name.endsWith(".css"));
const sources = new Map(cssFiles.map(name => [name, readFileSync(join(cssDir, name), "utf8")]));
const allCss = [...sources.values()].join("\n");

/** Every transition/animation shorthand value in the stylesheets. */
function motionValues(css: string): string[] {
  return [...css.matchAll(/(?<![\w-])(?:transition|animation)(?:-duration|-timing-function)?\s*:\s*([^;{}]+)/gi)].map(
    match => match[1]
  );
}

/**
 * The recognizable_rhythm DNA trait asks for one motion timing and transition grammar
 * across surfaces. The corpus had drifted to eleven durations and four curves, which
 * is what made the app feel assembled rather than designed.
 */
describe("motion speaks one grammar", () => {
  const values = motionValues(allCss);

  it("has motion to check at all", () => {
    expect(values.length).toBeGreaterThan(80);
  });

  it("uses the duration tokens rather than inline timings", () => {
    // Set pieces - the launch sequence and ambient loops - are allowed their own
    // timing, so only grammar-sized durations are policed here.
    const inline = values
      .flatMap(value => [...value.matchAll(/(?<![\w.])(\d+(?:\.\d+)?)(ms|s)(?![\w-])/g)])
      .map(match => (match[2] === "s" ? Number(match[1]) * 1000 : Number(match[1])))
      .filter(ms => ms > 1 && ms < 500);
    expect(inline, `inline grammar-sized durations remain: ${inline.join(", ")}`).toEqual([]);
  });

  it("uses only the two curve tokens, outside the launch set piece", () => {
    const curves = new Set(
      values.flatMap(value => [
        ...[...value.matchAll(/cubic-bezier\([^)]*\)/g)].map(m => m[0].replace(/\s+/g, "")),
        ...[...value.matchAll(/(?<![\w-])ease(?:-in|-out|-in-out)?(?![\w-])/g)].map(m => m[0]),
      ])
    );
    // The launch sequence is choreographed, not part of the interaction grammar.
    curves.delete("cubic-bezier(.77,0,.175,1)");
    expect([...curves], "only the launch set piece may name a curve directly").toEqual([]);
  });

  it("defines exactly three durations and two curves", () => {
    const root = sources.get("index.css")!;
    for (const token of ["--sg-motion-fast", "--sg-motion-base", "--sg-motion-slow", "--sg-ease", "--sg-ease-entrance"]) {
      expect(root, `${token} is defined`).toMatch(new RegExp(`${token}\\s*:`));
    }
    // A fourth duration would be a new dialect, not a refinement.
    const durationTokens = [...root.matchAll(/--sg-motion-[a-z]+\s*:/g)].map(m => m[0]);
    expect(new Set(durationTokens).size).toBe(3);
  });

  it("never references a timing-function token that does not exist", () => {
    // `var(--ease-out)` was referenced in ~20 rules and defined nowhere, so those
    // transitions silently fell back to the default curve.
    const referenced = new Set([...allCss.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]));
    for (const name of referenced) {
      if (!name.startsWith("--sg-ease") && !name.startsWith("--sg-motion")) continue;
      expect(allCss, `${name} is referenced, so it must be defined`).toMatch(new RegExp(`${name}\\s*:`));
    }
  });

  it("has no leftover nested var() from tokenisation", () => {
    expect(allCss).not.toContain("var(--var(");
  });
});

/**
 * Collapsing the tokens only reaches motion written with them. Everything else kept
 * playing at full length for a reader who had asked the OS to stop it.
 */
describe("reduced motion is honoured app-wide", () => {
  const root = sources.get("index.css")!;

  it("collapses the duration tokens", () => {
    const block = root.slice(root.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toContain("--sg-motion-fast: 1ms");
    expect(block).toContain("--sg-motion-base: 1ms");
    expect(block).toContain("--sg-motion-slow: 1ms");
  });

  it("carries a universal backstop for motion not on the tokens", () => {
    const block = root.slice(root.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toMatch(/\*,\s*\*::before,\s*\*::after/);
    expect(block).toContain("animation-duration: 1ms !important");
    expect(block).toContain("transition-duration: 1ms !important");
  });

  it("stops infinite decorative loops rather than letting them run", () => {
    const block = root.slice(root.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toContain("animation-iteration-count: 1 !important");
  });

  it("collapses durations instead of removing the rules, so end states still apply", () => {
    // `animation: none` would discard a `both` fill and leave elements at their
    // pre-animation opacity - invisible content for a reduced-motion reader.
    const block = root.slice(root.indexOf("@media (prefers-reduced-motion: reduce)"));
    const universal = block.slice(block.indexOf("*, *::before"), block.indexOf("scroll-behavior"));
    expect(universal).not.toContain("animation: none");
    expect(universal).not.toContain("transition: none");
  });
});
