import type { MappingEvidenceBasis, MappingSourceRef, NodeId, ReviewStatus, UnmappedTaggedExercise, VariantMapping } from "../../../types";
import { forearmActionIds as a } from "../../../actions/ids";
import { variantIdFor } from "../../../ids";
import { variantFor } from "../../../variants";
import { UPPER_ARM_MAPPING_VERSION, upperArmMuscleIds as m } from "../ids";

/**
 * The upper arm's presses and pushes (wave A, 22 Oct 2026): every catalog row in the upper arm's
 * scope (tagging `biceps`, `brachialis` or `triceps`, primary or secondary) whose catalog movement
 * names a push or press, or scapular protraction. That is 77 rows, exactly the variants lane's
 * presses and pushes (docs/specialization-atlas/regions/variants.md §1); none has a forearm variant,
 * so every variant is the library's wave A record, used as it is. 73 are mapped (219 rows) and four
 * are listed unmapped with their reasons. The seven medicine-ball throws and slams in scope are at
 * the end of the file, kept apart and not wired (see there). client/src/lib/specialization/
 * upper_armMappings.pressesPushes.test.ts derives both sets from the catalog and holds every rule
 * below.
 *
 * Read the rows as the forearm's are read (docs/specialization-atlas/05-mappings.md "Method"): a
 * relationship (direct: the exercise is built on this muscle's action; contributing: it helps move
 * the load) and a muscle mode (dynamic: its joint moves through range) set separately, evidence
 * basis `anatomy` where the row rests on what the muscle does, `inference` where it rests on a
 * reading of the movement, `emg` only where a muscle-activity study is cited for the judgement.
 * The judgement calls, each said again in the rows' rationales:
 *
 * - **The triceps are credited for straightening the elbow, all three heads, in every press and
 *   push.** The lateral and medial heads cross only the elbow and share every action, so their
 *   rows are always written together, `shared` (10-multi-region.md §1.2). The long head is
 *   credited on its own, for elbow extension too.
 * - **The long head's shoulder action is never credited here.** It crosses the shoulder, where it
 *   helps move the arm down and back (shoulder extension). Every press and push moves the arm the
 *   other way, forward or up (shoulder flexion, or bringing the arm forward from behind the body
 *   in a dip), so at the shoulder the long head works against the press. Horizontal and overhead
 *   presses are credited alike: one small EMG study found the long head more active in flat and
 *   decline presses than in incline and seated overhead ones (Barnett 1995), and a modelled-force
 *   study of isolated elbow extensions found it the strongest head with the arm by the side and
 *   the medial head the strongest with the arm at shoulder height or above (Kholinne 2018). That is
 *   activity, said in the rationales; credit counts sets, not shares, so it changes no row. In the
 *   medicine-ball overhead slam and throw (kept apart, at the end) the arms come down from
 *   overhead, so there the long head's shoulder action goes with the movement; it is still
 *   credited once, for the elbow, its main action (one row per muscle).
 * - **Direct or contributing.** The triceps are direct only where the exercise is built on elbow
 *   extension: the close-grip bench press (narrow grips raised triceps activity, Lehman 2005,
 *   Barnett 1995), the JM press (part press, part skull crusher), the diamond push-up (Cogley 2005)
 *   and the bench dip (McKenzie 2022). Everywhere else the chest or shoulders lead and the triceps
 *   are contributing, including the four rows the catalog tags triceps-primary (309, 323, 386,
 *   389), whose movements are the same as their contributing neighbours'.
 * - **No biceps or brachialis credit.** Nothing in a press bends the elbow under load: the elbow
 *   flexors are the triceps' antagonists here. The biceps' weak help raising the arm forward
 *   (`shoulder.flexion`, an assist row; studies disagree on whether its long head works at the
 *   shoulder at all, `upper_arm.biceps.selectivity.2`) is not credited in presses either: the
 *   elbow straightens, and no source shows the biceps loaded at the shoulder in a press. The
 *   overhead backward throw (279) swings the ball up with nearly straight arms, driven by the hips:
 *   no elbow work, and only that weak, disputed shoulder help, so it is listed unmapped (with the
 *   medicine-ball rows). The cleans inside 269 and 389 are not credited to the elbow flexors: the
 *   hips swing the load up and the arm guides it into the rack, the variants lane's reading of 387,
 *   the clean alone.
 * - **Push-ups and dips: body weight is the load.** The hands bear a share of body weight that
 *   rises with the feet raised and falls with the hands raised (Wurm et al.), and the elbows
 *   straighten against it as in a loaded press, so they are credited exactly as presses are. The
 *   share is not a weight: credit counts sets, never kilograms.
 * - **Medicine-ball and Pallof presses: real elbow work or only bracing.** A medicine-ball push-up
 *   (272) is a push-up, credited as one. A chest pass (kept apart, at the end) straightens the
 *   elbows to throw the ball, against its inertia: real work, contributing. A Pallof press or
 *   press-out (249, 310) and the standing plate squeeze press (25) are pressed straight forward
 *   while the load pulls across that line (the cable sideways, the plates' weight down), so the
 *   elbows straighten against little load along it; what the elbow muscles do then depends on how
 *   the arms are held, which the exercise does not define. They are listed unmapped, not counted as
 *   incidental steadying, because the elbow moves rather than holds and the load runs across it.
 *   The serratus punch (322) keeps the elbow straight with the cable pulling along the arm: no elbow
 *   work, listed. Incidental steadying would be counted apart, never as direct work; no row in this
 *   family is steadying.
 * - **Machines, landmines and cables with laterality `either`** (11, 12, 13, 106, 252, 254, 267,
 *   269, 270, 301, 303, 324, 325, 382, 386, 389): one arm or both may press. The triceps work on
 *   whichever arm presses, so every row reads the recorded arm's side (`sideRelation: "same"`,
 *   written on every row); a set pressed with both arms counts on both. With both sides counted as
 *   one (the owner, 20 Oct 2026), this changes no count. The both-limb variants among them (252,
 *   270, 303, 325, 386; variants/bothLimbs.ts) are sided by the pressing arm, which is what these
 *   rows read.
 *
 * Not done: no shoulder-extension row in any press, no split between the lateral and medial heads,
 * no credit for the coracobrachialis (adjacent, never mapped) or the forearm's brachioradialis (the
 * forearm credits it, §4.2), and no weight by load, angle or head.
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "Gives the muscle's action, seen through web-search excerpts; not how much this exercise loads it.";
const ACTIVITY = "Short-term muscle activity in a small group; not a measurement of load or growth, and not a credit weight.";

const src = {
  long: { sourceId: "statpearls.triceps", locator: "Structure and Function: the long head extends the elbow and has a small action at the shoulder", limitation: ACTION_ONLY },
  longShoulder: { sourceId: "imaios.triceps_long_head", locator: "Function: elbow extension; shoulder extension and adduction", limitation: "Seen through the imaios.cn mirror; gives the action, not its size in any exercise." },
  lateral: { sourceId: "elsevier.triceps_lateral_head", locator: "Quick Facts: Action (extends the forearm at the elbow)", limitation: ACTION_ONLY },
  medial: { sourceId: "loyola.triceps_brachii", locator: "Action: extends the elbow (all three heads)", limitation: ACTION_ONLY },
  sharedHeads: { sourceId: "kenhub.triceps_brachii", locator: "Origins, insertion and function: lateral and medial heads from the back of the humerus, crossing only the elbow", limitation: "Attachments and actions only; says nothing about how a press shares its work between the two heads." },
  armHeight: { sourceId: "aott.triceps_heads", locator: "Abstract: Results (force by shoulder elevation)", limitation: `${ACTIVITY} Isolated elbow extensions, not presses; force estimated by a computer model from surface EMG; abstract only.` },
  barnett: { sourceId: "jscr.bench_press_variations_emg", locator: "Abstract: Results (long head of the triceps by bench angle and hand spacing)", limitation: `${ACTIVITY} Six trained men at one heavy load; abstract only, seen through a database record.` },
  lehman: { sourceId: "pmid.16095407", locator: "Abstract: Results (lateral head of the triceps by grip width)", limitation: `${ACTIVITY} Twelve men holding bench-press positions isometrically; the lateral head only; other grip-width studies disagree. Abstract only.` },
  cogley: { sourceId: "jscr.pushup_hand_position", locator: "Abstract: Results (triceps by hand position)", limitation: `${ACTIVITY} One push-up per hand position in 40 adults; the head recorded was not seen. Abstract only.` },
  mckenzie: { sourceId: "mdpi.dip_variations", locator: "Abstract: Results (peak triceps activity in bench, bar and ring dips)", limitation: `${ACTIVITY} Thirteen experienced men, four repetitions each; the head recorded was not seen. Abstract and summaries only.` },
  pushUpLoad: { sourceId: "isbs.pushup_kinetics", locator: "Abstract: Results (force on the hands by push-up variation)", limitation: "Force on the hands in each variation, not muscle activity; the shares of body weight in summaries were not checked and are not used. Proceedings abstract only." },
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

/** One row: always the triceps head's elbow extension, moving through range, on the pressing arm's side. */
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

const SHARED = "The lateral and medial heads cross only the elbow and share every action, so they are credited together, shared, with no split between them.";
const EITHER = "One arm or both may press (laterality either): the triceps work on whichever arm presses, so the row reads that arm's side, and a set pressed with both arms counts on both.";

/** The long head's shoulder action against each kind of press, said once per kind. */
const LONG = {
  horizontal: "The long head straightens the elbow with the other heads. It also crosses the shoulder, where it helps move the arm down and back; pressing moves the arm forward, so at the shoulder it works against the press, and only its elbow action is credited. One small EMG study found it more active in flat and decline presses than in incline or seated overhead ones (Barnett 1995): activity, not a share of credit.",
  incline: "The long head straightens the elbow with the other heads. It also crosses the shoulder, where it helps move the arm down and back; an incline press moves the arm forward and up, so at the shoulder it works against the press, and only its elbow action is credited. One small EMG study found it less active in an incline press than in flat or decline ones (Barnett 1995): activity, not a share of credit.",
  overhead: "The long head straightens the elbow with the other heads. It also crosses the shoulder, where it helps move the arm down and back; pressing overhead raises the arm, so at the shoulder it works against the press, and only its elbow action is credited. One small EMG study found it less active in a seated overhead press than in flat or decline presses (Barnett 1995), and a modelled-force study of isolated elbow extensions found it the strongest head with the arm by the side and the medial head the strongest with the arm at shoulder height or above (Kholinne 2018): activity, not a share of credit.",
  landmine: "The long head straightens the elbow with the other heads. It also crosses the shoulder, where it helps move the arm down and back; a landmine press moves the arm forward and up along a line between a bench press and an overhead press, so at the shoulder it works against the press, and only its elbow action is credited.",
  pushUp: "The long head straightens the elbow with the other heads. It also crosses the shoulder, where it helps move the arm down and back; pushing the body up brings the arm forward, so at the shoulder it works against the push, and only its elbow action is credited.",
  pass: "The long head straightens the elbow with the other heads. It also crosses the shoulder, where it helps move the arm down and back; the pass drives the arms forward, so at the shoulder it works against the throw, and only its elbow action is credited.",
  dip: "The long head straightens the elbow with the other heads. It also crosses the shoulder, where it helps draw the arm back; rising out of a dip brings the arm forward from behind the body, so at the shoulder it works against the movement, and only its elbow action is credited.",
  throwDown: "The long head straightens the elbow with the other heads, and here its shoulder action, drawing the arm down from overhead, goes with the throw too. It is credited once, for the elbow, its main action: one row per muscle, and the lats lead the arm's sweep.",
};

type LongKind = keyof typeof LONG;

interface Press {
  relationship: "direct" | "contributing";
  basis: MappingEvidenceBasis;
  /** What the exercise does at the elbow and why the relationship is what it is. */
  why: string;
  long: LongKind;
  /** EMG or force sources behind the judgement, cited on all three heads. */
  extra?: MappingSourceRef[];
  status?: ReviewStatus;
}

const longExtra: Record<LongKind, MappingSourceRef[]> = {
  horizontal: [src.barnett],
  incline: [src.barnett],
  overhead: [src.barnett, src.armHeight],
  landmine: [],
  pushUp: [],
  pass: [],
  dip: [],
  throwDown: [src.longShoulder],
};

/** The three triceps heads straightening the elbow in one exercise: the long head on its own, the lateral and medial heads shared. */
function triceps(catalogExerciseId: number, press: Press): VariantMapping[] {
  const variant = variantFor(catalogExerciseId);
  if (!variant) throw new Error(`No variant in the library for catalog id ${catalogExerciseId}`);
  const lead = `${variant.catalogName}: ${press.why}${variant.laterality === "either" ? ` ${EITHER}` : ""}`;
  const extra = press.extra ?? [];
  const common = { relationship: press.relationship, basis: press.basis, status: press.status };
  return [
    mapping(catalogExerciseId, m.tricepsLong, { ...common, rationale: `${lead} ${LONG[press.long]}`, sources: [src.long, ...extra, ...longExtra[press.long].filter((ref) => !extra.includes(ref))] }),
    mapping(catalogExerciseId, m.tricepsLateral, { ...common, allocation: "shared", rationale: `${lead} ${SHARED}`, sources: [src.lateral, src.sharedHeads, ...extra] }),
    mapping(catalogExerciseId, m.tricepsMedial, { ...common, allocation: "shared", rationale: `${lead} ${SHARED}`, sources: [src.medial, src.sharedHeads, ...extra] }),
  ];
}

// ---------------------------------------------------------------- the families, by catalog id

const CHEST_LEADS = "The chest and the front of the shoulder lead the press (the catalog's primary tag), so the triceps are contributing, not direct.";
const BENCH = {
  flat: `the load is pressed away from the chest along a horizontal line, straightening the elbows against it, so the triceps move it through range. ${CHEST_LEADS}`,
  incline: `the load is pressed up and forward from an incline, straightening the elbows against it, so the triceps move it through range. ${CHEST_LEADS}`,
  decline: `the load is pressed away from the chest on a decline, toward the hips, straightening the elbows against it, so the triceps move it through range. ${CHEST_LEADS}`,
};
const CABLE = "the cables pull the handles back toward the pulleys, along the line of the press, so straightening the elbows moves the load and the triceps work through range. The chest leads (the catalog's primary tag), so the triceps are contributing, not direct.";
const OVERHEAD = "pressing the load overhead straightens the elbows against it, so the triceps move it through range. The shoulders lead the press (the catalog's primary tags), so the triceps are contributing, not direct.";
const DRIVE = "the legs drive the load up first and the arms finish the press, straightening the elbows under it, so the triceps help move it through range: contributing, not direct.";
const LANDMINE = "pressing the end of the bar up and forward straightens the elbow against the bar's weight, so the triceps move it through range. The front of the shoulder and the chest lead (the catalog's primary tags), so the triceps are contributing, not direct.";
const PUSH_UP = "a push-up straightens the elbows against the share of body weight the hands bear, which rises with the feet raised and falls with the hands raised (Wurm et al.). Body weight is the load, credited as any press is, since credit counts sets, not kilograms. The chest leads (the catalog's primary tag), so the triceps are contributing, not direct.";
const NO_CLEAN = "The pull to the shoulder before the press is not credited to the elbow flexors: the hips swing the load up and the arm guides it into the rack.";

const press = (why: string, long: LongKind, extra: MappingSourceRef[] = []): Press => ({ relationship: "contributing", basis: "anatomy", why, long, extra });
const pushUp = (detail = ""): Press => ({ relationship: "contributing", basis: "anatomy", why: `${detail ? `${detail} ` : ""}${PUSH_UP}`, long: "pushUp", extra: [src.pushUpLoad] });

/** Flat and floor presses with a bar, dumbbells or a machine; the press line is horizontal. */
const flatPressIds = [1, 4, 7, 8, 9, 10, 11, 13, 14];
const inclinePressIds = [2, 5, 12, 15];
const declinePressIds = [3, 6];
/** Cable presses, the cables pulling back along the line of the press. */
const cableFlatIds = [16, 17, 301, 302, 303, 304, 307, 308, 325];
const cableInclineIds = [305, 324];
const overheadIds = [101, 102, 103, 104, 105, 106, 107, 108, 109];
const landmineIds = [251, 252, 253, 267, 381, 382];
const pushUpDetails: Record<number, string> = {
  26: "",
  27: "hands wider than the shoulders;",
  29: "feet raised on a box, so the hands bear more of the body;",
  30: "hands raised on a box, so they bear less of the body;",
  31: "one arm does most of each push while the other stays nearly straight, the arms taking turns, so both arms' triceps work in the set;",
  32: "pushed hard enough for the hands to leave the floor;",
  33: "pushed hard enough to clap;",
  34: "dropped from raised supports and pushed straight back up;",
  35: "hands raised on blocks so the chest sinks below them, a longer range;",
  36: "hands on rings that let them turn;",
  37: "a load on the back adds to body weight;",
  38: "a knee drawn to the elbow on each rep, the legs taking turns;",
  39: "the body shifts toward one hand and then the other at the bottom, so both arms work every set;",
  272: "one hand or both on a medicine ball, pushed off explosively;",
};

export const pressesPushesMappings: VariantMapping[] = [
  // Bench, machine and Smith presses.
  ...flatPressIds.flatMap((id) => triceps(id, press(BENCH.flat, "horizontal"))),
  ...inclinePressIds.flatMap((id) => triceps(id, press(BENCH.incline, "incline"))),
  ...declinePressIds.flatMap((id) => triceps(id, press(BENCH.decline, "horizontal"))),

  // Cable presses.
  ...cableFlatIds.flatMap((id) => triceps(id, press(CABLE, "horizontal"))),
  ...cableInclineIds.flatMap((id) => triceps(id, press(`pressing up and forward, ${CABLE}`, "incline"))),
  ...triceps(306, press(`pressing down and forward, ${CABLE}`, "horizontal")),
  ...triceps(323, press("one handle is punched forward from a standing stance, the trunk turning with it; the cable pulls back along the punch, so straightening the elbow moves the load. The catalog tags the triceps primary here, but the punch is driven by the trunk and shoulder as much as by the elbow, as the other cable presses are, so the triceps are contributing, not direct.", "horizontal")),

  // Close-grip presses: built on elbow extension.
  ...triceps(146, { relationship: "direct", basis: "emg", long: "horizontal", extra: [src.lehman, src.barnett], why: "a narrow grip on a flat bench puts more of the press on the elbows. Narrowing the grip raised triceps activity in two small EMG studies (Lehman 2005, the lateral head in isometric holds; Barnett 1995, the long head), though other grip-width studies disagree, and the close-grip press is the usual triceps press, so the triceps are direct." }),
  ...triceps(147, { relationship: "direct", basis: "inference", long: "horizontal", why: "the bar is lowered toward the throat by bending the elbows and pressed back up, part press and part skull crusher, so the elbow is the joint that moves most and the catalog tags the triceps primary: direct. No study measuring this press was found, so the judgement rests on the movement." }),

  // Overhead presses.
  ...overheadIds.flatMap((id) => triceps(id, press(OVERHEAD, "overhead"))),
  ...triceps(110, press(`a dip and drive of the legs starts the bar; ${DRIVE}`, "overhead")),
  ...triceps(120, press("upside down against a wall, the body is lowered by bending the elbows and pressed back up by straightening them against body weight, so the triceps move it through range. The shoulders lead (the catalog's primary tags), so the triceps are contributing, not direct.", "overhead")),
  ...triceps(389, press(`the bell is pulled to the shoulder, then pressed overhead, straightening the elbow against it, so the triceps help move it: contributing, not direct. The catalog tags the triceps primary here; the press itself is an ordinary overhead press, so the relationship is the same as theirs. ${NO_CLEAN}`, "overhead")),

  // Landmine presses.
  ...landmineIds.flatMap((id) => triceps(id, press(LANDMINE, "landmine"))),
  ...triceps(386, press(`${LANDMINE} The catalog tags the triceps primary here; the press is the same landmine press as the others, so the relationship is the same.`, "landmine")),
  ...triceps(254, press(`the bar end is started by a dip and drive of the legs; ${DRIVE}`, "landmine")),
  ...triceps(255, press(`a squat runs straight into the press; ${DRIVE}`, "landmine")),
  ...triceps(268, press(`a squat runs straight into the press; ${DRIVE}`, "landmine")),
  ...triceps(269, press(`the bar end is pulled from low to the shoulder, then pressed up and forward, straightening the elbow against it, so the triceps help move it: contributing, not direct. ${NO_CLEAN}`, "landmine")),
  ...triceps(270, press("the legs drive the bar end up and the body drops under it into a split, the elbows straightening to lock it out under its weight; the triceps help finish the lift: contributing, not direct.", "landmine")),

  // Push-ups: body weight is the load.
  ...Object.entries(pushUpDetails).flatMap(([id, detail]) => triceps(Number(id), pushUp(detail))),
  ...triceps(309, pushUp("a cable across the back adds load to a push-up; the catalog tags the triceps primary here, but the movement is a push-up like the others, built on the chest's work;")),
  ...triceps(28, { relationship: "direct", basis: "emg", long: "pushUp", extra: [src.cogley, src.pushUpLoad], why: "hands together under the chest put more of the push on the elbows, which straighten against the share of body weight the hands bear. With a narrow hand position the triceps were more active than with a wide one (Cogley 2005), and the narrow push-up is the usual triceps push-up, so the triceps are direct." }),

  // Dips: body weight is the load.
  ...[40, 159].flatMap((id) => triceps(id, { relationship: "contributing", basis: "anatomy", long: "dip", extra: [src.mckenzie], why: "the body is lowered by bending the elbows and lifted by straightening them against body weight; peak triceps activity in bar and ring dips was higher than in bench dips (McKenzie 2022). The catalog tags the chest primary, and how far the trunk leans, which moves work between the chest and the triceps, is not defined, so the triceps are contributing, not direct." })),
  ...triceps(158, { relationship: "direct", basis: "emg", long: "dip", extra: [src.mckenzie], why: "with the hands on a bench behind the hips, the body is lowered and raised by bending and straightening the elbows. A dip study describes the bench dip as mainly a triceps exercise (McKenzie 2022), and the catalog tags the triceps primary, so they are direct." }),
];

/**
 * Rows of the family in the upper arm's scope left unmapped on purpose, each with its reason (all
 * are secondary-tagged; no primary-tagged row of the family is here).
 */
export const pressesPushesUnmapped: UnmappedTaggedExercise[] = [
  { catalogId: 25, reason: "Plate squeeze press: standing, the plates are pressed straight forward while their weight pulls down, across that line, so the elbows straighten against little load along it; what the elbow muscles do then depends on how the arms are held, which is not defined, and the squeeze is the chest's work." },
  { catalogId: 249, reason: "Pallof press: the cable pulls sideways, across the line of the press, and the trunk resists turning; the elbows straighten against little load along the press, and what they do against the sideways pull depends on how the arms are held, which is not defined. The work is the trunk's." },
  { catalogId: 310, reason: "Cable press-out (the Pallof press by another name): the cable pulls sideways, across the line of the press, and the trunk resists turning; the elbows straighten against little load along the press. The work is the trunk's." },
  { catalogId: 322, reason: "Serratus punch: the elbow stays straight while the shoulder blade carries the arm forward, and the cable pulls along the straight arm, so no elbow muscle moves the load; the work is the serratus anterior's." },
];

// ---------------------------------------------------------------- medicine-ball throws and slams (not wired)

/**
 * The seven medicine-ball rows in the upper arm's scope (271 and 281 chest passes, 273 overhead
 * slam, 280 forward overhead throw, 284 and 285 slams with a sprawl or sprint, 279 backward throw),
 * as this lane reads them. This lane's brief named "medicine-ball throws" among its exercises, and
 * the extensions-and-other lane's family takes every row whose catalog movement is "Throw, slam or
 * ballistic rotation", these seven; so both lanes decided them. They are kept apart from
 * `pressesPushesMappings` so that the version holds one decision per row by default (the movement
 * partition: presses and pushes here, throws there). Integration keeps one set and drops the
 * other; where the two readings differ is in the lane's report (here 284 and 285 are drafts).
 */
export const pressesPushesMedicineBallMappings: VariantMapping[] = [
  ...[271, 281].flatMap((id) => triceps(id, { relationship: "contributing", basis: "inference", long: "pass", why: "the ball is pushed from the chest and released, the elbows straightening to throw it, so the triceps do real work against the ball's inertia, not only bracing. The trunk, chest and shoulders lead (the catalog's primary tags), so the triceps are contributing. No study of this throw was found; the judgement rests on the movement." })),
  ...triceps(273, { relationship: "contributing", basis: "inference", long: "throwDown", why: "as photographed, the ball is held behind the head with the elbows bent and slammed to the floor, so the elbows straighten as the arms drive down and the triceps help throw it. The trunk, chest and shoulders lead (the catalog's primary tags), so the triceps are contributing. The judgement rests on the photographed set-up." }),
  ...triceps(280, { relationship: "contributing", basis: "inference", long: "throwDown", why: "the ball is thrown forward from behind the head with both hands (as photographed), so the elbows straighten as the arms come forward and the triceps help drive it. The lats lead (the catalog's primary tags), so the triceps are contributing. The judgement rests on the photographed set-up." }),
  ...([[284, "a sprawl"], [285, "a sprint"]] as const).flatMap(([id, after]) => triceps(id, { relationship: "contributing", basis: "inference", long: "throwDown", status: "draft", why: `an overhead slam with both hands, then ${after}. Unlike the Medicine-Ball Overhead Slam it is not photographed, and a slam can be thrown from straight arms overhead, where the elbows barely move; whether the elbows straighten under load is not defined, so this stays pending review.` })),
];

export const pressesPushesMedicineBallUnmapped: UnmappedTaggedExercise[] = [
  { catalogId: 279, reason: "Overhead backward throw: the hips and legs swing the ball from between the legs up and back over the head with the arms nearly straight, so the elbows do not work; the biceps' help raising the arm forward is weak and disputed, so no upper-arm muscle is credited." },
];
