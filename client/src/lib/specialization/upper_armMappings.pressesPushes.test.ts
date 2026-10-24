import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { composeRegionData, sideRelationOf } from "@shared/specialization/compose";
import { variantIdFor } from "@shared/specialization/ids";
import { forearmContent } from "@shared/specialization/regions/forearm";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import { UPPER_ARM_MAPPING_VERSION, upperArmExternalIds, upperArmMuscleIds as m, upperArmTargetIds } from "@shared/specialization/regions/upper_arm/ids";
import { pressesPushesMappings as rows, pressesPushesUnmapped as unmapped } from "@shared/specialization/regions/upper_arm/mappings/pressesPushes";
import { categoryFor } from "@shared/specialization/rules";
import { sourceById, sourceLibrary } from "@shared/specialization/sources";
import { upperArmPressesPushesSources as laneSources } from "@shared/specialization/sources/upper_arm-pressesPushes";
import type { MappingVersion, Source } from "@shared/specialization/types";
import { variantById, variantFor, variantsMappedBy } from "@shared/specialization/variants";
import { bothLimbCatalogIds } from "@shared/specialization/variants/bothLimbs";
import { forearmV1Variants } from "@shared/specialization/variants/forearm";

/**
 * The upper arm's presses and pushes (shared/specialization/regions/upper_arm/mappings/
 * pressesPushes.ts), held to docs/specialization-atlas/10-multi-region.md §1.2, §3, §8 and the
 * forearm's mapping discipline (05-mappings.md). The rules every region keeps are checked for the
 * whole region in regionContent.test.ts once the integration lane wires the family in; these hold
 * the family on its own before then: its rows' fields, its evidence, the shared lateral and medial
 * heads, its coverage of the catalog, and the judgement calls its header states.
 *
 * The seven medicine-ball throws and slams are the extensions-and-other family's (the catalog's
 * movement "Throw, slam or ballistic rotation"); integration kept that lane's set and dropped this
 * lane's second reading of them (23 Oct 2026), so this family neither maps nor lists them.
 */

const scopeKeys = new Set(upperArmContent.region.catalogKeys);
const inScope = (exercise: Exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((key) => scopeKeys.has(key));
const primaryInScope = (exercise: Exercise) => exercise.primaryMuscles.some((key) => scopeKeys.has(key));
/** The family's rule: a push or press by the catalog's movement, or scapular protraction. */
const inFamily = (exercise: Exercise) => /push|press|protraction/i.test(exercise.movement);
const family = exercises.filter((exercise) => inScope(exercise) && inFamily(exercise));
const familyIds = new Set(family.map((exercise) => exercise.id));
/** The medicine-ball throws and slams: the catalog's "Throw, slam or ballistic rotation" rows in scope, all medicine-ball work. */
const ballFamily = exercises.filter((exercise) => inScope(exercise) && exercise.movement === "Throw, slam or ballistic rotation");
const ballFamilyIds = new Set(ballFamily.map((exercise) => exercise.id));

const lanesPressesAndPushes = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 120, 146, 147, 158, 159, 249, 251, 252, 253, 254, 255, 267, 268, 269, 270, 272,
  301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 322, 323, 324, 325, 381, 382, 386, 389,
];
const medicineBall = [271, 273, 279, 280, 281, 284, 285];

const catalogIdOf = (variantId: string) => variantById.get(variantId)!.catalogExerciseId;
const mappedIds = new Set(rows.map((row) => catalogIdOf(row.variantId)));
const listedIds = new Map(unmapped.map((entry) => [entry.catalogId, entry]));
const rowsFor = (catalogId: number) => rows.filter((row) => row.variantId === variantIdFor(catalogId));
const libraryAndLane: ReadonlyMap<string, Source> = new Map([...sourceLibrary, ...laneSources].map((source) => [source.id, source]));
const actionsOf = new Map<string, Set<string>>();
for (const row of upperArmContent.nodeActions) actionsOf.set(row.nodeId, (actionsOf.get(row.nodeId) ?? new Set()).add(row.actionId));

describe("the presses-and-pushes family", () => {
  it("is derived from the catalog: the variants lane's 77 presses and pushes, and apart from them the seven medicine-ball throws and slams", () => {
    expect(Array.from(familyIds).sort((x, y) => x - y)).toEqual(lanesPressesAndPushes);
    expect(familyIds.size).toBe(77);
    expect(Array.from(ballFamilyIds).sort((x, y) => x - y)).toEqual(medicineBall);
    for (const exercise of ballFamily) expect(exercise.equipment, String(exercise.id)).toBe("Medicine ball");
  });

  it("maps or lists every row of the family, never both, and maps every primary-tagged one", () => {
    for (const exercise of family) {
      const mapped = mappedIds.has(exercise.id);
      const listed = listedIds.has(exercise.id);
      expect(mapped !== listed, `${exercise.id} ${exercise.name}: mapped ${mapped}, listed ${listed}`).toBe(true);
      if (primaryInScope(exercise)) expect(mapped, `${exercise.id} ${exercise.name} is tagged primary`).toBe(true);
    }
    expect(mappedIds.size).toBe(72);
    expect(Array.from(listedIds.keys()).sort((x, y) => x - y)).toEqual([25, 249, 267, 310, 322]);
    expect(listedIds.size).toBe(unmapped.length);
    for (const entry of unmapped) expect(entry.reason.length, String(entry.catalogId)).toBeGreaterThan(20);
  });

  it("maps and lists nothing outside the family, and leaves the medicine-ball throws to their own family", () => {
    for (const id of [...Array.from(mappedIds), ...Array.from(listedIds.keys())]) expect(familyIds.has(id), String(id)).toBe(true);
    for (const id of Array.from(familyIds)) expect(ballFamilyIds.has(id), String(id)).toBe(false);
  });

  it("maps the library's current variants, used as they are (none of the family has a forearm variant)", () => {
    const forearmIds = new Set(forearmV1Variants.map((variant) => variant.catalogExerciseId));
    for (const id of [...Array.from(familyIds), ...Array.from(ballFamilyIds)]) expect(forearmIds.has(id), String(id)).toBe(false);
    for (const row of rows) {
      const variant = variantById.get(row.variantId);
      expect(variant, row.id).toBeDefined();
      expect(variantFor(variant!.catalogExerciseId), row.id).toBe(variant);
    }
    expect(variantsMappedBy(rows)).toHaveLength(72);
  });
});

describe("presses-and-pushes rows", () => {
  it("write every field validly", () => {
    const targets = new Set<string>(upperArmTargetIds);
    const regionActions = new Set(upperArmContent.actions.map((action) => action.id));
    for (const row of rows) {
      expect(row.id).toBe(`${row.variantId}:${row.nodeId}`);
      expect(row.versionKey, row.id).toBe(UPPER_ARM_MAPPING_VERSION);
      expect(targets.has(row.nodeId), `${row.id}: an upper-arm target`).toBe(true);
      expect(row.actionId !== null && regionActions.has(row.actionId), `${row.id}: a region action`).toBe(true);
      expect(["direct", "contributing", "stabilizer", "incidental"], row.id).toContain(row.relationship);
      expect(["dynamic", "isometric"], row.id).toContain(row.muscleMode);
      expect(["anatomy", "inference", "emg"], row.id).toContain(row.evidenceBasis);
      expect(["individual", "shared"], row.id).toContain(row.allocation);
      expect(["reviewed", "draft"], row.id).toContain(row.reviewStatus);
      expect(row.requiresNoStraps, row.id).toBe(false);
      expect(row.sideRelation, `${row.id}: side relation written out`).toBe("same");
      if (row.relationship === "stabilizer" || row.relationship === "incidental") expect(row.muscleMode, row.id).toBe("isometric");
      const variant = variantById.get(row.variantId)!;
      if (row.reviewStatus === "reviewed") expect(categoryFor(row.relationship, row.muscleMode, variant.deliberateHold), row.id).not.toBe("unknown");
      expect(variant.laterality, row.id).not.toBe("not_applicable");
    }
  });

  it("keep ids unique", () => {
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });

  it("review a row only with a rationale, a located source with its limitation, and a basis", () => {
    for (const row of rows) {
      expect(row.rationale.length, row.id).toBeGreaterThan(40);
      expect(row.sources.length, row.id).toBeGreaterThan(0);
      for (const ref of row.sources) expect(libraryAndLane.has(ref.sourceId), `${row.id} → ${ref.sourceId}`).toBe(true);
      if (row.reviewStatus === "reviewed") {
        expect(row.sources.some((ref) => Boolean(ref.locator) && Boolean(ref.limitation)), row.id).toBe(true);
        expect(["anatomy", "inference", "emg"], row.id).toContain(row.evidenceBasis);
      } else {
        expect(row.rationale, `${row.id}: a draft says why`).toMatch(/pending review/);
      }
      if (row.evidenceBasis === "emg") expect(row.sources.some((ref) => libraryAndLane.get(ref.sourceId)?.evidenceType === "emg"), row.id).toBe(true);
      for (const ref of row.sources) expect(ref.limitation, `${row.id} → ${ref.sourceId}`).toBeTruthy();
    }
  });

  it("share the lateral and medial heads wherever both appear, and credit the long head on its own", () => {
    for (const id of Array.from(mappedIds)) {
      const lateral = rowsFor(id).find((row) => row.nodeId === m.tricepsLateral);
      const medial = rowsFor(id).find((row) => row.nodeId === m.tricepsMedial);
      const long = rowsFor(id).find((row) => row.nodeId === m.tricepsLong);
      expect(Boolean(lateral) === Boolean(medial), String(id)).toBe(true);
      expect(lateral && medial && long, `${id}: all three heads`).toBeTruthy();
      expect(lateral!.allocation, String(id)).toBe("shared");
      expect(medial!.allocation, String(id)).toBe("shared");
      for (const key of ["relationship", "muscleMode", "actionId", "reviewStatus"] as const) expect(medial![key], `${id} ${key}`).toBe(lateral![key]);
      expect(long!.allocation, String(id)).toBe("individual");
      expect(long!.relationship, String(id)).toBe(lateral!.relationship);
      expect(long!.reviewStatus, String(id)).toBe(lateral!.reviewStatus);
    }
  });

  it("map no forearm.br row and nothing outside the upper arm's own muscles", () => {
    for (const row of rows) {
      expect(row.nodeId, row.id).not.toBe(upperArmExternalIds.brachioradialis);
      expect(row.nodeId.startsWith("upper_arm."), row.id).toBe(true);
    }
  });

  it("fan out to no muscle: each row's action is one its node performs, and only the triceps' elbow extension is credited", () => {
    for (const row of rows) {
      expect(actionsOf.get(row.nodeId)?.has(row.actionId!), `${row.id}: ${row.actionId}`).toBe(true);
      expect(row.actionId, row.id).toBe("elbow.extension");
      expect(row.muscleMode, row.id).toBe("dynamic");
    }
    // No elbow flexor in a press, and no long-head shoulder extension.
    expect(rows.filter((row) => row.nodeId === m.biceps || row.nodeId === m.brachialis)).toEqual([]);
    expect(rows.filter((row) => row.actionId === "shoulder.extension" || row.actionId === "shoulder.flexion")).toEqual([]);
  });
});

describe("presses-and-pushes judgement calls", () => {
  it("make the triceps direct only where the exercise is built on elbow extension", () => {
    const direct = Array.from(new Set(rows.filter((row) => row.relationship === "direct").map((row) => catalogIdOf(row.variantId)))).sort((x, y) => x - y);
    expect(direct).toEqual([28, 146, 147, 158]);
    // Tagged triceps-primary by the catalog, the same movement as their contributing neighbours.
    for (const id of [309, 323, 386, 389]) for (const row of rowsFor(id)) expect(row.relationship, row.id).toBe("contributing");
  });

  it("say on every long-head row that its shoulder action is not what is credited, citing that action", () => {
    const notBuiltOn = [3, 6, 30, 40, 158, 159, 306];
    const throwDown = [273, 280, 284, 285];
    for (const row of rows.filter((item) => item.nodeId === m.tricepsLong)) {
      const id = catalogIdOf(row.variantId);
      expect(row.sources.some((ref) => ref.sourceId === "imaios.triceps_long_head"), `${row.id}: cites the shoulder action`).toBe(true);
      expect(row.rationale, row.id).toMatch(/The long head also crosses the shoulder/);
      if (throwDown.includes(id)) expect(row.rationale, row.id).toMatch(/goes with the throw; it is credited once, for the elbow\.$/);
      else if (notBuiltOn.includes(id)) expect(row.rationale, row.id).toMatch(/is not built on its action there, so only its elbow action is credited\.$/);
      else expect(row.rationale, row.id).toMatch(/where it draws the arm down and back; that works against the \w+, so only its elbow action is credited\.$/);
    }
  });

  it("read the pressing arm's side on either-laterality variants and say so", () => {
    const either = Array.from(mappedIds).filter((id) => variantFor(id)!.laterality === "either").sort((x, y) => x - y);
    expect(either).toEqual([11, 12, 13, 106, 252, 254, 269, 270, 301, 303, 324, 325, 382, 386, 389]);
    for (const id of either) {
      expect(variantFor(id)!.sidedBy, String(id)).toBe("arm");
      for (const row of rowsFor(id)) {
        expect(sideRelationOf(row), row.id).toBe("same");
        expect(row.rationale, row.id).toContain("One arm or both may press; the triceps work on whichever arm presses.");
      }
    }
    // The both-limb presses are sided by the pressing arm, which these rows read.
    for (const id of [252, 270, 303, 325, 386]) expect(bothLimbCatalogIds.has(id), String(id)).toBe(true);
  });

  it("holds no draft", () => {
    expect(rows.filter((row) => row.reviewStatus === "draft")).toEqual([]);
  });

  it("pins the family's counts, so a change is deliberate", () => {
    expect(rows).toHaveLength(216);
    expect(rows.filter((row) => row.reviewStatus === "reviewed")).toHaveLength(216);
    expect(rows.filter((row) => row.relationship === "direct")).toHaveLength(12);
  });
});

describe("presses-and-pushes copy and evidence", () => {
  /** Shown to athletes on a phone: no growth wording, no %, no screen or body side, no counting words, no internal jargon. */
  const forbidden = [
    /%|\bper ?cent\b/i,
    /optimal|guarantee/i,
    /\bwill (grow|get bigger|increase)\b|\bgrowth\b|\bhypertroph/i,
    /\b(left|right)\b/i,
    /\bsides?\b/i,
    /\bcount(s|ed|ing)?\b|\bonce per\b|\btwice\b|\bper (arm|set)\b|\beach arm\b/i,
    /supabase|\btables?\b/i,
    /laterality|catalog's primary tag|primary tag|\bvariants?\b/i,
  ];
  const copy = [
    ...rows.map((row) => ({ where: row.id, text: row.rationale })),
    ...unmapped.map((entry) => ({ where: `unmapped ${entry.catalogId}`, text: entry.reason })),
  ];

  it("keep rationales and unmapped reasons free of growth wording, sides, counts, '%', 'table' and jargon", () => {
    for (const { where, text } of copy) for (const pattern of forbidden) expect(text, where).not.toMatch(pattern);
  });

  it("keep every rationale short enough to read on a phone (at most 450 characters)", () => {
    for (const row of rows) expect(row.rationale.length, row.id).toBeLessThanOrEqual(450);
    for (const entry of unmapped) expect(entry.reason.length, String(entry.catalogId)).toBeLessThanOrEqual(450);
  });

  it("cite on every row an anatomy source for its own head's action", () => {
    const own: Record<string, string> = { [m.tricepsLong]: "imaios.triceps_long_head", [m.tricepsLateral]: "elsevier.triceps_lateral_head", [m.tricepsMedial]: "elsevier.triceps_medial_head" };
    for (const row of rows) {
      expect(row.sources.some((ref) => ref.sourceId === own[row.nodeId]), `${row.id} cites ${own[row.nodeId]}`).toBe(true);
      expect(libraryAndLane.get(own[row.nodeId])?.evidenceType, own[row.nodeId]).toBe("anatomy");
      if (row.evidenceBasis === "anatomy") expect(row.sources.some((ref) => libraryAndLane.get(ref.sourceId)?.evidenceType === "anatomy"), row.id).toBe(true);
      if (row.evidenceBasis === "emg") expect(row.sources.some((ref) => libraryAndLane.get(ref.sourceId)?.evidenceType === "emg"), row.id).toBe(true);
    }
  });

  it("rest a direct call on a study only where that study recorded the head, and read the rest as inference", () => {
    const basisOf = (id: number, nodeId: string) => rowsFor(id).find((row) => row.nodeId === nodeId)!.evidenceBasis;
    expect([basisOf(146, m.tricepsLong), basisOf(146, m.tricepsLateral), basisOf(146, m.tricepsMedial)]).toEqual(["emg", "emg", "inference"]);
    for (const id of [28, 147, 158]) for (const row of rowsFor(id)) expect(row.evidenceBasis, row.id).toBe("inference");
    for (const id of [110, 254, 255, 268, 269, 270, 389]) for (const row of rowsFor(id)) expect(row.evidenceBasis, row.id).toBe("inference");
    expect(rows.filter((row) => row.evidenceBasis === "emg").map((row) => row.id).sort()).toEqual(["cat-146:upper_arm.triceps_lateral", "cat-146:upper_arm.triceps_long"]);
  });
});

describe("presses-and-pushes sources", () => {
  it("add new keys only, as stable slugs, at URLs no other key of the library holds", () => {
    // Wired into the library at integration (23 Oct 2026): each is there once, under its own key and URL.
    const others = sourceLibrary.filter((source) => !laneSources.includes(source));
    const otherUrls = new Set(others.map((source) => source.url.trim().replace(/\/+$/, "").toLowerCase()));
    for (const source of laneSources) {
      expect(sourceById.get(source.id), source.id).toBe(source);
      expect(others.some((item) => item.id === source.id), source.id).toBe(false);
      expect(source.id).toMatch(/^([a-z][a-z0-9_]*\.[a-z0-9_]+|pmid\.\d+)$/);
      expect(otherUrls.has(source.url.trim().replace(/\/+$/, "").toLowerCase()), source.id).toBe(false);
      expect(source.notes?.length ?? 0, source.id).toBeGreaterThan(100);
      expect(source.retrievedOn).toBe("2026-10-22");
      expect(source.title, source.id).not.toMatch(/supabase|\btables?\b/i);
    }
    expect(new Set(laneSources.map((source) => source.id)).size).toBe(laneSources.length);
    // Every source the lane adds is cited by a row.
    const cited = new Set(rows.flatMap((row) => row.sources.map((ref) => ref.sourceId)));
    for (const source of laneSources) expect(cited.has(source.id), source.id).toBe(true);
  });
});

describe("presses-and-pushes on the upper-arm page", () => {
  /** The upper arm as a page would read it with this family alone (as wired by default), under a draft version. */
  const draft: MappingVersion = { key: UPPER_ARM_MAPPING_VERSION, state: "draft", publishedAt: null, methodNotes: "Test version." };
  const cited = new Set(rows.flatMap((row) => row.sources.map((ref) => ref.sourceId)));
  const page = composeRegionData(
    {
      ...upperArmContent,
      mappingVersion: draft,
      mappings: rows,
      variants: variantsMappedBy(rows),
      unmappedTagged: unmapped,
      sources: [...upperArmContent.sources, ...laneSources.filter((source) => cited.has(source.id))],
    },
    [forearmContent],
  );

  it("names members, variants and sources the page holds", () => {
    const nodeIds = new Set(page.nodes.map((node) => node.id));
    const sourceIds = new Set(page.sources.map((source) => source.id));
    const variantIds = new Set(page.variants.map((variant) => variant.id));
    for (const row of page.mappings) {
      expect(nodeIds.has(row.nodeId), row.id).toBe(true);
      expect(variantIds.has(row.variantId), row.id).toBe(true);
      for (const ref of row.sources) expect(sourceIds.has(ref.sourceId), `${row.id} → ${ref.sourceId}`).toBe(true);
    }
    expect(page.mappings).toHaveLength(216);
  });
});
