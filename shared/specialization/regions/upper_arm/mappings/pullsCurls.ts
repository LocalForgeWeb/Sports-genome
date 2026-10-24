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
 * whose name says row, pull-up, chin-up, pulldown, pullover, face pull, high pull or curl): 79 tagged
 * rows, all mapped (`pullsCurlsCatalogIds`), among them 74 L-Sit Pull-Up (listed as core work, but the
 * arms do a pull-up; the variants lane's catalog fix tags it biceps). Three untagged rows are mapped
 * too, because the upper arm really is loaded in them: 87 and 88 the face pulls and 335 Cable High
 * Pull (the variants lane wrote variants for these three so this lane could decide them). 79 Scapular Pull-Up is not mapped: the arms stay straight, and its biceps
 * tag was removed by the variants lane's catalog fixes.
 *
 * The judgment calls, each said in the rows' rationales:
 * - **Biceps and brachialis in pulls and rows** (46 variants): the elbows bend under load, so both
 *   are contributing, dynamic elbow flexion; the catalog defines each as back work, so never direct.
 *   The grip does not change the relationship. The brachialis flexes the elbow in every forearm
 *   position (A51, the forearm's frozen `forearm:brachialis.function`), the reading the forearm gives
 *   it in every curl. The biceps pulls at a mechanical disadvantage with the palms down (A4, Kleiber
 *   2015, which the forearm also files as M1). On grip the evidence is mixed: Lehman 2004 found its
 *   activity unchanged between a palms-down and a palms-up pulldown (its rows varied shoulder-blade
 *   retraction, not grip), Dickie 2017 found activation similar across pull-up grips, and Youdas 2010
 *   is reported second-hand, with conflicting accounts, to have found more in the chin-up than the
 *   pull-up. The basis is `anatomy` on all 46, the palms-up pulls included: what each row rests on is
 *   that the elbow flexes under load; the "not direct" call is the exercise's definition as back
 *   work, not an EMG reading, and the EMG sentences are context.
 * - **Curls** (25 variants, the forearm's frozen records): the biceps and brachialis rows match the
 *   forearm's frozen rows in action, relationship, mode, basis, allocation and status, so the forearm
 *   page's rows and labels for them are unchanged by the upper arm crediting them (§4.2): palms-up
 *   curls and the Zottman curl, both direct; hammer (palms-in) curls and the reverse curl, brachialis
 *   direct and biceps contributing. The rationale and source text differ on all 50 rows (the upper
 *   arm's own words and sources), which §4.2 allows.
 * - **Supination in curls** is never credited. One row per variant and muscle, and the biceps' row
 *   is elbow flexion: a curl holds a fixed grip or turns a dumbbell about its own handle, which loads
 *   the turn hardly at all (the forearm's Zottman rule). The loaded turn is Lever Supination (406),
 *   which is not in this family.
 * - **The triceps in pullovers and straight-arm pulldowns** (24, 63, 65, 62, 328): the long head, the
 *   one head that crosses the shoulder, helps draw the arm down and back (an `assist` node action), so
 *   it is contributing, dynamic shoulder extension; the lats are the target. The load tends to bend
 *   the nearly straight elbows: lying supine with the arms overhead, bending the elbow lowers the hand
 *   toward the floor, so a dumbbell pulls the elbows into bending; a cable pulls the hands across the
 *   line of the arms whether lying or standing. So the lateral and medial heads hold the elbows
 *   straight: stabilizer, isometric, shared. The machine pullover's record (64) says only that the
 *   arms move one lever in an arc with the elbows nearly straight, not where the lever meets the arms,
 *   so its long-head row is a draft and the elbow-only heads are not credited.
 * - **The long head on vertical pulls with the palms in or up** (59, 60, 67, 68, 71, 72, 78, 80, 326):
 *   draft rows, contributing, dynamic shoulder extension, pending review. These pulls bring the arms
 *   down in front of the body, which is the long head's shoulder movement, and two-joint muscles
 *   routinely work alongside their opposites; Signorile 2002 recorded the long head in four
 *   lat-pulldown grips (values not seen). But the elbow flexes under load at the same time and the
 *   long head also straightens the elbow, so its net work in the pull is unclear. Not on rows (no
 *   source in hand records it in a row), nor on wide or palms-down pulls, which bring the arms down
 *   from the side (mostly adduction, not an upper-arm action).
 * - **Face pulls and the rear-delt row** (87, 88, 318): the elbows sit out wide of the rope's line,
 *   so the rope pulls the hands away from the shoulders and the elbow flexors bend the elbows against
 *   it: contributing, dynamic, basis `inference` (from that geometry; no EMG of the elbow flexors in a
 *   face pull was found). 333 Cable High Row is read as a row (basis `anatomy`): its handle is drawn
 *   down and back to the trunk, the elbows travelling back past it, as in every row, while 318 is a
 *   rope drawn to the face with the elbows out wide, which only that geometry argument covers. The
 *   external-rotation finish of 88 loads the shoulder's rotators, not the elbow, and is not credited.
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
 * **Not credited here, for the method note:** the forearm's brachioradialis also flexes the elbow
 * in 326, 329, 330 and 333 (rows that had no variant before wave A) and in the face pulls 87, 88 and
 * 318, but frozen `forearm_mappings_v1` has no row for it there, and this version maps only the upper
 * arm's own muscles (§4.1). The upper-arm page shows the brachioradialis as the forearm credits it,
 * so on these exercises it reads as not loaded until `forearm_mappings_v2` adds those rows.
 *
 * Sources: the upper arm's anatomy sources (sources/upper_arm.ts), the forearm's A4, A50 and A51,
 * and six muscle-activity studies added for these rows (sources/upper_arm-pullsCurls.ts).
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "Gives the muscle's action, not how much this exercise loads it. Seen through web-search excerpts, not the full text.";

const src = {
  bicepsAction: { sourceId: "A50", locator: "Introduction: elbow flexion and supination", limitation: ACTION_ONLY } as MappingSourceRef,
  bicepsKenhub: { sourceId: "kenhub.biceps_brachii", locator: "Function: flexion and supination of the forearm at the elbow", limitation: ACTION_ONLY } as MappingSourceRef,
  /**
   * Kenhub cited for both the elbow action and the shoulder-blade origin, in one citation: the database keeps one citation per
   * source on a mapping (integration, 23 Oct 2026; the two had been cited apart on the curls that say where the arm is held).
   */
  bicepsKenhubTwoJoint: { sourceId: "kenhub.biceps_brachii", locator: "Function: flexion and supination of the forearm at the elbow; the shoulder-blade origin lets it act at the shoulder and the elbow", limitation: "The muscle's attachments and actions, not how much this exercise loads it; it says nothing about any exercise's set-up, and nothing about growth. Seen through web-search excerpts, not the full text." } as MappingSourceRef,
  brachialisAction: { sourceId: "A51", locator: "Introduction: flexes the elbow in every forearm position; a pure flexor", limitation: ACTION_ONLY } as MappingSourceRef,
  brachialisTeach: { sourceId: "teachmeanatomy.brachialis", locator: "Function: flexes the elbow", limitation: ACTION_ONLY } as MappingSourceRef,
  curlGrips: { sourceId: "mdpi.biceps_curl_grips", locator: "Abstract: Results (biceps excitation by handgrip, lifting and lowering)", limitation: "Ten competitive bodybuilders, curls at an eight-repetition maximum, surface EMG: short-term activity, not growth and not a credit weight. Abstract only." } as MappingSourceRef,
  slowBends: { sourceId: "A4", locator: "Abstract: Results (biceps activity by hand position)", limitation: "16 adults, slow single elbow bends with a light load, surface EMG: short-term activity, not growth. Abstract only." } as MappingSourceRef,
  pulldownRow: { sourceId: "bmc.pulldown_row_grips", locator: "Abstract: Results (biceps brachii activity by exercise)", limitation: "Compared grips only in the pulldowns (one wide and palms down, one palms up); its seated rows varied shoulder-blade retraction, not grip. Each held still for 10 seconds within the movement, surface EMG: short-term activity, not growth. Abstract only." } as MappingSourceRef,
  pullUps: { sourceId: "jelekin.pull_up_grips", locator: "Abstract: Results and Conclusions (activation by hand orientation and phase)", limitation: "Pull-ups only, 19 trained men, surface EMG; the biceps values for each grip were not seen, only that activation was similar across hand orientations. Short-term activity, not growth. Abstract only." } as MappingSourceRef,
  chinUps: { sourceId: "jscr.pull_up_chin_up", locator: "Results as reported by citing papers (biceps brachii, chin-up against pull-up)", limitation: "The abstract was not seen; citing papers disagree on whether it found more biceps activity in the chin-up or no difference. Cited only to say the evidence on grip is mixed. Short-term activity, not growth." } as MappingSourceRef,
  longHead: { sourceId: "statpearls.triceps", locator: "Structure and Function: the long head's small action at the shoulder", limitation: "Gives the long head's actions, not how much this exercise loads it. Seen through web-search excerpts." } as MappingSourceRef,
  longHeadImaios: { sourceId: "imaios.triceps_long_head", locator: "Function: elbow extension and shoulder extension", limitation: "Seen through the imaios.cn mirror; gives the action, not exercise loading." } as MappingSourceRef,
  longHeadKenhub: { sourceId: "kenhub.triceps_brachii", locator: "Function: the long head contributes to extension of the arm at the shoulder", limitation: ACTION_ONLY } as MappingSourceRef,
  longHeadPulldown: { sourceId: "pmid.12423182", locator: "Abstract: Methods (muscles recorded, the long head of the triceps among them)", limitation: "Lat pulldowns in four grips, ten men, surface EMG; the long head's values were not seen, only that it was recorded. Pull-ups were not studied. Short-term activity, not growth. Abstract only." } as MappingSourceRef,
  tricepsMain: { sourceId: "statpearls.triceps", locator: "Introduction: elbow extension is the main function", limitation: ACTION_ONLY } as MappingSourceRef,
  lateralAction: { sourceId: "elsevier.triceps_lateral_head", locator: "Quick Facts: Action (extends the forearm at the elbow)", limitation: ACTION_ONLY } as MappingSourceRef,
  medialAction: { sourceId: "elsevier.triceps_medial_head", locator: "Quick Facts: Action (extends the forearm at the elbow)", limitation: "Gives the action, not exercise loading. The search summary reported its own citation markers as partly garbled; the facts matched IMAIOS." } as MappingSourceRef,
  pulloverDumbbell: { sourceId: "scielo.pullover_bar_dumbbell", locator: "Abstract: Results (activation of seven muscles, bar against dumbbell)", limitation: "Eleven trained men, surface EMG; the long head was among the muscles recorded, but how active it was was not shown in the abstract. Short-term activity, not growth." } as MappingSourceRef,
  straightArm: { sourceId: "mdpi.pullover_straight_arm_pulldown", locator: "Abstract: Results (latissimus dorsi and triceps brachii by exercise)", limitation: "20 active adults, a lying barbell pullover and a straight-arm pulldown, surface EMG; which triceps head was recorded was not named in the excerpts. Short-term activity, not growth. Abstract only." } as MappingSourceRef,
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
 * variants' own `forearmOrientation`, and each other group is tied to its variants' records
 * (client/src/lib/specialization/upper_armMappings.pullsCurls.test.ts).
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
  /** Vertical pulls with the palms in or up: the arms come down in front of the body, so the long head gets a draft row. */
  frontToBackPulls: [59, 60, 67, 68, 71, 72, 78, 80, 326],
  /** A rope drawn to the face with the elbows wide. */
  facePulls: [87, 88, 318],
  /** Pulls up the front of the body; the elbow flexors' rows are drafts. */
  uprightPulls: [317, 335],
  /** Straight-arm shoulder extension: the long head contributes, the other two heads hold the elbow (the machine's rows aside). */
  pullovers: [24, 63, 64, 65],
  /** Straight-arm shoulder extension against a high cable: the long head contributes, the other two heads hold the elbow. */
  straightArmPulldowns: [62, 328],
} as const;

/** The untagged rows this family maps because the upper arm is really loaded in them (the coverage rule asks only for the tagged ones). */
export const pullsCurlsUntaggedMapped = [87, 88, 335] as const;

// ---------------------------------------------------------------- curls

const SHOULDER_TAIL = "that describes the set-up and earns no extra credit.";
const BEHIND = `The biceps also crosses the shoulder, so this holds it longer there than a standing curl does; ${SHOULDER_TAIL}`;
const IN_FRONT = `The biceps also crosses the shoulder, so this holds it shorter there than a standing curl does; ${SHOULDER_TAIL}`;
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
  339: `The arms are held out wide at about shoulder height between two high pulleys. The biceps also crosses the shoulder, so the arm's position changes its length there; ${SHOULDER_TAIL}`,
};

const withShoulder = (id: number, text: string, node: "biceps" | "brachialis") => {
  const note = curlShoulder[id];
  if (!note) return text;
  return `${text} ${node === "biceps" ? note : BRACHIALIS_ONE_JOINT}`;
};

const NO_SUPINATION = "Supination is not credited: the grip is fixed and the curl puts no load on the turn.";
const CURL_BRACHIALIS = "The brachialis flexes the elbow whatever the forearm's rotation and does not turn it, so every curl works it directly: direct, dynamic.";

const curlBrachialis = (id: number) =>
  mapping(id, m.brachialis, { action: a.elbowFlexion, relationship: "direct", mode: "dynamic", basis: "anatomy", sources: [src.brachialisAction, src.brachialisTeach], rationale: withShoulder(id, CURL_BRACHIALIS, "brachialis") });

function supinatedCurl(id: number): VariantMapping[] {
  const bodyWeight = id === 138 ? " Here the hands hold the body's weight on a bar." : "";
  return [
    mapping(id, m.biceps, {
      action: a.elbowFlexion,
      relationship: "direct",
      mode: "dynamic",
      basis: "anatomy",
      sources: [src.bicepsAction, curlShoulder[id] ? src.bicepsKenhubTwoJoint : src.bicepsKenhub, src.curlGrips],
      rationale: withShoulder(id, `A palms-up curl is built on elbow flexion in the biceps' best position: direct, dynamic.${bodyWeight} ${NO_SUPINATION}`, "biceps"),
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
      basis: "anatomy",
      sources: [src.bicepsAction, src.curlGrips, src.slowBends],
      rationale:
        "With the palms in the biceps still flexes the elbow, but this curl is chosen for the brachialis and the forearm's brachioradialis, so the biceps is contributing, dynamic, as the forearm atlas first read it. Whether grip changes the biceps' work is not settled: one study found it more active palms up than palms in while lifting, another found no change.",
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
        "With the palms down the biceps flexes the elbow at a mechanical disadvantage, and one study found it less active than palms up while lifting, so it is contributing, dynamic; the brachialis and the forearm's brachioradialis are the targets. Another study found no change with grip, so this also reads the exercise's purpose, as the forearm atlas first did.",
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
        "Each rep is lifted with the palms up, the biceps' best position for flexing the elbow, so it is direct, dynamic, as the forearm atlas first read it. The turns between palms up and palms down are not credited: a dumbbell turned about its own handle gives little resistance to a turn.",
    }),
    curlBrachialis(id),
  ];
}

// ---------------------------------------------------------------- rows, pulldowns, pull-ups and chin-ups

type PullGrip = keyof typeof pullsCurlsCatalogIds.elbowPulls;

const PULL_BICEPS =
  "The elbows bend under load, and the biceps flexes the elbow, so it helps move the load: contributing, dynamic. The pull is built on the back's work, so it is never direct.";
const PULL_BICEPS_GRIP: Record<PullGrip, string> = {
  supinated: "Palms up is its best position, but the pull is still the back's.",
  neutral: "With the palms in it still flexes fully.",
  pronated: "With the palms down it works at a mechanical disadvantage.",
  unknown: "The grip varies; it flexes the elbow in any.",
};
const PULL_GRIP_EVIDENCE =
  "On grip the studies are mixed: two, of pulldowns and pull-ups, found its activity much the same across grips; a third is reported to find more in chin-ups.";
const PULL_BRACHIALIS =
  "The brachialis flexes the elbow whatever the forearm's rotation, so it helps move the load in every row, pulldown and pull-up, whatever the grip: contributing, dynamic. The pull is built on the back's work, so it is never direct.";
const PULL_LONG_HEAD =
  "The long head, the one triceps head crossing the shoulder, helps draw the arm down and back, as this pull does in front of the body, and one study recorded it in lat pulldowns. But the elbow bends under load at the same time and the long head also straightens it, so whether it does net work here is not established: pending review.";

/** What a few pulls add to the family's words. */
const pullNote: Record<number, string> = {
  73: "One arm does most of the pull.",
  74: "Listed as core work, but the arms do a pull-up.",
  80: "Hand over hand, the arms take turns drawing the body up.",
  379: "The trunk turns with the pull.",
};
const withNote = (id: number, text: string) => (pullNote[id] ? `${text} ${pullNote[id]}` : text);
const frontToBack = new Set<number>(pullsCurlsCatalogIds.frontToBackPulls);

function elbowPull(id: number, grip: PullGrip): VariantMapping[] {
  return [
    mapping(id, m.biceps, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.bicepsAction, src.pulldownRow, src.pullUps, src.chinUps], rationale: withNote(id, `${PULL_BICEPS} ${PULL_BICEPS_GRIP[grip]} ${PULL_GRIP_EVIDENCE}`) }),
    mapping(id, m.brachialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "anatomy", sources: [src.brachialisAction, src.brachialisTeach], rationale: withNote(id, PULL_BRACHIALIS) }),
    ...(frontToBack.has(id)
      ? [mapping(id, m.tricepsLong, { action: sh.extension, relationship: "contributing", mode: "dynamic", basis: "inference", status: "draft", sources: [src.longHead, src.longHeadPulldown], rationale: PULL_LONG_HEAD })]
      : []),
  ];
}

// ---------------------------------------------------------------- face pulls and the rear-delt row

const FACE_PULL =
  "The elbows sit out wide of the rope's line, so the rope pulls the hands away from the shoulders and the elbow flexors bend the elbows against it.";
const FACE_PULL_LIMIT = "The rear shoulder is the target and the load is light, so never direct; no study of the elbow flexors here was found.";
const FACE_PULL_TURN = " The turn out at the end works the shoulder's rotators, not the elbow.";

function facePull(id: number): VariantMapping[] {
  const turn = id === 88 ? FACE_PULL_TURN : "";
  return [
    mapping(id, m.biceps, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "inference", sources: [src.bicepsAction], rationale: `${FACE_PULL} The biceps is an elbow flexor: contributing, dynamic. ${FACE_PULL_LIMIT}${turn}` }),
    mapping(id, m.brachialis, { action: a.elbowFlexion, relationship: "contributing", mode: "dynamic", basis: "inference", sources: [src.brachialisAction], rationale: `${FACE_PULL} The brachialis flexes the elbow in any grip: contributing, dynamic. ${FACE_PULL_LIMIT}${turn}` }),
  ];
}

// ---------------------------------------------------------------- the upright row and the high pull (drafts)

const UPRIGHT =
  "The elbows bend as the handle rises, but the forearms hang close to the cable's line, so the load has little leverage at the elbow. Whether the elbow flexors move it or follow the shoulders is not established, so this stays pending review, as the forearm's brachioradialis does here.";

function uprightPull(id: number): VariantMapping[] {
  const hips = id === 335 ? " The hips help drive the high pull." : "";
  const draft = { action: a.elbowFlexion, relationship: "contributing" as const, mode: "dynamic" as const, basis: "inference" as const, status: "draft" as const, rationale: `${UPRIGHT}${hips}` };
  return [
    mapping(id, m.biceps, { ...draft, sources: [src.bicepsAction] }),
    mapping(id, m.brachialis, { ...draft, sources: [src.brachialisAction] }),
  ];
}

// ---------------------------------------------------------------- pullovers and straight-arm pulldowns

const LONG_HEAD = "The long head, the one triceps head crossing the shoulder, helps draw the arm down and back.";
const LONG_HEAD_HOLDS = "It also helps hold the elbow straight; its shoulder work is what is credited.";
const longHeadSources = [src.longHead, src.longHeadImaios, src.longHeadKenhub];

/** Why the load tends to bend the nearly straight elbows, so the triceps hold them. */
const elbowLoad: Record<number, string> = {
  24: "Lying with the arms overhead, bending the elbow would lower the hand, so the dumbbell pulls the elbows toward bending.",
  65: "Lying with the arms overhead, bending the elbow would lower the hand, so the dumbbell pulls the elbows toward bending.",
  63: "Lying or standing, the cable pulls the hands across the line of the straight arms, toward bending the elbows.",
  62: "The cable pulls the straight arms up toward the pulley, toward bending the elbows.",
  328: "The cable pulls the straight arms up toward the pulley, toward bending the elbows.",
};
const ELBOW_HOLD = "The triceps hold them straight without moving: isometric steadying, never dynamic credit. The lateral and medial heads share every action, so the work is shared.";
const SAP_STUDY = "One study found the triceps more active here than in the barbell pullover; the head was not named.";
const elbowHoldStudy: Record<number, string> = { 62: SAP_STUDY, 328: SAP_STUDY };
const PULLOVER_STUDY = "One study recorded the triceps in a lying barbell pullover; the head was not named.";

function tricepsHold(id: number): VariantMapping[] {
  const hold = { action: a.elbowExtension, relationship: "stabilizer" as const, mode: "isometric" as const, basis: "inference" as const, allocation: "shared" as const, rationale: `${elbowLoad[id]} ${ELBOW_HOLD} ${elbowHoldStudy[id] ?? PULLOVER_STUDY}` };
  return [
    mapping(id, m.tricepsLateral, { ...hold, sources: [src.lateralAction, src.tricepsMain, src.straightArm] }),
    mapping(id, m.tricepsMedial, { ...hold, sources: [src.medialAction, src.tricepsMain, src.straightArm] }),
  ];
}

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
        rationale: "This machine is described only as one lever the arms move in an arc, elbows nearly straight, not where the lever meets the arms. Without that, whether the long head, the one triceps head crossing the shoulder, shares the shoulder extension as in a free-weight pullover is not established: pending review. The elbow-only heads are not credited.",
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
      rationale: `${LONG_HEAD} Here the nearly straight arms sweep toward the body against the load, so it helps move it: contributing, dynamic. The lats are the target, so it is never direct. ${LONG_HEAD_HOLDS}`,
    }),
    ...tricepsHold(id),
  ];
}

function straightArmPulldown(id: number): VariantMapping[] {
  return [
    mapping(id, m.tricepsLong, {
      action: sh.extension,
      relationship: "contributing",
      mode: "dynamic",
      basis: "anatomy",
      sources: [...longHeadSources, src.straightArm],
      rationale: `${LONG_HEAD} Here the straight arms sweep down to the thighs against the cable, so it helps move it: contributing, dynamic. The lats are the target, so it is never direct. ${LONG_HEAD_HOLDS} ${SAP_STUDY}`,
    }),
    ...tricepsHold(id),
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

  // Rows, pulldowns, pull-ups and chin-ups (with the long head's drafts on the front-to-back vertical pulls).
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
