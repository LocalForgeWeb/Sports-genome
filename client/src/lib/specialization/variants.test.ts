import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { isCurrentVariant, variantById, variantFor, variantLibrary } from "@shared/specialization/variants";
import { bothLimbCatalogIds, bothLimbDecisions } from "@shared/specialization/variants/bothLimbs";
import { countingDimensions, descriptiveDimensions } from "@shared/specialization/variants/dimensions";
import { forearmV1Variants } from "@shared/specialization/variants/forearm";
import { upperArmVariants } from "@shared/specialization/variants/upperArm";
import type { ExerciseVariant } from "@shared/specialization/types";

/**
 * The variant library as wave A leaves it (docs/specialization-atlas/10-multi-region.md §3;
 * docs/specialization-atlas/regions/variants.md): the forearm's 119 records unchanged, and one new
 * record for every catalog exercise the upper arm decides that had none, plus the untagged
 * exercises that load the upper arm's actions, each with its counting attributes written out.
 */

const catalogById = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
/** The upper arm's catalog keys (§1.1); every row tagging one, primary or secondary, is a decision the coverage test demands. */
const UPPER_ARM_KEYS = ["biceps", "brachialis", "triceps"];
/**
 * Rows no upper-arm key tags whose exercise moves or holds the upper arm's actions (elbow flexion
 * or extension, shoulder flexion or extension) under load, so the upper arm's mapping lanes may map
 * them; each with its reason in variants.md.
 */
const UNTAGGED_THAT_LOAD_THE_UPPER_ARM = [87, 88, 117, 118, 119, 164, 237, 238, 283, 335, 388];
const forearmIds = new Set(forearmV1Variants.map((variant) => variant.catalogExerciseId));
const tagsUpperArm = (exercise: Exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((key) => UPPER_ARM_KEYS.includes(key));
const oneSided = (laterality: ExerciseVariant["laterality"] | undefined) => laterality === "unilateral" || laterality === "either";

describe("wave A's new variants: which exercises", () => {
  it("are every upper-arm-tagged catalog row without a forearm variant, and the untagged rows that load the upper arm", () => {
    const tagged = exercises.filter(tagsUpperArm);
    // 186 decisions after the catalog fixes below: 50 rows tag an upper-arm key as primary, 136 as secondary only.
    expect(tagged).toHaveLength(186);
    expect(tagged.filter((exercise) => exercise.primaryMuscles.some((key) => UPPER_ARM_KEYS.includes(key)))).toHaveLength(50);
    const needed = tagged.filter((exercise) => !forearmIds.has(exercise.id)).map((exercise) => exercise.id);
    expect(needed).toHaveLength(114);
    for (const id of UNTAGGED_THAT_LOAD_THE_UPPER_ARM) {
      expect(tagsUpperArm(catalogById.get(id)!), String(id)).toBe(false);
      expect(forearmIds.has(id), String(id)).toBe(false);
    }
    const expected = [...needed, ...UNTAGGED_THAT_LOAD_THE_UPPER_ARM].sort((a, b) => a - b);
    expect(upperArmVariants.map((variant) => variant.catalogExerciseId).sort((a, b) => a - b)).toEqual(expected);
    expect(upperArmVariants).toHaveLength(125);
  });

  it("never gives a forearm exercise a second record", () => {
    for (const variant of upperArmVariants) expect(forearmIds.has(variant.catalogExerciseId), variant.id).toBe(false);
  });
});

describe("the library's records", () => {
  it("have unique cat-<id> ids, the catalog's names, and resolve through variantFor", () => {
    const ids = variantLibrary.map((variant) => variant.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(variantLibrary).toHaveLength(forearmV1Variants.length + upperArmVariants.length);
    for (const variant of upperArmVariants) {
      expect(variant.id).toBe(`cat-${variant.catalogExerciseId}`);
      expect(variant.replaces, variant.id).toBeUndefined();
      expect(catalogById.get(variant.catalogExerciseId)?.name, variant.id).toBe(variant.catalogName);
      expect(isCurrentVariant(variant), variant.id).toBe(true);
      expect(variantFor(variant.catalogExerciseId), variant.id).toBe(variant);
      expect(variantById.get(variant.id), variant.id).toBe(variant);
    }
  });

  it("keep the forearm's 119 exactly as published, their sidedBy as pinned at wave 0", () => {
    const published: ExerciseVariant[] = JSON.parse(readFileSync(join(__dirname, "__fixtures__/forearmRegionData.6738eeb.json"), "utf8")).variants;
    expect(published).toHaveLength(119);
    const frozenColumns = forearmV1Variants.map(({ sidedBy: _sidedBy, legLaterality: _legs, sideAnchor: _anchor, dimensions: _dimensions, ...columns }) => columns);
    expect(frozenColumns).toEqual(published);
    for (const variant of forearmV1Variants) {
      expect(variantFor(variant.catalogExerciseId), variant.id).toBe(variant);
      // Wave 0's rule; 188 and 264 keep `arm` (11-forearm-research-and-stack.md §10 decision 4).
      expect(variant.sidedBy, variant.id).toBe(variant.laterality === "bilateral" ? "none" : "arm");
      // Wave A writes nothing on them: their attributes are the leg waves' (and the forearm's) to add.
      expect(variant.legLaterality, variant.id).toBeUndefined();
      expect(variant.sideAnchor, variant.id).toBeUndefined();
      expect(variant.dimensions, variant.id).toBeUndefined();
    }
  });
});

describe("counting attributes", () => {
  it("are written out on every new record: sidedBy always, no leg-only attribute before the leg waves", () => {
    for (const variant of upperArmVariants) {
      expect(Object.prototype.hasOwnProperty.call(variant, "sidedBy"), variant.id).toBe(true);
      expect(Object.keys(countingDimensions.sided_by.values), variant.id).toContain(variant.sidedBy);
      expect(variant.legLaterality, variant.id).toBeUndefined();
      expect(variant.sideAnchor, variant.id).toBeUndefined();
      expect(variant.sidedBy, variant.id).not.toBe("leg");
      expect(variant.dimensions, variant.id).toBeDefined();
      for (const [dimension, value] of Object.entries(variant.dimensions ?? {})) {
        expect(["stance", "knee"], `${variant.id} ${dimension}`).not.toContain(dimension);
        expect(Object.keys(descriptiveDimensions), variant.id).toContain(dimension);
        expect(Object.keys(descriptiveDimensions[dimension as keyof typeof descriptiveDimensions].values), `${variant.id} ${dimension}`).toContain(value);
      }
    }
  });

  it("follow §3's limb rule: one-sided or either arms are sided by the arm, both arms by nothing, both-limb variants as listed", () => {
    for (const variant of variantLibrary) {
      const decision = bothLimbDecisions.find((entry) => entry.catalogExerciseId === variant.catalogExerciseId);
      if (decision) expect(variant.sidedBy, variant.id).toBe(decision.sidedBy);
      else if (oneSided(variant.laterality)) expect(variant.sidedBy, variant.id).toBe("arm");
      else if (variant.laterality === "bilateral") expect(variant.sidedBy, variant.id).toBe("none");
      else expect(["none", "leg"], variant.id).toContain(variant.sidedBy);
    }
  });

  it("list each both-limb variant once, with its decision and reason, on a variant whose arms are one-sided", () => {
    const ids = bothLimbDecisions.map((entry) => entry.catalogExerciseId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bothLimbCatalogIds).toEqual(new Set(ids));
    expect(ids).toEqual(expect.arrayContaining([188, 264]));
    for (const entry of bothLimbDecisions) {
      const variant = variantFor(entry.catalogExerciseId);
      expect(variant, String(entry.catalogExerciseId)).not.toBeNull();
      expect(oneSided(variant!.laterality), variant!.id).toBe(true);
      expect(["arm", "leg"], variant!.id).toContain(entry.sidedBy);
      expect(entry.reason.trim(), variant!.id).not.toBe("");
    }
    // Wave A's decisions, recorded in variants.md.
    expect(bothLimbDecisions.filter((entry) => !forearmIds.has(entry.catalogExerciseId)).map((entry) => [entry.catalogExerciseId, entry.sidedBy])).toEqual([
      [252, "arm"], [270, "arm"], [303, "arm"], [325, "arm"], [386, "arm"], [390, "arm"],
    ]);
  });
});

describe("the forearm columns, filled honestly", () => {
  it("say the hands do nothing only where every hand column says so", () => {
    for (const variant of upperArmVariants) {
      const handsIdle = variant.laterality === "not_applicable";
      expect(handsIdle && !(variant.forearmOrientation === "not_applicable" && variant.wristPosition === "not_applicable" && variant.gripType === "none" && variant.straps === "not_applicable"), variant.id).toBe(false);
      if (variant.forearmOrientation === "not_applicable" || variant.wristPosition === "not_applicable") expect(variant.laterality, variant.id).toBe("not_applicable");
    }
  });

  it("time no new exercise and invent no elbow angle; each says how it is done", () => {
    for (const variant of upperArmVariants) {
      expect(variant.measure, variant.id).toBe("reps");
      expect(variant.deliberateHold, variant.id).toBe(false);
      expect(variant.elbowAngleDeg, variant.id).toBeNull();
      expect(variant.notes?.trim(), variant.id).toBeTruthy();
    }
  });
});

/**
 * Catalog fixes made by wave A's variants lane (10-multi-region.md §11 decision 6), each listed with
 * its before and after in variants.md. Pinned so a later edit cannot silently undo one. No fix adds
 * or removes a `forearms` tag, so the forearm's region-only reading is unchanged.
 */
describe("catalog fixes (decision 6)", () => {
  const fixed: Record<number, Partial<Pick<Exercise, "equipment" | "movement" | "primaryMuscles" | "secondaryMuscles">>> = {
    13: { equipment: "Machine" },
    18: { secondaryMuscles: ["frontDelts"] },
    19: { secondaryMuscles: ["frontDelts"] },
    20: { secondaryMuscles: ["frontDelts"] },
    21: { secondaryMuscles: ["frontDelts"] },
    22: { secondaryMuscles: ["frontDelts"] },
    23: { secondaryMuscles: ["frontDelts"] },
    24: { secondaryMuscles: ["triceps", "rearDelts", "forearms"] },
    40: { movement: "Vertical push" },
    62: { secondaryMuscles: ["triceps", "rearDelts", "forearms"] },
    63: { secondaryMuscles: ["triceps", "rearDelts", "forearms"] },
    64: { secondaryMuscles: ["triceps", "rearDelts", "forearms"] },
    65: { secondaryMuscles: ["triceps", "rearDelts", "forearms"] },
    79: { secondaryMuscles: ["rearDelts", "forearms"] },
    87: { equipment: "Cable" },
    88: { equipment: "Cable" },
    101: { secondaryMuscles: ["triceps", "abs"] },
    102: { secondaryMuscles: ["triceps", "abs"] },
    103: { secondaryMuscles: ["triceps", "abs"] },
    104: { secondaryMuscles: ["triceps", "abs"] },
    105: { equipment: "Dumbbells", movement: "Vertical push", primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["triceps", "abs"] },
    106: { secondaryMuscles: ["triceps", "abs"] },
    107: { secondaryMuscles: ["triceps", "abs"] },
    108: { secondaryMuscles: ["triceps", "abs"] },
    109: { secondaryMuscles: ["triceps", "abs"] },
    110: { equipment: "Barbell", movement: "Vertical push", primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["triceps", "abs"] },
    120: { secondaryMuscles: ["triceps", "abs"] },
    146: { equipment: "Barbell" },
    147: { equipment: "Barbell", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "frontDelts", "abs"] },
    150: { secondaryMuscles: [] },
    151: { equipment: "Cable", secondaryMuscles: [] },
    152: { equipment: "Cable", secondaryMuscles: [] },
    153: { secondaryMuscles: [] },
    158: { movement: "Vertical push", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "frontDelts", "abs"] },
    159: { movement: "Vertical push" },
    160: { equipment: "Bodyweight" },
    223: { equipment: "Machine", movement: "Ankle plantarflexion", primaryMuscles: ["calves"], secondaryMuscles: ["feet"] },
    249: { equipment: "Cable", movement: "Anti-rotation press", primaryMuscles: ["abs", "obliques"], secondaryMuscles: ["chest", "triceps", "frontDelts"] },
    251: { movement: "Diagonal push", primaryMuscles: ["frontDelts", "chest"], secondaryMuscles: ["triceps", "abs"] },
    252: { movement: "Diagonal push", primaryMuscles: ["frontDelts", "chest"], secondaryMuscles: ["triceps", "abs"] },
    253: { movement: "Diagonal push", primaryMuscles: ["frontDelts", "chest"], secondaryMuscles: ["triceps", "abs"] },
    254: { movement: "Diagonal push", primaryMuscles: ["frontDelts", "chest"], secondaryMuscles: ["triceps", "abs"] },
    255: { movement: "Diagonal press, pull, squat or rotation", primaryMuscles: ["shoulders", "chest", "glutes"], secondaryMuscles: ["triceps", "upperBack", "obliques", "quads"] },
    279: { movement: "Throw, slam or ballistic rotation" },
    280: { movement: "Throw, slam or ballistic rotation", secondaryMuscles: ["triceps", "rearDelts", "forearms"] },
    345: { secondaryMuscles: ["forearms"] },
  };

  it("hold as made", () => {
    for (const [id, fields] of Object.entries(fixed)) expect(catalogById.get(Number(id)), id).toMatchObject(fields);
  });

  it("leave no row tagging one muscle as both primary and secondary among the rows wave A touched", () => {
    for (const variant of upperArmVariants) {
      const exercise = catalogById.get(variant.catalogExerciseId)!;
      expect(exercise.primaryMuscles.filter((key) => exercise.secondaryMuscles.includes(key)), variant.id).toEqual([]);
    }
  });
});
