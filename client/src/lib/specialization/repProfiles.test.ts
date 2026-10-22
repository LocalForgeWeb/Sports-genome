import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { indexRegion } from "@shared/specialization/exposure";
import { variantIdFor } from "@shared/specialization/ids";
import { registeredRegionContents } from "@shared/specialization/registry";
import { prescriptionText, rangeText, repPrescriptionFor, repProfileOf, repRangeFor, repTargetFor } from "@shared/specialization/repProfiles";
import { forearmContent, forearmRegionData } from "@shared/specialization/regions/forearm";
import { repProfileExtras as forearm } from "@shared/specialization/regions/forearm/repProfiles";
import { categoryFor } from "@shared/specialization/rules";
import { sourceLibrary } from "@shared/specialization/sources";
import { trainingSources } from "@shared/specialization/sources/training";
import type { RegionExtras, SpecializationRegionData } from "@shared/specialization/types";
import { deltoidRegionData, deltoidRepProfiles } from "./__fixtures__/deltoidRegion";

/**
 * Rep guidance as region data (11-forearm-research-and-stack.md §5): the package's task families,
 * assigned per variant, never to a carry or a multi-joint lift; `coverageOnly` only where a
 * reviewed family says so; the strength range only where the profile has one; every number the
 * package's practical starting default, never a tested optimum, and never per muscle.
 */

const catalogById = new Map(exercises.map((item) => [item.id, item] as const));
const packageProfiles = JSON.parse(readFileSync(join(process.cwd(), "docs/specialization-atlas/forearm-research-v1/rep-profiles.json"), "utf8")) as Record<string, Record<string, unknown>>;

/** Variants with a reviewed direct mapping on one of the region's own target muscles, moved or deliberately held. */
function directWorkVariants(region: SpecializationRegionData): Set<string> {
  const index = indexRegion(region);
  const own = new Set(region.nodes.filter((node) => node.role === "target" && node.regionId === region.region.id).map((node) => node.id));
  const out = new Set<string>();
  for (const variant of region.variants) {
    for (const mapping of index.mappingsByVariant.get(variant.id) ?? []) {
      if (mapping.reviewStatus !== "reviewed" || mapping.relationship !== "direct" || !own.has(mapping.nodeId)) continue;
      const category = categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
      if (category === "direct_dynamic" || category === "deliberate_isometric") out.add(variant.id);
    }
  }
  return out;
}

const cases: [string, SpecializationRegionData, RegionExtras][] = [["forearm", forearmRegionData, forearm], ["deltoid fixture", deltoidRegionData, deltoidRepProfiles]];

describe.each(cases)("%s rep profiles", (_name, region, extras) => {
  const profiles = extras.repProfiles ?? [];
  const assignments = extras.repProfileAssignments ?? [];
  const variantById = new Map(region.variants.map((variant) => [variant.id, variant] as const));

  it("are the region's, with unique ids, one assignment per variant, each naming a profile it has", () => {
    expect(extras.regionId).toBe(region.region.id);
    expect(new Set(profiles.map((profile) => profile.id)).size).toBe(profiles.length);
    expect(new Set(assignments.map((item) => item.variantId)).size).toBe(assignments.length);
    for (const item of assignments) expect(profiles.map((profile) => profile.id), item.variantId).toContain(item.profileId);
  });

  it("go only on a variant whose own work is a movement or a stationary hold of the region, never on a carry or a multi-joint lift", () => {
    const direct = directWorkVariants(region);
    for (const item of assignments) {
      const variant = variantById.get(item.variantId);
      expect(variant, item.variantId).toBeDefined();
      expect(direct.has(item.variantId), `${item.variantId} has no direct work on an own muscle`).toBe(true);
      expect(variant!.organization, item.variantId).not.toBe("multi_joint");
      expect(catalogById.get(variant!.catalogExerciseId)?.movement, item.variantId).not.toBe("Loaded carry");
    }
  });

  it("give every variant with direct moving or hold work on an own muscle one profile or a listed reason", () => {
    const profiled = new Set(assignments.map((item) => item.variantId));
    const listed = new Map((extras.unprofiledVariants ?? []).map((item) => [item.variantId, item.reason] as const));
    for (const variantId of Array.from(directWorkVariants(region))) {
      expect(profiled.has(variantId) !== listed.has(variantId), `${variantId}: exactly one of a profile and a listed reason`).toBe(true);
    }
    for (const [variantId, reason] of Array.from(listed)) {
      expect(variantById.has(variantId), variantId).toBe(true);
      expect(reason.length, variantId).toBeGreaterThan(20);
    }
  });

  it("hold no per-muscle number and claim no tested optimum", () => {
    const allowed = ["id", "label", "measure", "growth", "strength", "written", "evidence", "origin", "note"];
    for (const profile of profiles) {
      expect(Object.keys(profile).filter((key) => !allowed.includes(key)), profile.id).toEqual([]);
      expect(profile.evidence).toBe("starting_default");
      expect(profile.label).not.toMatch(/optimal|optimum|best|ideal|tested/i);
      expect(profile.growth[0]).toBeLessThanOrEqual(profile.growth[1]);
      if (profile.strength) expect(profile.strength[0]).toBeLessThanOrEqual(profile.strength[1]);
      if (profile.measure === "seconds") {
        expect(profile.written, profile.id).toBeDefined();
        expect(profile.written!.growth).toBeGreaterThanOrEqual(profile.growth[0]);
        expect(profile.written!.growth).toBeLessThanOrEqual(profile.growth[1]);
        if (profile.strength) expect(profile.written!.strength).toBeLessThanOrEqual(profile.strength[1]);
      }
    }
    const json = JSON.stringify(extras);
    for (const node of region.nodes) expect(json.includes(`"${node.id}"`), node.id).toBe(false);
  });

  it("apply the strength range only where the profile has one", () => {
    for (const item of assignments) {
      const profile = profiles.find((candidate) => candidate.id === item.profileId)!;
      if (!profile.strength) expect(item.strengthApplies, item.variantId).toBe(false);
      const strong = repRangeFor(extras, item.variantId, true)!;
      expect(strong.range).toEqual(item.strengthApplies && profile.strength ? profile.strength : profile.growth);
      expect(strong.strengthWithheld).toBe(!(item.strengthApplies && profile.strength));
      expect(repRangeFor(extras, item.variantId, false)!.range).toEqual(profile.growth);
    }
  });
});

describe("the forearm's rep profiles against the package", () => {
  const profiles = forearm.repProfiles!;
  const assignments = forearm.repProfileAssignments!;
  const familyOf = (catalogId: number) => profiles.find((profile) => profile.id === assignments.find((item) => item.variantId === variantIdFor(catalogId))?.profileId)?.origin.family;

  it("carry the package's numbers for each family, recorded as its practical defaults", () => {
    for (const profile of profiles) {
      const source = packageProfiles[profile.origin.family];
      expect(source, profile.id).toBeDefined();
      expect(profile.origin.status).toBe(source.evidence_status);
      expect(profile.origin.status).toBe("practical_starting_range_not_muscle_specific_optimum");
      expect(profile.note).toMatch(/not a tested/);
      if (profile.measure === "seconds") {
        expect(profile.growth).toEqual(source.hypertrophy_hold_seconds);
        expect(profile.strength).toEqual(source.strength_practice_hold_seconds);
      } else {
        expect(profile.growth).toEqual(source.hypertrophy_reps);
        expect(profile.strength).toEqual(source.strength_practice_reps);
      }
      // The package's per-muscle and dose fields are null and are not imported.
      expect(source.weekly_set_target).toBeNull();
      expect(source.maximum_safe_sets).toBeNull();
    }
  });

  it("assign each family's variants as §5.1 lists them", () => {
    const byFamily = (family: string) => assignments.filter((item) => profiles.find((profile) => profile.id === item.profileId)?.origin.family === family).map((item) => Number(item.variantId.slice(4))).sort((a, b) => a - b);
    expect(byFamily("wrist")).toEqual([139, 140, 350, 407, 408, 410, 411, 415, 416]);
    expect(byFamily("rotation")).toEqual([405, 406]);
    expect(byFamily("elbow")).toEqual([132, 133, 134, 135, 136, 337, 342]);
    expect(byFamily("finger")).toEqual([401, 402, 404]);
    expect(byFamily("thumb")).toEqual([412, 413, 414]);
    expect(byFamily("isometric_grip")).toEqual([142, 143, 144, 145, 403]);
    // The carries keep their whole-exercise prescriptions.
    expect(familyOf(299)).toBeUndefined();
    expect(familyOf(409)).toBeUndefined();
    expect(forearm.unprofiledVariants!.map((item) => item.variantId).sort()).toEqual(["cat-299", "cat-409"]);
  });

  it("mark coverage only the thumb drills, whose reviewed family says so, and keep band finger extension's growth range under every goal", () => {
    expect(assignments.filter((item) => item.coverageOnly).map((item) => item.variantId).sort()).toEqual(["cat-412", "cat-413", "cat-414"]);
    for (const item of assignments.filter((candidate) => candidate.coverageOnly)) expect(item.coverageNote).toMatch(/small-muscle coverage, not high-volume defaults/i);
    expect(readFileSync(join(process.cwd(), "docs/specialization-atlas/05-mappings.md"), "utf8")).toMatch(/\| Thumb \| 412, 413, 414 \|.*Small-muscle coverage, not high-volume defaults/);
    // 404's reviewed family says nothing of the kind: not coverage only; a band drill keeps the growth range.
    const band = assignments.find((item) => item.variantId === "cat-404")!;
    expect(band.coverageOnly).toBe(false);
    expect(repRangeFor(forearm, "cat-404", true)).toMatchObject({ kind: "growth", range: [10, 25], strengthWithheld: true });
    expect(repRangeFor(forearm, "cat-401", true)).toMatchObject({ kind: "strength", range: [5, 10] });
    expect(repRangeFor(forearm, "cat-413", true)).toMatchObject({ kind: "growth", range: [12, 25] });
  });

  it("writes a hold as one number, and a seconds target's hold at 30 s whatever the goal", () => {
    expect(repTargetFor(forearm, "cat-142", { strength: false })?.target).toBe("30 sec");
    expect(repTargetFor(forearm, "cat-142", { strength: true })?.target).toBe("10 sec");
    expect(repTargetFor(forearm, "cat-142", { strength: true, holdSeconds: 30 })?.target).toBe("30 sec");
    expect(repTargetFor(forearm, "cat-139", { strength: false })?.target).toBe("10–25");
    expect(repTargetFor(forearm, "cat-139", { strength: true })?.target).toBe("6–12");
    expect(repTargetFor(forearm, "cat-299", { strength: false })).toBeNull();
    expect(repProfileOf(null, "cat-139")).toBeNull();
    expect(prescriptionText(3, rangeText([10, 25]))).toBe("3 × 10–25");
    // The add sheet's default: the goal's set count for the place in the day, times the profile's range.
    expect(repPrescriptionFor(forearm, "cat-139", 3, { strength: false })).toBe("3 × 10–25");
    expect(repPrescriptionFor(forearm, "cat-143", 4, { strength: true })).toBe("4 × 10 sec");
    expect(repPrescriptionFor(forearm, "cat-299", 3, { strength: false })).toBeNull();
  });

  it("cite library sources the seed never writes, for the guidance's sentences only", () => {
    const reference = forearm.referenceSources!;
    expect(reference).toBe(trainingSources);
    expect(reference.map((source) => source.id)).toEqual(["pmid.27174923", "pmid.38970765", "pmid.30580468", "pmid.28834797"]);
    for (const source of reference) expect(sourceLibrary, source.id).toContain(source);
    const seeded = new Set(registeredRegionContents.flatMap((content) => content.sources.map((source) => source.id)));
    for (const source of reference) expect(seeded.has(source.id), source.id).toBe(false);
    const cited = [...forearm.repGuidanceCitations!.general, ...forearm.repGuidanceCitations!.effort, ...forearm.repGuidanceCitations!.holds];
    expect(new Set(cited)).toEqual(new Set(reference.map((source) => source.id)));
    // Each note says what the source does not give: the ranges are the package's defaults.
    for (const source of reference) expect(source.notes, source.id).toMatch(/not (from it|the source of)|no range|not a table/i);
  });

  it("are opted into by the content's section flag, and never loaded with the page", () => {
    expect(forearmContent.sections).toEqual({ stack: true });
    expect(forearmRegionData.sections).toEqual({ stack: true });
    const content = readFileSync(join(process.cwd(), "shared/specialization/regions/forearm/content.ts"), "utf8");
    const index = readFileSync(join(process.cwd(), "shared/specialization/regions/forearm/index.ts"), "utf8");
    for (const text of [content, index]) expect(text).not.toMatch(/from "\.\/repProfiles"|sources\/training/);
  });
});
