import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProgressionReviewSummary } from "./ProgressionReviewPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("progression review", () => {
  it("renders conservative exercise progression and distinct deltoid segment signals", () => {
    const markup = renderToStaticMarkup(createElement(ProgressionReviewSummary, {
      exercises: [
        { id: 1, name: "Cable Lateral Raise", targetPrescription: "3 × 8–12", primaryMuscles: ["deltoid_lateral"] },
        { id: 2, name: "Seated Overhead Press", targetPrescription: "3 × 8–12", primaryMuscles: ["deltoid_anterior"] },
      ],
      history: [
        { sessionId: 2, completedAt: "2026-08-20", catalogExerciseId: 1, exerciseName: "Cable Lateral Raise", actualWeight: 20, weightUnit: "lb", actualReps: 12, completed: true },
        { sessionId: 1, completedAt: "2026-08-13", catalogExerciseId: 1, exerciseName: "Cable Lateral Raise", actualWeight: 20, weightUnit: "lb", actualReps: 11, completed: true },
        { sessionId: 2, completedAt: "2026-08-20", catalogExerciseId: 2, exerciseName: "Seated Overhead Press", actualWeight: 65, weightUnit: "lb", actualReps: 6, completed: true },
        { sessionId: 1, completedAt: "2026-08-13", catalogExerciseId: 2, exerciseName: "Seated Overhead Press", actualWeight: 65, weightUnit: "lb", actualReps: 7, completed: true },
      ],
    }));
    expect(markup).toContain("Consider load increase");
    expect(markup).toContain("deltoid lateral");
    expect(markup).toContain("do not diagnose readiness");
  });
});
