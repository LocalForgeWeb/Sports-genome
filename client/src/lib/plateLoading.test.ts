import { describe, expect, it } from "vitest";
import { calculatePlates, defaultPlateProfiles, eachSideText, formatAmount, loadingInstructions, pairsText, parseAmount, totalText, type PlateProfile } from "./plateLoading";

const lb = (plates: [number, number][], bar = 45, collars = { included: false, each: 2.5 }): PlateProfile => ({ bar, plates: plates.map(([weight, count]) => ({ weight, count })), collars });
const plenty = lb([[45, 8], [25, 8], [10, 8], [5, 8], [2.5, 8]]);

/** Utility brief §3 acceptance cases (PL05-PL12, PL17). */
describe("plate loading: the brief's fixtures", () => {
  it("185 lb on a 45 lb bar with 45s and 25s: 45 + 25 a side", () => {
    const result = calculatePlates("185", plenty, "lb");
    expect(result.kind).toBe("exact");
    if (result.kind !== "exact") return;
    expect(result.load.perSide).toEqual([45, 25]);
    expect(eachSideText(result.load, "lb")).toBe("45 + 25 lb");
    expect(totalText(result.load, plenty, "lb")).toBe("Total: 185 lb, including the 45 lb bar");
  });

  it("225 lb with four 45 lb plates: 45 + 45 a side", () => {
    const result = calculatePlates("225", lb([[45, 4]]), "lb");
    expect(result.kind === "exact" && result.load.perSide).toEqual([45, 45]);
  });

  it("100 kg on a 20 kg bar with four 20 kg plates: 20 + 20 a side", () => {
    const result = calculatePlates("100", { bar: 20, plates: [{ weight: 20, count: 4 }], collars: { included: false, each: 2.5 } }, "kg");
    expect(result.kind === "exact" && eachSideText(result.load, "kg")).toBe("20 + 20 kg");
  });

  it("a target equal to the bar is the empty bar", () => {
    const result = calculatePlates("45", plenty, "lb");
    expect(result.kind === "exact" && result.load.perSide).toEqual([]);
    expect(result.kind === "exact" && eachSideText(result.load, "lb")).toBe("No plates");
  });

  it("a target below the bar says the bar already weighs more", () => {
    expect(calculatePlates("40", plenty, "lb")).toEqual({ kind: "below-bar", target: 40, base: 45 });
  });

  it("182.5 lb with nothing under 2.5 lb: not exact, 180 and 185 are", () => {
    const result = calculatePlates("182.5", plenty, "lb");
    expect(result.kind).toBe("inexact");
    if (result.kind !== "inexact") return;
    expect(result.target).toBe(182.5);
    expect(result.lower?.total).toBe(180);
    expect(result.higher?.total).toBe(185);
    expect(result.lower?.perSide).toEqual([45, 10, 10, 2.5]);
    expect(result.higher?.perSide).toEqual([45, 25]);
  });

  it("165 lb with two 45s and four 30s: 30 + 30, which heaviest-first never finds", () => {
    const result = calculatePlates("165", lb([[45, 2], [30, 4]]), "lb");
    expect(result.kind === "exact" && result.load.perSide).toEqual([30, 30]);
  });

  it("one plate of a size cannot be paired, so it is never used", () => {
    const result = calculatePlates("95", lb([[25, 1], [10, 4], [5, 2]]), "lb");
    // 25 a side would need two 25s; 10 + 10 + 5 does it.
    expect(result.kind === "exact" && result.load.perSide).toEqual([10, 10, 5]);
    expect(calculatePlates("95", lb([[25, 1]]), "lb").kind).toBe("inexact");
    expect(pairsText(3)).toBe("3 plates · 1 pair (one spare can't be paired)");
  });
});

describe("plate loading: inventory, ordering and units", () => {
  it("never uses more plates than there are, and says how far the plates reach", () => {
    const profile = lb([[45, 4], [25, 2]]);
    const result = calculatePlates("405", profile, "lb");
    expect(result.kind).toBe("inexact");
    if (result.kind !== "inexact") return;
    expect(result.higher).toBeNull();
    expect(result.maxTotal).toBe(185 + 45 * 2);
    expect(result.lower?.total).toBe(45 + 2 * (45 * 2 + 25));
    expect(result.lower?.perSide).toEqual([45, 45, 25]);
  });

  it("prefers the fewest plates, then the larger plates", () => {
    // 135 on a 45 bar: 45 a side, never 25 + 10 + 10.
    expect(calculatePlates("135", plenty, "lb")).toMatchObject({ kind: "exact", load: { perSide: [45] } });
    // 95 with 25s, 20s and 5s: 25 (one plate) beats 20 + 5 (two plates).
    expect(calculatePlates("95", lb([[25, 2], [20, 2], [5, 2]]), "lb")).toMatchObject({ kind: "exact", load: { perSide: [25] } });
    // Two equally short answers for 60 a side: 30 + 30 or 45 + 15 - the larger plate wins the tie.
    expect(calculatePlates("165", lb([[45, 2], [30, 4], [15, 2]]), "lb")).toMatchObject({ kind: "exact", load: { perSide: [45, 15] } });
  });

  it("adds small fractional plates exactly", () => {
    const kg: PlateProfile = { bar: 20, plates: [{ weight: 20, count: 4 }, { weight: 1.25, count: 2 }, { weight: 0.5, count: 2 }, { weight: 0.25, count: 2 }], collars: { included: false, each: 2.5 } };
    expect(calculatePlates("24", kg, "kg")).toMatchObject({ kind: "exact", load: { perSide: [1.25, 0.5, 0.25], total: 24 } });
    expect(calculatePlates("62.5", kg, "kg")).toMatchObject({ kind: "exact", load: { perSide: [20, 1.25], total: 62.5 } });
    // 0.1 + 0.2 style errors cannot happen: everything is integer hundredths.
    expect(calculatePlates("20.5", kg, "kg")).toMatchObject({ kind: "exact", load: { perSide: [0.25] } });
  });

  it("uses a custom bar, and counts collars only when included", () => {
    expect(calculatePlates("100", lb([[25, 2]], 50), "lb")).toMatchObject({ kind: "exact", load: { perSide: [25] } });
    const collars = lb([[45, 4], [2.5, 2]], 45, { included: true, each: 2.5 });
    const result = calculatePlates("140", collars, "lb");
    expect(result).toMatchObject({ kind: "exact", base: 50, load: { perSide: [45] } });
    if (result.kind === "exact") expect(totalText(result.load, collars, "lb")).toBe("Total: 140 lb, including the 45 lb bar and two 2.5 lb collars");
  });

  it("keeps each unit's numbers as typed: 185 is never read in the other unit", () => {
    const kg = calculatePlates("185", defaultPlateProfiles.kg, "kg");
    expect(kg).toMatchObject({ kind: "exact", target: 185 });
    if (kg.kind === "exact") expect(eachSideText(kg.load, "kg")).toMatch(/kg$/);
    const pounds = calculatePlates("185", defaultPlateProfiles.lb, "lb");
    if (pounds.kind === "exact") expect(eachSideText(pounds.load, "lb")).toBe("45 + 25 lb");
  });

  it("refuses malformed, negative, non-finite and over-precise input with a reason", () => {
    for (const text of ["-5", "abc", "1e3", "Infinity", "NaN", "12..5", "185 lb"]) expect(calculatePlates(text, plenty, "lb")).toMatchObject({ kind: "invalid", field: "target" });
    expect(calculatePlates("102.255", plenty, "lb")).toEqual({ kind: "invalid", field: "target", message: "Use at most two decimal places." });
    expect(calculatePlates("", plenty, "lb")).toEqual({ kind: "empty" });
    expect(calculatePlates("185", { ...plenty, bar: 0 }, "lb")).toMatchObject({ kind: "invalid", field: "bar" });
    expect(calculatePlates("185", { ...plenty, bar: Number.NaN }, "lb")).toMatchObject({ kind: "invalid", field: "bar" });
    expect(calculatePlates("185", lb([[45, 2.5]]), "lb")).toMatchObject({ kind: "invalid", field: "plates" });
    expect(calculatePlates("185", lb([[-45, 2]]), "lb")).toMatchObject({ kind: "invalid", field: "plates" });
    expect(calculatePlates("99999", plenty, "lb")).toMatchObject({ kind: "invalid", field: "target" });
  });

  it("parses and prints amounts the way people write them", () => {
    expect(parseAmount("185")).toBe(18500);
    expect(parseAmount("102.5")).toBe(10250);
    expect(parseAmount("1,25")).toBe(125);
    expect(parseAmount(" 2.50 ")).toBe(250);
    expect(parseAmount("1.255")).toBeNull();
    expect([18500, 250, 125, 10250, 0].map(formatAmount)).toEqual(["185", "2.5", "1.25", "102.5", "0"]);
  });

  it("copies the same answer the screen shows, for an exact and an inexact target", () => {
    expect(loadingInstructions(calculatePlates("185", plenty, "lb"), plenty, "lb", "Back Squat")).toBe("Back Squat — 185 lb\nEach side: 45 + 25 lb\nTotal: 185 lb, including the 45 lb bar");
    expect(loadingInstructions(calculatePlates("182.5", plenty, "lb"), plenty, "lb")).toBe([
      "182.5 lb can't be loaded exactly with these plates.", "",
      "180 lb", "Each side: 45 + 10 + 10 + 2.5 lb", "Total: 180 lb, including the 45 lb bar", "",
      "185 lb", "Each side: 45 + 25 lb", "Total: 185 lb, including the 45 lb bar",
    ].join("\n"));
    expect(loadingInstructions(calculatePlates("40", plenty, "lb"), plenty, "lb")).toBeNull();
  });
});
