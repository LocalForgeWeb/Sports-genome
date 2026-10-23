// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiagramLayerId, DiagramViewId } from "@shared/specialization/types";
import { fxPixels, fxPlates } from "./__fixtures__/plates";
import type { DiagramFill } from "./model";

/**
 * The plate renderer (PlateDiagram.tsx) on a made-up region's plates: one 44 px chip per muscle of
 * the pass, a tap read from the label image (and the nearest muscle within 12 px), a muscle chosen
 * elsewhere moving the page to a pass that shows it, a view the athlete chose kept with a note
 * saying where the muscle is, and only the pass shown loaded.
 */

const assets = vi.hoisted(() => ({ loads: [] as string[] }));
vi.mock("./plateAssets", () => ({
  loadPlatePass: (pass: { id: string; nodeIds: string[] }) => { assets.loads.push(pass.id); return Promise.resolve(fxPixels(pass.nodeIds.length)); },
  loadedPlatePass: () => null,
  platePublicUrl: (path: string) => `/${path}`,
}));
import { PlateDiagram, PlateCredit, type PlateDiagramProps } from "./PlateDiagram";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const painted: { width: number; height: number }[] = [];
beforeEach(() => {
  assets.loads.length = 0;
  painted.length = 0;
  // jsdom has no canvas: a stand-in context that records what is painted.
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return {
      createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: (image: { width: number; height: number }) => { painted.push({ width: image.width, height: image.height }); },
    } as unknown as CanvasRenderingContext2D;
  } as typeof HTMLCanvasElement.prototype.getContext;
});
afterEach(() => { cleanup(); document.head.querySelectorAll("style[data-test]").forEach((node) => node.remove()); });

const names: Record<string, string> = { "fx.a": "A", "fx.b": "Bee", "fx.c": "C", "fx.d": "D", "fx.e": "E" };
const fills: Record<string, DiagramFill> = { "fx.a": { kind: "bin", step: 3 }, "fx.b": { kind: "zero" }, "fx.c": { kind: "hatch" } };
function props(over: Partial<PlateDiagramProps> = {}): PlateDiagramProps {
  return {
    plates: fxPlates, view: "front", layer: "surface",
    fillFor: (nodeId) => fills[nodeId] ?? { kind: "none" },
    selectedNodeId: null, onSelect: vi.fn(), onShowPass: vi.fn(),
    labelFor: (nodeId) => names[nodeId] ?? nodeId,
    describeFor: (nodeId) => `${names[nodeId]} muscle. 3 direct bouts.`,
    caption: "Fx limb, front view, surface layer",
    ...over,
  };
}
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const chips = () => within(screen.getByRole("list", { name: "Muscles in this image" })).getAllByRole("button");

describe("the chips: every muscle of the pass a 44 px target", () => {
  it("renders one chip per muscle of the pass shown, by its short name, with its fill and whether it is chosen", async () => {
    render(createElement(PlateDiagram, props({ selectedNodeId: "fx.a" })));
    await settle();
    expect(chips().map((chip) => chip.textContent)).toEqual(["A", "Bee"]);
    expect(chips().map((chip) => chip.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    expect(chips().map((chip) => chip.getAttribute("data-fill"))).toEqual(["bin-3", "zero"]);
    expect(chips()[0].getAttribute("aria-label")).toBe("A muscle. 3 direct bouts. Selected.");
    // The group the page names, and the canvas's text alternative.
    expect(screen.getByRole("group", { name: "Fx limb, front view, surface layer. 2 muscles to choose from." })).not.toBeNull();
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Rendered image: A, Bee. A outlined in gold. Each muscle is also a button below.");
  });

  it("gives every chip at least 44 × 44 px (2.75rem at the 16 px root), outlined at rest", async () => {
    const style = document.createElement("style");
    style.dataset.test = "";
    style.textContent = readFileSync(join(process.cwd(), "client/src/components/specialization/plate-diagram.css"), "utf8");
    document.head.appendChild(style);
    render(createElement(PlateDiagram, props({ view: "rear", layer: "deep" })));
    await settle();
    expect(chips()).toHaveLength(2);
    for (const chip of chips()) {
      const computed = getComputedStyle(chip);
      // jsdom resolves 2.75rem against the 16 px root.
      expect(computed.minHeight).toBe("44px");
      expect(computed.minWidth).toBe("44px");
    }
    // Outlined at rest (the border is a shorthand with a token, which jsdom does not expand).
    expect(style.textContent).toMatch(/\.spz-plate-chip \{[^}]*border: 1px solid var\(--sg-control-border-on-dark\)/);
    expect(style.textContent).toMatch(/\.spz-plate-go \{[^}]*min-height: 2\.75rem/);
  });

  it("chooses a muscle from its chip", async () => {
    const onSelect = vi.fn();
    render(createElement(PlateDiagram, props({ onSelect })));
    await settle();
    fireEvent.click(chips()[1]);
    expect(onSelect).toHaveBeenCalledWith("fx.b");
  });
});

describe("a tap on the plate", () => {
  /** The canvas drawn 80 × 20 CSS px for the 40 × 10 frame: two screen pixels per label pixel. */
  const drawnAt = (canvas: Element) => vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ left: 100, top: 50, width: 80, height: 20, right: 180, bottom: 70, x: 100, y: 50, toJSON: () => ({}) } as DOMRect);

  it("chooses the muscle under the finger, or the nearest within 12 px, and nothing further away", async () => {
    const onSelect = vi.fn();
    render(createElement(PlateDiagram, props({ onSelect })));
    await settle();
    const canvas = screen.getByRole("img");
    drawnAt(canvas);
    fireEvent.click(canvas, { clientX: 100 + 2 * 3.5, clientY: 60 });
    expect(onSelect).toHaveBeenLastCalledWith("fx.a");
    // 4 label pixels (8 px on screen) right of A's last column: within 12 px, so A.
    fireEvent.click(canvas, { clientX: 100 + 2 * 9.5, clientY: 60 });
    expect(onSelect).toHaveBeenLastCalledWith("fx.a");
    // 3 label pixels (6 px) left of the second muscle.
    fireEvent.click(canvas, { clientX: 100 + 2 * 27.5, clientY: 60 });
    expect(onSelect).toHaveBeenLastCalledWith("fx.b");
    onSelect.mockClear();
    // Midway, 12 label pixels (24 px) from either: nothing.
    fireEvent.click(canvas, { clientX: 100 + 2 * 17.5, clientY: 60 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("paints the pass once it has loaded, at twice its size, in the next frame", async () => {
    render(createElement(PlateDiagram, props()));
    await settle();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
    expect(document.querySelector(".spz-plate")!.getAttribute("data-status")).toBe("ready");
    expect(painted.at(-1)).toEqual({ width: 80, height: 20 });
  });
});

describe("passes", () => {
  it("loads the pass shown, and only that one", async () => {
    render(createElement(PlateDiagram, props()));
    await settle();
    expect(assets.loads).toEqual(["front-surface"]);
  });

  it("moves to a pass that shows a deep muscle chosen elsewhere, without loading the pass it leaves", async () => {
    const onShowPass = vi.fn();
    const view = render(createElement(PlateDiagram, props({ onShowPass })));
    await settle();
    assets.loads.length = 0;
    view.rerender(createElement(PlateDiagram, props({ onShowPass, selectedNodeId: "fx.c" })));
    await settle();
    expect(onShowPass).toHaveBeenCalledWith("front", "deep");
    view.rerender(createElement(PlateDiagram, props({ onShowPass, selectedNodeId: "fx.c", layer: "deep" })));
    await settle();
    expect(assets.loads).toEqual(["front-deep"]);
    expect(chips().map((chip) => chip.getAttribute("aria-pressed"))).toEqual(["true"]);
  });

  it("opened with a muscle this pass does not show, goes straight to its pass and loads nothing else", async () => {
    const onShowPass = vi.fn<(view: DiagramViewId, layer: DiagramLayerId) => void>();
    const view = render(createElement(PlateDiagram, props({ onShowPass, selectedNodeId: "fx.e" })));
    await settle();
    expect(onShowPass).toHaveBeenCalledWith("rear", "deep");
    expect(assets.loads).toEqual([]);
    view.rerender(createElement(PlateDiagram, props({ onShowPass, selectedNodeId: "fx.e", view: "rear", layer: "deep" })));
    await settle();
    expect(assets.loads).toEqual(["rear-deep"]);
  });

  it("keeps a view the athlete chose, and says where the chosen muscle is, with a button to go there", async () => {
    const onShowPass = vi.fn();
    const view = render(createElement(PlateDiagram, props({ onShowPass, selectedNodeId: "fx.c", layer: "deep" })));
    await settle();
    view.rerender(createElement(PlateDiagram, props({ onShowPass, selectedNodeId: "fx.c", view: "rear", layer: "surface" })));
    await settle();
    expect(onShowPass).not.toHaveBeenCalled();
    expect(screen.getByRole("note").textContent).toBe("C is not shown in this view and layer. It is shown in Front · Deep, Rear · Deep.");
    expect(screen.getByRole("group", { name: /^Fx limb/ }).getAttribute("aria-describedby")).toBe(screen.getByRole("note").id);
    fireEvent.click(screen.getByRole("button", { name: "Show Rear · Deep" }));
    expect(onShowPass).toHaveBeenCalledWith("rear", "deep");
  });

  it("says plainly when no pass shows the chosen muscle", async () => {
    render(createElement(PlateDiagram, props({ selectedNodeId: "fx.elsewhere" })));
    await settle();
    expect(screen.getByRole("note").textContent).toBe("fx.elsewhere is not part of this drawing.");
    expect(screen.queryByRole("button", { name: /^Show / })).toBeNull();
  });
});

describe("the credit", () => {
  it("is the plates' own: its words and its links", () => {
    render(createElement(PlateCredit, { plates: fxPlates }));
    const credit = document.querySelector(".spz-plate-credit")!;
    expect(credit.textContent).toBe("Rendered from a test model (CC BY-SA 4.0); adapted renders.");
    expect(screen.getByRole("link", { name: "a test model" }).getAttribute("href")).toBe("https://example.org/model");
  });
});
