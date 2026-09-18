import { describe, expect, it } from "vitest";
import { prependDeviceStrengthObservation, removeDeviceStrengthObservation, setDeviceStrengthObservationBodyMass, type DeviceStrengthObservation } from "./deviceStrengthObservations";

const older: DeviceStrengthObservation = { id: "older", exerciseName: "Barbell Bench Press", observedAt: "2026-08-20T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 80 };
const newer: DeviceStrengthObservation = { id: "newer", exerciseName: "EZ-Bar Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36, repetitions: 10 };

describe("device-local Strength Genome observations", () => {
  it("prepends and chronologically orders a new direct-access observation without merging account records", () => {
    expect(prependDeviceStrengthObservation([older], newer)).toEqual([newer, older]);
  });

  it("adds test-day body mass only to the selected local record", () => {
    expect(setDeviceStrengthObservationBodyMass([newer, older], "newer", 81.6466266)).toEqual([{ ...newer, bodyMassKgAtTest: 81.6466266 }, older]);
  });

  it("preserves an explicit source-condition declaration with a direct-access test", () => {
    const context = JSON.stringify({ referenceId: "piper_2021_preacher_curl_10rm", sex: "male", ageYears: 21, collegeStudentConfirmed: true, preTrainingConfirmed: true, directlyObservedConfirmed: true, exactProtocolConfirmed: true });
    const record = { ...newer, exerciseName: "Preacher Curl", referenceContextJson: context };
    expect(prependDeviceStrengthObservation([older], record)[0]?.referenceContextJson).toBe(context);
  });
});

describe("removeDeviceStrengthObservation", () => {
  const record = (id: string): DeviceStrengthObservation => ({
    id,
    exerciseName: "Barbell Back Squat",
    observedAt: "2026-09-01T10:00:00.000Z",
    measurementType: "MEASURED_1RM",
  } as DeviceStrengthObservation);

  it("removes the named observation", () => {
    const left = removeDeviceStrengthObservation([record("a"), record("b")], "a");
    expect(left.map((item) => item.id)).toEqual(["b"]);
  });

  it("leaves the others untouched", () => {
    const left = removeDeviceStrengthObservation([record("a"), record("b"), record("c")], "b");
    expect(left).toHaveLength(2);
  });

  it("is a no-op for an id that is not there", () => {
    const all = [record("a")];
    expect(removeDeviceStrengthObservation(all, "missing")).toEqual(all);
  });

  it("empties a single-record store rather than leaving a stub behind", () => {
    expect(removeDeviceStrengthObservation([record("a")], "a")).toEqual([]);
  });
});
