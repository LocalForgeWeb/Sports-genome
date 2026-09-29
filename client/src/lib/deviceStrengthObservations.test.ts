// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { summarizeAthleteRecord } from "./athleteRecord";
import { deviceStrengthObservationEvent, deviceStrengthObservationKey, loadDeviceStrengthObservations, prependDeviceStrengthObservation, removeDeviceStrengthObservation, saveDeviceStrengthObservations, setDeviceStrengthObservationBodyMass, type DeviceStrengthObservation } from "./deviceStrengthObservations";

describe("saving the device record", () => {
  afterEach(() => { vi.restoreAllMocks(); window.localStorage.clear(); });

  it("reports a refused write instead of swallowing it, and fires no change event for it", () => {
    const listener = vi.fn();
    window.addEventListener(deviceStrengthObservationEvent, listener);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("QuotaExceededError"); });
    expect(saveDeviceStrengthObservations([{ id: "a", exerciseName: "Back Squat", observedAt: "2026-09-01T10:00:00.000Z", measurementType: "MEASURED_1RM" }])).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(deviceStrengthObservationEvent, listener);
  });

  it("reports a write that reached the device and announces it", () => {
    const listener = vi.fn();
    window.addEventListener(deviceStrengthObservationEvent, listener);
    expect(saveDeviceStrengthObservations([{ id: "a", exerciseName: "Back Squat", observedAt: "2026-09-01T10:00:00.000Z", measurementType: "MEASURED_1RM" }])).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(deviceStrengthObservationKey) || "[]")).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(deviceStrengthObservationEvent, listener);
  });
});

const older: DeviceStrengthObservation = { id: "older", exerciseName: "Barbell Bench Press", observedAt: "2026-08-20T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 80 };
const newer: DeviceStrengthObservation = { id: "newer", exerciseName: "EZ-Bar Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36, repetitions: 10 };

describe("device-local Strength Genome observations", () => {
  it("prepends and chronologically orders a new direct-access observation without merging account records", () => {
    expect(prependDeviceStrengthObservation([older], newer)).toEqual([newer, older]);
  });

  it("adds test-day body mass only to the selected local record", () => {
    expect(setDeviceStrengthObservationBodyMass([newer, older], "newer", 81.6466266)).toEqual([{ ...newer, bodyMassKgAtTest: 81.6466266 }, older]);
  });

  it("says when there was no lift to save the body weight on, so nothing claims it was saved", () => {
    // A lift from a finished workout is not in this list, whatever its record shows.
    expect(setDeviceStrengthObservationBodyMass([newer, older], "workout-session-1-exercise-1", 80)).toBeNull();
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

describe("loadDeviceStrengthObservations", () => {
  afterEach(() => { window.localStorage.clear(); });

  const valid: DeviceStrengthObservation = { id: "a", exerciseName: "Barbell Back Squat", observedAt: "2026-09-01T10:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 100, bodyMassKgAtTest: 82 };
  const seed = (entries: unknown[]) => window.localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(entries));

  it("leaves out stored elements a screen could not read, and keeps the good one", () => {
    seed([null, 7, "x", { id: 1 }, { ...valid, id: "b", observedAt: "not a date" }, { ...valid, id: "c", exerciseName: undefined }, valid]);
    expect(loadDeviceStrengthObservations()).toEqual([valid]);
  });

  it("reads a number stored as text as that number", () => {
    seed([{ ...valid, loadKg: "80" }]);
    expect(loadDeviceStrengthObservations()[0]?.loadKg).toBe(80);
  });

  it("keeps a body weight that was never recorded as not recorded, not 0", () => {
    seed([{ ...valid, bodyMassKgAtTest: null }]);
    expect(loadDeviceStrengthObservations()[0]?.bodyMassKgAtTest).toBeNull();
  });

  it("drops a number it cannot read rather than guessing one", () => {
    seed([{ ...valid, repetitions: "lots" }]);
    const [loaded] = loadDeviceStrengthObservations();
    expect(loaded).toBeDefined();
    expect(loaded && "repetitions" in loaded).toBe(false);
  });

  it("keeps fields the type does not list, so saving what was loaded loses nothing", () => {
    seed([{ ...valid, measuredOneRmKg: 100 }]);
    expect(loadDeviceStrengthObservations()[0]).toMatchObject({ measuredOneRmKg: 100 });
  });

  it("lets the athlete record be summarised over a store that held malformed elements", () => {
    seed([null, { id: 1 }, valid]);
    expect(() => summarizeAthleteRecord({ directAccess: true, deviceSessions: [], deviceObservations: loadDeviceStrengthObservations(), bodyWeightLog: [] })).not.toThrow();
  });
});
