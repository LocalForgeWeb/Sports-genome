// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * One whole journey through the atlas (Oct 16 forearm brief §11: "coverage gap → relevant
 * exercise → exact day → logged bout → updated map"), through the app as an athlete moves
 * through it: a muscle with no work, its suggested exercise added to one day of the plan,
 * that day trained and logged, and the page and its drawing showing the new work.
 */

const toasts = vi.hoisted(() => [] as { title: string }[]);
vi.mock("sonner", () => {
  const record = (title: string) => { toasts.push({ title }); };
  return { toast: Object.assign(record, { success: record, error: record, message: record, dismiss: () => {} }), Toaster: () => null };
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
import { exercises } from "@/lib/exerciseCatalog";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const PLAN_KEY = "gym-optimizer-workout-plan-v1";
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const entries = (ids: number[]) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
// Bench and squat-type work only: nothing in this plan loads the brachioradialis, and Legs is empty.
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": entries([exercises[0].id, exercises[1].id]), "1-Pull": entries([exercises[2].id]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });

const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const brRow = () => screen.getByRole("button", { name: /^Brachioradialis, Surface\./ });
// The forearm's drawing is its rendered plates (23 Oct): each muscle's chip carries the fill the plate paints it with.
const brFills = () => Array.from(document.querySelectorAll<HTMLElement>('.spz-plate-chip[data-node="forearm.br"], .spz-diagram-belly[data-node="forearm.br"]')).map((element) => element.dataset.fill);
const dock = (name: string) => within(screen.getByRole("navigation", { name: "Primary mobile navigation" })).getByRole("button", { name });

// The add sheet shows the app's starting range once the region's profiles arrive (11-forearm-research-and-stack.md §5.2); loaded first, so Save never waits on them here.
beforeAll(async () => { await loadRegionExtras("forearm"); });
beforeEach(() => {
  toasts.length = 0;
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("A coverage gap, closed in the app", () => {
  it("goes from a muscle with no work to an exercise on one day, a logged set, and a map that shows it", async () => {
    window.history.replaceState({}, "", "/?workspace=specialization&region=forearm&node=forearm.br");
    render(createElement(Home));

    // 1. The gap: brachioradialis has no direct work this week, and its drawing rests.
    const add = await screen.findByRole("button", { name: /Add targeted exercise/ }, { timeout: 15000 });
    expect(brRow().getAttribute("aria-label") ?? brRow().textContent).toBe("Brachioradialis, Surface. No work for it in this window. Open details.");
    expect(brFills().length).toBeGreaterThan(0);
    expect(brFills().every((fill) => fill === "zero")).toBe(true);

    // 2. The relevant exercise, onto the exact day the athlete picks.
    await act(async () => { fireEvent.click(add); });
    const sheet = screen.getByRole("dialog", { name: "Add to your plan" });
    const chosen = within(sheet).getAllByRole("radio").find((radio) => (radio as HTMLInputElement).checked)!;
    const chosenName = chosen.closest("label")!.querySelector("b")!.textContent!;
    const chosenId = exercises.find((exercise) => exercise.name === chosenName)!.id;
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ })); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save to plan" })); });
    await tick();
    expect(toasts.map((item) => item.title)).toContain(`Added ${chosenName} · Week 1 · Day 03 · Legs`);

    // 3. That day, trained: Train → Workout → Change day → Day 03 · Legs → Start.
    await act(async () => { fireEvent.click(dock("Train")); });
    await tick();
    const trainTabs = await screen.findByRole("navigation", { name: "Train workspace pages" }, { timeout: 15000 });
    await act(async () => { fireEvent.click(within(trainTabs).getByRole("button", { name: "Workout" })); });
    await tick();
    const changeDay = await screen.findByText("Change day", {}, { timeout: 15000 });
    await act(async () => { fireEvent.click(changeDay.closest("summary")!); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Day 03 · Legs/ })); });
    await tick();
    const start = await screen.findByRole("button", { name: /start workout/i }, { timeout: 15000 });
    await act(async () => { fireEvent.click(start); });
    await tick();

    // 4. One set logged on the right arm (asked only when the exercise is one-arm), then finished.
    const entry = () => within(document.querySelector(".live-set-entry") as HTMLElement);
    expect(document.querySelector(".live-set-card")!.textContent).toContain(chosenName);
    const weight = entry().queryByLabelText(/weight/i);
    if (weight) await act(async () => { fireEvent.change(weight, { target: { value: "30" } }); });
    await act(async () => { fireEvent.change(entry().getByLabelText(/reps/i), { target: { value: "12" } }); });
    const arm = screen.queryByRole("group", { name: new RegExp(`^Arm for set 1 of ${chosenName}`) });
    if (arm) await act(async () => { fireEvent.click(within(arm).getByRole("button", { name: /Right/ })); });
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: /^Log set 1/i })[0]); });
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: /finish workout/i })[0]); });
    const finishNow = screen.queryByRole("button", { name: "Finish now" });
    if (finishNow) await act(async () => { fireEvent.click(finishNow); });
    await tick();
    const history = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) ?? "[]") as { dayLabel?: string; exercises: { catalogId?: number; sets: { completed: boolean }[] }[] }[];
    expect(history).toHaveLength(1);
    expect(history[0].dayLabel).toMatch(/Day 03 · Legs$/);
    expect(history[0].exercises.find((exercise) => exercise.catalogId === chosenId)?.sets.filter((set) => set.completed)).toHaveLength(1);

    // 5. Back on the page: the row and the drawing both show the one new bout.
    await act(async () => { fireEvent.click(dock("Body Lab")); });
    await tick();
    const bodyTabs = await screen.findByRole("navigation", { name: "Body Lab workspace pages" }, { timeout: 15000 });
    await act(async () => { fireEvent.click(within(bodyTabs).getByRole("button", { name: "Specialize" })); });
    await screen.findByRole("heading", { level: 1, name: "Forearm specialization" }, { timeout: 15000 });
    await tick();
    expect(brRow().getAttribute("aria-label") ?? brRow().textContent).toMatch(/^Brachioradialis, Surface\. 1 direct dynamic bout/);
    expect(brFills().every((fill) => fill === "bin-1")).toBe(true);
  }, 60000);
});
