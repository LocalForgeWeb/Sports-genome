import { describe, expect, it } from "vitest";
import {
  getStrengthCatalogSelectionContext,
  resolveStrengthObservationRoute,
  strengthDomainDefinitions,
  strengthObservationRoutes,
  strengthRegionDefinitions,
} from "../../../shared/strengthGenomeDefinitions";
import { getStrengthReferenceCandidate } from "../../../shared/strengthReferenceQualification";
import { piper2021PreacherCurlReferenceId } from "../../../shared/piper2021PreacherCurlReference";
import { exercises } from "./exerciseCatalog";

describe("Strength Genome definitions", () => {
  it("keeps functional domains distinct from athlete-facing anatomical regions", () => {
    expect(strengthDomainDefinitions.length).toBeGreaterThan(20);
    expect(strengthRegionDefinitions.length).toBeGreaterThan(12);
    expect(strengthDomainDefinitions.every(domain => domain.evidenceStatus === "AWAITING_EVIDENCE")).toBe(true);
    expect(new Set(strengthDomainDefinitions.map(domain => domain.id)).size).toBe(strengthDomainDefinitions.length);
    expect(new Set(strengthRegionDefinitions.map(region => region.id)).size).toBe(strengthRegionDefinitions.length);
  });

  it("routes recognized tests only to broad non-numeric observation context", () => {
    const squat = resolveStrengthObservationRoute("Barbell Back Squat");
    expect(squat?.domainIds).toEqual(expect.arrayContaining(["knee_extension", "hip_extension"]));
    expect(squat?.regionIds).toEqual(expect.arrayContaining(["quadriceps", "glutes"]));
    expect(squat?.boundary).toContain("does not directly measure");
    expect(strengthObservationRoutes.every(route => route.basis === "EXERCISE_MOVEMENT_CLASSIFICATION")).toBe(true);
    expect(JSON.stringify(strengthObservationRoutes)).not.toContain("percentile");
  });

  it("traces only the exact Preacher Curl route to the installed Piper candidate without promoting other curls to a population comparison", () => {
    const preacherCurl = resolveStrengthObservationRoute("Preacher Curl");
    const machinePreacherCurl = resolveStrengthObservationRoute("Machine Preacher Curl");

    expect(preacherCurl?.reviewedReferenceCandidateIds).toEqual([piper2021PreacherCurlReferenceId]);
    expect(preacherCurl?.boundary).toContain("every source-specific condition");
    expect(machinePreacherCurl?.reviewedReferenceCandidateIds ?? []).toEqual([]);
    expect(machinePreacherCurl?.boundary).toContain("generic strength rank");
    expect(getStrengthReferenceCandidate(preacherCurl?.reviewedReferenceCandidateIds?.[0] ?? "")?.id).toBe(piper2021PreacherCurlReferenceId);
    expect(getStrengthCatalogSelectionContext(exercises.find((exercise) => exercise.name === "Preacher Curl")!).reviewedReferenceCandidateIds).toEqual([piper2021PreacherCurlReferenceId]);
  });

  it("routes representative selectable catalog exercises across movement families without creating regional strength scores", () => {
    const expectedRoutes = [
      ["Barbell Bench Press", ["horizontal_press", "elbow_extension"], ["chest", "triceps", "shoulders"]],
      ["Barbell Overhead Press", ["vertical_press", "elbow_extension"], ["shoulders", "triceps"]],
      ["Seated Cable Row", ["horizontal_pull", "elbow_flexion"], ["upper_back", "lats", "biceps"]],
      ["Lat Pulldown", ["vertical_pull", "elbow_flexion"], ["lats", "upper_back", "biceps"]],
      ["Barbell Curl", ["elbow_flexion"], ["biceps"]],
      ["Back Squat", ["knee_extension", "hip_extension"], ["quadriceps", "glutes", "hamstrings"]],
      ["Conventional Deadlift", ["hip_extension", "trunk_extension"], ["glutes", "hamstrings", "spinal_erectors"]],
      ["Barbell Hip Thrust", ["hip_extension"], ["glutes", "hamstrings"]],
      ["Seated Leg Curl", ["knee_flexion"], ["hamstrings"]],
      ["Leg Extension", ["knee_extension"], ["quadriceps"]],
      ["Standing Calf Raise", ["plantarflexion"], ["calves"]],
      ["RKC Plank", ["anti_extension"], ["abdominals"]],
    ] as const;

    expectedRoutes.forEach(([exerciseName, domainIds, regionIds]) => {
      expect(exercises.some((exercise) => exercise.name === exerciseName), `${exerciseName} is selectable from the catalog`).toBe(true);
      const route = resolveStrengthObservationRoute(exerciseName);
      expect(route?.domainIds).toEqual(expect.arrayContaining(domainIds));
      expect(route?.regionIds).toEqual(expect.arrayContaining(regionIds));
      expect(route?.boundary).toContain("does not");
      expect(route?.basis).toBe("EXERCISE_MOVEMENT_CLASSIFICATION");
    });
  });

  it("keeps selected catalog muscle labels and broad recorded-route context distinct across exercise families", () => {
    ["Barbell Bench Press", "Lat Pulldown", "Conventional Deadlift", "RKC Plank"].forEach((exerciseName) => {
      const exercise = exercises.find((entry) => entry.name === exerciseName);
      expect(exercise, `${exerciseName} is selectable`).toBeDefined();
      const context = getStrengthCatalogSelectionContext(exercise!);
      expect(context.primaryMuscles).toEqual(exercise!.primaryMuscles);
      expect(context.supportingMuscles).toEqual(exercise!.secondaryMuscles);
      expect(context.domainLabels.length).toBeGreaterThan(0);
      expect(context.boundary).toContain("does not");
      expect(JSON.stringify(context)).not.toMatch(/percentile|tier|force score/i);
    });
  });

  it("does not promote reviewed reliability or reference literature into unqualified athlete percentiles or tiers", async () => {
    const { readFileSync } = await import("node:fs");
    const panelSource = readFileSync(new URL("../components/StrengthGenomePanel.tsx", import.meta.url), "utf8");
    expect(panelSource).toContain("A percentile, universal rank, and regional force score are not shown");
    expect(panelSource).toContain("No regional strength tier is shown until supporting evidence is available.");
    expect(panelSource).not.toContain("Your percentile");
    expect(panelSource).not.toContain("SS+");
  });
});
