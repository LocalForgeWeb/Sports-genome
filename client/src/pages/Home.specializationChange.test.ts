// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Home's side of an add or swap from the specialization page (brief §7): it writes the exact
 * slot asked for, pins no default prescription, names every option of its toast (sonner merges
 * a notice into the one showing with the same id), and Undo takes back that one change.
 */

type ToastOptions = { description?: unknown; action?: unknown; cancel?: { label: string; onClick: () => void } };
const toasts = vi.hoisted(() => [] as { title: string; options?: ToastOptions }[]);
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
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const entries = (ids: number[]) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": entries([exercises[0].id, exercises[1].id]), "1-Pull": entries([exercises[2].id, exercises[3].id]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 2 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });

const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const stored = () => JSON.parse(window.localStorage.getItem(PLAN_KEY) ?? "{}").weeks?.["1"] ?? {};
const dayIds = (key: string) => ((stored().weeklyPlanEntries?.[key] ?? []) as { catalogExerciseId: number }[]).map((entry) => entry.catalogExerciseId);
const dayPrescriptions = (key: string) => (stored().weeklyPrescriptions?.[key] ?? {}) as Record<string, string>;

beforeEach(() => {
  toasts.length = 0;
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

/** Opens the add-or-swap sheet from the brachioradialis, chooses a day, and returns the sheet and the exercise it adds. */
async function openSheetOn(day: RegExp) {
  window.history.replaceState({}, "", "/?workspace=specialization&region=forearm&node=forearm.br");
  render(createElement(Home));
  const inspect = await screen.findByRole("button", { name: /Inspect coverage|Add targeted exercise/ }, { timeout: 15000 });
  await act(async () => { fireEvent.click(inspect); });
  await act(async () => { fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: /Add or swap/ })[0]); });
  const sheet = screen.getByRole("dialog", { name: "Add to your plan" });
  const chosen = within(sheet).getAllByRole("radio").find((radio) => (radio as HTMLInputElement).checked)!;
  const name = chosen.closest("label")!.querySelector("b")!.textContent!;
  await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: day })); });
  return { sheet, name, id: exercises.find((exercise) => exercise.name === name)!.id };
}

describe("an add or swap from the specialization page, as Home writes it", () => {
  it("adds into the slot chosen, pins no prescription, names every toast option, and Undo takes back that one add", async () => {
    const { sheet, name, id } = await openSheetOn(/Day 02 · Pull/);
    await act(async () => { fireEvent.click(within(within(sheet).getByRole("group", { name: "Where it goes" })).getByRole("radio", { name: /^First/ })); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save to plan" })); });
    await tick();
    expect(dayIds("1-Pull")).toEqual([id, exercises[2].id, exercises[3].id]);
    // Its sets are the goal's default for the first place, as every plan reader reads an entry without its own.
    expect(dayPrescriptions("1-Pull")).not.toHaveProperty(String(id));
    const notice = toasts.find((item) => item.title === `Added ${name} · Week 1 · Pull`)!;
    expect(notice.options).toMatchObject({ id: "plan-add", description: "Now 1 of 3 in that day.", cancel: { label: "Undo" } });
    // Named, so an earlier add's "View workout" cannot carry over into this notice.
    expect(Object.prototype.hasOwnProperty.call(notice.options, "action")).toBe(true);
    expect(notice.options!.action).toBeUndefined();
    await act(async () => { notice.options!.cancel!.onClick(); });
    await tick();
    expect(dayIds("1-Pull")).toEqual([exercises[2].id, exercises[3].id]);
    expect(dayIds("0-Push")).toEqual([exercises[0].id, exercises[1].id]);
  }, 30000);

  it("swaps an exercise with no prescription of its own without giving the incoming one any, and Undo puts it back in its place", async () => {
    const { sheet, name, id } = await openSheetOn(/Day 01 · Push/);
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Swap one out" })); });
    await act(async () => { fireEvent.click(within(within(sheet).getByRole("group", { name: "Swap out" })).getAllByRole("radio")[0]); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save swap" })); });
    await tick();
    expect(dayIds("0-Push")).toEqual([id, exercises[1].id]);
    expect(dayPrescriptions("0-Push")).toEqual({});
    const notice = toasts.find((item) => item.title === `Swapped ${exercises[0].name} for ${name} · Week 1 · Push`)!;
    expect(notice.options).toMatchObject({ id: "plan-add", description: "Sets you already logged keep the exercise they were logged as.", action: undefined });
    await act(async () => { notice.options!.cancel!.onClick(); });
    await tick();
    expect(dayIds("0-Push")).toEqual([exercises[0].id, exercises[1].id]);
  }, 30000);
});
