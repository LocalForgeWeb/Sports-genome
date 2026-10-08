import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { dayFigureFor, dayFigureMuscles, dayFigures } from "./dayFigures";

/** The size a WebP file declares, from its container header (VP8X, VP8L or VP8). */
function webpSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  expect(b.toString("ascii", 0, 4)).toBe("RIFF");
  expect(b.toString("ascii", 8, 12)).toBe("WEBP");
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
  if (chunk === "VP8L") { const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; }
  return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
}

const publicDir = resolve(process.cwd(), "client/public");

describe("Home's training-day figures", () => {
  it("has a cut file of the recorded size for every day listed, and a small one beside it", () => {
    for (const figure of Object.values(dayFigures)) {
      const file = resolve(publicDir, `.${figure.src}`);
      expect(existsSync(file), figure.src).toBe(true);
      expect(webpSize(file), figure.src).toEqual({ width: figure.width, height: figure.height });
      expect(existsSync(resolve(publicDir, `.${figure.srcSmall}`)), figure.srcSmall).toBe(true);
      expect(figure.muscles.length).toBeGreaterThan(0);
      expect(figure.alt).toContain(figure.split);
    }
  });

  it("draws every split, each from its own file, except Lower, which trains the Legs muscles", () => {
    const splits = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"] as const;
    expect(Object.keys(dayFigures).sort()).toEqual([...splits].sort());
    for (const split of splits) expect(dayFigureFor(split)?.split).toBe(split);
    const files = splits.filter((split) => split !== "Lower").map((split) => dayFigures[split].src);
    expect(new Set(files).size).toBe(files.length);
    expect(dayFigures.Lower.src).toBe(dayFigures.Legs.src);
    expect(dayFigureMuscles.Lower).toBe(dayFigureMuscles.Legs);
  });

  it("says what each figure shows in the owner's words, and lends none to a day that is not a split", () => {
    expect(dayFigureFor("Push")).toMatchObject({ src: "/day-figures/push.webp", muscles: "Chest · delts · triceps" });
    expect(dayFigureFor("Push")?.alt).toBe("Push day: chest, delts, triceps highlighted on a front and a back figure.");
    expect(dayFigureFor("Pull")).toMatchObject({ src: "/day-figures/pull.webp", muscles: "Lats · traps and mid-back · rear delts · biceps" });
    expect(dayFigureFor("Pull")?.alt).toBe("Pull day: lats, traps and mid-back, rear delts, biceps highlighted on a front and a back figure.");
    expect(dayFigureFor("Legs")?.muscles).toBe("Quads · glutes · hamstrings · calves");
    expect(dayFigureFor("Upper")?.muscles).toBe("Chest · shoulders · arms · upper back · abs");
    expect(dayFigureFor("Sport Transfer")).toMatchObject({ src: "/day-figures/sport-transfer.webp", muscles: "Obliques and core · hips · glutes · posterior chain · shoulder stabilisation" });
    expect(dayFigureFor("Full Body")).toMatchObject({ src: "/day-figures/full-body.webp", muscles: "Chest · back · shoulders · arms · core · legs" });
    for (const day of ["Rest", "", "push", "constructor", "toString"]) expect(dayFigureFor(day)).toBeNull();
  });
});
