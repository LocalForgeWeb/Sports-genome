// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ removePasskeyMutate: vi.fn(), refetch: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      passkeys: { useQuery: () => ({ data: [{ id: 1, lastUsedAt: null }], refetch: mocks.refetch }) },
      removePasskey: { useMutation: () => ({ mutate: mocks.removePasskeyMutate, isPending: false }) },
    },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { AthleteAboutMePanel } from "./AthleteAboutMePanel";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";

const baseline = { experience: "Intermediate" as const, weightUnit: "lb" as const, equipment: defaultEquipmentProfile };

describe("AthleteAboutMePanel passkey removal (Reversible-action contract, Tier C)", () => {
  afterEach(() => { document.body.innerHTML = ""; mocks.removePasskeyMutate.mockReset(); });

  it("requires a named confirmation before removing a device passkey, rather than mutating on the first click", () => {
    render(React.createElement(AthleteAboutMePanel, {
      baseline, goal: "Athleticism", trainingDays: 3, sportId: "", sports: [],
      onBaseline: vi.fn(), onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
    }));
    fireEvent.click(screen.getByRole("button", { name: "Remove device passkey 1" }));
    expect(mocks.removePasskeyMutate).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeTruthy();
    expect(screen.getByText("Remove this passkey?")).toBeTruthy();
    expect(dialog.textContent).toContain("Device passkey 1");

    fireEvent.click(screen.getByText("Remove passkey"));
    expect(mocks.removePasskeyMutate).toHaveBeenCalledWith({ passkeyId: 1 });
  });

  it("does not remove the passkey when the confirmation is cancelled", () => {
    render(React.createElement(AthleteAboutMePanel, {
      baseline, goal: "Athleticism", trainingDays: 3, sportId: "", sports: [],
      onBaseline: vi.fn(), onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
    }));
    fireEvent.click(screen.getByRole("button", { name: "Remove device passkey 1" }));
    fireEvent.click(screen.getByText("Cancel"));
    expect(mocks.removePasskeyMutate).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
