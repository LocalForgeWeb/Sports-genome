import type { ActionId, MappingEvidenceBasis, MappingSourceRef, MappingVersion, MuscleMode, NodeId, Relationship, ReviewStatus, VariantMapping } from "../../types";
import { variantIdFor } from "../../ids";
import { FOREARM_MAPPING_VERSION, forearmActionIds as a, forearmMuscleIds as m } from "./ids";

/**
 * Variant → node mappings for the forearm atlas, by catalog id (brief §4: "use exercise IDs,
 * not fuzzy name matching at runtime"). Method, families and every decision:
 * docs/specialization-atlas/05-mappings.md.
 *
 * Each mapping says how ONE muscle takes part in ONE exercise variant:
 * - `relationship`: direct (the exercise is built on this muscle's action), contributing (it
 *   helps move the load), stabilizer (it steadies a joint that does not move), incidental (it
 *   holds the implement while something else is trained);
 * - `muscleMode`: dynamic (its joint moves through range) or isometric (it holds).
 * A reverse curl therefore has a dynamic elbow-flexion mapping AND isometric wrist-extensor
 * mappings in the same set (brief §11, "Reverse curl").
 *
 * Evidence is kept honest per mapping: `anatomy` where the mapping rests on what the muscle
 * does (a wrist flexor in a wrist curl), `inference` where it rests on a judgement about its
 * role or size of part (a grip called incidental), `emg` only where an EMG source is cited.
 * `reviewed` means the action is sourced and the relationship is explained in the rationale;
 * anything short of that stays `draft` and is shown as pending review, never counted.
 *
 * Not done on purpose: no percentage split between muscles, no mapping that credits every
 * forearm muscle, no credit for the hand's own (intrinsic) muscles, and no credit for a
 * muscle the exercise defines no load for (a dumbbell turned about its own handle).
 *
 * This is `forearm_mappings_v2` (release F3, 24 Oct 2026; docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §1.2-§1.7, and the v2 section of 05-mappings.md). v1's 418 rows
 * are frozen in shared/specialization/__fixtures__/forearmMappingsV1.ts; v2 differs from them only
 * as forearmMappingsV2.test.ts lists:
 * - no row on the biceps or brachialis (rule 12): from wave A the upper arm's own version credits them;
 * - the thumb flexor's four drafts in the towel hang and the carries reviewed as incidental grip,
 *   and the same row added on the dead hang (Hamrick 1998);
 * - the wrist extensors steadying the wrist in the hangs and grippers (M2, with S05), and the wrist
 *   flexors in the same grip tasks and the carries (S05 names them among the muscles that rose with
 *   grip force);
 * - the pronator quadratus steadying the joint near the wrist in lever supination (S03), and S03 and
 *   S04 added as second sources on the pronation and deviation rows whose muscles their abstracts name;
 * - the brachioradialis on the face pulls, the rear-delt row, three cable rows and a kneeling cable
 *   pulldown, where the upper arm
 *   now credits the biceps and brachialis (wave A's pulls review);
 * - the new rows 417-420: two wrist curls, a timed barbell hold and the index and little finger drill.
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "An anatomy table gives the muscle's action, not how much this exercise loads it.";
const anatomyRef = (name: string): MappingSourceRef => ({ sourceId: "S4", locator: `Forearm muscle tables: ${name} (action)`, limitation: ACTION_ONLY });

const src = {
  br: anatomyRef("brachioradialis"),
  fcr: anatomyRef("flexor carpi radialis"),
  fcrApp: { sourceId: "S7", locator: "Function", limitation: "Location and wrist action; no exercise loading." } as MappingSourceRef,
  fcu: anatomyRef("flexor carpi ulnaris"),
  pl: anatomyRef("palmaris longus"),
  fds: anatomyRef("flexor digitorum superficialis"),
  fdp: { sourceId: "S8", locator: "Structure and Function", limitation: "Gives FDP's joint actions; says nothing about how a grip shares its load between FDP and FDS." } as MappingSourceRef,
  fdsCoupling: { sourceId: "S3", locator: "Abstract and Discussion: selective recruitment with coupling between fingers", limitation: "Single motor units in weak isolated finger flexion; shows partial selectivity, not FDS working apart from FDP in a whole-hand grip." } as MappingSourceRef,
  fpl: anatomyRef("flexor pollicis longus"),
  pt: anatomyRef("pronator teres"),
  pq: anatomyRef("pronator quadratus"),
  ecrl: anatomyRef("extensor carpi radialis longus"),
  ecrb: anatomyRef("extensor carpi radialis brevis"),
  ecu: anatomyRef("extensor carpi ulnaris"),
  ed: anatomyRef("extensor digitorum"),
  edm: anatomyRef("extensor digiti minimi"),
  ei: anatomyRef("extensor indicis"),
  apl: anatomyRef("abductor pollicis longus"),
  epb: anatomyRef("extensor pollicis brevis"),
  epl: anatomyRef("extensor pollicis longus"),
  supinator: anatomyRef("supinator"),
  rotation: { sourceId: "S2", locator: "Results: wrist flexor and extensor activity by forearm rotation", limitation: "Acute controlled isometric tasks; shows that forearm orientation changes activity, not a set credit or growth." } as MappingSourceRef,
  brPosition: { sourceId: "M1", locator: "Results: brachioradialis and biceps activity by hand position", limitation: "Light, slow elbow flexions in 16 adults; other EMG studies disagree on the size of the position effect; EMG is not growth." } as MappingSourceRef,
  extensorsInGrip: { sourceId: "M2", locator: "Results: extensor activity during gripping by wrist and forearm posture", limitation: "Gripping a dynamometer, not lifting; shows the extensors working with the grip, not a measured load in this exercise." } as MappingSourceRef,
  straps: { sourceId: "M3", locator: "Abstract: grip fatigue and grip security with and without straps", limitation: "Deadlifts only; measures grip strength and perception, not forearm muscle activity." } as MappingSourceRef,
  fplPinch: { sourceId: "M4", locator: "Abstract: pinch strength before and after the FPL block", limitation: "Pinch-meter tasks, not plate pinches; abstract only." } as MappingSourceRef,
  rotators: { sourceId: "M5", locator: "Results: supinator vs biceps and pronator quadratus vs pronator teres activity as torque rises", limitation: "Pilot of 4 adults, isometric, forearm in neutral; surface EMG for the pronators." } as MappingSourceRef,
  elbowAngle: { sourceId: "M6", locator: "Abstract: maximal pronation and supination torque by elbow and forearm angle", limitation: "Maximal isometric efforts, not repetitions." } as MappingSourceRef,
  deadliftGrip: { sourceId: "M7", locator: "Abstract: forearm EMG by grip type and load", limitation: "Cited only for a grip-type and load effect existing; the ranking of grips is disputed in summaries and the full text was not read." } as MappingSourceRef,
  // forearm_mappings_v2 (F3).
  brStrongest: { sourceId: "A2", locator: "Quick Facts: Action", limitation: "Relays Gray's Anatomy: the muscle's action and the forearm position it is strongest in, not how much this exercise loads it." } as MappingSourceRef,
  fplForcefulGrip: { sourceId: "pmid.9503091", locator: "Abstract", limitation: "Forceful stone-tool use and tool making, not a gym handle; abstract only." } as MappingSourceRef,
  gripForce: { sourceId: "pmid.35646483", locator: "Abstract: Results; Methods (the eight muscles recorded)", limitation: "A robot tilting the wrist of a hand holding a handle at set grip forces, not this exercise; activity rose with grip force in every muscle recorded, and no value for this muscle was seen. Abstract and search excerpts only." } as MappingSourceRef,
  extensorsAsGroup: { sourceId: "M2", locator: "Results: extensor activity during gripping by wrist and forearm posture", limitation: "Names the wrist extensors as a group, not each muscle; a measuring handle, not a barbell." } as MappingSourceRef,
  extensorsRecordedAsOne: { sourceId: "pmid.35646483", locator: "Abstract: Results; Methods (the eight muscles recorded)", limitation: "Records the radial wrist extensor as one muscle, not the longus and brevis apart; a robot tilting the wrist of a hand holding a handle, not this exercise; activity rose with grip force in every muscle recorded. Abstract and search excerpts only." } as MappingSourceRef,
  pronationEffort: { sourceId: "pmid.14656682", locator: "Abstract: muscle activity in pronation", limitation: "Maximal isometric efforts in a device that excludes the grip, 14 adults, not repetitions against a lever; abstract only." } as MappingSourceRef,
  pqBothWays: { sourceId: "pmid.14656682", locator: "Abstract: the deep head of pronator quadratus in pronation and supination", limitation: "Maximal isometric efforts in a device that excludes the grip, 14 adults, not repetitions against a lever; the deep head only; abstract only." } as MappingSourceRef,
  deviationRobot: { sourceId: "pmid.32636008", locator: "Abstract", limitation: "Twelve men on a wrist robot, surface EMG: the abstract names the ulnar flexor and extensor only as steadying the wrist (co-contraction) during radial tilts, not as moving it toward the little finger, with no value for this exercise; a robot handle, not a dumbbell lever. Abstract only." } as MappingSourceRef,
  radialExtensorRobot: { sourceId: "pmid.32636008", locator: "Abstract", limitation: "Twelve men on a wrist robot, surface EMG: records the radial wrist extensor as one muscle, the most task dependent of eight; a robot handle, not a dumbbell lever. Abstract only." } as MappingSourceRef,
  eiOnItsOwn: { sourceId: "A37", locator: "Function", limitation: "Gives the action and that it lets the index finger straighten on its own, not how much this drill loads it." } as MappingSourceRef,
  edmOnItsOwn: { sourceId: "A35", locator: "Function", limitation: "Gives the action and that it can straighten the little finger on its own, not how much this drill loads it." } as MappingSourceRef,
};

// ---------------------------------------------------------------- one mapping

interface Spec {
  action: ActionId | null;
  relationship: Relationship;
  mode: MuscleMode;
  basis: MappingEvidenceBasis;
  rationale: string;
  sources: MappingSourceRef[];
  allocation?: VariantMapping["allocation"];
  noStraps?: boolean;
  status?: ReviewStatus;
}

const mapping = (catalogExerciseId: number, nodeId: NodeId, spec: Spec): VariantMapping => ({
  id: `${variantIdFor(catalogExerciseId)}:${nodeId}`,
  versionKey: FOREARM_MAPPING_VERSION,
  variantId: variantIdFor(catalogExerciseId),
  nodeId,
  actionId: spec.action,
  relationship: spec.relationship,
  muscleMode: spec.mode,
  evidenceBasis: spec.basis,
  allocation: spec.allocation ?? "individual",
  requiresNoStraps: spec.noStraps ?? false,
  rationale: spec.rationale,
  reviewStatus: spec.status ?? "reviewed",
  sources: spec.sources,
});

// ---------------------------------------------------------------- building blocks

/**
 * FDS and FDP holding an implement while something else is trained. Always shared: nothing in
 * an ordinary grip separates the two (S3, S8), so neither is credited on its own.
 */
function gripHold(id: number, rationale: string, options: { relationship?: Relationship; noStraps?: boolean; extra?: MappingSourceRef[] } = {}): VariantMapping[] {
  const shared = { mode: "isometric" as const, basis: "inference" as const, allocation: "shared" as const, relationship: options.relationship ?? "incidental", noStraps: options.noStraps ?? false, rationale };
  return [
    mapping(id, m.flexorDigitorumSuperficialis, { ...shared, action: a.fingersPipFlexion, sources: [src.fds, src.fdsCoupling, ...(options.extra ?? [])] }),
    mapping(id, m.flexorDigitorumProfundus, { ...shared, action: a.fingersDipFlexion, sources: [src.fdp, src.fdsCoupling, ...(options.extra ?? [])] }),
  ];
}

/** FDS and FDP doing the exercise's own work: the fingers bend (dynamic) or hold (isometric). */
function fingerFlexors(id: number, mode: "dynamic" | "isometric", rationale: string, options: { noStraps?: boolean; extra?: MappingSourceRef[] } = {}): VariantMapping[] {
  const shared = { relationship: "direct" as const, mode, basis: "anatomy" as const, allocation: "shared" as const, noStraps: options.noStraps ?? false, rationale };
  return [
    mapping(id, m.flexorDigitorumSuperficialis, { ...shared, action: a.fingersPipFlexion, sources: [src.fds, src.fdsCoupling, ...(options.extra ?? [])] }),
    mapping(id, m.flexorDigitorumProfundus, { ...shared, action: a.fingersDipFlexion, sources: [src.fdp, src.fdsCoupling, ...(options.extra ?? [])] }),
  ];
}

/** The three wrist extensors holding the wrist straight while the hand grips or the elbow moves. */
function wristExtensorStabilizers(id: number, rationale: string): VariantMapping[] {
  const common = { action: a.wristExtension, relationship: "stabilizer" as const, mode: "isometric" as const, basis: "emg" as const, rationale };
  return [
    mapping(id, m.extensorCarpiRadialisLongus, { ...common, sources: [src.ecrl, src.extensorsInGrip] }),
    mapping(id, m.extensorCarpiRadialisBrevis, { ...common, sources: [src.ecrb, src.extensorsInGrip] }),
    mapping(id, m.extensorCarpiUlnaris, { ...common, sources: [src.ecu, src.extensorsInGrip] }),
  ];
}

const CURL_GRIP = "The fingers hold the bar, dumbbell or handle while the elbow flexors work: a real but incidental grip, not finger-flexor training. FDS and FDP share it; nothing here splits it between them.";
const LEVER_GRIP = "The fingers hold the handle while the wrist or forearm does the work: an incidental grip, shared between FDS and FDP.";

// ---------------------------------------------------------------- curl families

/**
 * Palms-up curls: the biceps and brachialis are the targets (credited by the upper arm's own
 * version since wave A, so v2 has no row for them: rule 12); the brachioradialis helps.
 */
function supinatedCurl(id: number, options: { gripNoStraps?: boolean } = {}): VariantMapping[] {
  return [
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.br, src.brPosition], rationale: "The brachioradialis is an elbow flexor and moves through range in every curl, so it gets dynamic credit; with the palms up it is a helper rather than the curl's target, so it is contributing, not direct." }),
    ...gripHold(id, options.gripNoStraps ? "The hands hold the bar against body weight while the elbows bend: an incidental grip, shared between FDS and FDP. Straps would take it off the fingers, so a strapped set earns no grip credit." : CURL_GRIP, { noStraps: options.gripNoStraps, extra: options.gripNoStraps ? [src.straps] : [] }),
  ];
}

/** Palms-in curls: the brachioradialis is a target alongside the brachialis (the upper arm's row). */
function neutralCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "inference", sources: [src.br, src.brPosition], rationale: "Hammer-style curls keep the forearm in neutral, where the brachioradialis lies well placed to flex the elbow, and they are the usual choice to train it, so it is a direct target here. EMG studies disagree on how much its activity changes with forearm position (M1 found the change in pronation), so 'direct' is a judgement about the exercise's purpose, not a measured larger share." }),
    ...gripHold(id, CURL_GRIP),
  ];
}

/** Palms-down curls: brachioradialis direct, wrist extensors steadying the wrist in the same set (the elbow flexors of the upper arm are the upper arm's rows). */
function pronatedCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "emg", sources: [src.br, src.brPosition], rationale: "With the palms down the biceps is at a mechanical disadvantage and the brachioradialis's share of elbow flexion changes (M1 measured the difference in pronation), so the reverse curl is a direct brachioradialis exercise." }),
    ...wristExtensorStabilizers(id, "With the palms down the load pulls the hand toward the floor, and the wrist extensors hold the wrist straight for the whole set without moving it: isometric stabilization in the same bout as the dynamic elbow flexion (brief §11). Extensor activity with a pronated grip is documented in gripping (M2); it is not dynamic wrist-extension work."),
    ...gripHold(id, CURL_GRIP),
  ];
}

// ---------------------------------------------------------------- wrist families

function wristCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.flexorCarpiRadialis, { action: a.wristFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.fcr, src.fcrApp, src.rotation], rationale: "A wrist curl is built on wrist flexion, the flexor carpi radialis's main action; the wrist moves through range against the load." }),
    mapping(id, m.flexorCarpiUlnaris, { action: a.wristFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.fcu, src.rotation], rationale: "A wrist curl is built on wrist flexion, the flexor carpi ulnaris's main action; the wrist moves through range against the load." }),
    mapping(id, m.palmarisLongus, { action: a.wristFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.pl], rationale: "The palmaris longus is a weak wrist flexor, so it helps rather than leads; it is absent in some people, and its credit means nothing for them." }),
    ...gripHold(id, "The fingers hold the bar or dumbbell while the wrist moves: incidental grip, shared between FDS and FDP. If the bar is let roll to the fingertips the fingers also move, but that is not part of the definition and is not credited."),
  ];
}

function reverseWristCurl(id: number): VariantMapping[] {
  const extensor = (nodeId: NodeId, ref: MappingSourceRef, name: string) =>
    mapping(id, nodeId, { action: a.wristExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [ref, src.rotation], rationale: `A reverse wrist curl is built on wrist extension, one of the ${name}'s main actions; the wrist moves through range against the load. Nothing in this exercise is known to favour one radial extensor over the other, so the longus and brevis are credited alike.` });
  return [
    extensor(m.extensorCarpiRadialisLongus, src.ecrl, "extensor carpi radialis longus"),
    extensor(m.extensorCarpiRadialisBrevis, src.ecrb, "extensor carpi radialis brevis"),
    mapping(id, m.extensorCarpiUlnaris, { action: a.wristExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.ecu, src.rotation], rationale: "A reverse wrist curl is built on wrist extension, one of the extensor carpi ulnaris's main actions; the wrist moves through range against the load." }),
    mapping(id, m.extensorDigitorum, { action: a.wristExtension, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.ed], rationale: "The extensor digitorum assists wrist extension, but its main job is straightening the fingers, which stay closed on the bar; it is contributing, not direct. This is wrist extension, not finger extension." }),
    ...gripHold(id, "The fingers hold the bar or handle while the wrist moves: incidental grip, shared between FDS and FDP."),
  ];
}

function wristRoller(id: number): VariantMapping[] {
  const roll = "Winding the roller moves each wrist through flexion and extension against the hanging weight, but which way it is wound (and so which group lifts and which lowers) is not recorded. Both groups are credited as contributing and shared, rather than as direct work for either.";
  const flex = { action: a.wristFlexion, relationship: "contributing" as const, mode: "dynamic" as const, basis: "anatomy" as const, allocation: "shared" as const, rationale: roll };
  const ext_ = { ...flex, action: a.wristExtension };
  return [
    mapping(id, m.flexorCarpiRadialis, { ...flex, sources: [src.fcr] }),
    mapping(id, m.flexorCarpiUlnaris, { ...flex, sources: [src.fcu] }),
    mapping(id, m.extensorCarpiRadialisLongus, { ...ext_, sources: [src.ecrl] }),
    mapping(id, m.extensorCarpiRadialisBrevis, { ...ext_, sources: [src.ecrb] }),
    mapping(id, m.extensorCarpiUlnaris, { ...ext_, sources: [src.ecu] }),
    ...gripHold(id, "The fingers hold the roller's handle throughout: incidental grip, shared between FDS and FDP."),
  ];
}

/**
 * The wrist roller with its direction recorded. Palms down, rolling the top of the roller
 * toward you is made of wrist extensions against the hanging weight, so the wrist extensors
 * lift it (direct, dynamic) and the flexors only control the hand between turns
 * (contributing); rolling it away is made of wrist flexions, and the roles swap. This is
 * the direction of the joint action, read from anatomy; no study separates the two winds.
 */
function wristRollerWind(id: number, lifting: "extension" | "flexion"): VariantMapping[] {
  const wind = lifting === "extension" ? "rolling the top of the roller toward you, palms down" : "rolling the top of the roller away from you, palms down";
  const lifts = `Winding by ${wind} is a series of wrist ${lifting === "extension" ? "extensions" : "flexions"} against the hanging weight, one of this muscle's main actions: direct, dynamic work.`;
  const controls = `Winding by ${wind} is driven by the ${lifting === "extension" ? "extensors" : "flexors"}; this muscle steadies and returns the hand between turns: contributing, not direct.`;
  const flexion = { action: a.wristFlexion, mode: "dynamic" as const, basis: "anatomy" as const, relationship: lifting === "flexion" ? "direct" as const : "contributing" as const, rationale: lifting === "flexion" ? lifts : controls };
  const extension = { action: a.wristExtension, mode: "dynamic" as const, basis: "anatomy" as const, relationship: lifting === "extension" ? "direct" as const : "contributing" as const, rationale: lifting === "extension" ? lifts : controls };
  return [
    mapping(id, m.flexorCarpiRadialis, { ...flexion, sources: [src.fcr] }),
    mapping(id, m.flexorCarpiUlnaris, { ...flexion, sources: [src.fcu] }),
    mapping(id, m.extensorCarpiRadialisLongus, { ...extension, sources: [src.ecrl] }),
    mapping(id, m.extensorCarpiRadialisBrevis, { ...extension, sources: [src.ecrb] }),
    mapping(id, m.extensorCarpiUlnaris, { ...extension, sources: [src.ecu] }),
    ...gripHold(id, "The fingers hold the roller's handle throughout: incidental grip, shared between FDS and FDP."),
  ];
}

/** The deviation levers; a muscle may carry a second source (v2: S04, where its abstract names the muscle). */
function deviation(id: number, action: ActionId, muscles: [NodeId, ...MappingSourceRef[]][], side: string): VariantMapping[] {
  return [
    ...muscles.map(([nodeId, ...refs]) => mapping(id, nodeId, { action, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: refs, rationale: `Tilting the hand toward the ${side} side is done by the flexor and extensor on that side together, so each is direct and the work is shared; how the split moves with a slightly flexed or extended wrist is not known, so no split is given.` })),
    ...gripHold(id, LEVER_GRIP),
  ];
}

// ---------------------------------------------------------------- forearm_mappings_v2's grip-task rows

/**
 * The long thumb flexor holding the implement in a full-hand hold (§1.3, §1.4): incidental, isometric,
 * basis inference (the builder's convention for grip), a bare hand only. Hamrick 1998 found it working
 * in forceful tool use whatever the grip; how much a handle loads it is not known.
 */
function thumbInGrip(id: number, how: string): VariantMapping {
  return mapping(id, m.flexorPollicisLongus, {
    action: a.thumbIpFlexion, relationship: "incidental", mode: "isometric", basis: "inference", noStraps: true, sources: [src.fpl, src.fplForcefulGrip],
    rationale: `${how} The long thumb flexor works whenever the hand closes hard on an object (a study of forceful tool use found it working whatever the grip), so it is credited as incidental grip: real work, not what the set is for. How much this loads it is not known. A strapped set earns it nothing.`,
  });
}

const STEADY_EXTENSORS = "The wrist extensors work alongside a gripping hand, more as the grip gets harder (two gripping studies, one with a measuring handle, one with a robot): they steady the wrist without moving it, never moving work.";
const STEADY_FLEXORS = "The wrist flexors work alongside a gripping hand too, more as the grip gets harder (a robot study that recorded both groups): with the extensors they steady the wrist without moving it, never moving work.";

/** The three wrist extensors steadying the wrist in a grip task (§1.4): M2 names the group, S05 the radial extensor as one and ECU. */
function gripTaskExtensors(id: number, how: string): VariantMapping[] {
  const common = { action: a.wristExtension, relationship: "stabilizer" as const, mode: "isometric" as const, basis: "emg" as const, rationale: `${how} ${STEADY_EXTENSORS}` };
  return [
    mapping(id, m.extensorCarpiRadialisLongus, { ...common, sources: [src.ecrl, src.extensorsAsGroup, src.extensorsRecordedAsOne] }),
    mapping(id, m.extensorCarpiRadialisBrevis, { ...common, sources: [src.ecrb, src.extensorsAsGroup, src.extensorsRecordedAsOne] }),
    mapping(id, m.extensorCarpiUlnaris, { ...common, sources: [src.ecu, src.extensorsAsGroup, src.gripForce] }),
  ];
}

/** FCR and FCU steadying the wrist in a grip task (§1.4): adopted because S05 names both among the muscles that rose with grip force. */
function gripTaskFlexors(id: number, how: string): VariantMapping[] {
  const common = { action: a.wristFlexion, relationship: "stabilizer" as const, mode: "isometric" as const, basis: "emg" as const, rationale: `${how} ${STEADY_FLEXORS}` };
  return [
    mapping(id, m.flexorCarpiRadialis, { ...common, sources: [src.fcr, src.gripForce] }),
    mapping(id, m.flexorCarpiUlnaris, { ...common, sources: [src.fcu, src.gripForce] }),
  ];
}

/** Where each grip task holds the wrist, for the steadying rows' rationales. */
const gripTask: Record<number, string> = {
  143: "Hanging from a bar, the wrists are held straight while the fingers grip.",
  144: "Hanging from towels, the wrists are held straight while the fists grip.",
  145: "A heavy handle held by the thigh needs the wrist held straight while the fingers grip.",
  299: "A heavy handle carried by the thigh needs the wrist held straight while the fingers grip.",
  402: "Closing a gripper, the wrist is held straight while the fingers squeeze.",
  403: "Holding a gripper shut, the wrist is held straight while the fingers squeeze.",
  409: "A heavy handle carried by the thigh needs the wrist held straight while the fingers grip.",
  419: "Holding a loaded bar at arm's length, the wrists are held straight while the fingers grip.",
};

// ---------------------------------------------------------------- forearm_mappings_v2's brachioradialis on pulls

/** Rope face pulls and the rear-delt row (87, 88, 318): the elbows bend against the rope, thumbs up. */
function facePullBrachioradialis(id: number): VariantMapping {
  const turn = id === 88 ? " The turn out at the end works the shoulder's rotators, not the elbow." : "";
  return mapping(id, m.brachioradialis, {
    action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "inference", sources: [src.br, src.brStrongest],
    rationale: `The elbows sit out wide of the rope's line, so the rope pulls the hands away and the elbow flexors bend the elbows against it. With the thumbs up on the rope, the forearm is where anatomy references call the brachioradialis strongest, so it helps move the load: contributing, never direct, as the rear shoulder is the target. No study of it here was found.${turn}`,
  });
}

// ---------------------------------------------------------------- the catalog, by id

const supinatedCurlIds = [121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 137, 336, 338, 339, 340, 341];
const neutralCurlIds = [132, 133, 134, 337, 342];

/** Rows, pulldowns, pull-ups and chin-ups: the elbows bend under load while the hands hold on. */
const elbowPullIds = [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 256, 257, 258, 327, 331, 332, 379, 383, 384];
/** Deadlifts, hinges and shrugs: the hands hold the load; the elbows stay straight. */
const holdingLiftIds = [41, 42, 186, 187, 188, 189, 202, 203, 204, 205, 263, 264, 81, 82, 83, 84, 85, 86];
const deadliftIds = new Set([41, 42, 186, 187, 188, 189, 204, 205, 263, 264]);

const PULL_BR = "The elbows bend under load in a row, pulldown or pull-up, and the brachioradialis is an elbow flexor, so it helps move the load through range. Its share changes with hand position (M1), and the back muscles are the target, so it is contributing, never direct.";
const PULL_GRIP = "The fingers hold the bar or handle while the back and arms move the load: a real but incidental grip, shared between FDS and FDP. Straps take load off the fingers (M3), so a set logged with straps earns no grip credit; one with straps not recorded keeps it and says so.";
const HOLD_GRIP = "The fingers hold the bar, dumbbells or handle while the hips, legs or upper back move the load: a real but incidental grip, shared between FDS and FDP. Straps take load off the fingers (M3), so a set logged with straps earns no grip credit; one with straps not recorded keeps it and says so.";
const HANG_GRIP = "The hands hold body weight on the bar while the hips and trunk do the exercise: an incidental grip, shared between FDS and FDP. A strapped set (hanging ab straps) earns no grip credit.";
const DELIBERATE_GRIP = "Holding on is the purpose of the set, so the finger flexors are the direct target, working isometrically for the time logged. FDS and FDP share the work; nothing in a whole-hand grip separates them (S3, S8).";

export const forearmMappings: VariantMapping[] = [
  // Elbow-flexion curls.
  ...supinatedCurlIds.flatMap((id) => supinatedCurl(id)),
  ...supinatedCurl(138, { gripNoStraps: true }),
  ...neutralCurlIds.flatMap(neutralCurl),
  ...pronatedCurl(135),

  // Zottman: up palms-up, down palms-down. The turn itself is not credited.
  mapping(136, m.brachioradialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "inference", sources: [src.br, src.brPosition], rationale: "Each rep is lowered with the palms down, where the brachioradialis's share of elbow flexion changes (M1), and lifted palms up, where it helps; together that makes it a direct target. The turn at the top is not credited to the pronators or the supinator: a dumbbell turned about its own handle gives little resistance to the turn." }),
  ...wristExtensorStabilizers(136, "On the palms-down lowering the wrist extensors hold the wrist straight against the load without moving it: isometric stabilization, not wrist-extension reps (M2 documents extensor activity with a pronated grip)."),
  ...gripHold(136, CURL_GRIP),

  // Wrist work.
  ...wristCurl(139),
  ...wristCurl(410),
  ...wristCurl(417),
  ...wristCurl(418),
  ...reverseWristCurl(140),
  ...reverseWristCurl(411),
  ...reverseWristCurl(350),
  ...wristRoller(141),
  ...wristRollerWind(415, "extension"),
  ...wristRollerWind(416, "flexion"),
  ...deviation(407, a.radialDeviation, [[m.flexorCarpiRadialis, src.fcr], [m.extensorCarpiRadialisLongus, src.ecrl, src.radialExtensorRobot], [m.extensorCarpiRadialisBrevis, src.ecrb, src.radialExtensorRobot]], "thumb"),
  ...deviation(408, a.ulnarDeviation, [[m.flexorCarpiUlnaris, src.fcu, src.deviationRobot], [m.extensorCarpiUlnaris, src.ecu, src.deviationRobot]], "pinky"),

  // Forearm rotation against a lever.
  mapping(405, m.pronatorTeres, { action: a.pronation, relationship: "direct", mode: "dynamic", basis: "emg", allocation: "shared", sources: [src.pt, src.rotators, src.elbowAngle, src.pronationEffort], rationale: "Turning the forearm palm-down against a lever is pronation, which the pronator teres and pronator quadratus do together. In a lever task the quadratus led at low torque and the teres rose more as torque grew (M5), so the work is shared and not credited to either alone." }),
  mapping(405, m.pronatorQuadratus, { action: a.pronation, relationship: "direct", mode: "dynamic", basis: "emg", allocation: "shared", sources: [src.pq, src.rotators, src.pronationEffort], rationale: "Turning the forearm palm-down against a lever is pronation, which the pronator quadratus and pronator teres do together (M5). Shared: nothing here isolates the quadratus." }),
  ...gripHold(405, LEVER_GRIP),
  mapping(406, m.supinator, { action: a.supination, relationship: "direct", mode: "dynamic", basis: "emg", allocation: "shared", sources: [src.supinator, src.rotators, src.elbowAngle], rationale: "Turning the forearm palm-up against a lever is supination. The supinator led at low torque in a lever task, with the biceps rising as torque grew (M5), and torque changes with the elbow angle (M6): with the elbow bent, as this row defines it, the biceps shares the work, so this is not supinator-only." }),
  mapping(406, m.pronatorQuadratus, { action: a.distalRadioulnarStabilization, relationship: "stabilizer", mode: "isometric", basis: "emg", sources: [src.pq, src.pqBothWays], rationale: "The pronator quadratus does not turn the palm up, but a study of hard turning efforts found its deep head working in both directions and read it as steadying the joint between the two forearm bones near the wrist: steadying, never moving work. Those efforts were maximal and held still, not lifts against a lever, so how much this loads it is not known." }),
  ...gripHold(406, LEVER_GRIP),

  // Fingers and thumb.
  ...fingerFlexors(401, "dynamic", "The bar rolls to the fingertips and is curled back by bending the fingers, so the finger flexors move through range: direct, dynamic work, shared between FDS and FDP. A set where the fingers do not move is not this exercise."),
  ...fingerFlexors(402, "dynamic", "Closing the gripper bends the fingers against the spring, so the finger flexors move through range: direct, dynamic work, shared between FDS and FDP."),
  ...fingerFlexors(403, "isometric", `${DELIBERATE_GRIP} Straps do not apply to a gripper.`),
  ...[402, 403].flatMap((id) => [...gripTaskExtensors(id, gripTask[id]), ...gripTaskFlexors(id, gripTask[id])]),
  mapping(404, m.extensorDigitorum, { action: a.fingersExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.ed], rationale: "Opening the fingers against a band is finger extension, the extensor digitorum's main action, so it is direct. The little- and index-finger extensors join in, and the work is shared between the three." }),
  mapping(404, m.extensorDigitiMinimi, { action: a.littleFingerExtension, relationship: "contributing", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.edm], rationale: "The extensor digiti minimi straightens the little finger alongside the extensor digitorum when all the fingers open; contributing and shared." }),
  mapping(404, m.extensorIndicis, { action: a.indexFingerExtension, relationship: "contributing", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.ei], rationale: "The extensor indicis straightens the index finger alongside the extensor digitorum when all the fingers open; contributing and shared." }),
  mapping(412, m.flexorPollicisLongus, { action: a.thumbIpFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.fpl, src.fplPinch], rationale: "Bending the tip of the thumb against a band is the long thumb flexor's own action (the only muscle that bends the thumb's end joint); small-muscle coverage, not a high-volume default." }),
  mapping(413, m.extensorPollicisLongus, { action: a.thumbIpExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.epl], rationale: "Straightening the thumb's tip against a band is the extensor pollicis longus's action; its knuckle is straightened by the brevis at the same time, so the work is shared between them." }),
  mapping(413, m.extensorPollicisBrevis, { action: a.thumbMcpExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.epb], rationale: "Straightening the thumb at its knuckle against a band is the extensor pollicis brevis's action, shared with the longus, which straightens the tip." }),
  mapping(414, m.abductorPollicisLongus, { action: a.thumbCmcAbduction, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.apl], rationale: "Moving the thumb away from the index finger at its base against a band is thumb abduction, the abductor pollicis longus's action. The short abductor in the hand also works, but hand muscles are not forearm muscles and are not credited here." }),
  // 420 (§10 decision 2): the two finger extensors nothing else trains directly.
  mapping(420, m.extensorIndicis, { action: a.indexFingerExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.ei, src.eiOnItsOwn], rationale: "Straightening the index finger against a band while the middle and ring fingers stay bent is the extensor indicis's own action, which lets that finger straighten on its own, so it is direct, shared with the little finger's extensor. The hand's own muscles also work, and the other fingers cannot be kept wholly out of it; neither is credited here." }),
  mapping(420, m.extensorDigitiMinimi, { action: a.littleFingerExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.edm, src.edmOnItsOwn], rationale: "Straightening the little finger against a band while the middle and ring fingers stay bent is the extensor digiti minimi's own action, which can straighten that finger on its own, so it is direct, shared with the index finger's extensor. The hand's own muscles also work, and the other fingers cannot be kept wholly out of it; neither is credited here." }),
  mapping(420, m.extensorDigitorum, { action: a.fingersExtension, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.ed], rationale: "The extensor digitorum straightens all four fingers, so its slips to the index and little fingers help them open against the band, but the drill keeps the middle and ring fingers bent, which holds back its main work: contributing, not direct." }),

  // Pinches, hangs, holds and carries: the hold is the purpose.
  ...fingerFlexors(142, "isometric", `${DELIBERATE_GRIP} Straps do not apply to a pinch. The hand's own muscles also work in a pinch and are not credited to the forearm.`),
  mapping(142, m.flexorPollicisLongus, { action: a.thumbIpFlexion, relationship: "direct", mode: "isometric", basis: "anatomy", sources: [src.fpl, src.fplPinch], rationale: "The thumb presses the plates against the fingers for the whole hold, and the long thumb flexor adds measurably to pinch strength (M4), so it is a direct isometric target in a pinch." }),
  ...fingerFlexors(143, "isometric", `${DELIBERATE_GRIP} Straps would take the hold off the fingers, so a strapped hang earns no grip credit.`, { noStraps: true, extra: [src.straps] }),
  thumbInGrip(143, "The thumb wraps the bar while the fingers hold the body's weight."),
  ...gripTaskExtensors(143, gripTask[143]),
  ...gripTaskFlexors(143, gripTask[143]),
  ...fingerFlexors(144, "isometric", `${DELIBERATE_GRIP} Gripping a towel closes the fist further than a bar. Straps would take the hold off the fingers, so a strapped hang earns no grip credit.`, { noStraps: true, extra: [src.straps] }),
  // v1's draft, reviewed in v2 as incidental grip (§1.3).
  thumbInGrip(144, "The thumb wraps and presses the towel while the fists hold the body's weight."),
  ...gripTaskExtensors(144, gripTask[144]),
  ...gripTaskFlexors(144, gripTask[144]),
  ...[145, 299, 409].flatMap((id) => [
    ...fingerFlexors(id, "isometric", `${DELIBERATE_GRIP} Straps would take the load off the fingers, so a strapped set earns no grip credit.`, { noStraps: true, extra: [src.straps] }),
    // v1's draft, reviewed in v2 as incidental grip (§1.3).
    thumbInGrip(id, "The thumb closes over the handle while the fingers hold the load."),
    ...wristExtensorStabilizers(id, "A heavy handle held at the side needs the wrist held straight while the fingers grip, and the wrist extensors work alongside a grip (M2): isometric stabilization, never dynamic credit (brief §4, farmer carry: wrist stabilization)."),
    ...gripTaskFlexors(id, gripTask[id]),
  ]),
  // 419 Barbell Hold (§1.2): the hold family's finger flexors, steadying wrist muscles and the thumb in the grip.
  ...fingerFlexors(419, "isometric", `${DELIBERATE_GRIP} Straps would take the hold off the fingers, so a strapped hold earns no grip credit.`, { noStraps: true, extra: [src.straps] }),
  thumbInGrip(419, "The thumb closes over the bar while the fingers hold the load."),
  ...gripTaskExtensors(419, gripTask[419]),
  ...gripTaskFlexors(419, gripTask[419]),
  mapping(300, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "isometric", basis: "anatomy", sources: [src.br], rationale: "The bar sits in the crook of the elbows, and the elbow flexors hold the elbows bent against it for the whole carry. The hands do not grip the bar, so no finger flexor is credited." }),

  // Rows, pulldowns, pull-ups and chin-ups.
  ...elbowPullIds.flatMap((id) => [
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.br, src.brPosition], rationale: PULL_BR }),
    ...gripHold(id, PULL_GRIP, { noStraps: true, extra: [src.straps] }),
  ]),
  ...[78, 80].flatMap((id) => [
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.br, src.brPosition], rationale: PULL_BR }),
    ...gripHold(id, "Pulling on a towel or rope closes the fist around a thick, soft handle and the grip often limits the set, so the finger flexors are contributing rather than merely incidental; the work is still not the purpose of a timed hold, and it is shared between FDS and FDP. A strapped set earns no grip credit.", { relationship: "contributing", noStraps: true, extra: [src.straps] }),
  ]),
  ...[62, 79].flatMap((id) => gripHold(id, `${PULL_GRIP} The elbows stay straight, so no elbow flexor is credited.`, { noStraps: true, extra: [src.straps] })),
  // v2: the brachioradialis where the upper arm's version credits the biceps and brachialis (wave A's pulls review). Their grip is
  // not reviewed in this version (05-mappings.md, v2), so these rows are the brachioradialis's alone.
  ...[326, 329, 330, 333].map((id) => mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.br, src.brPosition], rationale: PULL_BR })),
  ...[87, 88, 318].map(facePullBrachioradialis),
  mapping(317, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "inference", status: "draft", sources: [src.br], rationale: "The elbows bend as the bar rises, but whether the elbow flexors move the load or mostly follow the shoulders in an upright row is not established, so this stays pending review." }),
  ...gripHold(317, PULL_GRIP, { noStraps: true, extra: [src.straps] }),

  // Deadlifts, hinges and shrugs.
  ...holdingLiftIds.flatMap((id) => gripHold(id, HOLD_GRIP, { noStraps: true, extra: deadliftIds.has(id) ? [src.straps, src.deadliftGrip] : [src.straps] })),

  // Hanging core work.
  ...[231, 232, 234].flatMap((id) => gripHold(id, HANG_GRIP, { noStraps: true })),

  // Battle ropes.
  ...[399, 400].flatMap((id) => gripHold(id, "The fists hold the rope ends while the shoulders and trunk drive them: an incidental grip, shared between FDS and FDP. Straps do not apply.")),
];

export const forearmMappingVersion: MappingVersion = {
  key: FOREARM_MAPPING_VERSION,
  state: "published",
  publishedAt: "2026-10-24",
  methodNotes: [
    "Each catalog exercise the forearm atlas maps has one default variant (cat-<id>) with its execution spelled out: organization, forearm orientation, wrist position, grip, straps, laterality, measure, deliberate hold, and an elbow angle only where the exercise defines one.",
    "Each mapping names one muscle, one joint action, a relationship (direct, contributing, stabilizer, incidental) and a muscle mode (dynamic or isometric) separately, so one set can be dynamic elbow flexion and isometric wrist stabilization at once.",
    "Mappings are by catalog id; no name matching. A mapping is reviewed when the muscle's action is sourced (anatomy tables S4, S7, S8, the arm reference M8) and the relationship is explained in its rationale; EMG sources (S2, S3, M1, M2, M5-M7) are cited only for what they measured. Everything else stays draft and is shown as pending review, never counted.",
    "FDS and FDP are always credited together as shared: nothing in an ordinary grip separates them. Grip during rows, pulldowns, pull-ups, deadlifts, shrugs and hangs is incidental and is not earned by a set logged with straps.",
    "No percentage splits between muscles, no mapping credits every forearm muscle, the hand's own muscles are not credited to the forearm, and a broad 'forearms' tag on an unmapped exercise stays region-level.",
    // Version 2 (11-forearm-research-and-stack.md §1.7), with what its conditional rows and decision 2 added.
    "Version 2 reviews the thumb flexor's role in hangs and carries as incidental grip, adds the wrist extensors and flexors steadying the wrist in grip holds, carries and the gripper, the pronator quadratus steadying the joint near the wrist in lever supination, and the brachioradialis in face pulls, cable rows and a kneeling cable pulldown, and maps four new exercises.",
    "Its four new studies are cited only for which muscles they found active.",
    "It adopts none of the research package's grades or percentages. It credits no upper-arm muscle: the upper arm's own version does.",
  ].join(" "),
};
