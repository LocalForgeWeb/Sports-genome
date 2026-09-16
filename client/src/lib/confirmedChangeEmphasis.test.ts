import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { confirmedChangeEmphasis } from "./homeStateSummary";

const css = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");
const panel = readFileSync(join(process.cwd(), "client/src/components/TodayActionPanel.tsx"), "utf8");

const change = (relativeChangePercent: number) => ({ relativeChangePercent });

/**
 * The earned_progress trait scales celebration "with significance and rarity" and
 * names meaningless inflation as its anti-pattern; living_genome asks motion to
 * clarify what changed rather than to decorate.
 */
describe("confirmedChangeEmphasis", () => {
  it("reads the direction from the sign", () => {
    expect(confirmedChangeEmphasis(change(18)).direction).toBe("gain");
    expect(confirmedChangeEmphasis(change(-18)).direction).toBe("loss");
  });

  it("treats no change at all as a gain rather than a loss", () => {
    expect(confirmedChangeEmphasis(change(0)).direction).toBe("gain");
  });

  it("keeps an ordinary confirmed gain at the standard reveal", () => {
    // Confirmation starts at 15%; being merely confirmed is not rare.
    expect(confirmedChangeEmphasis(change(15)).intensity).toBe("standard");
    expect(confirmedChangeEmphasis(change(29.9)).intensity).toBe("standard");
  });

  it("reserves the pronounced reveal for a gain at twice the threshold", () => {
    expect(confirmedChangeEmphasis(change(30)).intensity).toBe("pronounced");
    expect(confirmedChangeEmphasis(change(80)).intensity).toBe("pronounced");
  });

  it("never amplifies a decline, however large", () => {
    // Dramatising a regression is the punishment-heavy pattern the trait rules out.
    for (const percent of [-15, -30, -60, -95]) {
      expect(confirmedChangeEmphasis(change(percent)).intensity).toBe("standard");
    }
  });
});

/**
 * A confirmed decline rendered in the positive-state green, with a green "Confirmed
 * change" badge beside it - the one reading an athlete most needs to not misread.
 */
describe("signed change is coloured by direction", () => {
  it("drives the colour from the direction attribute, not a fixed positive hue", () => {
    expect(css).toContain('.today-action-state-headline[data-sg-change="gain"] { --sg-change-colour: var(--sg-diverging-positive); }');
    expect(css).toContain('.today-action-state-headline[data-sg-change="loss"] { --sg-change-colour: var(--sg-diverging-negative); }');
  });

  it("no longer hardcodes the positive state colour on the delta or the badge", () => {
    const delta = css.slice(css.indexOf(".today-action-state-delta {"));
    const rule = delta.slice(0, delta.indexOf("}"));
    expect(rule).not.toContain("--sg-state-positive");
    expect(rule).toContain("--sg-change-colour");
  });

  it("names the direction in the badge, so colour is not the only cue", () => {
    expect(panel).toContain('"Confirmed decline"');
    expect(panel).toContain('"Confirmed gain"');
  });

  it("marks the element the emphasis applies to", () => {
    expect(panel).toContain("data-sg-change={changeEmphasis?.direction}");
    expect(panel).toContain("data-sg-change-intensity={changeEmphasis?.intensity}");
  });

  it("only marks a confirmed change, never the tracked-lifts fallback", () => {
    const fallback = panel.slice(panel.indexOf("No tracked lifts yet") - 400, panel.indexOf("No tracked lifts yet"));
    expect(fallback).not.toContain("data-sg-change");
  });
});

describe("the reveal stays within the motion contract", () => {
  it("plays once and does not loop", () => {
    const keyframes = css.slice(css.indexOf("@keyframes sg-change-arrive"));
    expect(css).toContain("animation: sg-change-arrive var(--sg-motion-slow) var(--sg-ease-entrance) both");
    expect(keyframes.slice(0, 400)).not.toContain("infinite");
  });

  it("is gated behind no-preference, so it never runs for a reduced-motion reader", () => {
    const gate = css.indexOf("@media (prefers-reduced-motion: no-preference) {\n  .today-action-state-headline");
    expect(gate).toBeGreaterThan(-1);
  });

  it("uses the grammar's tokens rather than its own timing", () => {
    const block = css.slice(css.indexOf("sg-change-arrive") - 600, css.indexOf("@keyframes sg-change-arrive"));
    expect(block).toContain("var(--sg-motion-slow)");
    expect(block).toContain("var(--sg-ease-entrance)");
  });
});
