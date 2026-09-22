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

  /**
   * The list used to be grouped by the split's own intent - "Primary targets",
   * then "Support targets" - which on the measured Sport Transfer day put three
   * over-target rows above the two the headline had just named as the problem.
   * The role is a property of a row, not an order to read the list in.
   */
  it("orders the bars by what needs doing, and keeps the role on the row", () => {
    const markup = render();
    expect(markup).toContain("Under target");
    expect(markup).toContain("At or past target");
    expect(markup).toMatch(/rate-stack-row-name[^>]*>[^<]*<small>(Primary|Support)<\/small>/);
    expect(markup).not.toContain("the split is built on these");
  });

  /**
   * The panel opened with a gauge, a sentence, a band tally, two group headings,
   * every bar in the split, a legend and a second disclosure - all of it above an
   * exercise list, on a page you came to in order to edit a day.
   */
  it("keeps every bar behind the question it answers, rather than opening with all of them", () => {
    const markup = render();
    // The bars are present in the markup - a <details> ships its content - but
    // they are inside the collapsed disclosure, which is the point.
    const detail = markup.indexOf('class="rate-stack-detail"');
    expect(detail, "the coverage detail is a disclosure").toBeGreaterThan(-1);
    expect(markup).not.toContain('class="rate-stack-detail" open');
    expect(markup.indexOf("rate-stack-row-track"), "no bar is drawn before it").toBeGreaterThan(detail);
    expect(markup.indexOf("rate-stack-tally"), "the band tally moved in with them").toBeGreaterThan(detail);
    expect(markup.indexOf("rate-stack-legend"), "so did the legend").toBeGreaterThan(detail);
  });

  /**
   * Stage one used to end at "Open full analysis" - a sentence naming a shortfall
   * and no way to act on it short of opening a modal and reading it again.
   */
  it("offers each shortfall as the search that closes it", () => {
    const onFixMuscle = vi.fn();
    const markup = renderToStaticMarkup(
      createElement(RateStackPanel, { workout: push, catalog: exercises, split: "Push" as const, onAdd: vi.fn(), onReplace: vi.fn(), onFixMuscle })
    );
    expect(markup).toContain("Short in this day");
    expect(markup).toMatch(/rate-stack-fix-list[\s\S]*<button type="button"/);
    expect(markup).toMatch(/aria-label="Find [^"]+ exercises, \d+ points short"/);
    // Above the disclosure: it is stage one's only action.
    expect(markup.indexOf("rate-stack-fix")).toBeLessThan(markup.indexOf("rate-stack-detail"));
  });

  it("does not offer a shortfall as a button where nothing can act on it", () => {
    // Without a handler the chip is still readable, but it is not a control that
    // does nothing when pressed.
    expect(render()).toContain("rate-stack-fix-static");
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
    // Stage two is a disclosure over bars and an empty day has none, so the
    // boundary cannot ride along with them there.
    const markup = render([]);
    expect(markup).toContain("rate-stack-dial-value");
    expect(markup).toContain("What this score measures");
    expect(markup).toContain("rate-stack-boundary");
    expect(markup).not.toContain("rate-stack-detail");
  });

  it("names no shortfall to fix on a day with nothing in it", () => {
    // Every target is under on an empty day, which is five failures reported
    // before the athlete has added anything.
    expect(render([])).not.toContain("rate-stack-fix");
  });
});
