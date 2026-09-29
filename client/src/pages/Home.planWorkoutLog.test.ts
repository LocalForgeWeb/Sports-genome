// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * With a workout running, every Plan row shows how far the session is through
 * that exercise. Each row used to re-read and re-parse the whole workout log on
 * every render of Home, so a day of eight exercises parsed the log eight times
 * for a keystroke that had nothing to do with it. The log is now read once per
 * write to it and shared by the rows; the rows still follow the session as sets
 * are logged.
 *
 * That read used to be keyed on the live summary, which keeps its identity
 * through a write that changes nothing it shows, such as a weight typed into a
 * set. The rows' copy of the log then stayed as it was before the write.
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

// The rows hand the log they were given to exerciseProgressFor; recording it shows which log they read.
vi.mock("@/lib/liveSession", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/liveSession")>();
  return { ...actual, exerciseProgressFor: vi.fn(actual.exerciseProgressFor) };
});

import Home from "@/pages/Home";
import { exerciseProgressFor } from "@/lib/liveSession";
import { deviceWorkoutHistoryKey, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const PLAN_KEY = "gym-optimizer-workout-plan-v1";
const dayExercises = exercises.slice(0, 4);

const planWith = (ids: number[]) => {
  const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": ids.map((id) => ({ entryId: id, catalogExerciseId: id })) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
  return JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });
};
/** One start time for every save, so a save changes only what the test changes. */
const startedAt = new Date().toISOString();
/** A session under way on the first exercise, with `done` of its three sets logged and `weight` in every set. */
const sessionWith = (done: number, weight = "20"): DeviceWorkoutSession => ({
  id: "live-1",
  title: "Day 01 workout",
  dayLabel: "Week 1 · Day 01 · Push",
  startedAt,
  status: "active",
  exercises: dayExercises.map((exercise, index) => ({
    id: `${exercise.id}-${index}`,
    exerciseName: exercise.name,
    plannedPrescription: "3 × 8",
    sets: [0, 1, 2].map((set) => ({ weight, reps: "8", completed: index === 0 && set < done })),
  })),
} as DeviceWorkoutSession);

const firstRowProgress = () => document.querySelector(".day-plan-list .custom-row-live")?.textContent ?? "";
const logReads = (getItem: { mock: { calls: unknown[][] } }) => getItem.mock.calls.filter(([key]) => key === deviceWorkoutHistoryKey).length;

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } }));
  window.localStorage.setItem(PLAN_KEY, planWith(dayExercises.map((exercise) => exercise.id)));
  window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([sessionWith(1)]));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Plan rows during a workout", () => {
  it("read the workout log once per write to it, not once per row, and still follow each logged set", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await waitFor(() => { if (firstRowProgress() !== "Now · 1/3") throw new Error(`row reads "${firstRowProgress()}"`); }, { timeout: 15000 });
    expect(document.querySelectorAll(".day-plan-list .custom-prescription")).toHaveLength(dayExercises.length);

    // A change that has nothing to do with the session re-renders every row.
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const rest = document.querySelector<HTMLSelectElement>(`select[aria-label="${dayExercises[1].name} rest"]`)!;
    const otherRest = Array.from(rest.options).map((option) => option.value).find((value) => value !== rest.value)!;
    await act(async () => { fireEvent.change(rest, { target: { value: otherRest } }); });
    expect(rest.value).toBe(otherRest);
    expect(logReads(getItem)).toBe(0);

    // Logging a set is a change to the session, and the row follows it.
    await act(async () => { saveDeviceWorkoutSessions([sessionWith(2)]); });
    expect(firstRowProgress()).toBe("Now · 2/3");
  }, 30000);

  it("read the log again after a write that leaves the live summary as it was", async () => {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    await waitFor(() => { if (firstRowProgress() !== "Now · 1/3") throw new Error(`row reads "${firstRowProgress()}"`); }, { timeout: 15000 });
    const weightTheRowsRead = () => vi.mocked(exerciseProgressFor).mock.calls.at(-1)?.[1]?.[0]?.exercises[0]?.sets[1]?.weight;
    expect(weightTheRowsRead()).toBe("20");

    // A weight typed into sets not yet logged: the same sets done, the same position.
    await act(async () => { saveDeviceWorkoutSessions([sessionWith(1, "25")]); });

    expect(firstRowProgress()).toBe("Now · 1/3");
    expect(weightTheRowsRead()).toBe("25");
  }, 30000);
});
