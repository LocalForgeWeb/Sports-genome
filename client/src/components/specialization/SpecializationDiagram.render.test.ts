// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { forearmMuscleIds as m } from "@shared/specialization/ids";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import type { DiagramAsset, DiagramLayerId, DiagramViewId } from "@shared/specialization/types";
import { deltoidIds, deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { HIT_SQUARE_SHARE, SpecializationDiagram, type SpecializationDiagramProps } from "./SpecializationDiagram";
import { drawnNodes } from "./diagramGeometry";
import type { DiagramFill } from "./model";

/**
 * The diagram renderer (design §12; brief §6): fills from the page's fixed bins, hatch for a
 * mapping not reviewed, a dashed resting fill for mapped-but-no-work, neutral tendons; the
 * selected muscle outlined and named; the left arm mirrored without mirroring its text; tap
 * targets that are 44 pt on a phone; and nothing in it that names a region.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

const asset = forearmRegionData.diagram!;
const nodeById = new Map(forearmRegionData.nodes.map((node) => [node.id, node] as const));
const fills: Record<string, DiagramFill> = {
  [m.brachioradialis]: { kind: "bin", step: 3 },
  [m.flexorCarpiRadialis]: { kind: "zero" },
  [m.palmarisLongus]: { kind: "hatch" },
  [m.flexorCarpiUlnaris]: { kind: "bin", step: 9 },
};

function draw(props: Partial<SpecializationDiagramProps> = {}) {
  const onSelect = vi.fn();
  const utils = render(createElement(SpecializationDiagram, {
    asset,
    view: "palm",
    layer: "surface",
    mirrored: false,
    fillFor: (id: string) => fills[id] ?? { kind: "none" },
    selectedNodeId: null,
    onSelect,
    labelFor: (id: string) => nodeById.get(id)?.shortName ?? id,
    describeFor: (id: string) => `${nodeById.get(id)?.name ?? id}. 3 direct dynamic bouts.`,
    caption: "Forearms, right arm, palm view, surface layer",
    ...props,
  }));
  return { ...utils, onSelect };
}
const belly = (container: HTMLElement, nodeId: string) => container.querySelector<SVGPathElement>(`.spz-diagram-belly[data-node="${nodeId}"]`)!;
const labels = (container: HTMLElement) => Array.from(container.querySelectorAll(".spz-diagram-labels text")).map((text) => ({ text: text.textContent, x: Number(text.getAttribute("x")), anchor: text.getAttribute("text-anchor") }));

describe("fills", () => {
  it("paints bellies from the page's fixed bins, hatch and zero, and leaves the rest at rest", () => {
    const { container } = draw();
    expect(belly(container, m.brachioradialis).getAttribute("data-fill")).toBe("bin-3");
    expect(belly(container, m.brachioradialis).style.fill).toContain("--sg-exposure-3");
    // A step beyond the ramp is held at its top step, never an invented colour.
    expect(belly(container, m.flexorCarpiUlnaris).getAttribute("data-fill")).toBe("bin-5");
    expect(belly(container, m.flexorCarpiUlnaris).style.fill).toContain("--sg-exposure-5");
    expect(belly(container, m.flexorCarpiRadialis).getAttribute("data-fill")).toBe("zero");
    expect(belly(container, m.flexorCarpiRadialis).style.fill).toContain("--sg-role-neutral-on-dark");
    expect(belly(container, m.palmarisLongus).getAttribute("data-fill")).toBe("hatch");
    const hatch = belly(container, m.palmarisLongus).style.fill.match(/url\("?#([^")]+)"?\)/)![1];
    expect(container.querySelector(`pattern[id="${hatch}"]`)).not.toBeNull();
    expect(belly(container, m.pronatorTeres).getAttribute("data-fill")).toBe("none");
  });

  it("matches the legend beside it: the same hatch colours and slant, and the same dashed edge for zero", () => {
    const { container } = draw();
    const pageCss = readFileSync(join(process.cwd(), "client/src/components/specialization/specialization.css"), "utf8");
    const diagramCss = readFileSync(join(process.cwd(), "client/src/components/specialization/specialization-diagram.css"), "utf8");
    // Legend: repeating-linear-gradient(45deg, #6f7d90 0 1px, #2e3a49 1px 5px), so stripes run top-left to bottom-right.
    expect(pageCss).toContain("repeating-linear-gradient(45deg, #6f7d90 0 1px, #2e3a49 1px 5px)");
    const pattern = container.querySelector("pattern")!;
    expect(pattern.getAttribute("patternTransform")).toBe("rotate(-45)");
    expect(Array.from(pattern.querySelectorAll("rect")).map((rect) => rect.getAttribute("fill"))).toEqual(["#2e3a49", "#6f7d90"]);
    // Legend zero swatch: a dashed #9fb3c8 edge on the resting fill.
    expect(pageCss).toMatch(/\.spz-swatch-zero \{ border: 1px dashed #9fb3c8; background: var\(--sg-role-neutral-on-dark\); \}/);
    expect(diagramCss).toContain("--spz-diagram-zero-edge: #9fb3c8;");
    expect(diagramCss).toMatch(/\.spz-diagram-belly\[data-fill="zero"\] \{ stroke: var\(--spz-diagram-zero-edge\);[^}]*stroke-dasharray/);
  });

  it("never paints a tendon, a ghost or bone with exposure, and never asks for their fill", () => {
    const fillFor = vi.fn(() => ({ kind: "bin", step: 4 }) as DiagramFill);
    const { container } = draw({ fillFor, view: "palm", layer: "intermediate" });
    const tendons = container.querySelectorAll(".spz-diagram-tendon");
    expect(tendons.length).toBe(4);
    for (const tendon of Array.from(tendons)) {
      expect(tendon.getAttribute("data-fill")).toBeNull();
      expect((tendon as SVGElement).style.fill).toBe("");
    }
    expect(container.querySelectorAll(".spz-diagram-ghost").length).toBeGreaterThan(0);
    expect(fillFor.mock.calls.map(([id]) => id)).toEqual([m.flexorDigitorumSuperficialis]);
  });
});

describe("selection", () => {
  it("makes every muscle with a belly on the layer a button, and no tendon", () => {
    const { onSelect } = draw({ view: "back", layer: "surface" });
    const buttons = screen.getAllByRole("button");
    const expected = new Set(asset.views.back!.surface!.paths.filter((path) => path.kind === "belly").map((path) => path.nodeId));
    expect(new Set(buttons.map((button) => button.getAttribute("data-node")))).toEqual(expected);
    // EPL has only its tendon on this layer: drawn, not selectable.
    expect(asset.views.back!.surface!.paths.some((path) => path.kind === "tendon" && path.nodeId === m.extensorPollicisLongus)).toBe(true);
    expect(buttons.some((button) => button.getAttribute("data-node") === m.extensorPollicisLongus)).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /^Extensor carpi ulnaris\. 3 direct dynamic bouts\.$/ }));
    expect(onSelect).toHaveBeenCalledWith(m.extensorCarpiUlnaris);
  });

  it("selects from a tap on the muscle as drawn, and from its gutter", () => {
    const { container, onSelect } = draw();
    const reach = container.querySelectorAll(`.spz-diagram-reach [data-hit="${m.flexorCarpiUlnaris}"]`);
    expect(reach.length).toBe(2);
    fireEvent.click(reach[1].querySelector("path")!);
    expect(onSelect).toHaveBeenLastCalledWith(m.flexorCarpiUlnaris);
  });

  it("outlines the selected muscle with its tendons and names it in the margin", () => {
    const { container } = draw({ selectedNodeId: m.flexorCarpiRadialis });
    const selection = container.querySelector(".spz-diagram-selection")!;
    expect(selection.getAttribute("data-node")).toBe(m.flexorCarpiRadialis);
    const drawnPaths = asset.views.palm!.surface!.paths.filter((path) => path.nodeId === m.flexorCarpiRadialis && (path.kind === "belly" || path.kind === "tendon"));
    expect(selection.querySelectorAll(".spz-diagram-ring")).toHaveLength(drawnPaths.length);
    expect(drawnPaths.some((path) => path.kind === "tendon")).toBe(true);
    const callout = container.querySelector(".spz-diagram-callout")!;
    expect(callout.querySelector("text")!.textContent).toBe("FCR");
    expect(screen.getByRole("button", { name: /^Flexor carpi radialis\..*, selected$/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true")).toHaveLength(1);
  });

  it("keeps a selection that is not on this layer, and says where it is", () => {
    const { container, onSelect } = draw({ layer: "deep", selectedNodeId: m.flexorDigitorumSuperficialis });
    expect(container.querySelector(".spz-diagram-callout")).toBeNull();
    expect(screen.getByRole("note").textContent).toBe("FDS is not drawn on this layer. It is drawn in Palm · Middle.");
    expect(screen.getByRole("group").getAttribute("aria-describedby")).toBe(screen.getByRole("note").id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("dashes a surface muscle's outline in gold when it is selected and a deeper layer is shown", () => {
    const { container } = draw({ layer: "intermediate", selectedNodeId: m.flexorCarpiUlnaris });
    expect(container.querySelector(`.spz-diagram-ghost[data-node="${m.flexorCarpiUlnaris}"]`)!.hasAttribute("data-selected")).toBe(true);
    expect(screen.getByRole("note").textContent).toMatch(/^FCU lies above this layer; its outline is dashed here\. It is drawn in Palm · Surface, Back · Surface\.$/);
  });

  it("keeps one tab stop and moves with the arrow keys, Enter selecting", () => {
    const { onSelect } = draw({ selectedNodeId: m.palmarisLongus });
    const buttons = screen.getAllByRole("button");
    expect(buttons.filter((button) => button.getAttribute("tabindex") === "0").map((button) => button.getAttribute("data-node"))).toEqual([m.palmarisLongus]);
    const pl = buttons.find((button) => button.getAttribute("data-node") === m.palmarisLongus)!;
    act(() => { pl.focus(); });
    fireEvent.keyDown(pl, { key: "ArrowDown" });
    expect(document.activeElement).not.toBe(pl);
    expect(document.activeElement?.getAttribute("role")).toBe("button");
    fireEvent.keyDown(document.activeElement!, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(document.activeElement!.getAttribute("data-node"));
    fireEvent.keyDown(document.activeElement!, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});

describe("the left arm", () => {
  it("flips the drawing and re-places the labels, never mirroring text", () => {
    const right = draw();
    const rightLabels = labels(right.container);
    expect(right.container.querySelector(".spz-diagram-svg > g:not(.spz-diagram-labels):not(.spz-diagram-callout)")!.getAttribute("transform")).toBeNull();
    cleanup();
    const left = draw({ mirrored: true });
    const leftLabels = labels(left.container);
    const art = left.container.querySelector(".spz-diagram-art")!.parentElement!;
    expect(art.getAttribute("transform")).toBe("translate(360 0) scale(-1 1)");
    // Text is outside the flipped group: never drawn backwards.
    expect(left.container.querySelector(".spz-diagram-labels")!.closest("[transform]")).toBeNull();
    expect(leftLabels.map((label) => label.text)).toEqual(rightLabels.map((label) => label.text));
    for (const [index, label] of leftLabels.entries()) {
      expect(label.x).toBeCloseTo(360 - rightLabels[index].x);
      expect(label.anchor).toBe(rightLabels[index].anchor === "start" ? "end" : "start");
    }
    // Right arm, palm view: thumb side on the left. Left arm: on the right.
    expect(rightLabels.find((label) => label.text === "Thumb side")!.x).toBeLessThan(180);
    expect(leftLabels.find((label) => label.text === "Thumb side")!.x).toBeGreaterThan(180);
  });

  it("moves the selected muscle's name to the side the muscle is drawn on", () => {
    const right = draw({ selectedNodeId: m.brachioradialis });
    const rightBox = Number(right.container.querySelector(".spz-diagram-callout rect")!.getAttribute("x"));
    cleanup();
    const left = draw({ selectedNodeId: m.brachioradialis, mirrored: true });
    const leftBox = Number(left.container.querySelector(".spz-diagram-callout rect")!.getAttribute("x"));
    expect(rightBox).toBeLessThan(180);
    expect(leftBox).toBeGreaterThan(180);
    expect(left.container.querySelector(".spz-diagram-callout text")!.textContent).toBe("BR");
  });
});

describe("tap targets on a phone", () => {
  // The page draws the diagram about 324 px wide on a 390 pt phone (16 px gutters and card
  // padding) and about 309 px on a 375 pt phone. Rendered sizes measured in Chromium are in
  // docs/specialization-atlas/evidence/hit-targets.json.
  const views: [DiagramViewId, DiagramLayerId][] = [["palm", "surface"], ["palm", "intermediate"], ["palm", "deep"], ["back", "surface"], ["back", "deep"], ["thumb", "surface"], ["thumb", "deep"]];
  const side = HIT_SQUARE_SHARE * asset.viewBox.width;

  it("gives every muscle a square at least 44 px across at the phone's drawing width", () => {
    expect((side * 309) / asset.viewBox.width).toBeGreaterThanOrEqual(44);
    const { container } = draw({ view: "back", layer: "surface" });
    for (const button of screen.getAllByRole("button")) {
      const rect = button.querySelector("rect")!;
      expect(Number(rect.getAttribute("width"))).toBeCloseTo(side);
      expect(Number(rect.getAttribute("height"))).toBeCloseTo(side);
    }
    expect(container.querySelectorAll(".spz-diagram-hits rect").length).toBe(screen.getAllByRole("button").length);
  });

  it("places the squares so none overlaps another and each stays on the canvas, on every layer", () => {
    for (const [view, layer] of views) {
      const placedNodes = drawnNodes(asset.views[view]![layer]!.paths, { square: side, canvas: asset.viewBox });
      for (const node of placedNodes) {
        expect(node.hitAnchor.x - side / 2, `${view}/${layer} ${node.nodeId}`).toBeGreaterThanOrEqual(-0.01);
        expect(node.hitAnchor.y - side / 2, `${view}/${layer} ${node.nodeId}`).toBeGreaterThanOrEqual(-0.01);
        expect(node.hitAnchor.x + side / 2).toBeLessThanOrEqual(asset.viewBox.width + 0.01);
        expect(node.hitAnchor.y + side / 2).toBeLessThanOrEqual(asset.viewBox.height + 0.01);
      }
      for (let i = 0; i < placedNodes.length; i++) for (let j = i + 1; j < placedNodes.length; j++) {
        const a = placedNodes[i].hitAnchor;
        const b = placedNodes[j].hitAnchor;
        expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)), `${view}/${layer}: ${placedNodes[i].nodeId} and ${placedNodes[j].nodeId}`).toBeGreaterThanOrEqual(side - 0.01);
      }
    }
  });

  it("lets taps pass through the labels and the selected muscle's name", () => {
    const css = readFileSync(join(process.cwd(), "client/src/components/specialization/specialization-diagram.css"), "utf8");
    expect(css).toMatch(/\.spz-diagram-labels, \.spz-diagram-callout \{ pointer-events: none; \}/);
    // Nothing that matters appears only on hover (CLAUDE.md): no :hover rule at all.
    expect(css).not.toContain(":hover");
  });
});

describe("region-agnostic", () => {
  it("draws another region's asset with no code of its own (the deltoid fixture)", () => {
    const fixture = deltoidRegionData.diagram as DiagramAsset;
    const onSelect = vi.fn();
    render(createElement(SpecializationDiagram, {
      asset: fixture, view: "back", layer: "surface", mirrored: false,
      fillFor: () => ({ kind: "bin", step: 2 }), selectedNodeId: deltoidIds.lateral, onSelect,
      labelFor: (id: string) => id, caption: "Deltoids",
    }));
    expect(screen.getAllByRole("button").map((button) => button.getAttribute("data-node")).sort()).toEqual([deltoidIds.anterior, deltoidIds.lateral, deltoidIds.posterior].sort());
    expect(screen.getByText("Front")).not.toBeNull();
  });

  it("says when a view is not drawn instead of failing", () => {
    render(createElement(SpecializationDiagram, {
      asset: deltoidRegionData.diagram!, view: "palm", layer: "deep", mirrored: false,
      fillFor: () => ({ kind: "none" }), selectedNodeId: null, onSelect: () => {}, labelFor: (id: string) => id, caption: "Deltoids",
    }));
    expect(screen.getByText("Deltoids. This view is not drawn.")).not.toBeNull();
  });

  it("names no region and no muscle in the renderer's code", () => {
    const regionWords = /forearm|deltoid|brachioradialis|wrist|elbow|\bfc[ru]\b|\bfd[sp]\b|\becr[lb]\b|biceps|pronat|supinat/i;
    for (const file of ["SpecializationDiagram.tsx", "diagramGeometry.ts", "specialization-diagram.css"]) {
      const source = readFileSync(join(process.cwd(), "client/src/components/specialization", file), "utf8");
      const hits = source.split("\n").map((line, index) => [index + 1, line] as const).filter(([, line]) => regionWords.test(line));
      expect(hits, file).toEqual([]);
    }
  });
});
