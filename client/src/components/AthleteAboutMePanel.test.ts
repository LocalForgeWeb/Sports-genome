import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { sportProfiles } from "@/lib/sportMovementDatabase";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeys: { useQuery: () => ({ data: [{ id: 4, label: "Device ending abc123", lastUsedAt: null }], refetch: vi.fn() }) },
      removePasskey: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { AthleteAboutMePanel } from "./AthleteAboutMePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("About Me passkey management", () => {
  const originalWindow = globalThis.window;
  afterEach(() => Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow }));

  it("renders persistent existing-account passkey enrollment on a supported device", () => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: { PublicKeyCredential: class PublicKeyCredential {} } });
    const markup = renderToStaticMarkup(createElement(AthleteAboutMePanel, {
      baseline: { experience: "Intermediate", weightUnit: "lb", equipment: defaultEquipmentProfile }, goal: "Athleticism", trainingDays: 3, sportId: "soccer", sports: sportProfiles,
      onBaseline: vi.fn(), onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
    }));
    expect(markup).toContain("Account security");
    expect(markup).toContain("Face ID / passkey");
    expect(markup).toContain("Enable Face ID / passkey");
    expect(markup).toContain("Your biometric data stays on your device");
    expect(markup).toContain("Device ending abc123");
    expect(markup).toContain("Remove");
    expect(markup).toContain("Reset sport selection");
  });
});
