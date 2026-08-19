import { describe, expect, it } from "vitest";
import { plannedSetCount } from "./WorkoutExecutionPanel";

describe("plannedSetCount", () => {
  it("reads the planned number of work sets from common prescription formats", () => {
    expect(plannedSetCount("4 × 3–5")).toBe(4);
    expect(plannedSetCount("3 x 8–12")).toBe(3);
  });

  it("uses a safe default and prevents impractical set-log counts", () => {
    expect(plannedSetCount("RPE 8, autoregulated")).toBe(3);
    expect(plannedSetCount("20 × 1")).toBe(12);
  });
});
