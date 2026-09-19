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

/**
 * One body is on screen at a time, so a muscle drawn on the side facing away has
 * no hit target until the figure turns around. Turning it here keeps these tests
 * about the inspector rather than about which way the body is facing; the tests
 * that are about that are at the bottom of this file.
 */
const select = (container: HTMLElement, label: string) => {
  const hit = () => container.querySelector(`.anatomy-hit[aria-label^="${label}"]`);
  if (!hit()) fireEvent.click(container.querySelector(".atlas-side-toggle")!);
  fireEvent.click(hit()!);
};

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

  it("says which body the selection is drawn on", () => {
    // The card still has to answer "where am I looking?", and it names the view
    // rather than offering to rotate: the figure has already turned to show the
    // selection by the time this is read.
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

  it("shows a selection the app hands it, and keeps a tapped head when the app echoes the key back", () => {
    // Home carries the muscle the athlete reached by search, by an exercise, or
    // by "open the body at this muscle". The map used to ignore it and start
    // blank, so a card named a muscle the figure showed nothing for — the very
    // first thing reported in this work.
    const { container, rerender } = render(createElement(AnatomyMap, { primary: ["glutes", "quads"], secondary: [], onSelect: vi.fn(), selectedKey: "glutes" }));
    expect(container.querySelector('.anatomy-muscle[data-muscle="glutes"]')?.getAttribute("data-selected")).toBe("true");

    // Tapping a head reports the parent key up; the app sets its state to that
    // key and hands it straight back. That is an echo, not a new selection, so
    // the head the athlete pointed at must survive it.
    select(container, "Quadriceps femoris");
    fireEvent.click(container.querySelectorAll(".atlas-part-picker button")[2]);
    expect(container.querySelector(".atlas-inspector-part")?.textContent).toBe("Rectus femoris");
    rerender(createElement(AnatomyMap, { primary: ["glutes", "quads"], secondary: [], onSelect: vi.fn(), selectedKey: "quads" }));
    expect(container.querySelector(".atlas-inspector-part")?.textContent).toBe("Rectus femoris");

    // A genuinely different key from outside moves the selection and drops the head.
    rerender(createElement(AnatomyMap, { primary: ["glutes", "quads"], secondary: [], onSelect: vi.fn(), selectedKey: "glutes" }));
    expect(container.querySelector('.anatomy-muscle[data-muscle="glutes"]')?.getAttribute("data-selected")).toBe("true");
    expect(container.querySelector(".atlas-inspector-part")).toBeNull();
  });

  it("opens on the front and offers a control to turn the figure around", () => {
    const { container } = draw();
    expect(container.querySelector('.anatomy-figure[data-view="front"]')).toBeTruthy();
    expect(container.querySelector('.anatomy-figure[data-view="both"]')).toBeNull();
    const toggle = container.querySelector(".atlas-side-toggle")!;
    expect(toggle.textContent).toContain("Show back");
    fireEvent.click(toggle);
    expect(container.querySelector('.anatomy-figure[data-view="back"]')).toBeTruthy();
    expect(container.querySelector(".atlas-side-toggle")!.textContent).toContain("Show front");
  });

  it("turns to face a selection handed to it by the app", () => {
    // The reason both bodies were on screen at once: a selection made elsewhere
    // could name a muscle drawn only on the side facing away, and the athlete was
    // left reading a card about something not on screen. Turning the figure
    // removes that without halving it.
    const { container } = draw({ primary: ["glutes"], selectedKey: "glutes" });
    expect(container.querySelector('.anatomy-figure[data-view="back"]')).toBeTruthy();
    expect(container.querySelector('.anatomy-muscle[data-muscle="glutes"]')?.getAttribute("data-selected")).toBe("true");
  });

  it("stays put for a selection the side already draws", () => {
    // Trapezius is drawn on both bodies, so there is no reason to move the
    // figure under the athlete.
    const { container } = draw({ primary: ["traps"], selectedKey: "traps" });
    expect(container.querySelector('.anatomy-figure[data-view="front"]')).toBeTruthy();
  });
});
