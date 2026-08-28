import { describe, expect, it } from "vitest";
import { displayWeightToKilograms, formatDisplayWeight, kilogramsToDisplayWeight, weightUnitLabel } from "./weightUnits";

describe("Strength Genome display weight units", () => {
  it("accepts a pound-profile athlete's entry and converts only for kilogram-backed persistence", () => {
    const storedKilograms = displayWeightToKilograms(180, "lb");
    expect(storedKilograms).toBeCloseTo(81.6466266, 6);
    expect(kilogramsToDisplayWeight(storedKilograms, "lb")).toBeCloseTo(180, 6);
    expect(formatDisplayWeight(storedKilograms, "lb")).toBe("180 lb");
    expect(weightUnitLabel("lb")).toBe("pounds");
  });

  it("leaves kilogram-profile entries unchanged while retaining their kilogram label", () => {
    expect(displayWeightToKilograms(82, "kg")).toBe(82);
    expect(kilogramsToDisplayWeight(82, "kg")).toBe(82);
    expect(formatDisplayWeight(82, "kg")).toBe("82 kg");
    expect(weightUnitLabel("kg")).toBe("kilograms");
  });
});
