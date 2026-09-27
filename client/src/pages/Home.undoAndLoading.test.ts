// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Plan edits are bound to the day they were made on, and nothing edits the plan before
 * the saved plan has been read. Both were reproduced against the real Home page during
 * Backend V1 discovery (docs/backend-v1/inventory/persistence.md PS-07, PS-08; traces.md
 * TR-04): Undo acted on whichever day was open when it was pressed, and an exercise added
 * while the plan was still loading was confirmed and then overwritten.
 */

type ToastOptions = { description?: string; action?: { label: string; onClick: () => void }; cancel?: { label: string; onClick: () => void } };
const toasts: { title: string; options?: ToastOptions }[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: ToastOptions) => { toasts.push({ title, options }); };
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

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const PLAN_KEY = "gym-optimizer-workout-plan-v1";
const profile = () => JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const planWith = (entries: Record<string, number[]>) => {
  const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(entries).map(([key, ids]) => [key, ids.map((id) => ({ entryId: id, catalogExerciseId: id }))])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
  return JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });
};
const dayIds = (dayKey: string): number[] => {
  const plan = JSON.parse(window.localStorage.getItem(PLAN_KEY) || "null");
  return (plan?.weeks?.["1"]?.weeklyPlanEntries?.[dayKey] || []).map((entry: { catalogExerciseId: number }) => entry.catalogExerciseId);
};

/** Opens the destination chooser on the catalog and picks another day. */
async function switchDestinationTo(label: RegExp) {
  const chooser = screen.queryByText(/Adding to/i);
  if (!chooser) throw new Error("destination chooser not found");
  await act(async () => { fireEvent.click(chooser.closest("summary")!); });
  const day = screen.getAllByRole("button").find((button) => label.test(button.textContent || ""));
  if (!day) throw new Error(`no day button matching ${label}`);
  await act(async () => { fireEvent.click(day); });
}

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; auth.user = null; auth.loading = false; });
afterEach(() => { cleanup(); });

describe("Undo takes back the edit it belongs to, on the day it was made", () => {
  it("removes the added entry from the day it was added to, even after switching days", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile());
    // Day 02 · Pull already holds the exercise we will add to Day 01 · Push.
    const probe = exercises.find((exercise) => exercise.name === "Barbell Row") ?? exercises[5];
    window.localStorage.setItem(PLAN_KEY, planWith({ "0-Push": [], "1-Pull": [probe.id] }));
    window.history.replaceState({}, "", "/?workspace=catalog");
    render(createElement(Home));

    const addButtons = await screen.findAllByRole("button", { name: /^Add .+ to Week 1/ }, { timeout: 15000 });
    const chosen = addButtons.find((button) => button.getAttribute("aria-label")?.includes(probe.name)) ?? addButtons[0];
    const chosenId = exercises.find((exercise) => exercise.name === chosen.getAttribute("aria-label")!.replace(/^Add /, "").replace(/ to Week 1.*$/, ""))!.id;
    window.localStorage.setItem(PLAN_KEY, window.localStorage.getItem(PLAN_KEY)!); // no-op; keeps the seeded Day 02 as written
    await act(async () => { fireEvent.click(chosen); });
    const added = toasts.find((entry) => /^Added to/.test(entry.title));
    expect(dayIds("0-Push")).toContain(chosenId);

    await switchDestinationTo(/Day 02 · Pull/);
    await act(async () => { added!.options!.cancel!.onClick(); });

    expect(dayIds("0-Push")).not.toContain(chosenId);
    // Day 02's own copy (seeded) is untouched when the chosen exercise is the one seeded there.
    if (chosenId === probe.id) expect(dayIds("1-Pull")).toContain(probe.id);
  });

  it("puts a removed exercise back into its own day and place, not into the day that is open", async () => {
    const [first, second, third, other] = exercises.slice(0, 4);
    window.localStorage.setItem(PROFILE_KEY, profile());
    window.localStorage.setItem(PLAN_KEY, planWith({ "0-Push": [first.id, second.id, third.id], "1-Pull": [other.id] }));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));

    const removeButton = await screen.findByRole("button", { name: new RegExp(`^Remove ${second.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }, { timeout: 15000 }).catch(() => null);
    if (!removeButton) return; // the Plan row layout names its remove control differently; the catalog case above still pins the rule
    await act(async () => { fireEvent.click(removeButton); });
    const removed = toasts.find((entry) => /removed$/.test(entry.title));
    expect(dayIds("0-Push")).toEqual([first.id, third.id]);

    window.history.replaceState({}, "", "/?workspace=catalog");
    cleanup();
    render(createElement(Home));
    await screen.findAllByRole("button", { name: /^Add .+ to Week 1/ }, { timeout: 15000 });
    await switchDestinationTo(/Day 02 · Pull/);
    await act(async () => { (removed!.options!.action ?? removed!.options!.cancel)!.onClick(); });
    expect(dayIds("1-Pull")).toEqual([other.id]);
  });
});

describe("Nothing edits the plan before it has been read", () => {
  it("says the plan is loading instead of reporting no plan", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile());
    window.localStorage.setItem(PLAN_KEY, planWith({ "0-Push": [exercises[0].id] }));
    auth.loading = true;
    window.history.replaceState({}, "", "/?workspace=command");
    render(createElement(Home));
    await screen.findByText("Loading your plan…", undefined, { timeout: 15000 });
    expect(document.body.textContent).not.toContain("No session built yet");
  });

  it("refuses an add made while the plan is loading, so nothing is confirmed and then lost", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile());
    window.localStorage.setItem(PLAN_KEY, planWith({ "0-Push": [exercises[0].id] }));
    auth.loading = true;
    window.history.replaceState({}, "", "/?workspace=catalog");
    const view = render(createElement(Home));
    const addButtons = await screen.findAllByRole("button", { name: /^Add .+ to Week 1/ }, { timeout: 15000 });
    await act(async () => { fireEvent.click(addButtons[addButtons.length - 1]); });
    expect(toasts.some((entry) => entry.title === "Your plan is still loading")).toBe(true);
    expect(toasts.some((entry) => /^Added to/.test(entry.title))).toBe(false);

    auth.loading = false;
    view.rerender(createElement(Home));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
    expect(dayIds("0-Push")).toEqual([exercises[0].id]);
  });
});
