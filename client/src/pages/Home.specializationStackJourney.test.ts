// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The stack, end to end through Home (docs/specialization-atlas/11-forearm-research-and-stack.md
 * §3.2, §3.3, §3.7; lane S4): the real page on plan A (the prototype's 3 days, 60 min, Muscle growth,
 * Hammer Curl on Day 03), in Planned mode → Design a stack → Add → the page's planned direct moving
 * count is the total the athlete chose → Undo puts the plan back exactly as it was. Home fetches the
 * batch code (planBatch.ts) only when the card hands it a batch.
 */

type ToastOptions = { id?: string; description?: unknown; action?: { label: string; onClick: () => void }; cancel?: { label: string; onClick: () => void } };
const toasts = vi.hoisted(() => [] as { title: string; options?: ToastOptions }[]);
/** The notices showing, by id, as sonner keeps them: a notice replaces the one with its id, and dismiss takes it away. */
const showing = vi.hoisted(() => new Map<string, { title: string; options?: ToastOptions }>());
vi.mock("sonner", () => {
  const record = (title: string, options?: ToastOptions) => { toasts.push({ title, options }); if (options?.id) showing.set(options.id, { title, options }); };
  const dismiss = (id?: string) => { if (id === undefined) showing.clear(); else showing.delete(id); };
  const getToasts = () => Array.from(showing.values()).map((item) => ({ ...item.options, id: item.options!.id, title: item.title }));
  return { toast: Object.assign(record, { success: record, error: record, message: record, dismiss, getToasts }), Toaster: () => null };
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
import { loadRegionExtras } from "@/lib/specialization/regionExtras";
import { loadStackStore } from "@/lib/specialization/stackStore";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const PLAN_KEY = "gym-optimizer-workout-plan-v1";
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const weekWith = (days: Record<string, number[]>) => ({ customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(days).map(([key, ids]) => [key, ids.map((id) => ({ entryId: id, catalogExerciseId: id }))])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 });
/** Plan A as Home stores it. */
const planA = weekWith({ "0-Push": [161, 1, 43, 103, 150], "1-Pull": [41, 4, 66, 111, 121], "2-Legs": [173, 2, 54, 186, 132] });
const plan = JSON.stringify({ version: 2, ...planA, weeks: { "1": planA }, activeWeek: 1 });
const storedWeek = () => JSON.parse(window.localStorage.getItem(PLAN_KEY) ?? "{}").weeks?.["1"] ?? {};
const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const windowLine = () => document.querySelector(".spz-window")?.textContent ?? "";

beforeAll(async () => { await loadRegionExtras("forearm"); });
beforeEach(() => {
  toasts.length = 0;
  showing.clear();
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("the stack, from Planned mode through Home and back", () => {
  it("Design a stack → Add → the page's planned direct moving sets are the total → Undo restores the plan exactly", async () => {
    window.history.replaceState({}, "", "/?workspace=specialization&region=forearm&mode=planned");
    render(createElement(Home));
    await screen.findByRole("heading", { name: "Muscles" }, { timeout: 15000 });
    await tick();
    await waitFor(() => expect(windowLine()).toBe("Plan Week 1, as written: 21 sets planned · 3 direct moving sets"), { timeout: 10000 });
    const before = storedWeek();
    expect(before.weeklyPlanEntries["2-Legs"].map((entry: { catalogExerciseId: number }) => entry.catalogExerciseId)).toEqual([173, 2, 54, 186, 132]);

    // The way in from the drawing's strip (jsdom draws no 3D model).
    await act(async () => { fireEvent.click(within(screen.getByRole("group", { name: "Selected muscle" })).getByRole("button", { name: "Design a stack" })); });
    const card = document.querySelector("details.spz-stack") as HTMLDetailsElement;
    expect(card.open).toBe(true);
    const field = await within(card).findByRole("spinbutton", { name: "Direct forearm sets a week" }, { timeout: 10000 }) as HTMLInputElement;
    expect(field.value).toBe("14");
    const add = within(card).getByRole("button", { name: "Add 11 sets (11 exercises, 3 days) to Week\u00a01" });
    await act(async () => { fireEvent.click(add); });
    await tick();

    // Home wrote one batch (once its batch code has arrived): every day once, one notice with Undo.
    const notices = () => toasts.filter((item) => item.options?.id === "plan-add");
    await waitFor(() => expect(notices().map((item) => item.title)).toEqual(["Added 11 sets: 11 exercises on Day 01, Day 02, Day 03 of Week 1"]), { timeout: 10000 });
    await tick();
    expect(notices()[0].options).toMatchObject({ description: "Your own exercises are unchanged.", cancel: { label: "Undo" } });
    const after = storedWeek();
    const count = (week: { weeklyPlanEntries: Record<string, unknown[]> }) => Object.values(week.weeklyPlanEntries).reduce((total, entries) => total + entries.length, 0);
    expect(count(after)).toBe(count(before) + 11);
    // The plan's own exercises keep their places, first in each day, and their (absent) prescriptions.
    for (const key of ["0-Push", "1-Pull", "2-Legs"]) {
      expect(after.weeklyPlanEntries[key].slice(0, 5)).toEqual(before.weeklyPlanEntries[key]);
      for (const entry of before.weeklyPlanEntries[key] as { entryId: number }[]) expect(after.weeklyPrescriptions[key]?.[entry.entryId]).toBeUndefined();
    }
    // The page's planned direct moving count is the total chosen.
    await waitFor(() => expect(windowLine()).toBe("Plan Week 1, as written: 32 sets planned · 14 direct moving sets"), { timeout: 10000 });
    expect(card.querySelector(":scope > summary small")!.textContent).toBe("Your stack: 14 direct moving sets in Week 1");
    expect(loadStackStore(null).stacks.map((stack) => [stack.planWeek, stack.total, stack.entries.length])).toEqual([[1, 14, 11]]);

    // The card's Undo, focused: the plan back exactly, the record gone, and the notice with its Undo gone too.
    const undo = within(card).getByRole("button", { name: "Undo" });
    expect(document.activeElement).toBe(undo);
    expect(showing.get("plan-add")?.title).toBe("Added 11 sets: 11 exercises on Day 01, Day 02, Day 03 of Week 1");
    await act(async () => { fireEvent.click(undo); });
    await tick();
    expect(showing.has("plan-add")).toBe(false);
    expect(card.querySelector(".spz-stack-done")!.textContent).toBe("Undone: Plan Week 1 is as it was.");
    // Exactly as before: every entry, prescription and setting. (Home writes a day it touched with its
    // empty per-day maps, prescriptions {}, settings {}, imported context []: they hold nothing, and are left out.)
    const emptyDropped = (week: Record<string, unknown>) => Object.fromEntries(Object.entries(week).map(([key, value]) => [key, ["weeklyPrescriptions", "weeklySettings", "importedPlanContext"].includes(key)
      ? Object.fromEntries(Object.entries(value as Record<string, object>).filter(([, day]) => Object.keys(day).length))
      : value]));
    expect(emptyDropped(storedWeek())).toEqual(emptyDropped(before));
    expect(loadStackStore(null).stacks).toEqual([]);
    await waitFor(() => expect(windowLine()).toBe("Plan Week 1, as written: 21 sets planned · 3 direct moving sets"), { timeout: 10000 });
  }, 60000);
});
