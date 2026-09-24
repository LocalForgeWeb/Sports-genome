import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RANKS, rankBadgeAccentToken, rankMapFillToken } from "@shared/capabilityRank";
import { emblemSvgMarkup, rankEmblems } from "./rankEmblems";

const css = readFileSync(new URL("../capability-rank.css", import.meta.url), "utf8");
const token = (name: string) => new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(css)?.[1]?.toUpperCase();

describe("The stylesheet holds exactly the rank table's colours", () => {
  /** One versioned table: a hex changed in one place and not the other fails here. */
  it.each(RANKS.map((rank) => [rank.id, rank] as const))("%s", (_id, rank) => {
    expect(token(`${rankMapFillToken(rank.id)}-dark`)).toBe(rank.mapFill.dark);
    expect(token(`${rankMapFillToken(rank.id)}-light`)).toBe(rank.mapFill.light);
    expect(token(`${rankBadgeAccentToken(rank.id)}-dark`)).toBe(rank.badgeAccent.dark);
    expect(token(`${rankBadgeAccentToken(rank.id)}-light`)).toBe(rank.badgeAccent.light);
  });

  it("points every working token at a themed value rather than a literal", () => {
    for (const rank of RANKS) {
      expect(css).toContain(`${rankMapFillToken(rank.id)}: var(${rankMapFillToken(rank.id)}-dark);`);
      expect(css).toContain(`${rankMapFillToken(rank.id)}: var(${rankMapFillToken(rank.id)}-light);`);
    }
  });
});

describe("Measured contrast, restated as a test", () => {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  /** 3:1 is the non-text contrast a graphical object needs; the brief's map values missed it for two ranks. */
  it("keeps every badge accent at 3:1 on both dark panels and on white", () => {
    for (const rank of RANKS) {
      for (const surface of ["#0b2240", "#102f53"]) expect(ratio(rank.badgeAccent.dark, surface), `${rank.id} on ${surface}`).toBeGreaterThanOrEqual(3);
      expect(ratio(rank.badgeAccent.light, "#FFFFFF"), `${rank.id} on white`).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the keyline at 3:1 against every rank on the map", () => {
    for (const rank of RANKS) expect(ratio(rank.mapFill.dark, "#07182e"), rank.id).toBeGreaterThanOrEqual(3);
  });

  /** Paired selection: whichever stroke is stronger on a given rank clears 4.5:1. */
  it("keeps the selection visible on the darkest and the brightest rank", () => {
    for (const rank of RANKS) {
      expect(Math.max(ratio(rank.mapFill.dark, "#ffffff"), ratio(rank.mapFill.dark, "#07182e")), rank.id).toBeGreaterThanOrEqual(4.5);
    }
  });

  /** Unscored sits below the whole ramp in lightness, so it never reads as a step on it. */
  it("puts the unscored fill below Prospect", () => {
    const unscored = token("--sg-rank-unavailable-fill")!;
    expect(luminance(unscored)).toBeLessThan(luminance(RANKS[0].mapFill.dark));
  });
});

describe("The exported emblems", () => {
  it("has one emblem per rank", () => {
    expect(Object.keys(rankEmblems).sort()).toEqual(RANKS.map((rank) => rank.id).sort());
  });

  /** The files in client/public are exports; run scripts/export-rank-emblems.ts if this fails. */
  it.each(RANKS.map((rank) => [rank.id, rank] as const))("%s.svg matches its source", (id, rank) => {
    const committed = readFileSync(new URL(`../../public/rank-emblems/${id}.svg`, import.meta.url), "utf8");
    expect(committed).toBe(emblemSvgMarkup(id, `${rank.fullName} rank emblem`));
  });

  it("draws in currentColor only, with no filters, gradients or embedded text", () => {
    for (const rank of RANKS) {
      const svg = emblemSvgMarkup(rank.id, rank.fullName);
      expect(svg).not.toMatch(/filter|Gradient|<text|#[0-9a-f]{3,6}/i);
      expect(svg).toContain('viewBox="0 0 64 64"');
    }
  });
});
