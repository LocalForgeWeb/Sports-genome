import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * A rank without approved artwork - a badge withdrawn, or a new rank before its art exists -
 * draws the emblem from rankEmblems.ts, never another rank's badge or an older design. The
 * table has artwork for all seven today, so the case is staged by taking National's away.
 */
vi.mock("@shared/capabilityRank", async (importOriginal) => {
  const original = await importOriginal<typeof import("@shared/capabilityRank")>();
  const RANKS = original.RANKS.map((rank) => (rank.id === "national" ? { ...rank, iconSrc: null } : rank));
  return { ...original, RANKS, rankById: new Map(RANKS.map((rank) => [rank.id, rank])) };
});

import { RankIcon } from "./RankIcon";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("A rank whose artwork is missing", () => {
  it("draws its own emblem instead of an image", () => {
    const html = renderToStaticMarkup(createElement(RankIcon, { rankId: "national", size: 48 }));
    expect(html).not.toContain("<img");
    expect(html).toContain('data-rank-emblem="national"');
    expect(html).toContain('width="48" height="48"');
  });

  it("leaves the other ranks on their artwork", () => {
    const html = renderToStaticMarkup(createElement(RankIcon, { rankId: "world_stage", size: 48 }));
    expect(html).toContain('src="/rank-icons/world-stage.webp"');
  });
});
