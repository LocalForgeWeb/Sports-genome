// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRecentExercises, loadRecentExerciseIds, pushRecentExerciseId, recentExercisesKey, recordRecentExercise } from "./recentExercises";

describe("recently viewed exercises", () => {
  afterEach(() => { vi.restoreAllMocks(); window.localStorage.clear(); });

  it("keeps the newest first, once each, and caps the list", () => {
    expect(pushRecentExerciseId([2, 3], 1)).toEqual([1, 2, 3]);
    expect(pushRecentExerciseId([1, 2, 3], 3)).toEqual([3, 1, 2]);
    expect(pushRecentExerciseId([1, 2, 3, 4, 5, 6, 7, 8], 9)).toEqual([9, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("records to the device and reads back only integer ids", () => {
    expect(recordRecentExercise(12)).toBe(true);
    expect(recordRecentExercise(7)).toBe(true);
    expect(loadRecentExerciseIds()).toEqual([7, 12]);
    window.localStorage.setItem(recentExercisesKey, JSON.stringify([3, "x", null, 4.5, 9]));
    expect(loadRecentExerciseIds()).toEqual([3, 9]);
  });

  it("clears with one action and reports a refused write", () => {
    recordRecentExercise(1);
    expect(clearRecentExercises()).toBe(true);
    expect(loadRecentExerciseIds()).toEqual([]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("QuotaExceededError"); });
    expect(recordRecentExercise(2)).toBe(false);
  });
});
