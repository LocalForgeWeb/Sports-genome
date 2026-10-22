import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { upperArmMappingVersion, upperArmMappings, upperArmUnmapped } from "@shared/specialization/regions/upper_arm/mappings";
import { upperArmMethodNotes } from "@shared/specialization/regions/upper_arm/methodNotes";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import { UPPER_ARM_MAPPING_VERSION, upperArmExternalIds, upperArmMuscleIds as m } from "@shared/specialization/regions/upper_arm/ids";
import { upperArmNodeActions } from "@shared/specialization/regions/upper_arm/nodeActions";
import { sourceById } from "@shared/specialization/sources";
import { variantById, variantFor } from "@shared/specialization/variants";
import { categoryFor } from "@shared/specialization/rules";
import type { VariantMapping } from "@shared/specialization/types";

/**
 * `upper_arm_mappings_v1` as a whole (docs/specialization-atlas/10-multi-region.md §4.1, §8;
 * docs/specialization-atlas/regions/upper_arm/mappings.md): the rules every family keeps, read over
 * mappings/index.ts, which joins the three families. Each family's own rules are in
 * upper_armMappings.<family>.test.ts; the rules every region keeps once its content is wired are in
 * regionContent.test.ts.
 *
 * The coverage test is strict on purpose. While a family's file is missing from mappings/index.ts
 * (each mapping lane's branch holds its own family only) it fails for exactly the rows that family
 * owns; integration makes it pass by wiring all three.
 */

const UPPER_ARM_KEYS = new Set(upperArmContent.region.catalogKeys);
const catalogById = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const nodeById = new Map(upperArmContent.nodes.map((node) => [node.id, node]));
const regionActions = new Set(upperArmContent.actions.map((action) => action.id));
const nodeActions = new Set(upperArmNodeActions.map((row) => `${row.nodeId}|${row.actionId}`));
const catalogIdOf = (mapping: VariantMapping) => variantById.get(mapping.variantId)!.catalogExerciseId;
const mappedCatalogIds = new Set(upperArmMappings.map(catalogIdOf));
const tagsUpperArm = (exercise: Exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((key) => UPPER_ARM_KEYS.has(key));

describe("upper_arm_mappings_v1: coverage", () => {
  it("maps or lists with a reason every catalog row tagging biceps, brachialis or triceps, primary or secondary", () => {
    const listed = new Set(upperArmUnmapped.map((entry) => entry.catalogId));
    const missing = exercises.filter(tagsUpperArm).filter((exercise) => !mappedCatalogIds.has(exercise.id) && !listed.has(exercise.id)).map((exercise) => `${exercise.id} ${exercise.name}`);
    expect(missing).toEqual([]);
  });

  it("lists each unmapped row once, never one it maps, with a reason", () => {
    const ids = upperArmUnmapped.map((entry) => entry.catalogId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of upperArmUnmapped) {
      expect(catalogById.has(entry.catalogId), String(entry.catalogId)).toBe(true);
      expect(mappedCatalogIds.has(entry.catalogId), `${entry.catalogId} is both mapped and listed`).toBe(false);
      expect(entry.reason.trim().length, String(entry.catalogId)).toBeGreaterThan(20);
    }
  });
});

describe("upper_arm_mappings_v1: method notes", () => {
  it("say what a reviewed mapping claims, in §8's words with the upper arm's incidental word", () => {
    expect(upperArmMappingVersion.key).toBe(UPPER_ARM_MAPPING_VERSION);
    expect(upperArmMappingVersion.methodNotes).toBe(upperArmMethodNotes);
    expect(upperArmMethodNotes.length).toBeGreaterThan(200);
    expect(upperArmMethodNotes).toContain("A reviewed mapping says the muscle does that joint action in that exercise, from anatomy references and, where cited, muscle-activity studies.");
    expect(upperArmMethodNotes).toContain("It does not say how much the exercise loads the muscle.");
    expect(upperArmMethodNotes).toContain("\"Incidental steadying\" credit means the muscle holds a position while other muscles move the load; it is counted apart and never as direct work.");
    expect(upperArmContent.region.wording.incidentalWork).toBe("steadying");
  });

  it("name no side and promise no growth", () => {
    expect(upperArmMethodNotes).not.toMatch(/\b(left|right|per arm|each arm|by arm)\b/i);
    expect(upperArmMethodNotes).not.toMatch(/\b(grows?|bigger|builds? size)\b/i);
  });
});

describe("upper_arm_mappings_v1: rows", () => {
  it("are keyed cat-<id>:<node> under the version, each once", () => {
    const ids = upperArmMappings.map((mapping) => mapping.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const mapping of upperArmMappings) {
      expect(mapping.versionKey, mapping.id).toBe(UPPER_ARM_MAPPING_VERSION);
      expect(mapping.id).toBe(`${mapping.variantId}:${mapping.nodeId}`);
    }
  });

  it("resolve every catalog id through variantFor to the variant they map", () => {
    for (const mapping of upperArmMappings) {
      const variant = variantById.get(mapping.variantId);
      expect(variant, mapping.id).toBeDefined();
      expect(variantFor(variant!.catalogExerciseId), mapping.id).toBe(variant);
      expect(catalogById.get(variant!.catalogExerciseId)?.name, mapping.id).toBe(variant!.catalogName);
    }
  });

  it("sit on no node or action the region lacks: own target muscles, region actions, their node actions", () => {
    for (const mapping of upperArmMappings) {
      const node = nodeById.get(mapping.nodeId);
      expect(node, `${mapping.id}: an upper-arm node`).toBeDefined();
      expect(node!.regionId, mapping.id).toBe(upperArmContent.region.id);
      expect(node!.role, `${mapping.id}: only target muscles are mapped (no group, adjacent or external)`).toBe("target");
      expect(mapping.nodeId, mapping.id).not.toBe(upperArmExternalIds.brachioradialis);
      expect(mapping.actionId !== null && regionActions.has(mapping.actionId), `${mapping.id}: ${mapping.actionId}`).toBe(true);
      expect(nodeActions.has(`${mapping.nodeId}|${mapping.actionId}`), `${mapping.id}: ${mapping.actionId} is not among the node's actions`).toBe(true);
    }
  });

  it("credit the lateral and medial heads only together, alike and shared", () => {
    const byVariant = new Map<string, VariantMapping[]>();
    for (const mapping of upperArmMappings) byVariant.set(mapping.variantId, [...(byVariant.get(mapping.variantId) ?? []), mapping]);
    for (const [variantId, rows] of byVariant) {
      const lateral = rows.find((mapping) => mapping.nodeId === m.tricepsLateral);
      const medial = rows.find((mapping) => mapping.nodeId === m.tricepsMedial);
      expect(Boolean(lateral), `${variantId}: lateral without medial or medial without lateral`).toBe(Boolean(medial));
      if (!lateral || !medial) continue;
      expect(lateral.allocation, lateral.id).toBe("shared");
      expect(medial.allocation, medial.id).toBe("shared");
      const shape = (mapping: VariantMapping) => [mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.reviewStatus, mapping.sideRelation ?? "same"];
      expect(shape(medial), variantId).toEqual(shape(lateral));
    }
  });

  it("keep §8's evidence standard: every row sourced; a reviewed row with a rationale, a basis and a located, limited source", () => {
    for (const mapping of upperArmMappings) {
      expect(mapping.sources.length, mapping.id).toBeGreaterThan(0);
      for (const ref of mapping.sources) expect(sourceById.has(ref.sourceId), `${mapping.id} → ${ref.sourceId}`).toBe(true);
      expect(mapping.rationale.length, mapping.id).toBeGreaterThan(40);
      if (mapping.reviewStatus === "reviewed") {
        expect(["anatomy", "inference", "emg"], mapping.id).toContain(mapping.evidenceBasis);
        expect(mapping.sources.some((ref) => Boolean(ref.locator?.trim()) && Boolean(ref.limitation?.trim())), mapping.id).toBe(true);
      }
      if (mapping.evidenceBasis === "emg") expect(mapping.sources.some((ref) => sourceById.get(ref.sourceId)?.evidenceType === "emg"), mapping.id).toBe(true);
    }
  });

  it("never let steadying or holding earn dynamic credit, and give every reviewed row a countable category", () => {
    for (const mapping of upperArmMappings) {
      if (mapping.relationship === "stabilizer" || mapping.relationship === "incidental") expect(mapping.muscleMode, mapping.id).toBe("isometric");
      const variant = variantById.get(mapping.variantId)!;
      if (mapping.reviewStatus === "reviewed") expect(categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold), mapping.id).not.toBe("unknown");
      expect(mapping.requiresNoStraps, `${mapping.id}: straps decide only grip mappings, which are the forearm's`).toBe(false);
    }
  });

  it("read a side only from a limb the variant uses (§2.1 rule 5)", () => {
    for (const mapping of upperArmMappings) {
      if (variantById.get(mapping.variantId)!.laterality === "not_applicable") expect(mapping.sideRelation, mapping.id).toBe("both");
    }
  });

  it("count no exercise toward a shoulder-flexion target in v1: the biceps' help there is disputed (Levy 2001)", () => {
    const reviewed = upperArmMappings.filter((mapping) => mapping.actionId === "shoulder.flexion" && mapping.reviewStatus === "reviewed").map((mapping) => mapping.id);
    expect(reviewed).toEqual([]);
  });
});
