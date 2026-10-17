// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The specialization page as a Body Lab page (Oct 16 forearm brief §6, design §7): its tab,
 * its address (validated field by field, and on no other page), and the ways in from the
 * muscle map and from Review, each with a Back to where it was pressed.
 */

const toasts = vi.hoisted(() => [] as { title: string; options?: { cancel?: { onClick: () => void } } }[]);
vi.mock("sonner", () => {
  const record = (title: string, options?: { cancel?: { onClick: () => void } }) => { toasts.push({ title, options }); };
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
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": entries([exercises[0].id, exercises[1].id]), "1-Pull": entries([exercises[2].id]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 1 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });

const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });

beforeEach(() => {
  toasts.length = 0;
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("The specialization page", () => {
  it("is a Body Lab tab, and its address names the region", async () => {
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    const tabs = await screen.findByRole("navigation", { name: "Body Lab workspace pages" }, { timeout: 15000 });
    await act(async () => { fireEvent.click(within(tabs).getByRole("button", { name: "Specialize" })); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=forearm");
    expect(await screen.findByRole("heading", { level: 1, name: "Forearm specialization" })).not.toBeNull();
  });

  it("keeps what a reload needs and drops what it cannot read", async () => {
    window.history.replaceState({}, "", "/?workspace=specialization&region=forearm&node=forearm.br&limb=left&layer=bogus&window=custom&from=2026-10-01");
    render(createElement(Home));
    await screen.findByRole("heading", { level: 1, name: "Forearm specialization" }, { timeout: 15000 });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=forearm&node=forearm.br&limb=left");
  });

  it("carries none of its parameters onto another page", async () => {
    window.history.replaceState({}, "", "/?workspace=body&region=forearm&node=forearm.br&limb=left");
    render(createElement(Home));
    await screen.findByRole("navigation", { name: "Body Lab workspace pages" }, { timeout: 15000 });
    await tick();
    expect(window.location.search).toBe("?workspace=body");
  });

  it("comes back with its muscle and arm on Back", async () => {
    window.history.replaceState({}, "", "/?workspace=specialization&region=forearm&node=forearm.fds&limb=left");
    render(createElement(Home));
    const tabs = await screen.findByRole("navigation", { name: "Body Lab workspace pages" }, { timeout: 15000 });
    await act(async () => { fireEvent.click(within(tabs).getByRole("button", { name: "Muscles" })); });
    await tick();
    expect(window.location.search).toBe("?workspace=body");
    await act(async () => { window.history.back(); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=forearm&node=forearm.fds&limb=left");
  });
  it("writes an add from the page into the exact day it names, and Undo takes back that one change", async () => {
    window.history.replaceState({}, "", "/?workspace=specialization&region=forearm&node=forearm.br");
    render(createElement(Home));
    // Nothing in this plan loads brachioradialis, so the page offers to add work, and that starts an add.
    const add = await screen.findByRole("button", { name: /Add targeted exercise/ }, { timeout: 15000 });
    await act(async () => { fireEvent.click(add); });
    const sheet = screen.getByRole("dialog", { name: "Add to your plan" });
    const chosen = within(sheet).getAllByRole("radio").find((radio) => (radio as HTMLInputElement).checked)!;
    const chosenName = chosen.closest("label")!.querySelector("b")!.textContent!;
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ })); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save to plan" })); });
    await tick();
    expect(screen.queryByRole("dialog")).toBeNull();
    // The page stays where it was; the toast names the change and the day, with Undo.
    expect(window.location.search).toBe("?workspace=specialization&region=forearm&node=forearm.br");
    const notice = toasts.find((item) => item.title.startsWith(`Added ${chosenName}`));
    expect(notice?.title).toBe(`Added ${chosenName} · Week 1 · Day 03 · Legs`);
    const chosenId = exercises.find((exercise) => exercise.name === chosenName)!.id;
    const legsIds = () => {
      const stored = JSON.parse(window.localStorage.getItem(PLAN_KEY) ?? "{}");
      return ((stored.weeks?.["1"]?.weeklyPlanEntries?.["2-Legs"] ?? []) as { catalogExerciseId: number }[]).map((entry) => entry.catalogExerciseId);
    };
    const pushIds = () => {
      const stored = JSON.parse(window.localStorage.getItem(PLAN_KEY) ?? "{}");
      return ((stored.weeks?.["1"]?.weeklyPlanEntries?.["0-Push"] ?? []) as { catalogExerciseId: number }[]).map((entry) => entry.catalogExerciseId);
    };
    // Week 1, Day 03 · Legs has it; the other days are as they were.
    expect(legsIds()).toContain(chosenId);
    expect(pushIds()).toEqual([exercises[0].id, exercises[1].id]);
    await act(async () => { notice!.options!.cancel!.onClick(); });
    await tick();
    expect(legsIds()).not.toContain(chosenId);
    expect(pushIds()).toEqual([exercises[0].id, exercises[1].id]);
  });
  it("opens from Review's muscle detail on the week Review reads, as planned, with a Back to Review", async () => {
    const forearmWeek = { ...week, weeklyPlanEntries: { "0-Push": entries([139, 140]), "1-Pull": entries([exercises[2].id]) } };
    window.localStorage.setItem(PLAN_KEY, JSON.stringify({ version: 2, ...forearmWeek, weeks: { "1": forearmWeek }, activeWeek: 1 }));
    window.history.replaceState({}, "", "/?workspace=review");
    render(createElement(Home));
    const forearms = await screen.findByRole("button", { name: /^Forearms/ }, { timeout: 15000 });
    await act(async () => { fireEvent.click(forearms); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Explore forearm coverage/ })); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=forearm&mode=planned&pweek=1");
    expect(screen.getByRole("button", { name: "Planned" }).getAttribute("aria-pressed")).toBe("true");
    // A reload of that entry (or iOS bringing the app back) keeps the Back.
    cleanup();
    render(createElement(Home));
    const back = await screen.findByRole("button", { name: /Back to Review your week/ }, { timeout: 15000 });
    await act(async () => { fireEvent.click(back); });
    await tick();
    expect(window.location.search).toBe("?workspace=review");
  });
  const startRowWorkout = async () => {
    const rowWeek = { ...week, weeklyPlanEntries: { "0-Push": entries([45]), "1-Pull": entries([exercises[2].id]) }, activeDayIndex: 0 };
    window.localStorage.setItem(PLAN_KEY, JSON.stringify({ version: 2, ...rowWeek, weeks: { "1": rowWeek }, activeWeek: 1 }));
    window.history.replaceState({}, "", "/?workspace=tracker");
    render(createElement(Home));
    // Found outside act: React holds a lazily loaded chunk's commit until act's callback ends.
    const start = await screen.findByRole("button", { name: /start workout/i }, { timeout: 15000 });
    await act(async () => { fireEvent.click(start); });
    await tick();
  };

  it("keeps the straps question out of the workout without a specialization target", async () => {
    await startRowWorkout();
    expect(screen.getAllByRole("button", { name: /^Log set/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("group", { name: /^Straps on / })).toBeNull();
  }, 30000);

  it("asks about straps on a grip-credited lift once the athlete has a specialization target", async () => {
    window.localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify([{ id: "g:right", regionId: "forearm", nodeId: "forearm.fds", actionId: null, side: "right", metric: "deliberate_hold_bouts", target: 6, period: "calendar_week", startsOn: "2026-01-01", endsOn: null, timezone: "UTC", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]));
    await startRowWorkout();
    expect(screen.getByRole("group", { name: "Straps on Underhand Barbell Row" })).not.toBeNull();
  }, 30000);
  it("survives an impossible custom date in a hand-edited address, and drops it", async () => {
    window.history.replaceState({}, "", "/?workspace=specialization&region=forearm&window=custom&from=2026-02-30&to=2026-03-02");
    render(createElement(Home));
    expect(await screen.findByRole("heading", { level: 1, name: "Forearm specialization" }, { timeout: 15000 })).not.toBeNull();
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=forearm");
  });
});
