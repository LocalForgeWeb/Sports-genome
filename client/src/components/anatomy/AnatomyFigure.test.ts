// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnatomyFigure } from "./AnatomyFigure";
import { anatomyViews, drawnMuscleKeys } from "./figureGeometry";
import { regionKeysForValue, roleMapForLists, viewsForRegion } from "@/lib/anatomyRegions";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

const draw = (props: Partial<Parameters<typeof AnatomyFigure>[0]> = {}) =>
  render(createElement(AnatomyFigure, {
    view: "front", roles: {}, selectedKeys: [], onSelect: vi.fn(),
    labelFor: (key: string) => key, ...props,
  }));

describe("the drawn figure", () => {
  it("draws curves, which is the whole point of replacing the old geometry", () => {
    // Every posterior muscle in the `body-muscles` package was an L-only
    // polygon of four to eight points — `deltoid-rear-left` was a triangle — so
    // the back read as armour panels. A path with no cubic segment is the
    // defect this replaced, and would be one again.
    for (const view of ["front", "back"] as const) {
      for (const muscle of anatomyViews[view].muscles) {
        for (const path of muscle.paths) {
          expect(path.d, `${path.id} should be curved`).toContain("C");
        }
      }
    }
  });

  it("mirrors every region, so bilateral symmetry cannot drift", () => {
    for (const view of ["front", "back"] as const) {
      for (const muscle of anatomyViews[view].muscles) {
        const sides = new Set(muscle.paths.map((path) => path.side));
        expect([...sides].sort(), `${view}/${muscle.key}`).toEqual(["left", "right"]);
      }
    }
  });

  it("keeps front and back on one canvas, so a flip does not resize the athlete", () => {
    expect(anatomyViews.front.outline).toBe(anatomyViews.back.outline);
  });

  it("gives each region exactly one canonical key, which is what makes a tap unambiguous", () => {
    for (const view of ["front", "back"] as const) {
      const keys = anatomyViews[view].muscles.map((muscle) => muscle.key);
      expect(new Set(keys).size, `${view} has a duplicated key`).toBe(keys.length);
    }
  });

  it("orders hit targets largest-first, so a small muscle's target lands on top", () => {
    for (const view of ["front", "back"] as const) {
      const areas = anatomyViews[view].muscles.map((muscle) => muscle.area);
      expect(areas, view).toEqual([...areas].sort((a, b) => b - a));
    }
  });
});

describe("selecting a muscle", () => {
  it("reports the canonical key, not a path or a side", () => {
    const onSelect = vi.fn();
    const { container } = draw({ onSelect });
    const target = container.querySelector('.anatomy-hit[aria-label^="quads"]')!;
    fireEvent.click(target);
    expect(onSelect).toHaveBeenCalledWith("quads");
  });

  it("is one stop in the page's tab order, with arrows moving inside it", () => {
    const { container } = draw();
    expect(container.querySelectorAll('.anatomy-hit[tabindex="0"]').length).toBe(1);
    expect(container.querySelectorAll('.anatomy-hit[role="button"]').length)
      .toBe(anatomyViews.front.muscles.length);
  });

  it("activates on Enter and on Space", () => {
    const onSelect = vi.fn();
    const { container } = draw({ onSelect });
    const target = container.querySelector('.anatomy-hit[aria-label^="chest"]')!;
    fireEvent.keyDown(target, { key: "Enter" });
    fireEvent.keyDown(target, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("names its state for a screen reader rather than leaving it to colour", () => {
    const { container } = draw({ roles: { chest: "primary", triceps: "supporting" }, selectedKeys: ["chest"] });
    const chest = container.querySelector('.anatomy-hit[aria-label^="chest"]')!;
    expect(chest.getAttribute("aria-label")).toBe("chest, primary role, selected");
    expect(chest.getAttribute("aria-pressed")).toBe("true");
    const quads = container.querySelector('.anatomy-hit[aria-label^="quads"]')!;
    expect(quads.getAttribute("aria-label")).toBe("quads, not involved");
  });

  it("marks selection with an outline as well as colour, since a primary muscle is already red", () => {
    const { container } = draw({ roles: { chest: "primary" }, selectedKeys: ["chest"] });
    expect(container.querySelectorAll(".anatomy-selection-ring").length).toBeGreaterThan(0);
    expect(container.querySelector('.anatomy-muscle[data-muscle="chest"]')?.getAttribute("data-selected")).toBe("true");
  });

  it("carries interaction geometry separately from the drawn muscle", () => {
    const { container } = draw();
    const drawn = container.querySelector('.anatomy-muscle[data-muscle="peroneals"] path')!;
    const hit = container.querySelector('.anatomy-hit[aria-label^="peroneals"] path')!;
    // Same outline, so no muscle is enlarged to be tappable...
    expect(hit.getAttribute("d")).toBe(drawn.getAttribute("d"));
    // ...and the target grows through a transparent halo stroke instead.
    expect(Number(hit.getAttribute("stroke-width"))).toBeGreaterThan(0);
  });
});

describe("canonical key coverage", () => {
  it("has a home for every key Body Lab can hand it, including the one that had none", () => {
    // `upperBack` is primary on 56 catalog exercises and secondary on 39, and
    // the figure this replaces had no region for it at all.
    expect(drawnMuscleKeys.back).toContain("upperBack");
    expect(viewsForRegion("upperBack")).toEqual(["back"]);
  });

  it("frees the keys that could never be selected before", () => {
    // These six were shadowed by first-match-wins resolution over a map where
    // several keys claimed one third-party path id.
    for (const key of ["brachialis", "tfl", "peroneals", "rotatorCuff"]) {
      expect(viewsForRegion(key).length, key).toBeGreaterThan(0);
    }
    // These two resolve onto regions drawn under another key, by explicit rule.
    expect(regionKeysForValue("shoulders")).toEqual(["frontDelts", "sideDelts", "rearDelts"]);
    expect(regionKeysForValue("rhomboids")).toEqual(["upperBack"]);
  });

  it("routes upperBack to a region instead of silently colouring nothing", () => {
    expect(regionKeysForValue("upperBack")).toEqual(["upperBack"]);
    expect(roleMapForLists(["upperBack"], [])).toEqual({ upperBack: "primary" });
  });

  it("lets primary win a region that is also listed as supporting", () => {
    expect(roleMapForLists(["chest"], ["chest", "triceps"])).toEqual({ chest: "primary", triceps: "supporting" });
  });

  it("draws no muscle the catalog does not name", () => {
    const catalog = new Set([
      "abductors", "abs", "adductors", "biceps", "brachialis", "brachioradialis", "calves",
      "chest", "feet", "forearms", "frontDelts", "glutes", "hamstrings", "hipFlexors", "lats",
      "lowerBack", "obliques", "peroneals", "quads", "rearDelts", "rotatorCuff",
      "serratusAnterior", "sideDelts", "soleus", "tfl", "tibialis", "traps", "triceps", "upperBack",
    ]);
    for (const view of ["front", "back"] as const) {
      for (const key of drawnMuscleKeys[view]) expect(catalog.has(key), `${key} is not a catalog key`).toBe(true);
    }
  });
});
