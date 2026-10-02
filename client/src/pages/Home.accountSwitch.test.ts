// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * One account's plan, profile and favourites never land in another's record (Backend V1
 * PS-01, PS-03; B173, B175, B177, B262). Reproduced in discovery: sign out A, sign in B, and
 * B's scoped plan contained A's exercise - the plan still in memory was saved into B's record
 * because hydration found nothing there and marked it read anyway.
 */
vi.mock("sonner", () => {
  const record = () => {};
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});
const auth = { user: null as null | { id: number }, loading: false };
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: auth.user, loading: auth.loading, error: null, isAuthenticated: Boolean(auth.user), logout: async () => {}, refresh: async () => ({}) }),
}));
vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClient: () => null, supabaseConfigured: false }));
const { mutateSpy } = vi.hoisted(() => ({ mutateSpy: vi.fn() }));
vi.mock("@/lib/trpc", () => {
  const query = () => ({ data: undefined, isLoading: false, isPending: false, isError: false, isFetching: false, error: null, refetch: async () => ({}) });
  const mutation = () => ({ mutate: mutateSpy, mutateAsync: async () => ({ status: "saved", revision: 1, updatedAt: new Date() }), isPending: false, error: null, reset: () => {} });
  const node: unknown = new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === "useQuery" || prop === "useSuspenseQuery") return query;
      if (prop === "useMutation") return mutation;
      if (prop === "then") return undefined;
      return node;
    },
    apply() { return node; },
  });
  return { trpc: new Proxy({}, { get(_target, prop) { return prop === "useUtils" || prop === "useContext" ? () => node : node; } }) };
});

import Home from "@/pages/Home";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE = "gym-optimizer-athlete-profile-v1";
const PLAN = "gym-optimizer-workout-plan-v1";
const profile = (preferredName: string) => JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", preferredName } });
const planWith = (ids: number[]) => {
  const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": ids.map((id) => ({ entryId: id, catalogExerciseId: id })) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
  return JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });
};
const idsIn = (key: string): number[] => {
  const plan = JSON.parse(window.localStorage.getItem(key) || "null");
  return Object.values(plan?.weeks?.["1"]?.weeklyPlanEntries ?? {}).flat().map((entry) => (entry as { catalogExerciseId: number }).catalogExerciseId);
};
const settle = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); }); };

beforeEach(() => { window.localStorage.clear(); auth.user = null; auth.loading = false; mutateSpy.mockReset(); window.history.replaceState({}, "", "/?workspace=command"); });
afterEach(() => cleanup());

describe("Changing account on one device", () => {
  it("does not save A's plan into B's empty record", async () => {
    const aExercise = exercises[3];
    window.localStorage.setItem(`${PROFILE}::1`, profile("Alex"));
    window.localStorage.setItem(`${PLAN}::1`, planWith([aExercise.id]));
    window.localStorage.setItem(`${PROFILE}::2`, profile("Blair"));
    auth.user = { id: 1 };
    const view = render(createElement(Home));
    await screen.findByRole("heading", { level: 1 }, { timeout: 15000 });
    await settle();
    expect(idsIn(`${PLAN}::1`)).toContain(aExercise.id);

    auth.user = { id: 2 };
    view.rerender(createElement(Home));
    await settle();
    await settle();
    expect(idsIn(`${PLAN}::2`)).not.toContain(aExercise.id);
    // And A's own record is untouched.
    expect(idsIn(`${PLAN}::1`)).toContain(aExercise.id);
  });

  it("reads B's profile on the switch, and never writes A's into B's record", async () => {
    window.localStorage.setItem(`${PROFILE}::1`, profile("Alex"));
    window.localStorage.setItem(`${PROFILE}::2`, profile("Blair"));
    auth.user = { id: 1 };
    const view = render(createElement(Home));
    await screen.findByRole("heading", { level: 1, name: /Alex/ }, { timeout: 15000 });

    auth.user = { id: 2 };
    view.rerender(createElement(Home));
    await screen.findByRole("heading", { level: 1, name: /Blair/ }, { timeout: 15000 });
    expect(JSON.parse(window.localStorage.getItem(`${PROFILE}::2`)!).baseline.preferredName).toBe("Blair");
    expect(JSON.parse(window.localStorage.getItem(`${PROFILE}::1`)!).baseline.preferredName).toBe("Alex");
  });

  it("does not carry A's favourites into B's record", async () => {
    window.localStorage.setItem(`${PROFILE}::1`, profile("Alex"));
    window.localStorage.setItem("gym-optimizer-favorite-exercise-ids-v1::1", JSON.stringify([exercises[0].id]));
    auth.user = { id: 1 };
    const view = render(createElement(Home));
    await screen.findByRole("heading", { level: 1 }, { timeout: 15000 });
    auth.user = { id: 2 };
    view.rerender(createElement(Home));
    await settle();
    expect(JSON.parse(window.localStorage.getItem("gym-optimizer-favorite-exercise-ids-v1::2") || "[]")).toEqual([]);
  });

  it("claims a shortlist built before sign-in", async () => {
    const shortlist = [exercises[0].id, exercises[1].id];
    window.localStorage.setItem(PROFILE, profile("Alex"));
    window.localStorage.setItem("gym-optimizer-favorite-exercise-ids-v1", JSON.stringify(shortlist));
    const view = render(createElement(Home));
    await screen.findByRole("heading", { level: 1 }, { timeout: 15000 });

    auth.user = { id: 7 };
    view.rerender(createElement(Home));
    await settle();
    await settle();
    expect(JSON.parse(window.localStorage.getItem("gym-optimizer-favorite-exercise-ids-v1::7") || "null")).toEqual(shortlist);
    // Claimed, so the next account to sign in on this device cannot claim it too.
    expect(window.localStorage.getItem("gym-optimizer-favorite-exercise-ids-v1")).toBeNull();
  });

  it("keeps the claimed shortlist when the first heart after sign-in is answered", async () => {
    const shortlist = [exercises[0].id, exercises[1].id];
    window.localStorage.setItem(PROFILE, profile("Alex"));
    window.localStorage.setItem("gym-optimizer-favorite-exercise-ids-v1", JSON.stringify(shortlist));
    window.history.replaceState({}, "", "/?workspace=catalog");
    const view = render(createElement(Home));
    await screen.findAllByRole("button", { name: /^Save .+ to favorites$/ }, { timeout: 15000 });

    auth.user = { id: 7 };
    view.rerender(createElement(Home));
    await settle();
    await settle();
    // The server has never seen the claimed shortlist, so its reply to this heart names this exercise alone.
    // Sep 30: a heart keeps the name "Save X to favorites" and says saved with aria-pressed, so the unsaved one is picked by its state.
    const heart = screen.getAllByRole("button", { name: /^Save .+ to favorites$/ }).find((button) => button.getAttribute("aria-pressed") === "false")!;
    const saved = exercises.find((exercise) => heart.getAttribute("aria-label") === `Save ${exercise.name} to favorites`)!;
    expect(shortlist).not.toContain(saved.id);
    mutateSpy.mockImplementation((input: unknown, options?: { onSuccess?: (ids: number[]) => void }) => {
      if (input && typeof input === "object" && "favorited" in input) options?.onSuccess?.([saved.id]);
    });
    await act(async () => { fireEvent.click(heart); });
    await settle();

    expect(mutateSpy.mock.calls.some(([input]) => Boolean(input) && typeof input === "object" && "favorited" in input)).toBe(true);
    const kept = JSON.parse(window.localStorage.getItem("gym-optimizer-favorite-exercise-ids-v1::7") || "[]");
    expect(kept).toEqual(expect.arrayContaining([...shortlist, saved.id]));
  });
});

describe("A saved profile that no longer reads cleanly", () => {
  /**
   * The goal indexes the programming targets on every render and the training days pick
   * the split, so a goal that is not one of the four, or a missing day count, used to
   * throw on load or show "NaN days a week". Both fall back to the defaults, and the
   * next save writes the repaired record.
   */
  it("opens Home and repairs an unknown goal and a missing training-day count", async () => {
    window.localStorage.setItem(`${PROFILE}::1`, JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Strength", gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", preferredName: "Alex" } }));
    auth.user = { id: 1 };
    render(createElement(Home));
    await screen.findByRole("heading", { level: 1 }, { timeout: 15000 });
    await settle();
    const saved = JSON.parse(window.localStorage.getItem(`${PROFILE}::1`)!);
    expect(saved.goal).toBe("Athleticism");
    expect(saved.trainingDays).toBe(3);
  });
});
