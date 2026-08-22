import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { buildMuscleTargetingEstimate } from "./muscleTargetingModel";

const fallback = exercises[0];
const byName = (name: string) => exercises.find((exercise) => exercise.name === name) || fallback;

describe("mechanics-aware muscle targeting model", () => {
  it("keeps the full causal mechanics pathway visible as conditional inputs rather than scientific constants", () => {
    const estimate = buildMuscleTargetingEstimate(byName("Romanian Deadlift"), "hamstrings", "Prime mover");
    expect(estimate.mechanicsFactors.map((factor) => factor.id)).toEqual([
      "jointAngles", "externalForceVector", "externalMoment", "momentArms", "architecture",
      "forceLength", "forceVelocity", "contractionType", "biarticularPosition", "stabilization",
    ]);
    expect(estimate.mechanicsFactors.every((factor) => factor.status !== "Configured descriptor" || factor.id === "externalForceVector" || factor.id === "biarticularPosition")).toBe(true);
    expect(estimate.uncertainty).toContain("not individually measured");
  });

  it("prioritizes direct longitudinal exercise evidence above a mechanics-only ranking when the evidence applies to the named muscle", () => {
    const seatedCurlHamstrings = buildMuscleTargetingEstimate(byName("Seated Leg Curl"), "hamstrings", "Prime mover");
    const seatedCurlCalves = buildMuscleTargetingEstimate(byName("Seated Leg Curl"), "calves", "Synergist");

    expect(seatedCurlHamstrings.evidenceTier).toBe("Direct longitudinal exercise evidence");
    expect(seatedCurlHamstrings.directEvidenceNote).toContain("biarticular-hamstring");
    expect(seatedCurlHamstrings.score).toBeGreaterThanOrEqual(82);
    expect(seatedCurlCalves.evidenceTier).toBe("Conditional mechanics ranking");
  });

  it("does not use the catalog muscle grade as a hidden muscle-targeting constant", () => {
    const squat = byName("Back Squat");
    const changedGrade = { ...squat, muscleGrade: "F" as const };
    const baseline = buildMuscleTargetingEstimate(squat, "quads", "Prime mover");
    const altered = buildMuscleTargetingEstimate(changedGrade, "quads", "Prime mover");

    expect(altered.score).toBe(baseline.score);
  });

  it("materially changes the rank when the mechanics pathway changes, instead of only changing explanatory text", () => {
    const rdl = byName("Romanian Deadlift");
    const neutralized = { ...rdl, name: "Controlled Barbell Pull", movement: "General pull", qualities: rdl.qualities.filter((quality) => quality !== "power") };
    const hingeTargeting = buildMuscleTargetingEstimate(rdl, "hamstrings", "Prime mover");
    const neutralTargeting = buildMuscleTargetingEstimate(neutralized, "hamstrings", "Prime mover");

    expect(hingeTargeting.mechanicsFactors.find((factor) => factor.id === "forceLength")?.rankingInfluence).toBeGreaterThan(neutralTargeting.mechanicsFactors.find((factor) => factor.id === "forceLength")?.rankingInfluence || 0);
    expect(hingeTargeting.score).not.toBe(neutralTargeting.score);
  });

  it("treats stabilization and biarticular position as conditional contexts, not measured force shares", () => {
    const nordic = buildMuscleTargetingEstimate(byName("Nordic Hamstring Curl"), "hamstrings", "Prime mover");
    const stabilization = nordic.mechanicsFactors.find((factor) => factor.id === "stabilization");
    const biarticular = nordic.mechanicsFactors.find((factor) => factor.id === "biarticularPosition");

    expect(stabilization?.context).toContain("not directly measured");
    expect(biarticular?.context).toContain("more than one joint");
  });
});
