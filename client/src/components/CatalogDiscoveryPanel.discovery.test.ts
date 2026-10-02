// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogDiscoveryPanel } from "./CatalogDiscoveryPanel";
import { defaultCatalogFilters } from "@/lib/catalogDiscovery";
import { exercises } from "@/lib/exerciseCatalog";
import { discoverMovementExercises, movementResultSet, type DiscoveryContext } from "@/lib/movementDiscovery";

afterEach(cleanup);

const handFighting = discoverMovementExercises("wrestling", "wrestling-17", exercises);

function draw(discovery: DiscoveryContext, over: Partial<React.ComponentProps<typeof CatalogDiscoveryPanel>> = {}) {
  const onDiscoveryChange = vi.fn();
  const onFiltersChange = vi.fn();
  render(React.createElement(CatalogDiscoveryPanel, {
    exercises, filters: over.filters ?? defaultCatalogFilters, favoriteIds: new Set<number>(),
    onFiltersChange, onToggleFavorite: vi.fn(), onInspect: vi.fn(), onAdd: vi.fn(),
    selectedActionLabel: "penetration step", connectionForExercise: () => ({ label: "Not mapped", detail: "" }),
    discovery, onDiscoveryChange, movement: discovery.mode === "movement" ? discoverMovementExercises(discovery.sportId, discovery.movementId, exercises) : null,
    ...over,
  }));
  return { onDiscoveryChange, onFiltersChange };
}

describe("catalog scoped to a sport action", () => {
  it("heads the list with the action and its sport, counts the scoped set, and never mentions the profile's action", () => {
    draw({ mode: "movement", sportId: "wrestling", movementId: "wrestling-17" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Hand fighting");
    expect(document.querySelector(".catalog-discovery-scope-label")?.textContent).toBe("Wrestling · exercises for");
    expect(document.querySelector(".catalog-discovery-heading > span")?.textContent).toBe(`${movementResultSet(handFighting).length} exercises`);
    expect(document.body.textContent).not.toContain("penetration step");
    expect(document.querySelector(".catalog-discovery-action-scope")).toBeNull();
  });

  it("groups the rows by tier with a reason on each, and keeps muscle-only matches behind a line", () => {
    draw({ mode: "movement", sportId: "wrestling", movementId: "wrestling-17" });
    const heads = Array.from(document.querySelectorAll(".catalog-discovery-tier-head")).map((node) => node.textContent);
    expect(heads[0]).toBe("Named in its movement record");
    expect(document.querySelector(".catalog-match-reason")?.textContent).toMatch(/^Named in the hand fighting record as/);
    expect(document.body.textContent).not.toContain("Barbell Bench Press");
    const toggle = screen.getByRole("button", { name: /only share a muscle with hand fighting/ });
    fireEvent.click(toggle);
    // The muscle-only matches join the scoped set, counted, and still never ahead of a movement match.
    expect(document.querySelector(".catalog-discovery-heading > span")?.textContent).toBe(`${movementResultSet(handFighting).length + handFighting.muscleOnly.length} exercises`);
    expect(screen.getByRole("button", { name: /Hide the \d+ exercises that only share a muscle/ })).toBeTruthy();
  });

  it("offers the whole catalog as an explicit mode, not a fallback", () => {
    const { onDiscoveryChange } = draw({ mode: "movement", sportId: "wrestling", movementId: "wrestling-17" });
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs[0]).toBe("Hand fighting");
    expect(tabs[1]).toBe("All exercises");
    fireEvent.click(screen.getByRole("tab", { name: "All exercises" }));
    expect(onDiscoveryChange).toHaveBeenCalledWith({ mode: "all" });
  });

  it("keeps the action when a filter empties the set, and offers Clear filters", () => {
    draw({ mode: "movement", sportId: "wrestling", movementId: "wrestling-17" }, { filters: { ...defaultCatalogFilters, equipment: "Sled", query: "xyzzy" } });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Hand fighting");
    expect(document.querySelector(".catalog-discovery-empty strong")?.textContent).toBe('Nothing matches "xyzzy" with these filters among the hand fighting exercises.');
    expect(screen.getByRole("button", { name: "Remove the Sled filter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Browse all exercises" })).toBeTruthy();
  });

  it("says when an action has no mapping and offers its muscles instead of random exercises", () => {
    draw({ mode: "movement", sportId: "wrestling", movementId: "wrestling-404" });
    expect(document.querySelector(".catalog-discovery-unmapped strong")?.textContent).toContain("No movement mapping");
    expect(document.querySelectorAll(".catalog-discovery-card")).toHaveLength(0);
  });
});

describe("catalog scoped to a muscle", () => {
  it("heads the list with the muscle, as the explicit muscle mode", () => {
    draw({ mode: "muscle", muscleId: "chest" }, { filters: { ...defaultCatalogFilters, muscle: "chest" } });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Pectoralis major");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)[0]).toBe("Pectoralis major");
  });
});
