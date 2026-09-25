import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RANKS } from "@shared/capabilityRank";
import { RankIcon } from "./RankIcon";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const draw = (rankId: (typeof RANKS)[number]["id"], size: number, labelled = false) =>
  renderToStaticMarkup(createElement(RankIcon, { rankId, size, labelled }));

describe("A rank's approved badge", () => {
  it("is the supplied artwork, contained in the box it is given, with both runtime sizes on offer", () => {
    const html = draw("varsity", 64);
    expect(html).toContain('src="/rank-icons/varsity.webp"');
    expect(html).toContain('srcSet="/rank-icons/varsity-128.webp 128w, /rank-icons/varsity.webp 384w"');
    expect(html).toContain('sizes="64px"');
    expect(html).toContain('width="64" height="64"');
    expect(html).toContain('data-rank-icon="varsity"');
  });

  /** Beside the rank's name it is decoration; on its own it says which rank it is. */
  it("is decorative by default and named only when it stands alone", () => {
    expect(draw("state", 32)).toContain('alt=""');
    expect(draw("state", 32, true)).toContain('alt="State Circuit rank"');
  });

  /**
   * The crimson and obsidian badges were not supplied. Those ranks draw the emblem, and never
   * one of the five badges or an older design, so the gap is visible rather than papered over.
   */
  it("falls back to the drawn emblem, not another rank's badge, where artwork is missing", () => {
    for (const id of ["national", "world_stage"] as const) {
      const html = draw(id, 48);
      expect(html).not.toContain("<img");
      expect(html).toContain(`data-rank-emblem="${id}"`);
    }
  });

  it("renders every supplied rank as artwork and nothing else", () => {
    for (const rank of RANKS.filter((r) => r.iconSrc)) expect(draw(rank.id, 32)).toContain("<img");
  });
});

/** No rule may recolour, fade or filter the approved art. */
describe("The stylesheet leaves the artwork alone", () => {
  // Comments stripped: a rule that says "no opacity" in words is the point, not a violation.
  const css = (readFileSync(resolve(process.cwd(), "client/src/capability-rank.css"), "utf8")
    + readFileSync(resolve(process.cwd(), "client/src/components/anatomy/anatomy-region-grid.css"), "utf8"))
    .replace(/\/\*[\s\S]*?\*\//g, "");

  it("applies no filter, tint, blend or opacity to a rank icon", () => {
    const rules = css.match(/[^{}]*rank-icon[^{]*\{[^}]*\}/g) ?? [];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule).not.toMatch(/filter|opacity|mix-blend-mode|background-blend-mode|mask/);
  });

  it("contains the artwork rather than stretching it", () => {
    expect(css).toMatch(/\.rank-icon \{[^}]*object-fit: contain/);
  });
});
