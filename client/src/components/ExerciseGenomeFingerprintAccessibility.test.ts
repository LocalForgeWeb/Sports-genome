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
    // The labels are focusable controls with their own names, so an instruction
    // telling the reader to select one was a caption describing the markup.
    expect(markup).toContain('class="genome-radar-label-control"');
    expect(markup).toContain('tabindex="0"');
  });

  /**
   * The chart's axis used to be explained in twenty-six words underneath it -
   * two sentences defining 0 and 100. A scale is a thing to draw, but drawing it
   * has to keep the meaning reachable without sight, so the ramp carries the
   * whole sentence as its accessible name.
   */
  it("draws the scale, and still says what its ends mean", () => {
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const markup = renderToStaticMarkup(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] } }));
    expect(markup).toContain('class="genome-scale-key"');
    expect(markup).toContain('aria-label="Scale from 0, little relative demand, to 100, high relative demand"');
    expect(markup).not.toContain("Select a chart label or full label to learn what influences it.");
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
