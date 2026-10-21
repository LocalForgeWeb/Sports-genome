// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { holdToLiftMs } from "@/lib/useHoldToArrange";

/**
 * "When in the training day make it so things can be re-ordered by holding the exercise as
 * opposed to the reorder button; it should function like moving apps around on the Apple home
 * screen" (owner, 21 Oct 2026). The Plan's day says how, above its rows; holding a row and
 * dragging it moves it, saves the new order, and says so once with Undo. The Reorder button is
 * gone. The arrows remain for a keyboard or a screen reader.
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
const [a, b, c] = exercises;
const dayWith = (ids: number[]) => ({ customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": ids.map((id) => ({ entryId: id, catalogExerciseId: id })) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 });
const planWith = (ids: number[]) => JSON.stringify({ version: 2, ...dayWith(ids), weeks: { "1": dayWith(ids) }, activeWeek: 1 });
const savedOrder = () => JSON.parse(window.localStorage.getItem(PLAN_KEY) || "{}").weeks["1"].weeklyPlanEntries["0-Push"].map((entry: { catalogExerciseId: number }) => entry.catalogExerciseId);
const rows = () => [...document.querySelectorAll<HTMLElement>(".day-plan-list > .day-orderable-exercise")];
const names = () => rows().map((row) => row.querySelector(".custom-row-identity strong")!.firstChild!.textContent!.trim());
const pause = (ms: number) => act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)); });
const rowTop = 300;
const rowHeight = 120;

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  toasts.length = 0;
  // Each row's box follows its place in the list, as layout would.
  const real = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (!this.classList.contains("day-orderable-exercise")) return real.call(this);
    const index = [...this.parentElement!.children].indexOf(this);
    const top = rowTop + index * rowHeight;
    return { top, bottom: top + rowHeight, height: rowHeight, left: 0, right: 360, width: 360, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("moving exercises on the training day", () => {
  it("says how above the rows, and has no Reorder button", async () => {
    window.localStorage.setItem(PLAN_KEY, planWith([a.id, b.id, c.id]));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await screen.findByRole("group", { name: "Training week" }, { timeout: 15000 });
    const hint = await screen.findByText("Hold an exercise to move it.");
    expect(hint.compareDocumentPosition(document.querySelector(".day-plan-list")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reorder/i })).toBeNull();
  });

  it("moves a held exercise to where it is dropped, saves the order, and offers Undo", async () => {
    window.localStorage.setItem(PLAN_KEY, planWith([a.id, b.id, c.id]));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await screen.findByText("Hold an exercise to move it.", undefined, { timeout: 15000 });
    expect(names()).toEqual([a.name, b.name, c.name]);

    const startY = rowTop + rowHeight / 2;
    fireEvent.pointerDown(rows()[0].querySelector("summary")!, { pointerId: 7, clientX: 120, clientY: startY, button: 0, pointerType: "touch" });
    await pause(holdToLiftMs + 60);
    expect(document.querySelector(".day-plan-list")!.classList.contains("is-arranging")).toBe(true);
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
    for (const y of [startY + 80, startY + 160, startY + 250]) act(() => { window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 7, clientX: 120, clientY: y })); });
    act(() => { window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 7, clientX: 120, clientY: startY + 250 })); });
    await pause(300);

    expect(names()).toEqual([b.name, c.name, a.name]);
    expect(savedOrder()).toEqual([b.id, c.id, a.id]);
    const message = toasts.at(-1)!;
    expect(message.title).toBe(`Moved ${a.name}`);
    expect((message.options as { description?: string }).description).toBe("Now 3 of 3 in Push.");
    const undo = (message.options as unknown as { cancel: { label: string; onClick: () => void } }).cancel;
    expect(undo.label).toBe("Undo");
    await act(async () => { undo.onClick(); });
    await pause(50);
    expect(names()).toEqual([a.name, b.name, c.name]);
    expect(savedOrder()).toEqual([a.id, b.id, c.id]);

    // Done ends arranging and the hint comes back.
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Done" })); });
    expect(document.querySelector(".day-plan-list")!.classList.contains("is-arranging")).toBe(false);
    expect(screen.getByText("Hold an exercise to move it.")).toBeTruthy();
  });

  it("keeps the arrows for a keyboard or a screen reader", async () => {
    window.localStorage.setItem(PLAN_KEY, planWith([a.id, b.id]));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await screen.findByText("Hold an exercise to move it.", undefined, { timeout: 15000 });
    const list = within(document.querySelector<HTMLElement>(".day-plan-list")!);
    await act(async () => { fireEvent.click(list.getByRole("button", { name: `Move ${a.name} later` })); });
    await pause(50);
    expect(names()).toEqual([b.name, a.name]);
  });

  it("does not offer moving on a day with a single exercise", async () => {
    window.localStorage.setItem(PLAN_KEY, planWith([a.id]));
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await screen.findByRole("group", { name: "Training week" }, { timeout: 15000 });
    await pause(50);
    expect(screen.queryByText("Hold an exercise to move it.")).toBeNull();
  });
});
