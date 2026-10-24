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
/** A row as the calculator and the page read it: everything but its words and sources. */
const shape = (mapping: Pick<VariantMapping, "nodeId" | "actionId" | "relationship" | "muscleMode" | "evidenceBasis" | "allocation" | "reviewStatus"> | undefined) =>
  mapping && [mapping.nodeId, mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.evidenceBasis, mapping.allocation, mapping.reviewStatus].join(" ");
const sorted = (list: number[]) => [...list].sort((x, y) => x - y);

const ids = pullsCurlsCatalogIds;
const curlIds = [...ids.supinatedCurls, ...ids.neutralCurls, ...ids.pronatedCurls, ...ids.zottmanCurls];
const elbowPullIds: number[] = Object.values(ids.elbowPulls).flat();
const familyIds: number[] = [...curlIds, ...elbowPullIds, ...ids.facePulls, ...ids.uprightPulls, ...ids.pullovers, ...ids.straightArmPulldowns];
const mappedCatalogIds = new Set(pullsCurlsMappings.map((mapping) => variantById.get(mapping.variantId)!.catalogExerciseId));
const has = (list: readonly number[], id: number) => list.includes(id);

// ---------------------------------------------------------------- every row's shape, by group

const row = (nodeId: string, actionId: string, relationship: string, muscleMode: string, evidenceBasis: string, allocation: string, reviewStatus: string) =>
  [nodeId, actionId, relationship, muscleMode, evidenceBasis, allocation, reviewStatus].join(" ");
const flexors = (relationship: string, basis: string, status: string) => [m.biceps, m.brachialis].map((nodeId) => row(nodeId, "elbow.flexion", relationship, "dynamic", basis, "individual", status));
const tricepsHold = [m.tricepsLateral, m.tricepsMedial].map((nodeId) => row(nodeId, "elbow.extension", "stabilizer", "isometric", "inference", "shared", "reviewed"));

/** The rows each catalog id must have, exactly: the family's decisions, pinned. */
function expectedRows(id: number): string[] {
  if (has(ids.supinatedCurls, id) || has(ids.zottmanCurls, id)) return flexors("direct", "anatomy", "reviewed");
  if (has(ids.neutralCurls, id)) return [row(m.biceps, "elbow.flexion", "contributing", "dynamic", "anatomy", "individual", "reviewed"), row(m.brachialis, "elbow.flexion", "direct", "dynamic", "anatomy", "individual", "reviewed")];
  if (has(ids.pronatedCurls, id)) return [row(m.biceps, "elbow.flexion", "contributing", "dynamic", "emg", "individual", "reviewed"), row(m.brachialis, "elbow.flexion", "direct", "dynamic", "anatomy", "individual", "reviewed")];
  if (has(elbowPullIds, id)) {
    const longHead = has(ids.frontToBackPulls, id) ? [row(m.tricepsLong, "shoulder.extension", "contributing", "dynamic", "inference", "individual", "draft")] : [];
    return [...flexors("contributing", "anatomy", "reviewed"), ...longHead];
  }
  if (has(ids.facePulls, id)) return flexors("contributing", "inference", "reviewed");
  if (has(ids.uprightPulls, id)) return flexors("contributing", "inference", "draft");
  if (id === 64) return [row(m.tricepsLong, "shoulder.extension", "contributing", "dynamic", "inference", "individual", "draft")];
  if (has(ids.pullovers, id) || has(ids.straightArmPulldowns, id)) return [row(m.tricepsLong, "shoulder.extension", "contributing", "dynamic", "anatomy", "individual", "reviewed"), ...tricepsHold];
  throw new Error(`${id} is in no group`);
}

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
      expect(categoryFor(mapping.relationship, mapping.muscleMode, variant!.deliberateHold), mapping.id).not.toBe("unknown");
    }
  });

  it("has a unique id", () => {
    const keys = pullsCurlsMappings.map((mapping) => mapping.id);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("pins every row's full shape, group by group", () => {
    for (const id of familyIds) expect(mappingsFor(id).map(shape).sort(), String(id)).toEqual(expectedRows(id).sort());
    const expectedCount = familyIds.reduce((sum, id) => sum + expectedRows(id).length, 0);
    expect(pullsCurlsMappings).toHaveLength(expectedCount);
  });

  it("is reviewed only with a rationale, a basis and located, limited sources; a draft says why", () => {
    for (const mapping of pullsCurlsMappings) {
      expect(mapping.rationale.trim().length, mapping.id).toBeGreaterThan(40);
      expect(mapping.sources.length, mapping.id).toBeGreaterThan(0);
      for (const ref of mapping.sources) expect(sources.has(ref.sourceId), `${mapping.id} → ${ref.sourceId}`).toBe(true);
      if (mapping.reviewStatus === "reviewed") {
        for (const ref of mapping.sources) {
          expect(ref.locator?.trim(), `${mapping.id} → ${ref.sourceId} locator`).toBeTruthy();
          expect(ref.limitation?.trim(), `${mapping.id} → ${ref.sourceId} limitation`).toBeTruthy();
        }
      } else {
        expect(mapping.rationale, mapping.id).toMatch(/not established/);
        expect(mapping.rationale, mapping.id).toMatch(/pending review/);
        expect([mapping.relationship, mapping.muscleMode], mapping.id).toEqual(["contributing", "dynamic"]);
      }
      if (mapping.evidenceBasis === "emg") expect(mapping.sources.some((ref) => sources.get(ref.sourceId)?.evidenceType === "emg"), mapping.id).toBe(true);
      if (mapping.evidenceBasis === "anatomy") expect(mapping.sources.some((ref) => sources.get(ref.sourceId)?.evidenceType === "anatomy"), mapping.id).toBe(true);
    }
  });

  /** Words athlete-facing copy never uses: growth, percentages, screen or body sides, counting words, and internal terms. */
  const forbiddenCopy = /%|\bper ?cent\b|optimal|guarantee|growth|\bgrows?\b|\bbuilds?\b|\bsize\b|hypertroph|\bwill (grow|get bigger|increase)\b|\btables?\b|\b(left|right)\b|\bsides?\b|\bcount(s|ed|ing)?\b|laterality|primary tag|\bvariants?\b/i;

  it("is plain athlete-facing copy: at most 450 characters, no growth, percentage, side, count or internal words", () => {
    for (const mapping of pullsCurlsMappings) {
      expect(mapping.rationale.length, mapping.id).toBeLessThanOrEqual(450);
      expect(mapping.rationale, mapping.id).not.toMatch(forbiddenCopy);
    }
    for (const entry of pullsCurlsUnmapped) {
      expect(entry.reason.length, String(entry.catalogId)).toBeLessThanOrEqual(450);
      expect(entry.reason, String(entry.catalogId)).not.toMatch(forbiddenCopy);
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
      expect(shape({ ...lateral, nodeId: "head" }), String(id)).toEqual(shape({ ...medial, nodeId: "head" }));
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

describe("upper-arm pulls and curls: coverage and groups", () => {
  it("maps or lists every catalog row of the family in the upper arm's scope", () => {
    const listed = new Map(pullsCurlsUnmapped.map((entry) => [entry.catalogId, entry]));
    const family = exercises.filter((exercise) => tagsUpperArm(exercise) && inFamily(exercise)).map((exercise) => exercise.id);
    // 79: the lane's 78 and 74 L-Sit Pull-Up, which the variants lane's catalog fix tags biceps (variants.md).
    expect(family).toHaveLength(79);
    for (const id of family) expect(mappedCatalogIds.has(id) || listed.has(id), `${id} ${catalogById.get(id)!.name}`).toBe(true);
    for (const [id, entry] of Array.from(listed)) {
      expect(catalogById.has(id), String(id)).toBe(true);
      expect(mappedCatalogIds.has(id), `${id} is both mapped and listed`).toBe(false);
      expect(entry.reason.length, String(id)).toBeGreaterThan(20);
    }
    // The family as the file states it: the 79 tagged rows and the three untagged ones it maps, each once.
    expect(new Set(familyIds).size).toBe(familyIds.length);
    expect(sorted(familyIds)).toEqual(sorted([...family, ...pullsCurlsUntaggedMapped]));
    expect(sorted(Array.from(mappedCatalogIds))).toEqual(sorted(familyIds));
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
    expect(elbowPullIds).toHaveLength(46);
  });

  it("ties every other group to its variants' records, so moving an exercise changes its rows", () => {
    const familyVariants = familyIds.map((id) => variantFor(id)!);
    const named = (pattern: RegExp) => sorted(familyVariants.filter((variant) => pattern.test(variant.catalogName)).map((variant) => variant.catalogExerciseId));
    const noted = (pattern: RegExp) => sorted(familyVariants.filter((variant) => pattern.test(variant.notes ?? "")).map((variant) => variant.catalogExerciseId));
    expect(sorted([...ids.facePulls])).toEqual(named(/face pull|rear-delt/i));
    expect(sorted([...ids.uprightPulls])).toEqual(noted(/up the front of the body/i));
    expect(sorted([...ids.pullovers])).toEqual(named(/pullover/i));
    expect(sorted([...ids.straightArmPulldowns])).toEqual(named(/straight-arm/i));
    for (const id of ids.straightArmPulldowns) expect(variantFor(id)!.notes, String(id)).toMatch(/straight/i);
    // The long head's drafts sit on exactly the vertical pulls done palms in or up.
    const frontToBack = elbowPullIds.filter((id) => catalogById.get(id)!.movement === "Vertical pull" && ["neutral", "supinated"].includes(variantFor(id)!.forearmOrientation));
    expect(sorted([...ids.frontToBackPulls])).toEqual(sorted(frontToBack));
    // No elbow pull is a straight-arm, face or upright pull.
    for (const id of elbowPullIds) {
      const variant = variantFor(id)!;
      expect(variant.catalogName, String(id)).not.toMatch(/pullover|straight-arm|face pull|rear-delt|upright|high pull/i);
      expect(variant.notes ?? "", String(id)).not.toMatch(/arms stay straight|up the front of the body/i);
    }
  });
});

describe("upper-arm pulls and curls: the judgment calls", () => {
  /** Where a curl row is meant to read differently from the forearm's frozen row, by mapping id. None. */
  const intendedCurlDifferences: string[] = [];

  it("reads the biceps and brachialis in every curl as the forearm's frozen rows do, basis and allocation included", () => {
    for (const id of curlIds) {
      for (const nodeId of [m.biceps, m.brachialis]) {
        const frozen = forearmMappings.find((mapping) => mapping.id === `${variantIdFor(id)}:${nodeId}`);
        expect(frozen, `${id} ${nodeId}`).toBeDefined();
        if (intendedCurlDifferences.includes(frozen!.id)) continue;
        expect(shape(mappingOf(id, nodeId)), `${id} ${nodeId}`).toEqual(shape(frozen));
      }
      expect(nodesOf(id), String(id)).toEqual([m.biceps, m.brachialis].sort());
    }
  });

  it("never credits supination in this family: a curl's turn carries no load", () => {
    for (const mapping of pullsCurlsMappings) expect(mapping.actionId, mapping.id).not.toBe("forearm.supination");
  });

  it("credits no triceps head on a pull that bends the elbow, apart from the long head's drafts", () => {
    for (const id of [...elbowPullIds, ...ids.facePulls, ...ids.uprightPulls, ...curlIds]) {
      for (const head of [m.tricepsLateral, m.tricepsMedial]) expect(mappingOf(id, head), `${id} ${head}`).toBeUndefined();
      const longHead = mappingOf(id, m.tricepsLong);
      if (longHead) expect(longHead.reviewStatus, longHead.id).toBe("draft");
    }
    for (const id of [...ids.pullovers, ...ids.straightArmPulldowns]) {
      expect(mappingOf(id, m.biceps), String(id)).toBeUndefined();
      expect(mappingOf(id, m.brachialis), String(id)).toBeUndefined();
    }
  });

  it("holds the drafts to the stated list", () => {
    const drafts = pullsCurlsMappings.filter((mapping) => mapping.reviewStatus === "draft").map((mapping) => mapping.id).sort();
    const expected = [
      ...[317, 335].flatMap((id) => [`cat-${id}:${m.biceps}`, `cat-${id}:${m.brachialis}`]),
      `cat-64:${m.tricepsLong}`,
      ...ids.frontToBackPulls.map((id) => `cat-${id}:${m.tricepsLong}`),
    ].sort();
    expect(drafts).toEqual(expected);
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
    for (const id of [125, 126, 127, 129, 130, 131, 137, 338, 339, 340, 341]) {
      expect(mappingOf(id, m.biceps)!.rationale, String(id)).toMatch(/earns no extra credit/);
      expect(mappingOf(id, m.brachialis)!.rationale, String(id)).toMatch(/does not cross the shoulder/);
    }
  });
});

describe("upper-arm pulls and curls: new sources", () => {
  it("adds only new keys and URLs, with stable slugs and notes", () => {
    const libraryIds = new Set(sourceLibrary.map((source) => source.id));
    const normal = (url: string) => url.trim().replace(/\/+$/, "").toLowerCase();
    const libraryUrls = new Set(sourceLibrary.map((source) => normal(source.url)));
    // Wired into the library at integration (23 Oct 2026): each is there once, and no other key holds its URL.
    const others = sourceLibrary.filter((source) => !upperArmPullsCurlsSources.includes(source));
    const otherIds = new Set(others.map((source) => source.id));
    const otherUrls = new Set(others.map((source) => normal(source.url)));
    for (const source of upperArmPullsCurlsSources) {
      expect(libraryIds.has(source.id), source.id).toBe(true);
      expect(sourceLibrary.filter((item) => item === source), source.id).toHaveLength(1);
      expect(otherIds.has(source.id), source.id).toBe(false);
      expect(otherUrls.has(normal(source.url)), source.id).toBe(false);
      expect(source.id).toMatch(/^([a-z][a-z0-9_]*\.[a-z0-9_]+|pmid\.\d+)$/);
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
