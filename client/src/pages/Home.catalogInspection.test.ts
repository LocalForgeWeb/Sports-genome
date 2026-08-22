import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("catalog inspection evidence route", () => {
  it("mounts Exercise Genome with the inspected catalog record so study calibration is visible from catalog inspection", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("<ExerciseGenomePanel exercise={inspectedExercise}");
    expect(source).toContain("{inspectedExercise && <div className=\"fixed inset-0");
  });
});
