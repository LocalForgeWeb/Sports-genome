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

  it("derives its visible catalog total and labels configured grades without implying a population rank", () => {
    expect(component).toContain("`All ${exercises.length} exercises`");
    expect(component).not.toContain("All 400 exercises");
    renderPanel([sample()]);
    // The grade reads as a catalog label, never as a rank among other athletes.
    // It is shown as the bare letter so it stops crushing the exercise name into
    // "Incline Ba...", but the full phrasing has to survive for anyone reading
    // the card by its accessible name or hovering it.
    const tag = screen.getByLabelText("Catalog tag A");
    expect(tag.textContent).toBe("A");
    expect(tag.getAttribute("title")).toContain("a label from the exercise catalog");
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
    expect(component).toContain("Exercise catalog");
    expect(component).toContain("Find an exercise");
    expect(component).toContain("{exercises.length} options");
    expect(component).toContain('aria-label="Search exercises"');
    expect(component).toContain("Filter & sort");
    expect(component).toContain("onToggleFavorite(exercise)");
    expect(component).toContain("onAdd(exercise)");
  });

  it("uses optional browser feedback and visible pressed states for deliberate catalog actions", () => {
    expect(component).toContain('import { emitInteractionFeedback } from "@/lib/interactionFeedback";');
    expect(component).toContain('if (key !== "query") emitInteractionFeedback();');
    expect(component).toContain('emitInteractionFeedback(); onInspect(exercise);');
    expect(component).toContain('emitInteractionFeedback(); onToggleFavorite(exercise);');
    expect(component).toContain('emitInteractionFeedback(); onAdd(exercise);');
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
    // Judged against the cards actually on screen, not the whole result set.
    expect(panel).toContain("visibleResults.map((exercise) => visibleConnections.get(exercise.id)?.label ?? \"Not mapped\")");
  });

  it("states the shared link once instead of dropping it", () => {
    expect(panel).toContain("sharedConnectionSummary(label, visibleResults.length)");
    expect(panel).toContain("Action links below are measured against <b>{selectedActionLabel}</b>.{sharedConnection");
  });
});
