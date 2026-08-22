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
  it("defines bounded plain-language guidance for every displayed Muscle Genome role", async () => {
    const { genomeTermInfo } = await import("./ExerciseGenomePanel");

    expect(genomeTermInfo.primeMover.read).toContain("planning label");
    expect(genomeTermInfo.synergist.meaning).toContain("assisting role");
    expect(genomeTermInfo.stabilizer.read).toContain("not a direct activation measure");
  });

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
    expect(markup).toContain("Maeo et al., 2021");
    expect(markup).toContain("protocol- and population-specific growth finding");
    expect(markup).toContain("ROM: Setup-dependent");
  });

  it("renders source-bounded calibration and counterevidence for multiple catalog exercise families", async () => {
    const { ExerciseGenomePanel } = await import("./ExerciseGenomePanel");
    const cases = [
      ["Overhead Cable Triceps Extension", "Maeo et al., 2023", "does not make an overhead variation mandatory"],
      ["Standing Calf Raise", "Kinoshita et al., 2023", "not evidence that seated calf work lacks value"],
      ["Back Squat", "Plotkin et al., 2023", "not a universal glute or quadriceps ranking"],
      ["Romanian Deadlift", "Deadlift-variant EMG systematic review", "EMG is not used as a growth score"],
      ["Machine Chest Press", "Matched modality trial", "default muscle-growth advantage"],
    ] as const;

    for (const [name, source, boundary] of cases) {
      const exercise = exercises.find((item) => item.name === name) || exercises[0];
      const markup = renderToStaticMarkup(createElement(ExerciseGenomePanel, {
        exercise,
        context: { goal: "Muscle growth", currentWorkout: [exercise] },
      }));
      expect(markup).toContain(source);
      expect(markup).toContain(boundary);
    }
  });
});
