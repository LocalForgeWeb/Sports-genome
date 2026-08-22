import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExerciseGenomePanel } from "./ExerciseGenomePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("Exercise Genome fingerprint term learning", () => {
  it("exposes every chart dimension as a keyboard-focusable learn-more control", () => {
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const markup = renderToStaticMarkup(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] } }));
    expect(markup).toContain('role="button"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain("Learn about Hypertrophy potential");
    expect(markup).toContain("Learn about Stimulus-to-fatigue ratio");
    expect(markup).toContain("Click or focus any chart label");
  });
});
