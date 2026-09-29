import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ passkeysQuery: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeys: { useQuery: mocks.passkeysQuery },
      removePasskey: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

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

beforeEach(() => {
  mocks.passkeysQuery.mockReset();
  mocks.passkeysQuery.mockImplementation(() => ({ data: [{ id: 4, createdAt: new Date(), lastUsedAt: null }], refetch: vi.fn() }));
});

describe("AthleteAboutMePanel passkey management", () => {
  it("shows an enrolled passkey with a distinct scoped removal control", () => {
    const markup = renderPanel(true);

    expect(markup).toContain("Enrolled passkeys");
    expect(markup).toContain("Device passkey 1");
    expect(markup).toContain("Remove device passkey 1");
    expect(mocks.passkeysQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ enabled: true }));
  });

  it("does not ask for passkeys, or offer to enrol one, on a device with no email sign-in", () => {
    // The account-only route answers UNAUTHORIZED here; the cached list must not be read either.
    const markup = renderPanel(false);

    expect(mocks.passkeysQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ enabled: false }));
    expect(markup).not.toContain("Enable Face ID / passkey");
    expect(markup).not.toContain("Enrolled passkeys");
    expect(markup).not.toContain("Passkey not enrolled");
    expect(markup).toContain("Needs an email sign-in");
    expect(markup).toContain("not signed in to one");
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
