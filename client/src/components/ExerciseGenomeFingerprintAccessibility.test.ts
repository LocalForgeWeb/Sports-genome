import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExerciseGenomePanel } from "./ExerciseGenomePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("Exercise Genome fingerprint term learning", () => {
  it("pairs the visual chart with accessible full-label learn-more controls", () => {
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const markup = renderToStaticMarkup(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] } }));
    expect(markup).toContain('aria-label="Exercise Genome fingerprint chart with eight labeled dimensions"');
    expect(markup).toContain("Hypertrophy potential");
    expect(markup).toContain("Stimulus-to-fatigue ratio");
    expect(markup).toContain('aria-label="Learn about Hypertrophy potential"');
    expect(markup).toContain('aria-label="Learn about Stimulus-to-fatigue ratio"');
    expect(markup).toContain("Select a chart label or full label to learn what influences it.");
  });
});
