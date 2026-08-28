import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
const source = readFileSync(resolve(process.cwd(), "client/src/components/AthleteAboutMePanel.tsx"), "utf8");

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

  it("uses nonblocking optional feedback for deliberate athlete-context and equipment changes", () => {
    expect(source).toContain('import { emitInteractionFeedback } from "@/lib/interactionFeedback";');
    expect(source).toContain('emitInteractionFeedback(); onGoal(event.target.value as TrainingGoal);');
    expect(source).toContain('emitInteractionFeedback(); onSport(event.target.value);');
    expect(source).toContain('emitInteractionFeedback(); onDays(Number(event.target.value));');
    expect(source).toContain('emitInteractionFeedback(); onBaseline({ ...baseline, sportModifierId: event.target.value || undefined });');
    expect(source).toContain('emitInteractionFeedback(); onBaseline({ ...baseline, equipment: { gymAccess, availableEquipment: gymAccessProfiles[gymAccess] } });');
    expect(source).not.toContain('Your current workout was retained for review');
  });

  it("keeps the Profile hero concise while preserving its planning-only, non-rating boundary", () => {
    expect(source).toContain("Planning context only — editable inputs that guide stack availability, not health or ability ratings.");
    expect(source).not.toContain("These inputs shape planning context and automatic stack availability.");
  });
});
