import type { ExerciseVariant, ForearmOrientation, GripType, Laterality, SidedBy } from "../types";
import { variantIdFor } from "../ids";

/**
 * One default variant per catalog exercise the forearm atlas maps (`cat-<id>`), with its
 * execution spelled out (brief §4 "store supported variants for grip, straps, forearm
 * orientation, elbow/wrist position, and equipment"; §8 the workout metadata table).
 *
 * These are the 119 records forearm_mappings_v1 was published with, moved into the shared
 * library unchanged (docs/specialization-atlas/10-multi-region.md §3): every region reads these
 * records, and the database refuses any change to them. The one addition is the counting
 * attribute `sidedBy`, below.
 *
 * How the dimensions are read, so a reader can check any row:
 * - The exercise's definition decides, then its photograph where the catalog shows one
 *   (client/src/data/exercisePhotos.json): "Dumbbell Curl" shows two dumbbells curled together,
 *   so it is bilateral; "Dumbbell Row" shows one dumbbell, so it is one-arm.
 * - `laterality`: `bilateral` only when both arms work in every set by definition (a barbell, two
 *   dumbbells, both hands on one handle, or arms alternating within the set, which still works
 *   each arm once per set); `unilateral` for one-arm exercises; `either` only where the
 *   catalog leaves it open (a machine with independent handles, a single-leg hinge with one
 *   implement or two). The logger asks for a side only on `unilateral` and `either` work.
 * - `straps`: `not_applicable` where a strap cannot help (wrist curls, levers, curls, bands,
 *   pinches, grippers); `unknown` on pulls, hinges, shrugs, hangs and carries, where straps
 *   are used and the catalog cannot know whether they were (brief §4: distinguish unknown
 *   straps from explicitly no straps). A logged set can still say yes or no.
 * - `wristPosition` is `neutral` where the technique holds the wrist straight (curls), `changing`
 *   where the wrist is the joint that moves, and `unknown` where the exercise does not define it
 *   (rows, pulldowns, hinges).
 * - `measure: "seconds"` and `deliberateHold` go together on hangs, holds, pinches and carries:
 *   the hold is the point of the set. A hanging leg raise is logged in reps and its grip is
 *   incidental, so it is not a deliberate hold.
 * - `elbowAngleDeg` is set only where the row itself defines the angle (the lever rows); it is
 *   never a guessed default.
 * - `catalogName` is checked against the catalog by forearmMappings.test.ts.
 */
/** The frozen columns: what the forearm atlas published, without the counting attributes added since. */
type Dims = Omit<ExerciseVariant, "id" | "replaces" | "catalogExerciseId" | "catalogName" | "sidedBy" | "legLaterality" | "sideAnchor" | "dimensions">;

/**
 * `sidedBy`, written at wave 0 for each of these variants (10-multi-region.md §3): the arm wherever
 * the arms are not bilateral, so the logger asks for an arm exactly where it asked before, and no
 * side anywhere else. Every variant is in exactly one list; nothing is defaulted. The values are
 * pinned by client/src/lib/specialization/regionContent.test.ts, where 188 and 264 (single-leg
 * Romanian deadlifts) are the only listed exceptions a later wave may change.
 */
const sidedByArm = new Set([
  46, 49, 52, 53, 56, 61, 127, 129, 131, 142, 188, 256, 257, 264, 338, 340, 342, 350, 379, 383, 384, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
]);
const sidedByNone = new Set([
  41, 42, 43, 44, 45, 47, 48, 50, 51, 54, 55, 57, 58, 59, 60, 62, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 121, 122, 123,
  124, 125, 126, 128, 130, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 143, 144, 145, 186, 187, 189, 202, 203, 204, 205, 231, 232, 234, 258, 263, 299, 300, 317,
  327, 331, 332, 336, 337, 339, 341, 399, 400, 401, 415, 416,
]);

function sidedByOf(catalogExerciseId: number): SidedBy {
  const arm = sidedByArm.has(catalogExerciseId);
  if (arm === sidedByNone.has(catalogExerciseId)) throw new Error(`Variant cat-${catalogExerciseId}: write its sidedBy in exactly one list`);
  return arm ? "arm" : "none";
}

const variant = (catalogExerciseId: number, catalogName: string, dims: Dims): ExerciseVariant => ({
  id: variantIdFor(catalogExerciseId),
  catalogExerciseId,
  catalogName,
  ...dims,
  sidedBy: sidedByOf(catalogExerciseId),
});

/** An elbow-flexion curl: the wrist is held straight, straps play no part. */
const curl = (forearmOrientation: ForearmOrientation, gripType: GripType, laterality: Laterality, notes: string): Dims => ({
  organization: "single_joint", forearmOrientation, wristPosition: "neutral", gripType, straps: "not_applicable",
  laterality, phase: "concentric_eccentric", measure: "reps", deliberateHold: false, elbowAngleDeg: null, notes,
});

/** A single-joint wrist, finger, thumb or forearm-rotation exercise: the small joint moves. */
const isolation = (forearmOrientation: ForearmOrientation, gripType: GripType, laterality: Laterality, notes: string, more: Partial<Dims> = {}): Dims => ({
  organization: "single_joint", forearmOrientation, wristPosition: "changing", gripType, straps: "not_applicable",
  laterality, phase: "concentric_eccentric", measure: "reps", deliberateHold: false, elbowAngleDeg: null, notes, ...more,
});

/** A row, pulldown, pull-up, hinge or shrug: the hands hold the load while bigger muscles move it. */
const pull = (forearmOrientation: ForearmOrientation, gripType: GripType, laterality: Laterality, notes: string | null = null): Dims => ({
  organization: "multi_joint", forearmOrientation, wristPosition: "unknown", gripType, straps: "unknown",
  laterality, phase: "concentric_eccentric", measure: "reps", deliberateHold: false, elbowAngleDeg: null, notes,
});

/** A hang, hold, pinch or carry: the hold is the purpose of the set, timed in seconds. */
const hold = (forearmOrientation: ForearmOrientation, gripType: GripType, laterality: Laterality, notes: string, more: Partial<Dims> = {}): Dims => ({
  organization: "task", forearmOrientation, wristPosition: "neutral", gripType, straps: "unknown",
  laterality, phase: "unspecified", measure: "seconds", deliberateHold: true, elbowAngleDeg: null, notes, ...more,
});

export const forearmV1Variants: ExerciseVariant[] = [
  // ------------------------------------------------------------ elbow-flexion curls
  variant(121, "Barbell Curl", curl("supinated", "underhand", "bilateral", "Straight bar, palms up.")),
  variant(122, "EZ-Bar Curl", curl("supinated", "underhand", "bilateral", "The angled grips turn the palms slightly in from full supination.")),
  variant(123, "Dumbbell Curl", curl("supinated", "underhand", "bilateral", "Two dumbbells, palms up, curled together (as photographed).")),
  variant(124, "Alternating Dumbbell Curl", curl("supinated", "underhand", "bilateral", "Arms alternate within the set, so every set works both arms once.")),
  variant(125, "Incline Dumbbell Curl", curl("supinated", "underhand", "bilateral", "Seated back on an incline bench, arms hanging behind the body; the photo alternates arms.")),
  variant(126, "Preacher Curl", curl("supinated", "underhand", "bilateral", "Upper arms on the preacher pad; an EZ bar in the photo.")),
  variant(127, "Machine Preacher Curl", curl("supinated", "underhand", "either", "Machines differ: one bar for both hands, or independent handles that allow one arm.")),
  variant(128, "Cable Curl", curl("supinated", "underhand", "bilateral", "Straight bar on a low pulley (as photographed).")),
  variant(129, "Bayesian Cable Curl", curl("supinated", "underhand", "unilateral", "One arm, facing away from a low pulley with the arm drawn behind the body.")),
  variant(130, "Spider Curl", curl("supinated", "underhand", "bilateral", "Chest on an incline bench, arms hanging straight down; a bar in the photo.")),
  variant(131, "Concentration Curl", curl("supinated", "underhand", "unilateral", "Seated, the working elbow braced against the inner thigh, one dumbbell.")),
  variant(132, "Hammer Curl", curl("neutral", "neutral", "bilateral", "Two dumbbells, palms facing in, curled together (as photographed).")),
  variant(133, "Cross-Body Hammer Curl", curl("neutral", "neutral", "bilateral", "Palms facing in, each dumbbell curled across the body; arms alternate within the set (as photographed).")),
  variant(134, "Rope Hammer Curl", curl("neutral", "neutral", "bilateral", "Rope on a low pulley, both hands, palms facing in.")),
  variant(135, "Reverse Curl", curl("pronated", "overhand", "bilateral", "Barbell, palms down (as photographed). The wrist is held straight, not curled.")),
  variant(136, "Zottman Curl", curl("changing", "unknown", "bilateral", "Curled up palms up, turned palms down at the top, lowered palms down; two dumbbells together (as photographed). The grip changes within each rep, which the grip vocabulary has no single word for.")),
  variant(137, "Drag Curl", curl("supinated", "underhand", "bilateral", "Bar kept against the body as the elbows travel back.")),
  variant(138, "Chin-Up Curl", { ...curl("supinated", "underhand", "bilateral", "Read as a body-weight curl from an underhand bar grip: the catalog gives no set-up beyond the name, and it is scored on reps like a chin-up. The hands hold body weight, so straps can be used and are not recorded."), straps: "unknown" }),
  variant(336, "Cable Biceps Curl", curl("supinated", "underhand", "bilateral", "Straight bar on a low pulley (as photographed).")),
  variant(337, "Rope Hammer Cable Curl", curl("neutral", "neutral", "bilateral", "Rope on a low pulley, palms facing in (as photographed).")),
  variant(338, "Incline Cable Curl", curl("supinated", "underhand", "either", "Back on an incline with the cable behind; the catalog does not say one handle or two.")),
  variant(339, "High Cable Curl", curl("supinated", "underhand", "bilateral", "Standing between two high pulleys, both arms (as photographed).")),
  variant(340, "Cable Concentration Curl", curl("supinated", "underhand", "unilateral", "One handle, the working elbow braced.")),
  variant(341, "Cable Spider Curl", curl("supinated", "underhand", "bilateral", "Chest on an incline bench facing a low pulley, a bar in both hands.")),
  variant(342, "Cross-Body Cable Curl", curl("neutral", "neutral", "unilateral", "One handle curled across the body, palm facing in; the catalog tags the brachialis and forearms as its main movers, as for a hammer curl.")),

  // ------------------------------------------------------------ wrist work
  variant(139, "Wrist Curl", isolation("supinated", "underhand", "bilateral", "Barbell, kneeling, forearms on a flat bench, palms up, wrists over the edge (as photographed).")),
  variant(140, "Reverse Wrist Curl", isolation("pronated", "overhand", "bilateral", "Barbell, kneeling, forearms on a flat bench, palms down, wrists over the edge (as photographed).")),
  variant(141, "Wrist Roller", isolation("pronated", "overhand", "bilateral", "Standing, arms held out in front, palms down, winding the cord up and back down (as photographed). Which way the roller is turned is not recorded.")),
  // The same roller with the direction recorded: palms down, the hands take turns winding.
  variant(415, "Wrist Roller, Extension Wind", isolation("pronated", "overhand", "bilateral", "Palms down, arms held out in front, winding the cord up by rolling the top of the roller toward you: each wrist bends back (extends) to wind, then the weight is lowered the same way.")),
  variant(416, "Wrist Roller, Flexion Wind", isolation("pronated", "overhand", "bilateral", "Palms down, arms held out in front, winding the cord up by rolling the top of the roller away from you: each wrist curls down (flexes) to wind, then the weight is lowered the same way.")),
  variant(350, "Cable Wrist Extension", isolation("pronated", "overhand", "either", "Palms down against a low pulley; the catalog does not say bar or single handle, or whether the forearm is supported.")),
  variant(410, "One-Arm Dumbbell Wrist Curl", isolation("supinated", "underhand", "unilateral", "Seated, forearm along the thigh, palm up, wrist past the knee (as photographed).")),
  variant(411, "One-Arm Dumbbell Reverse Wrist Curl", isolation("pronated", "overhand", "unilateral", "Seated, forearm along the thigh, palm down, wrist past the knee (as photographed).")),
  variant(407, "Lever Radial Deviation", isolation("neutral", "neutral", "unilateral", "Standing, arm straight at the side, holding the unloaded end of a dumbbell handle or hammer with the weight in front; the wrist tilts the weight up toward the thumb side.", { elbowAngleDeg: 0 })),
  variant(408, "Lever Ulnar Deviation", isolation("neutral", "neutral", "unilateral", "Standing, arm straight at the side, holding the unloaded end of a dumbbell handle or hammer with the weight behind; the wrist tilts the weight up toward the pinky side.", { elbowAngleDeg: 0 })),

  // ------------------------------------------------------------ forearm rotation
  variant(405, "Lever Pronation", isolation("changing", "neutral", "unilateral", "Seated, forearm supported on the thigh or a bench with the elbow bent to about 90 degrees, holding a handle loaded at one end (or a hammer); the forearm turns palm-down against the load's leverage.", { wristPosition: "neutral", elbowAngleDeg: 90 })),
  variant(406, "Lever Supination", isolation("changing", "neutral", "unilateral", "As Lever Pronation, turning palm-up. The elbow angle is part of the definition: with the elbow bent the biceps helps supinate, so the same exercise with a straight arm is a different task.", { wristPosition: "neutral", elbowAngleDeg: 90 })),

  // ------------------------------------------------------------ fingers and thumb
  variant(401, "Finger Curl", isolation("supinated", "fingers_only", "bilateral", "Seated, forearms on the thighs, palms up; the bar rolls down to the fingertips and is curled back into the palm (as photographed). The fingers must move: a bar held still is a wrist curl or a hold, not this.", { wristPosition: "neutral" })),
  variant(402, "Gripper Close", isolation("neutral", "crush", "unilateral", "A torsion-spring hand gripper closed fully and opened again, one hand at a time.", { wristPosition: "neutral" })),
  variant(403, "Gripper Hold", isolation("neutral", "crush", "unilateral", "A hand gripper squeezed shut and held closed, one hand at a time.", { wristPosition: "neutral", phase: "unspecified", measure: "seconds", deliberateHold: true })),
  variant(404, "Band Finger Extension", isolation("unknown", "open_hand", "unilateral", "A band around the fingertips; the fingers straighten and open against it. A wide band also spreads the fingers, which the hand's own muscles do; that part is not credited to the forearm.", { wristPosition: "neutral" })),
  variant(412, "Band Thumb Flexion", isolation("unknown", "thumb", "unilateral", "A band anchored over the thumb tip; the tip of the thumb bends against it, so the thumb's end joint must move.", { wristPosition: "neutral" })),
  variant(413, "Band Thumb Extension", isolation("unknown", "thumb", "unilateral", "A band over the back of the thumb; the thumb straightens against it at its knuckle and tip.", { wristPosition: "neutral" })),
  variant(414, "Band Thumb Abduction", isolation("unknown", "thumb", "unilateral", "A band around the thumb and fingers; the thumb moves away from the index finger in the plane of the palm.", { wristPosition: "neutral" })),

  // ------------------------------------------------------------ hangs, holds, pinches and carries
  variant(142, "Plate Pinch", hold("neutral", "pinch", "unilateral", "Two smooth plates pinched together between fingers and thumb, one hand, at the side (as photographed).", { straps: "not_applicable" })),
  variant(143, "Dead Hang", hold("pronated", "overhand", "bilateral", "Hanging from a bar with both hands, palms forward; body weight unless assisted or loaded.")),
  variant(144, "Towel Dead Hang", hold("neutral", "crush", "bilateral", "Hanging from two towels looped over a bar, gripped in the fists.")),
  variant(145, "Farmer Hold", hold("neutral", "neutral", "bilateral", "An implement in each hand, standing still.")),
  variant(299, "Farmer’s Walk", hold("neutral", "neutral", "bilateral", "An implement in each hand, walking (as photographed). Time is recorded; distance is not.")),
  variant(409, "Suitcase Carry", hold("neutral", "neutral", "unilateral", "One dumbbell or kettlebell in one hand, walking upright. Time is recorded; distance is not.")),
  variant(300, "Zercher Carry", hold("supinated", "none", "bilateral", "A barbell held in the crook of both elbows while walking; the hands do not hold the bar, so there is no grip.", { wristPosition: "unknown", straps: "not_applicable" })),

  // ------------------------------------------------------------ hanging core work (the grip is incidental)
  variant(231, "Hanging Leg Raise", pull("pronated", "overhand", "bilateral", "Hanging from a bar, palms forward; the set is counted in leg raises, and the grip holds the body throughout.")),
  variant(232, "Hanging Knee Raise", pull("pronated", "overhand", "bilateral", "Hanging from a bar, palms forward; the set is counted in knee raises, and the grip holds the body throughout.")),
  variant(234, "Toes-to-Bar", pull("pronated", "overhand", "bilateral", "Hanging from a bar, palms forward; the grip holds the body throughout.")),

  // ------------------------------------------------------------ rows
  variant(43, "Barbell Bent-Over Row", pull("pronated", "overhand", "bilateral")),
  variant(44, "Pendlay Row", pull("pronated", "overhand", "bilateral", "Each rep starts from the floor.")),
  variant(45, "Underhand Barbell Row", pull("supinated", "underhand", "bilateral")),
  variant(46, "Dumbbell Row", pull("neutral", "neutral", "unilateral", "One dumbbell, the other hand and knee on a bench (as photographed).")),
  variant(47, "Chest-Supported Dumbbell Row", pull("unknown", "unknown", "bilateral", "Two dumbbells, chest on an incline bench; palm direction varies.")),
  variant(48, "Seal Row", pull("unknown", "unknown", "bilateral", "Prone on a raised flat bench; a bar or two dumbbells.")),
  variant(49, "Meadows Row", pull("pronated", "overhand", "unilateral", "One hand, overhand on the end of a landmine bar.")),
  variant(50, "T-Bar Row", pull("neutral", "neutral", "bilateral", "Close neutral handle (as photographed).")),
  variant(51, "Chest-Supported T-Bar Row", pull("unknown", "unknown", "bilateral", "Handles vary by machine.")),
  variant(52, "Machine High Row", pull("unknown", "unknown", "either", "Handles vary; independent handles allow one arm at a time.")),
  variant(53, "Machine Low Row", pull("unknown", "unknown", "either", "Handles vary; independent handles allow one arm at a time.")),
  variant(54, "Seated Cable Row", pull("neutral", "neutral", "bilateral", "V-handle (as photographed).")),
  variant(55, "Wide-Grip Cable Row", pull("pronated", "overhand", "bilateral", "Wide bar.")),
  variant(56, "Single-Arm Cable Row", pull("neutral", "neutral", "unilateral", "One handle.")),
  variant(75, "Inverted Row", pull("pronated", "overhand", "bilateral", "Body under a fixed bar, feet on the floor.")),
  variant(76, "Feet-Elevated Inverted Row", pull("pronated", "overhand", "bilateral", "Body under a fixed bar, feet raised.")),
  variant(77, "Ring Row", pull("unknown", "unknown", "bilateral", "Rings let the hands turn through the pull.")),
  variant(256, "Landmine Row", pull("unknown", "unknown", "unilateral", "One hand on the end of the bar (as photographed).")),
  variant(257, "Meadows Landmine Row", pull("pronated", "overhand", "unilateral", "One hand, overhand on the end of the bar.")),
  variant(258, "Landmine T-Bar Row", pull("neutral", "neutral", "bilateral", "Close neutral handle under the bar (as photographed).")),
  variant(317, "Cable Upright Row", pull("pronated", "overhand", "bilateral", "Bar from a low pulley, pulled up the front of the body.")),
  variant(331, "Low Cable Row", pull("neutral", "neutral", "bilateral", "V-handle (as photographed).")),
  variant(332, "Rope Cable Row", pull("neutral", "neutral", "bilateral", "Rope handle.")),
  variant(379, "Cable Rotational Row", pull("unknown", "unknown", "unilateral", "One handle, with trunk rotation.")),
  variant(383, "Chest-Supported Landmine Row", pull("unknown", "unknown", "either", "The catalog does not say one hand or two.")),
  variant(384, "Offset Landmine Row", pull("unknown", "unknown", "unilateral", "Standing beside the bar, one hand.")),

  // ------------------------------------------------------------ pulldowns, pull-ups and chin-ups
  variant(57, "Lat Pulldown", pull("pronated", "overhand", "bilateral")),
  variant(58, "Wide-Grip Lat Pulldown", pull("pronated", "overhand", "bilateral")),
  variant(59, "Neutral-Grip Lat Pulldown", pull("neutral", "neutral", "bilateral")),
  variant(60, "Underhand Lat Pulldown", pull("supinated", "underhand", "bilateral")),
  variant(61, "Single-Arm Lat Pulldown", pull("unknown", "unknown", "unilateral", "One handle.")),
  variant(62, "Straight-Arm Cable Pulldown", pull("pronated", "overhand", "bilateral", "The arms stay straight: the elbows do not bend under load.")),
  variant(327, "Wide-Grip Cable Lat Pulldown", pull("pronated", "overhand", "bilateral")),
  variant(66, "Pull-Up", pull("pronated", "overhand", "bilateral")),
  variant(67, "Chin-Up", pull("supinated", "underhand", "bilateral")),
  variant(68, "Neutral-Grip Pull-Up", pull("neutral", "neutral", "bilateral")),
  variant(69, "Wide-Grip Pull-Up", pull("pronated", "overhand", "bilateral")),
  variant(70, "Weighted Pull-Up", pull("pronated", "overhand", "bilateral")),
  variant(71, "Weighted Chin-Up", pull("supinated", "underhand", "bilateral")),
  variant(72, "Commando Pull-Up", pull("neutral", "neutral", "bilateral", "Hands close together along the bar, one in front of the other, palms facing each other.")),
  variant(73, "Archer Pull-Up", pull("pronated", "overhand", "bilateral", "Both hands on the bar; one arm does most of the pull while the other stays nearly straight.")),
  variant(74, "L-Sit Pull-Up", pull("pronated", "overhand", "bilateral", "Pull-up with the legs held out in front.")),
  variant(78, "Towel Pull-Up", pull("neutral", "crush", "bilateral", "Pulling up on towels looped over a bar, gripped in the fists.")),
  variant(79, "Scapular Pull-Up", pull("pronated", "overhand", "bilateral", "The arms stay straight: only the shoulder blades move.")),
  variant(80, "Rope Climb", pull("neutral", "crush", "bilateral", "Hand over hand up a hanging rope.")),

  // ------------------------------------------------------------ deadlifts, hinges and shrugs
  variant(41, "Conventional Deadlift", pull("unknown", "unknown", "bilateral", "The grip varies (double overhand, mixed, hook) and is not recorded.")),
  variant(42, "Romanian Deadlift", pull("unknown", "unknown", "bilateral", "Barbell; the grip is not recorded. The catalog has a second Romanian Deadlift (186).")),
  variant(186, "Romanian Deadlift", pull("unknown", "unknown", "bilateral", "Barbell; the grip is not recorded. The catalog has a second Romanian Deadlift (42).")),
  variant(187, "Stiff-Leg Deadlift", pull("unknown", "unknown", "bilateral", "Barbell; the grip is not recorded.")),
  variant(188, "Single-Leg Romanian Deadlift", pull("unknown", "unknown", "either", "One implement or two; the catalog does not say.")),
  variant(189, "Dumbbell Romanian Deadlift", pull("pronated", "overhand", "bilateral", "Two dumbbells in front of the thighs, palms toward the body.")),
  variant(202, "Cable Pull-Through", pull("neutral", "neutral", "bilateral", "Rope between the legs from a low pulley.")),
  variant(203, "Kettlebell Swing", pull("pronated", "overhand", "bilateral", "Both hands on one bell.")),
  variant(204, "Barbell Hip Hinge", pull("unknown", "unknown", "bilateral", "Barbell held in the hands; the grip is not recorded.")),
  variant(205, "B-Stance Romanian Deadlift", pull("unknown", "unknown", "bilateral", "A barbell or two dumbbells; both hands hold load.")),
  variant(263, "Landmine Romanian Deadlift", pull("unknown", "unknown", "bilateral", "Both hands on the end of the bar.")),
  variant(264, "Landmine Single-Leg Romanian Deadlift", pull("unknown", "unknown", "either", "One hand or two on the end of the bar; the catalog does not say.")),
  variant(81, "Barbell Shrug", pull("pronated", "overhand", "bilateral")),
  variant(82, "Dumbbell Shrug", pull("neutral", "neutral", "bilateral", "Dumbbells at the sides.")),
  variant(83, "Trap-Bar Shrug", pull("neutral", "neutral", "bilateral")),
  variant(84, "Cable Shrug", pull("unknown", "unknown", "bilateral", "A bar or two handles.")),
  variant(85, "Machine Shrug", pull("unknown", "unknown", "bilateral", "Handles vary by machine.")),
  variant(86, "Incline Dumbbell Shrug", pull("unknown", "unknown", "bilateral", "Chest on an incline bench, two dumbbells.")),

  // ------------------------------------------------------------ battle ropes
  variant(399, "Battle Rope Slams", { ...pull("unknown", "crush", "bilateral", "A rope end in each fist, both arms slamming together."), straps: "not_applicable", phase: "unspecified" }),
  variant(400, "Battle Rope Alternating Waves", { ...pull("unknown", "crush", "bilateral", "A rope end in each fist, arms alternating; worked for time."), straps: "not_applicable", phase: "unspecified", measure: "seconds" }),
];
