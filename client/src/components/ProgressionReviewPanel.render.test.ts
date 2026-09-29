// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises as catalogExercises } from "@/lib/exerciseCatalog";

// Two weeks of Cable Lateral Raise at high effort: a "Needs review" signal for
// the lateral deltoid, which is what offers catalog additions.
const cableLateralRaise = catalogExercises.find((exercise) => exercise.name === "Cable Lateral Raise")!;
const history = [
  { sessionId: 2, completedAt: "2026-08-20", catalogExerciseId: cableLateralRaise.id, exerciseName: cableLateralRaise.name, actualWeight: 20, weightUnit: "lb", actualReps: 6, actualRpe: 9.5, completed: true },
  { sessionId: 1, completedAt: "2026-08-13", catalogExerciseId: cableLateralRaise.id, exerciseName: cableLateralRaise.name, actualWeight: 20, weightUnit: "lb", actualReps: 7, actualRpe: 9, completed: true },
];

vi.mock("@/lib/trpc", () => ({
  trpc: { workoutLog: { progressionHistory: { useQuery: () => ({ data: history, isLoading: false }) } } },
}));

import { ProgressionReviewPanel } from "./ProgressionReviewPanel";

const renderPanel = (props: { bodyWeight?: number; weightUnit?: "lb" | "kg"; availableEquipment?: string[] }) => render(createElement(ProgressionReviewPanel, {
  workout: [cableLateralRaise],
  prescriptions: {},
  settings: {},
  onAddSuggestion: () => undefined,
  ...props,
}));

describe("Progression review reads the athlete from its caller", () => {
  afterEach(() => { cleanup(); localStorage.clear(); });

  it("offers additions for the equipment it is given, not the old unscoped profile", () => {
    // The bare key is removed once a profile moves to the account-scoped key, so
    // anything left under it belongs to no one the panel is showing.
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ baseline: { bodyWeight: 180, weightUnit: "lb", equipment: { availableEquipment: ["Barbell"] } } }));
    renderPanel({ availableEquipment: ["Dumbbells"] });
    expect(screen.getByText("Add Dumbbell Lateral Raise")).toBeTruthy();
    expect(screen.queryByText("Add Barbell Overhead Press")).toBeNull();
  });

  it("reads body weight only from its caller", () => {
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ baseline: { bodyWeight: 180, weightUnit: "lb" } }));
    renderPanel({});
    expect(screen.queryByText(/Relative to your bodyweight/)).toBeNull();
    cleanup();
    renderPanel({ bodyWeight: 80, weightUnit: "kg" });
    expect(screen.getByText(/Relative to your bodyweight/)).toBeTruthy();
  });
});
