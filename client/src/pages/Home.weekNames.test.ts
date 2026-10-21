// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Make it so you can name the weeks" (owner, 21 Oct 2026). A name is kept with the plan,
 * comes back on reload, and shows beside the week's number. It is a label only: the plan's
 * weeks and the day labels that sessions and logs match on still say "Week N". Replacing or
 * removing a name offers Undo rather than asking first.
 */

type ToastOptions = { description?: string; action?: { label: string; onClick: () => void } };
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
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const weekWith = (entries: Record<string, number[]>) => ({ customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(entries).map(([key, ids]) => [key, ids.map((id) => ({ entryId: id, catalogExerciseId: id }))])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 });
const twoWeeks = (extra: Record<string, unknown> = {}) => {
  const [a, b, c] = exercises;
  const week1 = weekWith({ "0-Push": [a.id, b.id], "1-Pull": [c.id] });
  return JSON.stringify({ version: 2, ...week1, weeks: { "1": week1, "2": weekWith({ "0-Push": [c.id] }) }, activeWeek: 1, ...extra });
};
const saved = () => JSON.parse(window.localStorage.getItem(PLAN_KEY) || "{}");
const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const weekRow = async () => within(await screen.findByRole("group", { name: "Training week" }, { timeout: 15000 }));

const nameOpenWeek = async (button: RegExp, name: string) => {
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: button })); });
  const field = screen.getByRole("textbox", { name: /^Name for Week \d$/ });
  await act(async () => { fireEvent.change(field, { target: { value: name } }); });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Save" })); });
  await tick();
};

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  toasts.length = 0;
});
afterEach(() => { cleanup(); });

describe("naming the plan's weeks", () => {
  it("saves a name with the plan, shows it beside the number, and brings it back on reload", async () => {
    window.localStorage.setItem(PLAN_KEY, twoWeeks());
    window.history.replaceState({}, "", "/?workspace=day-plan");
    const view = render(createElement(Home));
    let weeks = await weekRow();
    expect(saved().weekNames).toBeUndefined();
    const before = saved();

    await nameOpenWeek(/^Name Week 1$/, "  Heavy  ");
    expect(weeks.getByRole("button", { name: /^Heavy\s*Week 1 · 2 saved$/ }).getAttribute("aria-current")).toBe("true");
    expect(within(screen.getByRole("region", { name: "Training plan selection" })).getByRole("status").textContent).toBe("Week 1: Heavy · Day 01");
    // Naming is shown in place; it raises no toast.
    expect(toasts).toEqual([]);

    // Kept with the plan, and nothing else in the plan moved.
    const after = saved();
    expect(after.weekNames).toEqual({ "1": "Heavy" });
    const { weekNames: _names, ...rest } = after;
    expect(rest).toEqual(before);

    view.unmount();
    render(createElement(Home));
    weeks = await weekRow();
    expect(weeks.getByRole("button", { name: /^Heavy\s*Week 1 · 2 saved$/ })).toBeTruthy();
    expect(weeks.getByRole("button", { name: /^Week 2\s*1 saved$/ })).toBeTruthy();
  });

  it("names each week apart and labels the week's Review with the name", async () => {
    window.localStorage.setItem(PLAN_KEY, twoWeeks({ weekNames: { "1": "Heavy" } }));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    const weeks = await weekRow();
    await act(async () => { fireEvent.click(weeks.getByRole("button", { name: /^Week 2\s*1 saved$/ })); });
    await tick();
    await nameOpenWeek(/^Name Week 2$/, "Deload");
    expect(saved().weekNames).toEqual({ "1": "Heavy", "2": "Deload" });
    expect(weeks.getByRole("button", { name: /^Deload\s*Week 2 · 1 saved$/ }).getAttribute("aria-current")).toBe("true");

    window.history.pushState({}, "", "/?workspace=review");
    await act(async () => { window.dispatchEvent(new PopStateEvent("popstate")); });
    await tick();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Week 2: Deload · 3-day plan");
  });

  it("offers Undo when a name is replaced or removed", async () => {
    window.localStorage.setItem(PLAN_KEY, twoWeeks({ weekNames: { "1": "Heavy" } }));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    const weeks = await weekRow();

    await nameOpenWeek(/^Rename Week 1, Heavy$/, "Peak");
    expect(toasts.map((entry) => entry.title)).toEqual(["Week 1 is now “Peak”"]);
    expect(toasts[0].options?.description).toBe("It was “Heavy”.");
    expect(saved().weekNames).toEqual({ "1": "Peak" });

    await nameOpenWeek(/^Rename Week 1, Peak$/, "   ");
    expect(toasts[1].title).toBe("Week 1 has no name now");
    expect(weeks.getByRole("button", { name: /^Week 1\s*2 saved$/ })).toBeTruthy();
    // With no names left, the plan is saved as it was before weeks had names.
    expect("weekNames" in saved()).toBe(false);

    expect(toasts[1].options?.action?.label).toBe("Undo");
    await act(async () => { toasts[1].options!.action!.onClick(); });
    await tick();
    expect(weeks.getByRole("button", { name: /^Peak\s*Week 1 · 2 saved$/ })).toBeTruthy();
    expect(saved().weekNames).toEqual({ "1": "Peak" });
  });

  it("drops a malformed or out-of-range name rather than failing to load the plan", async () => {
    window.localStorage.setItem(PLAN_KEY, twoWeeks({ weekNames: { "1": 42, "2": "Deload", "9": "Nope" } }));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    const weeks = await weekRow();
    expect(weeks.getByRole("button", { name: /^Week 1\s*2 saved$/ })).toBeTruthy();
    expect(weeks.getByRole("button", { name: /^Deload\s*Week 2 · 1 saved$/ })).toBeTruthy();
    await tick();
    expect(saved().weekNames).toEqual({ "2": "Deload" });
  });
});
