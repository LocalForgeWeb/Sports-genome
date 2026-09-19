// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnatomyMap } from "./AnatomyMap";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

/**
 * These used to live in AnatomyMap.test.ts, which fakes a selection by mocking
 * `useState` and forcing the second call to return a muscle. That couples the
 * assertion to the order hooks are declared in: removing the view state — which
 * showing both bodies at once made redundant — silently moved the selection onto
 * a different hook and the test went on passing against an empty inspector.
 *
 * Selecting by clicking the muscle is the thing being claimed anyway.
 */
const draw = (props: Partial<Parameters<typeof AnatomyMap>[0]> = {}) =>
  render(createElement(AnatomyMap, { primary: ["hamstrings"], secondary: [], onSelect: vi.fn(), ...props }));

const select = (container: HTMLElement, label: string) =>
  fireEvent.click(container.querySelector(`.anatomy-hit[aria-label^="${label}"]`)!);

describe("selecting a muscle in the Body Lab", () => {
  it("renders its architecture, leverage, source and model boundary context", () => {
    const { container } = draw();
    select(container, "Hamstrings");
    const markup = container.innerHTML;
    expect(markup).toContain("Architecture and leverage");
    expect(markup).toContain("not mechanically interchangeable");
    expect(markup).toContain("PMID 30117053");
    expect(markup).toContain("force or injury risk");
  });

  it("says which body the selection is drawn on, now that both are on screen", () => {
    // This replaces the flip prompt. The selection can no longer be hiding on a
    // view the athlete is not looking at, so the card points rather than offers
    // to rotate — but it still has to answer "where am I looking?".
    const { container } = draw();
    select(container, "Hamstrings");
    expect(container.querySelector(".atlas-selected-where")?.textContent).toBe("On the posterior view");
  });

  it("names both bodies for a region drawn on each, instead of picking one", () => {
    // `traps` is drawn on the anterior and posterior figures. Naming only one
    // would send the athlete looking in a single place for a thing in two.
    const { container } = draw({ primary: ["traps"] });
    select(container, "Trapezius");
    expect(container.querySelector(".atlas-selected-where")?.textContent).toBe("On both views");
  });

  it("lets the athlete pick one head of a muscle the artwork draws in several", () => {
    // The quadriceps is drawn as three heads and the triceps as three. Tapping
    // any of them selected the whole muscle, so the subdivision the drawing was
    // making could be seen and not acted on. Roles and evidence stay per muscle
    // — that is the grain the catalog has — but the ring follows the head.
    const { container } = draw({ primary: ["quads"] });
    select(container, "Quadriceps femoris");
    const picker = container.querySelector(".atlas-part-picker")!;
    const heads = [...picker.querySelectorAll("button")].map((b) => b.textContent);
    expect(heads).toEqual(["Whole muscle", "Vastus lateralis", "Rectus femoris", "Vastus medialis"]);

    const ringedFor = () => [...container.querySelectorAll(".anatomy-selection-ring")].length;
    const whole = ringedFor();
    fireEvent.click(picker.querySelectorAll("button")[2]);
    expect(container.querySelector(".atlas-inspector-part")?.textContent).toBe("Rectus femoris");
    // One head of three, both sides: fewer paths ringed than the whole muscle.
    expect(ringedFor()).toBeLessThan(whole);
    expect(ringedFor()).toBeGreaterThan(0);
  });

  it("marks selection with a hairline over a faint halo, not one thick outline", () => {
    // A single 6px non-scaling white stroke on a 314px figure read as a sticker
    // laid over the anatomy, and swallowed the edge of the shape it marked.
    const { container } = draw();
    select(container, "Hamstrings");
    expect(container.querySelectorAll(".anatomy-selection-halo").length)
      .toBe(container.querySelectorAll(".anatomy-selection-ring").length);
    const css = readFileSync(resolve(process.cwd(), "client/src/components/anatomy/anatomy-figure.css"), "utf8");
    expect(css).toContain("stroke-width: 1.75");
    expect(css).not.toMatch(/\.anatomy-selection-ring\s*\{[^}]*stroke-width:\s*6/);
  });

  it("offers no flip control, because there is no hidden view left to flip to", () => {
    const { container } = draw();
    expect(container.querySelector(".atlas-flip-btn")).toBeNull();
    expect(container.textContent).not.toContain("Flip to");
    expect(container.querySelector('.anatomy-figure[data-view="both"]')).toBeTruthy();
  });
});
