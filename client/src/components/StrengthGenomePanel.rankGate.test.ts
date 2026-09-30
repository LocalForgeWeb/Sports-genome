// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedback: vi.fn(), mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    // The community-curve route, answering as the server does: no group, no percentile.
    strengthPercentile: { forLift: { useQuery: (input: { sex: string | null; bodyMassKg: number | null }) => ({ data: communityAnswer(input) }) } },
    // The muscle-rank route: no answer here keeps the map in the coverage view these tests describe.
    strengthProfile: { muscleRanks: { useQuery: () => ({ data: undefined }) } },
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
import type { StrengthPercentileResult } from "@shared/strengthPercentile";

/** The live route's answers for the reported bench (175 lb at 145 lb, 1.21x), male curve. */
function communityAnswer(input: { sex: string | null; bodyMassKg: number | null }): StrengthPercentileResult {
  if (!input.sex) return { status: "unavailable", reason: "sex_required" };
  if (!input.bodyMassKg) return { status: "unavailable", reason: "body_mass_required" };
  return {
    status: "resolved", percentile: 44.1, observedValue: 1.2069,
    ageAdjustment: { status: "not_applied", reason: "age_missing", ageYears: null },
    estimate: { valueKg: 79.38, basis: "measured", confidence: 1, effectiveReps: 1 },
    confidence: 0.82, scoringVersion: "strength_beta_v1", route: "beta_community_curve",
    normalizationMethod: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", sourceRole: "beta_fallback",
    exerciseId: "bench", aliasOfExerciseId: null, borrowedCurve: false,
  };
}
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

describe("the last step to a percentile is taken where the percentile would be", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(benchPress));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("answers the gate in place instead of naming a field on another screen", () => {
    // "Add the sex to compare against in About Me" is true and unreachable: the field is
    // behind the bottom bar, in Profile, and nothing there returns to this lift.
    const onRankProfile = vi.fn();
    openChest({ birthYear: 1998, onRankProfile });

    expect(screen.getByText(/Choose the group to compare against/)).toBeTruthy();
    expect(screen.queryByText(/in About Me and this lift gets a percentile/)).toBeNull();
    // The groups are the curves' own: people who lift, not competitors. The map asks too, so
    // look inside the sheet.
    expect(within(screen.getByRole("group", { name: /record$/ })).getByRole("option", { name: "Men who lift" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /competitors/ })).toBeNull();

    fireEvent.change(screen.getByLabelText("Group to compare this lift against"), { target: { value: "male" } });
    expect(onRankProfile).toHaveBeenCalledWith({ sexForReference: "male" });
  });

  it("places the lift once the group is known, against people who lift", () => {
    openChest({ sexForReference: "male", birthYear: 1998, onRankProfile: vi.fn() });

    expect(screen.getByText("Where this sits")).toBeTruthy();
    expect(screen.getByText("44th percentile")).toBeTruthy();
    expect(screen.getByText(/among men who lift this lift/)).toBeTruthy();
    // Intentional change (B065): never ranked against powerlifting competitors from a gym log.
    expect(screen.queryByText("Where this ranks")).toBeNull();
    expect(screen.queryByText(/powerlifting competitors/)).toBeNull();
    expect(screen.queryByText(/your body weight on that day — for your own context, not a rank/)).toBeNull();
  });

  it("offers the birth year once there is a percentile, as the optional age adjustment", () => {
    const onRankProfile = vi.fn();
    openChest({ sexForReference: "male", onRankProfile });

    expect(screen.getByText("44th percentile")).toBeTruthy();
    expect(screen.getByText(/Optional: add your birth year and this comparison is adjusted for your age/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Birth year"), { target: { value: "1998" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onRankProfile).toHaveBeenCalledWith({ birthYear: 1998 });
  });

  it("does not offer the birth year again once it is known", () => {
    openChest({ sexForReference: "male", birthYear: 1998, onRankProfile: vi.fn() });
    expect(screen.queryByLabelText("Birth year")).toBeNull();
  });

  it("reads the lift against the weight from the questionnaire, without asking for it again", () => {
    // The observation carries no body mass of its own; a weight given during onboarding
    // is read rather than asked for a second time, and the card says it is borrowed.
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ ...benchPress[0], bodyMassKgAtTest: null }]));
    openChest({ baselineBodyWeight: 145, sexForReference: "male", birthYear: 1998, onRankProfile: vi.fn() });

    expect(screen.getByText("44th percentile")).toBeTruthy();
    expect(screen.getByText("Not your weight that day?")).toBeTruthy();
    expect(screen.queryByText("Add the body weight for this lift")).toBeNull();
  });

  it("still asks outright when there is no weight anywhere to read the lift against", () => {
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ ...benchPress[0], bodyMassKgAtTest: null }]));
    openChest({ sexForReference: "male", birthYear: 1998, onRankProfile: vi.fn() });

    expect(screen.getByText("Add test body weight")).toBeTruthy();
    expect(screen.getByText(/Add your body weight and this lift gets a percentile/)).toBeTruthy();
  });

  it("does not ask again for an answer it already has", () => {
    // Intersex and Prefer not to say are complete answers; the curves are split by men
    // and women, so the sheet says why there is no percentile instead of asking again.
    const onRankProfile = vi.fn();
    openChest({ sexForReference: "intersex", birthYear: 1998, onRankProfile });

    expect(screen.getByText(/split into men and women who lift/)).toBeTruthy();
    expect(screen.queryByLabelText("Group to compare this lift against")).toBeNull();
    expect(screen.queryByText(/Choose the group to compare against/)).toBeNull();
  });
});

describe("the map asks for the group its ranks compare against, in place", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(benchPress));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  function renderMap(props: Record<string, unknown>) {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", ...props }));
  }

  it("answers on the map instead of sending the athlete to About Me", () => {
    const onRankProfile = vi.fn();
    renderMap({ onRankProfile });

    expect(screen.queryByText(/set it in About Me/)).toBeNull();
    expect(screen.getByText(/this map ranks the muscle groups your lifts train/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Group to rank your lifts against"), { target: { value: "female" } });
    expect(onRankProfile).toHaveBeenCalledWith({ sexForReference: "female" });
  });

  it("still names About Me when there is no way to answer here", () => {
    renderMap({});

    expect(screen.getByText(/set it in About Me/)).toBeTruthy();
    expect(screen.queryByLabelText("Group to rank your lifts against")).toBeNull();
  });

  it("does not ask the map's question again for an answer it already has", () => {
    renderMap({ sexForReference: "unspecified", onRankProfile: vi.fn() });

    expect(screen.queryByLabelText("Group to rank your lifts against")).toBeNull();
    expect(screen.queryByText(/set it in About Me/)).toBeNull();
    expect(screen.getByText(/for the group you chose this map shows where lifts are on record/)).toBeTruthy();
  });
});
