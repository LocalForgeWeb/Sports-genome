import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RateStackPanel } from "@/components/RateStackPanel";
import { exercises } from "@/lib/exerciseCatalog";

// The compiled JSX in the component reads the global React handle under this
// transform, the same as the other component render tests here.
(globalThis as typeof globalThis & { React?: typeof React }).React = React;

vi.mock("../rate-stack.css", () => ({}));

const push = exercises.filter((exercise) => exercise.primaryMuscles.includes("chest")).slice(0, 2);

function render(workout = push, props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    createElement(RateStackPanel, {
      workout,
      catalog: exercises,
      split: "Push",
      onAdd: vi.fn(),
      onReplace: vi.fn(),
      ...props,
    })
  );
}

/**
 * The Plan's coverage summary (Sep 28 regression brief §8). It is four things: the coverage
 * index with its scale named, one sentence, the one gap worth closing first, and "View
 * analysis". The bars, tallies, legend and methodology moved into the analysis and are
 * tested there (StackAnalysisPage.coverageRows.test.ts); these assertions used to pin them
 * here. An empty day shows no index at all.
 */
describe("RateStackPanel coverage summary", () => {
  it("draws a gauge for the overall score, and names what it is", () => {
    const markup = render();
    expect(markup).toContain("rate-stack-dial-value");
    expect(markup).toContain("stroke-dasharray");
    expect(markup).toContain("Push coverage index");
    expect(markup).toContain("Out of 100, from catalog muscle tags. Not workload or recovery.");
  });

  it("says one thing about the day, with the unit on its number", () => {
    const markup = render();
    expect(markup).toContain("rate-stack-headline");
    expect(markup).toMatch(/pts under target|targets? (is )?reached/);
  });

  it("offers the furthest gap as the one search that closes it", () => {
    const markup = render(push, { onFixMuscle: vi.fn() });
    expect(markup).toContain("Furthest behind");
    expect(markup.match(/<button type="button"[^>]*aria-label="Find /g)).toHaveLength(1);
    expect(markup).toMatch(/aria-label="Find [^"]+ exercises, \d+ pts under target"/);
  });

  it("does not offer the gap as a button where nothing can act on it", () => {
    expect(render()).toContain("rate-stack-fix-static");
  });

  it("keeps the bars, tallies and methodology out of the Plan", () => {
    const markup = render();
    for (const detail of ["rate-stack-row-track", "rate-stack-tally", "rate-stack-legend", "rate-stack-detail", "rate-stack-boundary", "What this score measures"]) {
      expect(markup, detail).not.toContain(detail);
    }
    // This was false: set counts do not enter the coverage model (contracts.md, EN-11).
    expect(markup).not.toContain("modeled from the day's prescriptions");
  });

  it("keeps the full analysis one tap away", () => {
    expect(render()).toContain("View analysis");
  });

  it("shows an empty day no index, no gauge and no promise of fixes", () => {
    const markup = render([]);
    expect(markup).toContain("Not available yet");
    expect(markup).toContain("It appears after the first exercise");
    for (const absent of ["rate-stack-dial", "/100", "rate-stack-boundary", "rate-stack-trigger", "suggested fix", "rate-stack-fix"]) {
      expect(markup, absent).not.toContain(absent);
    }
  });
});
