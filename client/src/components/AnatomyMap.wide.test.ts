// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnatomyMap } from "./AnatomyMap";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const draw = (props: Partial<Parameters<typeof AnatomyMap>[0]> = {}) =>
  render(createElement(AnatomyMap, { primary: ["glutes", "quads"], secondary: ["abs"], onSelect: vi.fn(), ...props }));

/**
 * Handoff 03: both bodies with static FRONT and BACK captions where they fit,
 * one body and a labelled switch where they do not. A phone would halve every
 * tap target to show both; a laptop would waste half its width to show one.
 */
describe("the body chart on a wide screen", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("720px"), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("draws both bodies with static captions and no turn control", () => {
    const { container } = draw();
    expect(container.querySelector('.anatomy-figure[data-view="both"]')).toBeTruthy();
    expect(container.querySelector(".atlas-side-toggle")).toBeNull();
    const captions = [...container.querySelectorAll(".atlas-view-captions-pair span")].map((node) => node.textContent);
    expect(captions).toEqual(["Front", "Back"]);
  });

  it("selects the same muscle from the figure and from its row", () => {
    const onSelect = vi.fn();
    const { container } = draw({ onSelect });
    fireEvent.click(container.querySelector('.anatomy-hit[aria-label^="Gluteal complex"]')!);
    expect(onSelect).toHaveBeenLastCalledWith("glutes");
    const row = container.querySelector('.atlas-role-row[aria-pressed="true"]');
    expect(row?.textContent).toContain("Gluteal complex");
    fireEvent.click([...container.querySelectorAll(".atlas-role-row")].find((node) => node.textContent?.includes("Quadriceps"))!);
    expect(onSelect).toHaveBeenLastCalledWith("quads");
    expect(container.querySelector('.anatomy-muscle[data-muscle="quads"]')?.getAttribute("data-selected")).toBe("true");
  });
});

describe("the body chart on a phone", () => {
  afterEach(cleanup);

  it("draws one body and the control that turns it", () => {
    // jsdom has no matchMedia, which is the narrow case.
    const { container } = draw();
    expect(container.querySelector('.anatomy-figure[data-view="front"]')).toBeTruthy();
    expect(container.querySelector(".atlas-side-toggle")).toBeTruthy();
    expect(container.querySelector(".atlas-view-captions-pair")).toBeNull();
  });

  it("says the rest of the body is unrecorded for this action, not unused", () => {
    const { container } = draw();
    fireEvent.click(container.querySelector(".atlas-ranking-toggle")!);
    const unrecorded = container.querySelectorAll(".atlas-role-row-unrecorded");
    expect(unrecorded.length).toBeGreaterThan(0);
    expect(unrecorded[0].textContent).toContain("No role recorded");
    expect(container.textContent).not.toContain("Not used here");
  });
});
