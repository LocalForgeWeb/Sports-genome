// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sportMovementProfiles, sportProfiles } from "@/lib/sportMovementDatabase";
import { MovementAtlasPanel } from "./MovementAtlasPanel";

/**
 * The Movement explorer's main action is the movement's exercises. Its only action
 * used to be "Explore involved muscles", so an athlete looking at Bridge reached
 * exercises only through a muscle. Both are here now, and each does its own thing.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(() => { cleanup(); });

const wrestling = sportMovementProfiles.filter((movement) => movement.sportId === "wrestling");
const bridge = wrestling.find((movement) => movement.id === "wrestling-19")!;

function renderAtlas() {
  const handlers = { onFindExercises: vi.fn(), onOpenBody: vi.fn() };
  render(createElement(MovementAtlasPanel, { sportName: "Wrestling", sportId: "wrestling", sports: sportProfiles, movements: wrestling, selectedMovement: bridge, query: "", family: "All", onQuery: vi.fn(), onFamily: vi.fn(), onSport: vi.fn(), onMovement: vi.fn(), ...handlers }));
  return handlers;
}

describe("Movement explorer next steps", () => {
  it("names the movement on the primary action and opens its exercises, not its muscles", () => {
    const handlers = renderAtlas();
    expect(screen.getByText("Explore exercises that support this movement.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Find exercises for Bridge" }));
    expect(handlers.onFindExercises).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenBody).not.toHaveBeenCalled();
  });

  it("keeps Explore involved muscles as a separate, secondary action", () => {
    const handlers = renderAtlas();
    const muscles = screen.getByRole("button", { name: "Explore involved muscles" });
    expect(muscles.className).toContain("atlas-trace-secondary");
    fireEvent.click(muscles);
    expect(handlers.onOpenBody).toHaveBeenCalledTimes(1);
    expect(handlers.onFindExercises).not.toHaveBeenCalled();
  });
});
