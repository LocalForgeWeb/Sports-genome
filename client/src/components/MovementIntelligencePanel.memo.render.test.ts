// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MovementIntelligencePanel } from "./MovementIntelligencePanel";
import { exercises } from "@/lib/exerciseCatalog";
import { analyzeWorkoutForMovement, getMovementAssistance, lookupEnrichedMovement } from "@/lib/movementProgramAnalysis";
import { sportMovementProfiles } from "@/lib/sportMovementDatabase";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

// Pass-through spies, so the test can count how often the panel does the work.
vi.mock("@/lib/movementProgramAnalysis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/movementProgramAnalysis")>();
  return {
    ...actual,
    getMovementAssistance: vi.fn(actual.getMovementAssistance),
    analyzeWorkoutForMovement: vi.fn(actual.analyzeWorkoutForMovement),
  };
});

// A real action with a research record and more support exercises than the first three shown.
const fallback = sportMovementProfiles.find((profile) => {
  const enriched = lookupEnrichedMovement(profile.sportId, profile.id);
  return enriched && getMovementAssistance(enriched, profile, 6).length > 3;
})!;
const movement = lookupEnrichedMovement(fallback.sportId, fallback.id)!;
const workout = exercises.slice(0, 3);

const panel = (currentWorkout: typeof workout) =>
  createElement(MovementIntelligencePanel, { movement, fallback, workout: currentWorkout, onAdd: () => undefined, onInspect: () => undefined });

/**
 * Support exercises are found by scoring the whole catalog. The panel did that
 * inline, so every Home re-render on Matches, and every "See more" tap, scored
 * about 300 exercises again for the same action and the same stack.
 */
describe("Movement intelligence does its heavy reading once per input", () => {
  beforeEach(() => {
    vi.mocked(getMovementAssistance).mockClear();
    vi.mocked(analyzeWorkoutForMovement).mockClear();
  });
  afterEach(() => { cleanup(); });

  it("reuses the analysis and the support list when nothing they read has changed", () => {
    expect(fallback).toBeTruthy();
    const view = render(panel(workout));
    expect(getMovementAssistance).toHaveBeenCalledTimes(1);
    expect(analyzeWorkoutForMovement).toHaveBeenCalledTimes(1);

    view.rerender(panel(workout));
    expect(getMovementAssistance).toHaveBeenCalledTimes(1);
    expect(analyzeWorkoutForMovement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(/See \d+ more support exercises/));
    expect(screen.getByText("Show fewer support exercises")).toBeTruthy();
    expect(getMovementAssistance).toHaveBeenCalledTimes(1);
    expect(analyzeWorkoutForMovement).toHaveBeenCalledTimes(1);
  });

  it("re-reads only the coverage analysis when the stack changes", () => {
    const view = render(panel(workout));
    view.rerender(panel([...workout, exercises[3]]));
    expect(analyzeWorkoutForMovement).toHaveBeenCalledTimes(2);
    expect(getMovementAssistance).toHaveBeenCalledTimes(1);
  });
});
