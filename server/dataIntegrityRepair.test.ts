import { describe, expect, it } from "vitest";
import { buildSetPatch, resolveRepair } from "./dataIntegrityRepair";

/**
 * `removePasskey` was the only destructive operation in the API, so an athlete
 * who logged 225 instead of 22.5 was stuck with it - in their history and in
 * everything derived from it.
 */
describe("resolveRepair", () => {
  it("lets an athlete change their own record", () => {
    expect(resolveRepair({ userId: 7 }, 7)).toEqual({ action: "apply" });
  });

  it("refuses another athlete's record", () => {
    expect(resolveRepair({ userId: 8 }, 7)).toEqual({ action: "refuse", reason: "not-owned" });
  });

  it("refuses a record that does not exist", () => {
    expect(resolveRepair(null, 7)).toEqual({ action: "refuse", reason: "not-found" });
  });

  it("never applies without an owner row, whatever the requester claims", () => {
    // Ownership comes from the database, never from the request.
    for (const requester of [0, -1, 7, 999]) {
      expect(resolveRepair(null, requester).action).toBe("refuse");
    }
  });
});

describe("buildSetPatch", () => {
  it("changes nothing when nothing was sent", () => {
    expect(buildSetPatch({})).toEqual({});
  });

  it("distinguishes clearing a field from leaving it alone", () => {
    // Collapsing these would let a form that omits RPE wipe a recorded RPE.
    expect(buildSetPatch({ actualRpe: null })).toEqual({ actualRpe: null });
    expect(buildSetPatch({})).not.toHaveProperty("actualRpe");
  });

  it("writes weight at the same precision the logging path uses", () => {
    expect(buildSetPatch({ actualWeight: 22.5 })).toEqual({ actualWeight: "22.50" });
  });

  it("writes RPE at one decimal, like the column", () => {
    expect(buildSetPatch({ actualRpe: 8 })).toEqual({ actualRpe: "8.0" });
  });

  it("corrects the typo this exists for", () => {
    // 225 logged for a 22.5kg dumbbell.
    expect(buildSetPatch({ actualWeight: 22.5 }).actualWeight).toBe("22.50");
  });

  it("carries a unit change on its own", () => {
    expect(buildSetPatch({ weightUnit: "kg" })).toEqual({ weightUnit: "kg" });
  });

  it("allows zero reps without treating it as absent", () => {
    expect(buildSetPatch({ actualReps: 0 })).toEqual({ actualReps: 0 });
  });

  it("allows a zero weight without treating it as absent", () => {
    expect(buildSetPatch({ actualWeight: 0 })).toEqual({ actualWeight: "0.00" });
  });

  it("allows marking a set incomplete, not only complete", () => {
    expect(buildSetPatch({ completed: false })).toEqual({ completed: false });
  });

  it("clears a note given an empty string, so a note can be taken back", () => {
    expect(buildSetPatch({ setNotes: "" })).toEqual({ setNotes: null });
  });

  it("changes several fields in one correction", () => {
    expect(buildSetPatch({ actualWeight: 100, actualReps: 5, actualRpe: 7.5 })).toEqual({
      actualWeight: "100.00",
      actualReps: 5,
      actualRpe: "7.5",
    });
  });

  it("never emits a key the caller did not send", () => {
    const patch = buildSetPatch({ actualReps: 5 });
    expect(Object.keys(patch)).toEqual(["actualReps"]);
  });
});
