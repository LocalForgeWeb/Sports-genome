// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * One reading of a hold's prescription (07-logger.md): the Plan editor, print and the workout
 * show an exercise measured in seconds the way Train and the planned atlas read it. An unset hold
 * is the goal's set count with a hold's target ("4 × 30 sec" where the goal says "4 × 3–6"); a
 * goal default the planner pinned on a hold is read the same way; a rep exercise is unchanged.
 */

const toasts: { title: string }[] = [];
vi.mock("sonner", () => {
  const record = (title: string) => { toasts.push({ title }); };
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

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const PLAN_KEY = "gym-optimizer-workout-plan-v1";
// Dead Hang (143, seconds) unset in first place; Hammer Curl (132, reps) unset; Farmer's Walk
// (299, seconds) carrying the "3 × 6–10" the planner pins on a built day's third entry.
const DEAD_HANG = 143;
const HAMMER_CURL = 132;
const FARMERS_WALK = 299;
const entries = [DEAD_HANG, HAMMER_CURL, FARMERS_WALK].map((id) => ({ entryId: id, catalogExerciseId: id }));
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": entries }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: { "0-Push": { [FARMERS_WALK]: "3 × 6–10" } }, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const expected = ["4 × 30 sec", "4 × 3–6", "3 × 30 sec"];
const text = (node: Element | null) => (node?.textContent ?? "").replace(/ /g, " ");

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => cleanup());

describe("a hold's prescription on the Plan", () => {
  it("shows the hold's default in the Plan editor and on the printed day, as Train reads it", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await screen.findByRole("group", { name: "Training week" }, { timeout: 15000 });
    const rows = Array.from(document.querySelectorAll(".day-plan-list .custom-row-identity"));
    expect(rows.map((row) => text(row.querySelector("strong")))).toEqual(["Dead Hang", "Hammer Curl", "Farmer’s Walk"]);
    expect(rows.map((row) => text(row.querySelector("em")).split(" · ")[0])).toEqual(expected);
    // The editor's stepper counts the same sets.
    expect(Array.from(document.querySelectorAll(".day-plan-list .set-stepper output")).map((node) => node.textContent)).toEqual(["4", "4", "3"]);
    const printed = Array.from(document.querySelectorAll(".printable-workout-sheet tbody tr")).map((row) => text(row.querySelectorAll("td")[2]));
    expect(printed).toEqual(expected);
  }, 20000);

  it("starts the workout from the same prescriptions", async () => {
    window.history.replaceState({}, "", "/?workspace=tracker");
    render(createElement(Home));
    await screen.findByRole("button", { name: /start workout/i }, { timeout: 15000 });
    expect(Array.from(document.querySelectorAll(".session-prestart-name small")).map((node) => text(node))).toEqual(expected);
  }, 20000);

  it("leaves the stored text alone: the planner keeps pinning the goal's own default", () => {
    // A rep exercise put in a hold's place then reads the goal's reps again, not "30 sec".
    const home = readFileSync(`${process.cwd()}/client/src/pages/Home.tsx`, "utf8");
    expect(home.match(/\[exercise\.id, getGoalPrescription\(goal, index\)\]/g)).toHaveLength(2);
    // Every reader that shows a plan entry's prescription goes through the one reading.
    expect(home).not.toMatch(/\|\| prescriptionFor\(/);
    expect(home.match(/prescriptionFor\(exercise, index, goal, /g)).toHaveLength(4);
  });
});
