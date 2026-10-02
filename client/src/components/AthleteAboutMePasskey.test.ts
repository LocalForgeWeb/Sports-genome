import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RemoveOptions = { onSuccess?: () => void; onError?: (error?: unknown) => void };
const mocks = vi.hoisted(() => ({
  passkeysQuery: vi.fn(),
  removeOptions: { current: undefined as RemoveOptions | undefined },
  toast: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeys: { useQuery: mocks.passkeysQuery },
      removePasskey: { useMutation: (options: RemoveOptions) => { mocks.removeOptions.current = options; return { isPending: false, mutate: vi.fn() }; } },
    },
  },
}));

vi.mock("sonner", () => ({ toast: Object.assign(mocks.toast, { success: vi.fn(), error: mocks.toastError }), Toaster: () => null }));

import { AthleteAboutMePanel } from "./AthleteAboutMePanel";
import { ThemeProvider } from "@/contexts/ThemeContext";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
const source = readFileSync(resolve(process.cwd(), "client/src/components/AthleteAboutMePanel.tsx"), "utf8");
const panelProps = {
  baseline: { experience: "Intermediate", weightUnit: "lb", equipment: { gymAccess: "Commercial gym", availableEquipment: ["Bodyweight"] } },
  goal: "Athleticism",
  trainingDays: 3,
  sportId: "soccer",
  sports: [{ id: "soccer", label: "Soccer" }],
  onBaseline: vi.fn(), onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
} as unknown as Parameters<typeof AthleteAboutMePanel>[0];
const renderPanel = (accountSignedIn: boolean) => renderToStaticMarkup(createElement(ThemeProvider, null, createElement(AthleteAboutMePanel, { ...panelProps, accountSignedIn })));
const securitySection = (markup: string) => markup.match(/<section class="about-me-security">([^]*?)<\/section>/)?.[1] ?? "";

beforeEach(() => {
  // A device that can make a passkey, so the checks below read the supported path
  // rather than the "Passkey unavailable" copy a bare node environment would give.
  vi.stubGlobal("window", { PublicKeyCredential: function PublicKeyCredential() {} });
  mocks.passkeysQuery.mockReset();
  mocks.passkeysQuery.mockImplementation(() => ({ data: [{ id: 4, createdAt: new Date(), lastUsedAt: null }], isError: false, refetch: vi.fn() }));
  mocks.removeOptions.current = undefined;
  mocks.toast.mockReset();
  mocks.toastError.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AthleteAboutMePanel passkey management", () => {
  it("shows an enrolled passkey with a distinct scoped removal control", () => {
    const markup = renderPanel(true);

    expect(markup).toContain("1 device passkey enrolled");
    expect(markup).toContain("Enable Face ID / passkey");
    expect(markup).toContain("Enrolled passkeys");
    expect(markup).toContain("Device passkey 1");
    expect(markup).toContain("Remove device passkey 1");
    expect(mocks.passkeysQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ enabled: true }));
  });

  it("says a failed read failed, rather than that no passkey is enrolled", () => {
    mocks.passkeysQuery.mockImplementation(() => ({ data: undefined, isError: true, refetch: vi.fn() }));
    const markup = renderPanel(true);

    expect(markup).toContain("Passkeys could not be read");
    expect(markup).toContain("Could not read your passkeys right now.");
    expect(markup).not.toContain("No device passkeys enrolled yet.");
    expect(markup).not.toContain("Passkey not enrolled");
  });

  it("says so when a removal fails, and that the passkey is still enrolled", () => {
    renderPanel(true);
    mocks.removeOptions.current?.onError?.();

    expect(mocks.toastError).toHaveBeenCalledWith("Could not remove that passkey. It is still enrolled.");
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("says an expired sign-in once, in place of the app-wide notice, rather than stacking a second toast", () => {
    renderPanel(true);
    mocks.removeOptions.current?.onError?.({ data: { code: "UNAUTHORIZED" } });

    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    // The shared words (lib/sessionExpiryNotice.ts), after what this refusal cost.
    expect(mocks.toast).toHaveBeenCalledWith("You're signed out of your account", {
      id: "session-expired",
      description: "That passkey is still enrolled. Changes you make are kept on this device.",
    });
  });

  it("does not ask for passkeys, or offer to enrol one, on a device with no email sign-in", () => {
    // The account-only route answers UNAUTHORIZED here; the cached list must not be read either.
    const markup = renderPanel(false);

    expect(mocks.passkeysQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ enabled: false }));
    expect(markup).not.toContain("Enable Face ID / passkey");
    expect(markup).not.toContain("Passkey unavailable");
    expect(securitySection(markup)).not.toContain("<button");
    expect(markup).not.toContain("Enrolled passkeys");
    expect(markup).not.toContain("Passkey not enrolled");
    // This build has no sign-in to go and get, so the copy says what the build does.
    expect(markup).toContain("Not available in this build");
    expect(securitySection(markup)).toContain("Face ID and passkey sign-in is not available in this build yet. Your record does not need it: it is saved as Account &amp; sync describes.");
    expect(markup).not.toMatch(/email sign-in|not signed in/i);
  });

  it("uses nonblocking optional feedback for deliberate athlete-context and equipment changes", () => {
    expect(source).toContain('import { emitInteractionFeedback } from "@/lib/interactionFeedback";');
    // Goal and the day count are cards and chips now, not selects, so the call reads
    // differently - the contract is that a deliberate change still answers back.
    expect(source).toContain('emitInteractionFeedback(); onGoal(item.value);');
    expect(source).toContain('emitInteractionFeedback(); onSport(event.target.value);');
    expect(source).toContain('emitInteractionFeedback(); onDays(days);');
    expect(source).toContain('emitInteractionFeedback(); onSportContextMode(mode.value);');
    expect(source).toContain('emitInteractionFeedback(); onBaseline({ ...baseline, sportModifierId: event.target.value || undefined });');
    expect(source).toContain('emitInteractionFeedback(); onBaseline({ ...baseline, equipment: { gymAccess, availableEquipment: gymAccessProfiles[gymAccess] } });');
    expect(source).not.toContain('Your current workout was retained for review');
  });

  it("keeps the Profile hero concise while preserving its planning-only, non-rating boundary", () => {
    expect(source).toContain("Planning context only — editable inputs that guide stack availability, not health or ability ratings.");
    expect(source).not.toContain("These inputs shape planning context and automatic stack availability.");
  });
});
