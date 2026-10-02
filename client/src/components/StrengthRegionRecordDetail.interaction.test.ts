// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strengthRegionDefinitions } from "../../../shared/strengthGenomeDefinitions";

const mocks = vi.hoisted(() => ({
  bodyMassMutation: { mutate: vi.fn(), isPending: false },
  mutationOptions: null as null | { onSuccess: () => Promise<void>; onError: () => void },
  invalidate: vi.fn(),
  feedback: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { observations: { invalidate: mocks.invalidate }, overview: { invalidate: mocks.invalidate } } }),
    // The beta community-curve route. Off by default here: these cases are about the
    // research-grade routes, and a percentile arriving would displace the card under test.
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    strengthGenome: {
      setObservationBodyMass: {
        useMutation: (options: typeof mocks.mutationOptions) => {
          mocks.mutationOptions = options;
          return mocks.bodyMassMutation;
        },
      },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: mocks.feedback }));

import { StrengthRegionRecordDetail } from "./StrengthGenomePanel";

const biceps = strengthRegionDefinitions.find((region) => region.id === "biceps")!;
const noOp = () => {};
const missingBodyMassObservation = [{ id: 101, exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 36.2873896, repetitions: null, bodyMassKgAtTest: null }];

function detailElement(overrides: Partial<React.ComponentProps<typeof StrengthRegionRecordDetail>> = {}) {
  return React.createElement(StrengthRegionRecordDetail, { region: biceps, observations: missingBodyMassObservation, onClose: noOp, weightUnit: "lb", directAccess: false, onSetDeviceBodyMass: noOp, ...overrides });
}

function openMeasurementDetail(container: HTMLElement) {
  (container.querySelector(".strength-recorded-measurement") as HTMLDetailsElement).open = true;
}

function renderDetail(overrides: Partial<React.ComponentProps<typeof StrengthRegionRecordDetail>> = {}) {
  const result = render(detailElement(overrides));
  openMeasurementDetail(result.container);
  return result;
}

describe("Strength region body-mass completion", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.bodyMassMutation.mutate.mockReset();
    mocks.bodyMassMutation.isPending = false;
    mocks.mutationOptions = null;
    mocks.invalidate.mockReset();
    mocks.feedback.mockReset();
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  it("submits an account-backed missing body mass and keeps the ratio as supporting detail after refreshed data returns", async () => {
    const { rerender } = renderDetail();
    fireEvent.change(screen.getByLabelText("Body weight on the day of this lift, in pounds"), { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Save this body weight" }));
    expect(mocks.bodyMassMutation.mutate).toHaveBeenCalledWith({ observationId: 101, bodyMassKgAtTest: 81.6466266 });
    await act(async () => { await mocks.mutationOptions?.onSuccess(); });
    expect(mocks.success).toHaveBeenCalledWith("Body weight for this lift saved. Your recorded ratio is ready.");
    rerender(React.createElement(StrengthRegionRecordDetail, { region: biceps, observations: [{ ...missingBodyMassObservation[0], bodyMassKgAtTest: 81.6466266 }], onClose: noOp, weightUnit: "lb", directAccess: false, onSetDeviceBodyMass: noOp }));
    expect(screen.getByText(/0\.44× your body weight on that day — for your own context, not a rank\./)).toBeTruthy();
  });

  it("shows pending status before preserving a failed account-backed entry for inline retry", () => {
    const { rerender, container } = renderDetail();
    const input = screen.getByLabelText("Body weight on the day of this lift, in pounds") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Save this body weight" }));
    mocks.bodyMassMutation.isPending = true;
    rerender(detailElement());
    openMeasurementDetail(container);
    expect(screen.getByRole("status").textContent).toContain("Saving body weight for this lift");
    expect(screen.getByRole("button", { name: "Saving" }).getAttribute("aria-busy")).toBe("true");
    mocks.bodyMassMutation.isPending = false;
    rerender(detailElement());
    openMeasurementDetail(container);
    act(() => { mocks.mutationOptions?.onError(); });
    expect(screen.getByRole("alert").textContent).toBe("Body weight was not saved. Your entry is still here—check your connection and try again.");
    expect(mocks.error).toHaveBeenCalledWith("Could not save the body weight for this lift. Check your connection and try again.");
    expect(input.value).toBe("180");
    fireEvent.click(screen.getByRole("button", { name: "Save this body weight" }));
    expect(mocks.bodyMassMutation.mutate).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps direct-access completion local and bypasses the account mutation", () => {
    // The device kept the weight.
    const setDeviceBodyMass = vi.fn(() => true);
    renderDetail({ directAccess: true, onSetDeviceBodyMass: setDeviceBodyMass });
    fireEvent.change(screen.getByLabelText("Body weight on the day of this lift, in pounds"), { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Save this body weight" }));
    expect(setDeviceBodyMass).toHaveBeenCalledWith("101", 81.6466266);
    expect(mocks.bodyMassMutation.mutate).not.toHaveBeenCalled();
    expect(mocks.feedback).toHaveBeenCalledWith([10, 30, 10]);
    // The weight typed is that day's, not the profile's, and the toast says so.
    expect(mocks.success).toHaveBeenCalledWith("Body weight for this lift saved on this device. Your recorded ratio is ready.");
  });

  it("does not say a weight was saved on this device when nothing was stored, and keeps the entry", () => {
    const setDeviceBodyMass = vi.fn(() => false);
    renderDetail({ directAccess: true, onSetDeviceBodyMass: setDeviceBodyMass });
    const input = screen.getByLabelText("Body weight on the day of this lift, in pounds") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Save this body weight" }));
    expect(setDeviceBodyMass).toHaveBeenCalledWith("101", 81.6466266);
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.feedback).not.toHaveBeenCalledWith([10, 30, 10]);
    expect(screen.getByRole("alert").textContent).toBe("Body weight was not saved on this device. Your entry is still here.");
    expect(input.value).toBe("180");
  });

  it("offers no body-weight form on a lift from a finished workout, and says what it is read against", () => {
    // A workout's lift lives in the workout log: a form here would store nothing on this
    // device, and send an id the account cannot read.
    const workoutCurl = { id: "workout-session-1-exercise-1", exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 30, repetitions: 8, source: "workout" as const, sessionLabel: "Day 1", setCount: 3 };
    for (const directAccess of [true, false]) {
      const { container, unmount } = render(detailElement({ directAccess, observations: [workoutCurl], baselineBodyWeight: 180 }));
      expect(container.querySelector(".strength-recorded-measurement")).toBeNull();
      expect(screen.queryByText("Not your weight that day?")).toBeNull();
      expect(screen.queryByText("Add test body weight")).toBeNull();
      expect(screen.queryByRole("button", { name: "Save this body weight" })).toBeNull();
      expect(container.querySelector("[data-workout-body-mass-note]")?.textContent).toBe("This lift is from a workout, so it is read against the body weight saved for that day, or your profile weight when none was saved.");
      unmount();
    }
  });

  it("uses optional feedback for direct supporting-measurement completion and close, and switches between recorded tests via the picker instead of a raw history list", () => {
    const onClose = vi.fn();
    const alternate = { ...missingBodyMassObservation[0], id: 102, exerciseName: "Machine Preacher Curl", loadKg: 40, bodyMassKgAtTest: 81.6466266 };
    renderDetail({ directAccess: true, onSetDeviceBodyMass: vi.fn(() => true), onClose, observations: [missingBodyMassObservation[0], alternate] });

    fireEvent.change(screen.getByLabelText("Body weight on the day of this lift, in pounds"), { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Save this body weight" }));
    expect(mocks.feedback).toHaveBeenCalledWith([10, 30, 10]);

    expect(screen.queryByText(/Recorded history/)).toBeNull();
    const picker = screen.getByLabelText("Which lift to show") as HTMLSelectElement;
    fireEvent.change(picker, { target: { value: "102" } });
    // The picker itself names the selected test, so assert the displayed record actually
    // switched rather than looking for a duplicate name beneath it.
    expect(picker.value).toBe("102");
    // The header names the selected lift now (Sep 30 §6), so that line is where the switch shows.
    expect(document.querySelector(".strength-region-record-lift")?.textContent).toMatch(/^Machine Preacher Curl · /);
    expect(screen.getByText(/88\.2 lb/)).toBeTruthy();

    expect(screen.getByRole("button", { name: "Close Biceps detail" }).className).toContain("strength-region-close");
    fireEvent.click(screen.getByRole("button", { name: "Close Biceps detail" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mocks.feedback).toHaveBeenCalledTimes(2);
  });
});
