// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React, { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnatomyFigure } from "./AnatomyFigure";
import { exposurePaint, exposureStep } from "./exposurePaint";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

// jsdom gives import.meta.url an http scheme, so the stylesheet is resolved from the working directory.
const css = readFileSync(resolve(process.cwd(), "client/src/components/anatomy/anatomy-figure.css"), "utf8");

const draw = (props: Partial<Parameters<typeof AnatomyFigure>[0]> = {}) =>
  render(createElement(AnatomyFigure, { view: "both", roles: { chest: "primary" }, selectedKeys: [], onSelect: vi.fn(), labelFor: (key: string) => key, ...props }));

const fillOf = (container: HTMLElement, key: string) => (container.querySelector(`.anatomy-muscle[data-muscle="${key}"] > path`) as SVGPathElement).style.fill;

/**
 * The week board paints the figure by planned exposure (5 October 2026 brief §3): a fixed
 * five-step scale for the week, unknown hatched, zero left as the resting muscle. The paint
 * must say which of those three a region is, and never borrow a role or rank colour.
 */
describe("exposure encoding", () => {
  it("quantises against the maximum, with nothing at zero and the top step at the maximum", () => {
    expect(exposureStep(0, 20)).toBe(0);
    expect(exposureStep(0.5, 20)).toBe(1);
    expect(exposureStep(8, 20)).toBe(2);
    expect(exposureStep(8.5, 20)).toBe(3);
    expect(exposureStep(20, 20)).toBe(5);
    expect(exposureStep(25, 20)).toBe(5);
    expect(exposureStep(3, 0)).toBe(0);
    expect(exposurePaint("unknown", 20, "p")).toBe("url(#p)");
    expect(exposurePaint(0, 20, "p")).toBeUndefined();
    expect(exposurePaint(undefined, 20, "p")).toBeUndefined();
    expect(exposurePaint(20, 20, "p")).toBe("var(--sg-exposure-5)");
  });

  it("paints a region by its step, hatches an unknown one and leaves zero as the resting muscle", () => {
    const { container } = draw({ exposureFor: { chest: 20, quads: 3, abs: "unknown", biceps: 0 }, exposureMax: 20 });
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("data-encoding")).toBe("exposure");
    expect(fillOf(container, "chest")).toBe("var(--sg-exposure-5)");
    expect(fillOf(container, "quads")).toBe("var(--sg-exposure-1)");
    expect(fillOf(container, "abs")).toMatch(/^url\("?#.*-unscored"?\)$/);
    expect(fillOf(container, "biceps")).toBe("");
    expect(fillOf(container, "lats")).toBe("");
    expect(container.querySelector('.anatomy-muscle[data-muscle="chest"]')!.getAttribute("data-exposure")).toBe("5");
    expect(container.querySelector('.anatomy-muscle[data-muscle="abs"]')!.getAttribute("data-exposure")).toBe("unknown");
    expect(container.querySelector('.anatomy-muscle[data-muscle="biceps"]')!.hasAttribute("data-exposure")).toBe(false);
    // The role given for chest is ignored: this figure says how much, not what role.
    expect(container.querySelector('.anatomy-muscle[data-muscle="chest"]')!.hasAttribute("data-role")).toBe(false);
    expect(container.querySelector("pattern")).not.toBeNull();
    // The hatch carries fallbacks: without the rank stylesheet an unresolved var() fill paints black.
    expect(Array.from(container.querySelectorAll("pattern rect")).map((rect) => rect.getAttribute("fill"))).toEqual(["var(--sg-rank-unavailable-fill, #2e3a49)", "var(--sg-rank-unavailable-hatch, #6f7d90)"]);
  });

  it("keeps the ramp as five distinct tokens of one hue, none of them a role or rank colour", () => {
    const tokens = [1, 2, 3, 4, 5].map((step) => css.match(new RegExp(`--sg-exposure-${step}: (#[0-9a-f]{6});`))?.[1]);
    expect(tokens.every(Boolean)).toBe(true);
    expect(new Set(tokens).size).toBe(5);
    const lightness = tokens.map((hex) => { const n = Number.parseInt(hex!.slice(1), 16); return ((n >> 16) & 255) * 0.2126 + ((n >> 8) & 255) * 0.7152 + (n & 255) * 0.0722; });
    expect(lightness).toEqual([...lightness].sort((a, b) => a - b));
    // Step 1 is a clear lightness step above the resting muscle, not a change of hue alone.
    const linear = (hex: string) => { const n = Number.parseInt(hex.slice(1), 16); return [16, 8, 0].map((shift) => { const c = ((n >> shift) & 255) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); };
    const luminance = (hex: string) => { const [r, g, b] = linear(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const resting = css.match(/--sg-role-neutral-on-dark: (#[0-9a-f]{6});/)![1];
    expect((luminance(tokens[0]!) + 0.05) / (luminance(resting) + 0.05)).toBeGreaterThanOrEqual(1.5);
    for (const role of ["--sg-role-primary-1", "--sg-role-supporting-1", "--sg-role-stabilizing-1"]) {
      const value = css.match(new RegExp(`${role}: (#[0-9a-f]{6});`))?.[1];
      expect(tokens).not.toContain(value);
    }
  });

  it("uses the caller's description for each region's accessible name", () => {
    const { container } = draw({ exposureFor: { chest: 20 }, exposureMax: 20, describeFor: (key) => (key === "chest" ? "Pectoralis major, 20 attributed sets" : undefined) });
    expect(container.querySelector('.anatomy-hit[aria-label^="Pectoralis major, 20 attributed sets"]')).not.toBeNull();
  });
});
