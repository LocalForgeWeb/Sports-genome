// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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

import { AthleteAboutMePanel, parseBirthYear, parseBodyWeight } from "./AthleteAboutMePanel";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import type { AthleteBaseline } from "@/components/AthleteBaselineQuiz";

const base: AthleteBaseline = { experience: "Intermediate", weightUnit: "lb", equipment: defaultEquipmentProfile };

function draw(baseline: AthleteBaseline, onBaseline = vi.fn()) {
  const props = (b: AthleteBaseline) => React.createElement(ThemeProvider, null, React.createElement(AthleteAboutMePanel, {
    baseline: b, goal: "Athleticism", trainingDays: 3, sportId: "", sports: [], onBaseline, onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
  }));
  const view = render(props(baseline));
  // The identity fields open behind the Edit control since the Profile redesign.
  fireEvent.click(document.querySelector('[aria-controls="about-me-identity-fields"]')!);
  return { onBaseline, year: () => screen.getByPlaceholderText("e.g. 1998") as HTMLInputElement, weight: () => screen.getByPlaceholderText("Not added") as HTMLInputElement, rerender: (b: AthleteBaseline) => view.rerender(props(b)) };
}

afterEach(() => { document.body.innerHTML = ""; });

/**
 * Reported from a phone: "it's not letting me put my birth year". The field was bound to the
 * saved profile and every keystroke was checked as a whole year, so "1", "19" and "199" were
 * each saved as nothing and the box stayed empty. It now holds what is typed and saves the
 * year once there is one.
 */
describe("Typing a birth year in About Me", () => {
  it("keeps each digit on screen and saves the year only once it is whole", () => {
    const { onBaseline, year, rerender } = draw(base);
    for (const partial of ["1", "19", "199"]) {
      fireEvent.change(year(), { target: { value: partial } });
      expect(year().value).toBe(partial);
    }
    expect(onBaseline).not.toHaveBeenCalled();

    fireEvent.change(year(), { target: { value: "1998" } });
    expect(onBaseline).toHaveBeenCalledTimes(1);
    expect(onBaseline).toHaveBeenLastCalledWith({ ...base, birthYear: 1998 });
    rerender({ ...base, birthYear: 1998 });
    expect(year().value).toBe("1998");
  });

  it("clears the saved year when a digit is deleted, and keeps the rest of the entry", () => {
    const { onBaseline, year, rerender } = draw({ ...base, birthYear: 1998 });
    expect(year().value).toBe("1998");
    fireEvent.change(year(), { target: { value: "199" } });
    expect(onBaseline).toHaveBeenLastCalledWith({ ...base, birthYear: undefined });
    rerender({ ...base, birthYear: undefined });
    // The profile change that the edit itself caused must not wipe the digits still being edited.
    expect(year().value).toBe("199");
  });

  it("drops anything that is not a digit and stops at four", () => {
    const { year } = draw(base);
    fireEvent.change(year(), { target: { value: "19a9-8" } });
    expect(year().value).toBe("1998");
    fireEvent.change(year(), { target: { value: "19985" } });
    expect(year().value).toBe("1998");
  });

  it("says why a whole year was not taken, and why a short one was not, without saving either", () => {
    const { onBaseline, year } = draw(base);
    fireEvent.change(year(), { target: { value: "1800" } });
    expect(onBaseline).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/^Between \d{4} and \d{4}\.$/);
    expect(year().getAttribute("aria-describedby")).toBe("about-me-birth-year-hint");

    fireEvent.change(year(), { target: { value: "19" } });
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.blur(year());
    expect(screen.getByRole("status").textContent).toBe("Four digits, like 1998.");
    fireEvent.focus(year());
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("follows a year set from another screen when the field is not mid-entry", () => {
    const { year, rerender } = draw(base);
    rerender({ ...base, birthYear: 1990 });
    expect(year().value).toBe("1990");
  });
});

/** The same binding ate the decimal point: "145." became 145 and the point could never be typed. */
describe("Typing a bodyweight in About Me", () => {
  it("keeps a trailing point on screen and saves the decimal once it has a digit", () => {
    const { onBaseline, weight, rerender } = draw(base);
    fireEvent.change(weight(), { target: { value: "145" } });
    expect(onBaseline).toHaveBeenLastCalledWith({ ...base, bodyWeight: 145 });
    rerender({ ...base, bodyWeight: 145 });
    fireEvent.change(weight(), { target: { value: "145." } });
    expect(weight().value).toBe("145.");
    expect(onBaseline).toHaveBeenCalledTimes(1);
    fireEvent.change(weight(), { target: { value: "145.5" } });
    expect(onBaseline).toHaveBeenLastCalledWith({ ...base, bodyWeight: 145.5 });
  });
});

describe("What counts as a year", () => {
  const now = new Date("2026-09-27T12:00:00Z");
  it.each([
    ["1926", undefined], ["1927", 1927], ["1998", 1998], ["2026", 2026], ["2027", undefined], ["199", undefined], ["", undefined],
  ])("%s -> %s", (text, expected) => {
    expect(parseBirthYear(text, now)).toBe(expected);
  });

  it("reads a weight only from a positive number", () => {
    expect(parseBodyWeight("145.5")).toBe(145.5);
    expect(parseBodyWeight("145.")).toBe(145);
    expect(parseBodyWeight("0")).toBeUndefined();
    expect(parseBodyWeight("")).toBeUndefined();
  });
});
