// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sep 30 brief §1 (Plan row) and §8. Switching weeks is navigation, not a change: the
 * selected pill and the plan's identity line already say which week is open, so it raises
 * no "Week N loaded" toast. Generating a week is a change, and still says so. The generic
 * "name it in your profile" prompt sits after the day's Add/Reorder/Open row, so it never
 * separates a workout from its actions; a declared focus stays with the day's rows.
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
const focus = { focus: { targetKey: "shoulder", intent: "build_capacity", laterality: "right" }, constraint: { targetKey: "shoulder", constraintType: "symptomatic", laterality: "right" }, reportedSignals: [] };
const profile = (withFocus = false) => JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" }, ...(withFocus ? { capacityFocus: focus } : {}) });
const weekWith = (entries: Record<string, number[]>) => ({ customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(entries).map(([key, ids]) => [key, ids.map((id) => ({ entryId: id, catalogExerciseId: id }))])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 });
const twoWeeks = () => {
  const [a, b, c] = exercises;
  const week1 = weekWith({ "0-Push": [a.id, b.id], "1-Pull": [c.id] });
  return JSON.stringify({ version: 2, ...week1, weeks: { "1": week1, "2": weekWith({ "0-Push": [c.id] }) }, activeWeek: 1 });
};

/** Waits for the Plan to render its week row; the page is lazy in places, so this can take a moment. */
const weekRow = async () => within(await screen.findByRole("group", { name: "Training week" }, { timeout: 15000 }));
const follows = (later: Element, earlier: Element) => Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; });
afterEach(() => { cleanup(); });

describe("switching weeks on the Plan", () => {
  it("raises no toast: the selected pill and the identity line say which week is open", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile());
    window.localStorage.setItem(PLAN_KEY, twoWeeks());
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));

    const weeks = await weekRow();
    await act(async () => { fireEvent.click(weeks.getByRole("button", { name: /^Week 2/ })); });

    expect(toasts.some((entry) => /loaded/i.test(entry.title))).toBe(false);
    expect(toasts).toEqual([]);
    expect(weeks.getByRole("button", { name: /^Week 2/ }).getAttribute("aria-current")).toBe("true");
    const identity = screen.getAllByRole("status").find((node) => /^Week \d · Day 01/.test(node.textContent || ""));
    expect(identity?.textContent).toMatch(/^Week 2 · Day 01 · 1 exercise$/);
  });

  it("still confirms generating a week, which changes the plan", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile());
    window.localStorage.setItem(PLAN_KEY, twoWeeks());
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));

    const weeks = await weekRow();
    await act(async () => { fireEvent.click(weeks.getByRole("button", { name: /^Week 3\s*Generate$/ })); });

    expect(toasts.map((entry) => entry.title)).toEqual(["Week 3 generated"]);
  });
});

describe("the profile prompt on a Plan day", () => {
  it("sits after the day's Add/Reorder/Open row, not between the workout and its actions", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile());
    window.localStorage.setItem(PLAN_KEY, twoWeeks());
    window.history.replaceState({}, "", "/?workspace=day-plan");
    const { container } = render(createElement(Home));
    await weekRow();

    const list = container.querySelector(".day-plan-list")!;
    const actions = container.querySelector(".day-plan-actions")!;
    const prompt = container.querySelector(".day-capacity-note-empty")!;
    expect(prompt.textContent).toContain("Name it in your profile");
    expect(within(actions as HTMLElement).getByRole("button", { name: /Add exercises/ })).toBeTruthy();
    expect(follows(actions, list)).toBe(true);
    expect(follows(prompt, actions)).toBe(true);
    expect(container.querySelectorAll(".day-capacity-note")).toHaveLength(1);
  });

  it("keeps a declared focus with the day's rows, ahead of the actions", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile(true));
    window.localStorage.setItem(PLAN_KEY, twoWeeks());
    window.history.replaceState({}, "", "/?workspace=day-plan");
    const { container } = render(createElement(Home));
    await weekRow();

    const note = container.querySelector(".day-capacity-note")!;
    expect(note.classList.contains("day-capacity-note-empty")).toBe(false);
    expect(follows(note, container.querySelector(".day-plan-list")!)).toBe(true);
    expect(follows(container.querySelector(".day-plan-actions")!, note)).toBe(true);
    expect(container.querySelector(".day-capacity-note-empty")).toBeNull();
  });
});
