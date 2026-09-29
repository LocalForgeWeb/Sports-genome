// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The exercise overlay is a history entry of its own, so Back closes it. Every
 * way out of it has to leave history as if the overlay had never been there:
 * "Add to Week" pops the entry the way the close button does, and "Explore in
 * Body Lab" turns the entry into Body Lab's, so one Back returns to where the
 * overlay was opened. Escape pressed in a layer opened over it belongs to that
 * layer, not to the overlay underneath.
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

/** Renders the catalog and opens the overlay on an exercise that has a leading muscle. */
async function openOverlayFromCatalog() {
  window.history.replaceState({}, "", "/?workspace=catalog");
  render(createElement(Home));
  const inspectButtons = await screen.findAllByRole("button", { name: /^Inspect / }, { timeout: 15000 });
  await tick();
  const withMuscle = inspectButtons.find((button) => exercises.find((exercise) => `Inspect ${exercise.name}` === button.getAttribute("aria-label"))?.primaryMuscles.length) ?? inspectButtons[0];
  await act(async () => { fireEvent.click(withMuscle); });
  // The overlay's panels load on first open, so the dialog can arrive a moment later.
  await screen.findByRole("dialog", undefined, { timeout: 15000 });
  expect(window.history.state?.overlay).toBe("exercise");
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("Leaving the exercise overlay leaves nothing behind in history", () => {
  it("Explore in Body Lab closes the overlay, opens Body Lab, and one Back returns to the catalog", async () => {
    await openOverlayFromCatalog();
    const explore = document.querySelector<HTMLButtonElement>(".exercise-intelligence-explore");
    expect(explore).toBeTruthy();
    await act(async () => { fireEvent.click(explore!); });
    await tick();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.search).toBe("?workspace=body");
    expect(window.history.state?.overlay).toBeUndefined();

    await act(async () => { window.history.back(); });
    await tick();
    expect(window.location.search).toBe("?workspace=catalog");
    expect(document.querySelector(".catalog-experience-surface")).toBeTruthy();
  });

  it("Add to Week pops the overlay's entry, so the next Back is not a dead press", async () => {
    await openOverlayFromCatalog();
    const add = document.querySelector<HTMLButtonElement>(".exercise-intelligence-add");
    expect(add).toBeTruthy();
    await act(async () => { fireEvent.click(add!); });
    await tick();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.history.state?.overlay).toBeUndefined();
    expect(window.location.search).toBe("?workspace=catalog");
  });

  it("Escape in search opened over the overlay closes search only; the next Escape closes the overlay", async () => {
    await openOverlayFromCatalog();
    await act(async () => { fireEvent.keyDown(window, { key: "k", ctrlKey: true }); });
    const search = screen.getByRole("dialog", { name: "Search Sports Genome" });
    const input = within(search).getByRole("combobox");
    await act(async () => { fireEvent.keyDown(input, { key: "Escape" }); });
    await tick();

    expect(screen.queryByRole("dialog", { name: "Search Sports Genome" })).toBeNull();
    expect(document.querySelector(".exercise-intelligence")).toBeTruthy();
    expect(window.history.state?.overlay).toBe("exercise");

    const close = document.querySelector<HTMLButtonElement>(".exercise-intelligence-close")!;
    await act(async () => { fireEvent.keyDown(close, { key: "Escape" }); });
    await tick();
    expect(document.querySelector(".exercise-intelligence")).toBeNull();
    expect(window.history.state?.overlay).toBeUndefined();
    expect(window.location.search).toBe("?workspace=catalog");
  });
});
