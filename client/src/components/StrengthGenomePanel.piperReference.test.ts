import { describe, expect, it } from "vitest";
import { getPiperReferenceForObservation } from "./StrengthGenomePanel";

const matchedContext = JSON.stringify({ referenceId: "piper_2021_preacher_curl_10rm", sex: "male", ageYears: 21, collegeStudentConfirmed: true, preTrainingConfirmed: true, exactProtocolConfirmed: true, directlyObservedConfirmed: true });

describe("saved Piper 2021 preacher-curl reference presentation", () => {
  it("returns a source-sample interval only for a persisted exact standardized observation", () => {
    expect(getPiperReferenceForObservation({ id: "record", exerciseName: "Preacher Curl", observedAt: "2026-08-28", measurementType: "MULTI_REP", repetitions: 10, loadKg: 31.751, bodyMassKgAtTest: 81.647, referenceContextJson: matchedContext })).toMatchObject({ status: "matched", bodyMassBand: "165.1–190 lb" });
  });

  it("does not present the table when the stored source declaration is absent or incomplete", () => {
    expect(getPiperReferenceForObservation({ id: "record", exerciseName: "Preacher Curl", observedAt: "2026-08-28", measurementType: "MULTI_REP", repetitions: 10, loadKg: 31.751, bodyMassKgAtTest: 81.647 })).toBeNull();
    expect(getPiperReferenceForObservation({ id: "record", exerciseName: "Preacher Curl", observedAt: "2026-08-28", measurementType: "MULTI_REP", repetitions: 10, loadKg: 31.751, bodyMassKgAtTest: 81.647, referenceContextJson: JSON.stringify({ referenceId: "piper_2021_preacher_curl_10rm", sex: "male" }) })).toMatchObject({ status: "unavailable" });
  });
});
