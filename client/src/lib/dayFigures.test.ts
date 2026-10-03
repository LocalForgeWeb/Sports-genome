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

  it("names a figure only for the five days the artwork was specified for", () => {
    expect(Object.keys(dayFigureMuscles).sort()).toEqual(["Legs", "Pull", "Push", "Sport Transfer", "Upper"]);
    for (const split of Object.keys(dayFigures)) expect(dayFigureMuscles).toHaveProperty(split);
  });

  it("says what the Push figure shows, and lends it to no other day", () => {
    expect(dayFigureFor("Push")).toMatchObject({ src: "/day-figures/push.webp", muscles: "Chest · delts · triceps" });
    expect(dayFigureFor("Push")?.alt).toBe("Push day: chest, delts, triceps highlighted on a front and a back figure.");
    // No artwork yet for these, and never a stand-in: the picture says which muscles a day trains.
    for (const day of ["Lower", "Full Body", "Rest", ""]) expect(dayFigureFor(day)).toBeNull();
    for (const day of ["Pull", "Legs", "Upper", "Sport Transfer"]) if (!dayFigures[day as keyof typeof dayFigures]) expect(dayFigureFor(day)).toBeNull();
  });
});
