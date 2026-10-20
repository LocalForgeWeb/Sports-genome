// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Home with more than one region (docs/specialization-atlas/10-multi-region.md §6.1, §6.2): the
 * tab opens the region this account last opened on this device, else the forearm with the region
 * grid open, once; an address without a region is rewritten to the remembered one; search opens a
 * region's page with no Back; the page's title is the region's heading, in the tab and in search's
 * way back. The test regions reach Home through the light index and the loader, mocked to hand
 * them out as production regions (never registered).
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
vi.mock("@shared/specialization/regionIndex", async (importOriginal) => {
  const { indexWith } = await import("@/components/specialization/__fixtures__/pageRegions");
  return indexWith(await importOriginal(), ["fx_thigh", "fx_core"]);
});
vi.mock("@/lib/specialization/loadRegion", async (importOriginal) => {
  const { loaderWith } = await import("@/components/specialization/__fixtures__/pageRegions");
  return loaderWith(await importOriginal(), ["fx_thigh", "fx_core"]);
});
// Search itself is covered by its own tests (universalSearch.specialization.test.ts); here it hands Home a result.
vi.mock("@/components/UniversalSearch", async () => {
  const { createElement: h } = await import("react");
  const { exercises: catalog } = await import("@/lib/exerciseCatalog");
  const result = (id: string, label: string) => ({ type: "destination", id, label, context: "Body Lab · Specialize", matchKind: "exact", score: 1 });
  return {
    UniversalSearch: ({ onOpenResult }: { onOpenResult: (value: unknown) => void }) => h("div", null,
      h("button", { type: "button", onClick: () => onOpenResult(result("specialization#fx_thigh", "Fixture thighs specialization")) }, "Search: the thighs' page"),
      h("button", { type: "button", onClick: () => onOpenResult(result("specialization", "Specialize")) }, "Search: Specialize"),
      h("button", { type: "button", onClick: () => onOpenResult({ type: "exercise", id: String(catalog[0].id), label: catalog[0].name, context: "", matchKind: "exact", score: 1 }) }, "Search: an exercise"),
    ),
  };
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
const REGION_KEY = "sports-genome-specialization-region-v1";
const profile = JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } });
const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": [{ entryId: exercises[0].id, catalogExerciseId: exercises[0].id }] }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { "1": week }, activeWeek: 1 });

const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
/** The page's heading toggle, once the lazy page has loaded. */
const regionToggle = async () => {
  const heading = await screen.findByRole("heading", { level: 1, name: /Forearms|Fixture/ }, { timeout: 15000 });
  return within(heading).getByRole("button");
};
const openTab = async (name: string) => {
  const tabs = await screen.findByRole("navigation", { name: "Body Lab workspace pages" }, { timeout: 15000 });
  await act(async () => { fireEvent.click(within(tabs).getByRole("button", { name })); });
  await tick();
};

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

describe("the specialization page with more than one region", () => {
  it("opens from the tab on the forearm with the region grid open, once, when nothing is remembered", async () => {
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    await openTab("Specialize");
    expect(window.location.search).toBe("?workspace=specialization&region=forearm");
    const toggle = await regionToggle();
    expect(toggle.textContent).toBe("Forearms");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // Back to Muscles and to the page again: the region was chosen, so the grid stays closed.
    await openTab("Muscles");
    await openTab("Specialize");
    expect((await regionToggle()).getAttribute("aria-expanded")).toBe("false");
    // The tab is not "opened from" anywhere, so there is no Back.
    expect(screen.queryByRole("button", { name: /^Back to / })).toBeNull();
  }, 30000);

  it("opens the grid once: after a pick, or after closing it, the browser's Back and Forward return with it closed", async () => {
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    await openTab("Specialize");
    const toggle = await regionToggle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await act(async () => { fireEvent.click(within(document.getElementById("spz-regions")!).getByRole("button", { name: /Fixture thighs/ })); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=fx_thigh");
    expect((await regionToggle()).getAttribute("aria-expanded")).toBe("false");
    await openTab("Muscles");
    await act(async () => { window.history.back(); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=fx_thigh");
    expect((await regionToggle()).getAttribute("aria-expanded")).toBe("false");
    // Forward to Muscles and Back again: still closed.
    await act(async () => { window.history.forward(); });
    await tick();
    await act(async () => { window.history.back(); });
    await tick();
    expect((await regionToggle()).getAttribute("aria-expanded")).toBe("false");
  }, 30000);

  it("keeps the grid closed after Escape, when the page is left and the browser's Back returns to it", async () => {
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    await openTab("Specialize");
    const toggle = await regionToggle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await act(async () => { fireEvent.keyDown(toggle, { key: "Escape" }); });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await openTab("Muscles");
    await act(async () => { window.history.back(); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=forearm");
    expect((await regionToggle()).getAttribute("aria-expanded")).toBe("false");
  }, 30000);

  it("opens from the tab on the region this account last opened on this device, and remembers the next one", async () => {
    window.localStorage.setItem(REGION_KEY, "fx_thigh");
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    await openTab("Specialize");
    expect(window.location.search).toBe("?workspace=specialization&region=fx_thigh");
    const toggle = await regionToggle();
    expect(toggle.textContent).toBe("Fixture thighs");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.title).toBe("Fixture thighs specialization · Sports Genome");
    await act(async () => { fireEvent.click(toggle); });
    await act(async () => { fireEvent.click(within(document.getElementById("spz-regions")!).getByRole("button", { name: /Fixture core/ })); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=fx_core");
    expect(window.localStorage.getItem(REGION_KEY)).toBe("fx_core");
    expect(document.title).toBe("Fixture core specialization · Sports Genome");
  }, 30000);

  it("rewrites an address with no region to the region remembered, and keeps a named one", async () => {
    window.localStorage.setItem(REGION_KEY, "fx_core");
    window.history.replaceState({}, "", "/?workspace=specialization");
    render(createElement(Home));
    expect((await regionToggle()).textContent).toBe("Fixture core");
    await waitFor(() => expect(window.location.search).toBe("?workspace=specialization&region=fx_core"));
    cleanup();
    window.history.replaceState({}, "", "/?workspace=specialization&region=fx_thigh");
    render(createElement(Home));
    const toggle = await regionToggle();
    expect([toggle.textContent, toggle.getAttribute("aria-expanded")]).toEqual(["Fixture thighs", "false"]);
  }, 30000);

  it("opens a region's page from search with no Back, and search's way back names the page by its heading", async () => {
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Search: the thighs' page" })); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=fx_thigh");
    const toggle = await regionToggle();
    expect([toggle.textContent, toggle.getAttribute("aria-expanded")]).toEqual(["Fixture thighs", "false"]);
    expect(within(document.querySelector(".spz-head")!).queryByRole("button", { name: /^Back to / })).toBeNull();
    // Search from the page: its way back names the region's page.
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Search: an exercise" })); });
    await tick();
    expect(screen.getByRole("button", { name: "Back to Fixture thighs specialization" })).toBeTruthy();
  }, 30000);

  it("opens search's Specialize on the region it was left on", async () => {
    window.localStorage.setItem(REGION_KEY, "fx_core");
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    await act(async () => { fireEvent.click(await screen.findByRole("button", { name: "Search: Specialize" }, { timeout: 15000 })); });
    await tick();
    expect(window.location.search).toBe("?workspace=specialization&region=fx_core");
    expect((await regionToggle()).textContent).toBe("Fixture core");
  }, 30000);
});
