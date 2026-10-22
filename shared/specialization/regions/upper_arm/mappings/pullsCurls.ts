import type { ActionId, MappingEvidenceBasis, MappingSourceRef, MuscleMode, NodeId, Relationship, ReviewStatus, UnmappedTaggedExercise, VariantMapping } from "../../../types";
import { variantIdFor } from "../../../ids";
import { forearmActionIds as a, shoulderActionIds as sh } from "../../../actions/ids";
import { UPPER_ARM_MAPPING_VERSION, upperArmMuscleIds as m } from "../ids";

/**
 * The upper arm's mappings for pulls, rows and curls (`upper_arm_mappings_v1`; docs/specialization-
 * atlas/10-multi-region.md §4, §8; the forearm's method, 05-mappings.md). One row per variant and
 * upper-arm muscle, each naming one joint action, a relationship and a muscle mode; no percentage
 * splits and no credit for a load the exercise does not define.
 *
 * The family, derived from the catalog with the coverage rule (every row tagging `biceps`,
 * `brachialis` or `triceps`, primary or secondary, whose movement is a pull or elbow flexion, or
 * whose name says row, pull-up, chin-up, pulldown, pullover or curl): 78 tagged rows, all mapped
 * (`pullsCurlsCatalogIds`). Four untagged rows are mapped too, because the upper arm really is loaded
 * in them: 74 L-Sit Pull-Up (tagged as core work, but the arms do a pull-up), 87 and 88 the face
 * pulls and 335 Cable High Pull (the variants lane wrote variants for these three so this lane could
 * decide them). 79 Scapular Pull-Up is not mapped: the arms stay straight, and its biceps tag was
 * removed by the variants lane's catalog fixes.
 *
 * The judgment calls, each said in the rows' rationales:
 * - **Biceps and brachialis in pulls and rows** (46 variants): the elbows bend under load, so both
 *   are contributing, dynamic elbow flexion; the back is the target, so never direct. The grip does
 *   not change the relationship. The brachialis flexes the elbow in every forearm position (A51,
 *   the forearm's frozen `forearm:brachialis.function`), the reading the forearm gives it in every
 *   curl. The biceps pulls at a mechanical disadvantage with the palms down (the forearm's M1/A4),
 *   but EMG of pulldowns, rows and pull-ups found its activity much the same across grips (Lehman
 *   2004; Dickie 2017), so an underhand grip does not make it the target.
 * - **Curls** (25 variants, the forearm's frozen records): the biceps and brachialis are read
 *   exactly as the forearm's frozen rows read them, so the forearm page's rows for them are
 *   unchanged by the upper arm crediting them (§4.2): palms-up curls and the Zottman curl, both
 *   direct; hammer (palms-in) curls and the reverse curl, brachialis direct and biceps contributing.
 * - **Supination in curls** is never credited. One row per variant and muscle, and the biceps' row
 *   is elbow flexion: a curl holds a fixed grip or turns a dumbbell about its own handle, which loads
 *   the turn hardly at all (the forearm's Zottman rule). The loaded turn is Lever Supination (406),
 *   which is not in this family.
 * - **The triceps long head in pullovers and straight-arm pulldowns**: the one head that crosses the
 *   shoulder, it helps draw the arm down and back (an `assist` node action), so it is contributing,
 *   dynamic shoulder extension there; the lats are the target. In the straight-arm pulldowns the
 *   cable pulls the straight arms toward bending, so the lateral and medial heads hold the elbows
 *   straight: stabilizer, isometric, shared. Lying with a dumbbell, the weight behind the head tends
 *   to straighten the slightly bent elbows rather than bend them, so the two elbow-only heads are not
 *   credited in 24 and 65; the cable pullover's set-up (63) is not defined, so neither are they there.
 *   The machine pullover (64) loads the upper arms through pads, so its long-head row is a draft.
 * - **The long head is not mapped in rows, pulldowns or pull-ups.** Its shoulder extension is real
 *   anatomy, but there the elbow bends under load and the long head, which also straightens the
 *   elbow, would work against the elbow flexors; nothing in hand shows it moving the load, and the
 *   catalog does not tag it.
 * - **Face pulls and the rear-delt row** (87, 88, 318): the rope is drawn to the face with the
 *   elbows wide, and as the hands come in the rope crosses the forearms, so the elbow flexors bend
 *   the elbow against it: contributing, dynamic, from the joint's mechanics (no EMG of the elbow
 *   flexors in a face pull was found). The external-rotation finish of 88 loads the shoulder's
 *   rotators, not the elbow, and is not credited.
 * - **The upright row and the high pull** (317, 335): the forearms hang close to the cable's line,
 *   so the load has little leverage at the elbow; whether the elbow flexors move it or follow the
 *   shoulders is not established, so these rows are drafts, as the forearm's brachioradialis row on
 *   the upright row is.
 * - **Isometric holds at the top of a chin-up**: no catalog row defines one. Chin-ups (67, 71) are
 *   logged in repetitions, so their elbow flexors are credited as dynamic; a pause at the top is part
 *   of the repetitions and is not credited as a deliberate hold. A flexed-arm hang would need its own
 *   catalog row.
 * - **Preacher, incline, spider, Bayesian, drag and high-cable curls**: where the upper arm is held
 *   changes the two-joint biceps' length at the shoulder. The rationale describes it; the credit is
 *   the same as any palms-up curl's. The curls' variant records are the forearm's, frozen without
 *   descriptive dimensions, so the shoulder position is not yet data on them.
 *
 * Sources: the upper arm's anatomy sources (sources/upper_arm.ts), the forearm's A4, A50 and A51,
 * and four muscle-activity studies added for these rows (sources/upper_arm-pullsCurls.ts).
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "Gives the muscle's action, not how much this exercise loads it. Seen through web-search excerpts, not the full text.";

const src = {
  bicepsAction: { sourceId: "A50", locator: "Introduction: elbow flexion and supination", limitation: ACTION_ONLY } as MappingSourceRef,
  bicepsKenhub: { sourceId: "kenhub.biceps_brachii", locator: "Function: flexion and supination of the forearm at the elbow", limitation: ACTION_ONLY } as MappingSourceRef,
  bicepsTwoJoint: { sourceId: "kenhub.biceps_brachii", locator: "Function: the shoulder-blade origin lets it act at the shoulder and the elbow", limitation: "The muscle's attachments and actions; it says nothing about any exercise's set-up, and nothing about growth. Seen through web-search excerpts." } as MappingSourceRef,
  brachialisAction: { sourceId: "A51", locator: "Introduction: flexes the elbow in every forearm position; a pure flexor", limitation: ACTION_ONLY } as MappingSourceRef,
  brachialisTeach: { sourceId: "teachmeanatomy.brachialis", locator: "Function: flexes the elbow", limitation: ACTION_ONLY } as MappingSourceRef,
  curlGrips: { sourceId: "mdpi.biceps_curl_grips", locator: "Abstract: Results (biceps excitation by handgrip, lifting and lowering)", limitation: "Ten competitive bodybuilders, curls at an eight-repetition maximum, surface EMG: short-term activity, not growth and not a credit weight. Abstract only." } as MappingSourceRef,
  slowBends: { sourceId: "A4", locator: "Abstract: Results (biceps activity by hand position)", limitation: "16 adults, slow single elbow bends with a light load, surface EMG: short-term activity, not growth. Abstract only." } as MappingSourceRef,
  pulldownRow: { sourceId: "bmc.pulldown_row_grips", locator: "Abstract: Results (biceps brachii activity by exercise)", limitation: "Wide- and reverse-grip pulldowns and seated rows, each held still for 10 seconds within the movement, surface EMG: shows the biceps working in such pulls whatever the grip, not how much any one exercise loads it, and not growth. Abstract only." } as MappingSourceRef,
  pullUps: { sourceId: "jelekin.pull_up_grips", locator: "Abstract: Results and Conclusions (activation by hand orientation and phase)", limitation: "Pull-ups only, 19 trained men, surface EMG; the biceps values for each grip were not seen. Short-term activity, not growth. Abstract only." } as MappingSourceRef,
  longHead: { sourceId: "statpearls.triceps", locator: "Structure and Function: the long head's small action at the shoulder", limitation: "Gives the long head's actions, not how much this exercise loads it. Seen through web-search excerpts." } as MappingSourceRef,
  longHeadImaios: { sourceId: "imaios.triceps_long_head", locator: "Function: elbow extension and shoulder extension", limitation: "Seen through the imaios.cn mirror; gives the action, not exercise loading." } as MappingSourceRef,
  longHeadKenhub: { sourceId: "kenhub.triceps_brachii", locator: "Function: the long head contributes to extension of the arm at the shoulder", limitation: ACTION_ONLY } as MappingSourceRef,
  tricepsMain: { sourceId: "statpearls.triceps", locator: "Introduction: elbow extension is the main function", limitation: ACTION_ONLY } as MappingSourceRef,
  lateralAction: { sourceId: "elsevier.triceps_lateral_head", locator: "Quick Facts: Action (extends the forearm at the elbow)", limitation: ACTION_ONLY } as MappingSourceRef,
  medialAction: { sourceId: "elsevier.triceps_medial_head", locator: "Quick Facts: Action (extends the forearm at the elbow)", limitation: "Gives the action, not exercise loading. The search summary reported its own citation markers as partly garbled; the facts matched IMAIOS." } as MappingSourceRef,
  pulloverDumbbell: { sourceId: "scielo.pullover_bar_dumbbell", locator: "Abstract: Results (activation of seven muscles, bar against dumbbell)", limitation: "Eleven trained men, surface EMG; the long head was among the muscles recorded, but how active it was was not shown in the abstract. Short-term activity, not growth." } as MappingSourceRef,
  straightArm: { sourceId: "mdpi.pullover_straight_arm_pulldown", locator: "Abstract: Results (latissimus dorsi and triceps brachii by exercise)", limitation: "20 active adults, surface EMG; which triceps head was recorded was not named in the excerpts. Short-term activity, not growth. Abstract only." } as MappingSourceRef,
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
  // Only grip mappings can need bare hands (10-multi-region.md §4.1); none of these is a grip.
  requiresNoStraps: false,
  rationale: spec.rationale,
  reviewStatus: spec.status ?? "reviewed",
  sources: spec.sources,
  // The arms are never `not_applicable` here: each muscle works on the side of the arm that pulls or curls.
  sideRelation: "same",
});

// ---------------------------------------------------------------- the family, by catalog id

/**
 * Every catalog exercise this family maps, grouped as the rows read them. The grips are the
 * variants' own `forearmOrientation` (client/src/lib/specialization/upper_armMappings.pullsCurls.test.ts
 * holds each group to its variants).
 */
export const pullsCurlsCatalogIds = {
  /** Curls, palms up: biceps and brachialis direct. */
  supinatedCurls: [121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 137, 138, 336, 338, 339, 340, 341],
  /** Hammer-style curls, palms in: brachialis direct, biceps contributing. */
  neutralCurls: [132, 133, 134, 337, 342],
  /** The reverse curl, palms down: brachialis direct, biceps contributing. */
  pronatedCurls: [135],
  /** The Zottman curl: lifted palms up, lowered palms down; both direct. */
  zottmanCurls: [136],
  /** Rows, pulldowns, pull-ups and chin-ups, where the elbows bend under load, by grip. */
  elbowPulls: {
    supinated: [45, 60, 67, 71],
    neutral: [46, 50, 54, 56, 59, 68, 72, 78, 80, 258, 326, 331, 332],
    pronated: [43, 44, 49, 55, 57, 58, 66, 69, 70, 73, 74, 75, 76, 257, 327],
    unknown: [47, 48, 51, 52, 53, 61, 77, 256, 329, 330, 333, 379, 383, 384],
  },
  /** A rope drawn to the face with the elbows wide. */
  facePulls: [87, 88, 318],
  /** Pulls up the front of the body; the elbow flexors' rows are drafts. */
  uprightPulls: [317, 335],
  /** Straight-arm shoulder extension: the long head contributes; lying or set-up undefined, no elbow-only head. */
  pullovers: [24, 63, 64, 65],
  /** Straight-arm shoulder extension against a high cable: the long head contributes, the other two heads hold the elbow. */
  straightArmPulldowns: [62, 328],
} as const;

/** The untagged rows this family maps because the upper arm is really loaded in them (the coverage rule asks only for the tagged ones). */
export const pullsCurlsUntaggedMapped = [74, 87, 88, 335] as const;

// ---------------------------------------------------------------- curls

const SHOULDER_TAIL = "That describes the set-up; it earns no extra credit, and the mapping is the same as any palms-up curl's.";
const BEHIND = `The biceps also crosses the shoulder, so this holds it longer at the shoulder than a standing curl does. ${SHOULDER_TAIL}`;
const IN_FRONT = `The biceps also crosses the shoulder, so this holds it shorter at the shoulder than a standing curl does. ${SHOULDER_TAIL}`;
const BRACHIALIS_ONE_JOINT = "The brachialis does not cross the shoulder, so where the upper arm is held does not change its length.";

/** Where a curl holds the upper arm, said for the two-joint biceps (and, for the brachialis, that it does not matter). Descriptive only. */
const curlShoulder: Record<number, string> = {
  125: `Seated back on an incline, the upper arms hang behind the body. ${BEHIND}`,
  338: `Back on an incline with the cable behind, the upper arms are drawn behind the body. ${BEHIND}`,
  129: `Facing away from the low pulley, the arm is drawn behind the body. ${BEHIND}`,
  137: `The elbows travel back as the bar is dragged up the body, so the upper arms move behind it. ${BEHIND}`,
  126: `The upper arms rest on a pad in front of the body. ${IN_FRONT}`,
  127: `The upper arms rest on a pad in front of the body. ${IN_FRONT}`,
  130: `Chest on an incline bench, the arms hang straight down in front of the body. ${IN_FRONT}`,
  341: `Chest on an incline bench, the arms hang straight down in front of the body. ${IN_FRONT}`,
  131: `The working upper arm hangs in front of the body with the elbow braced. ${IN_FRONT}`,
  340: `The working upper arm hangs in front of the body with the elbow braced. ${IN_FRONT}`,
  339: `The arms are held out to the sides at about shoulder height between two high pulleys. The biceps also crosses the shoulder, so the arm's position changes its length there. ${SHOULDER_TAIL}`,
};

const withShoulder = (id: number, text: string, node: "biceps" | "brachialis") => {
  const note = curlShoulder[id];
  if (!note) return text;
  return `${text} ${node === "biceps" ? note : BRACHIALIS_ONE_JOINT}`;
};

const NO_SUPINATION = "The biceps also turns the palm up, but the hand holds a fixed palms-up grip and the curl puts no load on that turn, so supination is not credited.";
const CURL_BRACHIALIS = "The brachialis flexes the elbow whatever the forearm's rotation and does not turn it, so every curl works it directly: direct, dynamic.";

const curlBrachialis = (id: number) =>
  mapping(id, m.brachialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.brachialisAction, src.brachialisTeach], rationale: withShoulder(id, CURL_BRACHIALIS, "brachialis") });

function supinatedCurl(id: number): VariantMapping[] {
  const bodyWeight = id === 138 ? " Here the hands hold the body's weight on a bar and the elbows bend through the curl." : "";
  return [
    mapping(id, m.biceps, {
      action: a.elbowFlexion,
      relationship: "direct",
      mode: "dynamic",
      basis: "anatomy",
      sources: [src.bicepsAction, src.bicepsKenhub, src.curlGrips, ...(curlShoulder[id] ? [src.bicepsTwoJoint] : [])],
      rationale: withShoulder(id, `A palms-up curl is built on elbow flexion with the forearm turned palm up, the position in which the biceps flexes the elbow best: direct, dynamic.${bodyWeight} ${NO_SUPINATION}`, "biceps"),
    }),
    curlBrachialis(id),
  ];
}

function neutralCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.biceps, {
      action: a.elbowFlexion,
      relationship: "contributing",
      mode: "dynamic",
      basis: "inference",
      sources: [src.bicepsAction, src.curlGrips, src.slowBends],
      rationale:
        "The biceps still flexes the elbow with the palms facing in, but this curl is chosen for the brachialis and the forearm's brachioradialis, so the biceps is contributing, dynamic, as the forearm atlas first read it. Whether the palms' direction changes how hard the biceps works is not settled: one muscle-activity study of bodybuilders found it more active palms up than palms in while lifting, and another, of slow single elbow bends, found no change. Supination is not credited: the palms stay facing in.",
    }),
    curlBrachialis(id),
  ];
}

function pronatedCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.biceps, {
      action: a.elbowFlexion,
      relationship: "contributing",
      mode: "dynamic",
      basis: "emg",
      sources: [src.bicepsAction, src.curlGrips, src.slowBends],
      rationale:
        "With the palms down the biceps flexes the elbow at a mechanical disadvantage, and one muscle-activity study of bodybuilders found it less active than with the palms up while lifting, so in the reverse curl it is contributing, dynamic; the brachialis and the forearm's brachioradialis are the targets. A second study, of slow single elbow bends, found no change with the palms' direction, so this reads the exercise's purpose as much as a measured difference. The forearm atlas first read it the same way.",
    }),
    curlBrachialis(id),
  ];
}

function zottmanCurl(id: number): VariantMapping[] {
  return [
    mapping(id, m.biceps, {
      action: a.elbowFlexion,
      relationship: "direct",
      mode: "dynamic",
      basis: "anatomy",
      sources: [src.bicepsAction, src.bicepsKenhub],
      rationale:
        "Each rep is lifted with the palms up, the biceps' best position for flexing the elbow, so it is direct, dynamic, as the forearm atlas first read it. The turn to palms down at the top is not credited as supination (it is the opposite turn), and a dumbbell turned about its own handle gives little resistance to any turn.",
    }),
    curlBrachialis(id),
  ];
}

// ---------------------------------------------------------------- rows, pulldowns, pull-ups and chin-ups

type PullGrip = keyof typeof pullsCurlsCatalogIds.elbowPulls;

const PULL_BICEPS =
  "In a row, pulldown or pull-up the elbows bend under load while the back muscles draw the arms down or back, and the biceps is an elbow flexor, so it helps move the load through range: contributing, dynamic. The back is the target, so it is never direct here.";
const PULL_BICEPS_GRIP: Record<PullGrip, string> = {
  supinated: "With the palms up the biceps flexes the elbow from its best position, yet muscle-activity studies of pulldowns, rows and pull-ups found its activity much the same whichever way the palms faced, so an underhand grip does not make it the target.",
  neutral: "With the palms facing in it still flexes the elbow fully, and muscle-activity studies of pulldowns, rows and pull-ups found its activity much the same across grips.",
  pronated: "With the palms down it pulls at a mechanical disadvantage but still flexes the elbow, and muscle-activity studies of pulldowns, rows and pull-ups found its activity much the same across grips.",
  unknown: "The grip is not fixed for this exercise; the biceps flexes the elbow in any of them, and muscle-activity studies of pulldowns, rows and pull-ups found its activity much the same across grips.",
};
const PULL_BRACHIALIS =
  "The brachialis flexes the elbow whatever the forearm's rotation, so it helps move the load through range in every row, pulldown and pull-up, palms up, in or down alike: contributing, dynamic. The back is the target, so it is never direct here. This is how the forearm atlas first read the brachialis in every curl, applied to pulls.";

/** What a few pulls add to the family's words. */
const pullNote: Record<number, string> = {
  73: "One arm does most of the pull while the other stays nearly straight; both arms count together.",
  74: "The catalog tags the L-sit pull-up as core work, but the arms do a pull-up's elbow work, so it is credited as one.",
  80: "Hand over hand up the rope, each arm draws the body up as its elbow bends.",
  379: "The trunk turns with the pull, and the elbow still bends against the handle.",
};
const withNote = (id: number, text: string) => (pullNote[id] ? `${text} ${pullNote[id]}` : text);

function elbowPull(id: number, grip: PullGrip): VariantMapping[] {
  return [
    mapping(id, m.biceps, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.bicepsAction, src.pulldownRow, src.pullUps], rationale: withNote(id, `${PULL_BICEPS} ${PULL_BICEPS_GRIP[grip]}`) }),
    mapping(id, m.brachialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.brachialisAction, src.brachialisTeach], rationale: withNote(id, PULL_BRACHIALIS) }),
  ];
}

// ---------------------------------------------------------------- face pulls and the rear-delt row

const FACE_PULL =
  "The rope is drawn from arm's length to the face, so the elbows bend from nearly straight to fully bent while the rope pulls the hands away; with the elbows out wide the rope crosses the forearms as the hands come in, so the elbow flexors have to bend the elbow against it.";
const FACE_PULL_LIMIT = "The back of the shoulder and the upper back are the target and the load is light, so it is never direct. No muscle-activity study of the elbow flexors in this exercise was found: this rests on how the joint is loaded.";
const FACE_PULL_TURN = " The turn of the upper arms at the end works the shoulder's rotators, not the elbow, and is not credited here.";

function facePull(id: number): VariantMapping[] {
  const turn = id === 88 ? FACE_PULL_TURN : "";
  return [
    mapping(id, m.biceps, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "inference", sources: [src.bicepsAction], rationale: `${FACE_PULL} The biceps is an elbow flexor: contributing, dynamic. ${FACE_PULL_LIMIT}${turn}` }),
    mapping(id, m.brachialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "inference", sources: [src.brachialisAction], rationale: `${FACE_PULL} The brachialis flexes the elbow whatever the forearm's rotation: contributing, dynamic. ${FACE_PULL_LIMIT}${turn}` }),
  ];
}

// ---------------------------------------------------------------- the upright row and the high pull (drafts)

const UPRIGHT =
  "The elbows bend as the handle rises up the front of the body, but the forearms hang close to the line of the cable, so the load has little leverage at the elbow and the elbows bend mostly because the upper arms rise. Whether the elbow flexors move a real share of the load or mostly follow the shoulders is not established, so this stays pending review, as the forearm atlas's reading of the brachioradialis in the upright row does.";

function uprightPull(id: number): VariantMapping[] {
  const hips = id === 335 ? " In the high pull the hips help drive the cable as well." : "";
  const draft = { action: a.elbowFlexion, relationship: "contributing" as const, mode: "dynamic" as const, basis: "inference" as const, status: "draft" as const, rationale: `${UPRIGHT}${hips}` };
  return [
    mapping(id, m.biceps, { ...draft, sources: [src.bicepsAction] }),
    mapping(id, m.brachialis, { ...draft, sources: [src.brachialisAction] }),
  ];
}

// ---------------------------------------------------------------- pullovers and straight-arm pulldowns

const LONG_HEAD = "The long head is the one triceps head that crosses the shoulder, and it helps draw the arm down and back (shoulder extension).";
const longHeadSources = [src.longHead, src.longHeadImaios, src.longHeadKenhub];

const pulloverWhy: Record<number, string> = {
  24: "Lying with a dumbbell, the weight behind the head tends to straighten the slightly bent elbows rather than bend them, so the other two heads, which cross only the elbow, are not credited.",
  65: "Lying with a dumbbell, the weight behind the head tends to straighten the slightly bent elbows rather than bend them, so the other two heads, which cross only the elbow, are not credited.",
  63: "The catalog does not say lying or standing, and whether the cable bends the elbows against the other two heads depends on that set-up, so they are not credited.",
};

function pullover(id: number): VariantMapping[] {
  if (id === 64) {
    return [
      mapping(id, m.tricepsLong, {
        action: sh.extension,
        relationship: "contributing",
        mode: "dynamic",
        basis: "inference",
        status: "draft",
        sources: longHeadSources,
        rationale: `Pullover machines move the upper arms through pads above the elbows, so the elbows carry no load. ${LONG_HEAD} It would also straighten the unloaded elbow as it pulled, so whether it takes a real part in the shoulder extension here is not established, and this stays pending review.`,
      }),
    ];
  }
  const study = id === 63 ? [] : [src.pulloverDumbbell];
  return [
    mapping(id, m.tricepsLong, {
      action: sh.extension,
      relationship: "contributing",
      mode: "dynamic",
      basis: "anatomy",
      sources: [...longHeadSources, ...study],
      rationale: `${LONG_HEAD} In a pullover the arms sweep from behind the head toward the body against the load with the elbows nearly straight, so it helps move the load through range: contributing, dynamic. The lats are the target and the long head's shoulder action is small beside theirs, so it is never direct. ${pulloverWhy[id]}`,
    }),
  ];
}

const STRAIGHT_ARM_HOLD =
  "The cable pulls the straight arms toward bending at the elbow, up toward the pulley, so the triceps hold the elbows straight for the whole set without them moving: isometric steadying, never dynamic credit. The lateral and medial heads share every action and nothing in this exercise splits the work between them, so it is shared. In one study the triceps was more active in the straight-arm pulldown than in the barbell pullover; which head was recorded was not stated in what could be read.";

function straightArmPulldown(id: number): VariantMapping[] {
  const hold = { action: a.elbowExtension, relationship: "stabilizer" as const, mode: "isometric" as const, basis: "inference" as const, allocation: "shared" as const, rationale: STRAIGHT_ARM_HOLD };
  return [
    mapping(id, m.tricepsLong, {
      action: sh.extension,
      relationship: "contributing",
      mode: "dynamic",
      basis: "anatomy",
      sources: [...longHeadSources, src.straightArm],
      rationale: `${LONG_HEAD} The straight arms sweep down from in front of the body to the thighs against the cable, so it helps move the load through range: contributing, dynamic. The lats are the target, so it is never direct. In one study the triceps was more active in the straight-arm pulldown than in the barbell pullover. The long head also helps hold the elbow straight, as the other two heads do; its moving shoulder work is the part credited.`,
    }),
    mapping(id, m.tricepsLateral, { ...hold, sources: [src.lateralAction, src.tricepsMain, src.straightArm] }),
    mapping(id, m.tricepsMedial, { ...hold, sources: [src.medialAction, src.tricepsMain, src.straightArm] }),
  ];
}

// ---------------------------------------------------------------- the family's rows

const ids = pullsCurlsCatalogIds;

export const pullsCurlsMappings: VariantMapping[] = [
  // Curls: the forearm's frozen readings of the biceps and brachialis.
  ...ids.supinatedCurls.flatMap(supinatedCurl),
  ...ids.neutralCurls.flatMap(neutralCurl),
  ...ids.pronatedCurls.flatMap(pronatedCurl),
  ...ids.zottmanCurls.flatMap(zottmanCurl),

  // Rows, pulldowns, pull-ups and chin-ups.
  ...(Object.keys(ids.elbowPulls) as PullGrip[]).flatMap((grip) => ids.elbowPulls[grip].flatMap((id) => elbowPull(id, grip))),

  // Face pulls and the rear-delt row.
  ...ids.facePulls.flatMap(facePull),

  // The upright row and the high pull: drafts.
  ...ids.uprightPulls.flatMap(uprightPull),

  // Straight-arm shoulder extension.
  ...ids.pullovers.flatMap(pullover),
  ...ids.straightArmPulldowns.flatMap(straightArmPulldown),
];

/**
 * Tagged rows of this family left unmapped on purpose, each with its reason. None: every one of the
 * 78 has at least a draft row (the machine pullover's long head, the upright row's elbow flexors).
 */
export const pullsCurlsUnmapped: UnmappedTaggedExercise[] = [];
