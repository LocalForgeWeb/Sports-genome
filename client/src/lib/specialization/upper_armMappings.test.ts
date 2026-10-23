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
/** The catalog id a mapping's variant names, or null when the library does not hold the variant (its own test fails then). */
const catalogIdOf = (mapping: VariantMapping): number | null => variantById.get(mapping.variantId)?.catalogExerciseId ?? null;
const mappedCatalogIds = new Set(upperArmMappings.map(catalogIdOf).filter((id): id is number => id !== null));
const tagsUpperArm = (exercise: Exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((key) => UPPER_ARM_KEYS.has(key));

/**
 * Words athlete-facing copy may not use. Rationales and unmapped reasons are shown on the page and
 * freeze at publish: no growth promise, no percentages, no screen or body side, no side or count
 * words the both-sides page no longer says, no "table", no internal words.
 */
const COPY_REFUSED: [string, RegExp][] = [
  ["growth wording", /\b(grow|grows|grew|growth|hypertroph\w*|bigger|muscle size|gains?)\b/i],
  ["a percentage", /%|\bper ?cent\b/i],
  ["a screen or body side", /\b(left|right)\b/i],
  ["side or count words", /\bcounts? on both\b|\barm's side\b|\b(each|both) (arm|arms|side|sides)\b/i],
  ["\"table\"", /\btable\b/i],
  ["internal words", /\blaterality\b|catalog's primary tag|\bvariants?\b/i],
];
const MAX_COPY = 450;
const copyProblems = (where: string, text: string): string[] => [
  ...COPY_REFUSED.filter(([, pattern]) => pattern.test(text)).map(([what]) => `${where}: ${what}`),
  ...(text.length > MAX_COPY ? [`${where}: ${text.length} characters, over ${MAX_COPY}`] : []),
];

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

  it("keep the copy rules: no growth, side or internal words", () => {
    const refused = COPY_REFUSED.filter(([what]) => what !== "\"table\"");
    expect(refused.filter(([, pattern]) => pattern.test(upperArmMethodNotes)).map(([what]) => what)).toEqual([]);
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
      expect(variant, `${mapping.id}: the library holds no ${mapping.variantId}`).toBeDefined();
      if (!variant) continue;
      expect(variantFor(variant.catalogExerciseId), mapping.id).toBe(variant);
      expect(catalogById.get(variant.catalogExerciseId)?.name, mapping.id).toBe(variant.catalogName);
    }
  });

  it("sit on no node or action the region lacks: own target muscles, region actions, their node actions", () => {
    for (const mapping of upperArmMappings) {
      const node = nodeById.get(mapping.nodeId);
      expect(node, `${mapping.id}: an upper-arm node`).toBeDefined();
      if (!node) continue;
      expect(node.regionId, mapping.id).toBe(upperArmContent.region.id);
      expect(node.role, `${mapping.id}: only target muscles are mapped (no group, adjacent or external)`).toBe("target");
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

  it("keep §8's evidence standard: every citation located and limited, a basis on every reviewed row, a reason on every draft", () => {
    for (const mapping of upperArmMappings) {
      expect(mapping.sources.length, mapping.id).toBeGreaterThan(0);
      for (const ref of mapping.sources) {
        expect(sourceById.has(ref.sourceId), `${mapping.id} → ${ref.sourceId}`).toBe(true);
        expect(ref.locator?.trim(), `${mapping.id} → ${ref.sourceId}: locator`).toBeTruthy();
        expect(ref.limitation?.trim(), `${mapping.id} → ${ref.sourceId}: limitation`).toBeTruthy();
      }
      expect(mapping.rationale.length, mapping.id).toBeGreaterThan(40);
      if (mapping.reviewStatus === "reviewed") expect(["anatomy", "inference", "emg"], mapping.id).toContain(mapping.evidenceBasis);
      if (mapping.reviewStatus === "draft") {
        expect(mapping.rationale, `${mapping.id}: a draft says it is pending review`).toMatch(/\bpending review\b/i);
        expect(mapping.rationale, `${mapping.id}: a draft says why`).toMatch(/\b(not established|not defined|not known|disputed|unclear)\b/i);
      }
      if (mapping.evidenceBasis === "emg") expect(mapping.sources.some((ref) => sourceById.get(ref.sourceId)?.evidenceType === "emg"), mapping.id).toBe(true);
    }
  });

  it("cite each source once per row, as the database keeps a row's citations (one per source)", () => {
    for (const mapping of upperArmMappings) {
      const ids = mapping.sources.map((ref) => ref.sourceId);
      expect(new Set(ids).size, mapping.id).toBe(ids.length);
    }
  });

  it("cite no growth or training study: growth findings are never credit", () => {
    for (const mapping of upperArmMappings) {
      for (const ref of mapping.sources) {
        const source = sourceById.get(ref.sourceId);
        expect(source?.evidenceType, `${mapping.id} → ${ref.sourceId}`).not.toBe("longitudinal");
        expect(source?.title ?? "", `${mapping.id} → ${ref.sourceId}`).not.toMatch(/hypertroph|growth|muscle volume/i);
      }
    }
  });

  it("speak to the athlete in plain words, 450 characters at most", () => {
    const problems = [
      ...upperArmMappings.flatMap((mapping) => copyProblems(mapping.id, mapping.rationale)),
      ...upperArmUnmapped.flatMap((entry) => copyProblems(`unmapped ${entry.catalogId}`, entry.reason)),
    ];
    expect(problems).toEqual([]);
  });

  it("never let steadying or holding earn dynamic credit, and give every reviewed row a countable category", () => {
    for (const mapping of upperArmMappings) {
      if (mapping.relationship === "stabilizer" || mapping.relationship === "incidental") expect(mapping.muscleMode, mapping.id).toBe("isometric");
      const variant = variantById.get(mapping.variantId);
      if (variant && mapping.reviewStatus === "reviewed") expect(categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold), mapping.id).not.toBe("unknown");
      expect(mapping.requiresNoStraps, `${mapping.id}: straps decide only grip mappings, which are the forearm's`).toBe(false);
    }
  });

  it("read a side only from a limb the variant uses (§2.1 rule 5)", () => {
    for (const mapping of upperArmMappings) {
      if (variantById.get(mapping.variantId)?.laterality === "not_applicable") expect(mapping.sideRelation, mapping.id).toBe("both");
    }
  });

  it("hold no shoulder-flexion row at all in v1: the biceps' help there is disputed (Levy 2001)", () => {
    expect(upperArmMappings.filter((mapping) => mapping.actionId === "shoulder.flexion").map((mapping) => mapping.id)).toEqual([]);
  });
});
