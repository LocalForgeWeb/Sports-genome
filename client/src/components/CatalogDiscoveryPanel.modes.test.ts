// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogDiscoveryPanel } from "./CatalogDiscoveryPanel";
import { defaultCatalogFilters, muscleModeExercises, type CatalogFilters } from "@/lib/catalogDiscovery";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseDiscoveryContext } from "@/lib/exerciseDiscovery";
import { getMovementSupport } from "@/lib/movementSupport";

/**
 * The catalog's three modes as an athlete reads them (Sep 30 brief, sections 4-5
 * and the discovery journeys of section 9): what the title and context say, which
 * rows are counted as matches and why each appears, the two honest dead ends,
 * Clear filters keeping the movement, and the row controls' names and added state.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const BRIDGE: ExerciseDiscoveryContext = { mode: "movement", sportId: "wrestling", movementId: "wrestling-19" };
const PENETRATION: ExerciseDiscoveryContext = { mode: "movement", sportId: "wrestling", movementId: "wrestling-1" };
const GLUTES: ExerciseDiscoveryContext = { mode: "muscle", muscleId: "glutes" };
const supportFor = (context: ExerciseDiscoveryContext) => (context.mode === "movement" ? getMovementSupport(context.sportId, context.movementId) : undefined);
const hipThrust = exercises.find((exercise) => exercise.name === "Barbell Hip Thrust")!;

type Props = Parameters<typeof CatalogDiscoveryPanel>[0];
const handlers = () => ({ onFiltersChange: vi.fn(), onToggleFavorite: vi.fn(), onInspect: vi.fn(), onAdd: vi.fn(), onBackToMovement: vi.fn(), onShowAllExercises: vi.fn(), onBrowseMuscle: vi.fn() });

function mount(context: ExerciseDiscoveryContext, over: Partial<Props> = {}) {
  const spies = handlers();
  const view = render(createElement(CatalogDiscoveryPanel, {
    exercises, filters: defaultCatalogFilters, favoriteIds: new Set<number>(), destinationLabel: "Week 1 · Push",
    discovery: context, movementSupport: supportFor(context), ...spies, ...over,
  }));
  return { ...spies, view };
}

/** The panel with its filters and the destination day held the way Home holds them. */
function Owned({ context, initial = defaultCatalogFilters, onAdd, onShowAllExercises }: { context: ExerciseDiscoveryContext; initial?: CatalogFilters; onAdd?: (exercise: Exercise) => void; onShowAllExercises?: () => void }) {
  const [filters, setFilters] = useState(initial);
  const [day, setDay] = useState<number[]>([]);
  return createElement(CatalogDiscoveryPanel, {
    exercises, filters, favoriteIds: new Set<number>(), destinationLabel: "Week 1 · Push", addedIds: new Set(day),
    discovery: context, movementSupport: supportFor(context), onFiltersChange: setFilters, onToggleFavorite: () => {}, onInspect: () => {},
    onAdd: (exercise) => { onAdd?.(exercise); setDay((current) => current.includes(exercise.id) ? current : [...current, exercise.id]); },
    onShowAllExercises,
  });
}

const heading = () => screen.getByRole("heading", { level: 1 }).textContent;
const count = () => document.querySelector(".catalog-results-count")?.textContent ?? null;
const mainList = () => document.querySelector<HTMLElement>(".catalog-discovery > .catalog-discovery-list");
const rowNames = (root: ParentNode | null) => Array.from(root?.querySelectorAll(".catalog-discovery-card strong") ?? []).map((node) => node.textContent);
const reasonOf = (name: string) => {
  const row = Array.from(document.querySelectorAll(".catalog-discovery-card")).find((node) => node.querySelector("strong")?.textContent === name);
  return row?.querySelector(".catalog-row-reason")?.textContent ?? null;
};

afterEach(cleanup);

describe("movement mode", () => {
  it("is titled for the movement, with its sport and a way back, and a closed explanation", () => {
    const { onBackToMovement, onShowAllExercises } = mount(BRIDGE);
    expect(heading()).toBe("Exercises for Bridge");
    const context = document.querySelector<HTMLElement>(".catalog-discovery-context")!;
    expect(context.querySelector(".catalog-context-line")?.textContent).toBe("Wrestling · Bridge");
    expect(context.querySelector(".catalog-context-explain")?.textContent).toBe("Exercises named in the Bridge movement record, then exercises with the same pattern.");
    const how = context.querySelector<HTMLDetailsElement>("details.catalog-discovery-how")!;
    expect(how.querySelector("summary")?.textContent).toBe("How matches work ");
    expect(how.open).toBe(false);
    // Matched by name, rated by the record's own confidence and sources; never "reviewed".
    expect(how.textContent).toContain("matched by exercise name to the movement record");
    expect(how.textContent).toContain("rated moderate confidence, from 3 sources");
    expect(how.textContent).not.toMatch(/reviewed/i);

    fireEvent.click(within(context).getByRole("button", { name: "Back to Bridge" }));
    expect(onBackToMovement).toHaveBeenCalledTimes(1);
    fireEvent.click(within(context).getByRole("button", { name: "Show all exercises" }));
    expect(onShowAllExercises).toHaveBeenCalledTimes(1);
  });

  it("lists the movement-specific and related-pattern tiers as the matches, each with why it appears", () => {
    const support = getMovementSupport("wrestling", "wrestling-19");
    mount(BRIDGE);
    // Counted: tiers 1 and 2 only, and the line says which.
    expect(count()).toBe(`${support.specific.length + support.related.length} movement matches ${support.specific.length} movement-specific · ${support.related.length} related pattern`);
    const list = mainList()!;
    expect(Array.from(list.querySelectorAll(".catalog-tier-heading")).map((node) => node.textContent)).toEqual([`Movement-specific ${support.specific.length}`, `Related pattern ${support.related.length}`]);
    // In tier order: the record's phrase order, then the related patterns.
    expect(rowNames(list)).toEqual([...support.specific, ...support.related].map((row) => row.exercise.name));
    expect(reasonOf("Barbell Hip Thrust")).toBe("Named in the Bridge movement record: hip thrust");
    expect(reasonOf("Conventional Deadlift")).toBe("Same hip hinge pattern as Romanian Deadlift");
    for (const row of list.querySelectorAll(".catalog-discovery-card")) expect(row.querySelector(".catalog-row-reason")?.textContent).toBeTruthy();
    // The reason is read with the row's details button.
    const inspect = screen.getByRole("button", { name: "Inspect Barbell Hip Thrust" });
    expect(document.getElementById(inspect.getAttribute("aria-describedby")!)?.textContent).toBe("Named in the Bridge movement record: hip thrust");
    // No catalog letter on any row.
    expect(Array.from(document.querySelectorAll(".catalog-discovery-card *")).some((node) => /^(SS|S|A|B|C|D|F)$/.test(node.textContent ?? ""))).toBe(false);
  });

  it("keeps muscle support in its own closed section, never among or counted with the matches", () => {
    const support = getMovementSupport("wrestling", "wrestling-19");
    mount(BRIDGE);
    const section = document.querySelector<HTMLDetailsElement>("details.catalog-muscle-support")!;
    expect(section.open).toBe(false);
    expect(section.querySelector("summary")?.textContent).toBe(`Muscle support ${support.muscle.length}Not counted as matches `);
    const muscleNames = support.muscle.map((row) => row.exercise.name);
    expect(rowNames(mainList()).some((name) => muscleNames.includes(name!))).toBe(false);
    expect(rowNames(section).slice(0, 3)).toEqual(muscleNames.slice(0, 3));
    expect(reasonOf(support.muscle[0].exercise.name)).toBe("Trains gluteus maximus, a prime mover in Bridge; not specific to the movement.");
    expect(count()).not.toContain(String(support.specific.length + support.related.length + support.muscle.length));
  });

  it("shows another movement's own results and reasons, not the same list under a new title", () => {
    const { view } = mount(BRIDGE);
    const bridgeRows = rowNames(mainList());
    view.unmount();
    mount(PENETRATION);
    const support = getMovementSupport("wrestling", "wrestling-1");
    expect(heading()).toBe(`Exercises for ${support.movementLabel}`);
    expect(document.querySelector(".catalog-context-line")?.textContent).toBe(`Wrestling · ${support.movementLabel}`);
    const rows = rowNames(mainList());
    expect(rows).toEqual([...support.specific, ...support.related].map((row) => row.exercise.name));
    expect(rows.filter((name) => bridgeRows.includes(name))).not.toEqual(rows);
    expect(reasonOf(rows[0]!)).toContain(`Named in the ${support.movementLabel} movement record`);
  });

  it("says when a movement has no record, and offers the whole catalog", () => {
    const context: ExerciseDiscoveryContext = { mode: "movement", sportId: "wrestling", movementId: "wrestling-21" };
    const { onShowAllExercises, onBrowseMuscle } = mount(context);
    expect(heading()).toBe("Exercises for Gut-wrench turn");
    const missing = document.querySelector<HTMLElement>(".catalog-movement-missing")!;
    expect(missing.querySelector("strong")?.textContent).toBe("Movement-specific matches aren't available yet for Gut-wrench turn.");
    expect(missing.querySelector("p")?.textContent).toContain("There is no movement record for Gut-wrench turn yet");
    // No prime movers on record, so there is no muscle to browse and no muscle support to offer.
    expect(within(missing).queryByRole("button", { name: "Browse exercises for its muscles" })).toBeNull();
    expect(document.querySelector(".catalog-muscle-support")).toBeNull();
    expect(count()).toBeNull();
    fireEvent.click(within(missing).getByRole("button", { name: "Open the full catalog" }));
    expect(onShowAllExercises).toHaveBeenCalledTimes(1);
    expect(onBrowseMuscle).not.toHaveBeenCalled();
  });

  it("says when the record names nothing in the catalog, and offers its first prime mover only on a tap", () => {
    const context: ExerciseDiscoveryContext = { mode: "movement", sportId: "basketball", movementId: "basketball-8" };
    const support = getMovementSupport("basketball", "basketball-8");
    expect(support.status).toBe("no-named-matches");
    const { onBrowseMuscle, onShowAllExercises } = mount(context);
    const missing = document.querySelector<HTMLElement>(".catalog-movement-missing")!;
    expect(missing.querySelector("strong")?.textContent).toBe(`Movement-specific matches aren't available yet for ${support.movementLabel}.`);
    expect(onBrowseMuscle).not.toHaveBeenCalled();
    fireEvent.click(within(missing).getByRole("button", { name: "Browse exercises for its muscles" }));
    expect(onBrowseMuscle).toHaveBeenCalledWith("glutes");
    fireEvent.click(within(missing).getByRole("button", { name: "Open the full catalog" }));
    expect(onShowAllExercises).toHaveBeenCalledTimes(1);
    // Muscle support is still there, closed and separate; nothing is passed off as a match.
    expect(document.querySelector<HTMLDetailsElement>("details.catalog-muscle-support")?.open).toBe(false);
    expect(mainList()).toBeNull();
  });

  it("says when the filters removed every match, and Clear filters brings them back without leaving the movement", () => {
    const onShowAllExercises = vi.fn();
    render(createElement(Owned, { context: BRIDGE, initial: { ...defaultCatalogFilters, query: "bench press" }, onShowAllExercises }));
    const empty = document.querySelector<HTMLElement>(".catalog-movement-filtered")!;
    expect(empty.querySelector("strong")?.textContent).toBe("No Bridge matches with these filters.");
    expect(document.querySelector(".catalog-movement-missing")).toBeNull();
    expect(count()).toBeNull();
    fireEvent.click(within(empty).getByRole("button", { name: "Clear filters" }));
    expect(heading()).toBe("Exercises for Bridge");
    expect(count()).toMatch(/^27 movement matches/);
    expect(screen.getByRole("textbox", { name: "Search exercises" })).toHaveProperty("value", "");
    expect(onShowAllExercises).not.toHaveBeenCalled();
  });

  it("narrows the matches by equipment as a chip, and Clear filters keeps the movement", () => {
    const support = getMovementSupport("wrestling", "wrestling-19");
    const barbell = [...support.specific, ...support.related].filter((row) => row.exercise.equipment === "Barbell");
    render(createElement(Owned, { context: BRIDGE, initial: { ...defaultCatalogFilters, equipment: "Barbell" } }));
    expect(screen.getByRole("button", { name: "Remove filter Barbell" })).toBeTruthy();
    expect(count()).toMatch(new RegExp(`^${barbell.length} movement match`));
    expect(rowNames(mainList())).toEqual(barbell.map((row) => row.exercise.name));
    // Sport and movement are the base: they are never a chip.
    expect(screen.queryByRole("button", { name: /Remove filter (Wrestling|Bridge)/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.queryByRole("button", { name: "Remove filter Barbell" })).toBeNull();
    expect(heading()).toBe("Exercises for Bridge");
    expect(document.querySelector(".catalog-context-line")?.textContent).toBe("Wrestling · Bridge");
    expect(count()).toMatch(new RegExp(`^${support.specific.length + support.related.length} movement matches`));
  });
});

describe("muscle mode", () => {
  it("is titled for the muscle and lists what trains it, primary first, with the reason", () => {
    const { onShowAllExercises } = mount(GLUTES);
    const base = muscleModeExercises(exercises, "glutes");
    expect(heading()).toBe("Gluteal complex exercises");
    expect(document.querySelector(".catalog-context-explain")?.textContent).toBe("Exercises that train Gluteal complex as a primary or supporting muscle, primary first.");
    expect(document.querySelector(".catalog-context-line")).toBeNull();
    expect(count()).toBe(`${base.length} Gluteal complex exercises`);
    expect(rowNames(mainList())).toEqual(base.slice(0, 36).map((exercise) => exercise.name));
    expect(reasonOf(base[0].name)).toBe("Trains Gluteal complex as a primary muscle");
    // The muscle is the base, not a removable chip, and no movement tiers are drawn.
    expect(screen.queryByRole("button", { name: /Remove filter/ })).toBeNull();
    expect(document.querySelector(".catalog-muscle-support, .catalog-tier-heading")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show all exercises" }));
    expect(onShowAllExercises).toHaveBeenCalledTimes(1);
  });

  it("does not measure a muscle's list against the athlete's own action", () => {
    // A movement, a muscle and a training day are separate selections (brief §3).
    let index = 0;
    const labels = ["Movement-specific", "Related pattern", "Muscle support"] as const;
    mount(GLUTES, { selectedActionLabel: "bridge", connectionForExercise: () => ({ label: labels[index++ % 3], detail: "test" }) });
    expect(document.querySelector(".catalog-action-link, .catalog-discovery-action-scope")).toBeNull();
    expect(document.body.textContent).not.toContain("Action link");
  });
});

describe("the whole catalog", () => {
  it("is the exercise catalog, with no context row, counting against the catalog's size", () => {
    mount({ mode: "all" });
    expect(heading()).toBe("Exercise catalog");
    expect(document.querySelector(".catalog-discovery-context")).toBeNull();
    expect(count()).toBe(`${exercises.length} exercises`);
    expect(rowNames(mainList())).toEqual(exercises.slice(0, 36).map((exercise) => exercise.name));
    cleanup();
    mount({ mode: "all" }, { filters: { ...defaultCatalogFilters, equipment: "Barbell" } });
    expect(count()).toBe(`${exercises.filter((exercise) => exercise.equipment === "Barbell").length} of ${exercises.length} exercises`);
  });

  it("says once which action its links are measured against, by the action's display name", () => {
    const { view } = mount({ mode: "all" }, { selectedActionLabel: "bridge", connectionForExercise: () => ({ label: "Muscle support", detail: "test" }) });
    expect(document.querySelector(".catalog-discovery-action-scope p")?.textContent).toBe(" Action links are measured against Bridge. All 36 train one of its prime movers, without a movement-specific link.");
    // All alike, so no row repeats it.
    expect(document.querySelector(".catalog-action-link")).toBeNull();
    view.unmount();
  });

  it("follows the order title, context, search, refinements, count, results", () => {
    mount(BRIDGE);
    const order = Array.from(document.querySelector(".catalog-discovery")!.children).map((node) => node.className.split(" ")[0]);
    expect(order.slice(0, 6)).toEqual(["catalog-discovery-heading", "catalog-discovery-context", "catalog-discovery-search", "catalog-discovery-refine", "catalog-results-count", "catalog-discovery-list"]);
  });

  it("makes Favorites a toggle in the refinement row, not a tab", () => {
    const { onFiltersChange } = mount({ mode: "all" }, { favoriteIds: new Set([hipThrust.id]) });
    expect(screen.queryByRole("tablist")).toBeNull();
    const toggle = within(document.querySelector<HTMLElement>(".catalog-discovery-refine")!).getByRole("button", { name: "Favorites 1" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultCatalogFilters, favoritesOnly: true });
  });
});

describe("row controls", () => {
  it("names the add and the favorite by the exercise and the day, and keeps the favorite's name when saved", () => {
    const { onAdd, onToggleFavorite } = mount(BRIDGE, { favoriteIds: new Set([hipThrust.id]) });
    const add = screen.getByRole("button", { name: "Add Barbell Hip Thrust to Week 1, Push" });
    const favorite = screen.getByRole("button", { name: "Save Barbell Hip Thrust to favorites" });
    expect(favorite.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Save Glute Bridge to favorites" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(favorite);
    expect(onToggleFavorite).toHaveBeenCalledWith(hipThrust);
    fireEvent.click(add);
    expect(onAdd).toHaveBeenCalledWith(hipThrust);
  });

  it("shows an exercise already in the day as added, and its control does not add again", () => {
    const { onAdd } = mount(BRIDGE, { addedIds: new Set([hipThrust.id]) });
    const added = screen.getByRole("button", { name: "Barbell Hip Thrust is already in Week 1, Push" });
    expect(added.getAttribute("aria-disabled")).toBe("true");
    expect(added.closest(".catalog-discovery-card")?.classList.contains("is-added")).toBe(true);
    fireEvent.click(added);
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Add Barbell Hip Thrust to Week 1, Push" })).toBeNull();
  });

  it("writes once for a double tap, before and after the day has answered", () => {
    const { onAdd } = mount(BRIDGE);
    const add = screen.getByRole("button", { name: "Add Barbell Hip Thrust to Week 1, Push" });
    // Two taps before anything re-renders: the second is dropped here.
    act(() => { add.click(); add.click(); });
    expect(onAdd).toHaveBeenCalledTimes(1);
    cleanup();

    const write = vi.fn();
    render(createElement(Owned, { context: BRIDGE, onAdd: write }));
    fireEvent.click(screen.getByRole("button", { name: "Add Barbell Hip Thrust to Week 1, Push" }));
    // The day now holds it: the row says so, briefly marks it, and a second tap writes nothing.
    const added = screen.getByRole("button", { name: "Barbell Hip Thrust is already in Week 1, Push" });
    expect(added.closest(".catalog-discovery-card")?.classList.contains("is-added-now")).toBe(true);
    fireEvent.click(added);
    expect(write).toHaveBeenCalledTimes(1);
  });
});
