import { describe, expect, it } from "vitest";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import {
  coreForearmMuscleIds,
  externalContributorIds,
  forearmActionIds,
  forearmAdjacentIds,
  forearmGroupIds,
  forearmMuscleIds,
} from "@shared/specialization/regions/forearm/ids";

/**
 * The forearm anatomy content and its evidence (brief §2, §3; 02-design.md §1).
 *
 * These are the rules the content must keep as it is edited: copy in anatomical
 * directions, appearance kept apart from function and never stated as established fact,
 * every node action resting on its own node's function claim, every claim citing sources
 * that exist, and "reviewed" meaning something checkable. The content lives in shared/,
 * which vitest does not collect, so its tests live here. The rules every region keeps (filled
 * fields, reviewed claims, cited sources, node actions on function claims, no growth promise)
 * are checked for every region in regionContent.test.ts; these are the forearm's own.
 */

const { nodes, actions, nodeActions, claims, sources } = forearmRegionData;
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const sourceById = new Map(sources.map((source) => [source.id, source]));

const claimsOf = (nodeId: string, kind?: string) => claims.filter((claim) => claim.nodeId === nodeId && (!kind || claim.kind === kind));

/** Every string an athlete may read from this content, labelled for a useful failure. */
function copyStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const node of nodes) {
    out.push({ where: `${node.id}.name`, text: node.name });
    out.push({ where: `${node.id}.location`, text: node.location });
    out.push({ where: `${node.id}.whatItDoes`, text: node.whatItDoes });
    out.push({ where: `${node.id}.shapeNote`, text: node.shapeNote });
    node.caveats.forEach((caveat, i) => out.push({ where: `${node.id}.caveats[${i}]`, text: caveat }));
  }
  for (const claim of claims) {
    out.push({ where: `${claim.id}.statement`, text: claim.statement });
    for (const ref of claim.sources) {
      if (ref.locator) out.push({ where: `${claim.id} → ${ref.sourceId} locator`, text: ref.locator });
      if (ref.qualification) out.push({ where: `${claim.id} → ${ref.sourceId} qualification`, text: ref.qualification });
    }
  }
  for (const action of actions) {
    out.push({ where: `${action.id}.label`, text: action.label });
    out.push({ where: `${action.id}.plainDescription`, text: action.plainDescription });
  }
  return out;
}

describe("forearm nodes", () => {
  it("has a node, a function claim and an appearance claim for every core muscle", () => {
    expect(coreForearmMuscleIds).toHaveLength(19);
    for (const id of coreForearmMuscleIds) {
      expect(nodeById.get(id), id).toBeDefined();
      expect(claimsOf(id, "function").length, `${id} function claim`).toBeGreaterThan(0);
      expect(claimsOf(id, "appearance").length, `${id} appearance claim`).toBeGreaterThan(0);
    }
  });

  it("describes the groups, the anconeus and the external contributors too", () => {
    const others = [...Object.values(forearmGroupIds), ...Object.values(forearmAdjacentIds), ...Object.values(externalContributorIds)];
    for (const id of others) {
      expect(nodeById.get(id), id).toBeDefined();
      expect(claimsOf(id, "function").length, `${id} function claim`).toBeGreaterThan(0);
    }
  });

  it("says that deep forearm muscles have little or no contour of their own", () => {
    const deep = nodes.filter((node) => node.regionId === forearmRegionData.region.id && node.role === "target" && node.layer === "deep");
    expect(deep.map((node) => node.id).sort()).toEqual(
      [
        forearmMuscleIds.flexorDigitorumProfundus,
        forearmMuscleIds.flexorPollicisLongus,
        forearmMuscleIds.pronatorQuadratus,
        forearmMuscleIds.extensorIndicis,
        forearmMuscleIds.abductorPollicisLongus,
        forearmMuscleIds.extensorPollicisBrevis,
        forearmMuscleIds.extensorPollicisLongus,
        forearmMuscleIds.supinator,
      ].sort(),
    );
    for (const node of deep) {
      expect(node.shapeNote, node.id).toMatch(/little or no|little separately visible|no separately visible|not directly visible/i);
    }
  });

  it("keeps the brief's specific appearance qualifications", () => {
    const pl = nodeById.get(forearmMuscleIds.palmarisLongus)!;
    expect(pl.shapeNote).toMatch(/small/i);
    expect(pl.shapeNote).toMatch(/not a major driver of forearm width/i);
    expect(pl.shapeNote).toMatch(/missing|absent/i);
    // A visible thumb tendon is not muscle size.
    for (const id of [forearmMuscleIds.abductorPollicisLongus, forearmMuscleIds.extensorPollicisBrevis, forearmMuscleIds.extensorPollicisLongus]) {
      expect(nodeById.get(id)!.shapeNote, id).toMatch(/tendon/i);
      expect(nodeById.get(id)!.shapeNote, id).toMatch(/not muscle size|little/i);
    }
    // The brachioradialis is a thumb-side elbow flexor, not a wrist flexor.
    expect(nodeById.get(forearmMuscleIds.brachioradialis)!.shapeNote).toMatch(/does not bend the wrist/i);
    // Every contour note on a visible surface muscle is qualified.
    for (const node of nodes.filter((n) => n.role === "target" && n.layer === "surface")) {
      expect(node.shapeNote, node.id).toMatch(/may|contributes to|not a major|partly/i);
    }
  });

});

describe("forearm node actions", () => {
  it("keeps the actions the brief names for the main wrist, finger and rotation muscles", () => {
    const role = (nodeId: string, actionId: string) => nodeActions.find((row) => row.nodeId === nodeId && row.actionId === actionId)?.role;
    const m = forearmMuscleIds;
    const a = forearmActionIds;
    expect(role(m.flexorCarpiUlnaris, a.wristFlexion)).toBe("prime");
    expect(role(m.flexorCarpiUlnaris, a.ulnarDeviation)).toBe("prime");
    expect(role(m.flexorCarpiRadialis, a.radialDeviation)).toBe("prime");
    expect(role(m.brachioradialis, a.elbowFlexion)).toBe("prime");
    expect(role(m.brachioradialis, a.wristFlexion)).toBeUndefined();
    expect(role(m.pronatorTeres, a.elbowFlexion)).toBe("assist");
    expect(role(m.pronatorQuadratus, a.distalRadioulnarStabilization)).toBe("assist");
    expect(role(m.flexorDigitorumSuperficialis, a.fingersPipFlexion)).toBe("prime");
    expect(role(m.flexorDigitorumProfundus, a.fingersDipFlexion)).toBe("prime");
    expect(role(m.flexorDigitorumSuperficialis, a.fingersDipFlexion)).toBeUndefined();
    expect(role(m.extensorDigitorum, a.wristExtension)).toBe("assist");
    expect(role(m.supinator, a.supination)).toBe("prime");
    expect(role(externalContributorIds.biceps, a.supination)).toBe("prime");
    expect(role(externalContributorIds.brachialis, a.supination)).toBeUndefined();
  });
});

describe("forearm claims and sources", () => {
  it("gives every core muscle an appearance claim, as anatomical inference", () => {
    const appearance = claims.filter((claim) => claim.kind === "appearance");
    expect(appearance.length).toBeGreaterThanOrEqual(19);
    for (const claim of appearance) expect(claim.basis, claim.id).toBe("anatomical_inference");
  });

  it("states the brief's selectivity limits as their own claims", () => {
    const m = forearmMuscleIds;
    const selectivity = (nodeId: string) => claimsOf(nodeId, "selectivity");
    // FDS finger parts: some selectivity, with coupling (S3).
    expect(selectivity(m.flexorDigitorumSuperficialis).some((c) => c.sources.some((r) => r.sourceId === "S3") && /coupling/i.test(c.statement) && /isolation/i.test(c.statement))).toBe(true);
    // FDS and FDP: shared, no invented split — said on both nodes.
    for (const id of [m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus]) {
      expect(selectivity(id).some((c) => /shared/i.test(c.statement) && /no split|invents no split/i.test(c.statement)), id).toBe(true);
    }
    // ECRL and ECRB cannot be told apart in ordinary exercises — said on both nodes.
    for (const id of [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis]) {
      expect(selectivity(id).some((c) => /no ordinary exercise/i.test(c.statement) && /does not split/i.test(c.statement)), id).toBe(true);
    }
    // Forearm rotation (S2) is acute activity, never growth.
    const rotation = claims.filter((c) => c.sources.some((r) => r.sourceId === "S2"));
    expect(rotation.length).toBeGreaterThanOrEqual(3);
    for (const claim of rotation) {
      expect(claim.kind, claim.id).toBe("selectivity");
      expect(claim.basis, claim.id).toBe("experimental");
      const s2 = claim.sources.find((r) => r.sourceId === "S2")!;
      expect(s2.qualification, claim.id).toMatch(/not a measurement of growth/i);
    }
  });

  it("states palmaris longus absence as variation by population, with no universal figure", () => {
    const variation = claimsOf(forearmMuscleIds.palmarisLongus, "variation");
    expect(variation.length).toBeGreaterThan(0);
    for (const claim of variation) {
      expect(claim.statement).toMatch(/population/i);
      // A count of studies is fine; a rate that reads as true of everyone is not.
      expect(claim.statement).not.toMatch(/%|percent|\b(one|two|three|\d+) in (a hundred|ten|five|\d+)\b/i);
      expect(claim.sources.some((ref) => sourceById.get(ref.sourceId)?.evidenceType === "systematic_review" && !!ref.qualification)).toBe(true);
    }
  });
});

describe("forearm anatomy copy", () => {
  it("uses thumb side and pinky side, never left or right", () => {
    for (const { where, text } of copyStrings()) {
      expect(text, where).not.toMatch(/\b(left|right)\b/i);
    }
  });
});
