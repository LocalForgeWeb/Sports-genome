// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  success: vi.fn(),
  error: vi.fn(),
}));

// Ranks are drawn: the request answered, with no muscle placed and nothing unranked.
const drawnRanks = { data: { status: "ok", muscles: [], unranked: [] }, isPending: false, isFetching: false, fetchStatus: "idle" };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    strengthProfile: { muscleRanks: { useQuery: () => drawnRanks } },
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    repair: { deleteStrengthObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { regions: [], athleteConfirmedPriorityRegionIds: [], nextAction: "Add a result" } }) },
      observations: { useQuery: () => ({ data: [] }) },
      priorities: { useQuery: () => ({ data: [] }) },
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

const bench = { id: "device-bench", exerciseName: "Barbell Bench Press", observedAt: "2026-09-12T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 100 };
const note = /read against your profile weight/;

/**
 * A squat from a workout finished before any body weight was entered: nothing for its day in
 * the weight log, and none stamped on the session.
 */
const squatWorkout = {
  id: "session-1", title: "Lower", dayLabel: "Day 1", status: "completed", weightUnit: "kg",
  startedAt: "2026-09-10T11:00:00.000Z", completedAt: "2026-09-10T12:00:00.000Z",
  exercises: [{ id: "squat", exerciseName: "Back Squat", plannedPrescription: "3 x 5", sets: [{ weight: "100", reps: "5", unit: "kg", completed: true }] }],
};

function renderWith(observations: object[], workouts: object[] = []) {
  localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(observations));
  localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(workouts));
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "kg", sexForReference: "male", baselineBodyWeight: 80 }));
}

describe("the rank map says when a lift is read against the profile weight", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); vi.unstubAllGlobals(); mocks.success.mockReset(); mocks.error.mockReset(); });

  /** Opens a lift's record the way the athlete does, from its row in the recent lifts. */
  const openRecord = (observationId: string) => fireEvent.click(document.querySelector(`[aria-describedby="strength-recent-${observationId}"]`)!);

  it("names the lift saved without a body weight, and how to fix it", () => {
    renderWith([bench]);
    const notice = document.querySelector("[data-rank-body-mass-note]");
    expect(notice?.textContent).toBe("Your Barbell Bench Press lift has no body weight saved for its day, so it is read against your profile weight. Open its record to save what you weighed that day.");
  });

  it("lists each lift saved without a body weight when there are several", () => {
    renderWith([bench, { ...bench, id: "device-squat", exerciseName: "Back Squat", observedAt: "2026-09-10T12:00:00.000Z", loadKg: 120 }, { ...bench, id: "device-curl", exerciseName: "Preacher Curl", loadKg: 30, bodyMassKgAtTest: 80 }]);
    const notice = document.querySelector("[data-rank-body-mass-note]")!;
    expect(notice.querySelector("summary")?.textContent).toBe("2 lifts are read against your profile weight");
    expect(Array.from(notice.querySelectorAll("li"), (item) => item.textContent)).toEqual(["Barbell Bench Press", "Back Squat"]);
    expect(notice.textContent).toContain("Open each one's record to save what you weighed that day.");
  });

  it("sends a lift logged by hand to its record, where the body-weight form is", () => {
    renderWith([bench]);
    expect(document.querySelector("[data-rank-body-mass-note]")?.textContent).toContain("Open its record to save what you weighed that day.");
    openRecord("device-bench");
    expect(screen.getByText("Not your weight that day?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save this body weight" })).toBeTruthy();
    expect(document.querySelector("[data-workout-body-mass-note]")).toBeNull();
  });

  it("names a workout lift without sending the athlete to a record that cannot take a weight", () => {
    renderWith([], [squatWorkout]);
    const notice = document.querySelector("[data-rank-body-mass-note]");
    expect(notice?.textContent).toBe("Your Back Squat lift from a workout has no body weight saved for its day, so it is read against your profile weight.");
    expect(notice?.textContent).not.toContain("Open its record");
    openRecord("workout-session-1-squat");
    expect(document.querySelector(".strength-recorded-measurement")).toBeNull();
    expect(screen.queryByText("Not your weight that day?")).toBeNull();
    expect(screen.queryByText("Add test body weight")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save this body weight" })).toBeNull();
    expect(document.querySelector("[data-workout-body-mass-note]")?.textContent).toBe("This lift is from a workout, so it is read against the body weight saved for that day, or your profile weight when none was saved.");
  });

  it("sends only the lifts logged by hand to their records when workout lifts are listed too", () => {
    renderWith([bench], [squatWorkout]);
    const notice = document.querySelector("[data-rank-body-mass-note]")!;
    expect(notice.querySelector("summary")?.textContent).toBe("2 lifts are read against your profile weight");
    expect(Array.from(notice.querySelectorAll("li"), (item) => item.textContent)).toEqual(["Barbell Bench Press", "Back Squat — from a workout"]);
    expect(notice.querySelector("p")?.textContent).toBe("They have no body weight saved for their day. For each lift you logged by hand, open its record to save what you weighed that day.");
    expect(notice.textContent).not.toContain("Open each one's record");
  });

  it("does not say a body weight was saved when this device kept nothing", () => {
    renderWith([bench]);
    openRecord("device-bench");
    (document.querySelector(".strength-recorded-measurement") as HTMLDetailsElement).open = true;
    fireEvent.change(screen.getByLabelText("Body weight on the day of this lift, in kilograms"), { target: { value: "82" } });
    // The device refuses the write (storage full, private mode).
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("QuotaExceededError"); });
    fireEvent.click(screen.getByRole("button", { name: "Save this body weight" }));
    expect(mocks.success).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Body weight was not saved on this device. Your entry is still here.");
    // The map still reads the lift against the profile weight, as the device does.
    expect(document.querySelector("[data-rank-body-mass-note]")?.textContent).toContain("Barbell Bench Press");
  });

  it("says nothing when every lift carries the weight saved with it", () => {
    renderWith([{ ...bench, bodyMassKgAtTest: 82 }]);
    expect(document.querySelector("[data-rank-body-mass-note]")).toBeNull();
    expect(screen.queryByText(note)).toBeNull();
  });
});
