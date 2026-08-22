import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, default: actual, useState: <T,>(initial: T) => [initial === "fingerprint" ? "mechanics" : initial, vi.fn()] as [T, ReturnType<typeof vi.fn>] };
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("Exercise Genome mechanics learning", () => {
  it("renders every mechanics concept as a native keyboard-accessible learn-more button", async () => {
    const { ExerciseGenomePanel } = await import("./ExerciseGenomePanel");
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const markup = renderToStaticMarkup(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] } }));
    ["Movement pattern + joint action", "Force direction", "chain", "stance", "Resistance + fatigue curve", "likely sticking region", "Local fatigue", "Systemic fatigue", "Axial fatigue", "Grip fatigue"].forEach((term) => expect(markup).toContain(term));
    expect((markup.match(/genome-term-button/g) || []).length).toBeGreaterThanOrEqual(12);
  });
});
