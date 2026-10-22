// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "I'm struggling to navigate the training day section when it comes to switching the workout
 * days in a week. If I want I should be able to have 5 upper days or whatever; all the potential
 * day splits should be visible as an option when building a week" (owner, 22 Oct 2026).
 *
 * The Plan's "Edit days" sets the number of days, what each day is, or a ready-made split. A day
 * keeps its exercises, in every week, when its kind changes. The layout is kept with the profile.
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
const profile = { version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } };
const [a, b, c, d] = exercises;
const weekWith = (entries: Record<string, number[]>) => ({ customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(entries).map(([key, ids]) => [key, ids.map((id) => ({ entryId: id, catalogExerciseId: id }))])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 });
const week1 = weekWith({ "0-Upper": [a.id, b.id], "1-Lower": [c.id], "2-Upper": [d.id] });
const week2 = weekWith({ "2-Upper": [c.id] });
const plan = JSON.stringify({ version: 2, ...week1, weeks: { "1": week1, "2": week2 }, activeWeek: 1 });
const savedWeeks = () => {
  const stored = JSON.parse(window.localStorage.getItem(PLAN_KEY) || "{}");
  return Object.fromEntries(Object.entries(stored.weeks as Record<string, { weeklyPlanEntries: Record<string, { catalogExerciseId: number }[]> }>).map(([week, snapshot]) => [week, Object.fromEntries(Object.entries(snapshot.weeklyPlanEntries).filter(([, entries]) => entries.length).map(([key, entries]) => [key, entries.map((entry) => entry.catalogExerciseId)]))]));
};
const savedProfile = () => JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "{}");
const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const dayTabs = () => within(screen.getByRole("tablist", { name: "Day of the week" })).getAllByRole("tab");
const tabLabels = () => dayTabs().map((tab) => tab.textContent);
const names = () => [...document.querySelectorAll(".day-plan-list .custom-row-identity strong")].map((el) => el.firstChild!.textContent!.trim());
const openDay = async (index: number) => { await act(async () => { fireEvent.click(dayTabs()[index]); }); await tick(); };
const openWeek = async (label: RegExp) => { await act(async () => { fireEvent.click(within(screen.getByRole("group", { name: "Training week" })).getByRole("button", { name: label })); }); await tick(); };
const editor = () => within(screen.getByRole("region", { name: "Your training days" }));
const openEditor = async () => { await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Edit days" })); }); };
const start = async () => {
  window.history.replaceState({}, "", "/?workspace=day-plan");
  const view = render(createElement(Home));
  await screen.findByRole("tablist", { name: "Day of the week" }, { timeout: 15000 });
  await tick();
  return view;
};

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.localStorage.setItem(PLAN_KEY, plan);
  toasts.length = 0;
});
afterEach(() => { cleanup(); });

describe("the week's days on the Plan", () => {
  it("changes one day's kind and keeps its exercises, in this week and the others", async () => {
    await start();
    expect(tabLabels()).toEqual(["UpperDay 1 · 2", "LowerDay 2 · 1", "UpperDay 3 · 1", "LowerDay 4 · —"]);
    await openEditor();
    await act(async () => { fireEvent.change(editor().getByRole("combobox", { name: /Day 3/ }), { target: { value: "Push" } }); });
    await tick();
    expect(tabLabels()[2]).toBe("PushDay 3 · 1");
    await openDay(2);
    expect(names()).toEqual([d.name]);
    expect(savedWeeks()).toEqual({ "1": { "0-Upper": [a.id, b.id], "1-Lower": [c.id], "2-Push": [d.id] }, "2": { "2-Push": [c.id] } });
    expect(savedProfile().dayLayout).toEqual(["Upper", "Lower", "Push", "Lower"]);
    await openWeek(/^Week 2/);
    await openDay(2);
    expect(names()).toEqual([c.name]);
  });

  it("makes five Upper days with a ready-made split, and Undo puts the week back exactly", async () => {
    await start();
    await openEditor();
    await act(async () => { fireEvent.click(editor().getByRole("button", { name: "5 days a week" })); });
    await tick();
    expect(dayTabs()).toHaveLength(5);
    // The suggestion for five days, each day's exercises carried to it (Day 3's Upper work to
    // the new Upper day), none lost.
    expect(tabLabels()).toEqual(["PushDay 1 · 2", "PullDay 2 · 1", "LegsDay 3 · —", "UpperDay 4 · 1", "Sport TransferDay 5 · —"]);
    await act(async () => { fireEvent.click(editor().getByRole("button", { name: /^Upper every day/ })); });
    await tick();
    expect(tabLabels().map((label) => label!.slice(0, 5))).toEqual(["Upper", "Upper", "Upper", "Upper", "Upper"]);
    expect(savedProfile()).toMatchObject({ trainingDays: 5, dayLayout: ["Upper", "Upper", "Upper", "Upper", "Upper"] });
    // Every exercise is still in the week, on a day of its own.
    expect(Object.values(savedWeeks()["1"]).flat().sort()).toEqual([a.id, b.id, c.id, d.id].sort());
    const message = toasts.at(-1)!;
    expect(message.title).toBe("Upper every day");
    expect(message.options?.description).toBe("Upper · Upper · Upper · Upper · Upper");

    await act(async () => { message.options!.action!.onClick(); });
    await tick();
    // Back to the five days as they were before the split, every record where it was.
    expect(tabLabels()).toEqual(["PushDay 1 · 2", "PullDay 2 · 1", "LegsDay 3 · —", "UpperDay 4 · 1", "Sport TransferDay 5 · —"]);
    expect(savedWeeks()["1"]).toEqual({ "0-Push": [a.id, b.id], "1-Pull": [c.id], "3-Upper": [d.id] });
  });

  it("brings the chosen days back after a reload", async () => {
    const view = await start();
    await openEditor();
    await act(async () => { fireEvent.change(editor().getByRole("combobox", { name: /Day 2/ }), { target: { value: "Upper" } }); });
    await tick();
    view.unmount();
    await start();
    expect(tabLabels()).toEqual(["UpperDay 1 · 2", "UpperDay 2 · 1", "UpperDay 3 · 1", "LowerDay 4 · —"]);
  });

  it("keeps each week's days apart when switching weeks from a day other than the first", async () => {
    // A week's open day was written under the arriving week's day when React ran the snapshot
    // late: Week 1's Day 3 replaced its Day 1 after a trip to Week 2 and back.
    await start();
    await openEditor();
    await act(async () => { fireEvent.change(editor().getByRole("combobox", { name: /Day 3/ }), { target: { value: "Push" } }); });
    await tick();
    await openDay(2);
    await openWeek(/^Week 2/);
    await openWeek(/^Week 1/);
    await openDay(0);
    expect(names()).toEqual([a.name, b.name]);
    expect(savedWeeks()["1"]).toEqual({ "0-Upper": [a.id, b.id], "1-Lower": [c.id], "2-Push": [d.id] });
  });
});
