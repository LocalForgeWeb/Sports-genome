import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BADGE_METALS, RANKS, rankColorToken } from "@shared/capabilityRank";
import { badgeSvgMarkup, emblemSvgMarkup, rankEmblems } from "./rankEmblems";

const css = readFileSync(new URL("../capability-rank.css", import.meta.url), "utf8");
const token = (name: string) => new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(css)?.[1]?.toUpperCase();

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = (hex: string) => { const [r, g, b] = channels(hex).map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

describe("The stylesheet holds exactly the rank table's colours", () => {
  /** One shared mapping: a hex changed in one place and not the other fails here. */
  it.each(RANKS.map((rank) => [rank.id, rank] as const))("%s", (_id, rank) => {
    expect(token(rankColorToken(rank.id))).toBe(rank.color);
  });

  /** The previous palette is gone wherever it stood for strength rank. */
  it("carries none of the v1 palette", () => {
    for (const old of ["#306A8E", "#27808E", "#1F958B", "#25AB82", "#44BF70", "#81D34D", "#ECE51B"]) expect(css.toUpperCase()).not.toContain(old);
  });

  it("draws World Stage's map edge in the badge rim's silver", () => {
    expect(token("--sg-rank-world-stage-outline")).toBe(BADGE_METALS.silver[1]);
    expect(css).toContain('.anatomy-muscle[data-rank="world_stage"] > path {');
  });
});

describe("Measured contrast, restated as a test", () => {
  const navy = ["#07182e", "#0b2240", "#102f53"];

  it("keeps the keyline at 3:1 against every rank that uses it", () => {
    for (const rank of RANKS.filter((r) => r.mapOutline === "keyline")) expect(ratio(rank.color, "#07182e"), rank.id).toBeGreaterThanOrEqual(3);
  });

  /** Obsidian on navy is 1.03:1; the silver edge is what makes a World Stage muscle visible at all. */
  it("makes World Stage visible on navy through its outline", () => {
    const silver = BADGE_METALS.silver[1];
    const worldStage = RANKS.find((r) => r.id === "world_stage")!;
    expect(ratio(silver, worldStage.color)).toBeGreaterThanOrEqual(3);
    for (const ground of navy) expect(ratio(silver, ground)).toBeGreaterThanOrEqual(3);
  });

  /** Paired selection: whichever stroke is stronger on a given rank clears 4.5:1. */
  it("keeps the selection visible on every rank", () => {
    for (const rank of RANKS) expect(Math.max(ratio(rank.color, "#ffffff"), ratio(rank.color, "#07182e")), rank.id).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * Silver is 2:1 from white, so a light solid ring would read as World Stage's own edge.
   * Selection is dashed, and nothing a rank draws is.
   */
  it("gives selection a shape no rank uses", () => {
    expect(css).toMatch(/\.anatomy-selection-ring \{[^}]*stroke-dasharray/);
    expect(css).not.toMatch(/data-rank[^{]*\{[^}]*stroke-dasharray/);
  });

  /** A badge's boundary is its metal rim, which clears 3:1 on both dark panels. */
  it("keeps every badge rim at 3:1 on the dark panels", () => {
    for (const metal of Object.values(BADGE_METALS)) for (const ground of ["#0b2240", "#102f53"]) expect(ratio(metal[1], ground)).toBeGreaterThanOrEqual(3);
  });

  /** Every inner mark clears 3:1 across its gem's whole gradient, not just at the midpoint. */
  it("keeps each badge's mark legible from the top of its gem to the bottom", () => {
    for (const rank of RANKS.filter((r) => rankEmblems[r.id].plate)) {
      const mark = rank.id === "world_stage" ? BADGE_METALS.gold[1] : rank.badge.glyph;
      for (const stop of [rank.badge.plateTop, rank.color, rank.badge.plateBottom]) expect(ratio(mark, stop), `${rank.id} on ${stop}`).toBeGreaterThanOrEqual(3);
    }
  });
});

/**
 * Adjacent ranks must stay apart for the commonest colour-vision differences. Simulated with
 * Machado et al. (2009) at full severity; distance is CIE76 delta E. At the brief's hexes,
 * Varsity and Regional came to 3.7 under protanopia - effectively one colour.
 */
describe("Ranks stay apart under colour-vision differences", () => {
  const matrices = {
    deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
    protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
  } as const;
  const lab = (linear: number[]) => {
    const [r, g, b] = linear;
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  const simulate = (hex: string, m: readonly (readonly number[])[]) => {
    const l = channels(hex).map(toLinear);
    return m.map((row) => Math.min(1, Math.max(0, row[0] * l[0] + row[1] * l[1] + row[2] * l[2])));
  };
  const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  it.each(Object.entries(matrices))("keeps every pair of neighbours apart under %s", (_kind, m) => {
    for (let i = 1; i < RANKS.length; i += 1) {
      const d = distance(lab(simulate(RANKS[i - 1].color, m)), lab(simulate(RANKS[i].color, m)));
      expect(d, `${RANKS[i - 1].id}/${RANKS[i].id}`).toBeGreaterThanOrEqual(10);
    }
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

  it.each(RANKS.map((rank) => [rank.id, rank] as const))("%s-badge.svg matches its source", (id, rank) => {
    const committed = readFileSync(new URL(`../../public/rank-emblems/${id}-badge.svg`, import.meta.url), "utf8");
    expect(committed).toBe(badgeSvgMarkup(id, `${rank.fullName} rank badge`));
  });

  it("keeps the master in currentColor only, with no filters, gradients or embedded text", () => {
    for (const rank of RANKS) {
      const svg = emblemSvgMarkup(rank.id, rank.fullName);
      expect(svg).not.toMatch(/filter|Gradient|<text|#[0-9a-f]{3,6}/i);
      expect(svg).toContain('viewBox="0 0 64 64"');
    }
  });

  /** Prospect is the open route and has no gem; every rank above it is cut from a closed silhouette. */
  it("gives every rank but Prospect a gem", () => {
    expect(RANKS.filter((rank) => !rankEmblems[rank.id].plate).map((rank) => rank.id)).toEqual(["prospect"]);
  });
});
