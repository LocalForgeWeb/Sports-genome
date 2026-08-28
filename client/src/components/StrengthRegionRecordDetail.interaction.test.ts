// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strengthRegionDefinitions } from "../../../shared/strengthGenomeDefinitions";

const mocks = vi.hoisted(() => ({
  bodyMassMutation: { mutate: vi.fn(), isPending: false },
  mutationOptions: null as null | { onSuccess: () => Promise<void>; onError: () => void },
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { observations: { invalidate: mocks.invalidate }, overview: { invalidate: mocks.invalidate } } }),
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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));

import { StrengthRegionRecordDetail } from "./StrengthGenomePanel";

const biceps = strengthRegionDefinitions.find((region) => region.id === "biceps")!;
const noOp = () => {};
const missingBodyMassObservation = [{ id: 101, exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 36.2873896, repetitions: null, bodyMassKgAtTest: null }];

function detailElement(overrides: Partial<React.ComponentProps<typeof StrengthRegionRecordDetail>> = {}) {
  return React.createElement(StrengthRegionRecordDetail, { region: biceps, observations: missingBodyMassObservation, onClose: noOp, weightUnit: "lb", directAccess: false, onSetDeviceBodyMass: noOp, ...overrides });
}

function renderDetail(overrides: Partial<React.ComponentProps<typeof StrengthRegionRecordDetail>> = {}) {
  return render(detailElement(overrides));
}

describe("Strength region body-mass completion", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.bodyMassMutation.mutate.mockReset();
    mocks.bodyMassMutation.isPending = false;
    mocks.mutationOptions = null;
    mocks.invalidate.mockReset();
  });

  it("submits an account-backed missing body mass and shows the selected-record ratio after refreshed data returns", async () => {
    const { rerender } = renderDetail();
    fireEvent.change(screen.getByLabelText("Body mass on test day in pounds"), { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate ratio" }));
    expect(mocks.bodyMassMutation.mutate).toHaveBeenCalledWith({ observationId: 101, bodyMassKgAtTest: 81.6466266 });
    await act(async () => { await mocks.mutationOptions?.onSuccess(); });
    rerender(React.createElement(StrengthRegionRecordDetail, { region: biceps, observations: [{ ...missingBodyMassObservation[0], bodyMassKgAtTest: 81.6466266 }], onClose: noOp, weightUnit: "lb", directAccess: false, onSetDeviceBodyMass: noOp }));
    expect(screen.getByText("0.44×")).toBeTruthy();
    expect(screen.getByText("Recorded load / test body mass")).toBeTruthy();
  });

  it("shows pending status before preserving a failed account-backed entry for inline retry", () => {
    const { rerender } = renderDetail();
    const input = screen.getByLabelText("Body mass on test day in pounds") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate ratio" }));
    mocks.bodyMassMutation.isPending = true;
    rerender(detailElement());
    expect(screen.getByRole("status").textContent).toContain("Saving body mass for this test");
    expect(screen.getByRole("button", { name: "Saving" }).getAttribute("aria-busy")).toBe("true");
    mocks.bodyMassMutation.isPending = false;
    rerender(detailElement());
    act(() => { mocks.mutationOptions?.onError(); });
    expect(screen.getByRole("alert").textContent).toContain("Your entry is still here");
    expect(input.value).toBe("180");
    fireEvent.click(screen.getByRole("button", { name: "Calculate ratio" }));
    expect(mocks.bodyMassMutation.mutate).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps direct-access completion local and bypasses the account mutation", () => {
    const setDeviceBodyMass = vi.fn();
    renderDetail({ directAccess: true, onSetDeviceBodyMass: setDeviceBodyMass });
    fireEvent.change(screen.getByLabelText("Body mass on test day in pounds"), { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate ratio" }));
    expect(setDeviceBodyMass).toHaveBeenCalledWith("101", 81.6466266);
    expect(mocks.bodyMassMutation.mutate).not.toHaveBeenCalled();
  });
});
