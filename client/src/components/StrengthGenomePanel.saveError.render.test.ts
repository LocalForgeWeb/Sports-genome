// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AddObservationOptions = { onError?: (error: { data?: { code?: string } }) => void };

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  toastError: vi.fn(),
  addObservationOptions: null as AddObservationOptions | null,
}));

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
      // The save's own handlers are kept so the test can answer the save the way the server would.
      addObservation: {
        useMutation: (options: AddObservationOptions) => {
          mocks.addObservationOptions = options;
          return { mutate: mocks.mutate, isPending: false };
        },
      },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: {
      progressionHistory: { useQuery: () => ({ data: [] }) },
    },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mocks.toastError } }));

import { StrengthGenomePanel } from "./StrengthGenomePanel";

describe("Strength Genome signed-in lift save", () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.toastError.mockReset();
    mocks.addObservationOptions = null;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("says beside the button that a failed save did not save, and keeps the entry", () => {
    render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
    expect(screen.queryByRole("alert")).toBeNull();

    act(() => { mocks.addObservationOptions?.onError?.({ data: { code: "INTERNAL_SERVER_ERROR" } }); });

    expect(screen.getByRole("alert").textContent).toContain("This lift was not saved");
    expect(screen.getByRole("alert").textContent).toContain("Your entry is still here");
    expect(mocks.toastError).toHaveBeenCalledWith("Could not save this lift.");
  });

  it("says beside the button that an expired sign-in stopped the save, and leaves the toast to the app-wide notice", () => {
    render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
    act(() => { mocks.addObservationOptions?.onError?.({ data: { code: "UNAUTHORIZED" } }); });
    const alert = screen.getByRole("alert").textContent ?? "";
    // No pointer to a sign-in: this build has none for the athlete to go back to.
    expect(alert).toBe("This lift was not saved because your sign-in has expired. Your entry is still here.");
    expect(alert).not.toMatch(/about me|sign in again/i);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("will not save a lift dated with a typo year, and says which field to fix", () => {
    render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
    fireEvent.click(screen.getByText("Log a lift"));
    fireEvent.change(screen.getByLabelText("Search and choose a catalog exercise"), { target: { value: "Back Squat" } });
    fireEvent.click(screen.getAllByRole("option")[0]);
    fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "100" } });
    const save = screen.getByRole("button", { name: /Save this lift/ }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "0202-01-01" } });

    expect(save.disabled).toBe(true);
    expect(screen.getByText("Enter the date this lift happened.")).toBeTruthy();
    fireEvent.click(save);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it("will not save a lift typed with tomorrow's date, though the server's slack would take it", () => {
    const originalZone = process.env.TZ;
    process.env.TZ = "America/New_York";
    // 9:30pm on Sep 27 in New York, already Sep 28 in UTC and within the server's two days.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-09-28T01:30:00Z") });
    try {
      render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
      fireEvent.click(screen.getByText("Log a lift"));
      fireEvent.change(screen.getByLabelText("Search and choose a catalog exercise"), { target: { value: "Back Squat" } });
      fireEvent.click(screen.getAllByRole("option")[0]);
      fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "100" } });
      const save = screen.getByRole("button", { name: /Save this lift/ }) as HTMLButtonElement;
      const date = screen.getByLabelText("Date") as HTMLInputElement;
      expect(date.value).toBe("2026-09-27");
      expect(save.disabled).toBe(false);

      // A desktop date box takes a typed day past its max.
      fireEvent.change(date, { target: { value: "2026-09-28" } });

      expect(date.value).toBe("2026-09-28");
      expect(save.disabled).toBe(true);
      expect(screen.getByText("Enter the date this lift happened.")).toBeTruthy();
      fireEvent.click(save);
      expect(mocks.mutate).not.toHaveBeenCalled();

      // Today itself is still a day the lift can be saved on.
      fireEvent.change(date, { target: { value: "2026-09-27" } });
      expect(save.disabled).toBe(false);
    } finally {
      vi.useRealTimers();
      if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone;
    }
  });

  it("will not save a lift dated with a day the month does not have", () => {
    render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
    fireEvent.click(screen.getByText("Log a lift"));
    fireEvent.change(screen.getByLabelText("Search and choose a catalog exercise"), { target: { value: "Back Squat" } });
    fireEvent.click(screen.getAllByRole("option")[0]);
    fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: "100" } });
    const save = screen.getByRole("button", { name: /Save this lift/ }) as HTMLButtonElement;
    const date = screen.getByLabelText("Date") as HTMLInputElement;
    // jsdom's date box drops a day it cannot parse, as browsers do, so the day is
    // set on the element's value property the way a stale autofill might.
    Object.defineProperty(date, "value", { configurable: true, get: () => "2021-02-30", set: () => undefined });
    fireEvent.change(date);

    expect(save.disabled).toBe(true);
    expect(screen.getByText("Enter the date this lift happened.")).toBeTruthy();
  });

  it("opens the form on the athlete's own day, not the UTC day", () => {
    const originalZone = process.env.TZ;
    process.env.TZ = "America/New_York";
    // 9:30pm on Sep 27 in New York, already Sep 28 in UTC.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-09-28T01:30:00Z") });
    try {
      render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
      const date = screen.getByLabelText("Date") as HTMLInputElement;
      expect(date.value).toBe("2026-09-27");
      // The picker offers no day after today.
      expect(date.max).toBe("2026-09-27");
    } finally {
      vi.useRealTimers();
      if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone;
    }
  });
});
