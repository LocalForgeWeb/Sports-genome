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

function render(workout = push) {
  return renderToStaticMarkup(
    createElement(RateStackPanel, {
      workout,
      catalog: exercises,
      split: "Push",
      onAdd: vi.fn(),
      onReplace: vi.fn(),
    })
  );
}

/**
 * The panel used to render its analysis as one number and discard the per-muscle
 * ratings entirely. These assertions are about the number never being alone
 * again.
 */
describe("RateStackPanel coverage visuals", () => {
  it("draws a gauge for the overall score", () => {
    const markup = render();
    expect(markup).toContain("rate-stack-dial-value");
    expect(markup).toContain("stroke-dasharray");
  });

  it("plots a bar for every split target, not just the overall score", () => {
    const markup = render();
    // Push has five requirements: chest, frontDelts, triceps, sideDelts, serratusAnterior.
    expect(markup.match(/rate-stack-row-track/g)).toHaveLength(5);
  });

  it("marks each muscle's target on its bar", () => {
    // Without the mark a fill is an uninterpretable number: 56 of what?
    const markup = render();
    expect(markup.match(/rate-stack-row-target/g)).toHaveLength(5);
  });

  it("states the shortfall in points next to the bar", () => {
    const markup = render();
    expect(markup).toMatch(/rate-stack-row-delta[^>]*>(−|\+)\d+/);
  });

  it("separates primary targets from support targets", () => {
    const markup = render();
    expect(markup).toContain("Primary targets");
    expect(markup).toContain("Support targets");
  });

  it("leads with a sentence naming the worst gap", () => {
    const markup = render();
    expect(markup).toContain("rate-stack-headline");
    expect(markup).toMatch(/points short|is covered|carrying heavy volume/);
  });

  it("labels each band with a word and a glyph, never colour alone", () => {
    const markup = render();
    for (const word of ["Short", "Covered", "Heavy"]) {
      if (markup.includes(`rate-stack-row-band`) && markup.includes(word)) {
        expect(markup).toContain(word);
      }
    }
    // At least one band glyph reaches the markup.
    expect(markup).toMatch(/↓|✓|↑/);
  });

  it("names the one mark nothing else labels, and nothing the bars do not draw", () => {
    // The bar carries its own number, its own word and its own aria-label. The
    // target tick is the only thing on the chart with no name of its own, so it
    // is the only thing the legend has to explain. The swatch that used to sit
    // beside it showed a three-stop gradient describing a continuous scale the
    // bars never used — a key to a chart that does not exist.
    const markup = render();
    expect(markup).toContain("rate-stack-legend-target");
    expect(markup).toContain("reached");
    expect(markup).not.toContain("rate-stack-legend-fill");
  });

  it("gives each row an accessible description of coverage against target", () => {
    const markup = render();
    expect(markup).toMatch(/aria-label="[^"]*coverage points (below|above)[^"]*target/);
  });

  it("keeps the full analysis reachable", () => {
    expect(render()).toContain("Open full analysis");
  });

  it("says what to do instead of rendering empty bars for an empty stack", () => {
    const markup = render([]);
    expect(markup).toContain("Add an exercise");
    expect(markup).not.toContain("rate-stack-row-track");
  });

  it("still shows the gauge and the scope note with an empty stack", () => {
    const markup = render([]);
    expect(markup).toContain("rate-stack-dial-value");
    expect(markup).toContain("What this score measures");
  });
});
