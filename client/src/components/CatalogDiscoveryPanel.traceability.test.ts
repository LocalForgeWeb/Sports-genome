// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CatalogDiscoveryPanel } from "./CatalogDiscoveryPanel";
import { defaultCatalogFilters } from "@/lib/catalogDiscovery";
import type { Exercise } from "@/lib/exerciseCatalog";

const component = readFileSync(resolve(process.cwd(), "client/src/components/CatalogDiscoveryPanel.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/catalog-discovery.css"), "utf8");

const sample = (over: Partial<Exercise> = {}): Exercise => ({
  id: 1, name: "Incline Barbell Bench Press", sourceGroup: "", category: "", equipment: "barbell",
  movement: "Horizontal push", primaryMuscles: ["chest"], secondaryMuscles: [], qualities: [],
  muscleGrade: "A", sportFit: {}, ...over,
} as Exercise);

const renderPanel = (exercises: Exercise[]) => render(React.createElement(CatalogDiscoveryPanel, {
  exercises, filters: defaultCatalogFilters, favoriteIds: new Set<number>(),
  onFiltersChange: vi.fn(), onToggleFavorite: vi.fn(), onInspect: vi.fn(), onAdd: vi.fn(),
}));

describe("Catalog Discovery traceability presentation", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("derives its visible catalog total and puts no grade letter on a row", () => {
    expect(component).not.toContain("All 400 exercises");
    renderPanel([sample(), sample({ id: 2, name: "Decline Barbell Bench Press" })]);
    expect(document.querySelector(".catalog-results-count")?.textContent).toBe("2 exercises");
    // Sep 30 brief §5: the catalog letter rated nothing about a movement, yet sat on
    // every row beside one, so it moved to the exercise's details, named and explained.
    expect(screen.queryByLabelText(/Catalog tag/)).toBeNull();
    expect(document.querySelector(".catalog-discovery-tier")).toBeNull();
    expect(Array.from(document.querySelectorAll(".catalog-discovery-card *")).some((node) => node.textContent === "A")).toBe(false);
    expect(document.body.textContent).not.toMatch(/percentile|rank(ed|ing)?\b|top \d/i);
  });

  it("gives each card a name long enough to tell two variations apart", () => {
    // Every card in the grid used to truncate to about eight characters, so the
    // page read as 36 identical cards: "Barbell B...", "Incline Ba...".
    renderPanel([sample(), sample({ id: 2, name: "Decline Barbell Bench Press" })]);
    expect(screen.getByText("Incline Barbell Bench Press")).toBeTruthy();
    expect(screen.getByText("Decline Barbell Bench Press")).toBeTruthy();
  });

  it("leads with a concise discovery header while keeping search and exercise actions available", () => {
    // One heading, the page's name; the tab above already says Exercises. Sep 30: the
    // title follows the mode (lib/exerciseDiscovery), and "Filter & sort" is "Filters"
    // because it never offered a sort.
    renderPanel([sample()]);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Exercise catalog");
    expect(document.body.textContent).not.toContain("Find an exercise");
    expect(screen.getByRole("textbox", { name: "Search exercises" })).toBeTruthy();
    expect(document.querySelector(".catalog-discovery-controls > summary")?.textContent).toBe(" Filters");
    expect(component).not.toContain("Filter & sort");
    expect(component).toContain("onToggleFavorite(exercise)");
    expect(component).toContain("onAdd(exercise)");
  });

  it("uses optional browser feedback and visible pressed states for deliberate catalog actions", () => {
    expect(component).toContain('import { emitInteractionFeedback } from "@/lib/interactionFeedback";');
    expect(component).toContain('if (key !== "query") emitInteractionFeedback();');
    expect(component).toContain('emitInteractionFeedback(); onInspect(exercise);');
    expect(component).toContain('emitInteractionFeedback(); onToggleFavorite(exercise);');
    // Sep 30: the add goes through one guard that drops a second tap, and it still sounds.
    expect(component).toContain("emitInteractionFeedback();\n    onAdd(exercise);");
    expect(styles).toContain('.catalog-discovery-card-copy:active');
    expect(styles).toContain('transform: scale(.97);');
  });
});

describe("catalog action-link badge", () => {
  const panel = component;

  it("draws the badge only while it tells the visible cards apart", () => {
    // Measured on the shipped build at 390px: the default view carried the same
    // label on all 36 cards - a column of identical pills in the accent colour.
    // The "squat", "curl" and "jump" searches each split it, and there it earns
    // its place. Same rule as the Genome selector, same helper.
    expect(panel).toContain("labelTellsRowsApart");
    expect(panel).toContain("{connectionTellsCardsApart && connection && connection.label !== \"Not mapped\"");
    // Judged against the cards actually on screen, not the whole result set. Sep 30:
    // those are the whole catalog's rows; a movement or muscle row says why it appears instead.
    expect(panel).toContain("const linkRows = showsActionLinks ? visibleResults : [];");
    expect(panel).toContain("linkRows.map((exercise) => visibleConnections.get(exercise.id)?.label ?? \"Not mapped\")");
  });

  it("states the shared link once instead of dropping it", () => {
    expect(panel).toContain("sharedConnectionSummary(label, linkRows.length)");
    // Sep 30: said under the count, with the action's display label.
    expect(panel).toContain("Action links are measured against <b>{movementDisplayLabel(selectedActionLabel)}</b>.{sharedConnection");
  });
});

describe("catalog rows on a phone", () => {
  const globalStyles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
  const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

  it("keeps every hover style behind (hover: hover), so a tap leaves nothing lit", () => {
    // Measured before Sep 30: the plus stayed orange after a tap on a phone - a stuck
    // :hover that read as an added state.
    const css = withoutComments(styles);
    const gate = css.indexOf("@media (hover: hover) {");
    expect(gate).toBeGreaterThan(-1);
    expect(css.slice(0, gate)).not.toContain(":hover");
    expect(css.slice(gate).match(/:hover/g)?.length).toBeGreaterThan(0);
  });

  it("draws rows with dividers, not as cards inside a panel", () => {
    // The app-wide surface rules key on "-card" in a class name; the rows undo them.
    expect(styles).toContain(".catalog-discovery .catalog-discovery-card, .catalog-discovery .catalog-discovery-card-copy { border-radius: 0; box-shadow: none; transform: none; }");
    expect(styles).toMatch(/\.catalog-discovery-card \{[^}]*border-bottom: 1px solid var\(--sg-divider-on-dark\)/);
    // No outer gradient panel and no per-row elevation from the global sheet.
    expect(globalStyles).not.toContain(".destination-body .catalog-discovery {");
    expect(globalStyles).not.toMatch(/\.destination-body \.catalog-discovery[ ,{]/);
    expect(globalStyles).not.toMatch(/\.catalog-discovery-card(:hover)? \{/);
    expect(globalStyles).not.toMatch(/,\s*\.catalog-discovery-card(:hover)?\s*\{/);
  });
});
