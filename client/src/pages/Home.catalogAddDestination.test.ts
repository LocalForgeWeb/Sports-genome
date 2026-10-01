// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The add-destination journeys of the Sep 30 brief (section 9), on the real Home:
 * from a movement's exercises, add to a day that is not Home's next workout; the
 * exercise lands in that day only, a double tap writes it once, the row then shows
 * it as added, the day the plan already held is untouched, and Home's next workout
 * is still the one it was.
 */

type ToastOptions = { description?: string };
const toasts: { title: string; options?: ToastOptions }[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: ToastOptions) => { toasts.push({ title, options }); };
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
const BRIDGE_ADDRESS = "?workspace=catalog&discover=movement&sport=wrestling&movement=wrestling-19";
const profile = JSON.stringify({ version: 3, sportId: "wrestling", sportContextMode: "sport", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "wrestling-19", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const planWith = (entries: Record<string, number[]>) => {
  const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(entries).map(([key, ids]) => [key, ids.map((id) => ({ entryId: id, catalogExerciseId: id }))])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
  return JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });
};
const dayIds = (dayKey: string): number[] => {
  const plan = JSON.parse(window.localStorage.getItem(PLAN_KEY) || "null");
  return (plan?.weeks?.["1"]?.weeklyPlanEntries?.[dayKey] || []).map((entry: { catalogExerciseId: number }) => entry.catalogExerciseId);
};
const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const nextWorkout = () => waitFor(() => { const day = document.querySelector(".today-action-primary h2")?.textContent; if (!day) throw new Error("Home not ready"); return day; }, { timeout: 15000 });

const hipThrust = exercises.find((exercise) => exercise.name === "Barbell Hip Thrust")!;
const [pushHeld, pullHeld] = [exercises[0], exercises[5]];

beforeEach(() => {
  window.localStorage.clear();
  toasts.length = 0;
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, planWith({ "0-Push": [pushHeld.id], "1-Pull": [pullHeld.id] }));
});
afterEach(() => { cleanup(); });

describe("adding from a movement's exercises", () => {
  it("lands in the chosen day only, once for a double tap, and leaves Home's next workout alone", async () => {
    window.history.replaceState({}, "", "/?workspace=command");
    render(createElement(Home));
    expect(await nextWorkout()).toBe("Push");

    // Into Bridge's exercises, the way a link or Back arrives.
    await act(async () => { window.history.pushState({}, "", `/${BRIDGE_ADDRESS}`); window.dispatchEvent(new PopStateEvent("popstate")); });
    await screen.findByRole("heading", { level: 1, name: "Exercises for Bridge" }, { timeout: 15000 });

    // Pull, not Home's next workout.
    await act(async () => { fireEvent.click(screen.getByText(/Adding to/).closest("summary")!); });
    await act(async () => { fireEvent.click(screen.getAllByRole("button").find((button) => /Day 02 · Pull/.test(button.textContent || ""))!); });
    expect(document.querySelector(".add-destination > summary")?.textContent).toContain("Adding to Week 1 · Pull");

    const add = await screen.findByRole("button", { name: "Add Barbell Hip Thrust to Week 1, Pull" });
    await act(async () => { add.click(); add.click(); });
    await tick();

    expect(dayIds("1-Pull")).toEqual([pullHeld.id, hipThrust.id]);
    expect(dayIds("0-Push")).toEqual([pushHeld.id]);
    expect(toasts.filter((entry) => entry.title === "Added to Week 1 · Pull")).toHaveLength(1);
    expect(toasts.some((entry) => entry.title === "Already in this workout")).toBe(false);

    // The row now says it is in that day, and another tap writes nothing.
    const added = screen.getByRole("button", { name: "Barbell Hip Thrust is already in Week 1, Pull" });
    expect(added.getAttribute("aria-disabled")).toBe("true");
    await act(async () => { fireEvent.click(added); });
    expect(dayIds("1-Pull")).toEqual([pullHeld.id, hipThrust.id]);
    expect(toasts.some((entry) => entry.title === "Already in this workout")).toBe(false);

    // Home still leads with the workout it led with: browsing and adding to Pull moved nothing there.
    await act(async () => { window.history.back(); });
    await tick();
    expect(window.location.search).toBe("?workspace=command");
    expect(await nextWorkout()).toBe("Push");
  }, 60000);
});
