import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { rankPaint } from "./rankPaint";
import { AnatomyRegionGrid } from "./AnatomyRegionGrid";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/** Sep 28 regression brief §10: one paint rule for the Strength map and its row thumbnails. */
describe("rank paint", () => {
  it("paints a rank's token, the unscored hatch, or nothing", () => {
    expect(rankPaint("state", "p")).toBe("var(--sg-rank-state-color)");
    expect(rankPaint("unscored", "p")).toBe("url(#p)");
    expect(rankPaint(undefined, "p")).toBeUndefined();
  });

  it("hatches a not-scored thumbnail instead of painting it like Prospect", () => {
    const markup = renderToStaticMarkup(createElement(AnatomyRegionGrid, {
      label: "Regions",
      onSelect: () => undefined,
      rows: [
        { id: "calves", label: "Calves", muscleKeys: ["calves"], state: "Prospect", active: true, rankId: "prospect" },
        { id: "biceps", label: "Biceps", muscleKeys: ["biceps"], state: "Not scored", active: false, unscored: true },
      ],
    }));
    expect(markup).toContain('data-encoding="rank"');
    expect(markup).toMatch(/<pattern id="[^"]+-unscored"/);
    expect(markup).toMatch(/class="region-thumb-muscle"[^>]*style="fill:url\(#[^)]+-unscored\)"[^>]*data-unscored="true"/);
    expect(markup).toMatch(/style="fill:var\(--sg-rank-prospect-color\)"/);
  });

  it("gives World Stage its 1.5px silver edge: the 1px rule no longer overrides it", () => {
    const css = readFileSync(resolve(process.cwd(), "client/src/capability-rank.css"), "utf8");
    expect(css).toContain('.anatomy-figure[data-encoding="rank"] .anatomy-muscle[data-rank]:not([data-rank="world_stage"]) > path { stroke-width: 1; }');
    expect(css).not.toContain('.anatomy-figure[data-encoding="rank"] .anatomy-muscle[data-rank] > path { stroke-width: 1; }');
  });
});
