// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { analyzeExerciseContext, getExerciseGenome, type GenomeContext } from "@/lib/exerciseGenome";
import { ExerciseGenomePanel } from "./ExerciseGenomePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
const context: GenomeContext = { goal: "Muscle growth", currentWorkout: [exercise] };

/**
 * The panel stamps two letters that are not the exercise's catalog tier: the
 * contextual fit in its head and each muscle's involvement tier. A stamp is
 * announced by its name, so each has to say which of those it is.
 */
describe("Exercise Genome grade stamps", () => {
  afterEach(cleanup);

  it("names the head stamp as the contextual fit and each muscle stamp as its involvement tier", () => {
    const view = render(createElement(ExerciseGenomePanel, { exercise, context, compactHead: true }));
    const { grade } = analyzeExerciseContext(exercise, context);
    // October 4: the contextual fit is part of the Context view, not the panel's head.
    fireEvent.click(view.getByRole("tab", { name: "Context" }));
    expect(view.getByRole("img", { name: `Contextual fit ${grade}` }).textContent).toBe(grade);

    fireEvent.click(view.getByRole("tab", { name: "Muscle Genome" }));
    const tiers = getExerciseGenome(exercise).muscleProfile.map((entry) => entry.tier);
    expect(tiers.length).toBeGreaterThan(0);
    const stamps = view.getAllByRole("img", { name: /^Muscle involvement tier / });
    expect(stamps.map((stamp) => stamp.textContent)).toEqual(tiers);

    expect(view.queryByRole("img", { name: /Catalog planning tier/ })).toBeNull();
  });
});
