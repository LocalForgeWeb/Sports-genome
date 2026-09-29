// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bodyWeightKgAt, bodyWeightLogEvent, bodyWeightLogKey, currentBodyWeightKg, loadBodyWeightLog, saveBodyWeightLog,
  type BodyWeightEntry,
} from "./bodyWeightLog";

/**
 * Every lift's body-mass stamp is read from this log, so what comes back from
 * storage has to be usable whatever storage holds: a broken or foreign value
 * reads as no history rather than a crash, and a write the device refused is
 * reported as refused rather than announced to the screens listening for it.
 */

const at = (day: string) => `${day}T12:00:00.000Z`;

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("the body-weight log survives what storage hands back", () => {
  it("reads as empty when nothing has been stored", () => {
    expect(loadBodyWeightLog()).toEqual([]);
  });

  it("reads corrupt JSON as empty instead of throwing", () => {
    localStorage.setItem(bodyWeightLogKey, "{not json");
    expect(() => loadBodyWeightLog()).not.toThrow();
    expect(loadBodyWeightLog()).toEqual([]);
  });

  it("reads valid JSON that is not a list as empty", () => {
    localStorage.setItem(bodyWeightLogKey, '{"a":1}');
    expect(loadBodyWeightLog()).toEqual([]);
  });

  it("keeps the usable entries, drops the rest, fills in defaults and sorts by date", () => {
    localStorage.setItem(bodyWeightLogKey, JSON.stringify([
      { bodyMassKg: "82", enteredUnit: "stone", observedAt: at("2026-06-10"), source: "bogus" },
      { bodyMassKg: -1, enteredUnit: "kg", observedAt: at("2026-03-10"), source: "athlete_entry" },
      null,
      { bodyMassKg: "abc", enteredUnit: "kg", observedAt: at("2026-04-10"), source: "athlete_entry" },
      { bodyMassKg: 80, observedAt: 5 },
      { bodyMassKg: 90, enteredUnit: "kg", observedAt: at("2026-01-10"), source: "onboarding" },
    ]));
    expect(loadBodyWeightLog()).toEqual([
      { bodyMassKg: 90, enteredUnit: "kg", observedAt: at("2026-01-10"), source: "onboarding" },
      { bodyMassKg: 82, enteredUnit: "lb", observedAt: at("2026-06-10"), source: "athlete_entry" },
    ]);
  });

  it("saves in date order and announces the write once", () => {
    const listener = vi.fn();
    window.addEventListener(bodyWeightLogEvent, listener);
    const later: BodyWeightEntry = { bodyMassKg: 84, enteredUnit: "kg", observedAt: at("2026-06-10"), source: "athlete_entry" };
    const earlier: BodyWeightEntry = { bodyMassKg: 88, enteredUnit: "lb", observedAt: at("2026-01-10"), source: "onboarding" };
    try {
      expect(saveBodyWeightLog([later, earlier])).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(loadBodyWeightLog()).toEqual([earlier, later]);
    } finally {
      window.removeEventListener(bodyWeightLogEvent, listener);
    }
  });

  it("reports a refused write as false and does not announce it", () => {
    const listener = vi.fn();
    window.addEventListener(bodyWeightLogEvent, listener);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    const entry: BodyWeightEntry = { bodyMassKg: 84, enteredUnit: "kg", observedAt: at("2026-06-10"), source: "athlete_entry" };
    try {
      let saved: boolean | undefined;
      expect(() => { saved = saveBodyWeightLog([entry]); }).not.toThrow();
      expect(saved).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(bodyWeightLogEvent, listener);
    }
  });

  it("has no weight for an unreadable date or an empty log", () => {
    const log: BodyWeightEntry[] = [{ bodyMassKg: 84, enteredUnit: "kg", observedAt: at("2026-06-10"), source: "athlete_entry" }];
    expect(bodyWeightKgAt(log, "not a date")).toBeUndefined();
    expect(currentBodyWeightKg([])).toBeUndefined();
  });
});
