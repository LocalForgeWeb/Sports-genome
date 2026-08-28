import { describe, expect, it } from "vitest";
import { prependDeviceStrengthObservation, setDeviceStrengthObservationBodyMass, type DeviceStrengthObservation } from "./deviceStrengthObservations";

const older: DeviceStrengthObservation = { id: "older", exerciseName: "Barbell Bench Press", observedAt: "2026-08-20T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 80 };
const newer: DeviceStrengthObservation = { id: "newer", exerciseName: "EZ-Bar Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36, repetitions: 10 };

describe("device-local Strength Genome observations", () => {
  it("prepends and chronologically orders a new direct-access observation without merging account records", () => {
    expect(prependDeviceStrengthObservation([older], newer)).toEqual([newer, older]);
  });

  it("adds test-day body mass only to the selected local record", () => {
    expect(setDeviceStrengthObservationBodyMass([newer, older], "newer", 81.6466266)).toEqual([{ ...newer, bodyMassKgAtTest: 81.6466266 }, older]);
  });
});
