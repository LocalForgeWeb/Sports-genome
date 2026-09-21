import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "client/src");
const index = readFileSync(join(SRC, "index.css"), "utf8");
const allCss = readdirSync(SRC)
  .filter((name) => name.endsWith(".css"))
  .map((name) => readFileSync(join(SRC, name), "utf8"))
  .join("\n");

/**
 * The audit that produced this system, at 393x852 across eight destinations:
 *
 *   surface     panels  sharp corners  no depth
 *   day-plan        48          100%       85%
 *   genome          14           71%       71%
 *   strength        20           60%       90%
 *   command         16           56%       75%
 *
 * Training Day drew forty-eight panels and rounded none of them. Everywhere else
 * the radius was invented locally - six values on Home, five in the catalog. And
 * of ninety-one transitions in the corpus exactly one animated a shadow, so
 * nothing ever lifted or arrived.
 */
describe("surfaces speak one grammar", () => {
  it("names a radius ladder rather than leaving each file to invent one", () => {
    for (const token of ["--sg-radius-xs", "--sg-radius-sm", "--sg-radius-md", "--sg-radius-lg", "--sg-radius-pill"]) {
      expect(index, `${token} is defined`).toMatch(new RegExp(`${token}\\s*:`));
    }
  });

  it("gives every panel-shaped surface a radius, by the name it already has", () => {
    const rule = index.slice(index.indexOf("/* ── 1. Radius"));
    for (const suffix of ["-panel", "-card", "-board", "-planner", "-rail", "-inspector"]) {
      expect(rule.slice(0, 1600), `${suffix} surfaces are covered`).toContain(`[class*="${suffix}"]`);
    }
  });

  /**
   * A blanket button radius detached the workspace tab row's active underline into
   * a floating lozenge, and a blanket pill rule turned the full-width training-day
   * tiles into capsules. Both are controls cut *out of* a strip, not objects.
   */
  it("leaves the controls that are cut out of a strip alone", () => {
    const rule = index.slice(index.indexOf("/* ── 1. Radius"));
    const buttonRule = rule.slice(rule.indexOf("input, select, textarea, button"));
    expect(buttonRule.slice(0, 400)).toContain(':not(');
    for (const excluded of ['[role="tab"]', "workspace-top-switcher", "mobile-workspace-dock"]) {
      expect(buttonRule.slice(0, 500), `${excluded} keeps its own shape`).toContain(excluded);
    }
  });

  it("puts panels on the elevation ladder instead of leaving them flat", () => {
    expect(index).toMatch(/--sg-sheen\s*:/);
    const depth = index.slice(index.indexOf("/* ── 2. Depth"));
    expect(depth.slice(0, 900)).toContain("var(--sg-sheen), var(--sg-elevation-2)");
  });

  /**
   * `overflow: hidden` kills `position: sticky` in every descendant. Applied to
   * every panel by name it stopped the catalog's search bar sticking, with
   * nothing on screen to say why - so it is named surfaces only, and only the
   * ones whose contents genuinely run to the edge.
   */
  it("clips only the surfaces whose children reach the edge, never by pattern", () => {
    const system = index.slice(index.indexOf("THE SURFACE SYSTEM"));
    const clip = system.slice(system.indexOf("has to clip them"), system.indexOf("has to clip them") + 900);
    expect(clip).toContain("overflow: hidden");
    expect(clip).toContain(".day-programming-panel");
    // A pattern here is the bug: it reaches panels that hold sticky children.
    expect(clip).not.toMatch(/\[class\*=[^\]]*\][^{]*\{\s*overflow: hidden/);
  });
});

describe("surfaces arrive rather than appearing", () => {
  it("gives the content surfaces an entrance, not just three legacy classes", () => {
    expect(index).toContain("@keyframes sg-surface-rise");
    const arrival = index.slice(index.indexOf("/* ── 4. Arrival"));
    expect(arrival.slice(0, 1400)).toContain("animation: sg-surface-rise var(--sg-motion-slow) var(--sg-ease-entrance) both");
  });

  it("staggers a stack so it reads as assembling rather than as one flash", () => {
    const arrival = index.slice(index.indexOf("/* ── 4. Arrival"));
    // Written as `animation-delay`, because the shorthand is where the grammar
    // tokens live and motionGrammar polices inline durations inside it.
    expect(arrival.slice(0, 1600)).toMatch(/animation-delay: \d+ms;/);
  });

  it("only lifts things that actually do something when clicked", () => {
    const pointer = index.slice(index.indexOf("/* ── 5. Surfaces that answer a pointer"));
    expect(pointer.slice(0, 900)).toContain('a, button, [role="button"], summary');
    expect(pointer.slice(0, 900)).toContain("translateY(var(--sg-lift))");
    // A press puts it back down, so the object yields rather than floating away.
    expect(pointer.slice(0, 1200)).toContain(":active");
  });

  it("gates every bit of it behind the reduced-motion preference", () => {
    for (const marker of ["/* ── 4. Arrival", "/* ── 5. Surfaces that answer a pointer"]) {
      const section = index.slice(index.indexOf(marker), index.indexOf(marker) + 2200);
      expect(section, `${marker} is gated`).toContain("@media (prefers-reduced-motion: no-preference)");
    }
  });
});

describe("the system is used rather than worked around", () => {
  it("keeps the training day's own surfaces on the ladder", () => {
    const planner = readFileSync(join(SRC, "workout-planner.css"), "utf8");
    expect(planner).toContain("var(--sg-radius-md)");
  });

  it("references no radius token it has not defined", () => {
    const referenced = new Set([...allCss.matchAll(/var\((--sg-radius[\w-]*)/g)].map((m) => m[1]));
    for (const name of referenced) {
      expect(index, `${name} is referenced, so it must be defined`).toMatch(new RegExp(`${name}\\s*:`));
    }
  });
});
