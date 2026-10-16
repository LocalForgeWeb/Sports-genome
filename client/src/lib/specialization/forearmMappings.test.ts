import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { forearmCatalogExercises } from "@/lib/exerciseCatalogForearm";
import { catalogEquipment } from "@/lib/equipmentProfile";
import { exercisePhotoSet } from "@/lib/exercisePhotos";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmVariants, regionOnlyExercises, unmappedForearmTaggedExercises } from "@shared/specialization/regions/forearm/variants";
import { forearmMappings, forearmMappingVersion } from "@shared/specialization/regions/forearm/mappings";
import { forearmMappingSources } from "@shared/specialization/regions/forearm/mappingSources";
import { FOREARM_MAPPING_VERSION, coreForearmMuscleIds, externalContributorIds, forearmActionIds, forearmMuscleIds as m, variantIdFor } from "@shared/specialization/ids";
import { categoryFor } from "@shared/specialization/rules";

/**
 * The forearm atlas's exercise variants and mappings, held to the brief of 16 Oct 2026 (§4, §5,
 * §11) and to docs/specialization-atlas/02-design.md. These read the shipped data, so a mapping
 * or catalog edit that breaks a rule fails here rather than in a total on the page.
 */

const byId = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const variantById = new Map(forearmVariants.map((variant) => [variant.id, variant]));
const nodeById = new Map(forearmRegionData.nodes.map((node) => [node.id, node]));
const actionIds = new Set(forearmRegionData.actions.map((action) => action.id));
const sourceIds = new Set(forearmRegionData.sources.map((source) => source.id));
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
    for (const id of [142, 143, 144, 145, 299, 300, 403, 409]) {
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
    for (const id of [46, 56, 61, 129, 131, 142, 256, 340, 342, 379, 384]) expect(variantById.get(variantIdFor(id))!.laterality, byId.get(id)!.name).toBe("unilateral");
    // Two hands on one implement, two implements, or arms alternating within the set.
    for (const id of [121, 123, 124, 132, 133, 135, 139, 140, 141, 143, 145, 299, 401]) expect(variantById.get(variantIdFor(id))!.laterality, byId.get(id)!.name).toBe("bilateral");
  });

  it("say unknown straps where straps are used and not recorded, and not applicable where they cannot help", () => {
    for (const id of [41, 43, 57, 66, 81, 143, 145, 299, 409]) expect(variantById.get(variantIdFor(id))!.straps, byId.get(id)!.name).toBe("unknown");
    for (const id of [139, 140, 401, 402, 405, 412, 142, 300]) expect(variantById.get(variantIdFor(id))!.straps, byId.get(id)!.name).toBe("not_applicable");
  });

  it("set an elbow angle only where the exercise defines one", () => {
    const withAngle = forearmVariants.filter((variant) => variant.elbowAngleDeg !== null).map((variant) => variant.catalogExerciseId).sort((a, b) => a - b);
    expect(withAngle).toEqual([405, 406, 407, 408]);
  });
});

describe("forearm mappings", () => {
  it("reference an existing variant, node and joint action, under the published version", () => {
    for (const mapping of forearmMappings) {
      expect(variantById.has(mapping.variantId), `${mapping.id}: variant`).toBe(true);
      expect(nodeById.has(mapping.nodeId), `${mapping.id}: node`).toBe(true);
      expect(mapping.actionId && actionIds.has(mapping.actionId), `${mapping.id}: action`).toBe(true);
      expect(mapping.versionKey).toBe(FOREARM_MAPPING_VERSION);
      expect(mapping.id).toBe(`${mapping.variantId}:${mapping.nodeId}`);
    }
    // One mapping per variant and node (the database's unique key).
    expect(new Set(forearmMappings.map((mapping) => mapping.id)).size).toBe(forearmMappings.length);
    // Every variant is mapped.
    for (const variant of forearmVariants) expect(mappingsFor(variant.catalogExerciseId).length, variant.catalogName).toBeGreaterThan(0);
  });

  it("map only real muscles: never a compartment group, and outside the forearm only the biceps and brachialis", () => {
    for (const mapping of forearmMappings) {
      const node = nodeById.get(mapping.nodeId)!;
      expect(node.kind === "group" || node.kind === "compartment" || node.role === "group", mapping.id).toBe(false);
      if (node.role === "external") expect([externalContributorIds.biceps, externalContributorIds.brachialis]).toContain(node.id);
      expect(node.role, mapping.id).not.toBe("adjacent");
    }
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

  it("cite at least one source per mapping, with a locator on every reviewed one, from the region's own sources", () => {
    for (const mapping of forearmMappings) {
      expect(mapping.sources.length, mapping.id).toBeGreaterThan(0);
      for (const ref of mapping.sources) expect(sourceIds.has(ref.sourceId), `${mapping.id} cites ${ref.sourceId}`).toBe(true);
      if (mapping.reviewStatus === "reviewed") expect(mapping.sources.some((ref) => Boolean(ref.locator)), mapping.id).toBe(true);
      expect(mapping.rationale.length, mapping.id).toBeGreaterThan(40);
      // EMG is claimed only with an EMG source in hand.
      if (mapping.evidenceBasis === "emg") expect(mapping.sources.some((ref) => forearmRegionData.sources.find((source) => source.id === ref.sourceId)?.evidenceType === "emg"), mapping.id).toBe(true);
    }
    for (const source of forearmMappingSources) expect(source.id).toMatch(/^M\d+$/);
  });

  it("give every reviewed mapping a countable category, and never let a stabilizer or incidental muscle earn dynamic credit", () => {
    for (const mapping of forearmMappings) {
      const variant = variantById.get(mapping.variantId)!;
      const category = categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
      if (mapping.reviewStatus === "reviewed") expect(category, mapping.id).not.toBe("unknown");
      if (mapping.relationship === "stabilizer" || mapping.relationship === "incidental") expect(mapping.muscleMode, mapping.id).toBe("isometric");
    }
  });

  it("never fan one exercise out to all 19 forearm muscles", () => {
    const core = new Set<string>(coreForearmMuscleIds);
    const widest: [string, number][] = [];
    for (const variant of forearmVariants) {
      const nodes = new Set(mappingsFor(variant.catalogExerciseId).map((mapping) => mapping.nodeId).filter((id) => core.has(id)));
      expect(nodes.size, variant.catalogName).toBeLessThan(coreForearmMuscleIds.length);
      if (nodes.size > 6) widest.push([variant.catalogName, nodes.size]);
    }
    // The only exercise past six muscles is the wrist roller: both wrist groups (its winding
    // direction is not recorded) plus the grip on its handle, all as contributing or incidental.
    expect(widest).toEqual([["Wrist Roller", 7]]);
    expect(mappingsFor(141).every((mapping) => mapping.relationship !== "direct")).toBe(true);
  });

  it("ask for bare hands only where straps exist, and on every pull, hinge, shrug and hang grip", () => {
    for (const mapping of forearmMappings) {
      if (mapping.requiresNoStraps) expect(variantById.get(mapping.variantId)!.straps, mapping.id).not.toBe("not_applicable");
    }
    for (const id of [41, 42, 43, 54, 57, 62, 66, 67, 78, 79, 81, 186, 203, 231, 232, 143, 145, 299, 409]) {
      for (const node of fingerFlexors) expect(mappingOf(id, node)?.requiresNoStraps, `${byId.get(id)!.name} ${node}`).toBe(true);
    }
    for (const id of [43, 57, 66, 41, 81]) expect(mappingOf(id, m.flexorDigitorumSuperficialis)!.relationship).toBe("incidental");
  });

  it("agree with the anatomy lane's node actions wherever a node has them", () => {
    const actionsOf = new Map<string, Set<string>>();
    for (const entry of forearmRegionData.nodeActions) actionsOf.set(entry.nodeId, (actionsOf.get(entry.nodeId) ?? new Set()).add(entry.actionId));
    for (const mapping of forearmMappings) {
      const known = actionsOf.get(mapping.nodeId);
      if (known?.size) expect(known.has(mapping.actionId!), `${mapping.id}: ${mapping.actionId} is not among ${[...known].join(", ")}`).toBe(true);
    }
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
    expect(mappingOf(121, externalContributorIds.biceps)!.relationship).toBe("direct");
    // Wrist curl and reverse wrist curl move the wrist; the grip on the bar is incidental.
    expect(mappingOf(139, m.flexorCarpiUlnaris)!.actionId).toBe(forearmActionIds.wristFlexion);
    expect(mappingOf(139, m.palmarisLongus)!.relationship).toBe("contributing");
    expect(mappingOf(140, m.extensorCarpiRadialisBrevis)!.actionId).toBe(forearmActionIds.wristExtension);
    expect(mappingOf(140, m.extensorDigitorum)!.relationship).toBe("contributing");
    expect(mappingOf(139, m.flexorDigitorumProfundus)!.relationship).toBe("incidental");
    // Finger curl and gripper close move the fingers; a gripper hold holds them.
    for (const id of [401, 402]) expect(mappingOf(id, m.flexorDigitorumSuperficialis)!.muscleMode).toBe("dynamic");
    expect(mappingOf(403, m.flexorDigitorumProfundus)!.muscleMode).toBe("isometric");
    // Pronation and supination are shared, never one muscle alone; the biceps joins supination.
    for (const node of [m.pronatorTeres, m.pronatorQuadratus]) expect(mappingOf(405, node)!.allocation).toBe("shared");
    expect(mappingOf(406, m.supinator)!.allocation).toBe("shared");
    expect(mappingOf(406, externalContributorIds.biceps)!.actionId).toBe(forearmActionIds.supination);
    // Thumb work credits the thumb muscle for each action.
    expect(mappingOf(412, m.flexorPollicisLongus)!.actionId).toBe(forearmActionIds.thumbIpFlexion);
    expect(mappingsFor(413).map((mapping) => mapping.nodeId).sort()).toEqual([m.extensorPollicisBrevis, m.extensorPollicisLongus]);
    expect(mappingsFor(414).map((mapping) => mapping.nodeId)).toEqual([m.abductorPollicisLongus]);
    // A deliberate hold's finger flexors are deliberate isometric work.
    for (const id of [142, 143, 144, 145, 299, 403, 409]) {
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
    expect(forearmMappingVersion).toMatchObject({ key: FOREARM_MAPPING_VERSION, state: "published", publishedAt: "2026-10-16" });
    expect(forearmMappingVersion.methodNotes.length).toBeGreaterThan(200);
    const drafts = forearmMappings.filter((mapping) => mapping.reviewStatus === "draft");
    // Drafts are few and each says why it is not reviewed.
    expect(drafts.length).toBeLessThan(forearmMappings.length / 10);
    for (const mapping of drafts) expect(mapping.rationale, mapping.id).toMatch(/pending review|not established/);
  });
});

describe("catalog coverage for the forearm", () => {
  it("gives every exercise tagged forearms as a primary muscle a reviewed mapping, or lists it as region-level with a reason", () => {
    const regionOnly = new Set(regionOnlyExercises.map((entry) => entry.catalogExerciseId));
    for (const exercise of exercises.filter((candidate) => candidate.primaryMuscles.includes("forearms"))) {
      const reviewed = mappingsFor(exercise.id).some((mapping) => mapping.reviewStatus === "reviewed");
      expect(reviewed || regionOnly.has(exercise.id), `${exercise.id} ${exercise.name}`).toBe(true);
    }
    for (const entry of regionOnlyExercises) {
      expect(byId.get(entry.catalogExerciseId)?.name).toBe(entry.name);
      expect(entry.reason.length).toBeGreaterThan(20);
    }
  });

  it("accounts for every exercise tagged forearms or grip: mapped, or left unmapped with a reason", () => {
    const mapped = new Set(forearmVariants.map((variant) => variant.catalogExerciseId));
    const listed = new Map([...regionOnlyExercises, ...unmappedForearmTaggedExercises].map((entry) => [entry.catalogExerciseId, entry]));
    for (const exercise of exercises.filter(tagged)) expect(mapped.has(exercise.id) || listed.has(exercise.id), `${exercise.id} ${exercise.name}`).toBe(true);
    for (const [id, entry] of listed) {
      expect(mapped.has(id), `${id} is both mapped and listed as unmapped`).toBe(false);
      expect(byId.get(id)?.name, String(id)).toBe(entry.name);
      expect(tagged(byId.get(id)!), entry.name).toBe(true);
    }
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
  const expected: [number, string][] = [
    [401, "Finger Curl"], [402, "Gripper Close"], [403, "Gripper Hold"], [404, "Band Finger Extension"],
    [405, "Lever Pronation"], [406, "Lever Supination"], [407, "Lever Radial Deviation"], [408, "Lever Ulnar Deviation"],
    [409, "Suitcase Carry"], [410, "One-Arm Dumbbell Wrist Curl"], [411, "One-Arm Dumbbell Reverse Wrist Curl"],
    [412, "Band Thumb Flexion"], [413, "Band Thumb Extension"], [414, "Band Thumb Abduction"],
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
    // The source's lying pronation and supination pairs do not show which way the forearm turns.
    for (const [id] of expected.filter(([id]) => ![401, 410, 411].includes(id))) expect(exercisePhotoSet(id), String(id)).toBeNull();
  });

  it("use the catalog's own muscle keys, never the atlas's node ids", () => {
    for (const exercise of exercises) for (const key of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) expect(key, exercise.name).not.toMatch(/^forearm\.|^upper_arm\./);
  });
});
