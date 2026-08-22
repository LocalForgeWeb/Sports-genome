import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { WorkoutHealthPanel } from "./WorkoutHealthPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("WorkoutHealthPanel redundancy report", () => {
  it("renders pair-level overlap as a planning estimate rather than a readiness measurement", () => {
    const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press") || exercises[0];
    const dumbbellBench = exercises.find((exercise) => exercise.name === "Dumbbell Bench Press") || exercises[1];
    const markup = renderToStaticMarkup(createElement(WorkoutHealthPanel, {
      workout: [bench, dumbbellBench], prescriptions: {}, settings: {}, goal: "Muscle growth",
    }));
    expect(markup).toContain("Overlap map / planning estimate");
    expect(markup).toContain("Barbell Bench Press");
    expect(markup).toContain("Planning estimates use the current prescription");
  });
});
