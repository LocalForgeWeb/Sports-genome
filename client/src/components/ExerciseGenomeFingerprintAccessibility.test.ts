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

describe("Exercise Genome fingerprint labelling", () => {
  it("names each dimension once, not beside its bar and again in a legend below", () => {
    // The panel rendered a legend of learn-more buttons underneath the bars with
    // the same label and the same action as the button on each bar, so all eight
    // dimension names were printed twice in consecutive blocks.
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const markup = renderToStaticMarkup(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] } }));
    const occurrences = (needle: string) => markup.split(needle).length - 1;
    for (const label of ["Hypertrophy potential", "Strength expression", "Power expression", "Stability demand", "Mobility demand", "Stimulus-to-fatigue ratio", "Technical skill demand", "Practicality"]) {
      expect(occurrences(`>${label}<`), `${label} should be printed once`).toBe(1);
    }
    expect(markup).not.toContain("genome-fingerprint-legend");
  });
});
