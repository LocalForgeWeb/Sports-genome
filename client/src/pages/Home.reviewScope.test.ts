// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Review in two scopes (5 October 2026 brief §2): the way in decides the scope, the control
 * switches it, the address carries it, and none of it moves the day Plan has open or the
 * week. Home's "Review week" opens the week; Plan's pointer opens the day.
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
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const entries = (ids: number[]) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": entries([exercises[0].id, exercises[1].id]), "1-Pull": entries([exercises[2].id]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 1 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });

const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const scopeControl = () => screen.getByRole("group", { name: "Review scope" });
const pressed = (name: string) => within(scopeControl()).getByRole("button", { name }).getAttribute("aria-pressed");

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("Review's scope", () => {
  it("opens on the week from the tab, switches to the day without moving the day Plan has open, and carries the scope in the address", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    const tabs = await screen.findByRole("navigation", { name: "Train workspace pages" }, { timeout: 15000 });
    await act(async () => { fireEvent.click(within(tabs).getByRole("button", { name: "Review" })); });
    await tick();
    expect(window.location.search).toBe("?workspace=review");
    expect(pressed("Week")).toBe("true");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Week 1 · 3-day plan");
    expect(screen.getByRole("list", { name: "Sessions in plan order" })).not.toBeNull();

    await act(async () => { fireEvent.click(within(scopeControl()).getByRole("button", { name: "Day" })); });
    await tick();
    expect(window.location.search).toBe("?workspace=review&scope=day");
    expect(pressed("Day")).toBe("true");
    // The day Plan had open (Day 02 · Pull, from the saved plan) is the day reviewed; nothing moved it.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Week 1 · Day 02 · Pull");
    expect(screen.getByRole("button", { name: /Open workout/ })).not.toBeNull();
    expect(screen.queryByRole("list", { name: "Sessions in plan order" })).toBeNull();

    // Back to the week: the same page, the plain address.
    await act(async () => { fireEvent.click(within(scopeControl()).getByRole("button", { name: "Week" })); });
    await tick();
    expect(window.location.search).toBe("?workspace=review");
  });

  it("restores a day-scoped address on load and on Back", async () => {
    window.history.replaceState({}, "", "/?workspace=review&scope=day");
    render(createElement(Home));
    await screen.findByRole("group", { name: "Review scope" }, { timeout: 15000 });
    expect(pressed("Day")).toBe("true");
    const tabs = screen.getByRole("navigation", { name: "Train workspace pages" });
    await act(async () => { fireEvent.click(within(tabs).getByRole("button", { name: "Plan" })); });
    await tick();
    expect(window.location.search).toBe("?workspace=day-plan");
    await act(async () => { window.history.back(); });
    await tick();
    expect(window.location.search).toBe("?workspace=review&scope=day");
    expect(pressed("Day")).toBe("true");
  });

  it("opens the day from Plan's pointer and the week from Home, and the tab keeps the last scope", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await screen.findByRole("navigation", { name: "Train workspace pages" }, { timeout: 15000 });
    const pointer = (await screen.findAllByRole("button", { name: "Review" })).find((button) => button.closest(".day-review-pointer"))!;
    await act(async () => { fireEvent.click(pointer); });
    await tick();
    expect(window.location.search).toBe("?workspace=review&scope=day");
    expect(pressed("Day")).toBe("true");

    const tabs = screen.getByRole("navigation", { name: "Train workspace pages" });
    await act(async () => { fireEvent.click(within(tabs).getByRole("button", { name: "Plan" })); });
    await tick();
    await act(async () => { fireEvent.click(within(tabs).getByRole("button", { name: "Review" })); });
    await tick();
    expect(pressed("Day")).toBe("true");

    const home = screen.getByRole("navigation", { name: "Primary mobile navigation" });
    await act(async () => { fireEvent.click(within(home).getByRole("button", { name: /Home/ })); });
    await tick();
    const reviewWeek = await screen.findByRole("button", { name: /Review week/ }, { timeout: 15000 });
    await act(async () => { fireEvent.click(reviewWeek); });
    await tick();
    expect(window.location.search).toBe("?workspace=review");
    expect(pressed("Week")).toBe("true");
  });
});
