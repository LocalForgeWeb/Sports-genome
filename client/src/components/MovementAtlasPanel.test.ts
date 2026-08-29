import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { sportMovementProfiles, sportProfiles } from "@/lib/sportMovementDatabase";
import { filterAtlasMovements, MovementAtlasPanel, sortAtlasMovements } from "./MovementAtlasPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
const source = readFileSync(resolve(process.cwd(), "client/src/components/MovementAtlasPanel.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/movement-atlas.css"), "utf8");

describe("Movement Atlas database interaction", () => {
  const track = sportMovementProfiles.filter((movement) => movement.sportId === "track-and-field");
  const selected = track[0];
  it("filters the preserved sport-action database by family and a single natural-language search surface", () => {
    expect(filterAtlasMovements(track, "", selected.family).every((movement) => movement.family === selected.family)).toBe(true);
    expect(filterAtlasMovements(track, "sprint", "All").length).toBeGreaterThan(0);
    expect(source).toContain('aria-label="Search sport actions"');
  });
  it("keeps recommendation order by default and provides deterministic alphabetical and movement-family sorts", () => {
    expect(sortAtlasMovements(track, "recommended")).toEqual(track);
    expect(sortAtlasMovements(track, "a-z").map((movement) => movement.label)).toEqual([...track].map((movement) => movement.label).sort());
    expect(sortAtlasMovements(track, "family").map((movement) => movement.family)).toEqual([...track].map((movement) => movement.family).sort());
    expect(source).toContain('aria-label="Sort movements"');
    expect(source).toContain("Filters");
  });
  it("renders compact sport controls, full-row action selection, the retained analysis fields, and the Body Lab handoff", () => {
    const markup = renderToStaticMarkup(createElement(MovementAtlasPanel, { sportName: "Track & Field", sportId: "track-and-field", sports: sportProfiles, movements: track, selectedMovement: selected, query: "sprint", family: "All", onQuery: vi.fn(), onFamily: vi.fn(), onSport: vi.fn(), onMovement: vi.fn(), onOpenBody: vi.fn() }));
    expect(markup).toContain("Choose sport"); expect(markup).toContain("General profile"); expect(markup).toContain("movements"); expect(markup).toContain(selected.label); expect(markup).toContain("Physiological demand"); expect(markup).toContain("Programming context"); expect(markup).toContain("Trace in Body Lab");
  });
  it("keeps qualitative evidence language and deliberate visual press feedback without ranking or activation claims", () => {
    expect(source).toContain("not direct activation readings"); expect(source).toContain('emitInteractionFeedback(); onMovement(movement);'); expect(styles).toContain('.atlas-action-item:active'); expect(styles).toContain('transform: scale(.97);');
  });
});
