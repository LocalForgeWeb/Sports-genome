import { describe, expect, it } from "vitest";
import { bodyWeightKgAt, currentBodyWeightDisplay, recordBodyWeight, seedBodyWeightLog, type BodyWeightEntry } from "./bodyWeightLog";

const at = (day: string) => `${day}T12:00:00.000Z`;

describe("body weight is a dated measurement, not a setting", () => {
  it("appends rather than overwriting, so an old lift keeps the weight it was measured against", () => {
    let log: BodyWeightEntry[] = [];
    log = recordBodyWeight(log, 200, "lb", at("2026-01-10"));
    log = recordBodyWeight(log, 180, "lb", at("2026-06-10"));
    expect(log).toHaveLength(2);
    // A lift in March was performed at the January weight, not today's.
    expect(bodyWeightKgAt(log, at("2026-03-01"))).toBeCloseTo(90.72, 1);
    expect(bodyWeightKgAt(log, at("2026-07-01"))).toBeCloseTo(81.65, 1);
  });

  it("treats two entries on one day as a correction, not two weigh-ins", () => {
    let log = recordBodyWeight([], 1800, "lb", at("2026-06-10"));
    log = recordBodyWeight(log, 180, "lb", `2026-06-10T18:00:00.000Z`);
    expect(log).toHaveLength(1);
    expect(log[0].bodyMassKg).toBeCloseTo(81.65, 1);
  });

  it("has no weight for a lift that predates the first measurement, rather than reaching forward", () => {
    const log = recordBodyWeight([], 180, "lb", at("2026-06-10"));
    expect(bodyWeightKgAt(log, at("2026-01-01"))).toBeUndefined();
    expect(bodyWeightKgAt(log, at("2026-06-10"))).toBeCloseTo(81.65, 1);
  });

  it("stores kilograms but shows the athlete back their own unit", () => {
    const log = recordBodyWeight([], 82, "kg", at("2026-06-10"));
    expect(log[0].bodyMassKg).toBe(82);
    expect(currentBodyWeightDisplay(log)).toEqual({ value: 82, unit: "kg" });
    const pounds = recordBodyWeight([], 180, "lb", at("2026-06-10"));
    expect(currentBodyWeightDisplay(pounds)).toEqual({ value: 180, unit: "lb" });
  });

  it("keeps entries in date order however they arrive", () => {
    let log = recordBodyWeight([], 180, "lb", at("2026-06-10"));
    log = recordBodyWeight(log, 200, "lb", at("2026-01-10"));
    expect(log.map((entry) => entry.observedAt.slice(0, 10))).toEqual(["2026-01-10", "2026-06-10"]);
  });

  it("ignores a weight that is not a usable measurement", () => {
    expect(recordBodyWeight([], 0, "lb")).toHaveLength(0);
    expect(recordBodyWeight([], Number.NaN, "lb")).toHaveLength(0);
    expect(recordBodyWeight([], -5, "lb")).toHaveLength(0);
  });

  it("seeds once from a profile that predates the log, and never re-applies it", () => {
    const seeded = seedBodyWeightLog([], 180, "lb", at("2026-06-10"));
    expect(seeded).toHaveLength(1);
    expect(seeded[0].source).toBe("onboarding");
    // A log that already holds anything is left exactly as it is.
    expect(seedBodyWeightLog(seeded, 999, "lb", at("2026-07-10"))).toEqual(seeded);
  });
});
