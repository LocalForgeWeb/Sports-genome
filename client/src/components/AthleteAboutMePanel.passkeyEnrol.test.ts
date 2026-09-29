// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registrationOptions: vi.fn(),
  registrationVerify: vi.fn(),
  startRegistration: vi.fn(),
  toast: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ isPending: false, mutateAsync: mocks.registrationOptions }) },
      passkeyRegistrationVerify: { useMutation: () => ({ isPending: false, mutateAsync: mocks.registrationVerify }) },
      passkeys: { useQuery: () => ({ data: [], isError: false, refetch: vi.fn() }) },
      removePasskey: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));
vi.mock("@simplewebauthn/browser", () => ({ startRegistration: mocks.startRegistration }));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: Object.assign(mocks.toast, { success: vi.fn(), error: mocks.toastError }), Toaster: () => null }));

import { AthleteAboutMePanel } from "./AthleteAboutMePanel";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";

const baseline = { experience: "Intermediate" as const, weightUnit: "lb" as const, equipment: defaultEquipmentProfile };
const renderSignedIn = () => render(React.createElement(ThemeProvider, null, React.createElement(AthleteAboutMePanel, {
  baseline, goal: "Athleticism", trainingDays: 3, sportId: "", sports: [],
  onBaseline: vi.fn(), onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(), accountSignedIn: true,
})));

beforeEach(() => {
  // jsdom has no WebAuthn; a device that has it, so the enrol button is live.
  (window as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential = function PublicKeyCredential() {};
  for (const mock of Object.values(mocks)) mock.mockReset();
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential;
});

describe("AthleteAboutMePanel passkey enrolment failures", () => {
  it("says an expired sign-in once, in place of the app-wide notice, rather than stacking a second toast", async () => {
    mocks.registrationOptions.mockRejectedValue(Object.assign(new Error("UNAUTHORIZED"), { data: { code: "UNAUTHORIZED" } }));
    renderSignedIn();

    fireEvent.click(screen.getByRole("button", { name: /Enable Face ID \/ passkey/ }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(1));
    expect(mocks.toast).toHaveBeenCalledWith("Your sign-in has expired", {
      id: "session-expired",
      description: "No passkey was added. Everything stays saved on this device.",
    });
    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.startRegistration).not.toHaveBeenCalled();
  });

  it("keeps its own words when setup is cancelled or unavailable for any other reason", async () => {
    mocks.registrationOptions.mockResolvedValue({ challenge: "c" });
    mocks.startRegistration.mockRejectedValue(new DOMException("The operation was cancelled.", "NotAllowedError"));
    renderSignedIn();

    fireEvent.click(screen.getByRole("button", { name: /Enable Face ID \/ passkey/ }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Face ID or device passkey setup was cancelled or unavailable"));
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.registrationVerify).not.toHaveBeenCalled();
  });
});
