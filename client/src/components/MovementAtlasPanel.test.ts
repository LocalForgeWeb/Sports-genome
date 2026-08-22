import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { sportMovementProfiles, sportProfiles } from "@/lib/sportMovementDatabase";
import { filterAtlasMovements, MovementAtlasPanel } from "./MovementAtlasPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("Movement Atlas database interaction", () => {
  const track = sportMovementProfiles.filter((movement) => movement.sportId === "track-and-field");
  const selected = track[0];

  it("filters one sport’s database by family and natural-language search", () => {
    const familyMatches = filterAtlasMovements(track, "", selected.family);
    const sprintMatches = filterAtlasMovements(track, "sprint", "All");
    expect(familyMatches.length).toBeGreaterThan(0);
    expect(familyMatches.every((movement) => movement.family === selected.family)).toBe(true);
    expect(sprintMatches.length).toBeGreaterThan(0);
    expect(sprintMatches.every((movement) => movement.sportId === "track-and-field")).toBe(true);
  });

  it("renders sport switching, filtered count, movement detail, and the Body Lab handoff", () => {
    const matches = filterAtlasMovements(track, "sprint", "All");
    const markup = renderToStaticMarkup(createElement(MovementAtlasPanel, {
      sportName: "Track & Field", sportId: "track-and-field", sports: sportProfiles, movements: track, selectedMovement: selected,
      query: "sprint", family: "All", onQuery: vi.fn(), onFamily: vi.fn(), onSport: vi.fn(), onMovement: vi.fn(), onOpenBody: vi.fn(),
    }));
    expect(markup).toContain("Choose sport");
    expect(markup).toContain(`${matches.length}`);
    expect(markup).toContain(selected.label);
    expect(markup).toContain("Prime movers");
    expect(markup).toContain("Trace in Body Lab");
  });
});
