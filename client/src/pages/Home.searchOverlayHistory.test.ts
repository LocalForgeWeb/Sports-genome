// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * An exercise opened from search shows over the catalog, so its overlay entry
 * has to sit on top of the catalog's. It used to sit underneath: closing the
 * overlay left an entry behind for a later Back to swallow, and Back with the
 * overlay open skipped the catalog the athlete had just been shown.
 */

vi.mock("sonner", () => {
  const record = () => {};
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, error: null, isAuthenticated: false, logout: async () => {}, refresh: async () => ({}) }),
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
// Search itself is covered by its own tests; here it only has to hand Home one exercise result.
vi.mock("@/components/UniversalSearch", async () => {
  const { createElement: h } = await import("react");
  const { exercises: catalog } = await import("@/lib/exerciseCatalog");
  const first = catalog[0];
  return {
    UniversalSearch: ({ onOpenResult }: { onOpenResult: (result: unknown) => void }) => h("button", {
      type: "button",
      onClick: () => onOpenResult({ type: "exercise", id: String(first.id), label: first.name, context: "", matchKind: "exact", score: 1 }),
    }, "Open search result"),
  };
});

import Home from "@/pages/Home";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const PLAN_KEY = "gym-optimizer-workout-plan-v1";
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": [{ entryId: exercises[0].id, catalogExerciseId: exercises[0].id }] }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("An exercise opened from search", () => {
  it("puts its overlay over the catalog, closes back to the catalog, and leaves no entry for a later Back", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    const open = await screen.findByRole("button", { name: "Open search result" }, { timeout: 15000 });

    await act(async () => { fireEvent.click(open); });
    expect(window.history.state?.overlay).toBe("exercise");
    expect(window.location.search).toBe("?workspace=catalog");
    await screen.findByRole("dialog", undefined, { timeout: 15000 });

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Close exercise intelligence" })); });
    await waitFor(() => expect(document.querySelector(".exercise-intelligence-close")).toBeNull());
    await waitFor(() => expect(window.history.state?.overlay).toBeUndefined());
    expect(window.location.search).toBe("?workspace=catalog");
    // The catalog's screen loads on first arrival, so it can land a moment later.
    await waitFor(() => expect(document.querySelector(".catalog-experience-surface")).toBeTruthy(), { timeout: 15000 });
    // Closing the overlay is not a Back, so the way back to the page search was opened from stays.
    expect(screen.getByText("Opened from search.")).toBeTruthy();

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(window.location.search).toBe("?workspace=day-plan"));
  });
});
