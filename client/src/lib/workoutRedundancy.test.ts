import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { analyzeWorkoutRedundancy } from "./workoutRedundancy";

describe("workout redundancy analysis", () => {
  const find = (name: string) => exercises.find((exercise) => exercise.name === name) || exercises[0];

  it("separates likely duplicate exposure from purposeful reinforcement and complementary work", () => {
    const bench = find("Barbell Bench Press");
    const dumbbellBench = find("Dumbbell Bench Press");
    const cableFly = find("Cable Fly");
    const row = find("Seated Cable Row");
    const findings = analyzeWorkoutRedundancy([bench, dumbbellBench, cableFly, row]);
    expect(findings.some((finding) => finding.classification === "Likely duplicate")).toBe(true);
    expect(findings.some((finding) => finding.classification === "Useful reinforcement")).toBe(true);
    expect(findings.some((finding) => finding.classification === "Complementary")).toBe(true);
    expect(findings[0]?.reason).toMatch(/purpose|planning|complementary/i);
  });
});
