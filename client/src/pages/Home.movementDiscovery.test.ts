// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The way from a sport movement to exercises (Sep 30 brief, sections 3 and 9).
 *
 * The Body Lab's one button used to write a muscle filter - the tapped muscle, or
 * else "shoulders" for Bridge from a text alias list - and open the plain catalog.
 * These journeys drive the real Home: "Find exercises for Bridge" opens the catalog
 * in movement mode with nothing narrowing it, a muscle tap does not change that,
 * the muscle has its own action, the mode lives in the address and survives Back
 * and reload, and looking at an exercise no longer picks a Body Lab muscle.
 *
 * The catalog panel is wrapped to record the props Home hands it, so what is
 * asserted is the context Home decided on, not how the panel happens to draw it.
 */

const captured = vi.hoisted(() => ({ props: null as null | Record<string, any> }));

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
vi.mock("@/components/CatalogDiscoveryPanel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/CatalogDiscoveryPanel")>();
  const { createElement: h } = await import("react");
  return {
    ...actual,
    CatalogDiscoveryPanel: (props: Parameters<typeof actual.CatalogDiscoveryPanel>[0]) => {
      captured.props = props;
      return h(actual.CatalogDiscoveryPanel, props);
    },
  };
});

import Home from "@/pages/Home";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultCatalogFilters } from "@/lib/catalogDiscovery";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const BRIDGE = { mode: "movement", sportId: "wrestling", movementId: "wrestling-19" };
const BRIDGE_ADDRESS = "?workspace=catalog&discover=movement&sport=wrestling&movement=wrestling-19";

const seedProfile = (movementId: string) => window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ version: 3, sportId: "wrestling", sportContextMode: "sport", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId, baseline: { experience: "Intermediate", weightUnit: "lb" } }));
// history.back() is applied on a later task, and so is the popstate it fires.
const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const back = async () => { await act(async () => { window.history.back(); }); await tick(); };

/** The Body Lab draws a full anatomy map, so its controls are found directly rather than by role. */
async function openBodyLab() {
  window.history.replaceState({}, "", "/?workspace=body");
  render(createElement(Home));
  return waitFor(() => { const step = document.querySelector<HTMLElement>(".body-lab-next-step"); if (!step || !document.querySelector(".atlas-role-rows .atlas-role-row")) throw new Error("Body Lab not ready"); return step; }, { timeout: 15000 });
}
const findForMovement = () => document.querySelector<HTMLButtonElement>(".body-lab-next-step > button:not(.body-lab-next-step-secondary)")!;
const browseMuscle = () => document.querySelector<HTMLButtonElement>(".body-lab-next-step-secondary");
const roleRow = (label: string) => Array.from(document.querySelectorAll<HTMLButtonElement>(".atlas-role-rows .atlas-role-row")).find((row) => row.textContent?.includes(label));
const tab = (label: string) => Array.from(document.querySelectorAll<HTMLButtonElement>(".workspace-top-switcher button")).find((button) => button.textContent === label)!;
/** The props the catalog was last rendered with, once it is on screen. */
const catalog = () => waitFor(() => { if (!document.querySelector(".catalog-experience-surface") || !captured.props) throw new Error("Catalog not ready"); return captured.props; }, { timeout: 15000 });

beforeEach(() => {
  window.localStorage.clear();
  seedProfile("wrestling-19");
  captured.props = null;
});
afterEach(() => { cleanup(); });

describe("Bridge to its exercises", () => {
  it("opens the catalog in movement mode for Bridge, with no muscle or other refinement", async () => {
    const step = await openBodyLab();
    expect(step.textContent).toContain("Explore exercises that support this movement.");
    // Nothing picked, so nothing offers a muscle: the old fallback named "shoulders" here.
    expect(browseMuscle()).toBeNull();
    expect(step.textContent).not.toMatch(/shoulders/i);
    expect(findForMovement().textContent).toBe("Find exercises for Bridge ");

    await act(async () => { fireEvent.click(findForMovement()); });
    const props = await catalog();
    expect(window.location.search).toBe(BRIDGE_ADDRESS);
    expect(props.discovery).toEqual(BRIDGE);
    expect(props.filters).toEqual(defaultCatalogFilters);
    expect(document.querySelectorAll(".catalog-discovery-chips button")).toHaveLength(0);
    // The results the next screen draws are Bridge's own tiers, with reasons that name it.
    expect(props.movementSupport.movementLabel).toBe("Bridge");
    expect(props.movementSupport.status).toBe("ok");
    expect(props.movementSupport.specific.length).toBeGreaterThan(0);
    expect(props.movementSupport.specific.every((row: { reason: string }) => row.reason.includes("Bridge"))).toBe(true);

    // A refinement and then Clear filters change the refinements only; the movement stays.
    await act(async () => { props.onFiltersChange({ ...props.filters, equipment: "Barbell" }); });
    await act(async () => { captured.props!.onFiltersChange(defaultCatalogFilters); });
    expect(captured.props!.discovery).toEqual(BRIDGE);
    expect(window.location.search).toBe(BRIDGE_ADDRESS);
  }, 60000);

  it("still finds Bridge's exercises after a muscle is tapped, and offers the muscle as its own action", async () => {
    await openBodyLab();
    const glutes = roleRow("Gluteal complex");
    expect(glutes).toBeTruthy();
    await act(async () => { fireEvent.click(glutes!); });
    expect(browseMuscle()?.textContent).toBe("Browse Gluteal complex exercises ");
    expect(findForMovement().textContent).toBe("Find exercises for Bridge ");

    await act(async () => { fireEvent.click(findForMovement()); });
    const props = await catalog();
    expect(props.discovery).toEqual(BRIDGE);
    expect(props.filters.muscle).toBe("all");
    expect(window.location.search).toBe(BRIDGE_ADDRESS);
  }, 60000);

  it("enters muscle mode only through Browse {Muscle} exercises", async () => {
    await openBodyLab();
    await act(async () => { fireEvent.click(roleRow("Gluteal complex")!); });
    await act(async () => { fireEvent.click(browseMuscle()!); });
    const props = await catalog();
    expect(window.location.search).toBe("?workspace=catalog&discover=muscle&muscle=glutes");
    expect(props.discovery).toEqual({ mode: "muscle", muscleId: "glutes" });
    // The muscle is the page's context, not a removable filter.
    expect(props.filters).toEqual(defaultCatalogFilters);
  }, 60000);

  it("starts a new movement with no refinements, and Back returns each movement with its own", async () => {
    await openBodyLab();
    await act(async () => { fireEvent.click(findForMovement()); });
    let props = await catalog();
    await act(async () => { props.onFiltersChange({ ...props.filters, equipment: "Barbell", query: "hip" }); props.onVisibleCountChange(72); });
    props = await catalog();
    expect(props.filters.equipment).toBe("Barbell");

    // The muscle map again, a different action, and its own Find.
    await act(async () => { fireEvent.click(tab("Muscles")); });
    expect(window.location.search).toBe("?workspace=body");
    await act(async () => { fireEvent.click(document.querySelector(".body-lab-selection-change")!); });
    const actionSelect = document.querySelectorAll<HTMLSelectElement>("#body-lab-selection-controls select")[1];
    await act(async () => { fireEvent.change(actionSelect, { target: { value: "wrestling-1" } }); });
    await waitFor(() => expect(findForMovement().textContent).toBe("Find exercises for Penetration step "));
    await act(async () => { fireEvent.click(findForMovement()); });
    props = await catalog();
    expect(props.discovery).toEqual({ mode: "movement", sportId: "wrestling", movementId: "wrestling-1" });
    expect(props.filters).toEqual(defaultCatalogFilters);
    expect(props.visibleCount).toBe(36);
    expect(props.movementSupport.movementLabel).toBe("Penetration step");

    // Back twice: the Bridge entry, with the refinements Bridge was left with.
    await back();
    await back();
    expect(window.location.search).toBe(BRIDGE_ADDRESS);
    props = await catalog();
    expect(props.discovery).toEqual(BRIDGE);
    expect(props.filters.equipment).toBe("Barbell");
    expect(props.visibleCount).toBe(72);
  }, 60000);

  it("drops the picked muscle when the movement on screen changes, browsed sport included, and finds that movement's exercises", async () => {
    await openBodyLab();
    await act(async () => { fireEvent.click(document.querySelector(".body-lab-selection-change")!); });
    await act(async () => { fireEvent.change(document.querySelector("#body-lab-selection-controls select")!, { target: { value: "soccer" } }); });
    await waitFor(() => expect(findForMovement().textContent).toBe("Find exercises for Acceleration "));
    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>(".atlas-role-rows .atlas-role-row")!); });
    expect(browseMuscle()).not.toBeNull();

    // The next soccer action, picked in the Movement explorer while browsing: it never touched the athlete's own action.
    await act(async () => { fireEvent.click(tab("Movements")); });
    const next = await waitFor(() => { const button = document.querySelector<HTMLButtonElement>('.atlas-stepper button[aria-label="Next action"]'); if (!button) throw new Error("Movement explorer not ready"); return button; }, { timeout: 15000 });
    await act(async () => { fireEvent.click(next); });
    await act(async () => { fireEvent.click(tab("Muscles")); });
    await waitFor(() => expect(findForMovement().textContent).toBe("Find exercises for Max-speed sprinting "), { timeout: 15000 });
    expect(document.querySelector(".atlas-role-rows .atlas-role-row.is-selected")).toBeNull();
    expect(browseMuscle()).toBeNull();

    await act(async () => { fireEvent.click(findForMovement()); });
    const props = await catalog();
    expect(props.discovery).toEqual({ mode: "movement", sportId: "soccer", movementId: "soccer-2" });
  }, 60000);

  it("returns from Find exercises to the page it was opened from", async () => {
    window.history.replaceState({}, "", "/?workspace=movement");
    render(createElement(Home));
    const find = await waitFor(() => { const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".atlas-next-step button")).find((item) => item.textContent?.startsWith("Find exercises for Bridge")); if (!button) throw new Error("Movement explorer not ready"); return button; }, { timeout: 15000 });
    await act(async () => { fireEvent.click(find); });
    const props = await catalog();
    expect(props.discovery).toEqual(BRIDGE);
    await act(async () => { props.onBackToMovement(); });
    expect(window.location.search).toBe("?workspace=movement");
    expect(document.querySelector(".atlas-selected h2")?.textContent).toBe("Bridge");
  }, 60000);
});

describe("The catalog's mode in the address", () => {
  it("restores a valid movement on load and follows Back and Forward entries, validating each", async () => {
    window.history.replaceState({}, "", `/${BRIDGE_ADDRESS}`);
    render(createElement(Home));
    let props = await catalog();
    expect(props.discovery).toEqual(BRIDGE);
    expect(window.location.search).toBe(BRIDGE_ADDRESS);

    await act(async () => { window.history.pushState({ workspace: "catalog" }, "", "/?workspace=catalog&discover=muscle&muscle=glutes"); window.dispatchEvent(new PopStateEvent("popstate")); });
    props = await catalog();
    expect(props.discovery).toEqual({ mode: "muscle", muscleId: "glutes" });

    // A movement under a sport it does not belong to is not half-applied: the whole catalog opens, and the address says so.
    await act(async () => { window.history.pushState({ workspace: "catalog" }, "", "/?workspace=catalog&discover=movement&sport=soccer&movement=wrestling-19"); window.dispatchEvent(new PopStateEvent("popstate")); });
    props = await catalog();
    expect(props.discovery).toEqual({ mode: "all" });
    expect(window.location.search).toBe("?workspace=catalog");
  }, 60000);

  it("opens the whole catalog for an address it cannot resolve, and corrects the address", async () => {
    window.history.replaceState({}, "", "/?workspace=catalog&discover=muscle&muscle=notAMuscle");
    render(createElement(Home));
    const props = await catalog();
    expect(props.discovery).toEqual({ mode: "all" });
    expect(props.movementSupport).toBeUndefined();
    expect(window.location.search).toBe("?workspace=catalog");
  }, 60000);

  it("treats the Exercises tab as a fresh entry into the whole catalog", async () => {
    window.history.replaceState({}, "", `/${BRIDGE_ADDRESS}`);
    render(createElement(Home));
    let props = await catalog();
    await act(async () => { props.onFiltersChange({ ...props.filters, equipment: "Barbell" }); });
    await act(async () => { fireEvent.click(tab("Muscles")); });
    await act(async () => { fireEvent.click(tab("Exercises")); });
    props = await catalog();
    expect(window.location.search).toBe("?workspace=catalog");
    expect(props.discovery).toEqual({ mode: "all" });
    expect(props.filters).toEqual(defaultCatalogFilters);
  }, 60000);
});

describe("Exercise details over a movement's catalog", () => {
  it("reads the discovery movement, and Back from the movement it opens returns to the same results", async () => {
    // The athlete's own action is the penetration step; the catalog is open for Bridge.
    seedProfile("wrestling-1");
    window.history.replaceState({}, "", `/${BRIDGE_ADDRESS}`);
    render(createElement(Home));
    let props = await catalog();
    await act(async () => { props.onFiltersChange({ ...props.filters, equipment: "Barbell" }); props.onVisibleCountChange(72); });
    props = await catalog();
    const hipThrust = exercises.find((exercise) => exercise.name === "Barbell Hip Thrust")!;
    await act(async () => { props.onInspect(hipThrust); });
    const action = await waitFor(() => { const node = document.querySelector(".inspection-action-connection-action"); if (!node) throw new Error("Overlay not ready"); return node; }, { timeout: 15000 });
    // The movement is named as the catalog's title and context row name it (it read "bridge", the raw record label).
    expect(action.textContent).toBe("Bridge");
    expect(document.querySelector(".inspection-action-connection-label")?.textContent).toBe("Movement-specific");

    await act(async () => { fireEvent.click(document.querySelector(".inspection-action-connection-open")!); });
    await tick();
    expect(window.location.search).toBe("?workspace=movement");
    await waitFor(() => expect(document.querySelector(".atlas-selected h2")?.textContent).toBe("Bridge"), { timeout: 15000 });

    await back();
    expect(window.location.search).toBe(BRIDGE_ADDRESS);
    props = await catalog();
    expect(props.discovery).toEqual(BRIDGE);
    expect(props.filters.equipment).toBe("Barbell");
    expect(props.visibleCount).toBe(72);
  }, 60000);

  it("says how the match was made, behind a closed disclosure, with the record's confidence and sources", async () => {
    // Sep 30 brief §4: the exercise details explain the mapping and its source; the method stays behind a disclosure.
    window.history.replaceState({}, "", `/${BRIDGE_ADDRESS}`);
    render(createElement(Home));
    const props = await catalog();
    const hipThrust = exercises.find((exercise) => exercise.name === "Barbell Hip Thrust")!;
    await act(async () => { props.onInspect(hipThrust); });
    const how = await waitFor(() => { const node = document.querySelector<HTMLDetailsElement>(".inspection-action-connection-how"); if (!node) throw new Error("Overlay not ready"); return node; }, { timeout: 15000 });
    expect(how.open).toBe(false);
    expect(how.querySelector("summary")?.textContent).toBe("How this match was made ");
    await act(async () => { fireEvent.click(how.querySelector("summary")!); });
    expect(how.querySelector("p")?.textContent).toBe("Matched by exercise name to the Bridge movement record (hip thrust). Record rated moderate confidence, from 3 sources.");
    expect(document.querySelector(".inspection-action-connection")?.textContent).not.toMatch(/reviewed/i);
  }, 60000);

  it("shows no sport-action number in the exercise analysis, only the movement's tier", async () => {
    // Sep 30 decisions: no number or grade for relevance. The analysis printed "35/100" for a hip thrust over Bridge under "Movement-specific".
    window.history.replaceState({}, "", `/${BRIDGE_ADDRESS}`);
    render(createElement(Home));
    const props = await catalog();
    const hipThrust = exercises.find((exercise) => exercise.name === "Barbell Hip Thrust")!;
    await act(async () => { props.onInspect(hipThrust); });
    const contextTab = await waitFor(() => { const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".genome-tabbar button")).find((item) => item.textContent === "Context"); if (!button) throw new Error("Analysis not ready"); return button; }, { timeout: 15000 });
    await act(async () => { fireEvent.click(contextTab); });
    const panel = document.querySelector(".genome-panel")!;
    expect(panel.querySelector(".genome-action-connection")?.textContent).toContain("Bridge");
    expect(panel.querySelector(".genome-action-connection-label")?.textContent).toBe("Movement-specific");
    const text = panel.textContent ?? "";
    expect(text).not.toMatch(/sport action[^.]*\d+\/100/i);
    expect(text).not.toMatch(/mechanical match/i);
    expect(text).not.toMatch(/How closely this matches/i);
  }, 60000);

  it("names the catalog tier in the details, and says it is not a movement match", async () => {
    // Sep 30 brief §5: the letter is off the rows; the details are its one place, named and explained.
    window.history.replaceState({}, "", `/${BRIDGE_ADDRESS}`);
    render(createElement(Home));
    const props = await catalog();
    const hipThrust = exercises.find((exercise) => exercise.name === "Barbell Hip Thrust")!;
    expect(document.querySelector(".catalog-discovery-tier")).toBeNull();
    await act(async () => { props.onInspect(hipThrust); });
    const note = await waitFor(() => { const node = document.querySelector(".exercise-intelligence-tier-note"); if (!node) throw new Error("Overlay not ready"); return node; }, { timeout: 15000 });
    expect(note.textContent).toBe(`Catalog tier ${hipThrust.muscleGrade} is a general label from the exercise catalog, not how closely this exercise matches a movement.`);
    const stamp = document.querySelector(".exercise-intelligence-tier [role='img']")!;
    expect(stamp.getAttribute("aria-label")).toBe(`Catalog tier ${hipThrust.muscleGrade}`);
    expect(stamp.textContent).toBe(hipThrust.muscleGrade);
  }, 60000);

  it("does not pick a Body Lab muscle when an exercise is opened", async () => {
    window.history.replaceState({}, "", "/?workspace=catalog");
    render(createElement(Home));
    const props = await catalog();
    const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press")!;
    await act(async () => { props.onInspect(bench); });
    await waitFor(() => { if (!document.querySelector(".exercise-intelligence-close")) throw new Error("Overlay not ready"); }, { timeout: 15000 });
    await act(async () => { fireEvent.click(document.querySelector(".exercise-intelligence-close")!); });
    await tick();
    await act(async () => { fireEvent.click(tab("Muscles")); });
    await waitFor(() => { if (!document.querySelector(".body-lab-next-step")) throw new Error("Body Lab not ready"); }, { timeout: 15000 });
    expect(document.querySelector(".atlas-role-rows .atlas-role-row.is-selected")).toBeNull();
    expect(browseMuscle()).toBeNull();
    expect(document.querySelector(".body-lab-next-step")?.textContent).not.toMatch(/pectoralis/i);
  }, 60000);
});
