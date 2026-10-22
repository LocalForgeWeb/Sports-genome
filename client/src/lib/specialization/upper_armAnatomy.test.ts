import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { muscleCanonicalNameToRegionId } from "@shared/capabilityRank";
import { claimKeyOf, composeRegionData, resolveMembers } from "@shared/specialization/compose";
import { registeredRegionContents } from "@shared/specialization/registry";
import { forearmContent } from "@shared/specialization/regions/forearm";
import { forearmMuscleIds } from "@shared/specialization/regions/forearm/ids";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import {
  UPPER_ARM_MAPPING_VERSION,
  UPPER_ARM_REGION_ID,
  upperArmAdjacentIds,
  upperArmExternalIds,
  upperArmGroupIds,
  upperArmMuscleIds,
  upperArmTargetIds,
} from "@shared/specialization/regions/upper_arm/ids";
import { sourceById } from "@shared/specialization/sources";
import { upperArmSources } from "@shared/specialization/sources/upper_arm";
import type { AnatomyNode, Claim, MappingVersion } from "@shared/specialization/types";
import { stubMuscles } from "../../../../server/fixtures/specializationPg";

/**
 * The upper arm's anatomy content and its evidence (docs/specialization-atlas/10-multi-region.md
 * §1.2, §1.3, §8; regions/upper_arm/anatomy-evidence.md). The rules every region keeps (filled
 * fields, reviewed claims with dates, notes and located sources, node actions on function claims,
 * no growth promise) are checked for every region in regionContent.test.ts; these are the upper
 * arm's own: the rows §1.2 fixes, what may never change on the two frozen muscles (§10), the node
 * actions and what was left out, the evidence standard as this review applied it, and the copy's
 * directions.
 */

const { nodes, members, actions, nodeActions, claims, sources, region } = upperArmContent;
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const own = claims.filter((claim) => claim.ownerRegionId === UPPER_ARM_REGION_ID);
const claimsOf = (nodeId: string, kind?: Claim["kind"]) => claims.filter((claim) => claim.nodeId === nodeId && (!kind || claim.kind === kind));
const m = upperArmMuscleIds;

/** The upper arm as a page would read it (its own version still a draft), with the forearm as the home of the brachioradialis. */
const draft: MappingVersion = { key: UPPER_ARM_MAPPING_VERSION, state: "draft", publishedAt: null, methodNotes: "Test version." };
const page = composeRegionData({ ...upperArmContent, mappingVersion: draft }, [forearmContent]);

const seedV1 = readFileSync(join(process.cwd(), "supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql"), "utf8");

describe("the upper arm's rows, as §1.2 fixes them", () => {
  it("holds §1.2's nodes: ids, names, short names, kinds, roles, layers, parents and node keys", () => {
    // Layer "—" for the parent is written "mixed", as the forearm's groups are; §1.2's outcrops are the drawing's.
    const row = (node: AnatomyNode) => [node.id, node.name, node.shortName, node.kind, node.role, node.layer, node.parentId, node.catalogMuscleKey];
    expect(nodes.map(row)).toEqual([
      ["upper_arm.biceps", "Biceps brachii", "Biceps", "muscle", "target", "surface", null, "biceps"],
      ["upper_arm.brachialis", "Brachialis", "Brachialis", "muscle", "target", "deep", null, "brachialis"],
      ["upper_arm.triceps", "Triceps brachii", "Triceps", "muscle", "group", "mixed", null, "triceps"],
      ["upper_arm.triceps_long", "Triceps, long head", "TriLong", "head", "target", "surface", "upper_arm.triceps", "triceps"],
      ["upper_arm.triceps_lateral", "Triceps, lateral head", "TriLat", "head", "target", "surface", "upper_arm.triceps", "triceps"],
      ["upper_arm.triceps_medial", "Triceps, medial head", "TriMed", "head", "target", "deep", "upper_arm.triceps", "triceps"],
      ["upper_arm.coracobrachialis", "Coracobrachialis", "CB", "muscle", "adjacent", "deep", null, null],
    ]);
    for (const node of nodes) {
      expect(node.regionId, node.id).toBe(UPPER_ARM_REGION_ID);
      expect(node.border, node.id).toBeNull();
    }
    expect(upperArmTargetIds).toEqual(nodes.filter((node) => node.role === "target").map((node) => node.id));
    expect([upperArmGroupIds.triceps, upperArmAdjacentIds.coracobrachialis]).toEqual(["upper_arm.triceps", "upper_arm.coracobrachialis"]);
    expect(UPPER_ARM_MAPPING_VERSION).toBe("upper_arm_mappings_v1");
  });

  it("lists its own nodes in §1.2's order, then the forearm's brachioradialis as an external member with its home's short name", () => {
    expect(upperArmExternalIds.brachioradialis).toBe(forearmMuscleIds.brachioradialis);
    const resolved = resolveMembers(upperArmContent, [forearmContent]);
    expect(resolved.map(({ node, role, member }) => [member.sortOrder, node.id, role])).toEqual([
      [0, "upper_arm.biceps", "target"],
      [1, "upper_arm.brachialis", "target"],
      [2, "upper_arm.triceps", "group"],
      [3, "upper_arm.triceps_long", "target"],
      [4, "upper_arm.triceps_lateral", "target"],
      [5, "upper_arm.triceps_medial", "target"],
      [6, "upper_arm.coracobrachialis", "adjacent"],
      [7, "forearm.br", "external"],
    ]);
    expect(resolved.at(-1)!.node.shortName).toBe("BR");
    expect(members.filter((member) => member.caveats?.length).map((member) => [member.nodeId, member.caveats])).toEqual([
      ["upper_arm.biceps", ["Listed only as helping raise the arm forward."]],
      ["forearm.br", ["A forearm muscle shown here because curls load it; it is credited as the forearm counts it."]],
    ]);
  });

  it("names §1.1's catalog keys with the primary tag scope, §1.2's actions, and stays a reference region until the integration lane promotes it", () => {
    expect(region.status).toBe("reference");
    expect(region.catalogKeys).toEqual(["biceps", "brachialis", "triceps"]);
    expect(region.regionOnlyTagScope).toBe("primary");
    expect(region.sides).toEqual({ model: "paired", limb: "arm" });
    expect(actions.map((action) => action.id)).toEqual(["elbow.flexion", "elbow.extension", "forearm.supination", "shoulder.flexion", "shoulder.extension"]);
    expect(region.nodeForBodyMapKey).toEqual({ biceps: m.biceps, brachialis: m.brachialis });
  });
});

describe("the two frozen muscles (§1.3, §10)", () => {
  it("keep their ids, region, catalog key, database muscle and the stored role external", () => {
    for (const [id, key, database] of [[m.biceps, "biceps", "biceps_brachii"], [m.brachialis, "brachialis", "brachialis"]] as const) {
      const node = nodeById.get(id)!;
      expect([node.id, node.regionId, node.catalogMuscleKey, node.databaseMuscle, node.storedRole, node.role]).toEqual([id, "upper_arm", key, database, "external", "target"]);
      // As seed v1 wrote the row.
      expect(seedV1).toMatch(new RegExp(`\\(\\$\\$${id.replace(".", "\\.")}\\$\\$, \\$\\$upper_arm\\$\\$, null, \\$\\$muscle\\$\\$, \\$\\$external\\$\\$`));
    }
  });

  it("keep the forearm's four claims and three node actions on them, keys included", () => {
    const forearmOwned = claims.filter((claim) => claim.ownerRegionId === "forearm");
    expect(forearmOwned.map(claimKeyOf)).toEqual(["forearm:biceps.function", "forearm:biceps.appearance", "forearm:brachialis.function", "forearm:brachialis.appearance"]);
    for (const claim of forearmOwned) {
      // Each statement as seed v1 wrote it.
      expect(seedV1, claimKeyOf(claim)).toContain(`$$${claimKeyOf(claim)}$$, $$${claim.nodeId}$$, $$${claim.kind}$$, $$${claim.statement}$$`);
      expect(claim.reviewedAt).toBe("2026-10-16");
    }
    const frozenRows = nodeActions.filter((row) => row.claimKey.startsWith("forearm:")).map((row) => `${row.nodeId} ${row.actionId} ${row.role} ${row.claimKey}`);
    expect(frozenRows).toEqual([
      "upper_arm.biceps elbow.flexion prime forearm:biceps.function",
      "upper_arm.biceps forearm.supination prime forearm:biceps.function",
      "upper_arm.brachialis elbow.flexion prime forearm:brachialis.function",
    ]);
  });

  it("keep neutral anatomy text; the words that speak from one page are that page's membership caveats", () => {
    /**
     * Words that speak from a page about its listing, never true of the node on every page that lists it: a region's
     * size or targets, what a page lists, shows or credits, and "here" ("there" names a place on the arm as often as a
     * page, so it is left to the words around it). The node's text is read on the forearm page and the upper arm's alike.
     */
    const pageWords = /\b(forearm|upper-arm) (size|targets?|muscles?)\b|\b(listed|lists?|shown|shows?|credited|targets?|here)\b/i;
    // What the biceps once said, which the forearm page showed beside no shoulder action.
    expect("Its help raising the arm forward is weak, and studies disagree on whether its long head works in shoulder movement at all, so it is listed only as helping there.").toMatch(pageWords);
    const listedElsewhere = new Set(registeredRegionContents.filter((content) => content.region.id !== UPPER_ARM_REGION_ID).flatMap((content) => content.members.map((member) => member.nodeId)));
    expect(nodes.filter((node) => listedElsewhere.has(node.id)).map((node) => node.id)).toEqual([m.biceps, m.brachialis]);
    for (const node of nodes.filter((item) => listedElsewhere.has(item.id))) {
      for (const text of [node.location, node.whatItDoes, node.shapeNote, ...node.caveats]) expect(text, node.id).not.toMatch(pageWords);
    }
    for (const id of [m.biceps, m.brachialis]) {
      const node = nodeById.get(id)!;
      const listed = forearmContent.members.find((member) => member.nodeId === id)!;
      expect(listed.caveats?.some((caveat) => /not a forearm target/.test(caveat)), id).toBe(true);
      // The upper arm's page shows the node's own text and its own words on it, never the forearm's.
      const own = members.find((member) => member.nodeId === id)!.caveats ?? [];
      expect(page.nodes.find((item) => item.id === id)!.caveats).toEqual([...node.caveats, ...own]);
    }
    expect(forearmContent.members.find((member) => member.nodeId === m.biceps)!.caveats).toContain("It is an upper-arm muscle and does not add forearm size.");
    expect(forearmContent.members.find((member) => member.nodeId === m.brachialis)!.caveats).toContain("It is not a forearm muscle.");
  });
});

describe("upper-arm node actions", () => {
  const rows = nodeActions.map((row) => `${row.nodeId} ${row.actionId} ${row.role} ${row.claimKey}`);

  it("rests each new row on its node's own upper-arm function claim", () => {
    expect(rows.filter((row) => !row.includes(" forearm:"))).toEqual([
      "upper_arm.biceps shoulder.flexion assist upper_arm:upper_arm.biceps.function",
      "upper_arm.triceps_long elbow.extension prime upper_arm:upper_arm.triceps_long.function",
      "upper_arm.triceps_long shoulder.extension assist upper_arm:upper_arm.triceps_long.function",
      "upper_arm.triceps_lateral elbow.extension prime upper_arm:upper_arm.triceps_lateral.function",
      "upper_arm.triceps_medial elbow.extension prime upper_arm:upper_arm.triceps_medial.function",
      "upper_arm.coracobrachialis shoulder.flexion prime upper_arm:upper_arm.coracobrachialis.function",
    ]);
  });

  it("gives the lateral and medial heads the same actions, and the long head alone the shoulder", () => {
    const actionsOf = (nodeId: string) => nodeActions.filter((row) => row.nodeId === nodeId).map((row) => `${row.actionId} ${row.role}`);
    expect(actionsOf(m.tricepsLateral)).toEqual(actionsOf(m.tricepsMedial));
    for (const id of [m.tricepsLateral, m.tricepsMedial, m.brachialis]) expect(nodeActions.some((row) => row.nodeId === id && row.actionId.startsWith("shoulder.")), id).toBe(false);
    // The triceps parent acts through its heads (§7.3).
    expect(nodeActions.filter((row) => row.nodeId === upperArmGroupIds.triceps)).toEqual([]);
  });

  it("gives every region action a performer the region can map: a target, never only the adjacent coracobrachialis", () => {
    const targets = new Set(upperArmTargetIds as readonly string[]);
    for (const action of actions) expect(nodeActions.some((row) => row.actionId === action.id && targets.has(row.nodeId)), action.id).toBe(true);
  });

  it("shows the forearm's brachioradialis on the upper-arm page for elbow flexion only, on the forearm's claim", () => {
    expect(page.nodeActions.filter((row) => row.nodeId === forearmMuscleIds.brachioradialis).map((row) => `${row.actionId} ${row.claimKey}`)).toEqual(["elbow.flexion forearm:br.function"]);
    const shown = page.claims.map(claimKeyOf);
    expect(shown).toEqual(expect.arrayContaining(["forearm:br.function", "forearm:biceps.function", "forearm:brachialis.function"]));
    expect(shown.filter((key) => key.startsWith("forearm:"))).toEqual(["forearm:biceps.function", "forearm:brachialis.function", "forearm:br.function"]);
    expect(page.nodes.find((node) => node.id === forearmMuscleIds.brachioradialis)).toMatchObject({ role: "external", regionId: "forearm" });
  });
});

describe("upper-arm claims and the evidence standard (§8)", () => {
  it("holds nineteen claims, every one reviewed: 6 function, 7 appearance, 5 selectivity and 1 variation; the dossier's training-study claim is left out", () => {
    expect(own).toHaveLength(19);
    const count = (kind: Claim["kind"]) => own.filter((claim) => claim.kind === kind).length;
    expect([count("function"), count("appearance"), count("selectivity"), count("variation")]).toEqual([6, 7, 5, 1]);
    expect(own.every((claim) => claim.reviewStatus === "reviewed")).toBe(true);
    expect(own.map((claim) => claim.id)).not.toContain("upper_arm.triceps_long.selectivity.2");
    // Reviewed on 19 Oct; the five reworded or given a source in the fix round re-checked on 22 Oct, and say so.
    expect(own.filter((claim) => claim.reviewedAt === "2026-10-22").map((claim) => claim.id)).toEqual([
      "upper_arm.triceps_long.function",
      "upper_arm.triceps_long.appearance",
      "upper_arm.triceps_lateral.function",
      "upper_arm.triceps_lateral.selectivity.1",
      "upper_arm.triceps_medial.selectivity.1",
    ]);
    for (const claim of own) {
      expect(claim.id).toMatch(new RegExp(`^${claim.nodeId.replace(".", "\\.")}\\.${claim.kind}(\\.\\d+)?$`));
      expect(["2026-10-19", "2026-10-22"], claim.id).toContain(claim.reviewedAt);
      if (claim.reviewedAt === "2026-10-22") expect(claim.reviewNote, claim.id).toMatch(/re-checked on 22 Oct 2026/);
    }
  });

  it("gives every node a function claim and every own node an appearance claim of the upper arm's", () => {
    for (const node of nodes) {
      expect(claimsOf(node.id, "function").length, node.id).toBeGreaterThan(0);
      expect(claimsOf(node.id, "appearance").some((claim) => claim.ownerRegionId === UPPER_ARM_REGION_ID), node.id).toBe(true);
    }
  });

  it("rests every new function claim on more than one source; the single-source ones are the forearm's two, as its notes say", () => {
    for (const claim of own.filter((item) => item.kind === "function")) expect(new Set(claim.sources.map((ref) => ref.sourceId)).size, claim.id).toBeGreaterThanOrEqual(3);
    const single = claims.filter((claim) => claim.kind === "function" && claim.sources.length === 1).map(claimKeyOf);
    expect(single).toEqual(["forearm:biceps.function", "forearm:brachialis.function"]);
  });

  it("keeps appearance as inference: located sources that give location only, and a qualified contour", () => {
    for (const claim of own.filter((item) => item.kind === "appearance")) {
      expect(claim.basis, claim.id).toBe("anatomical_inference");
      expect(claim.statement, claim.id).toMatch(/\bmay (contribute|make up)\b|little or no contour/);
      expect(claim.statement, claim.id).not.toMatch(/\bwill\b|\bbigger\b|\bgrow/i);
    }
  });

  it("keeps selectivity to short-term activity and modelled force, never growth and never a credit weight", () => {
    // Said in so many words: "not growth", "neither study measured growth", "none of these studies measured growth".
    const saysNotGrowth = /\bnot growth\b|\b(neither|none of these|no) stud(y|ies) measured growth\b/i;
    expect("This study measured growth.").not.toMatch(saysNotGrowth);
    const growthFinding = /hypertroph|muscle (volume|thickness|size)|\bgrew\b|\b(volume|thickness) rose\b/i;
    // No claim of the upper arm's rests on a training study (the dossier's one is left out, §8).
    for (const claim of own) for (const ref of claim.sources) expect(sourceById.get(ref.sourceId)!.evidenceType, `${claim.id} → ${ref.sourceId}`).not.toBe("longitudinal");
    for (const claim of own.filter((item) => item.kind === "selectivity")) {
      expect(claim.basis, claim.id).toBe("experimental");
      expect(claim.statement, claim.id).toMatch(saysNotGrowth);
      expect(claim.statement, claim.id).not.toMatch(growthFinding);
      for (const ref of claim.sources.filter((item) => sourceById.get(item.sourceId)!.evidenceType === "emg")) {
        expect(ref.qualification, `${claim.id} → ${ref.sourceId}`).toMatch(/not a measurement of growth and not a set-credit weight/);
      }
    }
  });

  it("says the lateral and medial heads share every action on both nodes, and that the work is not split", () => {
    for (const id of [m.tricepsLateral, m.tricepsMedial]) {
      expect(claimsOf(id, "selectivity").some((claim) => /share every action/.test(claim.statement) && /no study/.test(claim.statement)), id).toBe(true);
      expect(nodeById.get(id)!.caveats.some((caveat) => /counted together and not split/.test(caveat)), id).toBe(true);
    }
  });

  it("states the extra heads of the biceps as variation with no rate that reads as true of everyone", () => {
    const [variation] = claimsOf(m.biceps, "variation");
    expect(variation.statement).toMatch(/minority/);
    expect(variation.statement).not.toMatch(/%|percent|per ?cent|\b(one|two|\d+) in (a hundred|ten|\d+)\b/i);
    expect(variation.sources.some((ref) => sourceById.get(ref.sourceId)?.evidenceType === "systematic_review" && !!ref.qualification)).toBe(true);
  });

  it("cites its own library file and three of the forearm's sources, each with a note saying what the search showed", () => {
    const ownKeys = new Set(upperArmSources.map((source) => source.id));
    expect(upperArmSources).toHaveLength(28);
    for (const left of ["pmid.35819335", "mdpi.triceps_fascicle_length"]) expect(ownKeys.has(left), left).toBe(false);
    // The forearm's frozen claims kept here cite A50 and A51; the upper arm's own cite A51 and A4 (Kleiber 2015).
    const cited = new Set(claims.flatMap((claim) => claim.sources.map((ref) => ref.sourceId)));
    expect(Array.from(cited).filter((id) => !ownKeys.has(id)).sort()).toEqual(["A4", "A50", "A51"]);
    for (const id of Array.from(ownKeys)) expect(cited.has(id), `${id} is cited`).toBe(true);
    expect(sources.map((source) => source.id).sort()).toEqual([...Array.from(ownKeys), "A4", "A50", "A51"].sort());
    for (const source of upperArmSources) {
      expect(["2026-10-19", "2026-10-22"], source.id).toContain(source.retrievedOn);
      expect(source.notes, source.id).toMatch(/^(Checked via web-search|Added by the second review\. Checked via|Added in the fix round of 22 Oct 2026\. Checked via)/);
      // Wikipedia is read, never cited; a user-edited wiki likewise (the second review removed one).
      expect(source.url, source.id).not.toMatch(/wikipedia|doccheck|flexikon/i);
    }
  });
});

describe("upper-arm node fields", () => {
  it("says that the deep target muscles have little or no contour of their own", () => {
    const deep = nodes.filter((node) => node.role === "target" && node.layer === "deep");
    expect(deep.map((node) => node.id)).toEqual([m.brachialis, m.tricepsMedial]);
    for (const node of [...deep, nodeById.get(upperArmAdjacentIds.coracobrachialis)!]) expect(node.shapeNote, node.id).toMatch(/little or no contour of its own/);
  });

  it("qualifies every contour note and credits no single muscle with the outline", () => {
    for (const node of nodes) {
      expect(node.shapeNote, node.id).toMatch(/\bmay\b|little or no contour/i);
      expect(node.shapeNote, node.id).toContain("Visible shape also depends on neighbouring muscles, body fat and individual anatomy.");
    }
  });

  it("refines the database's canonical muscles: the two shipped names and the three triceps heads; the parent and the coracobrachialis refine none", () => {
    expect(nodes.map((node) => [node.id, node.databaseMuscle])).toEqual([
      ["upper_arm.biceps", "biceps_brachii"],
      ["upper_arm.brachialis", "brachialis"],
      ["upper_arm.triceps", null],
      ["upper_arm.triceps_long", "triceps_brachii_long_head"],
      ["upper_arm.triceps_lateral", "triceps_brachii_lateral_head"],
      ["upper_arm.triceps_medial", "triceps_brachii_medial_head"],
      ["upper_arm.coracobrachialis", null],
    ]);
    // Each is a canonical name the app knows (shared/capabilityRank.ts), drawn under the upper arm's own keys, and a row
    // of production's public.muscles (read-only check, 22 Oct 2026), which the test stub holds by the same name.
    const stub = new Set<string>(stubMuscles.map((row) => row.canonical_name));
    for (const node of nodes.filter((item) => item.databaseMuscle)) {
      expect(["biceps", "triceps"], node.id).toContain(muscleCanonicalNameToRegionId[node.databaseMuscle!]);
      expect(stub.has(node.databaseMuscle!), node.id).toBe(true);
    }
  });

  it("gives the heads and the coracobrachialis names a reader searches by, unique on the page", () => {
    expect(nodeById.get(m.tricepsLong)!.aliases).toContain("long head of triceps");
    expect(nodeById.get(m.tricepsLateral)!.aliases).toContain("lateral head of triceps");
    expect(nodeById.get(m.tricepsMedial)!.aliases).toContain("medial head of triceps");
    const labels = page.nodes.flatMap((node) => Array.from(new Set([node.name, node.shortName, ...node.aliases].map((label) => label.toLowerCase()))).map((label) => [label, node.id] as const));
    expect(new Set(labels.map(([label]) => label)).size).toBe(labels.length);
  });
});

describe("upper-arm anatomy copy", () => {
  /** Every string an athlete may read from the upper arm's records, and the forearm's words on its two muscles. */
  const copy = [
    ...nodes.flatMap((node) => [node.name, node.location, node.whatItDoes, node.shapeNote, ...node.caveats].map((text) => ({ where: node.id, text }))),
    ...members.flatMap((member) => (member.caveats ?? []).map((text) => ({ where: `member ${member.nodeId}`, text }))),
    ...forearmContent.members.filter((member) => nodeById.has(member.nodeId)).flatMap((member) => (member.caveats ?? []).map((text) => ({ where: `forearm member ${member.nodeId}`, text }))),
    ...own.flatMap((claim) => [claim.statement, ...claim.sources.flatMap((ref) => [ref.locator ?? "", ref.qualification ?? ""])].map((text) => ({ where: claim.id, text }))),
  ];

  it("uses anatomical directions, never left or right", () => {
    for (const { where, text } of copy) expect(text, where).not.toMatch(/\b(left|right)\b/i);
  });

  it("says inner and outer, front and back, in words, keeping lateral and medial for the heads' names and the bone's landmarks", () => {
    // Only these: "the lateral head(s)", "long, lateral and medial", "the lateral and (the) medial head", "the medial and the
    // lateral head", "the lateral intermuscular septum". Taken out, no "lateral" or "medial" may remain ("the medial side").
    const named = /\b(lateral|medial) heads?\b|\blong, lateral and medial\b|\blateral and (the )?medial heads?\b|\bmedial and (the )?lateral heads?\b|\blateral intermuscular septum\b/gi;
    expect("the medial side of the arm".replace(named, "")).toMatch(/\b(lateral|medial)\b/i);
    expect("the lateral and medial heads together".replace(named, "")).not.toMatch(/\b(lateral|medial)\b/i);
    for (const { where, text } of copy) expect(text.replace(named, ""), `${where}: "${text}"`).not.toMatch(/\b(lateral|medial)\b/i);
  });
});
