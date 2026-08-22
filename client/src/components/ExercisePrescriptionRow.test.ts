import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExercisePrescriptionRow } from "./ExercisePrescriptionRow";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("Training Day exercise prescription row", () => {
  it("keeps the populated exercise content and action controls in distinct markup regions", () => {
    const exercise = exercises.find((item) => item.name === "Barbell Bench Press") || exercises[0];
    const markup = renderToStaticMarkup(createElement(ExercisePrescriptionRow, { exercise, index: 0, prescription: "3 × 8–12", settings: { rpe: "RPE 8", rest: "90 sec", notes: "", completed: false }, onPrescription: () => undefined, onSettings: () => undefined, onInspect: () => undefined, onRemove: () => undefined }));
    expect(markup).toContain("custom-row-actions");
    expect(markup).toContain(`Remove ${exercise.name}`);
    expect(markup).toContain(`${exercise.name} prescription`);
    expect(markup).toContain("Mark complete");
  });
});
