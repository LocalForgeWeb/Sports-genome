import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { forearmMappingsV1, forearmMappingVersionV1 } from "@shared/specialization/__fixtures__/forearmMappingsV1";
import { forearmContent } from "@shared/specialization/regions/forearm";
import { coreForearmMuscleIds, forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { forearmMappings, forearmMappingVersion } from "@shared/specialization/regions/forearm/mappings";
import { forearmUnmappedTagged } from "@shared/specialization/regions/forearm/unmapped";
import { forearmVariants } from "@shared/specialization/regions/forearm/variants";
import { categoryFor } from "@shared/specialization/rules";
import { sourceById } from "@shared/specialization/sources";
import { forearmResearchSources } from "@shared/specialization/sources/forearmResearch";
import { variantById } from "@shared/specialization/variants";
import { bothLimbDecisions } from "@shared/specialization/variants/bothLimbs";
import { forearmResearchVariants } from "@shared/specialization/variants/forearmResearch";
import type { VariantMapping } from "@shared/specialization/types";

/**
 * `forearm_mappings_v2` against v1's frozen rows (docs/specialization-atlas/11-forearm-research-
 * and-stack.md §1.2-§1.7, §10 decisions 2 and 4; release F3, 24 Oct 2026): v2 differs from v1 only
 * as listed here, holds no upper-arm muscle (rule 12), keeps every forearm muscle covered, gives
 * every row it changes or adds an action, a basis by the builder's convention, a rationale and
 * located, limited sources, and keeps its words to the page's copy rules.
 */

const v1 = new Map(forearmMappingsV1.map((mapping) => [mapping.id, mapping]));
const v2 = new Map(forearmMappings.map((mapping) => [mapping.id, mapping]));
const id = (catalogId: number, nodeId: string) => `cat-${catalogId}:${nodeId}`;
const ids = (catalogIds: readonly number[], nodeIds: readonly string[]) => catalogIds.flatMap((catalogId) => nodeIds.map((nodeId) => id(catalogId, nodeId)));
const sameRow = (a: VariantMapping, b: VariantMapping) => JSON.stringify({ ...a, versionKey: "" }) === JSON.stringify({ ...b, versionKey: "" });

const EXTENSORS = [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris];
const FLEXORS = [m.flexorCarpiRadialis, m.flexorCarpiUlnaris];

/** Every change v2 makes, by part (§1.7's table, with the conditional rows decided, decision 2's drill and the brachioradialis on pulls). */
const listed = {
  /** v1's four thumb-flexor drafts, reviewed as incidental grip with Hamrick 1998 (§1.3). */
  fplReviewed: ids([144, 145, 299, 409], [m.flexorPollicisLongus]),
  /** v1 rows that gain a second source whose abstract names the muscle (§1.3: S03 on pronation, S04 on deviation). */
  secondSource: [id(405, m.pronatorTeres), id(405, m.pronatorQuadratus), id(407, m.extensorCarpiRadialisLongus), id(407, m.extensorCarpiRadialisBrevis), id(408, m.flexorCarpiUlnaris), id(408, m.extensorCarpiUlnaris)],
  fplOnDeadHang: [id(143, m.flexorPollicisLongus)],
  extensorsSteadying: ids([143, 144, 402, 403], EXTENSORS),
  /** Conditional (§1.4), adopted: S05's excerpt names FCR and FCU among the muscles whose activity rose with grip force. */
  flexorsSteadying: ids([143, 144, 145, 299, 402, 403, 409, 419], FLEXORS),
  /** Conditional (§1.4), adopted: S03's abstract finds the deep head of PQ active in supination. */
  pqSteadying: [id(406, m.pronatorQuadratus)],
  /** §1.2: 417 and 418 the wrist-curl family, 419 the hold family (its wrist flexors are counted above). */
  newRows: [
    ...ids([417, 418], [m.flexorCarpiRadialis, m.flexorCarpiUlnaris, m.palmarisLongus, m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus]),
    ...ids([419], [m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus, ...EXTENSORS, m.flexorPollicisLongus]),
  ],
  /** §10 decision 2: EI and EDM direct, shared; ED contributing. */
  fingerDrill: ids([420], [m.extensorIndicis, m.extensorDigitiMinimi, m.extensorDigitorum]),
  /** Wave A's pulls review: the brachioradialis where the upper arm credits the biceps and brachialis. */
  brachioradialisOnPulls: ids([87, 88, 318, 326, 329, 330, 333], [m.brachioradialis]),
};
const added = [...listed.fplOnDeadHang, ...listed.extensorsSteadying, ...listed.flexorsSteadying, ...listed.pqSteadying, ...listed.newRows, ...listed.fingerDrill, ...listed.brachioradialisOnPulls];
const changedOrAdded = [...listed.fplReviewed, ...listed.secondSource, ...added];

describe("forearm_mappings_v2 against v1's frozen rows", () => {
  it("is v1's 418 rows as published, frozen in a fixture", () => {
    expect(forearmMappingsV1).toHaveLength(418);
    expect(forearmMappingVersionV1).toMatchObject({ key: "forearm_mappings_v1", state: "published", publishedAt: "2026-10-16" });
    expect(forearmMappingsV1.every((mapping) => mapping.versionKey === "forearm_mappings_v1")).toBe(true);
  });

  it("drops exactly v1's 53 rows on the biceps and brachialis (rule 12)", () => {
    const dropped = forearmMappingsV1.filter((mapping) => !v2.has(mapping.id));
    expect(dropped).toHaveLength(53);
    expect(new Set(dropped.map((mapping) => mapping.nodeId))).toEqual(new Set(["upper_arm.biceps", "upper_arm.brachialis"]));
    expect(forearmMappingsV1.filter((mapping) => mapping.nodeId.startsWith("upper_arm.")).length).toBe(53);
  });

  it("adds exactly the listed rows, and changes exactly the listed v1 rows", () => {
    expect(forearmMappings.filter((mapping) => !v1.has(mapping.id)).map((mapping) => mapping.id).sort()).toEqual([...added].sort());
    const changed = forearmMappings.filter((mapping) => v1.has(mapping.id) && !sameRow(mapping, v1.get(mapping.id)!)).map((mapping) => mapping.id);
    expect(changed.sort()).toEqual([...listed.fplReviewed, ...listed.secondSource].sort());
    expect(new Set(added).size).toBe(added.length);
  });

  it("counts as §1.7's table does, with each conditional part decided: 421 rows", () => {
    const unchanged = forearmMappings.filter((mapping) => v1.has(mapping.id) && !listed.fplReviewed.includes(mapping.id));
    expect(unchanged).toHaveLength(361);
    expect(unchanged.filter((mapping) => mapping.reviewStatus === "draft").map((mapping) => mapping.id)).toEqual(["cat-317:forearm.br"]);
    expect(Object.fromEntries(Object.entries(listed).map(([part, list]) => [part, list.length]))).toEqual({
      fplReviewed: 4, secondSource: 6, fplOnDeadHang: 1, extensorsSteadying: 12, flexorsSteadying: 16, pqSteadying: 1, newRows: 16, fingerDrill: 3, brachioradialisOnPulls: 7,
    });
    expect(forearmMappings).toHaveLength(361 + 4 + 1 + 12 + 16 + 1 + 16 + 3 + 7);
  });

  it("changes the thumb flexor's four drafts only to reviewed incidental grip, bare hands, with Hamrick 1998 beside FPL's action row", () => {
    for (const key of listed.fplReviewed) {
      const [before, after] = [v1.get(key)!, v2.get(key)!];
      expect([before.reviewStatus, before.relationship, before.requiresNoStraps], key).toEqual(["draft", "contributing", false]);
      expect([after.reviewStatus, after.relationship, after.muscleMode, after.evidenceBasis, after.actionId, after.requiresNoStraps, after.allocation], key).toEqual(["reviewed", "incidental", "isometric", "inference", "thumb.ip_flexion", true, "individual"]);
      expect(after.sources.map((ref) => ref.sourceId), key).toEqual(["S4", "pmid.9503091"]);
    }
  });

  it("adds a second source to six v1 rows and changes nothing else of them", () => {
    for (const key of listed.secondSource) {
      const [before, after] = [v1.get(key)!, v2.get(key)!];
      expect({ ...after, versionKey: before.versionKey, sources: before.sources }, key).toEqual(before);
      expect(after.sources.slice(0, before.sources.length), key).toEqual(before.sources);
      expect(after.sources.slice(before.sources.length).map((ref) => ref.sourceId), key).toEqual([key.startsWith("cat-405") ? "pmid.14656682" : "pmid.32636008"]);
    }
  });
});

describe("forearm_mappings_v2's rules", () => {
  it("holds no biceps or brachialis row, nor any muscle outside the forearm's 19 (rule 12)", () => {
    const core = new Set<string>(coreForearmMuscleIds);
    expect(forearmMappings.filter((mapping) => !core.has(mapping.nodeId)).map((mapping) => mapping.id)).toEqual([]);
    expect(forearmMappings.filter((mapping) => mapping.nodeId.startsWith("upper_arm."))).toEqual([]);
  });

  it("keeps every forearm muscle covered, reaches the two finger extensors directly, and leaves only the palmaris longus without direct work", () => {
    for (const nodeId of coreForearmMuscleIds) expect(forearmMappings.some((mapping) => mapping.nodeId === nodeId && mapping.reviewStatus === "reviewed"), nodeId).toBe(true);
    const direct = new Set(forearmMappings.filter((mapping) => mapping.reviewStatus === "reviewed" && mapping.relationship === "direct" && mapping.muscleMode === "dynamic").map((mapping) => mapping.nodeId));
    expect(coreForearmMuscleIds.filter((nodeId) => !direct.has(nodeId))).toEqual([m.palmarisLongus]);
    for (const nodeId of [m.extensorIndicis, m.extensorDigitiMinimi]) expect(v2.get(id(420, nodeId))).toMatchObject({ relationship: "direct", muscleMode: "dynamic", allocation: "shared", evidenceBasis: "anatomy", reviewStatus: "reviewed" });
    expect(v2.get(id(420, m.extensorDigitorum))).toMatchObject({ relationship: "contributing", muscleMode: "dynamic", evidenceBasis: "anatomy", reviewStatus: "reviewed" });
    // Every forearm-muscle row v1 had on a variant is still there: nothing a page credited is lost.
    for (const mapping of forearmMappingsV1.filter((row) => !row.nodeId.startsWith("upper_arm."))) expect(v2.has(mapping.id), mapping.id).toBe(true);
  });

  it("maps the four new rows by the families §1.2 names, every one of their rows reviewed", () => {
    const rowsOf = (catalogId: number) => forearmMappings.filter((mapping) => mapping.variantId === `cat-${catalogId}`);
    const shape = (mapping: VariantMapping) => [mapping.nodeId, mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.evidenceBasis, mapping.allocation, mapping.requiresNoStraps, mapping.rationale, mapping.sources];
    // 417 and 418 are the wrist curl's family row for row: v1's own reviewed 139.
    for (const catalogId of [417, 418]) expect(rowsOf(catalogId).map(shape)).toEqual(forearmMappingsV1.filter((mapping) => mapping.variantId === "cat-139").map(shape));
    // 419: the finger flexors' deliberate hold, bare hands; the wrist muscles steadying; the thumb in the grip.
    const hold = variantById.get("cat-419")!;
    const category = (mapping: VariantMapping) => categoryFor(mapping.relationship, mapping.muscleMode, hold.deliberateHold);
    expect(rowsOf(419).map((mapping) => [mapping.nodeId, category(mapping), mapping.requiresNoStraps])).toEqual([
      [m.flexorDigitorumSuperficialis, "deliberate_isometric", true], [m.flexorDigitorumProfundus, "deliberate_isometric", true], [m.flexorPollicisLongus, "incidental_isometric", true],
      [m.extensorCarpiRadialisLongus, "incidental_isometric", false], [m.extensorCarpiRadialisBrevis, "incidental_isometric", false], [m.extensorCarpiUlnaris, "incidental_isometric", false],
      [m.flexorCarpiRadialis, "incidental_isometric", false], [m.flexorCarpiUlnaris, "incidental_isometric", false],
    ]);
    for (const catalogId of [417, 418, 419, 420]) expect(rowsOf(catalogId).every((mapping) => mapping.reviewStatus === "reviewed"), String(catalogId)).toBe(true);
  });

  it("credits the brachioradialis on the pulls as the v1 pulls do: contributing, dynamic elbow flexion, never direct", () => {
    const pull = v1.get("cat-43:forearm.br")!;
    for (const catalogId of [326, 329, 330, 333]) {
      const row = v2.get(id(catalogId, m.brachioradialis))!;
      expect([row.actionId, row.relationship, row.muscleMode, row.evidenceBasis, row.rationale, row.sources], String(catalogId)).toEqual([pull.actionId, pull.relationship, pull.muscleMode, pull.evidenceBasis, pull.rationale, pull.sources]);
    }
    // The rope face pulls and the rear-delt row: the same credit, resting on the pull's geometry and the muscle's thumbs-up strength.
    for (const catalogId of [87, 88, 318]) {
      const row = v2.get(id(catalogId, m.brachioradialis))!;
      expect([row.actionId, row.relationship, row.muscleMode, row.evidenceBasis, row.sources.map((ref) => ref.sourceId)], String(catalogId)).toEqual(["elbow.flexion", "contributing", "dynamic", "inference", ["S4", "A2"]]);
    }
    expect(v2.get(id(88, m.brachioradialis))!.rationale).toMatch(/rotators, not the elbow/);
    // 335 Cable High Pull stays listed, not drafted: a draft row alone would take its sets out of the region-only count and credit nothing.
    expect(forearmMappings.some((mapping) => mapping.variantId === "cat-335")).toBe(false);
    expect(forearmUnmappedTagged.map((entry) => entry.catalogId)).toContain(335);
    // The upright row's brachioradialis stays a draft (§1.3).
    expect(v2.get("cat-317:forearm.br")).toEqual({ ...v1.get("cat-317:forearm.br")!, versionKey: "forearm_mappings_v2" });
  });

  it("gives every row it changes or adds an action, a basis by the builder's convention, a rationale and located, limited sources", () => {
    for (const key of changedOrAdded) {
      const row = v2.get(key)!;
      expect(row.reviewStatus, key).toBe("reviewed");
      expect(row.actionId, key).not.toBeNull();
      expect(row.rationale.length, key).toBeGreaterThan(80);
      expect(row.sources.length, key).toBeGreaterThan(0);
      for (const ref of row.sources) {
        expect(sourceById.has(ref.sourceId), `${key} → ${ref.sourceId}`).toBe(true);
        expect(ref.locator, `${key} → ${ref.sourceId}`).toBeTruthy();
        expect(ref.limitation, `${key} → ${ref.sourceId}`).toBeTruthy();
      }
      // Grip is a judgement (inference); steadying rests on its EMG sources (emg); the rest on what the muscle does (anatomy),
      // but the face pulls, which rest on the pull's geometry (inference). EMG only with an EMG source in hand.
      const emgSource = row.sources.some((ref) => sourceById.get(ref.sourceId)!.evidenceType === "emg");
      if (row.evidenceBasis === "emg") expect(emgSource, key).toBe(true);
      if (row.relationship === "incidental") expect(row.evidenceBasis, key).toBe("inference");
      if (row.relationship === "stabilizer") expect(row.evidenceBasis, key).toBe("emg");
      if (row.relationship === "stabilizer" || row.relationship === "incidental") expect(row.muscleMode, key).toBe("isometric");
    }
    for (const key of listed.secondSource) expect(v2.get(key)!.evidenceBasis, key).toBe(v1.get(key)!.evidenceBasis);
  });

  it("cites its new sources, each from sources/forearmResearch.ts, and every one of them", () => {
    const cited = new Set(forearmMappings.flatMap((mapping) => mapping.sources.map((ref) => ref.sourceId)));
    const v1Cited = new Set(forearmMappingsV1.flatMap((mapping) => mapping.sources.map((ref) => ref.sourceId)));
    const fresh = Array.from(cited).filter((sourceId) => !v1Cited.has(sourceId)).sort();
    expect(fresh).toEqual([...forearmResearchSources.map((source) => source.id), "A2", "A35", "A37"].sort());
    for (const source of forearmResearchSources) {
      expect(forearmContent.sources, source.id).toContain(source);
      expect(source.evidenceType, source.id).toBe("emg");
      expect(source.title, source.id).not.toMatch(/hypertroph|growth/i);
    }
  });

  it("keeps the words to the page's copy rules: no side, count or growth words, no jargon, no '%', at most 450 characters", () => {
    const refused = /%|\bper ?cent\b|optimal|guarantee|growth|\bgrows?\b|\bbuilds?\b|\bsize\b|hypertroph|\bbigger\b|\bwill (grow|get bigger|increase)\b|\btables?\b|\b(left|right)\b|\bsides?\b|\bcount(s|ed|ing)?\b|\bonce per\b|\btwice\b|\bper (arm|set)\b|\b(each|both) (arm|arms|side|sides)\b|laterality|primary tag|\bvariants?\b|supabase/i;
    // Every rationale v2 writes: the reviewed thumb rows and the new ones. The six rows that only gain a source keep v1's frozen words.
    for (const key of [...listed.fplReviewed, ...added]) expect(v2.get(key)!.rationale, key).not.toMatch(refused);
    for (const mapping of forearmMappings) expect(mapping.rationale.length, mapping.id).toBeLessThanOrEqual(450);
  });

  it("publishes v2 on 24 Oct 2026 with v1's method notes and §1.7's", () => {
    expect(forearmMappingVersion).toMatchObject({ key: "forearm_mappings_v2", state: "published", publishedAt: "2026-10-24" });
    expect(forearmMappingVersion.methodNotes.startsWith(forearmMappingVersionV1.methodNotes)).toBe(true);
    const added = forearmMappingVersion.methodNotes.slice(forearmMappingVersionV1.methodNotes.length);
    expect(added).toMatch(/^ Version 2 reviews the thumb flexor's role in hangs and carries as incidental grip/);
    expect(added).toMatch(/It adopts none of the research package's grades or percentages\. It credits no upper-arm muscle: the upper arm's own version does\.$/);
    expect(added.length).toBeGreaterThan(200);
  });
});

describe("the variants v2 maps", () => {
  it("are the 119 v1 maps, the four new rows and the seven upper-arm records its brachioradialis rows add", () => {
    const v1Mapped = new Set(forearmMappingsV1.map((mapping) => mapping.variantId));
    const fresh = forearmVariants.filter((variant) => !v1Mapped.has(variant.id)).map((variant) => variant.catalogExerciseId).sort((a, b) => a - b);
    expect(fresh).toEqual([87, 88, 318, 326, 329, 330, 333, 417, 418, 419, 420]);
    expect(forearmVariants).toHaveLength(119 + 4 + 7);
  });

  it("write the new rows' counting attribute explicitly, and nothing the forearm does not read", () => {
    expect(forearmResearchVariants.map((variant) => [variant.id, variant.catalogName, variant.laterality, variant.sidedBy])).toEqual([
      ["cat-417", "Cable Wrist Curl", "bilateral", "none"], ["cat-418", "Behind-the-Back Wrist Curl", "bilateral", "none"], ["cat-419", "Barbell Hold", "bilateral", "none"],
      ["cat-420", "Band Index and Little Finger Extension", "unilateral", "arm"],
    ]);
    for (const variant of forearmResearchVariants) {
      expect(variant.legLaterality, variant.id).toBeUndefined();
      expect(variant.sideAnchor, variant.id).toBeUndefined();
      expect(variant.dimensions, variant.id).toBeUndefined();
      expect(exercises.find((exercise) => exercise.id === variant.catalogExerciseId)!.name).toBe(variant.catalogName);
    }
    expect(variantById.get("cat-419")).toMatchObject({ measure: "seconds", deliberateHold: true, straps: "unknown" });
  });

  it("keep 188 and 264, the single-leg Romanian deadlifts, at their pinned sided_by: arm (§10 decision 4)", () => {
    for (const catalogId of [188, 264]) {
      expect(forearmVariants.find((variant) => variant.catalogExerciseId === catalogId)).toMatchObject({ sidedBy: "arm", laterality: "either" });
      expect(bothLimbDecisions.find((decision) => decision.catalogExerciseId === catalogId)!.sidedBy).toBe("arm");
    }
  });
});
