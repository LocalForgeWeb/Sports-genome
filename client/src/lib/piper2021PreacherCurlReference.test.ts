import { describe, expect, it } from "vitest";
import { bandFor, getPiper2021PreacherCurlReference } from "../../../shared/piper2021PreacherCurlReference";

const exact = { exerciseName: "Preacher Curl", measurementType: "MULTI_REP", repetitions: 10, loadLb: 70, bodyMassLb: 180, sex: "male" as const, ageYears: 21, collegeStudentConfirmed: true, preTrainingConfirmed: true, exactProtocolConfirmed: true, directlyObservedConfirmed: true };

describe("Piper 2021 preacher-curl reference", () => {
  it("returns only the reviewed source interval for a fully matched standardized observation", () => {
    const result = getPiper2021PreacherCurlReference(exact);
    expect(result).toMatchObject({ status: "matched", bodyMassBand: "165.1–190 lb", comparison: "Between the study group’s 70th and 80th percentile" });
  });
  it("withholds the source table for generic curls, wrong repetitions, and missing population or protocol declarations", () => {
    expect(getPiper2021PreacherCurlReference({ ...exact, exerciseName: "Machine Preacher Curl" }).status).toBe("unavailable");
    expect(getPiper2021PreacherCurlReference({ ...exact, repetitions: 8 }).status).toBe("unavailable");
    expect(getPiper2021PreacherCurlReference({ ...exact, exactProtocolConfirmed: false }).status).toBe("unavailable");
  });

  /**
   * 150 lb is stored as 68.04 kg and read back as 150.0025 lb, which fell between the
   * published "135.1–150" and "150.1–165" bands, found no band, and threw a TypeError
   * while the Strength Genome record sheet rendered.
   */
  it("places a body mass that went through kilogram storage, instead of throwing", () => {
    const roundTripped = (68.04 / 0.45359237);
    expect(roundTripped).toBeGreaterThan(150);
    expect(() => getPiper2021PreacherCurlReference({ ...exact, bodyMassLb: roundTripped })).not.toThrow();
    expect(getPiper2021PreacherCurlReference({ ...exact, bodyMassLb: roundTripped })).toMatchObject({ status: "matched", bodyMassBand: "135.1–150 lb" });
  });

  it("reads the published bands as contiguous, so no body mass falls between two", () => {
    expect(bandFor(135)?.label).toBe("≤135 lb");
    expect(bandFor(135.05)?.label).toBe("135.1–150 lb");
    expect(bandFor(150.05)?.label).toBe("150.1–165 lb");
    expect(bandFor(270.05)?.label).toBe("≥270.1 lb");
    for (let lb = 90; lb <= 400; lb += 0.37) expect(bandFor(lb), `${lb.toFixed(2)} lb`).not.toBeNull();
    expect(bandFor(0)).toBeNull();
    expect(bandFor(Number.NaN)).toBeNull();
  });

  it("does not let storage rounding move a load below the cut point it equals", () => {
    // 70 lb stored as 31.75 kg reads back as 69.997 lb; at 180 lb the 70th-80th cut is 70.
    const load = 31.75 / 0.45359237;
    expect(load).toBeLessThan(70);
    expect(getPiper2021PreacherCurlReference({ ...exact, loadLb: load })).toMatchObject({ comparison: "Between the study group’s 70th and 80th percentile" });
  });
});

