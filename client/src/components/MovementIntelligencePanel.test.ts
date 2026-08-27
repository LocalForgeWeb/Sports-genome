import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const movement = {
  id: "test-action", sportId: "test", label: "Test sporting action", movementFamily: "test", bodyActions: ["drive and brace"], jointActions: ["hip extension"], primeMovers: ["gluteus maximus"], assistingMuscles: ["hamstrings"], stabilizers: ["obliques"], contractionRoles: ["concentric drive"], commonForceOrSkillDemand: "project force through a stable base", recommendedExercisePatterns: ["split squat"], recommendedExercises: ["Split Squat"], transferRationale: "Supports the stated action demand.", exerciseSelectionCautions: "Keep the load controllable.", evidenceConfidence: "moderate", sources: ["https://pubmed.ncbi.nlm.nih.gov/1/"], sourceSummary: "Movement-specific context.",
};

const fallback = { id: "test-action", sportId: "test", sportLabel: "Test", label: "Test sporting action", bodyActions: "drive and brace", primaryMuscles: "glutes", stabilizers: "obliques", muscleActions: "hip extension", family: "test", gymTransferCue: "Supports the action." };

describe("Movement Intelligence recommendation context", () => {
  it("labels gym support by purpose and keeps sport practice as the highest-specificity stimulus", async () => {
    const { MovementIntelligencePanel } = await import("./MovementIntelligencePanel");
    const markup = renderToStaticMarkup(createElement(MovementIntelligencePanel, { movement, fallback, workout: [] }));
    expect(markup).toContain("Sport practice remains the highest-specificity stimulus.");
    expect(markup).toContain("Gym support for this action");
    expect(markup).toContain("Movement-transfer support");
    expect(markup).toContain("moderate evidence context");
  });
});
