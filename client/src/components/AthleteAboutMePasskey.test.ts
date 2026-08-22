import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeys: { useQuery: () => ({ data: [{ id: 4, createdAt: new Date(), lastUsedAt: null }], refetch: vi.fn() }) },
      removePasskey: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import { AthleteAboutMePanel } from "./AthleteAboutMePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("AthleteAboutMePanel passkey management", () => {
  it("shows an enrolled passkey with a distinct scoped removal control", () => {
    const markup = renderToStaticMarkup(createElement(AthleteAboutMePanel, {
      baseline: { experience: "Intermediate", weightUnit: "lb", equipment: { gymAccess: "Commercial gym", availableEquipment: ["Bodyweight"] } },
      goal: "Athleticism",
      trainingDays: 3,
      sportId: "soccer",
      sports: [{ id: "soccer", label: "Soccer" }],
      onBaseline: vi.fn(), onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
    }));

    expect(markup).toContain("Enrolled passkeys");
    expect(markup).toContain("Device passkey 1");
    expect(markup).toContain("Remove device passkey 1");
  });
});
