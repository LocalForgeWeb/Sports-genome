import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { forearmMappings } from "@shared/specialization/regions/forearm/mappings";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import { UPPER_ARM_MAPPING_VERSION, upperArmMuscleIds as m, upperArmTargetIds } from "@shared/specialization/regions/upper_arm/ids";
import { pullsCurlsCatalogIds, pullsCurlsMappings, pullsCurlsUnmapped, pullsCurlsUntaggedMapped } from "@shared/specialization/regions/upper_arm/mappings/pullsCurls";
import { sourceLibrary } from "@shared/specialization/sources";
import { upperArmPullsCurlsSources } from "@shared/specialization/sources/upper_arm-pullsCurls";
import { variantById, variantFor } from "@shared/specialization/variants";
import { variantIdFor } from "@shared/specialization/ids";
import { categoryFor } from "@shared/specialization/rules";
import type { VariantMapping } from "@shared/specialization/types";

/**
 * The upper arm's pulls, rows and curls (`upper_arm_mappings_v1`, regions/upper_arm/mappings/
 * pullsCurls.ts), held to the evidence standard and the mapping rules of
 * docs/specialization-atlas/10-multi-region.md §4 and §8 and to the forearm's method
 * (05-mappings.md). The rules every production region keeps are also checked in
 * regionContent.test.ts once the integration lane wires this family into the region; these hold
 * the family on its own, before that.
 */

const UPPER_ARM_KEYS = new Set(upperArmContent.region.catalogKeys);
const catalogById = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const tagsUpperArm = (exercise: Exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((key) => UPPER_ARM_KEYS.has(key));
/** The family by the catalog's own words: a pull or elbow flexion, or a name that says row, pull-up, chin-up, pulldown, pullover, face pull, high pull or curl. */
const inFamily = (exercise: Exercise) =>
  ["Horizontal pull", "Vertical pull", "Elbow flexion"].includes(exercise.movement) || /\b(row|pull-up|chin-up|pulldown|pullover|face pull|high pull|curl)\b/i.test(exercise.name);

const ownTargets = new Set<string>(upperArmTargetIds);
const actionsOf = new Map<string, Set<string>>();
for (const row of upperArmContent.nodeActions) actionsOf.set(row.nodeId, (actionsOf.get(row.nodeId) ?? new Set()).add(row.actionId));
const sources = new Map([...sourceLibrary, ...upperArmPullsCurlsSources].map((source) => [source.id, source]));

const mappingsFor = (catalogId: number) => pullsCurlsMappings.filter((mapping) => mapping.variantId === variantIdFor(catalogId));
const mappingOf = (catalogId: number, nodeId: string) => pullsCurlsMappings.find((mapping) => mapping.id === `${variantIdFor(catalogId)}:${nodeId}`);
const nodesOf = (catalogId: number) => mappingsFor(catalogId).map((mapping) => mapping.nodeId).sort();
const shape = (mapping: VariantMapping | undefined) => mapping && [mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.reviewStatus];

const ids = pullsCurlsCatalogIds;
const curlIds = [...ids.supinatedCurls, ...ids.neutralCurls, ...ids.pronatedCurls, ...ids.zottmanCurls];
const elbowPullIds = Object.values(ids.elbowPulls).flat();
const familyIds = [...curlIds, ...elbowPullIds, ...ids.facePulls, ...ids.uprightPulls, ...ids.pullovers, ...ids.straightArmPulldowns];
const mappedCatalogIds = new Set(pullsCurlsMappings.map((mapping) => variantById.get(mapping.variantId)!.catalogExerciseId));

describe("upper-arm pulls and curls: every row", () => {
  it("is a valid row of the upper arm's version, on a current library variant, for an own target muscle", () => {
    for (const mapping of pullsCurlsMappings) {
      expect(mapping.versionKey, mapping.id).toBe(UPPER_ARM_MAPPING_VERSION);
      expect(mapping.id).toBe(`${mapping.variantId}:${mapping.nodeId}`);
      const variant = variantById.get(mapping.variantId);
      expect(variant, mapping.id).toBeDefined();
      expect(variantFor(variant!.catalogExerciseId), mapping.id).toBe(variant);
      expect(ownTargets.has(mapping.nodeId), `${mapping.id}: an upper-arm target`).toBe(true);
      expect(["direct", "contributing", "stabilizer", "incidental"], mapping.id).toContain(mapping.relationship);
      expect(["dynamic", "isometric"], mapping.id).toContain(mapping.muscleMode);
      expect(["anatomy", "inference", "emg"], mapping.id).toContain(mapping.evidenceBasis);
      expect(["individual", "shared"], mapping.id).toContain(mapping.allocation);
      expect(["reviewed", "draft"], mapping.id).toContain(mapping.reviewStatus);
      expect(mapping.requiresNoStraps, mapping.id).toBe(false);
      expect(mapping.sideRelation, mapping.id).toBe("same");
      expect(variant!.laterality, mapping.id).not.toBe("not_applicable");
      if (mapping.relationship === "stabilizer" || mapping.relationship === "incidental") expect(mapping.muscleMode, mapping.id).toBe("isometric");
      const category = categoryFor(mapping.relationship, mapping.muscleMode, variant!.deliberateHold);
      expect(category, mapping.id).not.toBe("unknown");
    }
  });

  it("has a unique id", () => {
    const keys = pullsCurlsMappings.map((mapping) => mapping.id);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is reviewed only with a rationale, a basis and a located, limited source; a draft says why", () => {
    for (const mapping of pullsCurlsMappings) {
      expect(mapping.rationale.trim().length, mapping.id).toBeGreaterThan(40);
      expect(mapping.sources.length, mapping.id).toBeGreaterThan(0);
      for (const ref of mapping.sources) expect(sources.has(ref.sourceId), `${mapping.id} → ${ref.sourceId}`).toBe(true);
      if (mapping.reviewStatus === "reviewed") {
        expect(mapping.sources.some((ref) => Boolean(ref.locator?.trim()) && Boolean(ref.limitation?.trim())), mapping.id).toBe(true);
        expect(["anatomy", "inference", "emg"], mapping.id).toContain(mapping.evidenceBasis);
      } else {
        expect(mapping.rationale, mapping.id).toMatch(/not established/);
        expect(mapping.rationale, mapping.id).toMatch(/pending review/);
      }
      if (mapping.evidenceBasis === "emg") expect(mapping.sources.some((ref) => sources.get(ref.sourceId)?.evidenceType === "emg"), mapping.id).toBe(true);
    }
  });

  it("says nothing about growth, percentages or screen sides", () => {
    for (const mapping of pullsCurlsMappings) {
      expect(mapping.rationale, mapping.id).not.toMatch(/%|\bper ?cent\b|optimal|guarantee|\bwill (grow|get bigger|increase)\b|\btables?\b|\b(left|right)\b/i);
    }
  });

  it("writes the lateral and medial heads together and shared, wherever either appears", () => {
    for (const id of familyIds) {
      const lateral = mappingOf(id, m.tricepsLateral);
      const medial = mappingOf(id, m.tricepsMedial);
      expect(Boolean(lateral), String(id)).toBe(Boolean(medial));
      if (!lateral || !medial) continue;
      expect(lateral.allocation, lateral.id).toBe("shared");
      expect(medial.allocation, medial.id).toBe("shared");
      expect(shape(lateral), String(id)).toEqual(shape(medial));
    }
  });

  it("maps no muscle outside the upper arm (the forearm credits its brachioradialis) and no parent or adjacent node", () => {
    for (const mapping of pullsCurlsMappings) {
      expect(mapping.nodeId.startsWith("upper_arm."), mapping.id).toBe(true);
      expect(["forearm.br", "upper_arm.triceps", "upper_arm.coracobrachialis"], mapping.id).not.toContain(mapping.nodeId);
    }
  });

  it("maps a muscle only for an action its node actions name (no fan-out)", () => {
    for (const mapping of pullsCurlsMappings) {
      const known = actionsOf.get(mapping.nodeId);
      expect(known?.size, mapping.nodeId).toBeGreaterThan(0);
      expect(known!.has(mapping.actionId!), `${mapping.id}: ${mapping.actionId}`).toBe(true);
    }
  });
});

describe("upper-arm pulls and curls: coverage", () => {
  it("maps or lists every catalog row of the family in the upper arm's scope", () => {
    const listed = new Map(pullsCurlsUnmapped.map((entry) => [entry.catalogId, entry]));
    const family = exercises.filter((exercise) => tagsUpperArm(exercise) && inFamily(exercise)).map((exercise) => exercise.id);
    expect(family).toHaveLength(78);
    for (const id of family) expect(mappedCatalogIds.has(id) || listed.has(id), `${id} ${catalogById.get(id)!.name}`).toBe(true);
    for (const [id, entry] of Array.from(listed)) {
      expect(catalogById.has(id), String(id)).toBe(true);
      expect(mappedCatalogIds.has(id), `${id} is both mapped and listed`).toBe(false);
      expect(entry.reason.length, String(id)).toBeGreaterThan(20);
    }
    // The family as the file states it: the 78 tagged rows and the four untagged ones it maps, each once.
    expect(new Set(familyIds).size).toBe(familyIds.length);
    expect([...familyIds].sort((x, y) => x - y)).toEqual([...family, ...pullsCurlsUntaggedMapped].sort((x, y) => x - y));
    expect(Array.from(mappedCatalogIds).sort((x, y) => x - y)).toEqual([...familyIds].sort((x, y) => x - y));
  });

  it("maps untagged rows only where the upper arm is really loaded, and says which", () => {
    for (const id of pullsCurlsUntaggedMapped) {
      expect(tagsUpperArm(catalogById.get(id)!), String(id)).toBe(false);
      expect(inFamily(catalogById.get(id)!), String(id)).toBe(true);
    }
    // The scapular pull-up keeps its arms straight; its biceps tag was a catalog error, removed.
    expect(mappedCatalogIds.has(79)).toBe(false);
    expect(tagsUpperArm(catalogById.get(79)!)).toBe(false);
  });

  it("groups each pull and curl by its variant's own grip", () => {
    for (const [grip, list] of Object.entries(ids.elbowPulls)) for (const id of list) expect(variantFor(id)!.forearmOrientation, String(id)).toBe(grip);
    for (const id of ids.supinatedCurls) expect(variantFor(id)!.forearmOrientation, String(id)).toBe("supinated");
    for (const id of ids.neutralCurls) expect(variantFor(id)!.forearmOrientation, String(id)).toBe("neutral");
    for (const id of ids.pronatedCurls) expect(variantFor(id)!.forearmOrientation, String(id)).toBe("pronated");
    for (const id of ids.zottmanCurls) expect(variantFor(id)!.forearmOrientation, String(id)).toBe("changing");
    for (const id of curlIds) expect(catalogById.get(id)!.movement, String(id)).toBe("Elbow flexion");
    expect(curlIds).toHaveLength(25);
  });
});

describe("upper-arm pulls and curls: the judgment calls", () => {
  it("reads the biceps and brachialis in every curl exactly as the forearm's frozen rows do", () => {
    for (const id of curlIds) {
      for (const nodeId of [m.biceps, m.brachialis]) {
        const frozen = forearmMappings.find((mapping) => mapping.id === `${variantIdFor(id)}:${nodeId}`);
        expect(frozen, `${id} ${nodeId}`).toBeDefined();
        expect(shape(mappingOf(id, nodeId)), `${id} ${nodeId}`).toEqual(shape(frozen));
      }
      expect(nodesOf(id), String(id)).toEqual([m.biceps, m.brachialis].sort());
    }
    for (const id of [...ids.neutralCurls, ...ids.pronatedCurls]) expect(mappingOf(id, m.biceps)!.relationship, String(id)).toBe("contributing");
    for (const id of curlIds) expect(mappingOf(id, m.brachialis)!.relationship, String(id)).toBe("direct");
  });

  it("never credits supination in this family: a curl's turn carries no load", () => {
    for (const mapping of pullsCurlsMappings) expect(mapping.actionId, mapping.id).not.toBe("forearm.supination");
  });

  it("credits the elbow flexors in every row, pulldown and pull-up as contributing, dynamic and reviewed, whatever the grip", () => {
    for (const id of elbowPullIds) {
      expect(nodesOf(id), String(id)).toEqual([m.biceps, m.brachialis].sort());
      for (const nodeId of [m.biceps, m.brachialis]) expect(shape(mappingOf(id, nodeId)), `${id} ${nodeId}`).toEqual(["elbow.flexion", "contributing", "dynamic", "reviewed"]);
    }
    expect(elbowPullIds).toHaveLength(46);
  });

  it("credits the long head only in straight-arm shoulder extension, never in pulls that bend the elbow", () => {
    for (const id of [...elbowPullIds, ...ids.facePulls, ...ids.uprightPulls, ...curlIds]) {
      for (const head of [m.tricepsLong, m.tricepsLateral, m.tricepsMedial]) expect(mappingOf(id, head), `${id} ${head}`).toBeUndefined();
    }
    for (const id of [...ids.pullovers, ...ids.straightArmPulldowns]) {
      expect(mappingOf(id, m.biceps), String(id)).toBeUndefined();
      expect(mappingOf(id, m.brachialis), String(id)).toBeUndefined();
      const longHead = mappingOf(id, m.tricepsLong)!;
      expect([longHead.actionId, longHead.relationship, longHead.muscleMode], String(id)).toEqual(["shoulder.extension", "contributing", "dynamic"]);
    }
    for (const id of ids.straightArmPulldowns) {
      for (const head of [m.tricepsLateral, m.tricepsMedial]) expect(shape(mappingOf(id, head)), `${id} ${head}`).toEqual(["elbow.extension", "stabilizer", "isometric", "reviewed"]);
    }
    for (const id of ids.pullovers) expect(nodesOf(id), String(id)).toEqual([m.tricepsLong]);
  });

  it("credits face pulls' elbow work from the joint's mechanics, and leaves the upright row and high pull pending review", () => {
    for (const id of ids.facePulls) {
      for (const nodeId of [m.biceps, m.brachialis]) {
        const mapping = mappingOf(id, nodeId)!;
        expect(shape(mapping), `${id} ${nodeId}`).toEqual(["elbow.flexion", "contributing", "dynamic", "reviewed"]);
        expect(mapping.evidenceBasis, mapping.id).toBe("inference");
      }
    }
    const drafts = pullsCurlsMappings.filter((mapping) => mapping.reviewStatus === "draft").map((mapping) => mapping.id).sort();
    expect(drafts).toEqual(["cat-317:upper_arm.biceps", "cat-317:upper_arm.brachialis", "cat-335:upper_arm.biceps", "cat-335:upper_arm.brachialis", "cat-64:upper_arm.triceps_long"].sort());
    // The forearm leaves the same question open for its brachioradialis on the upright row.
    expect(forearmMappings.find((mapping) => mapping.id === "cat-317:forearm.br")!.reviewStatus).toBe("draft");
  });

  it("credits no deliberate hold: every variant here is logged in repetitions", () => {
    for (const id of familyIds) {
      const variant = variantFor(id)!;
      expect(variant.measure, String(id)).toBe("reps");
      expect(variant.deliberateHold, String(id)).toBe(false);
    }
  });

  it("describes where a curl holds the upper arm without changing its credit", () => {
    const supinatedBiceps = (id: number) => shape(mappingOf(id, m.biceps));
    for (const id of [125, 126, 127, 129, 130, 131, 137, 338, 339, 340, 341]) {
      expect(mappingOf(id, m.biceps)!.rationale, String(id)).toMatch(/earns no extra credit/);
      expect(mappingOf(id, m.brachialis)!.rationale, String(id)).toMatch(/does not cross the shoulder/);
      expect(supinatedBiceps(id), String(id)).toEqual(supinatedBiceps(121));
    }
  });
});

describe("upper-arm pulls and curls: new sources", () => {
  it("adds only new keys and URLs, with stable slugs and notes", () => {
    const libraryIds = new Set(sourceLibrary.map((source) => source.id));
    const normal = (url: string) => url.trim().replace(/\/+$/, "").toLowerCase();
    const libraryUrls = new Set(sourceLibrary.map((source) => normal(source.url)));
    for (const source of upperArmPullsCurlsSources) {
      expect(libraryIds.has(source.id), source.id).toBe(false);
      expect(libraryUrls.has(normal(source.url)), source.id).toBe(false);
      expect(source.id).toMatch(/^[a-z][a-z0-9_]*\.[a-z0-9_]+$/);
      expect(source.notes?.length ?? 0, source.id).toBeGreaterThan(100);
    }
    const ownIds = upperArmPullsCurlsSources.map((source) => source.id);
    expect(new Set(ownIds).size).toBe(ownIds.length);
    // Every new source is cited, and only for what it measured: muscle activity, never growth.
    const cited = new Set(pullsCurlsMappings.flatMap((mapping) => mapping.sources.map((ref) => ref.sourceId)));
    for (const source of upperArmPullsCurlsSources) {
      expect(cited.has(source.id), source.id).toBe(true);
      expect(source.evidenceType, source.id).toBe("emg");
    }
  });
});
