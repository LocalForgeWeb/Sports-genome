import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { forearmCatalogExercises } from "@/lib/exerciseCatalogForearm";
import { catalogEquipment } from "@/lib/equipmentProfile";
import { exercisePhotoSet } from "@/lib/exercisePhotos";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmVariants } from "@shared/specialization/regions/forearm/variants";
import { forearmMappings, forearmMappingVersion } from "@shared/specialization/regions/forearm/mappings";
import { forearmMappingSources } from "@shared/specialization/sources/forearmMappings";
import { variantIdFor } from "@shared/specialization/ids";
import { FOREARM_MAPPING_VERSION, coreForearmMuscleIds, externalContributorIds, forearmActionIds, forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { categoryFor } from "@shared/specialization/rules";

/**
 * The forearm atlas's exercise variants and mappings, held to the brief of 16 Oct 2026 (§4, §5,
 * §11) and to docs/specialization-atlas/02-design.md, as its current version holds them
 * (`forearm_mappings_v2` since F3; what changed from v1, and only that, is forearmMappingsV2.test.ts's). These read the shipped data, so a mapping
 * or catalog edit that breaks a rule fails here rather than in a total on the page. The rules
 * every region's mappings keep (references, sources, categories, node actions, catalog coverage)
 * are checked for every region in regionContent.test.ts; these are the forearm's own.
 */

const byId = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const variantById = new Map(forearmVariants.map((variant) => [variant.id, variant]));
const nodeById = new Map(forearmRegionData.nodes.map((node) => [node.id, node]));
const mappingsFor = (catalogId: number) => forearmMappings.filter((mapping) => mapping.variantId === variantIdFor(catalogId));
const mappingOf = (catalogId: number, nodeId: string) => forearmMappings.find((mapping) => mapping.variantId === variantIdFor(catalogId) && mapping.nodeId === nodeId);
const tagged = (exercise: Exercise) => exercise.primaryMuscles.includes("forearms") || exercise.secondaryMuscles.includes("forearms") || exercise.qualities.includes("grip");
const fingerFlexors = new Set<string>([m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus]);

describe("forearm variants", () => {
  it("name catalog exercises that exist, by their exact catalog name, one variant each", () => {
    for (const variant of forearmVariants) {
      const exercise = byId.get(variant.catalogExerciseId);
      expect(exercise, `${variant.id} points at a missing catalog id`).toBeDefined();
      expect(variant.catalogName, variant.id).toBe(exercise!.name);
      expect(variant.id).toBe(variantIdFor(variant.catalogExerciseId));
    }
    expect(new Set(forearmVariants.map((variant) => variant.id)).size).toBe(forearmVariants.length);
  });

  it("time every deliberate hold in seconds, and make the hangs, holds, pinches and carries deliberate", () => {
    for (const variant of forearmVariants) if (variant.deliberateHold) expect(variant.measure, variant.id).toBe("seconds");
    for (const id of [142, 143, 144, 145, 299, 300, 403, 409, 419]) {
      const variant = variantById.get(variantIdFor(id))!;
      expect(variant.deliberateHold, variant.catalogName).toBe(true);
      expect(variant.measure, variant.catalogName).toBe("seconds");
    }
    // A hanging leg raise hangs from the bar, but its set is leg raises: the grip is incidental.
    for (const id of [231, 232, 234]) expect(variantById.get(variantIdFor(id))!.deliberateHold).toBe(false);
  });

  it("never calls a one-arm exercise bilateral", () => {
    const oneArm = /\b(one-arm|single-arm|concentration|bayesian|meadows|offset|suitcase|gripper|lever|band (finger|thumb))\b/i;
    for (const variant of forearmVariants) {
      if (oneArm.test(variant.catalogName)) expect(variant.laterality, variant.catalogName).toBe("unilateral");
    }
    // One-arm by their photographs or definitions, whatever the name says.
    for (const id of [46, 56, 61, 129, 131, 142, 256, 340, 342, 379, 384, 420]) expect(variantById.get(variantIdFor(id))!.laterality, byId.get(id)!.name).toBe("unilateral");
    // Two hands on one implement, two implements, or arms alternating within the set.
    for (const id of [121, 123, 124, 132, 133, 135, 139, 140, 141, 143, 145, 299, 401, 417, 418, 419]) expect(variantById.get(variantIdFor(id))!.laterality, byId.get(id)!.name).toBe("bilateral");
  });

  it("say unknown straps where straps are used and not recorded, and not applicable where they cannot help", () => {
    for (const id of [41, 43, 57, 66, 81, 143, 145, 299, 409, 419]) expect(variantById.get(variantIdFor(id))!.straps, byId.get(id)!.name).toBe("unknown");
    for (const id of [139, 140, 401, 402, 405, 412, 142, 300, 417, 418, 420]) expect(variantById.get(variantIdFor(id))!.straps, byId.get(id)!.name).toBe("not_applicable");
  });

  it("set an elbow angle only where the exercise defines one", () => {
    const withAngle = forearmVariants.filter((variant) => variant.elbowAngleDeg !== null).map((variant) => variant.catalogExerciseId).sort((a, b) => a - b);
    expect(withAngle).toEqual([405, 406, 407, 408]);
  });
});

describe("forearm mappings", () => {
  it("sit under the published version, every variant mapped", () => {
    for (const mapping of forearmMappings) expect(mapping.versionKey).toBe(FOREARM_MAPPING_VERSION);
    for (const variant of forearmVariants) expect(mappingsFor(variant.catalogExerciseId).length, variant.catalogName).toBeGreaterThan(0);
  });

  it("map no muscle outside the forearm: the biceps and brachialis are the upper arm's to credit (rule 12)", () => {
    const core = new Set<string>(coreForearmMuscleIds);
    for (const mapping of forearmMappings) {
      expect(nodeById.get(mapping.nodeId)!.role, mapping.id).not.toBe("external");
      expect(core.has(mapping.nodeId), mapping.id).toBe(true);
    }
    for (const nodeId of Object.values(externalContributorIds)) expect(forearmMappings.filter((mapping) => mapping.nodeId === nodeId)).toEqual([]);
  });

  it("credit FDS and FDP only together and only as shared work", () => {
    for (const variant of forearmVariants) {
      const finger = mappingsFor(variant.catalogExerciseId).filter((mapping) => fingerFlexors.has(mapping.nodeId));
      if (!finger.length) continue;
      expect(finger.map((mapping) => mapping.nodeId).sort(), variant.catalogName).toEqual([m.flexorDigitorumProfundus, m.flexorDigitorumSuperficialis]);
      for (const mapping of finger) expect(mapping.allocation, mapping.id).toBe("shared");
      expect(new Set(finger.map((mapping) => `${mapping.relationship}/${mapping.muscleMode}/${mapping.reviewStatus}/${mapping.requiresNoStraps}`)).size, variant.catalogName).toBe(1);
    }
  });

  it("keep the mapping review's sources under M keys", () => {
    for (const source of forearmMappingSources) expect(source.id).toMatch(/^M\d+$/);
  });

  it("never fan one exercise out to all 19 forearm muscles", () => {
    const core = new Set<string>(coreForearmMuscleIds);
    const widest: [string, number][] = [];
    for (const variant of forearmVariants) {
      const nodes = new Set(mappingsFor(variant.catalogExerciseId).map((mapping) => mapping.nodeId).filter((id) => core.has(id)));
      expect(nodes.size, variant.catalogName).toBeLessThan(coreForearmMuscleIds.length);
      if (nodes.size > 6) widest.push([variant.catalogName, nodes.size]);
    }
    // The only exercises past six muscles are the wrist rollers, both wrist groups plus the grip on the handle, and from v2 the
    // grip tasks whose steadying wrist muscles and thumb it credits. Where the roller's winding direction is not recorded (141)
    // nothing is direct; a row that names its direction (415, 416) credits only the group lifting the weight as direct. In the
    // grip tasks only the finger flexors are direct; every other row there steadies or grips (stabilizer or incidental).
    expect(widest.sort((a, b) => a[0].localeCompare(b[0]))).toEqual([
      ["Barbell Hold", 8], ["Dead Hang", 8], ["Farmer Hold", 8], ["Farmer’s Walk", 8], ["Gripper Close", 7], ["Gripper Hold", 7], ["Suitcase Carry", 8],
      ["Towel Dead Hang", 8], ["Wrist Roller", 7], ["Wrist Roller, Extension Wind", 7], ["Wrist Roller, Flexion Wind", 7],
    ]);
    expect(mappingsFor(141).every((mapping) => mapping.relationship !== "direct")).toBe(true);
    for (const id of [143, 144, 145, 299, 402, 403, 409, 419]) {
      for (const mapping of mappingsFor(id).filter((row) => !fingerFlexors.has(row.nodeId))) expect(["stabilizer", "incidental"], mapping.id).toContain(mapping.relationship);
    }
  });

  it("credits a wrist roller by its winding direction", () => {
    const flexors = [m.flexorCarpiRadialis, m.flexorCarpiUlnaris];
    const extensors = [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris];
    const direct = (id: number) => mappingsFor(id).filter((mapping) => mapping.relationship === "direct").map((mapping) => mapping.nodeId).sort();
    expect(direct(415)).toEqual([...extensors].sort());
    expect(direct(416)).toEqual([...flexors].sort());
    for (const nodeId of flexors) expect(mappingOf(415, nodeId)!.relationship).toBe("contributing");
    for (const nodeId of extensors) expect(mappingOf(416, nodeId)!.relationship).toBe("contributing");
    for (const id of [415, 416]) {
      expect(mappingOf(id, m.flexorDigitorumSuperficialis)!.relationship).toBe("incidental");
      expect(mappingsFor(id).every((mapping) => mapping.reviewStatus === "reviewed"), String(id)).toBe(true);
    }
    expect(byId.get(415)!.movement).toBe("Wrist extension");
    expect(byId.get(416)!.movement).toBe("Wrist flexion");
  });

  it("ask for bare hands only where straps exist, and on every pull, hinge, shrug and hang grip", () => {
    for (const mapping of forearmMappings) {
      if (mapping.requiresNoStraps) expect(variantById.get(mapping.variantId)!.straps, mapping.id).not.toBe("not_applicable");
    }
    for (const id of [41, 42, 43, 54, 57, 62, 66, 67, 78, 79, 81, 186, 203, 231, 232, 143, 144, 145, 299, 409, 419]) {
      for (const node of fingerFlexors) expect(mappingOf(id, node)?.requiresNoStraps, `${byId.get(id)!.name} ${node}`).toBe(true);
    }
    for (const id of [43, 57, 66, 41, 81]) expect(mappingOf(id, m.flexorDigitorumSuperficialis)!.relationship).toBe("incidental");
  });

  it("represent a reverse curl as dynamic elbow flexion and isometric wrist stabilization in the same bout (brief §11)", () => {
    const br = mappingOf(135, m.brachioradialis)!;
    expect([br.relationship, br.muscleMode, br.actionId]).toEqual(["direct", "dynamic", forearmActionIds.elbowFlexion]);
    for (const node of [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris]) {
      const mapping = mappingOf(135, node)!;
      expect([mapping.relationship, mapping.muscleMode, mapping.actionId]).toEqual(["stabilizer", "isometric", forearmActionIds.wristExtension]);
    }
  });

  it("follow the reviewed families", () => {
    // Palms-up curl: brachioradialis helps; hammer curl: it is a target.
    expect(mappingOf(121, m.brachioradialis)!.relationship).toBe("contributing");
    expect(mappingOf(132, m.brachioradialis)!.relationship).toBe("direct");
    // The biceps and brachialis are the upper arm's rows (rule 12), on every curl.
    expect(mappingOf(121, externalContributorIds.biceps)).toBeUndefined();
    // Wrist curl and reverse wrist curl move the wrist; the grip on the bar is incidental.
    expect(mappingOf(139, m.flexorCarpiUlnaris)!.actionId).toBe(forearmActionIds.wristFlexion);
    expect(mappingOf(139, m.palmarisLongus)!.relationship).toBe("contributing");
    expect(mappingOf(140, m.extensorCarpiRadialisBrevis)!.actionId).toBe(forearmActionIds.wristExtension);
    expect(mappingOf(140, m.extensorDigitorum)!.relationship).toBe("contributing");
    expect(mappingOf(139, m.flexorDigitorumProfundus)!.relationship).toBe("incidental");
    // Finger curl and gripper close move the fingers; a gripper hold holds them.
    for (const id of [401, 402]) expect(mappingOf(id, m.flexorDigitorumSuperficialis)!.muscleMode).toBe("dynamic");
    expect(mappingOf(403, m.flexorDigitorumProfundus)!.muscleMode).toBe("isometric");
    // Pronation and supination are shared, never one muscle alone; the biceps that joins supination is the upper arm's row, and
    // from v2 the pronator quadratus steadies the joint near the wrist while the forearm turns palm-up.
    for (const node of [m.pronatorTeres, m.pronatorQuadratus]) expect(mappingOf(405, node)!.allocation).toBe("shared");
    expect(mappingOf(406, m.supinator)!.allocation).toBe("shared");
    expect(mappingOf(406, externalContributorIds.biceps)).toBeUndefined();
    const pq = mappingOf(406, m.pronatorQuadratus)!;
    expect([pq.relationship, pq.muscleMode, pq.actionId]).toEqual(["stabilizer", "isometric", forearmActionIds.distalRadioulnarStabilization]);
    // Thumb work credits the thumb muscle for each action.
    expect(mappingOf(412, m.flexorPollicisLongus)!.actionId).toBe(forearmActionIds.thumbIpFlexion);
    expect(mappingsFor(413).map((mapping) => mapping.nodeId).sort()).toEqual([m.extensorPollicisBrevis, m.extensorPollicisLongus]);
    expect(mappingsFor(414).map((mapping) => mapping.nodeId)).toEqual([m.abductorPollicisLongus]);
    // A deliberate hold's finger flexors are deliberate isometric work.
    for (const id of [142, 143, 144, 145, 299, 403, 409, 419]) {
      const mapping = mappingOf(id, m.flexorDigitorumSuperficialis)!;
      expect(categoryFor(mapping.relationship, mapping.muscleMode, variantById.get(mapping.variantId)!.deliberateHold), byId.get(id)!.name).toBe("deliberate_isometric");
    }
    // A Zercher carry has no grip: the bar sits in the elbows.
    expect(mappingsFor(300).some((mapping) => fingerFlexors.has(mapping.nodeId))).toBe(false);
    expect(mappingOf(300, m.brachioradialis)!.muscleMode).toBe("isometric");
    // Straight-arm work earns no elbow-flexor credit.
    for (const id of [62, 79, 41, 81]) expect(mappingOf(id, m.brachioradialis), byId.get(id)!.name).toBeUndefined();
  });

  it("publish the version with its method, keeping drafts visible as drafts", () => {
    expect(forearmMappingVersion).toMatchObject({ key: "forearm_mappings_v2", state: "published", publishedAt: "2026-10-24" });
    expect(FOREARM_MAPPING_VERSION).toBe("forearm_mappings_v2");
    expect(forearmMappingVersion.methodNotes.length).toBeGreaterThan(200);
    const drafts = forearmMappings.filter((mapping) => mapping.reviewStatus === "draft");
    // Drafts are few and each says why it is not reviewed.
    expect(drafts.length).toBeLessThan(forearmMappings.length / 10);
    for (const mapping of drafts) expect(mapping.rationale, mapping.id).toMatch(/pending review|not established/);
  });
});

describe("catalog coverage for the forearm", () => {
  it("gives every exercise tagged forearms as a primary muscle a reviewed mapping", () => {
    for (const exercise of exercises.filter((candidate) => candidate.primaryMuscles.includes("forearms"))) {
      expect(mappingsFor(exercise.id).some((mapping) => mapping.reviewStatus === "reviewed"), `${exercise.id} ${exercise.name}`).toBe(true);
    }
  });

  it("accounts for every exercise tagged forearms or grip: mapped, or left unmapped with a reason", () => {
    const mapped = new Set(forearmVariants.map((variant) => variant.catalogExerciseId));
    const listed = new Set(forearmRegionData.unmappedTagged.map((entry) => entry.catalogId));
    for (const exercise of exercises.filter(tagged)) expect(mapped.has(exercise.id) || listed.has(exercise.id), `${exercise.id} ${exercise.name}`).toBe(true);
    for (const id of listed) expect(tagged(byId.get(id)!), String(id)).toBe(true);
  });

  it("keeps the corrected rows corrected (Phase A defects)", () => {
    // Wrist curls move the wrist; they are not grip holds.
    expect(byId.get(139)!.movement).toBe("Wrist flexion");
    expect(byId.get(140)!.movement).toBe("Wrist extension");
    expect(byId.get(141)!.movement).toBe("Wrist flexion and extension");
    // No forearm row lists forearms as both a primary and a secondary muscle.
    for (const exercise of exercises.filter((candidate) => candidate.primaryMuscles.includes("forearms"))) expect(exercise.secondaryMuscles, exercise.name).not.toContain("forearms");
    // Hanging Knee Raise is hip flexion and trunk work, tagged as Hanging Leg Raise is, with the grip as a helper.
    const knee = byId.get(232)!;
    const leg = byId.get(231)!;
    expect(knee.movement).toBe(leg.movement);
    expect(knee.primaryMuscles).toEqual(leg.primaryMuscles);
    expect(knee.secondaryMuscles).toEqual([...leg.secondaryMuscles, "forearms"]);
  });
});

describe("forearm rows added to the catalog (ids 401+)", () => {
  // 401-416 (16 Oct 2026) and, from the owner's research package, 417-420 (F3, 24 Oct 2026).
  const expected: [number, string][] = [
    [401, "Finger Curl"], [402, "Gripper Close"], [403, "Gripper Hold"], [404, "Band Finger Extension"],
    [405, "Lever Pronation"], [406, "Lever Supination"], [407, "Lever Radial Deviation"], [408, "Lever Ulnar Deviation"],
    [409, "Suitcase Carry"], [410, "One-Arm Dumbbell Wrist Curl"], [411, "One-Arm Dumbbell Reverse Wrist Curl"],
    [412, "Band Thumb Flexion"], [413, "Band Thumb Extension"], [414, "Band Thumb Abduction"],
    [415, "Wrist Roller, Extension Wind"], [416, "Wrist Roller, Flexion Wind"],
    [417, "Cable Wrist Curl"], [418, "Behind-the-Back Wrist Curl"], [419, "Barbell Hold"], [420, "Band Index and Little Finger Extension"],
  ];

  it("appear once each, after every older row, with the ids written down", () => {
    expect(forearmCatalogExercises.map((exercise) => [exercise.id, exercise.name])).toEqual(expected);
    expect(exercises.slice(-expected.length).map((exercise) => exercise.id)).toEqual(expected.map(([id]) => id));
    for (const [id, name] of expected) {
      expect(exercises.filter((exercise) => exercise.id === id), String(id)).toHaveLength(1);
      expect(exercises.filter((exercise) => exercise.name.toLowerCase() === name.toLowerCase()), name).toHaveLength(1);
    }
  });

  it("carry every engine field the catalog's other rows carry", () => {
    const equipment = new Set<string>([...catalogEquipment, "Free weights"]);
    const grades = new Set(["F", "D", "C", "B", "A", "S", "SS"]);
    const keys = new Set(exercises.flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles]));
    for (const exercise of forearmCatalogExercises) {
      expect(exercise.sourceGroup.length, exercise.name).toBeGreaterThan(0);
      expect(exercise.category, exercise.name).toMatch(/^(Arms & grip|Conditioning)$/);
      expect(equipment.has(exercise.equipment), `${exercise.name}: ${exercise.equipment}`).toBe(true);
      expect(exercise.movement.length, exercise.name).toBeGreaterThan(0);
      expect(exercise.primaryMuscles, exercise.name).toContain("forearms");
      for (const key of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) expect(keys.has(key), key).toBe(true);
      expect(exercise.qualities.length, exercise.name).toBeGreaterThan(0);
      expect(grades.has(exercise.muscleGrade), exercise.name).toBe(true);
      expect(Object.keys(exercise.sportFit).sort(), exercise.name).toEqual(["baseball", "basketball", "combat", "soccer", "tennis"]);
      for (const fit of Object.values(exercise.sportFit)) {
        expect(grades.has(fit.grade), exercise.name).toBe(true);
        expect(fit.movementHelp.length, exercise.name).toBeGreaterThan(8);
      }
      // Each has an atlas variant with at least one reviewed mapping.
      expect(mappingsFor(exercise.id).some((mapping) => mapping.reviewStatus === "reviewed"), exercise.name).toBe(true);
    }
  });

  it("are photographed only where a photograph shows exactly the row's set-up", () => {
    expect(exercisePhotoSet(401)?.source).toBe("Finger_Curls");
    expect(exercisePhotoSet(410)?.source).toBe("Seated_One-Arm_Dumbbell_Palms-Up_Wrist_Curl");
    expect(exercisePhotoSet(411)?.source).toBe("Seated_One-Arm_Dumbbell_Palms-Down_Wrist_Curl");
    // F3: each wrist curl defined to match its pair (seated at a low pulley, palms up; standing, the bar behind the thighs).
    expect(exercisePhotoSet(417)?.source).toBe("Cable_Wrist_Curl");
    expect(exercisePhotoSet(418)?.source).toBe("Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl");
    // The source's lying pronation and supination pairs do not show which way the forearm turns; it has no barbell hold and
    // no band drill for single fingers.
    for (const [id] of expected.filter(([id]) => ![401, 410, 411, 417, 418].includes(id))) expect(exercisePhotoSet(id), String(id)).toBeNull();
  });

  it("use the catalog's own muscle keys, never the atlas's node ids", () => {
    for (const exercise of exercises) for (const key of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) expect(key, exercise.name).not.toMatch(/^forearm\.|^upper_arm\./);
  });
});
