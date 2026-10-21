import { describe, expect, it, vi } from "vitest";
import type { ExerciseVariant, Laterality, SetMeasure, VariantMapping } from "@shared/specialization/types";

/**
 * The logger's region list, injected: a production region with one hold, and a fixture region
 * (tests only, never registered in production) whose variant must not reach the logger. The
 * policy reads `loggingRegions` (variants and mappings only), never the full registry.
 */
vi.mock("@shared/specialization/loggingRegions", () => {
  const variant = (catalogExerciseId: number, measure: string, laterality: string) => ({
    id: `cat-${catalogExerciseId}`, catalogExerciseId, catalogName: `Exercise ${catalogExerciseId}`, organization: "task", forearmOrientation: "neutral",
    wristPosition: "neutral", gripType: "neutral", straps: "unknown", laterality, phase: "unspecified", measure, deliberateHold: measure === "seconds", elbowAngleDeg: null, notes: null,
  });
  const region = (id: string, status: string, variants: unknown[], mappings: unknown[]) => ({ region: { id, label: id, heading: id, sortOrder: 0, status }, variants, mappings });
  const strapsGrip = { id: "m-143", versionKey: "test", variantId: "cat-143", nodeId: "forearm.fds", actionId: null, relationship: "direct", muscleMode: "isometric", evidenceBasis: "inference", allocation: "shared", requiresNoStraps: true, rationale: "", reviewStatus: "draft", sources: [] };
  return {
    specializationLoggingRegions: [
      region("forearm", "production", [variant(143, "seconds", "bilateral")], [strapsGrip]),
      region("deltoid", "fixture", [variant(900, "seconds", "unilateral")], []),
    ],
  };
});

import { defaultLoggingPolicy, loggingPolicyFor, productionMappings, productionVariants } from "@shared/specialization/loggingPolicy";

const variant = (catalogExerciseId: number, measure: SetMeasure, laterality: Laterality): ExerciseVariant => ({
  id: `cat-${catalogExerciseId}`, catalogExerciseId, catalogName: `Exercise ${catalogExerciseId}`, organization: "single_joint", forearmOrientation: "neutral",
  wristPosition: "neutral", gripType: "neutral", straps: "unknown", laterality, phase: "concentric_eccentric", measure, deliberateHold: measure === "seconds", elbowAngleDeg: null, notes: null,
});
const mapping = (variantId: string, overrides: Partial<VariantMapping> = {}): VariantMapping => ({
  id: `${variantId}-${overrides.nodeId ?? "forearm.fds"}`, versionKey: "test", variantId, nodeId: "forearm.fds", actionId: null, relationship: "direct", muscleMode: "isometric",
  evidenceBasis: "inference", allocation: "shared", requiresNoStraps: false, rationale: "", reviewStatus: "reviewed", sources: [], ...overrides,
});

describe("the logging policy for one exercise", () => {
  it("asks nothing new of an exercise the atlas does not map, or of no exercise at all", () => {
    expect(loggingPolicyFor(1, [], [])).toEqual({ measure: "reps", askSide: false, oneArm: false, sideDefault: null, strapsSensitive: false });
    expect(loggingPolicyFor(undefined, [variant(1, "seconds", "unilateral")], [])).toBe(defaultLoggingPolicy);
    expect(loggingPolicyFor(null, [variant(1, "seconds", "unilateral")], [])).toBe(defaultLoggingPolicy);
    expect(loggingPolicyFor(Number.NaN, [variant(1, "seconds", "unilateral")], [])).toBe(defaultLoggingPolicy);
    expect(loggingPolicyFor(2, [variant(1, "seconds", "unilateral")], [])).toBe(defaultLoggingPolicy);
  });

  it("measures a hold in seconds and everything else in reps", () => {
    expect(loggingPolicyFor(1, [variant(1, "seconds", "bilateral")], []).measure).toBe("seconds");
    expect(loggingPolicyFor(1, [variant(1, "reps", "bilateral")], []).measure).toBe("reps");
  });

  it("asks no arm and splits no planned set by arm, one-arm exercises included: both arms count as one (20 Oct 2026)", () => {
    for (const laterality of ["bilateral", "unilateral", "either"] as const) {
      expect(loggingPolicyFor(1, [variant(1, "reps", laterality)], [])).toMatchObject({ askSide: false, oneArm: false });
    }
    // The default arm a set would start on is still read from the variant, for a region that asks again.
    expect(loggingPolicyFor(1, [variant(1, "reps", "either")], []).sideDefault).toBe("both");
  });

  it("is straps-sensitive only when a mapping of that same variant needs a bare hand", () => {
    const variants = [variant(1, "seconds", "either"), variant(2, "reps", "bilateral")];
    expect(loggingPolicyFor(1, variants, [mapping("cat-1")]).strapsSensitive).toBe(false);
    expect(loggingPolicyFor(1, variants, [mapping("cat-1", { requiresNoStraps: true })]).strapsSensitive).toBe(true);
    // Another variant's grip mapping says nothing about this one.
    expect(loggingPolicyFor(2, variants, [mapping("cat-1", { requiresNoStraps: true })]).strapsSensitive).toBe(false);
    // A draft mapping still makes the question worth recording; a rejected one does not.
    expect(loggingPolicyFor(1, variants, [mapping("cat-1", { requiresNoStraps: true, reviewStatus: "draft" })]).strapsSensitive).toBe(true);
    expect(loggingPolicyFor(1, variants, [mapping("cat-1", { requiresNoStraps: true, reviewStatus: "rejected" })]).strapsSensitive).toBe(false);
  });
});

describe("the policy's default data", () => {
  it("reads every production region and never a fixture region", () => {
    expect(productionVariants().map((item) => item.catalogExerciseId)).toEqual([143]);
    expect(productionMappings().map((item) => item.id)).toEqual(["m-143"]);
    expect(loggingPolicyFor(143)).toEqual({ measure: "seconds", askSide: false, oneArm: false, sideDefault: null, strapsSensitive: true });
    expect(loggingPolicyFor(900)).toBe(defaultLoggingPolicy);
  });
});
