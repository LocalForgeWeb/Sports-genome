// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The lit tab is the tab of the page on screen, however the athlete got there.
 * Reported: tap Review, press Back, and the page returns to Plan while Review
 * stays lit, because the tapped tab was remembered and Back never cleared it.
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

// history.back() is applied on a later task, and so is the popstate it fires.
const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("The highlighted tab follows the page on screen", () => {
  it("lights Plan again after tapping Review and pressing Back", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    const tabs = await screen.findByRole("navigation", { name: "Train workspace pages" }, { timeout: 15000 });
    const plan = within(tabs).getByRole("button", { name: "Plan" });
    const review = within(tabs).getByRole("button", { name: "Review" });
    expect(plan.getAttribute("aria-current")).toBe("page");

    await act(async () => { fireEvent.click(review); });
    await tick();
    expect(window.location.search).toBe("?workspace=review");
    expect(within(tabs).getByRole("button", { name: "Review" }).getAttribute("aria-current")).toBe("page");

    await act(async () => { window.history.back(); });
    await tick();
    expect(window.location.search).toBe("?workspace=day-plan");
    const row = screen.getByRole("navigation", { name: "Train workspace pages" });
    expect(within(row).getByRole("button", { name: "Plan" }).getAttribute("aria-current")).toBe("page");
    expect(within(row).getByRole("button", { name: "Review" }).getAttribute("aria-current")).toBeNull();
  });
});

describe("Back from a search result", () => {
  // The return bar named the page from an old navigation list ("Training Days",
  // "Session", "Movement Atlas") that no heading or tab uses any more.
  it("names the page the athlete came from the way that page names itself", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await screen.findByRole("navigation", { name: "Train workspace pages" }, { timeout: 15000 });

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Search Sports Genome" })); });
    const input = within(screen.getByRole("dialog", { name: "Search Sports Genome" })).getByRole("combobox");
    fireEvent.change(input, { target: { value: "muscle map" } });
    await act(async () => { fireEvent.keyDown(input, { key: "Enter" }); });
    await tick();

    expect(window.location.search).toBe("?workspace=body");
    const back = screen.getByRole("button", { name: /Back to Training plan$/ });
    expect(screen.queryByText(/Back to Training Days/)).toBeNull();
    // Sep 30 brief §8: a lucide arrow, not a "←" character, in front of the words.
    expect(back.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(back.textContent).toBe(" Back to Training plan");
  });
});
