// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { defaultCatalogFilters } from "@/lib/catalogDiscovery";
import { allExercisesDiscovery } from "@/lib/exerciseDiscovery";
import { ExerciseGenomePanel } from "./ExerciseGenomePanel";
import { ExerciseMedia } from "./ExerciseMedia";
import { DayExercisePicker } from "./DayExercisePicker";
import { CatalogDiscoveryPanel } from "./CatalogDiscoveryPanel";
import { AnatomyMap } from "./AnatomyMap";

/**
 * The Zercher, neck and bench rows on screen: the exercise detail in the handoff's order, with the
 * deliberate fallback where no photograph is exact (T26); "zercher" in the Plan's day picker and the
 * catalog as six told-apart rows, none added for the athlete (T01); a cable neck row's requirement
 * in the manual picker (T11); and Body Lab's labelled Neck row, never a painted shoulder.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

const ex = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const panel = (exercise: Exercise) => render(createElement(ExerciseGenomePanel, {
  exercise, context: { goal: "Athleticism", currentWorkout: [] }, compactHead: true, tab: "fingerprint", onTabChange: () => {},
  slots: { media: createElement(ExerciseMedia, { exerciseId: exercise.id, exerciseName: exercise.name, equipment: exercise.equipment, variant: "detail" }) },
}));
const headings = () => Array.from(document.querySelectorAll(".ei-view h2")).map((node) => node.textContent);

describe("the exercise detail of a row with an execution record", () => {
  it("435: set-up, the placeholder, three steps, how a set is logged, what the muscles do, how it is mapped - then the profile", () => {
    panel(ex(435));
    expect(headings().slice(0, 6)).toEqual(["Set-up", "How to do it", "How a set is logged", "What the muscles do", "How this is mapped", "At a glance"]);
    // The media sits between the set-up and the steps, and is the placeholder: no photograph, never another exercise's.
    const view = document.querySelector(".ei-view")!;
    const order = Array.from(view.querySelectorAll("h2, .exercise-media")).map((node) => node.tagName === "H2" ? node.textContent : "media");
    expect(order.slice(0, 3)).toEqual(["Set-up", "media", "How to do it"]);
    expect(view.querySelector(".exercise-media")!.getAttribute("data-state")).toBe("placeholder");
    expect(view.querySelector(".exercise-media img")).toBeNull();
    expect(view.querySelectorAll(".ei-steps li")).toHaveLength(3);
    const logged = within(screen.getByRole("heading", { name: "How a set is logged" }).parentElement!);
    expect(logged.getByText("Seconds held. Hold time is kept apart from reps everywhere.")).toBeTruthy();
    expect(logged.getByText(/^Manual resistance · force not measured\./)).toBeTruthy();
    expect(logged.getByText("Push or turn toward")).toBeTruthy();
    expect(logged.getByText(/^Left \/ Right per set\./)).toBeTruthy();
    expect(logged.getByText(/^Set-up note\./)).toBeTruthy();
    const roles = within(screen.getByRole("heading", { name: "What the muscles do" }).parentElement!);
    expect(roles.getByText("Holds the position, for time")).toBeTruthy();
    expect(roles.getByText(/Neck side-benders/)).toBeTruthy();
    expect(roles.queryByText(/Trapezius/)).toBeNull();
    // The catalog model's 0-100 scores are not shown for a provisional row: they would be guesses from its equipment.
    expect(screen.getByText("A provisional exercise: no profile scores yet.")).toBeTruthy();
    expect(document.querySelectorAll(".ei-row-value")).toHaveLength(0);
  });

  it("labels each source by kind, as a link, with the line that its grades are provisional", () => {
    panel(ex(435));
    const mapped = screen.getByRole("heading", { name: "How this is mapped" }).parentElement!;
    expect(mapped.textContent).toContain("Its grades are provisional product judgements, not measured effects");
    const kinds = Array.from(mapped.querySelectorAll(".ei-source-kind")).map((node) => node.textContent);
    expect(kinds).toEqual(["Scientific study", "Scientific study", "Scientific study"]);
    for (const link of Array.from(mapped.querySelectorAll("a"))) expect(link.getAttribute("href")).toMatch(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//);
  });

  it("437: says what the load number means and what is recorded with it, shows its approved photograph, and the muscles' parts in words", () => {
    panel(ex(437));
    const logged = screen.getByRole("heading", { name: "How a set is logged" }).parentElement!;
    expect(logged.textContent).toContain("Repetitions.");
    expect(logged.textContent).toContain("The plates on each arm, entered arm by arm. Unequal arms stay unequal.");
    expect(logged.textContent).toContain("Machine · Seat or bench setting · How the load is counted.");
    expect(logged.textContent).not.toContain("Head direction");
    const roles = screen.getByRole("heading", { name: "What the muscles do" }).parentElement!;
    expect(roles.textContent).toContain("Moves the load");
    expect(roles.textContent).toContain("Helps");
    expect(document.querySelector(".ei-view .exercise-media")!.getAttribute("data-state")).toBe("photo");
    const kinds = Array.from(document.querySelectorAll(".ei-source-kind")).map((node) => node.textContent);
    expect(kinds).toEqual(["Scientific study", "Manufacturer", "Manufacturer", "Image dataset"]);
  });

  it("421: the cradle's elbow flexors hold still, and are said not to count as sets", () => {
    panel(ex(421));
    const roles = screen.getByRole("heading", { name: "What the muscles do" }).parentElement!;
    expect(roles.textContent).toContain("Holds still while others move the load");
    expect(roles.textContent).toContain("Biceps brachii");
    expect(roles.textContent).toContain("Steadying only: never counted as sets for these muscles.");
    expect(Array.from(document.querySelectorAll(".ei-source-kind")).map((node) => node.textContent)).toEqual(["Coaching reference"]);
  });

  it("leaves a row with no execution record as it was: no set-up or logging sections", () => {
    panel(ex(1));
    expect(headings()[0]).toBe("At a glance");
    expect(screen.queryByRole("heading", { name: "How a set is logged" })).toBeNull();
  });
});

describe("T01 and T11 in the pickers", () => {
  const dayPicker = () => render(createElement(DayExercisePicker, {
    exercises, activeWorkout: [], split: "Legs" as const, sheetOpen: true, onOpenSheet: () => {}, onCloseSheet: () => {}, onAdd: vi.fn(), onReplace: () => {}, onInspect: vi.fn(),
  }));

  it("the Plan's day picker: \"zercher\" lists the six protocols, each with its set-up line, and adds none of them", () => {
    const onAdd = vi.fn();
    render(createElement(DayExercisePicker, { exercises, activeWorkout: [], split: "Full Body" as const, sheetOpen: true, onOpenSheet: () => {}, onCloseSheet: () => {}, onAdd, onReplace: () => {}, onInspect: () => {} }));
    fireEvent.click(screen.getByRole("button", { name: "All catalog" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Search all exercises" }), { target: { value: "zercher" } });
    const rows = Array.from(document.querySelectorAll(".day-picker-result"));
    expect(rows.map((row) => row.querySelector("strong")?.textContent).sort()).toEqual(["Zercher Block Pull", "Zercher Carry", "Zercher Deadlift — Floor", "Zercher Good Morning", "Zercher Hold", "Zercher Squat"]);
    expect(rows.map((row) => row.querySelector("small")?.textContent?.split(" · ")[0]).sort()).toEqual(["Carry", "Elevated pull", "Floor pull", "Hip hinge", "Hold", "Squat"]);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("the Plan's day picker: a cable neck row says it needs a head harness, and can still be added by hand", () => {
    dayPicker();
    fireEvent.click(screen.getByRole("button", { name: "All catalog" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Search all exercises" }), { target: { value: "cable harness neck" } });
    const row = Array.from(document.querySelectorAll(".day-picker-result")).find((node) => node.querySelector("strong")?.textContent === "Cable Harness Neck Rotation")!;
    expect(row.querySelector(".day-picker-needs")?.textContent).toBe("Needs a head harness");
    expect(within(row as HTMLElement).getByRole("button", { name: /^Add Cable Harness Neck Rotation/ })).toBeTruthy();
  });

  it("the catalog: \"zercher\" lists the six, told apart by their set-up lines", () => {
    render(createElement(CatalogDiscoveryPanel, {
      exercises, filters: { ...defaultCatalogFilters, query: "zercher" }, favoriteIds: new Set<number>(), destinationLabel: "Week 1 · Legs",
      discovery: allExercisesDiscovery, onFiltersChange: () => {}, onToggleFavorite: () => {}, onInspect: () => {}, onAdd: vi.fn(),
    }));
    const rows = Array.from(document.querySelectorAll(".catalog-discovery-row"));
    expect(rows).toHaveLength(6);
    expect(new Set(rows.map((row) => row.querySelector(".catalog-discovery-identity small")?.textContent)).size).toBe(6);
  });
});

describe("Body Lab's Neck row", () => {
  it("is listed at rest, by name, as not drawn; choosing it offers its exercises and paints nothing", () => {
    const onSelect = vi.fn();
    const onBrowseMuscle = vi.fn();
    render(createElement(AnatomyMap, { primary: ["glutes", "quads"], secondary: ["abs"], onSelect, onBrowseMuscle, selectedKey: null }));
    const listed = screen.getByRole("list", { name: "Regions not drawn on the figure" });
    const neck = within(listed).getByRole("button", { name: /Neck/ });
    expect(neck.textContent).toContain("Not drawn on the figure");
    fireEvent.click(neck);
    expect(onSelect).toHaveBeenCalledWith("neck");
    expect(screen.getAllByText("Not drawn on the figure").length).toBeGreaterThan(1);
    fireEvent.click(screen.getAllByRole("button", { name: /Browse neck exercises/ })[0]);
    expect(onBrowseMuscle).toHaveBeenCalledWith("neck");
    // No drawn shape is selected for it: the figure has no neck path, and no shoulder or trapezius path lights up.
    expect(document.querySelectorAll(".atlas-body-chart [data-selected='true'], .atlas-body-chart .is-selected")).toHaveLength(0);
  });

  it("names the neck as the primary role of a neck exercise in its muscle roles, with no shape on the figure", () => {
    render(createElement(AnatomyMap, { primary: ["neck"], secondary: [], onSelect: () => {}, showInspector: false, roleSource: "exercise" }));
    const rows = Array.from(document.querySelectorAll("ol.atlas-role-rows .atlas-role-row"));
    expect(rows.map((row) => [row.querySelector("strong")?.textContent, row.querySelector("small")?.textContent, row.querySelector("em")?.textContent])).toEqual([["Neck", "Not drawn on the figure", "Primary"]]);
    expect(screen.queryByRole("list", { name: "Regions not drawn on the figure" })).toBeNull();
  });
});
