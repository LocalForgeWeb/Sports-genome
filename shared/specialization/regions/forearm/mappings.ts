import type { ActionId, MappingEvidenceBasis, MappingSourceRef, MappingVersion, MuscleMode, NodeId, Relationship, ReviewStatus, VariantMapping } from "../../types";
import { FOREARM_MAPPING_VERSION, externalContributorIds as ext, forearmActionIds as a, forearmMuscleIds as m, variantIdFor } from "../../ids";

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
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "An anatomy table gives the muscle's action, not how much this exercise loads it.";
const anatomyRef = (name: string): MappingSourceRef => ({ sourceId: "S4", locator: `Forearm muscle tables: ${name} (action)`, limitation: ACTION_ONLY });
const armRef = (name: string): MappingSourceRef => ({ sourceId: "M8", locator: `Arm muscle tables: ${name} (action)`, limitation: ACTION_ONLY });

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
  biceps: armRef("biceps brachii"),
  brachialis: armRef("brachialis"),
  rotation: { sourceId: "S2", locator: "Results: wrist flexor and extensor activity by forearm rotation", limitation: "Acute controlled isometric tasks; shows that forearm orientation changes activity, not a set credit or growth." } as MappingSourceRef,
  brPosition: { sourceId: "M1", locator: "Results: brachioradialis and biceps activity by hand position", limitation: "Light, slow elbow flexions in 16 adults; other EMG studies disagree on the size of the position effect; EMG is not growth." } as MappingSourceRef,
  extensorsInGrip: { sourceId: "M2", locator: "Results: extensor activity during gripping by wrist and forearm posture", limitation: "Gripping a dynamometer, not lifting; shows the extensors working with the grip, not a measured load in this exercise." } as MappingSourceRef,
  straps: { sourceId: "M3", locator: "Abstract: grip fatigue and grip security with and without straps", limitation: "Deadlifts only; measures grip strength and perception, not forearm muscle activity." } as MappingSourceRef,
  fplPinch: { sourceId: "M4", locator: "Abstract: pinch strength before and after the FPL block", limitation: "Pinch-meter tasks, not plate pinches; abstract only." } as MappingSourceRef,
  rotators: { sourceId: "M5", locator: "Results: supinator vs biceps and pronator quadratus vs pronator teres activity as torque rises", limitation: "Pilot of 4 adults, isometric, forearm in neutral; surface EMG for the pronators." } as MappingSourceRef,
  elbowAngle: { sourceId: "M6", locator: "Abstract: maximal pronation and supination torque by elbow and forearm angle", limitation: "Maximal isometric efforts, not repetitions." } as MappingSourceRef,
  deadliftGrip: { sourceId: "M7", locator: "Abstract: forearm EMG by grip type and load", limitation: "Cited only for a grip-type and load effect existing; the ranking of grips is disputed in summaries and the full text was not read." } as MappingSourceRef,
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

/** Palms-up curls: the biceps and brachialis are the targets; the brachioradialis helps. */
function supinatedCurl(id: number, options: { gripNoStraps?: boolean } = {}): VariantMapping[] {
  return [
    mapping(id, ext.biceps, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.biceps, src.brPosition], rationale: "A palms-up curl is built on elbow flexion with the forearm supinated, the position in which the biceps flexes the elbow best. It is credited as an upper-arm muscle beside the forearm, not as forearm work." }),
    mapping(id, ext.brachialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.brachialis], rationale: "The brachialis flexes the elbow whatever the forearm's rotation, so every curl works it directly. Credited as an upper-arm muscle beside the forearm." }),
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.br, src.brPosition], rationale: "The brachioradialis is an elbow flexor and moves through range in every curl, so it gets dynamic credit; with the palms up it is a helper rather than the curl's target, so it is contributing, not direct." }),
    ...gripHold(id, options.gripNoStraps ? "The hands hold the bar against body weight while the elbows bend: an incidental grip, shared between FDS and FDP. Straps would take it off the fingers, so a strapped set earns no grip credit." : CURL_GRIP, { noStraps: options.gripNoStraps, extra: options.gripNoStraps ? [src.straps] : [] }),
  ];
}

/** Palms-in curls: the brachioradialis is a target alongside the brachialis. */
function neutralCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "inference", sources: [src.br, src.brPosition], rationale: "Hammer-style curls keep the forearm in neutral, where the brachioradialis lies well placed to flex the elbow, and they are the usual choice to train it, so it is a direct target here. EMG studies disagree on how much its activity changes with forearm position (M1 found the change in pronation), so 'direct' is a judgement about the exercise's purpose, not a measured larger share." }),
    mapping(id, ext.brachialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.brachialis], rationale: "The brachialis flexes the elbow whatever the forearm's rotation, so every curl works it directly. Credited as an upper-arm muscle beside the forearm." }),
    mapping(id, ext.biceps, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.biceps, src.brPosition], rationale: "The biceps still flexes the elbow with the palms facing in, but this curl is chosen for the brachioradialis and brachialis, so the biceps is credited as contributing." }),
    ...gripHold(id, CURL_GRIP),
  ];
}

/** Palms-down curls: brachioradialis direct, wrist extensors steadying the wrist in the same set. */
function pronatedCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.brachioradialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "emg", sources: [src.br, src.brPosition], rationale: "With the palms down the biceps is at a mechanical disadvantage and the brachioradialis's share of elbow flexion changes (M1 measured the difference in pronation), so the reverse curl is a direct brachioradialis exercise." }),
    mapping(id, ext.brachialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.brachialis], rationale: "The brachialis flexes the elbow whatever the forearm's rotation, so every curl works it directly. Credited as an upper-arm muscle beside the forearm." }),
    mapping(id, ext.biceps, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "emg", sources: [src.biceps, src.brPosition], rationale: "The biceps still helps flex the elbow with the palms down, at a mechanical disadvantage (M1), so it is contributing." }),
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

function deviation(id: number, action: ActionId, muscles: [NodeId, MappingSourceRef][], side: string): VariantMapping[] {
  return [
    ...muscles.map(([nodeId, ref]) => mapping(id, nodeId, { action, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [ref], rationale: `Tilting the hand toward the ${side} side is done by the flexor and extensor on that side together, so each is direct and the work is shared; how the split moves with a slightly flexed or extended wrist is not known, so no split is given.` })),
    ...gripHold(id, LEVER_GRIP),
  ];
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
  mapping(136, ext.biceps, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.biceps], rationale: "Each rep is lifted with the palms up, the biceps's strongest position for flexing the elbow. Credited as an upper-arm muscle beside the forearm." }),
  mapping(136, ext.brachialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.brachialis], rationale: "The brachialis flexes the elbow whatever the forearm's rotation, so every curl works it directly. Credited as an upper-arm muscle beside the forearm." }),
  ...wristExtensorStabilizers(136, "On the palms-down lowering the wrist extensors hold the wrist straight against the load without moving it: isometric stabilization, not wrist-extension reps (M2 documents extensor activity with a pronated grip)."),
  ...gripHold(136, CURL_GRIP),

  // Wrist work.
  ...wristCurl(139),
  ...wristCurl(410),
  ...reverseWristCurl(140),
  ...reverseWristCurl(411),
  ...reverseWristCurl(350),
  ...wristRoller(141),
  ...deviation(407, a.radialDeviation, [[m.flexorCarpiRadialis, src.fcr], [m.extensorCarpiRadialisLongus, src.ecrl], [m.extensorCarpiRadialisBrevis, src.ecrb]], "thumb"),
  ...deviation(408, a.ulnarDeviation, [[m.flexorCarpiUlnaris, src.fcu], [m.extensorCarpiUlnaris, src.ecu]], "pinky"),

  // Forearm rotation against a lever.
  mapping(405, m.pronatorTeres, { action: a.pronation, relationship: "direct", mode: "dynamic", basis: "emg", allocation: "shared", sources: [src.pt, src.rotators, src.elbowAngle], rationale: "Turning the forearm palm-down against a lever is pronation, which the pronator teres and pronator quadratus do together. In a lever task the quadratus led at low torque and the teres rose more as torque grew (M5), so the work is shared and not credited to either alone." }),
  mapping(405, m.pronatorQuadratus, { action: a.pronation, relationship: "direct", mode: "dynamic", basis: "emg", allocation: "shared", sources: [src.pq, src.rotators], rationale: "Turning the forearm palm-down against a lever is pronation, which the pronator quadratus and pronator teres do together (M5). Shared: nothing here isolates the quadratus." }),
  ...gripHold(405, LEVER_GRIP),
  mapping(406, m.supinator, { action: a.supination, relationship: "direct", mode: "dynamic", basis: "emg", allocation: "shared", sources: [src.supinator, src.rotators, src.elbowAngle], rationale: "Turning the forearm palm-up against a lever is supination. The supinator led at low torque in a lever task, with the biceps rising as torque grew (M5), and torque changes with the elbow angle (M6): with the elbow bent, as this row defines it, the biceps shares the work, so this is not supinator-only." }),
  mapping(406, ext.biceps, { action: a.supination, relationship: "contributing", mode: "dynamic", basis: "emg", allocation: "shared", sources: [src.biceps, src.rotators, src.elbowAngle], rationale: "With the elbow bent the biceps is a strong supinator and joins in as the load grows (M5, M6); it is credited as contributing, as an upper-arm muscle beside the forearm." }),
  ...gripHold(406, LEVER_GRIP),

  // Fingers and thumb.
  ...fingerFlexors(401, "dynamic", "The bar rolls to the fingertips and is curled back by bending the fingers, so the finger flexors move through range: direct, dynamic work, shared between FDS and FDP. A set where the fingers do not move is not this exercise."),
  ...fingerFlexors(402, "dynamic", "Closing the gripper bends the fingers against the spring, so the finger flexors move through range: direct, dynamic work, shared between FDS and FDP."),
  ...fingerFlexors(403, "isometric", `${DELIBERATE_GRIP} Straps do not apply to a gripper.`),
  mapping(404, m.extensorDigitorum, { action: a.fingersExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.ed], rationale: "Opening the fingers against a band is finger extension, the extensor digitorum's main action, so it is direct. The little- and index-finger extensors join in, and the work is shared between the three." }),
  mapping(404, m.extensorDigitiMinimi, { action: a.littleFingerExtension, relationship: "contributing", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.edm], rationale: "The extensor digiti minimi straightens the little finger alongside the extensor digitorum when all the fingers open; contributing and shared." }),
  mapping(404, m.extensorIndicis, { action: a.indexFingerExtension, relationship: "contributing", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.ei], rationale: "The extensor indicis straightens the index finger alongside the extensor digitorum when all the fingers open; contributing and shared." }),
  mapping(412, m.flexorPollicisLongus, { action: a.thumbIpFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.fpl, src.fplPinch], rationale: "Bending the tip of the thumb against a band is the long thumb flexor's own action (the only muscle that bends the thumb's end joint); small-muscle coverage, not a high-volume default." }),
  mapping(413, m.extensorPollicisLongus, { action: a.thumbIpExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.epl], rationale: "Straightening the thumb's tip against a band is the extensor pollicis longus's action; its knuckle is straightened by the brevis at the same time, so the work is shared between them." }),
  mapping(413, m.extensorPollicisBrevis, { action: a.thumbMcpExtension, relationship: "direct", mode: "dynamic", basis: "anatomy", allocation: "shared", sources: [src.epb], rationale: "Straightening the thumb at its knuckle against a band is the extensor pollicis brevis's action, shared with the longus, which straightens the tip." }),
  mapping(414, m.abductorPollicisLongus, { action: a.thumbCmcAbduction, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.apl], rationale: "Moving the thumb away from the index finger at its base against a band is thumb abduction, the abductor pollicis longus's action. The short abductor in the hand also works, but hand muscles are not forearm muscles and are not credited here." }),

  // Pinches, hangs, holds and carries: the hold is the purpose.
  ...fingerFlexors(142, "isometric", `${DELIBERATE_GRIP} Straps do not apply to a pinch. The hand's own muscles also work in a pinch and are not credited to the forearm.`),
  mapping(142, m.flexorPollicisLongus, { action: a.thumbIpFlexion, relationship: "direct", mode: "isometric", basis: "anatomy", sources: [src.fpl, src.fplPinch], rationale: "The thumb presses the plates against the fingers for the whole hold, and the long thumb flexor adds measurably to pinch strength (M4), so it is a direct isometric target in a pinch." }),
  ...fingerFlexors(143, "isometric", `${DELIBERATE_GRIP} Straps would take the hold off the fingers, so a strapped hang earns no grip credit.`, { noStraps: true, extra: [src.straps] }),
  ...fingerFlexors(144, "isometric", `${DELIBERATE_GRIP} Gripping a towel closes the fist further than a bar. Straps would take the hold off the fingers, so a strapped hang earns no grip credit.`, { noStraps: true, extra: [src.straps] }),
  mapping(144, m.flexorPollicisLongus, { action: a.thumbIpFlexion, relationship: "contributing", mode: "isometric", basis: "inference", status: "draft", sources: [src.fpl], rationale: "The thumb wraps the towel and presses on it, so the long thumb flexor likely helps hold; how much is not established, so this stays pending review." }),
  ...[145, 299, 409].flatMap((id) => [
    ...fingerFlexors(id, "isometric", `${DELIBERATE_GRIP} Straps would take the load off the fingers, so a strapped set earns no grip credit.`, { noStraps: true, extra: [src.straps] }),
    mapping(id, m.flexorPollicisLongus, { action: a.thumbIpFlexion, relationship: "contributing", mode: "isometric", basis: "inference", status: "draft", sources: [src.fpl], rationale: "The thumb closes over the handle, so the long thumb flexor likely helps hold it; how much it is loaded in a handle grip, as opposed to a pinch, is not established, so this stays pending review." }),
    ...wristExtensorStabilizers(id, "A heavy handle held at the side needs the wrist held straight while the fingers grip, and the wrist extensors work alongside a grip (M2): isometric stabilization, never dynamic credit (brief §4, farmer carry: wrist stabilization)."),
  ]),
  mapping(300, m.brachioradialis, { action: a.elbowFlexion, relationship: "contributing", mode: "isometric", basis: "anatomy", sources: [src.br], rationale: "The bar sits in the crook of the elbows, and the elbow flexors hold the elbows bent against it for the whole carry. The hands do not grip the bar, so no finger flexor is credited." }),
  mapping(300, ext.biceps, { action: a.elbowFlexion, relationship: "contributing", mode: "isometric", basis: "anatomy", sources: [src.biceps], rationale: "The elbow flexors hold the elbows bent against the bar for the whole carry; credited as an upper-arm muscle beside the forearm." }),
  mapping(300, ext.brachialis, { action: a.elbowFlexion, relationship: "contributing", mode: "isometric", basis: "anatomy", sources: [src.brachialis], rationale: "The elbow flexors hold the elbows bent against the bar for the whole carry; credited as an upper-arm muscle beside the forearm." }),

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
  publishedAt: "2026-10-16",
  methodNotes: [
    "Each catalog exercise the forearm atlas maps has one default variant (cat-<id>) with its execution spelled out: organization, forearm orientation, wrist position, grip, straps, laterality, measure, deliberate hold, and an elbow angle only where the exercise defines one.",
    "Each mapping names one muscle, one joint action, a relationship (direct, contributing, stabilizer, incidental) and a muscle mode (dynamic or isometric) separately, so one set can be dynamic elbow flexion and isometric wrist stabilization at once.",
    "Mappings are by catalog id; no name matching. A mapping is reviewed when the muscle's action is sourced (anatomy tables S4, S7, S8, the arm reference M8) and the relationship is explained in its rationale; EMG sources (S2, S3, M1, M2, M5-M7) are cited only for what they measured. Everything else stays draft and is shown as pending review, never counted.",
    "FDS and FDP are always credited together as shared: nothing in an ordinary grip separates them. Grip during rows, pulldowns, pull-ups, deadlifts, shrugs and hangs is incidental and is not earned by a set logged with straps.",
    "No percentage splits between muscles, no mapping credits every forearm muscle, the hand's own muscles are not credited to the forearm, and a broad 'forearms' tag on an unmapped exercise stays region-level.",
  ].join(" "),
};
