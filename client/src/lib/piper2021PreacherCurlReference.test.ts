import { describe, expect, it } from "vitest";
import { getPiper2021PreacherCurlReference } from "../../../shared/piper2021PreacherCurlReference";

const exact = { exerciseName: "Preacher Curl", measurementType: "MULTI_REP", repetitions: 10, loadLb: 70, bodyMassLb: 180, sex: "male" as const, ageYears: 21, collegeStudentConfirmed: true, preTrainingConfirmed: true, exactProtocolConfirmed: true, directlyObservedConfirmed: true };

describe("Piper 2021 preacher-curl reference", () => {
  it("returns only the reviewed source interval for a fully matched standardized observation", () => {
    const result = getPiper2021PreacherCurlReference(exact);
    expect(result).toMatchObject({ status: "matched", bodyMassBand: "165.1–190 lb", comparison: "Between the source sample’s 70th and 80th percentile cut points" });
  });
  it("withholds the source table for generic curls, wrong repetitions, and missing population or protocol declarations", () => {
    expect(getPiper2021PreacherCurlReference({ ...exact, exerciseName: "Machine Preacher Curl" }).status).toBe("unavailable");
    expect(getPiper2021PreacherCurlReference({ ...exact, repetitions: 8 }).status).toBe("unavailable");
    expect(getPiper2021PreacherCurlReference({ ...exact, exactProtocolConfirmed: false }).status).toBe("unavailable");
  });
});
