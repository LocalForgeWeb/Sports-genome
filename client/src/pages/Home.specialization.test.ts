// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The specialization page as a Body Lab page (Oct 16 forearm brief §6, design §7): its tab,
 * its address (validated field by field, and on no other page), and the ways in from the
 * muscle map and from Review, each with a Back to where it was pressed.
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
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const entries = (ids: number[]) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": entries([exercises[0].id, exercises[1].id]), "1-Pull": entries([exercises[2].id]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 1 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });

const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });

beforeEach(() => {
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
});
