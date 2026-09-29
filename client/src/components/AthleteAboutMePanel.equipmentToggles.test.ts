// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      passkeys: { useQuery: () => ({ data: [], refetch: vi.fn() }) },
      removePasskey: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { AthleteAboutMePanel } from "./AthleteAboutMePanel";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import type { AthleteBaseline } from "@/components/AthleteBaselineQuiz";

const base: AthleteBaseline = { experience: "Intermediate", weightUnit: "lb", equipment: defaultEquipmentProfile };

function draw(baseline: AthleteBaseline, onBaseline = vi.fn()) {
  const props = (b: AthleteBaseline) => React.createElement(ThemeProvider, null, React.createElement(AthleteAboutMePanel, {
    baseline: b, goal: "Athleticism", trainingDays: 3, sportId: "", sports: [], onBaseline, onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
  }));
  const view = render(props(baseline));
  return { onBaseline, rerender: (b: AthleteBaseline) => view.rerender(props(b)) };
}

afterEach(() => cleanup());

/**
 * Which gym and which kit are chosen was shown only by fill colour and an unnamed tick, so a
 * screen reader heard a row of ordinary buttons. Each now says whether it is on.
 */
describe("Profile equipment toggles say whether they are on", () => {
  it("marks the chosen gym, and moves the mark when another is picked", () => {
    const { onBaseline } = draw(base);
    expect(screen.getByRole("group", { name: "Where you train" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Commercial gym", pressed: true })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Small gym", pressed: false }));
    expect(onBaseline).toHaveBeenLastCalledWith(expect.objectContaining({ equipment: expect.objectContaining({ gymAccess: "Small gym" }) }));
  });

  it("names each piece of kit by its label alone and says when it is switched off", () => {
    const { onBaseline, rerender } = draw(base);
    expect(screen.getByRole("group", { name: "Equipment you can use" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Dumbbells", pressed: true }));
    expect(onBaseline).toHaveBeenCalledTimes(1);
    const next = onBaseline.mock.calls[0][0] as AthleteBaseline;
    expect(next.equipment.availableEquipment).not.toContain("Dumbbells");
    rerender(next);
    expect(screen.getByRole("button", { name: "Dumbbells" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("says bodyweight cannot be switched off, and leaves it on when tapped", () => {
    const { onBaseline } = draw(base);
    const bodyweight = screen.getByRole("button", { name: "Bodyweight", pressed: true });
    expect(bodyweight.getAttribute("aria-disabled")).toBe("true");
    expect(bodyweight.getAttribute("title")).toBe("Always available");
    fireEvent.click(bodyweight);
    expect(onBaseline).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Dumbbells" }).getAttribute("aria-disabled")).toBeNull();
  });
});
