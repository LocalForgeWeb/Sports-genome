// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
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
vi.mock("@/lib/trpc", () => {
  const query = () => ({ data: undefined, isLoading: false, isPending: false, isError: false, isFetching: false, error: null, refetch: async () => ({}) });
  const mutation = () => ({ mutate: () => {}, mutateAsync: async () => ({ status: "saved", revision: 1, updatedAt: new Date() }), isPending: false, error: null, reset: () => {} });
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

beforeEach(() => { window.localStorage.clear(); auth.user = null; auth.loading = false; window.history.replaceState({}, "", "/?workspace=command"); });
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
});
