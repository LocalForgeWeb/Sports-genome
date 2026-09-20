// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnatomyFigure } from "./AnatomyFigure";
import { anatomyViews, drawnMuscleKeys, unresolvedMuscleKeys } from "./figureGeometry";
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
    // defect this replaced, and would be one again. Relative `c` counts; the
    // source anatomy is authored with relative commands throughout.
    for (const view of ["front", "back"] as const) {
      for (const muscle of anatomyViews[view].muscles) {
        for (const path of muscle.paths) {
          expect(path.d, `${path.id} should be curved`).toMatch(/[CcSsQqTtAa]/);
        }
      }
    }
  });

  it("draws both sides of every region, with sides taken from geometry", () => {
    // The source alternates path order between groups, so a side assigned by
    // document order would silently mirror half the body.
    for (const view of ["front", "back"] as const) {
      for (const muscle of anatomyViews[view].muscles) {
        const sides = muscle.paths.map((path) => path.side);
        expect(new Set(sides), `${view}/${muscle.key}`).toEqual(new Set(["left", "right"]));
        expect(sides.filter((s) => s === "left").length, `${view}/${muscle.key} balance`)
          .toBe(sides.filter((s) => s === "right").length);
      }
    }
  });

  it("keeps front and back on one canvas, so a flip does not resize the athlete", () => {
    // Both source figures are authored in one viewBox, so alignment is
    // structural rather than eyeballed.
    expect(anatomyViews.front.mid).toBeCloseTo(anatomyViews.back.mid, 0);
    expect(anatomyViews.front.shell.length).toBe(anatomyViews.back.shell.length);
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
    expect(onSelect.mock.calls[0][0]).toBe("quads");
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

  it("styles every hit path, however deeply the view nests it", () => {
    // The hit layer is invisible only because CSS paints it transparent. As a
    // child selector that rule stopped matching the moment `both` view wrapped
    // each region's targets in a per-body transform group: the paths fell back
    // to SVG's default black fill and the interaction layer painted over the
    // entire figure. Nothing in the DOM says a selector missed, so it is pinned.
    const css = readFileSync(resolve(process.cwd(), "client/src/components/anatomy/anatomy-figure.css"), "utf8");
    expect(css).toContain(".anatomy-hit path {");
    expect(css).not.toContain(".anatomy-hit > path");
    expect(css).not.toContain(".anatomy-hit:focus-visible > path");
  });

  it("carries interaction geometry separately from the drawn muscle", () => {
    const { container } = draw();
    const drawn = container.querySelector('.anatomy-muscle[data-muscle="tibialis"] path')!;
    const hit = container.querySelector('.anatomy-hit[aria-label^="tibialis"] path')!;
    expect(drawn, "tibialis is drawn on the anterior view").toBeTruthy();
    expect(hit, "and has a hit target").toBeTruthy();
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

  it("accounts for every canonical key as either drawn or declared unresolved", () => {
    // A key with no geometry colours nothing. That is acceptable, but it has to
    // be a stated fact in the codebase rather than a mystery on screen, so the
    // artwork declares what it does not draw and this holds the two in step.
    const drawn = new Set([...drawnMuscleKeys.front, ...drawnMuscleKeys.back]);
    for (const key of unresolvedMuscleKeys) {
      expect(drawn.has(key), `${key} is declared unresolved but is drawn`).toBe(false);
      expect(viewsForRegion(key), key).toEqual([]);
    }
  });

  it("resolves umbrella keys onto regions drawn under another key", () => {
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
    for (const key of unresolvedMuscleKeys) expect(catalog.has(key), `${key} is not a catalog key`).toBe(true);
  });
});
