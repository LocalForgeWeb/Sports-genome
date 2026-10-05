// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

/** The catalog row to open: exercises[0], which the open day holds, or another with a leading muscle. */
function inspectDay(buttons: HTMLElement[], inDay: boolean) {
  const exerciseFor = (button: HTMLElement) => exercises.find((item) => `Inspect ${item.name}` === button.getAttribute("aria-label"));
  if (inDay) return buttons.find((button) => exerciseFor(button)?.id === exercises[0].id) ?? buttons[0];
  return buttons.find((button) => { const exercise = exerciseFor(button); return exercise && exercise.id !== exercises[0].id && exercise.primaryMuscles.length; }) ?? buttons[0];
}

/** Renders the catalog and opens the overlay on an exercise that has a leading muscle. */
async function openOverlayFromCatalog({ inDay = false }: { inDay?: boolean } = {}) {
  window.history.replaceState({}, "", "/?workspace=catalog");
  render(createElement(Home));
  const inspectButtons = await screen.findAllByRole("button", { name: /^Inspect / }, { timeout: 15000 });
  await tick();
  // One with a leading muscle that the open day does not already hold (the plan below has
  // exercises[0]) - or, asked for, the one it does.
  const withMuscle = inspectDay(inspectButtons, inDay);
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
    // The anatomy, and its way into Body Lab, are the Muscle Genome view (October 4).
    await act(async () => { fireEvent.click(screen.getByRole("tab", { name: "Muscle Genome" })); });
    const explore = await waitFor(() => { const node = document.querySelector<HTMLButtonElement>(".exercise-intelligence-explore"); if (!node) throw new Error("Muscle view not ready"); return node; }, { timeout: 15000 });
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

/**
 * October 4 (Exercise Intelligence brief §7-8): the sheet is modal in fact, not only in
 * name, it names the day an add goes to, and an exercise the day already holds cannot be
 * added again by a second tap.
 */
describe("The exercise sheet's header, footer and modality", () => {
  it("names the exercise in the fixed header on every view", async () => {
    await openOverlayFromCatalog();
    const title = document.getElementById("exercise-intelligence-title")!;
    const name = title.textContent;
    expect(name).toBeTruthy();
    for (const view of ["Muscle Genome", "Mechanics", "Context", "Fingerprint"]) {
      await act(async () => { fireEvent.click(screen.getByRole("tab", { name: view })); });
      expect(screen.getByRole("tab", { name: view, selected: true })).toBeTruthy();
      expect(document.getElementById("exercise-intelligence-title")?.textContent).toBe(name);
      expect(screen.getByRole("dialog", { name: name! })).toBeTruthy();
    }
  });

  it("names the destination, and changes it without adding anything", async () => {
    await openOverlayFromCatalog();
    const footer = document.querySelector(".exercise-intelligence-actions")!;
    expect(footer.querySelector(".exercise-intelligence-destination")?.textContent).toContain("Adding to Week 1 · Push");
    await act(async () => { fireEvent.click(within(footer as HTMLElement).getByRole("button", { name: "Change day" })); });
    const days = within(footer as HTMLElement).getByRole("group", { name: "Day in Week 1 to add to" });
    const other = within(days).getAllByRole("button").find((button) => button.getAttribute("aria-pressed") === "false")!;
    const otherDay = other.textContent!.split(" · ")[1].replace(/(\d+ planned|Empty)$/, "");
    await act(async () => { fireEvent.click(other); });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(footer.querySelector(".exercise-intelligence-destination")?.textContent).toContain(`Week 1 · ${otherDay}`);
    expect(window.history.state?.overlay).toBe("exercise");
  });

  it("does not offer to add an exercise the open day already holds", async () => {
    await openOverlayFromCatalog({ inDay: true });
    const add = document.querySelector<HTMLButtonElement>(".exercise-intelligence-add")!;
    expect(add.getAttribute("aria-disabled")).toBe("true");
    expect(add.textContent).toContain("Already added");
    expect(document.querySelector(".exercise-intelligence-destination")?.textContent).toContain("Already in Week 1 · Push");
    await act(async () => { fireEvent.click(add); });
    await tick();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("makes the page behind it inert while open, and gives it back on close", async () => {
    await openOverlayFromCatalog();
    const layer = document.querySelector(".exercise-intelligence")!;
    const behind = document.querySelector(".catalog-experience-surface")!;
    expect(behind.closest("[inert]")).toBeTruthy();
    expect(layer.closest("[inert]")).toBeNull();
    await act(async () => { fireEvent.click(document.querySelector(".exercise-intelligence-close")!); });
    await tick();
    expect(document.querySelector("[inert]")).toBeNull();
  });
});
