import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { extensionsOtherMappings as rows, extensionsOtherUnmapped as unmapped } from "@shared/specialization/regions/upper_arm/mappings/extensionsOther";
import { UPPER_ARM_MAPPING_VERSION, upperArmAdjacentIds, upperArmExternalIds, upperArmMuscleIds as m } from "@shared/specialization/regions/upper_arm/ids";
import { upperArmNodeActions } from "@shared/specialization/regions/upper_arm/nodeActions";
import { sourceById } from "@shared/specialization/sources";
import { variantById, variantFor } from "@shared/specialization/variants";
import { variantIdFor } from "@shared/specialization/ids";
import { categoryFor } from "@shared/specialization/rules";
import type { VariantMapping } from "@shared/specialization/types";

/**
 * The upper arm's "extensions and everything else" family (docs/specialization-atlas/regions/
 * upper_arm/mappings.md; shared/specialization/regions/upper_arm/mappings/extensionsOther.ts):
 * its fields, its evidence, its coverage of the catalog and its judgment calls. The rules over the
 * whole version (copy, sources, drafts, the shared heads) are in upper_armMappings.test.ts.
 */

const UPPER_ARM_KEYS = ["biceps", "brachialis", "triceps"];
const byId = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const tagsUpperArm = (exercise: Exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((key) => UPPER_ARM_KEYS.includes(key));
const rowsFor = (catalogId: number) => rows.filter((mapping) => mapping.variantId === variantIdFor(catalogId));
const rowOf = (catalogId: number, nodeId: string) => rows.find((mapping) => mapping.id === `${variantIdFor(catalogId)}:${nodeId}`);
const mappedIds = new Set(rows.map((mapping) => variantById.get(mapping.variantId)?.catalogExerciseId ?? -1));
const listedIds = new Set(unmapped.map((entry) => entry.catalogId));

/**
 * The boundary between the three families, by the catalog's movement (every upper-arm-tagged row
 * has exactly one family): presses and pushes; pulls, rows and curls; and this family, everything
 * else. 379 Cable Rotational Row is a row whose movement reads "Rotation": it is routed by id, so a
 * future tag on a rotation that is not a row (a chop) is not silently given to the pulls.
 */
const PRESS_MOVEMENTS = ["Horizontal push", "Vertical push", "Diagonal push", "Anti-rotation press", "Diagonal press, pull, squat or rotation", "Scapular protraction", "Explosive push"];
const PULL_MOVEMENTS = ["Horizontal pull", "Vertical pull", "Elbow flexion"];
const PULL_IDS = [379];
const THIS_FAMILY_MOVEMENTS = ["Elbow extension", "Throw, slam or ballistic rotation", "Wrist extension", "Forearm supination", "Anti-rotation", "Loaded transition", "Overhead slam", "Alternating arm drive"];
const familiesOf = (exercise: Exercise) => [
  PRESS_MOVEMENTS.includes(exercise.movement),
  PULL_MOVEMENTS.includes(exercise.movement) || PULL_IDS.includes(exercise.id),
  THIS_FAMILY_MOVEMENTS.includes(exercise.movement),
].filter(Boolean).length;

/** This family's tagged rows (31), as the movement rule gives them. */
const TAGGED = [148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 160, 271, 273, 279, 280, 281, 284, 285, 343, 344, 345, 346, 347, 348, 349, 350, 380, 390, 399, 400, 406];
/** Untagged rows with a library variant that this family decides: front raises, the Zercher lifts, rollouts, the sit-up throw, the snatch. */
const UNTAGGED_WITH_VARIANT = [117, 118, 119, 164, 237, 238, 283, 300, 388];
/** Untagged rows with no variant that a reader might expect to count here, listed with their reason (the coordinator's ruling of 22 Oct). */
const UNTAGGED_NO_VARIANT = [165, 235, 250, 296, 298, 352, 387, 391];

describe("extensionsOther: the family's rows", () => {
  it("are every upper-arm-tagged row that is not a press or push, a pull, a row or a curl", () => {
    const tagged = exercises.filter(tagsUpperArm);
    for (const exercise of tagged) expect(familiesOf(exercise), `${exercise.id} ${exercise.name}: ${exercise.movement}`).toBe(1);
    expect(tagged.filter((exercise) => THIS_FAMILY_MOVEMENTS.includes(exercise.movement)).map((exercise) => exercise.id).sort((a, b) => a - b)).toEqual(TAGGED);
  });

  it("map or list every row of the family, and nothing outside it", () => {
    for (const id of [...TAGGED, ...UNTAGGED_WITH_VARIANT, ...UNTAGGED_NO_VARIANT]) expect(mappedIds.has(id) || listedIds.has(id), `${id} ${byId.get(id)?.name}`).toBe(true);
    const family = new Set([...TAGGED, ...UNTAGGED_WITH_VARIANT, ...UNTAGGED_NO_VARIANT]);
    for (const id of [...mappedIds, ...listedIds]) expect(family.has(id), String(id)).toBe(true);
    for (const id of UNTAGGED_WITH_VARIANT) expect(tagsUpperArm(byId.get(id)!), String(id)).toBe(false);
    for (const id of UNTAGGED_NO_VARIANT) {
      expect(tagsUpperArm(byId.get(id)!), String(id)).toBe(false);
      expect(variantFor(id), String(id)).toBeNull();
    }
  });

  it("map 30 exercises in 86 rows and list 18, none twice, none both", () => {
    expect(mappedIds.size).toBe(30);
    expect(rows).toHaveLength(86);
    expect(unmapped).toHaveLength(18);
    expect(listedIds.size).toBe(unmapped.length);
    for (const id of listedIds) expect(mappedIds.has(id), `${id} is both mapped and listed`).toBe(false);
    for (const entry of unmapped) {
      expect(byId.has(entry.catalogId), String(entry.catalogId)).toBe(true);
      expect(entry.reason.trim().length, String(entry.catalogId)).toBeGreaterThan(20);
    }
  });

  it("leave no primary-tagged row unmapped", () => {
    for (const id of listedIds) {
      const exercise = byId.get(id)!;
      expect(exercise.primaryMuscles.some((key) => UPPER_ARM_KEYS.includes(key)), `${id} ${exercise.name}`).toBe(false);
    }
  });
});

describe("extensionsOther: every row", () => {
  const relationships = ["direct", "contributing", "stabilizer", "incidental"];
  const modes = ["dynamic", "isometric"];
  const bases = ["anatomy", "inference", "emg"];

  it("has valid fields under the version", () => {
    for (const mapping of rows) {
      expect(mapping.versionKey, mapping.id).toBe(UPPER_ARM_MAPPING_VERSION);
      expect(mapping.id).toBe(`${mapping.variantId}:${mapping.nodeId}`);
      expect(mapping.variantId, mapping.id).toMatch(/^cat-\d+$/);
      const variant = variantById.get(mapping.variantId);
      expect(variant, mapping.id).toBeDefined();
      if (variant) expect(variantFor(variant.catalogExerciseId), mapping.id).toBe(variant);
      expect(Object.values(m) as string[], mapping.id).toContain(mapping.nodeId);
      expect(relationships, mapping.id).toContain(mapping.relationship);
      expect(modes, mapping.id).toContain(mapping.muscleMode);
      expect(bases, mapping.id).toContain(mapping.evidenceBasis);
      expect(["individual", "shared"], mapping.id).toContain(mapping.allocation);
      expect(["reviewed", "draft"], mapping.id).toContain(mapping.reviewStatus);
      expect(mapping.sideRelation, mapping.id).toBe("same");
      expect(mapping.requiresNoStraps, mapping.id).toBe(false);
    }
  });

  it("is unique", () => {
    const ids = rows.map((mapping) => mapping.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is reviewed only with a rationale, a basis and a source with a locator and a limitation; every source is in the library", () => {
    for (const mapping of rows) {
      expect(mapping.rationale.length, mapping.id).toBeGreaterThan(80);
      expect(mapping.sources.length, mapping.id).toBeGreaterThan(0);
      for (const ref of mapping.sources) {
        expect(sourceById.has(ref.sourceId), `${mapping.id} → ${ref.sourceId}`).toBe(true);
        expect(ref.locator?.trim(), `${mapping.id} → ${ref.sourceId}`).toBeTruthy();
        expect(ref.limitation?.trim(), `${mapping.id} → ${ref.sourceId}`).toBeTruthy();
      }
      if (mapping.evidenceBasis === "emg") expect(mapping.sources.some((ref) => sourceById.get(ref.sourceId)?.evidenceType === "emg"), mapping.id).toBe(true);
      if (mapping.reviewStatus === "draft") expect(mapping.rationale, mapping.id).toMatch(/not established and stays pending review/);
    }
  });

  it("keeps rationales between 150 and 450 characters", () => {
    for (const mapping of rows) {
      expect(mapping.rationale.length, mapping.id).toBeGreaterThanOrEqual(150);
      expect(mapping.rationale.length, mapping.id).toBeLessThanOrEqual(450);
    }
  });

  it("never lets steadying or holding move, and gives each reviewed row a countable category", () => {
    for (const mapping of rows) {
      if (mapping.relationship === "stabilizer" || mapping.relationship === "incidental") expect(mapping.muscleMode, mapping.id).toBe("isometric");
      if (mapping.reviewStatus === "reviewed") expect(categoryFor(mapping.relationship, mapping.muscleMode, variantById.get(mapping.variantId)!.deliberateHold), mapping.id).not.toBe("unknown");
    }
  });

  it("credits the lateral and medial heads only together, alike and shared", () => {
    for (const id of mappedIds) {
      const lateral = rowOf(id, m.tricepsLateral);
      const medial = rowOf(id, m.tricepsMedial);
      expect(Boolean(lateral), String(id)).toBe(Boolean(medial));
      if (!lateral || !medial) continue;
      expect([lateral.allocation, medial.allocation], String(id)).toEqual(["shared", "shared"]);
      const shape = (mapping: VariantMapping) => [mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.reviewStatus, mapping.rationale];
      expect(shape(medial), String(id)).toEqual(shape(lateral));
    }
    // Shared means the two heads, nothing else: every other row of this family is its muscle's own.
    for (const mapping of rows) if (mapping.nodeId !== m.tricepsLateral && mapping.nodeId !== m.tricepsMedial) expect(mapping.allocation, mapping.id).toBe("individual");
  });

  it("has no brachioradialis row, no coracobrachialis row and no fan-out: a muscle only for an action its node actions name", () => {
    const actions = new Set(upperArmNodeActions.map((row) => `${row.nodeId}|${row.actionId}`));
    for (const mapping of rows) {
      expect(mapping.nodeId, mapping.id).not.toBe(upperArmExternalIds.brachioradialis);
      expect(mapping.nodeId, mapping.id).not.toBe(upperArmAdjacentIds.coracobrachialis);
      expect(actions.has(`${mapping.nodeId}|${mapping.actionId}`), `${mapping.id}: ${mapping.actionId}`).toBe(true);
    }
    // Never more than the three heads, or the two elbow flexors, on one exercise.
    for (const id of mappedIds) expect(rowsFor(id).length, String(id)).toBeLessThanOrEqual(3);
  });
});

describe("extensionsOther: the judgment calls", () => {
  const extensions = [148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 160, 343, 344, 345, 346, 347, 348, 349];
  const heads = [m.tricepsLong, m.tricepsLateral, m.tricepsMedial];

  it("credits every extension to the three heads alone, direct and dynamic, reviewed", () => {
    for (const id of extensions) {
      expect(rowsFor(id).map((mapping) => mapping.nodeId).sort(), String(id)).toEqual([...heads].sort());
      for (const mapping of rowsFor(id)) expect([mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.reviewStatus], mapping.id).toEqual(["elbow.extension", "direct", "dynamic", "reviewed"]);
    }
  });

  it("gives the long head the same credit overhead, at the side, in front and behind: the arm's position is said, never weighted", () => {
    const longHead = (id: number) => rowOf(id, m.tricepsLong)!;
    const credit = (mapping: VariantMapping) => [mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.allocation, mapping.reviewStatus];
    const overhead = [154, 155, 156, 349];
    const atSide = [150, 151, 152, 153, 343, 344, 345, 346];
    const inFront = [148, 149, 157, 160];
    for (const id of [...overhead, ...atSide, ...inFront, 347, 348]) {
      expect(credit(longHead(id)), String(id)).toEqual(credit(longHead(154)));
      expect(longHead(id).rationale, String(id)).toMatch(/never changes its credit/);
    }
    for (const id of overhead) {
      expect(variantById.get(variantIdFor(id))!.dimensions?.shoulder, String(id)).toBe("overhead");
      expect(longHead(id).rationale, String(id)).toMatch(/longer length than in a pushdown/);
      expect(longHead(id).rationale, String(id)).toMatch(/not used for credit/);
    }
    for (const id of atSide) expect(variantById.get(variantIdFor(id))!.dimensions?.shoulder, String(id)).toBe("neutral");
    for (const id of inFront) expect(variantById.get(variantIdFor(id))!.dimensions?.shoulder, String(id)).toBe("flexed");
    // The kickback: arm held back, the long head short at the shoulder, still direct.
    expect(variantById.get(variantIdFor(348))!.dimensions?.shoulder).toBe("extended");
    expect(longHead(348).rationale).toMatch(/shortest across the shoulder/);
  });

  it("cites the triceps-heads study only where its finding applies: the long head with the arm at the side, the medial head at shoulder height or above", () => {
    const cites = (mapping: VariantMapping) => mapping.sources.some((ref) => ref.sourceId === "aott.triceps_heads");
    for (const id of [150, 151, 152, 153, 343, 344, 345, 346]) {
      expect(cites(rowOf(id, m.tricepsLong)!), String(id)).toBe(true);
      expect(cites(rowOf(id, m.tricepsMedial)!), String(id)).toBe(false);
    }
    for (const id of [148, 149, 157, 160, 154, 155, 156, 349]) {
      expect(cites(rowOf(id, m.tricepsLong)!), String(id)).toBe(false);
      for (const nodeId of [m.tricepsLateral, m.tricepsMedial]) {
        expect(cites(rowOf(id, nodeId)!), `${id} ${nodeId}`).toBe(true);
        expect(rowOf(id, nodeId)!.rationale, `${id} ${nodeId}`).toMatch(/most force from the medial head/);
      }
    }
    for (const id of [347, 348]) for (const nodeId of heads) expect(cites(rowOf(id, nodeId)!), `${id} ${nodeId}`).toBe(false);
  });

  it("says a palm-up handle keeps the action and the credit", () => {
    for (const id of [152, 153, 345, 346]) for (const nodeId of heads) expect(rowOf(id, nodeId)!.rationale, `${id} ${nodeId}`).toMatch(/the action and its credit are the same/);
  });

  it("lists the front raises: no shoulder-flexion row at all in v1, and nothing on the coracobrachialis", () => {
    for (const id of [117, 118, 119]) {
      expect(rowsFor(id), String(id)).toEqual([]);
      expect(unmapped.find((entry) => entry.catalogId === id)?.reason, String(id)).toBe("The biceps' help in raising the arm forward is weak and disputed; one study found none with the elbow kept straight.");
    }
    expect(rows.filter((mapping) => mapping.actionId === "shoulder.flexion")).toEqual([]);
  });

  it("holds the Zercher bar with the elbow flexors, isometric: incidental in the squat, contributing in the carry, as the forearm read it", () => {
    for (const nodeId of [m.biceps, m.brachialis]) {
      expect([rowOf(164, nodeId)!.actionId, rowOf(164, nodeId)!.relationship, rowOf(164, nodeId)!.muscleMode]).toEqual(["elbow.flexion", "incidental", "isometric"]);
      expect([rowOf(300, nodeId)!.actionId, rowOf(300, nodeId)!.relationship, rowOf(300, nodeId)!.muscleMode]).toEqual(["elbow.flexion", "contributing", "isometric"]);
    }
    expect(categoryFor("incidental", "isometric", variantById.get("cat-164")!.deliberateHold)).toBe("incidental_isometric");
    expect(categoryFor("contributing", "isometric", variantById.get("cat-300")!.deliberateHold)).toBe("deliberate_isometric");
    for (const id of [164, 300]) expect(rowsFor(id).map((mapping) => mapping.nodeId).sort(), String(id)).toEqual([m.biceps, m.brachialis].sort());
  });

  it("splits the kneeling ab-wheel rollout's arms, and lists the barbell rollout, photographed as a pike from a plank with the arms upright", () => {
    const long = rowOf(237, m.tricepsLong)!;
    expect([long.actionId, long.relationship, long.muscleMode, long.reviewStatus]).toEqual(["shoulder.extension", "contributing", "dynamic", "reviewed"]);
    for (const nodeId of [m.tricepsLateral, m.tricepsMedial]) {
      const mapping = rowOf(237, nodeId)!;
      expect([mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.allocation]).toEqual(["elbow.extension", "stabilizer", "isometric", "shared"]);
    }
    expect(rowsFor(238)).toEqual([]);
    expect(listedIds.has(238)).toBe(true);
  });

  it("credits the long head's shoulder extension in the same words wherever it does", () => {
    const words = "The long head, the one triceps head that crosses the shoulder, helps draw the arm down from overhead, so it helps move the load (contributing); the back muscles lead.";
    const drawing = rows.filter((mapping) => mapping.nodeId === m.tricepsLong && mapping.actionId === "shoulder.extension");
    expect(drawing.map((mapping) => variantById.get(mapping.variantId)!.catalogExerciseId).sort((a, b) => a - b)).toEqual([237, 284, 285, 399]);
    for (const mapping of drawing) expect(mapping.rationale, mapping.id).toContain(words);
    for (const id of [283, 250]) expect(unmapped.find((entry) => entry.catalogId === id)!.reason, String(id)).toContain("The triceps' long head helps draw the arms down from overhead");
  });

  it("calls the get-up's elbow work steadying, and leaves the snatch, the backward and sit-up throws, the rope waves, the walkout and the wrist extension unmapped", () => {
    for (const nodeId of heads) {
      const mapping = rowOf(390, nodeId)!;
      expect([mapping.actionId, mapping.relationship, mapping.muscleMode]).toEqual(["elbow.extension", "stabilizer", "isometric"]);
    }
    for (const id of [388, 279, 283, 400, 380, 350]) {
      expect(listedIds.has(id), String(id)).toBe(true);
      expect(rowsFor(id), String(id)).toEqual([]);
    }
  });

  it("credits real elbow extension in the chest passes, the photographed overhead slam and the forward throw, as contributing", () => {
    for (const id of [271, 281, 273, 280]) {
      expect(rowsFor(id).map((mapping) => mapping.nodeId).sort(), String(id)).toEqual([...heads].sort());
      for (const mapping of rowsFor(id)) expect([mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.reviewStatus], mapping.id).toEqual(["elbow.extension", "contributing", "dynamic", "reviewed"]);
    }
    // The chest passes rest on the action; the slam and the throw on a reading of the photo or the set-up.
    for (const id of [271, 281]) for (const mapping of rowsFor(id)) expect(mapping.evidenceBasis, mapping.id).toBe("anatomy");
    for (const id of [273, 280]) for (const mapping of rowsFor(id)) expect(mapping.evidenceBasis, mapping.id).toBe("inference");
  });

  it("credits the long head for drawing the arms down in the slams with no photo and the rope slam, and holds their elbow heads as drafts", () => {
    for (const id of [284, 285, 399]) {
      const long = rowOf(id, m.tricepsLong)!;
      expect([long.actionId, long.relationship, long.muscleMode, long.reviewStatus], String(id)).toEqual(["shoulder.extension", "contributing", "dynamic", "reviewed"]);
      for (const nodeId of [m.tricepsLateral, m.tricepsMedial]) expect(rowOf(id, nodeId)!.reviewStatus, `${id} ${nodeId}`).toBe("draft");
    }
    for (const id of [284, 285]) for (const mapping of rowsFor(id)) expect(mapping.rationale, mapping.id).not.toMatch(/photo shows/);
    // Primary-tagged triceps: any own row, draft included, keeps 399 out of the region-only bucket.
    expect(byId.get(399)!.primaryMuscles).toContain("triceps");
  });

  it("speaks for the biceps in the forearm's lever supination, without marking work split with a forearm muscle", () => {
    expect(rowsFor(406)).toHaveLength(1);
    const biceps = rowOf(406, m.biceps)!;
    expect([biceps.actionId, biceps.relationship, biceps.muscleMode, biceps.allocation, biceps.evidenceBasis]).toEqual(["forearm.supination", "contributing", "dynamic", "individual", "emg"]);
    expect(variantById.get("cat-406")!.elbowAngleDeg).toBe(90);
  });

  it("keeps the forearm's two non-curl biceps and brachialis exercises credited once the upper arm speaks for them", () => {
    // The forearm's version credited the biceps or brachialis on 300 and 406 besides the curls (05-mappings.md);
    // from wave A the forearm page reads them through this version (10-multi-region.md §4.2).
    expect(rowOf(300, m.biceps)?.reviewStatus).toBe("reviewed");
    expect(rowOf(300, m.brachialis)?.reviewStatus).toBe("reviewed");
    expect(rowOf(406, m.biceps)?.reviewStatus).toBe("reviewed");
  });
});
