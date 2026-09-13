import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");

function tokenValue(name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  expect(match, `${name} is defined`).toBeTruthy();
  return match![1].trim();
}

function relativeLuminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe("Sports Genome semantic colour architecture", () => {
  // "Palette-neutral semantic color architecture" (adopted, FIXED): components
  // consume semantic tokens rather than literal brand hues, and each encoding
  // job gets a purpose-built family.
  it("defines a purpose-built family for every encoding job the contract names", () => {
    const required = [
      "--sg-surface-deep", "--sg-surface-raised", "--sg-surface-panel", "--sg-surface-overlay",
      "--sg-text-on-dark", "--sg-text-muted-on-dark", "--sg-text-subtle-on-dark", "--sg-text-faint-on-dark",
      "--sg-action", "--sg-focus-ring", "--sg-selected-on-dark", "--sg-info",
      "--sg-state-positive", "--sg-state-caution", "--sg-state-critical",
      "--sg-confidence-high", "--sg-confidence-medium", "--sg-confidence-low",
      "--sg-seq-1", "--sg-seq-5",
      "--sg-diverging-negative", "--sg-diverging-midpoint", "--sg-diverging-positive",
      "--sg-data-missing",
    ];
    required.forEach((token) => expect(css, `${token} is defined`).toContain(`${token}:`));
  });

  it("keeps confidence off the magnitude scale, as the contract requires", () => {
    // "Confidence does not reuse score magnitude colour."
    const sequential = ["--sg-seq-1", "--sg-seq-2", "--sg-seq-3", "--sg-seq-4", "--sg-seq-5"].map(tokenValue);
    const confidence = ["--sg-confidence-high", "--sg-confidence-medium", "--sg-confidence-low"].map(tokenValue);
    confidence.forEach((value) => expect(sequential).not.toContain(value));
  });

  it("separates keyboard focus from the selected state", () => {
    // These are two different meanings and had been collapsed onto one another.
    expect(tokenValue("--sg-focus-ring")).not.toBe(tokenValue("--sg-selected-on-dark"));
  });

  it("keeps the decision colour distinct from selection and from informational emphasis", () => {
    const action = tokenValue("--sg-action");
    expect(action).not.toBe(tokenValue("--sg-selected-on-dark"));
    expect(action).not.toBe(tokenValue("--sg-info"));
  });

  it("retires the acid-lime accent that competed with the decision colour", () => {
    // calm_precision anti-pattern: "competing highlights".
    expect(css).not.toContain("#b8ff5b");
  });

  it("meets WCAG contrast for body text on each dark surface in the ladder", () => {
    const surfaces = ["--sg-surface-deep", "--sg-surface-raised", "--sg-surface-panel"].map(tokenValue);
    surfaces.forEach((surface) => {
      expect(contrast(tokenValue("--sg-text-on-dark"), surface), `primary text on ${surface}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokenValue("--sg-text-muted-on-dark"), surface), `muted text on ${surface}`).toBeGreaterThanOrEqual(4.5);
      // Subtle text is used for supporting labels, so it is held to the large-text bar.
      expect(contrast(tokenValue("--sg-text-subtle-on-dark"), surface), `subtle text on ${surface}`).toBeGreaterThanOrEqual(3);
    });
  });

  it("keeps the focus ring visible against both the dark and the light ground", () => {
    // A focus indicator is a non-text graphical object: 3:1 under WCAG 1.4.11.
    const ring = tokenValue("--sg-focus-ring");
    expect(contrast(ring, tokenValue("--sg-surface-deep")), "ring on deep navy").toBeGreaterThanOrEqual(3);
    expect(contrast(ring, tokenValue("--sg-surface-panel")), "ring on panel navy").toBeGreaterThanOrEqual(3);
    expect(contrast(ring, tokenValue("--sg-surface-light")), "ring on the light ground").toBeGreaterThanOrEqual(3);
  });

  it("collapses motion durations under the OS reduced-motion preference", () => {
    // "Motion and state-transition contract": reduced motion must preserve all
    // information with instant state changes.
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    ["--sg-motion-fast", "--sg-motion-base", "--sg-motion-slow"].forEach((token) => {
      expect(block).toContain(`${token}: 1ms;`);
    });
  });
});
