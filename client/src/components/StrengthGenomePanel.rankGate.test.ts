// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedback: vi.fn(), mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    repair: { deleteStrengthObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { regions: [], athleteConfirmedPriorityRegionIds: [], nextAction: "Add a result" } }) },
      observations: { useQuery: () => ({ data: [] }) },
      priorities: { useQuery: () => ({ data: [] }) },
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      // Empty, so the rank falls back to the transcribed 18-35 table - the
      // offline path an athlete hits when the registry has not answered yet.
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: mocks.feedback }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

/** The reported lift: a 175 lb bench at 145 lb, which is 1.21x body weight. */
const benchPress = [{
  id: "device-bench",
  exerciseName: "Barbell Bench Press",
  observedAt: "2026-09-12T12:00:00.000Z",
  measurementType: "MEASURED_1RM",
  loadKg: 175 * 0.45359237,
  bodyMassKgAtTest: 145 * 0.45359237,
}];

function openChest(props: Record<string, unknown>) {
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", ...props }));
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
}

describe("the last step to a rank is taken where the rank would be", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(benchPress));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("answers the gate in place instead of naming a field on another screen", () => {
    // "Add the sex to compare against in About Me to see where this ranks" is
    // true and unreachable: the field is behind the bottom bar, in Profile,
    // under About Me, and nothing there returns to this lift.
    const onRankProfile = vi.fn();
    openChest({ birthYear: 1998, onRankProfile });

    expect(screen.getByText(/Add the group to compare against/)).toBeTruthy();
    expect(screen.queryByText(/About Me to see where this ranks/)).toBeNull();

    fireEvent.change(screen.getByLabelText("Group to compare this lift against"), { target: { value: "male" } });
    expect(onRankProfile).toHaveBeenCalledWith({ sexForReference: "male" });
  });

  it("asks for the birth year the same way, once the group is known", () => {
    const onRankProfile = vi.fn();
    openChest({ sexForReference: "male", onRankProfile });

    expect(screen.getByText(/Add your birth year/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Birth year"), { target: { value: "1998" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onRankProfile).toHaveBeenCalledWith({ birthYear: 1998 });
  });

  it("ranks the lift once both are known, and names the group it ranked against", () => {
    openChest({ sexForReference: "male", birthYear: 1998, onRankProfile: vi.fn() });

    expect(screen.getByText("Where this ranks")).toBeTruthy();
    expect(screen.getByText("10th–20th percentile")).toBeTruthy();
    expect(screen.getByText(/Male drug-tested, unequipped powerlifting competitors aged 18–35/)).toBeTruthy();
    // The ratio line reads "for your own context, not a rank", which is a
    // direct contradiction of the card above it once something has ranked. The
    // rank card states the same ratio itself, so nothing is lost.
    expect(screen.queryByText(/your body weight on that day — for your own context, not a rank/)).toBeNull();
    expect(screen.getByText(/1\.21× body weight/)).toBeTruthy();
  });

  it("reads the lift against the weight from the questionnaire, without asking for it again", () => {
    // The observation carries no body mass of its own, and the dated weight log
    // only looks backwards - a weight entered today matches no lift logged
    // before today. That is every lift an athlete records first, and all of
    // them landed on a form with a Save button between them and their ratio,
    // for a number they had already given during onboarding.
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ ...benchPress[0], bodyMassKgAtTest: null }]));
    openChest({ baselineBodyWeight: 145, sexForReference: "male", birthYear: 1998, onRankProfile: vi.fn() });

    expect(screen.getByText("Where this ranks")).toBeTruthy();
    expect(screen.getByText("10th–20th percentile")).toBeTruthy();
    // Borrowed, and it says so rather than passing it off as measured that day.
    expect(screen.getByText(/1\.21× body weight \(from your profile weight\)/)).toBeTruthy();
    // The field is still there to correct it - as a correction, not a gate.
    expect(screen.getByText("Not your weight that day?")).toBeTruthy();
    expect(screen.queryByText("Add the body weight for this lift")).toBeNull();
  });

  it("still asks outright when there is no weight anywhere to read the lift against", () => {
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ ...benchPress[0], bodyMassKgAtTest: null }]));
    openChest({ sexForReference: "male", birthYear: 1998, onRankProfile: vi.fn() });

    expect(screen.getByText("Add test body weight")).toBeTruthy();
    expect(screen.getByText(/Add your body weight on that day/)).toBeTruthy();
  });

  it("does not ask again for an answer it already has", () => {
    // Intersex and Prefer not to say are both offered in About Me, and both
    // used to arrive here as an empty field.
    const onRankProfile = vi.fn();
    openChest({ sexForReference: "intersex", birthYear: 1998, onRankProfile });

    expect(screen.getByText(/male and female competitor groups only/)).toBeTruthy();
    expect(screen.queryByLabelText("Group to compare this lift against")).toBeNull();
    expect(screen.queryByText(/Add the group to compare against/)).toBeNull();
  });
});
