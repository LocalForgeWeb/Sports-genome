// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    // The muscle-rank route: no answer here keeps the map in the coverage view.
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
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

function openFormWith(exerciseName: string) {
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "kg" }));
  fireEvent.click(screen.getByText("Log a lift"));
  fireEvent.change(screen.getByLabelText("Search and choose a catalog exercise"), { target: { value: exerciseName } });
  const option = screen.getAllByRole("option").find((candidate) => candidate.querySelector("strong")?.textContent === exerciseName);
  fireEvent.click(option!);
  return screen.getByRole("button", { name: /Save this lift/ }) as HTMLButtonElement;
}

const savedLifts = () => JSON.parse(localStorage.getItem(deviceStrengthObservationKey) ?? "[]") as Record<string, unknown>[];

describe("Strength Genome log form", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("will not save a measured max with no load, and a blank load is not 0 kg", () => {
    const save = openFormWith("Back Squat");
    expect(save.disabled).toBe(true);
    expect(screen.getByText("Enter the load in kilograms to save this.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "0" } });
    expect(save.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "140" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(savedLifts()[0]).toMatchObject({ exerciseName: "Back Squat", measurementType: "MEASURED_1RM", measuredOneRmKg: 140 });
  });

  it("will not save a working set with no reps", () => {
    const save = openFormWith("Back Squat");
    fireEvent.change(screen.getByLabelText("How you measured it"), { target: { value: "MULTI_REP" } });
    fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "100" } });
    expect(save.disabled).toBe(true);
    expect(screen.getByText("Enter the reps of the working set to save this.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Repetitions"), { target: { value: "5" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(savedLifts()[0]).toMatchObject({ exerciseName: "Back Squat", measurementType: "MULTI_REP", loadKg: 100, repetitions: 5 });
  });

  it("saves a high-rep pull-up set with no added weight", () => {
    const save = openFormWith("Pull-Up");
    fireEvent.change(screen.getByLabelText("How you measured it"), { target: { value: "MULTI_REP" } });
    fireEvent.change(screen.getByLabelText("Repetitions"), { target: { value: "20" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    const [lift] = savedLifts();
    expect(lift).toMatchObject({ exerciseName: "Pull-Up", measurementType: "MULTI_REP", repetitions: 20 });
    expect(lift).not.toHaveProperty("loadKg");
    expect(lift).not.toHaveProperty("measuredOneRmKg");
  });

  it("asks to fix or clear a stray number in an optional load box, by the box's own name", () => {
    const save = openFormWith("Back Squat");
    fireEvent.change(screen.getByLabelText("How you measured it"), { target: { value: "ISOMETRIC" } });
    fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "." } });
    expect(save.disabled).toBe(true);
    expect(screen.getByText("Fix or clear the load in kilograms to save this.")).toBeTruthy();
    expect(screen.queryByText("Enter the load in kilograms to save this.")).toBeNull();

    fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    const [lift] = savedLifts();
    expect(lift).toMatchObject({ exerciseName: "Back Squat", measurementType: "ISOMETRIC" });
    expect(lift).not.toHaveProperty("loadKg");
  });

  it("folds a second decimal point into the load, so only a lone separator is left to fix", () => {
    const save = openFormWith("Back Squat");
    const load = screen.getByLabelText("Load in kilograms") as HTMLInputElement;
    fireEvent.change(load, { target: { value: "1.2.3" } });
    expect(load.value).toBe("1.23");
    expect(save.disabled).toBe(false);

    // A comma is the decimal point on many keypads; alone it is still not a number.
    fireEvent.change(load, { target: { value: "," } });
    expect(load.value).toBe(".");
    expect(save.disabled).toBe(true);
    expect(screen.getByText("Enter the load in kilograms to save this.")).toBeTruthy();
  });

  it("names a pull-up's optional added weight when what was typed there is not a number", () => {
    const save = openFormWith("Pull-Up");
    fireEvent.change(screen.getByLabelText("Added weight in kilograms"), { target: { value: "." } });
    expect(save.disabled).toBe(true);
    expect(screen.getByText("Fix or clear the added weight in kilograms to save this.")).toBeTruthy();
  });

  it("keeps no 0 kg max for a pull-up max saved with no added weight", () => {
    const save = openFormWith("Pull-Up");
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    const [lift] = savedLifts();
    expect(lift).toMatchObject({ exerciseName: "Pull-Up", measurementType: "MEASURED_1RM" });
    expect(lift).not.toHaveProperty("measuredOneRmKg");
  });
});
