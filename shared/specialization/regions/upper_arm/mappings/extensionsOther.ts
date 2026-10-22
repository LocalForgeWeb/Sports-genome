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
 * and the exercises the variants lane left without a variant for this family to list.
 *
 * Each mapping names ONE muscle, ONE joint action, a relationship and a mode, as the forearm's do
 * (05-mappings.md): `direct` (the exercise is built on this muscle's action), `contributing` (it
 * helps move the load), `stabilizer` (it steadies a joint that does not move), `incidental` (it
 * holds the implement while something else is trained); `dynamic` (its joint moves through range)
 * or `isometric` (it holds). One row per muscle and exercise, so a two-joint muscle that does two
 * things in one exercise is credited for the action the exercise is defined by, and its rationale
 * says what else it does.
 *
 * Rules this family keeps (10-multi-region.md §1.2, §8):
 * - the lateral and medial heads of the triceps share every action, so wherever one is mapped the
 *   other is too, with the same action, relationship, mode and status, `allocation: "shared"`;
 * - the long head has its own row, and the arm's position at the shoulder never changes its
 *   relationship: an overhead extension, a pushdown and a kickback all credit it `direct`. Training
 *   studies of overhead against arm-at-side extensions are never used as credit;
 * - no row on the coracobrachialis (an adjacent member: explained, never credited) or on the
 *   forearm's brachioradialis (the forearm credits it);
 * - no credit for the biceps' shoulder flexion as reviewed work (the front raises' rows are drafts);
 * - where the definition leaves the elbow's work open, nothing is credited, and the exercise is
 *   listed with its reason.
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
  headsByArmPosition: {
    sourceId: "aott.triceps_heads",
    locator: "Abstract: Results (each head's activity and modelled force by shoulder elevation)",
    limitation: "Ten adults straightening the elbow at five shoulder angles; short-term activity and force estimated by a computer model from surface EMG. Abstract only. Not growth and never a credit weight.",
  } satisfies MappingSourceRef,
  biceps: action("A50", "Introduction"),
  bicepsKenhub: action("kenhub.biceps_brachii", "Function"),
  bicepsShoulderLoyola: action("loyola.biceps_brachii", "Action: weakly flexes the shoulder"),
  bicepsShoulderNone: {
    sourceId: "pmid.11408907",
    locator: "Abstract: Results and Conclusions",
    limitation: "Contrary evidence: ten shoulders, wire electrodes, the elbow braced straight; no long-head activity was recorded in shoulder movement. Abstract only.",
  } satisfies MappingSourceRef,
  bicepsShoulderLow: {
    sourceId: "pmid.26535304",
    locator: "Abstract: Results",
    limitation: "Thirteen healthy volunteers, surface electrodes; low long-head activity that rose as the arm was raised. Short-term activity, not growth. Abstract only.",
  } satisfies MappingSourceRef,
  bicepsShoulderReview: {
    sourceId: "bmc.long_head_biceps_scoping_review",
    locator: "Abstract: Results",
    limitation: "A scoping review; only the opening of its abstract was seen. It calls the long head's part in raising the arm minimal in healthy shoulders.",
  } satisfies MappingSourceRef,
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
 * The lateral and medial heads, always together: they start on the back of the upper-arm bone, end
 * on the point of the elbow and cross only the elbow, so they share every action and nothing in an
 * ordinary exercise splits their work (upper_arm.triceps_lateral.selectivity.1).
 */
function lateralAndMedial(id: number, work: Work, rationale: string): VariantMapping[] {
  const shared = { ...work, action: a.elbowExtension, allocation: "shared" as const, rationale };
  return [
    mapping(id, m.tricepsLateral, { ...shared, sources: [src.lateralHead, src.triceps] }),
    mapping(id, m.tricepsMedial, { ...shared, sources: [src.medialHead, src.triceps] }),
  ];
}

const SHARED_HEADS = "The lateral and medial heads do this together: both start on the back of the upper-arm bone, end on the point of the elbow and cross only the elbow, so the work is real and nothing here splits it between them (shared).";

// ---------------------------------------------------------------- triceps extensions

/** Where the upper arm is held at the shoulder (the variant's `shoulder` dimension), in the long head's words. */
type ArmPosition = "at_side" | "overhead" | "in_front" | "behind" | "across";

const LONG_HEAD_NOT_WEIGHTED = "The arm's position never changes the long head's credit: it is direct in every elbow extension, overhead or not.";

const longHeadIn: Record<ArmPosition, string> = {
  at_side: `With the arm down by the side, the long head is neither stretched nor slack at the shoulder; in one small study a model driven by surface EMG estimated that it made the most force of the three heads in that position. ${LONG_HEAD_NOT_WEIGHTED}`,
  overhead: `With the arm overhead, the long head, the only head that crosses the shoulder, works at a longer length than in a pushdown. Training studies that compared overhead and arm-at-side extensions are not used to weight credit: ${LONG_HEAD_NOT_WEIGHTED.charAt(0).toLowerCase()}${LONG_HEAD_NOT_WEIGHTED.slice(1)}`,
  in_front: `With the upper arm raised in front, the long head is longer at the shoulder than in a pushdown and shorter than overhead. ${LONG_HEAD_NOT_WEIGHTED}`,
  behind: `The upper arm is held back beside the trunk, where the long head is at its shortest across the shoulder, and it also helps hold the arm back there (shoulder extension, its small second action); that holding is not credited as a second row. ${LONG_HEAD_NOT_WEIGHTED}`,
  across: `Where the upper arm sits at the shoulder is not defined for this exercise, and it would not change the credit. ${LONG_HEAD_NOT_WEIGHTED}`,
};

/** An elbow extension against the load: all three heads direct, dynamic. */
function extension(id: number, position: ArmPosition, what: string, pairNote = ""): VariantMapping[] {
  const work: Work = { relationship: "direct", mode: "dynamic", basis: "anatomy" };
  return [
    mapping(id, m.tricepsLong, {
      ...work,
      action: a.elbowExtension,
      sources: position === "at_side" || position === "overhead" ? [src.longHead, src.triceps, src.headsByArmPosition] : [src.longHead, src.triceps],
      rationale: `${what} is built on straightening the elbow against the load, which all three heads of the triceps do, so the long head is direct. ${longHeadIn[position]}`,
    }),
    ...lateralAndMedial(id, work, `${what} is built on straightening the elbow against the load, so these heads are direct. ${SHARED_HEADS}${pairNote ? ` ${pairNote}` : ""}`),
  ];
}

const PALM_UP = "Turning the palm up changes the hand's hold on the handle, not what the triceps do.";
const ROPE = "The rope lets the hands turn and part at the bottom; the triceps' action is the same.";

// ---------------------------------------------------------------- other work

/** Throws and slams that straighten both elbows to drive the ball: all three heads help move it. */
function throwing(id: number, how: string, basis: MappingEvidenceBasis, longHeadNote: string): VariantMapping[] {
  const work: Work = { relationship: "contributing", mode: "dynamic", basis };
  return [
    mapping(id, m.tricepsLong, { ...work, action: a.elbowExtension, sources: [src.longHead, src.triceps], rationale: `${how} The long head straightens the elbow with the other two heads. ${longHeadNote}` }),
    ...lateralAndMedial(id, work, `${how} ${SHARED_HEADS}`),
  ];
}

const CHEST_PASS = "A chest pass pushes the ball away from the chest by straightening both elbows, so the triceps help move it through range. The chest and the front of the shoulder lead and the trunk adds drive, so the triceps are contributing, not direct. The ball leaves the hands, so there is no lowering phase.";
const OVERHEAD_SLAM = "The ball starts overhead with the elbows bent (as the catalog's photograph of the slam shows) and is driven to the floor as the elbows straighten and the arms come down, so the triceps help move it. The trunk and the back muscles lead, so the triceps are contributing, not direct. The ball leaves the hands, so there is no lowering phase.";
const SLAM_LONG_HEAD = "It also helps bring the arms down (shoulder extension); one row names one action, so that is said here and not credited twice.";

/** The two elbow flexors holding the elbows bent against a bar that sits in their crook. */
function zercher(id: number, relationship: "incidental" | "contributing", rationale: string): VariantMapping[] {
  const work = { action: a.elbowFlexion, relationship, mode: "isometric" as const, basis: "anatomy" as const, rationale };
  return [
    mapping(id, m.biceps, { ...work, sources: [src.biceps, src.bicepsKenhub] }),
    mapping(id, m.brachialis, { ...work, sources: [src.brachialis, src.brachialisTeach] }),
  ];
}

/** Front raises: the biceps' help in raising the arm is disputed, so its row is a draft and counts nothing. */
function frontRaise(id: number, how: string): VariantMapping {
  return mapping(id, m.biceps, {
    action: sh.flexion,
    relationship: "contributing",
    mode: "dynamic",
    basis: "anatomy",
    status: "draft",
    sources: [src.bicepsKenhub, src.bicepsShoulderLoyola, src.bicepsShoulderNone, src.bicepsShoulderLow, src.bicepsShoulderReview],
    rationale: `${how} Raising the arm forward is shoulder flexion, and anatomy references list the biceps as a weak helper there. Whether it helps at all is disputed: with the elbow braced straight, a wire-electrode study of ten shoulders recorded no activity in its long head during shoulder movement, and a scoping review calls its part in raising the arm minimal, while a surface-EMG study found low activity that rose as the arm was raised. A front raise is a straight-arm shoulder flexion, so this is not established and stays pending review: it counts toward nothing. The elbow flexors also hold the nearly straight elbow, but how much depends on how straight it is kept, which is not defined, so that is not credited either. The front of the shoulder lifts the weight; the coracobrachialis, which also raises the arm forward, is explained on this page and never credited.`,
  });
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
  ...extension(157, "in_front", "A machine extension, the upper arms resting on a pad raised in front,"),
  ...extension(160, "in_front", "A bodyweight extension, the head lowered toward the hands on a bar or straps,", "The load is part of the body's weight, leaning in."),
  ...extension(347, "across", "A cross-body extension, the handle drawn across the body,"),
  ...extension(348, "behind", "A kickback"),

  // Front raises: drafts on the biceps (see frontRaise).
  frontRaise(117, "Two dumbbells are raised in front with the elbows nearly straight."),
  frontRaise(118, "One cable handle is raised in front with the elbow nearly straight."),
  frontRaise(119, "One plate, held at its sides in both hands, is raised in front with the elbows nearly straight."),

  // The Zercher lifts: the bar sits in the crook of the elbows; the hands do not hold it.
  ...zercher(164, "incidental", "The bar sits in the crook of both elbows and the hands do not hold it, so the elbow flexors hold the elbows bent against the bar for the whole set while the legs and hips move the load. That is holding the implement while something else is trained (incidental), and isometric, because the elbow does not move: counted apart, never as dynamic work."),
  ...zercher(300, "contributing", "The bar sits in the crook of both elbows for the whole carry and the hands do not grip it, so the elbow flexors hold the elbows bent against it for the time logged. Holding the bar there is part of what the carry trains, so they are contributing, isometric, as the forearm's version read them before the upper arm had one."),

  // Rollouts: the long head helps draw the arms back down; the other two heads keep the elbows straight.
  ...[237, 238].flatMap((id) => [
    mapping(id, m.tricepsLong, {
      action: sh.extension,
      relationship: "contributing",
      mode: "dynamic",
      basis: "anatomy",
      sources: [src.longHeadShoulder, src.longHead, src.tricepsKenhub],
      rationale: "Rolling out lets the arms reach overhead, and drawing them back down to return is shoulder extension against the body's weight. The long head is the one head of the triceps that crosses the shoulder and helps extend it, so it helps move the load through range (contributing); the back muscles lead. It also helps hold the elbow straight with the other two heads; one row names one action, so that is said here and not credited twice.",
    }),
    ...lateralAndMedial(id, { relationship: "stabilizer", mode: "isometric", basis: "inference" }, `The hands push on the ${id === 237 ? "wheel" : "bar"} out in front, and the floor's push on them tends to bend the elbows, so these heads hold the elbows straight without moving them. That is steadying, counted apart and never as dynamic work. ${SHARED_HEADS}`),
  ]),

  // Medicine-ball chest passes, overhead slams and the forward overhead throw.
  ...throwing(271, CHEST_PASS, "anatomy", "The trunk and shoulders lead; it helps, as the other heads do."),
  ...throwing(281, `Kneeling upright. ${CHEST_PASS}`, "anatomy", "The trunk and shoulders lead; it helps, as the other heads do."),
  ...throwing(273, OVERHEAD_SLAM, "anatomy", SLAM_LONG_HEAD),
  ...throwing(284, `An overhead slam, as the catalog's Medicine-Ball Overhead Slam, then a sprawl; only the slam loads the upper arm. ${OVERHEAD_SLAM}`, "inference", SLAM_LONG_HEAD),
  ...throwing(285, `An overhead slam, as the catalog's Medicine-Ball Overhead Slam, then a sprint; only the slam loads the upper arm. ${OVERHEAD_SLAM}`, "inference", SLAM_LONG_HEAD),
  ...throwing(280, "The ball is taken behind the head in both hands, bending the elbows, and thrown forward as they straighten and the arms come forward, so the triceps help drive it. The trunk and the back muscles add drive, so the triceps are contributing, not direct. The ball leaves the hands, so there is no lowering phase.", "inference", "With the arms overhead it works long at the shoulder, as in an overhead extension; that does not change its credit. It also helps bring the arms forward (shoulder extension); one row names one action."),

  // Battle rope slams: the arms drive the ropes down from overhead; the elbows' part is not defined.
  mapping(399, m.tricepsLong, {
    action: sh.extension,
    relationship: "contributing",
    mode: "dynamic",
    basis: "anatomy",
    sources: [src.longHeadShoulder, src.longHead],
    rationale: "Slamming the ropes means raising both rope ends overhead and driving them down, which brings the arms down from overhead: shoulder extension against the ropes. The long head is the one head of the triceps that crosses the shoulder and helps extend it, so it helps move the load through range (contributing); the back muscles and the trunk lead.",
  }),
  ...lateralAndMedial(399, { relationship: "contributing", mode: "dynamic", basis: "inference", status: "draft" }, `The elbows likely bend and straighten as the ropes are raised and slammed, but whether they do, or stay nearly straight while the shoulders work, is not defined for this exercise, so this is not established and stays pending review. ${SHARED_HEADS}`),

  // Turkish get-up: the bell held overhead on a straight arm throughout.
  ...(() => {
    const steady = { relationship: "stabilizer" as const, mode: "isometric" as const, basis: "inference" as const };
    const hold = "The bell is held overhead on a straight arm for the whole get-up while the legs and trunk move the body under it, so the triceps keep the elbow locked without moving it. That is steadying, counted apart and never as dynamic work. The load runs mostly along the straight arm, so how hard they hold depends on how upright the arm stays, which is not measured. Pressing the bell to arm's length before the get-up is set-up, not part of the defined movement.";
    return [
      mapping(390, m.tricepsLong, { ...steady, action: a.elbowExtension, sources: [src.longHead, src.triceps], rationale: hold }),
      ...lateralAndMedial(390, steady, `${hold} ${SHARED_HEADS}`),
    ];
  })(),

  // Lever supination: the forearm's exercise; the upper arm speaks for the biceps.
  mapping(406, m.biceps, {
    action: a.supination,
    relationship: "contributing",
    mode: "dynamic",
    basis: "emg",
    sources: [src.biceps, src.bicepsKenhub, src.supinationByTorque, src.supinationByElbowAngle],
    rationale: "Turning the forearm palm-up against a lever is supination. With the elbow bent, as this exercise defines it (90 degrees), the biceps is a strong supinator and joins the supinator, a forearm muscle, more as the load grows (M5, M6), so it is contributing. The upper arm's version holds no forearm muscle, so the work is not marked as split here; the forearm's version credits the supinator.",
  }),
];

// ---------------------------------------------------------------- left unmapped, with the reason

const NO_VARIANT = "It has no variant yet.";
const MEASURE_OPEN = "Whether it is logged in seconds or in repetitions is still to be decided, so it has no variant yet.";
const NOT_THE_UPPER_ARMS = "not one of the upper arm's actions, and the elbow does not move.";

/**
 * Exercises this family leaves without an upper-arm mapping, each with its reason. The first four
 * tag an upper-arm muscle as a secondary muscle; the rest are untagged rows the variants lane named
 * as loading the upper arm (two with a variant, the others with none), listed so the page can say
 * why a set of them is not counted here. None is primary-tagged, so none would otherwise count in
 * the region's totals.
 */
export const extensionsOtherUnmapped: UnmappedTaggedExercise[] = [
  // Tagged (secondary).
  { catalogId: 279, reason: "The legs and hips drive the ball up and back over the head; the arms stay nearly straight and pass that drive to the ball. The throw is not built on an upper-arm action, and the load on the elbow flexors keeping the elbows straight is not defined." },
  { catalogId: 350, reason: "Wrist extension against a cable. Whether the elbow flexors hold the bent elbow against the cable, or the forearm rests on a support, is not defined, so no upper-arm muscle is credited; the forearm counts the wrist work." },
  { catalogId: 380, reason: "The arms hold the handle straight out in front while the trunk resists the cable's pull to turn. The elbows do not move, and whether the pull loads the triceps or only the shoulder and trunk muscles depends on how the arms are set, which is not defined." },
  { catalogId: 400, reason: "Quick, small alternating waves for time: the shoulders and elbows move through a small range against the ropes' swing, and the load on any one upper-arm action is not defined. The forearm counts the grip." },

  // Untagged, with a variant.
  { catalogId: 283, reason: "Sitting up drives the throw; the arms, held nearly straight, carry the ball forward from overhead. The triceps' long head may help bring the arms forward, but the load on it is not defined." },
  { catalogId: 388, reason: "Ballistic: the hips drive the bell overhead, the arm guides it and the elbow locks out to catch it, with the load stacked over the joint. The elbow work is guiding and a brief lockout whose size depends on timing, not a defined load." },

  // Untagged, no variant: Olympic-style lifts, holds, goblet holds, chops and sleds.
  { catalogId: 387, reason: `The hips drive the bell and the arm guides it into the rack at the shoulder; the elbow flexors do not lift it, and the load on them is not defined. ${NO_VARIANT}` },
  { catalogId: 235, reason: `Body weight is held on straight arms, the triceps keeping the elbows locked with the load running along the arms. ${MEASURE_OPEN}` },
  { catalogId: 246, reason: `A plank on the forearms: they bear the body's weight with the elbows bent and still while the trunk does the work. ${MEASURE_OPEN}` },
  { catalogId: 247, reason: `A side plank on one forearm or hand: the arm props the body without the elbow moving while the trunk does the work. ${MEASURE_OPEN}` },
  { catalogId: 248, reason: `A plank on the forearms with a load on the back: the forearms bear the weight with the elbows bent and still while the trunk does the work. ${MEASURE_OPEN}` },
  { catalogId: 217, reason: `A side plank with the top leg on a bench: the lower arm props the body without the elbow moving while the hips and trunk do the work. ${MEASURE_OPEN}` },
  { catalogId: 165, reason: `The bell is held at the chest with the forearms nearly upright, so its weight runs close to the elbows and the elbow flexors steady it rather than hold it out. Elbow-flexor holding is credited only where the load sits on the elbows (the Zercher lifts). ${NO_VARIANT}` },
  { catalogId: 352, reason: `The handle is held at the chest with the forearms nearly upright, so the elbow flexors steady it rather than hold it out. Elbow-flexor holding is credited only where the load sits on the elbows (the Zercher lifts). ${NO_VARIANT}` },
  { catalogId: 391, reason: `A goblet hold, as in the goblet squat, steadied rather than held out. Whether the legs work one at a time is for the leg pages to decide before a variant is written. ${NO_VARIANT}` },
  { catalogId: 250, reason: `Straight arms pass the trunk's turn to the cable: the shoulders move, but the trunk moves the load, and the elbows hold still. ${NO_VARIANT}` },
  { catalogId: 377, reason: `Straight arms pass the trunk's turn to the cable: the shoulders move, but the trunk moves the load, and the elbows hold still. ${NO_VARIANT}` },
  { catalogId: 378, reason: `Straight arms pass the trunk's turn to the cable: the shoulders move, but the trunk moves the load, and the elbows hold still. ${NO_VARIANT}` },
  { catalogId: 296, reason: `The hands push on the sled's posts while the legs drive; the elbows brace, and how much depends on how the arms are set. ${NO_VARIANT}` },
  { catalogId: 297, reason: `Handles or a harness can be used, and the catalog does not say which; with handles the arms hold the straps while the legs drive, so any load on the elbows depends on that set-up. ${NO_VARIANT}` },
  { catalogId: 298, reason: `The hands push on the sled's posts while the legs drive; the elbows brace, and how much depends on how the arms are set. ${NO_VARIANT}` },

  // Untagged, no variant: shoulder isolation.
  ...[89, 90, 91, 92, 93, 314].map((catalogId) => ({ catalogId, reason: `Draws the arms back and out (horizontal abduction) with the shoulder blades: ${NOT_THE_UPPER_ARMS} ${NO_VARIANT}` })),
  { catalogId: 100, reason: `Pulls a band apart by drawing the arms back and out (horizontal abduction): ${NOT_THE_UPPER_ARMS} ${NO_VARIANT}` },
  ...[94, 95, 96, 315].map((catalogId) => ({ catalogId, reason: `Raises the arms overhead in a Y, moving the shoulder blades: the shoulder muscles lift them, and the elbow does not move. ${NO_VARIANT}` })),
  ...[97, 98].map((catalogId) => ({ catalogId, reason: `Lying face down, draws the arms back and the shoulder blades together: ${NOT_THE_UPPER_ARMS} ${NO_VARIANT}` })),
  { catalogId: 99, reason: `Slides the arms up a wall with no load, moving the shoulder blades: ${NOT_THE_UPPER_ARMS} ${NO_VARIANT}` },
  ...[111, 112, 113, 114, 115, 116].map((catalogId) => ({ catalogId, reason: `Raises the arm out to the side (abduction): ${NOT_THE_UPPER_ARMS} ${NO_VARIANT}` })),
  { catalogId: 316, reason: `Raises the arm between forward and out to the side, in the plane of the shoulder blade; the shoulder muscles lift it, and the elbow does not move. ${NO_VARIANT}` },
  ...[319, 320, 321].map((catalogId) => ({ catalogId, reason: `Turns the upper arm in or out (rotation) with the elbow held bent: ${NOT_THE_UPPER_ARMS} ${NO_VARIANT}` })),
  { catalogId: 334, reason: `Raises the shoulder blades (elevation): ${NOT_THE_UPPER_ARMS} ${NO_VARIANT}` },
];
