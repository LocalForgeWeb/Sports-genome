import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    default: actual,
    useState: <T,>(initial: T) => [initial === "fingerprint" ? "muscles" : initial, vi.fn()] as [T, ReturnType<typeof vi.fn>],
  };
});

describe("Exercise Genome muscle-targeting disclosure", () => {
  it("renders evidence tier, causal mechanics input summary, and uncertainty in the Muscle Genome UI", async () => {
    const { ExerciseGenomePanel } = await import("./ExerciseGenomePanel");
    const seatedCurl = exercises.find((exercise) => exercise.name === "Seated Leg Curl") || exercises[0];
    const markup = renderToStaticMarkup(createElement(ExerciseGenomePanel, {
      exercise: seatedCurl,
      context: { goal: "Muscle growth", currentWorkout: [seatedCurl] },
    }));

    expect(markup).toContain("Direct longitudinal exercise evidence");
    expect(markup).toContain("Key mechanics inputs");
    expect(markup).toContain("not a measured force");
  });
});
