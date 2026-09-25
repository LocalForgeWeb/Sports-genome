import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RANKS, rankById } from "@shared/capabilityRank";
import { RANK_ICON_WIDTHS, rankIconCompactSrc, rankIconSources } from "./rankIcons";

const PUBLIC = resolve(process.cwd(), "client/public");
const MASTERS = resolve(process.cwd(), "design/rank-icons/source");

/** Width, height and whether the file carries an alpha channel, read off the WebP container. */
function webpInfo(path: string): { chunk: string; width: number; height: number; alpha: boolean } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 4).toString("latin1")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("latin1")).toBe("WEBP");
  const chunk = bytes.subarray(12, 16).toString("latin1");
  // VP8X: a flags byte (bit 4 = alpha) and the canvas size, both minus one, as 24-bit little-endian.
  if (chunk !== "VP8X") return { chunk, width: 0, height: 0, alpha: false };
  return {
    chunk,
    width: 1 + bytes.readUIntLE(24, 3),
    height: 1 + bytes.readUIntLE(27, 3),
    alpha: (bytes[20] & 0x10) !== 0,
  };
}

/** A PNG's colour type, from its IHDR: 6 is truecolour with alpha. */
function pngColorType(path: string): number {
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString("latin1")).toBe("PNG");
  expect(bytes.subarray(12, 16).toString("latin1")).toBe("IHDR");
  return bytes[25];
}

/**
 * The approved badges, one per rank, assigned by what each is rather than by upload order.
 * The two that were not in the supplied batch are null, and stay null until their approved
 * artwork arrives - a test that pins them is how the gap stays visible.
 */
describe("The rank table names the approved artwork", () => {
  it("assigns the five supplied badges and leaves the two missing ones empty", () => {
    expect(RANKS.map((rank) => [rank.id, rank.iconSrc])).toEqual([
      ["prospect", "/rank-icons/prospect.webp"],
      ["jv", "/rank-icons/jv.webp"],
      ["varsity", "/rank-icons/varsity.webp"],
      ["regional", "/rank-icons/regional.webp"],
      ["state", "/rank-icons/state.webp"],
      ["national", null],
      ["world_stage", null],
    ]);
  });

  it("points every path at a file the app actually serves, in both runtime sizes", () => {
    for (const rank of RANKS) {
      if (!rank.iconSrc) continue;
      const full = resolve(PUBLIC, `.${rank.iconSrc}`);
      const compact = resolve(PUBLIC, `.${rankIconCompactSrc(rank.iconSrc)}`);
      expect(existsSync(full), `${rank.id}: ${rank.iconSrc}`).toBe(true);
      expect(existsSync(compact), `${rank.id}: compact`).toBe(true);
      const fullInfo = webpInfo(full);
      const compactInfo = webpInfo(compact);
      expect([fullInfo.width, fullInfo.height], rank.id).toEqual([RANK_ICON_WIDTHS.full, RANK_ICON_WIDTHS.full]);
      expect([compactInfo.width, compactInfo.height], rank.id).toEqual([RANK_ICON_WIDTHS.compact, RANK_ICON_WIDTHS.compact]);
    }
  });

  /** Transparency is what keeps the badge off a rectangle on the navy; it has to survive encoding. */
  it("keeps an alpha channel in every runtime file", () => {
    for (const rank of RANKS) {
      if (!rank.iconSrc) continue;
      expect(webpInfo(resolve(PUBLIC, `.${rank.iconSrc}`)).alpha, rank.id).toBe(true);
      expect(webpInfo(resolve(PUBLIC, `.${rankIconCompactSrc(rank.iconSrc)}`)).alpha, `${rank.id} compact`).toBe(true);
    }
  });

  it("does not pass a raster off as a vector", () => {
    for (const rank of RANKS) if (rank.iconSrc) expect(rank.iconSrc).toMatch(/\.webp$/);
  });

  /** The supplied files, untouched, are the record of what was approved. */
  it("keeps an original-resolution master with alpha for every served badge", () => {
    for (const rank of RANKS) {
      if (!rank.iconSrc) continue;
      const master = resolve(MASTERS, `${rank.id.replace("_", "-")}.png`);
      expect(existsSync(master), `${rank.id} master`).toBe(true);
      expect(pngColorType(master), `${rank.id} master is RGBA`).toBe(6);
    }
  });

  it("serves no badge under a size that would make the browser fetch the master", () => {
    for (const rank of RANKS) {
      if (!rank.iconSrc) continue;
      expect(readFileSync(resolve(PUBLIC, `.${rank.iconSrc}`)).byteLength).toBeLessThan(64 * 1024);
      expect(readFileSync(resolve(PUBLIC, `.${rankIconCompactSrc(rank.iconSrc)}`)).byteLength).toBeLessThan(16 * 1024);
    }
  });
});

describe("The srcset a badge is fetched with", () => {
  it("offers the compact and the full file with their real widths", () => {
    expect(rankIconSources(rankById.get("jv")!.iconSrc!)).toEqual({
      src: "/rank-icons/jv.webp",
      srcSet: "/rank-icons/jv-128.webp 128w, /rank-icons/jv.webp 384w",
    });
  });
});
