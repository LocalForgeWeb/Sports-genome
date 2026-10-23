import type { ActionId, MappingEvidenceBasis, MappingSourceRef, MuscleMode, NodeId, Relationship, ReviewStatus, UnmappedTaggedExercise, VariantMapping } from "../../../types";
import { variantIdFor } from "../../../ids";
import { forearmActionIds as a, shoulderActionIds as sh } from "../../../actions/ids";
import { UPPER_ARM_MAPPING_VERSION, upperArmMuscleIds as m } from "../ids";

/**
 * The upper arm's mappings for one family (docs/specialization-atlas/regions/upper_arm/mappings.md,
 * "Extensions and everything else"): the triceps extensions, and every upper-arm row that is not a
 * press or push, a pull, a row or a curl. Two other families (presses and pushes; pulls, rows and
 * curls) are mapped in their own files; mappings/index.ts joins the three.
 *
 * The family, from the catalog (client/src/lib/specialization/upper_armMappings.extensionsOther.test.ts
 * derives it): every row tagging biceps, brachialis or triceps whose movement is elbow extension, a
 * throw or slam, wrist extension, forearm supination, anti-rotation, a loaded transition, an overhead
 * slam or an alternating arm drive (31 rows); the untagged rows with a library variant that load
 * the upper arm and are not pulls (front raises, the Zercher squat, rollouts, the sit-up throw, the
 * kettlebell snatch); the Zercher carry, whose biceps and brachialis the forearm's version credited;
 * and a few untagged exercises with no variant that a reader might expect to count here.
 *
 * Each mapping names ONE muscle, ONE joint action, a relationship and a mode, as the forearm's do
 * (05-mappings.md): `direct` (the exercise is built on this muscle's action), `contributing` (it
 * helps move the load), `stabilizer` (it steadies a joint that does not move: "steadying"),
 * `incidental` (it holds the implement while something else is trained: "holding"); `dynamic` (its
 * joint moves through range) or `isometric` (it holds). Steadying and holding are both counted in
 * the category "Incidental steadying". One row per muscle and exercise, so a two-joint muscle that
 * does two things in one exercise is credited for the action the exercise is defined by, and its
 * rationale says what else it does.
 *
 * Rationales and reasons are shown to the athlete, so they are plain words, 450 characters at most.
 *
 * Rules this family keeps (10-multi-region.md §1.2, §8):
 * - the lateral and medial heads of the triceps share every action, so wherever one is mapped the
 *   other is too, with the same action, relationship, mode, status and rationale, `allocation:
 *   "shared"`;
 * - the long head has its own row, and the arm's position at the shoulder never changes its
 *   relationship: an overhead extension, a pushdown and a kickback all credit it `direct`. Training
 *   studies of overhead against arm-at-side extensions are never used as credit;
 * - no row on the coracobrachialis (an adjacent member: explained, never credited) or on the
 *   forearm's brachioradialis (the forearm credits it);
 * - no row for `shoulder.flexion` in v1: the biceps' help there is disputed (Levy 2001), so the front
 *   raises are listed, not mapped;
 * - where the definition leaves the elbow's work open, nothing is credited, and the exercise is
 *   listed with its reason (or its elbow rows are drafts where the shoulder's part is defined).
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "Gives the muscle's action, not how much this exercise loads it.";
const SEEN = "Seen through web-search excerpts, not the full text.";
const action = (sourceId: string, locator: string, seen = SEEN): MappingSourceRef => ({ sourceId, locator, limitation: `${ACTION_ONLY} ${seen}` });

const src = {
  triceps: action("statpearls.triceps", "Structure and Function: the three heads straighten the elbow"),
  tricepsKenhub: action("kenhub.triceps_brachii", "Function"),
  longHead: action("imaios.triceps_long_head", "Function: elbow extension; the only head that crosses the shoulder", "Seen through web-search results of the imaios.cn mirror."),
  longHeadShoulder: action("radiopaedia.triceps_brachii", "Action: the long head assists shoulder extension"),
  lateralHead: action("elsevier.triceps_lateral_head", "Quick Facts: Origin, Insertion and Action"),
  medialHead: action("elsevier.triceps_medial_head", "Quick Facts: Origin, Insertion and Action", "The search summary reported its own citation markers as partly garbled; the facts matched IMAIOS."),
  /** Kholinne 2018: at 0 degrees of shoulder elevation the long head had the most force; at 90 degrees and above, the medial head. */
  longHeadArmDown: {
    sourceId: "aott.triceps_heads",
    locator: "Abstract: Results (at 0 degrees of shoulder elevation the long head had the highest modelled force and activation)",
    limitation: "Ten adults; short-term activity and force estimated by a computer model from surface EMG. Abstract only. Not growth and never a credit weight.",
  } satisfies MappingSourceRef,
  medialHeadArmRaised: {
    sourceId: "aott.triceps_heads",
    locator: "Abstract: Results (at 90 degrees of shoulder elevation and above the medial head had the highest modelled force)",
    limitation: "Ten adults; short-term activity and force estimated by a computer model from surface EMG. Abstract only. Not growth and never a credit weight.",
  } satisfies MappingSourceRef,
  biceps: action("A50", "Introduction"),
  bicepsKenhub: action("kenhub.biceps_brachii", "Function"),
  brachialis: action("A51", "Introduction"),
  brachialisTeach: action("teachmeanatomy.brachialis", "Brachialis: flexes the elbow"),
  supinationByTorque: {
    sourceId: "M5",
    locator: "Results: supinator vs biceps activity as torque rises",
    limitation: "Pilot of 4 adults, isometric, forearm in neutral; shows the biceps joining supination as torque rises, not its share in this exercise.",
  } satisfies MappingSourceRef,
  supinationByElbowAngle: {
    sourceId: "M6",
    locator: "Abstract: maximal supination torque by elbow and forearm angle",
    limitation: "Maximal isometric efforts, not repetitions.",
  } satisfies MappingSourceRef,
};

// ---------------------------------------------------------------- one mapping

interface Spec {
  action: ActionId;
  relationship: Relationship;
  mode: MuscleMode;
  basis: MappingEvidenceBasis;
  rationale: string;
  sources: MappingSourceRef[];
  allocation?: VariantMapping["allocation"];
  status?: ReviewStatus;
}

const mapping = (catalogExerciseId: number, nodeId: NodeId, spec: Spec): VariantMapping => ({
  id: `${variantIdFor(catalogExerciseId)}:${nodeId}`,
  versionKey: UPPER_ARM_MAPPING_VERSION,
  variantId: variantIdFor(catalogExerciseId),
  nodeId,
  actionId: spec.action,
  relationship: spec.relationship,
  muscleMode: spec.mode,
  evidenceBasis: spec.basis,
  allocation: spec.allocation ?? "individual",
  requiresNoStraps: false,
  rationale: spec.rationale,
  reviewStatus: spec.status ?? "reviewed",
  sources: spec.sources,
  // Every row here loads the muscle on the side of the arm that holds or moves the load.
  sideRelation: "same",
});

// ---------------------------------------------------------------- building blocks

type Work = Pick<Spec, "relationship" | "mode" | "basis" | "status">;

/**
 * The lateral and medial heads, always together and alike: they start on the back of the upper-arm
 * bone, end on the point of the elbow and cross only the elbow, so they share every action and
 * nothing in an ordinary exercise splits their work (upper_arm.triceps_lateral.selectivity.1).
 */
function lateralAndMedial(id: number, work: Work, rationale: string, extra: MappingSourceRef[] = []): VariantMapping[] {
  const shared = { ...work, action: a.elbowExtension, allocation: "shared" as const, rationale };
  return [
    mapping(id, m.tricepsLateral, { ...shared, sources: [src.lateralHead, src.triceps, ...extra] }),
    mapping(id, m.tricepsMedial, { ...shared, sources: [src.medialHead, src.triceps, ...extra] }),
  ];
}

const PAIR = "The lateral and medial heads share this work; nothing here splits it between them.";
const STEADYING = "steadying, counted apart, never as direct work";
const NOT_TWICE = "that is not counted twice";

/**
 * The long head's shoulder work, in the same words wherever it is credited (399, 237, 284, 285) or
 * named in a listed reason (283, 250).
 */
const LONG_HEAD_DRAWS_DOWN = "The long head, the one triceps head that crosses the shoulder, helps draw the arm down from overhead, so it helps move the load (contributing); the back muscles lead.";

/** The long head drawing the arms down from overhead: contributing, dynamic shoulder extension. */
const longHeadDrawsDown = (id: number, opening: string, more = ""): VariantMapping =>
  mapping(id, m.tricepsLong, {
    action: sh.extension,
    relationship: "contributing",
    mode: "dynamic",
    basis: "anatomy",
    sources: [src.longHeadShoulder, src.longHead, src.tricepsKenhub],
    rationale: `${opening} ${LONG_HEAD_DRAWS_DOWN}${more ? ` ${more}` : ""}`,
  });

// ---------------------------------------------------------------- triceps extensions

/** Where the upper arm is held at the shoulder (the variant's `shoulder` dimension), in the long head's words. */
type ArmPosition = "at_side" | "overhead" | "in_front" | "behind" | "not_defined";

const NOT_WEIGHTED = "Where the arm is held never changes its credit.";

const longHeadIn: Record<ArmPosition, string> = {
  at_side: "With the arm at the side, one small study's model estimated the most force from the long head of the three.",
  overhead: "With the arm overhead it works at a longer length than in a pushdown; training studies on that are not used for credit.",
  in_front: "With the upper arm raised in front it is longer at the shoulder than in a pushdown, shorter than overhead.",
  behind: `With the arm held back beside the trunk it is at its shortest across the shoulder, and it also helps hold the arm there; ${NOT_TWICE}.`,
  not_defined: "Where the upper arm is held is not defined for this exercise.",
};

/** Kholinne 2018's medial-head finding, which applies with the arm at shoulder height or higher. */
const MEDIAL_HIGH = "With the arm at shoulder height or higher, one small study's model estimated the most force from the medial head; the credit stays shared.";

/** An elbow extension against the load: all three heads direct, dynamic. */
function extension(id: number, position: ArmPosition, what: string, note = ""): VariantMapping[] {
  const work: Work = { relationship: "direct", mode: "dynamic", basis: "anatomy" };
  const tail = note ? ` ${note}` : "";
  const raised = position === "in_front" || position === "overhead";
  return [
    mapping(id, m.tricepsLong, {
      ...work,
      action: a.elbowExtension,
      sources: position === "at_side" ? [src.longHead, src.triceps, src.longHeadArmDown] : [src.longHead, src.triceps],
      rationale: `${what} straightens the elbow against the load, which all three triceps heads do, so the long head is direct. ${longHeadIn[position]} ${NOT_WEIGHTED}${tail}`,
    }),
    ...lateralAndMedial(
      id,
      work,
      `${what} straightens the elbow against the load, so these heads are direct. ${PAIR}${raised ? ` ${MEDIAL_HIGH}` : ""}${tail}`,
      raised ? [src.medialHeadArmRaised] : [],
    ),
  ];
}

const PALM_UP = "Turning the palm up changes the hold; the action and its credit are the same.";
const ROPE = "With a rope the hands can turn and part at the bottom; the action and its credit are the same.";

// ---------------------------------------------------------------- other work

/** Throws and slams that straighten both elbows to drive the ball: all three heads help move it. */
function throwing(id: number, how: string, basis: MappingEvidenceBasis, longHeadNote: string): VariantMapping[] {
  const work: Work = { relationship: "contributing", mode: "dynamic", basis };
  return [
    mapping(id, m.tricepsLong, { ...work, action: a.elbowExtension, sources: [src.longHead, src.triceps], rationale: `${how} ${longHeadNote}` }),
    ...lateralAndMedial(id, work, `${how} ${PAIR}`),
  ];
}

const CHEST_PASS = "A chest pass pushes the ball away by straightening both elbows, so the triceps help move it; the chest and shoulders lead, so they are contributing, not direct. The ball leaves the hands, so there is no lowering.";
const SLAM_AS_SHOWN = "The ball starts overhead with the elbows bent, as the exercise's photo shows, and is slammed down as they straighten, so the triceps help drive it; the trunk and back muscles lead, so they are contributing.";

/** An overhead slam with no photo of its own: the arms coming down is defined, the elbows' path is not. */
function slamThen(id: number, then: string): VariantMapping[] {
  return [
    longHeadDrawsDown(id, `An overhead slam, then ${then}: the ball is driven down from overhead.`),
    ...lateralAndMedial(id, { relationship: "contributing", mode: "dynamic", basis: "inference", status: "draft" }, `An overhead slam, then ${then}. This one has no photo, so whether the elbows bend overhead and straighten as the ball goes down is not established and stays pending review. ${PAIR}`),
  ];
}

/** The two elbow flexors holding the elbows bent against a bar that sits in their crook. */
function zercher(id: number, relationship: "incidental" | "contributing", rationale: string): VariantMapping[] {
  const work = { action: a.elbowFlexion, relationship, mode: "isometric" as const, basis: "anatomy" as const, rationale };
  return [
    mapping(id, m.biceps, { ...work, sources: [src.biceps, src.bicepsKenhub] }),
    mapping(id, m.brachialis, { ...work, sources: [src.brachialis, src.brachialisTeach] }),
  ];
}

// ---------------------------------------------------------------- the family, by catalog id

export const extensionsOtherMappings: VariantMapping[] = [
  // Skull crushers: lying on a bench, upper arms upright, the bar or dumbbells lowered toward the head.
  ...extension(148, "in_front", "A skull crusher"),
  ...extension(149, "in_front", "A dumbbell skull crusher"),

  // Pushdowns and pressdowns: elbows at the sides, the handle pushed down to the thighs.
  ...extension(150, "at_side", "A pushdown"),
  ...extension(151, "at_side", "A rope pushdown", ROPE),
  ...extension(152, "at_side", "A reverse-grip pushdown", PALM_UP),
  ...extension(153, "at_side", "A one-arm pushdown", PALM_UP),
  ...extension(343, "at_side", "A pressdown"),
  ...extension(344, "at_side", "A rope pressdown", ROPE),
  ...extension(345, "at_side", "A reverse-grip pressdown", PALM_UP),
  ...extension(346, "at_side", "A one-arm pressdown", PALM_UP),

  // Overhead extensions: upper arms overhead, the load lowered behind the head.
  ...extension(154, "overhead", "An overhead cable extension"),
  ...extension(349, "overhead", "An overhead cable extension"),
  ...extension(155, "overhead", "An overhead dumbbell extension"),
  ...extension(156, "overhead", "A one-arm overhead dumbbell extension"),

  // Machine, bodyweight, cross-body and kickback.
  ...extension(157, "in_front", "A machine extension, the upper arms on a pad raised in front,"),
  ...extension(160, "in_front", "A bodyweight extension, the head lowered toward the hands,", "The load is the body's own weight, leaning in."),
  ...extension(347, "not_defined", "A cross-body extension, the handle drawn across the body,"),
  ...extension(348, "behind", "A kickback"),

  // The Zercher lifts: the bar sits in the crook of the elbows; the hands do not hold it.
  ...zercher(164, "incidental", "The bar sits in the crook of both elbows and the hands do not hold it, so the elbow flexors hold the elbows bent against it while the legs and hips move the load: holding, isometric, counted as incidental steadying, never as direct work."),
  ...zercher(300, "contributing", "The bar sits in the crook of both elbows for the whole carry and the hands do not grip it, so the elbow flexors hold the elbows bent for the time logged. Holding it is part of what the carry trains, so they are contributing, isometric, as the forearm page has always counted them."),

  // Ab-wheel rollout (kneeling, as photographed): the long head draws the arms down; the other two heads keep the elbows straight.
  longHeadDrawsDown(237, "Rolling out takes the arms overhead, and drawing them back down to return works against the body's weight.", `It also helps keep the elbow straight; ${NOT_TWICE}.`),
  ...lateralAndMedial(237, { relationship: "stabilizer", mode: "isometric", basis: "inference" }, `The floor's push on the hands out in front tends to bend the elbows, so these heads hold them straight without moving: ${STEADYING}. ${PAIR}`),

  // Medicine-ball chest passes, the photographed overhead slam and the forward overhead throw.
  ...throwing(271, CHEST_PASS, "anatomy", "The long head works with the other two."),
  ...throwing(281, `Kneeling upright. ${CHEST_PASS}`, "anatomy", "The long head works with the other two."),
  ...throwing(273, SLAM_AS_SHOWN, "inference", `The long head also helps draw the arms down; ${NOT_TWICE}.`),
  ...throwing(280, "The ball is taken behind the head, bending the elbows, and thrown forward as they straighten, so the triceps help drive it; the trunk and back muscles add drive, so they are contributing. The ball leaves the hands.", "inference", `The long head also helps bring the arms forward; ${NOT_TWICE}.`),

  // Overhead slams with no photo of their own: the long head is credited for the arms coming down; the elbow heads are drafts.
  ...slamThen(284, "a sprawl"),
  ...slamThen(285, "a sprint"),

  // Battle rope slams: the arms drive the ropes down from overhead; the elbows' part is not defined.
  longHeadDrawsDown(399, "Slamming the ropes drives both rope ends down from overhead."),
  ...lateralAndMedial(399, { relationship: "contributing", mode: "dynamic", basis: "inference", status: "draft" }, `No photo or set-up shows whether the elbows bend and straighten as the ropes are slammed, or stay nearly straight, so their part is not established and stays pending review. ${PAIR}`),

  // Turkish get-up: the bell held overhead on a straight arm throughout.
  ...(() => {
    const steady = { relationship: "stabilizer" as const, mode: "isometric" as const, basis: "inference" as const };
    const hold = `The bell is held overhead on a straight arm while the legs and trunk move the body under it, so the triceps keep the elbow locked without moving: ${STEADYING}. How hard depends on how upright the arm stays, which is not measured.`;
    return [
      mapping(390, m.tricepsLong, { ...steady, action: a.elbowExtension, sources: [src.longHead, src.triceps], rationale: hold }),
      ...lateralAndMedial(390, steady, `${hold} ${PAIR}`),
    ];
  })(),

  // Lever supination: the forearm's exercise; the upper arm speaks for the biceps.
  mapping(406, m.biceps, {
    action: a.supination,
    relationship: "contributing",
    mode: "dynamic",
    basis: "emg",
    sources: [src.biceps, src.bicepsKenhub, src.supinationByTorque, src.supinationByElbowAngle],
    rationale: "Turning the forearm palm-up against a lever is supination. With the elbow bent at 90 degrees, as the exercise sets it, the biceps is a strong supinator and joins in more as the load rises (M5, M6), so it is contributing. The supinator, a forearm muscle, is credited on the forearm page.",
  }),
];

// ---------------------------------------------------------------- left unmapped, with the reason

const NOT_COUNTED = "The app does not count this exercise for the upper arm yet.";
const FRONT_RAISE = "The biceps' help in raising the arm forward is weak and disputed; one study found none with the elbow kept straight.";
const GOBLET = "is held at the chest with the forearms nearly upright, so the elbow flexors steady it rather than hold it out; holding by the elbow flexors is credited only where the load sits on the elbows, as in the Zercher lifts.";
const SLED_PUSH = `The hands push on the sled's posts while the legs drive; the elbows brace, and how much depends on how the arms are set. ${NOT_COUNTED}`;

/**
 * Exercises this family leaves without an upper-arm mapping, each with its reason, shown to the
 * athlete with the sets it covers. The first four tag an upper-arm muscle as a secondary muscle; the
 * rest are untagged exercises a reader might expect to count here. None is primary-tagged, so none
 * would otherwise count in the region's totals.
 */
export const extensionsOtherUnmapped: UnmappedTaggedExercise[] = [
  // Tagged (secondary).
  { catalogId: 279, reason: "The legs and hips drive the ball up and back over the head; the arms stay nearly straight and pass that drive on, so no upper-arm action carries a load that can be named." },
  { catalogId: 350, reason: "Wrist extension against a cable. Whether the elbow flexors hold the bent elbow against the cable, or the forearm rests on a support, is not defined, so no upper-arm muscle is credited; the forearm counts the wrist work." },
  { catalogId: 380, reason: "The arms hold the handle straight out in front while the trunk resists the cable's pull to turn. The elbows do not move, and whether the pull loads the triceps or only the shoulder and trunk muscles depends on how the arms are set, which is not defined." },
  { catalogId: 400, reason: "Quick, small alternating waves for time: the shoulders and elbows move through a small range against the ropes' swing, and the load on any one upper-arm action is not defined. The forearm counts the grip." },

  // Untagged, with a variant.
  { catalogId: 117, reason: FRONT_RAISE },
  { catalogId: 118, reason: FRONT_RAISE },
  { catalogId: 119, reason: FRONT_RAISE },
  { catalogId: 238, reason: "As shown, the bar is rolled from a push-up position toward the feet into a pike and back with the arms kept upright, so the body's weight runs down the arms: the trunk and hips do the work and the arms only prop the body." },
  { catalogId: 283, reason: "Sitting up drives the throw while the nearly straight arms carry the ball forward. The triceps' long head helps draw the arms down from overhead, but the load on it is not defined." },
  { catalogId: 388, reason: "Ballistic: the hips drive the bell overhead, the arm guides it and the elbow locks out briefly to catch it, with the load stacked over the joint. That is guiding and timing, not a defined load on the arm." },

  // Untagged, no variant.
  { catalogId: 387, reason: `The hips drive the bell and the arm guides it into the rack at the shoulder; the elbow flexors do not lift it, and the load on them is not defined. ${NOT_COUNTED}` },
  { catalogId: 235, reason: `Body weight is held on straight arms, the triceps keeping the elbows locked with the load running along the arms. Whether it is logged in seconds or in repetitions is still to be decided. ${NOT_COUNTED}` },
  { catalogId: 165, reason: `The bell ${GOBLET} ${NOT_COUNTED}` },
  { catalogId: 352, reason: `The handle ${GOBLET} ${NOT_COUNTED}` },
  { catalogId: 391, reason: `The bell ${GOBLET} Whether the legs work one at a time is for the leg pages to decide first. ${NOT_COUNTED}` },
  { catalogId: 250, reason: `A high-to-low chop, as shown: straight arms pull the handle down across the body. The triceps' long head helps draw the arms down from overhead, but the trunk's turn moves the load, so the load on it is not defined. ${NOT_COUNTED}` },
  { catalogId: 296, reason: SLED_PUSH },
  { catalogId: 298, reason: SLED_PUSH },
];
