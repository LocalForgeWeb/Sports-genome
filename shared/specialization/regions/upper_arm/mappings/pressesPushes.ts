import type { MappingEvidenceBasis, MappingSourceRef, NodeId, ReviewStatus, UnmappedTaggedExercise, VariantMapping } from "../../../types";
import { forearmActionIds as a } from "../../../actions/ids";
import { variantIdFor } from "../../../ids";
import { variantFor } from "../../../variants";
import { UPPER_ARM_MAPPING_VERSION, upperArmMuscleIds as m } from "../ids";

/**
 * The upper arm's presses and pushes (wave A, 22 Oct 2026; fix round 23 Oct 2026): every catalog
 * row in the upper arm's scope (tagging `biceps`, `brachialis` or `triceps`, primary or secondary)
 * whose catalog movement names a push or press, or scapular protraction. That is 77 rows, exactly
 * the variants lane's presses and pushes (docs/specialization-atlas/regions/variants.md §1); none has
 * a forearm variant, so every variant is the library's wave A record, used as it is. 72 are mapped
 * (216 rows) and five are listed unmapped with their reasons. The seven medicine-ball throws and
 * slams in scope are at the end of the file, kept apart and not wired (see there).
 * client/src/lib/specialization/upper_armMappings.pressesPushes.test.ts derives both sets from the
 * catalog and holds every rule below.
 *
 * Rationales are shown to athletes on a phone, so they are short (at most 450 characters), name no
 * side and no count, and keep the evidence's details (study sizes, activity findings) in the
 * sources' limitations. Read the rows as the forearm's are read (05-mappings.md "Method"):
 * relationship and muscle mode set separately; evidence basis `anatomy` where the row rests on what
 * the muscle does, `inference` where it rests on a reading of the movement (including every call of
 * "direct" that a study only informs), `emg` only where a muscle-activity study that recorded that
 * head is cited for the judgement. The judgement calls:
 *
 * - **The triceps are credited for straightening the elbow, all three heads, in every press and
 *   push.** The lateral and medial heads cross only the elbow and share every action, so their rows
 *   are always written together, `shared` (10-multi-region.md §1.2). The long head is credited on
 *   its own, for elbow extension too.
 * - **The long head's shoulder action is never credited here.** It crosses the shoulder, where it
 *   draws the arm down and back (extension, and some list adduction). Flat, incline, overhead and
 *   landmine presses and push-ups move the arm forward or up, so there it works against the press.
 *   Decline presses (3, 6, 306), the incline push-up (30, the push-up form of a decline press) and
 *   dips are not said to oppose it: their arm path may share its adduction, and Barnett 1995 found
 *   the long head most active in decline and flat presses; they are simply not built on it.
 *   Horizontal and overhead presses are credited alike; what Barnett 1995 and Kholinne 2018 found
 *   about activity is in those sources' limitations, since credit counts sets, not shares.
 * - **Direct or contributing.** The triceps are direct only where the exercise is built on elbow
 *   extension: the close-grip bench press (146; `emg` on the long and lateral heads, which Barnett
 *   and Lehman recorded, `inference` on the medial head, which neither did), the JM press (147), the
 *   diamond push-up (28; Cogley 2005 found the chest more active too, so `inference`) and the bench
 *   dip (158; McKenzie 2022 calls it mainly a triceps exercise but recorded lower peak triceps
 *   activity than in bar or ring dips, so `inference`). Everywhere else the chest or shoulders lead
 *   and the triceps are contributing, including the squeeze presses (8, 304: the squeeze is the
 *   chest's, not a narrow grip on one bar) and the four rows the catalog tags triceps-primary (309,
 *   323, 386, 389), whose movements are the same as their contributing neighbours'.
 * - **No biceps or brachialis credit.** Nothing in a press bends the elbow under load. Lehman 2005
 *   recorded biceps activity in bench-press holds, higher with the palms up; that is an antagonist
 *   working while the elbow straightens, not a load the biceps moves, and no source shows the
 *   biceps' weak shoulder-flexion help (`upper_arm.biceps.selectivity.2`) carrying a press. The
 *   cleans inside 269 and 389 are not credited to the elbow flexors: the hips swing the load up and
 *   the arm guides it into the rack, the variants lane's reading of 387.
 * - **Push-ups and dips: body weight is the load.** The hands bear a share of body weight that
 *   changes with the set-up (Ebben 2011), and the elbows straighten against it as in a loaded press,
 *   so they are credited as presses are. The share is not a weight: credit counts sets.
 * - **Medicine-ball and Pallof presses: real elbow work or only bracing.** The medicine-ball
 *   push-up (272) is a push-up. A Pallof press or press-out (249, 310), the landmine anti-rotation
 *   press (267, defined by its name alone, read as a press-out) and the standing plate squeeze press
 *   (25) are pressed straight forward while the load pulls across that line, so the elbows
 *   straighten against little load along it. They are listed unmapped, not counted as incidental
 *   steadying, because the elbow moves rather than holds and the load runs across it. The serratus
 *   punch (322) keeps the elbow straight with the cable pulling along the arm: listed. No row in
 *   this family is steadying. A chest pass (kept apart, at the end) throws the ball by straightening
 *   the elbows: real work, contributing.
 * - **Laterality `either`** (11, 12, 13, 106, 252, 254, 269, 270, 301, 303, 324, 325, 382, 386,
 *   389): one arm or both may press, and the triceps work on whichever arm presses, so every row
 *   carries `sideRelation: "same"` (written on every row). With both sides counted as one, the
 *   rationale says only "One arm or both may press; the triceps work on whichever arm presses."
 *
 * Not done: no shoulder row of any kind, no split between the lateral and medial heads, no credit
 * for the coracobrachialis (adjacent) or the forearm's brachioradialis (the forearm credits it), and
 * no weight by load, angle or head.
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "Gives the muscle's action, seen through web-search excerpts; not how much this exercise loads it.";
const NOT_CREDIT = "Activity, not load or growth, and not a credit weight; abstract only.";

const src = {
  long: { sourceId: "statpearls.triceps", locator: "Structure and Function: the long head extends the elbow and has a small action at the shoulder", limitation: ACTION_ONLY },
  longShoulder: { sourceId: "imaios.triceps_long_head", locator: "Function: elbow extension; shoulder extension and adduction", limitation: "Seen through the imaios.cn mirror; gives the actions, not their size in any exercise." },
  lateral: { sourceId: "elsevier.triceps_lateral_head", locator: "Quick Facts: Action (extends the forearm at the elbow)", limitation: ACTION_ONLY },
  medial: { sourceId: "elsevier.triceps_medial_head", locator: "Quick Facts: Action (extends the forearm at the elbow)", limitation: `${ACTION_ONLY} The search summary reported its own citation markers as partly garbled; the facts matched IMAIOS.` },
  sharedHeads: { sourceId: "kenhub.triceps_brachii", locator: "Origins, insertion and function: lateral and medial heads from the back of the humerus", limitation: "Attachments and actions only; says nothing about how a press shares its work between the two heads." },
  armHeight: { sourceId: "aott.triceps_heads", locator: "Abstract: Results (force by shoulder elevation)", limitation: `Found the long head the strongest head with the arm by the side and the medial head with the arm at shoulder height or above. Isolated elbow extensions in ten adults, not presses; force modelled from surface EMG. ${NOT_CREDIT}` },
  barnett: { sourceId: "jscr.bench_press_variations_emg", locator: "Abstract: Results (long head of the triceps by bench angle and hand spacing)", limitation: `Found the long head more active in decline and flat presses than in incline or seated overhead ones, and with a narrow grip. Six trained men at one heavy load; seen through a database record. ${NOT_CREDIT}` },
  lehman: { sourceId: "pmid.16095407", locator: "Abstract: Results (lateral head of the triceps by grip width)", limitation: `Found lateral-head activity rose as the grip narrowed. Twelve men in isometric holds; other grip-width studies disagree. ${NOT_CREDIT}` },
  cogley: { sourceId: "jscr.pushup_hand_position", locator: "Abstract: Results (triceps and pectoralis by hand position)", limitation: `Found both the triceps and the pectoralis more active with the hands narrow than wide. One push-up per position in 40 adults; the head recorded was not seen. ${NOT_CREDIT}` },
  mckenzie: { sourceId: "pmid.36293792", locator: "Abstract: Results (peak triceps activity in bench, bar and ring dips)", limitation: `Found lower peak triceps activity in bench dips than in bar or ring dips, and calls the bench dip mainly a triceps exercise. Thirteen trained men; the head recorded was not seen. ${NOT_CREDIT}` },
  pushUpLoad: { sourceId: "jscr.pushup_kinetics", locator: "Abstract: Results (force on the hands by push-up variation)", limitation: "Force on the hands, highest with the feet raised and lowest with the hands raised; not muscle activity. Shares of body weight in summaries were not checked and are not used; read as its proceedings copy." },
} satisfies Record<string, MappingSourceRef>;

// ---------------------------------------------------------------- one mapping

interface Spec {
  relationship: "direct" | "contributing";
  basis: MappingEvidenceBasis;
  rationale: string;
  sources: MappingSourceRef[];
  allocation?: VariantMapping["allocation"];
  status?: ReviewStatus;
}

/** One row: always the triceps head's elbow extension, moving through range, on the pressing arm. */
const mapping = (catalogExerciseId: number, nodeId: NodeId, spec: Spec): VariantMapping => ({
  id: `${variantIdFor(catalogExerciseId)}:${nodeId}`,
  versionKey: UPPER_ARM_MAPPING_VERSION,
  variantId: variantIdFor(catalogExerciseId),
  nodeId,
  actionId: a.elbowExtension,
  relationship: spec.relationship,
  muscleMode: "dynamic",
  evidenceBasis: spec.basis,
  allocation: spec.allocation ?? "individual",
  requiresNoStraps: false,
  rationale: spec.rationale,
  reviewStatus: spec.status ?? "reviewed",
  sources: spec.sources,
  sideRelation: "same",
});

// ---------------------------------------------------------------- what the rows say

const SHARED = "The lateral and medial heads share this work; it is not split between them.";
const EITHER = "One arm or both may press; the triceps work on whichever arm presses.";

/** The long head's shoulder action: against the movement, or not what it is built on. */
const against = (what: string) => `The long head also crosses the shoulder, where it draws the arm down and back; that works against the ${what}, so only its elbow action is credited.`;
const notBuiltOn = (what: string) => `The long head also crosses the shoulder, but the ${what} is not built on its action there, so only its elbow action is credited.`;

interface Press {
  relationship: "direct" | "contributing";
  basis: MappingEvidenceBasis;
  /** What the exercise does at the elbow and why the relationship is what it is. */
  why: string;
  /** The long head's closing sentence. */
  long: string;
  /** Sources behind the judgement, cited on all three heads. */
  extra?: MappingSourceRef[];
  /** Sources cited on the long head only (activity by arm position). */
  longExtra?: MappingSourceRef[];
  /** Where the medial head's row differs (146: no cited study recorded it). */
  medial?: { basis: MappingEvidenceBasis; note: string; extra: MappingSourceRef[] };
  status?: ReviewStatus;
}

/** The three triceps heads straightening the elbow in one exercise: the long head on its own, the lateral and medial heads shared. */
function triceps(catalogExerciseId: number, press: Press): VariantMapping[] {
  const variant = variantFor(catalogExerciseId);
  if (!variant) throw new Error(`No variant in the library for catalog id ${catalogExerciseId}`);
  const lead = variant.laterality === "either" ? `${press.why} ${EITHER}` : press.why;
  const extra = press.extra ?? [];
  const common = { relationship: press.relationship, basis: press.basis, status: press.status };
  return [
    mapping(catalogExerciseId, m.tricepsLong, { ...common, rationale: `${lead} ${press.long}`, sources: [src.long, src.longShoulder, ...extra, ...(press.longExtra ?? [])] }),
    mapping(catalogExerciseId, m.tricepsLateral, { ...common, allocation: "shared", rationale: `${lead} ${SHARED}`, sources: [src.lateral, src.sharedHeads, ...extra] }),
    press.medial
      ? mapping(catalogExerciseId, m.tricepsMedial, { ...common, basis: press.medial.basis, allocation: "shared", rationale: `${lead} ${press.medial.note}`, sources: [src.medial, src.sharedHeads, ...press.medial.extra] })
      : mapping(catalogExerciseId, m.tricepsMedial, { ...common, allocation: "shared", rationale: `${lead} ${SHARED}`, sources: [src.medial, src.sharedHeads, ...extra] }),
  ];
}

// ---------------------------------------------------------------- the families, by catalog id

const LEADS = "The chest and shoulders lead, so the triceps are contributing.";
const press = (why: string, long: string, longExtra: MappingSourceRef[] = [], basis: MappingEvidenceBasis = "anatomy"): Press => ({ relationship: "contributing", basis, why, long, longExtra });

const BENCH = {
  flat: `Pressing the load away from the chest straightens the elbows against it, so the triceps help move it through range. ${LEADS}`,
  incline: `Pressing the load up and forward from an incline straightens the elbows against it, so the triceps help move it through range. ${LEADS}`,
  decline: `Pressing the load from the chest on a decline straightens the elbows against it, so the triceps help move it through range. ${LEADS}`,
  squeeze: `Pressing straightens the elbows against the load, so the triceps help move it. Squeezing the two together works the chest; it does not move the press onto the elbows as a narrow grip on one bar does, so the triceps are contributing.`,
};
const CABLE = `The cable's pull runs back along the line of the press, so straightening the elbow moves the load and the triceps help move it through range. ${LEADS}`;
const OVERHEAD = "Pressing the load overhead straightens the elbows against it, so the triceps help move it through range. The shoulders lead, so the triceps are contributing.";
const DRIVE = "The legs drive the load up and the arms finish the press, straightening the elbows under it, so the triceps help move it: contributing.";
const CLEAN = "The load is pulled to the shoulder, then pressed, straightening the elbow against it, so the triceps help move it: contributing. The pull is not credited to the elbow flexors: the hips swing the load up and the arm guides it.";
const LANDMINE = "Pressing the end of the bar up and forward straightens the elbow against its weight, so the triceps help move it through range. The shoulder and chest lead, so the triceps are contributing.";
const PUSH_UP = `A push-up straightens the elbows against the share of body weight the hands bear (Ebben 2011); body weight is the load, credited as any press is. ${LEADS}`;
const DIP_BODY = "the body is lowered by bending the elbows and lifted by straightening them against body weight";

const pushUp = (detail: string, long = against("push")): Press => ({ relationship: "contributing", basis: "anatomy", why: detail ? `${detail} ${PUSH_UP}` : PUSH_UP, long, extra: [src.pushUpLoad] });

const flatPressIds = [1, 4, 7, 9, 10, 11, 13, 14];
const inclinePressIds = [2, 5, 12, 15];
const declinePressIds = [3, 6];
/** Cable presses whose cables pull back along the line of the press. */
const cablePressIds = [16, 17, 302, 303, 307, 308, 325];
const overheadIds = [101, 102, 103, 104, 105, 106, 107, 108, 109];
const landmineIds = [251, 252, 253, 381, 382, 386];
const pushUpDetails: Record<number, string> = {
  26: "",
  27: "Hands wider than the shoulders.",
  29: "Feet raised, the hands bear more of the body.",
  31: "One arm does most of each push while the other stays nearly straight.",
  32: "Pushed hard enough for the hands to leave the floor.",
  33: "Pushed hard enough to clap.",
  34: "Dropped from raised supports and pushed straight back up.",
  35: "Hands on blocks, for a longer range.",
  36: "Hands on rings that let them turn.",
  37: "A load on the back adds to body weight.",
  38: "A knee is drawn to the elbow on each rep.",
  39: "The body shifts toward one hand, then the other, at the bottom.",
  272: "One hand or both on a medicine ball, pushed off explosively.",
  309: "A cable across the back adds load.",
};

export const pressesPushesMappings: VariantMapping[] = [
  // Bench, machine and Smith presses.
  ...flatPressIds.flatMap((id) => triceps(id, press(BENCH.flat, against("press"), [src.barnett]))),
  ...[8, 304].flatMap((id) => triceps(id, press(BENCH.squeeze, against("press"), [src.barnett]))),
  ...inclinePressIds.flatMap((id) => triceps(id, press(BENCH.incline, against("press"), [src.barnett]))),
  ...declinePressIds.flatMap((id) => triceps(id, press(BENCH.decline, notBuiltOn("press"), [src.barnett]))),

  // Cable presses.
  ...cablePressIds.flatMap((id) => triceps(id, press(CABLE, against("press"), [src.barnett]))),
  ...triceps(301, press(`The handle is pressed forward and across the body against the cable's pull, so straightening the elbow moves the load and the triceps help move it through range. ${LEADS}`, against("press"))),
  ...triceps(324, press(`The handle is pressed up, forward and across the body against the cable's pull, so straightening the elbow moves the load and the triceps help move it. ${LEADS}`, against("press"))),
  ...triceps(305, press(`Pressing up and forward from an incline against the cables' pull straightens the elbows, so the triceps help move the load through range. ${LEADS}`, against("press"), [src.barnett])),
  ...triceps(306, press(`Pressing down and forward against the cables' pull straightens the elbows, so the triceps help move the load through range. ${LEADS}`, notBuiltOn("press"), [src.barnett])),
  ...triceps(323, press("One handle is punched forward as the trunk turns; the cable pulls back along the punch, so straightening the elbow moves the load. The trunk and shoulder drive the punch as much as the elbow, so the triceps are contributing.", against("punch"))),

  // Close-grip presses: built on elbow extension.
  ...triceps(146, {
    relationship: "direct",
    basis: "emg",
    long: against("press"),
    extra: [src.lehman, src.barnett],
    medial: { basis: "inference", note: "Neither study recorded the medial head; it shares the lateral head's work, which is not split between them.", extra: [src.lehman, src.barnett] },
    why: "A narrow grip puts more of the press on the elbows: narrowing the grip raised triceps activity in two small studies (Lehman 2005; Barnett 1995), though others disagree. It is the usual triceps press, so the triceps are direct.",
  }),
  ...triceps(147, { relationship: "direct", basis: "inference", long: against("press"), why: "The bar is lowered toward the throat by bending the elbows and pressed back up, part press and part skull crusher, so the elbows do most of the work and the triceps are direct. No study of this press was found; the call rests on the movement." }),

  // Overhead presses.
  ...overheadIds.flatMap((id) => triceps(id, press(OVERHEAD, against("press"), [src.barnett, src.armHeight]))),
  ...triceps(110, press(DRIVE, against("press"), [src.barnett, src.armHeight], "inference")),
  ...triceps(120, press("Upside down against a wall, the body is lowered by bending the elbows and pressed back up by straightening them against body weight. The shoulders lead, so the triceps are contributing.", against("press"), [src.armHeight])),
  ...triceps(389, press(CLEAN, against("press"), [src.armHeight], "inference")),

  // Landmine presses.
  ...landmineIds.flatMap((id) => triceps(id, press(LANDMINE, against("press")))),
  ...[254, 255, 268].flatMap((id) => triceps(id, press(DRIVE, against("press"), [], "inference"))),
  ...triceps(269, press(CLEAN, against("press"), [], "inference")),
  ...triceps(270, press("The legs drive the bar end up and the body drops under it into a split; the elbows straighten to lock it out under its weight, so the triceps help finish the lift: contributing.", against("lift"), [], "inference")),

  // Push-ups: body weight is the load.
  ...Object.entries(pushUpDetails).flatMap(([id, detail]) => triceps(Number(id), pushUp(detail))),
  ...triceps(30, pushUp("Hands raised, they bear less of the body.", notBuiltOn("push"))),
  ...triceps(28, { relationship: "direct", basis: "inference", long: against("push"), extra: [src.cogley, src.pushUpLoad], why: "Hands together under the chest put more of the push on the elbows. With narrow hands both the triceps and the chest were more active than with wide ones (Cogley 2005); this is the usual triceps push-up, so the triceps are direct." }),

  // Dips: body weight is the load.
  ...[40, 159].flatMap((id) => triceps(id, { relationship: "contributing", basis: "anatomy", long: notBuiltOn("dip"), extra: [src.mckenzie], why: `In a dip ${DIP_BODY}. How far the trunk leans, which shifts work between the chest and the triceps, is not defined, so the triceps are contributing.` })),
  ...triceps(158, { relationship: "direct", basis: "inference", long: notBuiltOn("dip"), extra: [src.mckenzie], why: "Hands on a bench behind the hips, the body moves by bending and straightening the elbows. A dip study calls it mainly a triceps exercise, though peak triceps activity was lower than in bar or ring dips (McKenzie 2022); the elbows do the work, so the triceps are direct." }),
];

/**
 * Rows of the family in the upper arm's scope left unmapped on purpose, each with its reason (all
 * are secondary-tagged; no primary-tagged row of the family is here).
 */
export const pressesPushesUnmapped: UnmappedTaggedExercise[] = [
  { catalogId: 25, reason: "Plate squeeze press: standing, the plates are pressed straight forward while their weight pulls down, across that line, so the elbows straighten against little load along it; what the elbow muscles do then depends on how the arms are held, which is not defined, and the squeeze is the chest's work." },
  { catalogId: 249, reason: "Pallof press: the cable pulls sideways, across the line of the press, and the trunk resists turning; the elbows straighten against little load along the press, and what they do against the sideways pull depends on how the arms are held, which is not defined. The work is the trunk's." },
  { catalogId: 267, reason: "Landmine anti-rotation press: no set-up is defined beyond the name, and an anti-rotation press is usually pressed out and held against a pull to turn, as the Pallof press is, so the elbows straighten against little load along the press. The work is the trunk's." },
  { catalogId: 310, reason: "Cable press-out (the Pallof press by another name): the cable pulls sideways, across the line of the press, and the trunk resists turning; the elbows straighten against little load along the press. The work is the trunk's." },
  { catalogId: 322, reason: "Serratus punch: the elbow stays straight while the shoulder blade carries the arm forward. The triceps may keep that straight elbow from bending, but the cable pulls along the arm, so that asks little of them and no source describes it; the work is the serratus anterior's." },
];
