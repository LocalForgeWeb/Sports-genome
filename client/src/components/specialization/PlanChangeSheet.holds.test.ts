// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import type { RecommendationCandidate } from "@/lib/specialization/recommendations";
import { buildDaySlots, commitDay, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { regionDataFor } from "@shared/specialization/registry";
import { PlanChangeSheet } from "./PlanChangeSheet";

/**
 * The add sheet's "planned as" lines read a hold the way Train and the planned totals read it
 * (workoutPlanner `prescriptionOf` with the variant's measure): a hold's default is the goal's
 * set count with a hold's target, never the goal's rep range.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const data = regionDataFor("forearm")!;
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const slots = buildDaySlots(["Push", "Pull", "Legs"]);
// Pull: Underhand Barbell Row, then Dead Hang (seconds), neither with a prescription of its own.
const weeks: Record<number, WeeklyDayStore> = { 1: commitDay(emptyDayStore(), slots[1].key, { workout: [byId(45), byId(143)], prescriptions: {}, settings: {}, context: [] }) };
const farmerHold: RecommendationCandidate = {
  catalogExerciseId: 145, name: byId(145).name, variantId: "cat-145", equipment: byId(145).equipment ?? null, relevance: "direct_hold",
  mappingIds: [], equipmentAvailable: true, alreadyPlanned: false, laterality: "either", why: "", alsoLoads: [],
};

afterEach(() => cleanup());

async function addFarmerHold(option: string | null) {
  render(createElement(PlanChangeSheet, {
    data, side: "right", nodeId: "forearm.fds", candidates: [farmerHold], initialExerciseId: 145, catalog: exercises,
    plan: { slots, weeks, week: 1 }, goal: "Athleticism", onApply: vi.fn(() => ({ ok: true as const, undo: () => {} })), onClose: vi.fn(),
  }));
  const sheet = screen.getByRole("dialog");
  await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Day 02 · Pull/ })); });
  if (option) await act(async () => { fireEvent.click(within(within(sheet).getByRole("group", { name: "Where it goes" })).getByRole("radio", { name: new RegExp(`^${option}`) })); });
  return {
    plannedAs: within(sheet).getByText(/^Planned as /).textContent,
    moved: within(sheet).queryAllByText(/moves down a place/).map((note) => note.textContent),
  };
}

describe("the add sheet on a hold", () => {
  it("plans a hold added first as the goal's 4 sets of a hold's target, and says a hold moved down changes its sets", async () => {
    const first = await addFarmerHold("First");
    expect(first.plannedAs).toBe("Planned as 4 × 30 sec, the default for that place in the day.");
    // Dead Hang moves from the second place (4 sets) to the third (3 sets): in seconds, not "3–6 reps".
    expect(first.moved).toEqual(["Dead Hang moves down a place, so it is planned as 3 × 30 sec instead of 4 × 30 sec."]);
  });

  it("plans a hold added at the end as the third place's 3 sets", async () => {
    const end = await addFarmerHold(null);
    expect(end.plannedAs).toBe("Planned as 3 × 30 sec, the default for that place in the day.");
    expect(end.moved).toEqual([]);
  });
});
