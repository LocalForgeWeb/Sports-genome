import { describe, expect, it } from "vitest";
import { comparableName, numberOrNull, textOrNull } from "./rowValues";

describe("Reading loose values out of Supabase rows", () => {
  it("reads a number whether it arrives as a number or as numeric text", () => {
    expect(numberOrNull(2.5)).toBe(2.5);
    expect(numberOrNull("18.00")).toBe(18);
  });

  it("gives null for anything that is not a finite number", () => {
    for (const value of ["", "  ", "abc", Number.NaN, Number.POSITIVE_INFINITY, null, {}]) {
      expect(numberOrNull(value)).toBeNull();
    }
  });

  it("trims text and gives null for blank text or a non-string", () => {
    expect(textOrNull("  a ")).toBe("a");
    expect(textOrNull("   ")).toBeNull();
    expect(textOrNull(5)).toBeNull();
  });

  it("compares exercise names without case, spacing or punctuation", () => {
    expect(comparableName("  Back-Squat (High Bar) ")).toBe("back squat high bar");
  });
});
