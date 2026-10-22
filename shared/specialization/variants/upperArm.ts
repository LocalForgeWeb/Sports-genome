import type { ExerciseVariant, ForearmOrientation, GripType, Laterality, SidedBy } from "../types";
import { variantIdFor } from "../ids";
import type { VariantDimensions } from "./dimensions";

/**
 * Wave A's new variants (docs/specialization-atlas/10-multi-region.md §3, §9.1): one `cat-<id>` for
 * every catalog exercise the upper arm has to decide that has no forearm variant yet, plus the
 * untagged exercises that load the upper arm's actions. The list, its count and how it was derived
 * are in docs/specialization-atlas/regions/variants.md; client/src/lib/specialization/variants.test.ts
 * recomputes it from the catalog.
 *
 * Read the columns as the forearm's 119 are read (05-mappings.md "Method"; variants/forearm.ts):
 * - The exercise's name decides, then its photograph where the catalog shows one
 *   (client/public/exercise-thumbs/, named in client/src/data/exercisePhotos.json). "(as
 *   photographed)" marks what only the photograph says. Never the catalog's `unilateral` quality.
 * - `laterality`: `bilateral` when both arms work in every set (a bar, two implements, both hands
 *   on one handle or ball, arms alternating within the set, both hands on the floor); `unilateral`
 *   for one-arm exercises; `either` where neither the name nor the photograph settles it (a
 *   machine with handles that may move apart, a landmine or cable press done with one hand or two).
 * - The forearm columns are filled honestly, never defaulted: `gripType` `none` where the hands
 *   are flat supports (push-ups) or hold nothing (the Zercher squat), `open_hand` where open hands
 *   hold a ball or plates; `wristPosition` `extended` where flat hands bear weight, `neutral` on
 *   single-joint arm work, `unknown` on presses and pulls, which do not define it; `straps`
 *   `unknown` on pulls (straps can be used), `not_applicable` on pushes, throws and arm isolation.
 *   No exercise here leaves the hands with nothing to do, so no `laterality` is `not_applicable`.
 * - `sidedBy`, written on every record: `arm` where the arms are not bilateral, `none` where they
 *   are, as the forearm's were written at wave 0. The both-limb variants (one-sided for the arms
 *   and the legs) are listed with their decision in bothLimbs.ts. Leg-only attributes
 *   (`legLaterality`, `sideAnchor`, and the `stance` and `knee` dimensions) are the leg waves' to
 *   write and are left out.
 * - Descriptive dimensions are the ones the upper arm's rationales cite: `shoulder` (where the
 *   upper arm is held, which sets the length of the two-joint long heads), `bench`, `torso`,
 *   `plane` (the line of a press or pull relative to the trunk: `horizontal` away from or toward
 *   the chest, `vertical` overhead or down from overhead, `diagonal` between) and `grip_width`
 *   where the name or photograph defines it. A dimension is left out where the exercise does not
 *   say, rather than guessed.
 */

/** The variant's own columns, as the database's `exercise_variants` row holds them. */
type Columns = Omit<ExerciseVariant, "id" | "replaces" | "catalogExerciseId" | "catalogName" | "sidedBy" | "legLaterality" | "sideAnchor" | "dimensions">;

const variant = (catalogExerciseId: number, catalogName: string, sidedBy: SidedBy, columns: Columns, dimensions: VariantDimensions): ExerciseVariant => ({
  id: variantIdFor(catalogExerciseId),
  catalogExerciseId,
  catalogName,
  ...columns,
  sidedBy,
  dimensions,
});

const columns = (organization: Columns["organization"], forearmOrientation: ForearmOrientation, wristPosition: Columns["wristPosition"], gripType: GripType, straps: Columns["straps"], laterality: Laterality, notes: string, more: Partial<Columns> = {}): Columns => ({
  organization, forearmOrientation, wristPosition, gripType, straps, laterality, phase: "concentric_eccentric", measure: "reps", deliberateHold: false, elbowAngleDeg: null, notes, ...more,
});

/** A press with a bar, dumbbells, a cable or a machine: the elbows straighten as the arms push. */
const press = (o: ForearmOrientation, g: GripType, l: Laterality, notes: string, more: Partial<Columns> = {}) => columns("multi_joint", o, "unknown", g, "not_applicable", l, notes, more);
/** A push-up or handstand push-up: flat hands bear the body's weight, wrists bent back. */
const pushUp = (notes: string, more: Partial<Columns> = {}) => columns("multi_joint", "pronated", "extended", "none", "not_applicable", "bilateral", notes, more);
/** An elbow extension or a raise: one joint moves, the wrist is held straight. */
const isolation = (o: ForearmOrientation, g: GripType, l: Laterality, notes: string, more: Partial<Columns> = {}) => columns("single_joint", o, "neutral", g, "not_applicable", l, notes, more);
/** A row, pulldown or pull: the hands hold the load; straps can be used and are not recorded. */
const pull = (o: ForearmOrientation, g: GripType, l: Laterality, notes: string) => columns("multi_joint", o, "unknown", g, "unknown", l, notes);
/** A medicine-ball throw or slam: the ball leaves the hands. */
const ball = (notes: string) => columns("multi_joint", "unknown", "unknown", "open_hand", "not_applicable", "bilateral", notes, { phase: "unspecified" });

// Descriptive dimensions shared by many rows.
const flat: VariantDimensions = { bench: "flat", torso: "supine", plane: "horizontal", shoulder: "changing" };
const incline: VariantDimensions = { bench: "incline", torso: "inclined", plane: "diagonal", shoulder: "changing" };
const decline: VariantDimensions = { bench: "decline", torso: "supine", plane: "diagonal", shoulder: "changing" };
const standingPress: VariantDimensions = { torso: "upright", plane: "horizontal", shoulder: "changing" };
const overhead: VariantDimensions = { torso: "upright", plane: "vertical", shoulder: "changing" };
const landmine: VariantDimensions = { torso: "upright", plane: "diagonal", shoulder: "changing" };
const pushUpDims: VariantDimensions = { torso: "horizontal", plane: "horizontal", shoulder: "changing" };
const dip: VariantDimensions = { torso: "upright", plane: "vertical", shoulder: "changing" };
const armAtSide: VariantDimensions = { torso: "upright", shoulder: "neutral" };
const armOverhead: VariantDimensions = { torso: "upright", shoulder: "overhead" };
const moving: VariantDimensions = { shoulder: "changing" };

export const upperArmVariants: ExerciseVariant[] = [
  // ------------------------------------------------------------ presses: bench, machine and cable
  variant(1, "Barbell Bench Press", "none", press("pronated", "overhand", "bilateral", "Flat bench, medium grip (as photographed)."), { ...flat, grip_width: "shoulder" }),
  variant(2, "Incline Barbell Bench Press", "none", press("pronated", "overhand", "bilateral", "Incline bench, medium grip (as photographed)."), { ...incline, grip_width: "shoulder" }),
  variant(3, "Decline Barbell Bench Press", "none", press("pronated", "overhand", "bilateral", "Decline bench, head below the hips."), decline),
  variant(4, "Dumbbell Bench Press", "none", press("pronated", "overhand", "bilateral", "Flat bench, two dumbbells, palms toward the feet (as photographed)."), flat),
  variant(5, "Incline Dumbbell Bench Press", "none", press("pronated", "overhand", "bilateral", "Incline bench, two dumbbells (as photographed)."), incline),
  variant(6, "Decline Dumbbell Bench Press", "none", press("pronated", "overhand", "bilateral", "Decline bench, two dumbbells (as photographed)."), decline),
  variant(7, "Dumbbell Floor Press", "none", press("unknown", "unknown", "bilateral", "Lying on the floor, two dumbbells; the upper arms stop on the floor, so the bottom of the press is cut short."), { bench: "none", torso: "supine", plane: "horizontal", shoulder: "changing" }),
  variant(8, "Dumbbell Squeeze Press", "none", press("neutral", "neutral", "bilateral", "Flat bench, two dumbbells pressed together, palms facing (as photographed)."), { ...flat, grip_width: "narrow" }),
  variant(9, "Alternating Dumbbell Bench Press", "none", press("unknown", "unknown", "bilateral", "Two dumbbells, the arms taking turns within the set, so every set works both arms."), flat),
  variant(10, "Single-Arm Dumbbell Bench Press", "arm", press("pronated", "overhand", "unilateral", "Flat bench, one dumbbell (as photographed)."), flat),
  variant(11, "Machine Chest Press", "arm", press("pronated", "overhand", "either", "Seated; machines differ: one bar, or handles that move apart and allow one arm. Palms down (as photographed)."), { torso: "upright", plane: "horizontal", shoulder: "changing" }),
  variant(12, "Incline Machine Chest Press", "arm", press("unknown", "unknown", "either", "Seated, pressing up and forward; machines differ: one bar, or handles that allow one arm."), { torso: "upright", plane: "diagonal", shoulder: "changing" }),
  variant(13, "Plate-Loaded Chest Press", "arm", press("pronated", "overhand", "either", "Seated plate-loaded machine; the arms may move apart and allow one arm. Palms down (as photographed)."), { torso: "upright", plane: "horizontal", shoulder: "changing" }),
  variant(14, "Smith Machine Bench Press", "none", press("pronated", "overhand", "bilateral", "Flat bench under a guided bar."), flat),
  variant(15, "Smith Machine Incline Press", "none", press("pronated", "overhand", "bilateral", "Incline bench under a guided bar."), incline),
  variant(16, "Cable Chest Press", "none", press("pronated", "overhand", "bilateral", "Seated between two pulleys, a handle in each hand (as photographed)."), standingPress),
  variant(17, "Single-Arm Cable Chest Press", "arm", press("unknown", "unknown", "unilateral", "One handle; the catalog does not say standing or seated."), { plane: "horizontal", shoulder: "changing" }),
  variant(25, "Plate Squeeze Press", "none", press("neutral", "open_hand", "bilateral", "Standing, two plates squeezed between flat palms at the chest and pressed forward (as photographed)."), { ...standingPress, grip_width: "narrow" }),
  variant(301, "Cable Press Around", "arm", press("unknown", "unknown", "either", "The handle is pressed forward and around across the body; one arm or both, which the catalog does not say."), standingPress),
  variant(302, "Split-Stance Cable Chest Press", "none", press("unknown", "unknown", "bilateral", "Standing in a split stance between two pulleys, a handle in each hand (as photographed); the legs brace and do not move."), standingPress),
  variant(303, "Half-Kneeling Cable Chest Press", "arm", press("unknown", "unknown", "either", "Kneeling on one knee, the other foot forward; one handle or two, which the catalog does not say. The legs brace and do not move."), standingPress),
  variant(304, "Cable Squeeze Press", "none", press("neutral", "neutral", "bilateral", "Two handles pressed forward while squeezed together."), { ...standingPress, grip_width: "narrow" }),
  variant(305, "Cable Incline Press", "none", press("unknown", "unknown", "bilateral", "Incline bench between two low pulleys, a handle in each hand (as photographed)."), incline),
  variant(306, "Cable Decline Press", "none", press("unknown", "unknown", "bilateral", "Pressing down and forward against two cables; the catalog does not say on a bench or standing."), { plane: "diagonal", shoulder: "changing" }),
  variant(307, "Neutral-Grip Cable Chest Press", "none", press("neutral", "neutral", "bilateral", "A handle in each hand, palms facing; seated (as photographed)."), standingPress),
  variant(308, "Single-Arm Cable Floor Press", "arm", press("unknown", "unknown", "unilateral", "Lying on the floor, one handle; the upper arm stops on the floor, so the bottom of the press is cut short."), { bench: "none", torso: "supine", plane: "horizontal", shoulder: "changing" }),
  variant(323, "Cable Standing Punch", "arm", press("unknown", "unknown", "unilateral", "One handle punched forward from a standing stance, the trunk turning with it."), standingPress),
  variant(324, "Cable Incline Press-Around", "arm", press("unknown", "unknown", "either", "Pressing up, forward and across the body; one arm or both, which the catalog does not say."), { torso: "upright", plane: "diagonal", shoulder: "changing" }),
  variant(325, "Cable Front-Foot-Elevated Press", "arm", press("unknown", "unknown", "either", "Split stance with the front foot raised; one handle or two, which the catalog does not say. The legs brace and do not move."), standingPress),
  variant(249, "Pallof Press", "none", press("unknown", "unknown", "bilateral", "Standing side-on to the pulley, one handle held at the chest in both hands and pressed straight out against the cable's pull to turn (as photographed)."), standingPress),
  variant(310, "Cable Press-Out", "none", press("unknown", "unknown", "bilateral", "One handle in both hands pressed straight out from the chest, side-on to the pulley (photographed as the Pallof press)."), standingPress),
  variant(322, "Cable Serratus Punch", "arm", columns("single_joint", "unknown", "unknown", "unknown", "not_applicable", "either", "The arm is held straight out in front and the shoulder blade moves it further forward; the elbow does not bend. One arm or both, which the catalog does not say."), { torso: "upright", plane: "horizontal", shoulder: "flexed" }),
  variant(309, "Cable Resisted Push-Up", "none", pushUp("A push-up against a cable across the back."), pushUpDims),

  // ------------------------------------------------------------ presses: overhead
  variant(101, "Barbell Overhead Press", "none", press("pronated", "overhand", "bilateral", "Standing (as photographed)."), { ...overhead, bench: "none" }),
  variant(102, "Seated Barbell Overhead Press", "none", press("pronated", "overhand", "bilateral", "Seated upright (as photographed)."), overhead),
  variant(103, "Dumbbell Shoulder Press", "none", press("pronated", "overhand", "bilateral", "Two dumbbells, palms forward; seated upright (as photographed), though the name does not say so."), overhead),
  variant(104, "Seated Dumbbell Shoulder Press", "none", press("pronated", "overhand", "bilateral", "Seated upright, two dumbbells, palms forward (as photographed)."), overhead),
  variant(105, "Arnold Press", "none", press("changing", "unknown", "bilateral", "Two dumbbells, palms toward the face at the bottom, turned to face forward as they are pressed (as photographed). The grip changes within each rep, which the grip vocabulary has no single word for."), overhead),
  variant(106, "Machine Shoulder Press", "arm", press("pronated", "overhand", "either", "Seated; machines differ: one bar, or handles that allow one arm. Palms forward (as photographed)."), overhead),
  variant(107, "Smith Machine Shoulder Press", "none", press("pronated", "overhand", "bilateral", "Seated under a guided bar (as photographed)."), overhead),
  variant(108, "Single-Arm Dumbbell Overhead Press", "arm", press("unknown", "unknown", "unilateral", "Standing, one dumbbell pressed; the photograph shows a second dumbbell held still at the other side."), { ...overhead, bench: "none" }),
  variant(109, "Z-Press", "none", press("unknown", "unknown", "bilateral", "Seated on the floor with the legs straight, pressing a bar or two dumbbells overhead."), { ...overhead, bench: "none" }),
  variant(110, "Push Press", "none", press("pronated", "overhand", "bilateral", "Standing, a barbell driven up by a dip and drive of the legs, then pressed out (as photographed)."), { ...overhead, bench: "none" }),
  variant(120, "Handstand Push-Up", "none", pushUp("Upside down, feet against a wall (as photographed), lowering the head toward the floor and pressing back up."), { plane: "vertical", shoulder: "changing" }),

  // ------------------------------------------------------------ presses: landmine
  variant(251, "Landmine Press", "arm", press("unknown", "unknown", "unilateral", "One hand on the end of the bar, standing in a staggered stance (as photographed)."), landmine),
  variant(252, "Half-Kneeling Landmine Press", "arm", press("unknown", "unknown", "either", "Kneeling on one knee, the other foot forward; one hand or two on the end of the bar, which the catalog does not say. The legs brace and do not move."), landmine),
  variant(253, "Single-Arm Standing Landmine Press", "arm", press("unknown", "unknown", "unilateral", "One hand on the end of the bar, standing (as photographed)."), landmine),
  variant(254, "Landmine Push Press", "arm", press("unknown", "unknown", "either", "The bar end driven up by a dip and drive of the legs, then pressed out; one hand or two, which the catalog does not say."), landmine),
  variant(255, "Landmine Squat-to-Press", "none", press("unknown", "unknown", "bilateral", "Both hands on the end of the bar, a squat straight into a press (as photographed)."), landmine),
  variant(267, "Landmine Anti-Rotation Press", "arm", press("unknown", "unknown", "either", "A landmine press that resists the trunk turning; the catalog gives no set-up beyond the name, so one hand or two is open."), landmine),
  variant(268, "Landmine Thruster", "none", press("unknown", "unknown", "bilateral", "Both hands on the end of the bar, a squat straight into a press (as photographed)."), landmine),
  variant(269, "Landmine Clean and Press", "arm", press("unknown", "unknown", "either", "The bar end pulled from low to the shoulder, then pressed; one hand or two, which the catalog does not say."), landmine),
  variant(270, "Landmine Split Jerk", "arm", press("unknown", "unknown", "either", "The bar end driven up while the feet split into a lunge to catch it; one hand or two, and which foot goes forward, the catalog does not say."), landmine),
  variant(381, "Alternating Landmine Press", "none", press("unknown", "unknown", "bilateral", "The hands take turns pressing within the set, so every set works both arms."), landmine),
  variant(382, "Tall-Kneeling Landmine Press", "arm", press("unknown", "unknown", "either", "Kneeling on both knees, hips straight; one hand or two on the end of the bar, which the catalog does not say."), landmine),
  variant(386, "Landmine Split Press", "arm", press("unknown", "unknown", "either", "Standing in a split stance; one hand or two on the end of the bar, which the catalog does not say. The legs brace and do not move."), landmine),
  variant(389, "Kettlebell Clean and Press", "arm", press("changing", "unknown", "either", "A kettlebell pulled from between the legs to the shoulder, then pressed overhead; one bell or two, which the catalog does not say. The hand turns around the handle in the clean."), overhead),

  // ------------------------------------------------------------ push-ups and dips
  variant(26, "Standard Push-Up", "none", pushUp("Hands about shoulder width (as photographed)."), { ...pushUpDims, grip_width: "shoulder" }),
  variant(27, "Wide-Grip Push-Up", "none", pushUp("Hands wider than the shoulders."), { ...pushUpDims, grip_width: "wide" }),
  variant(28, "Diamond Push-Up", "none", pushUp("Hands together under the chest, thumbs and index fingers forming a diamond."), { ...pushUpDims, grip_width: "narrow" }),
  variant(29, "Decline Push-Up", "none", pushUp("Feet raised on a box (as photographed), so the arms push toward the head."), { plane: "diagonal", shoulder: "changing" }),
  variant(30, "Incline Push-Up", "none", pushUp("Hands raised on a box (as photographed), so the arms push toward the hips.", { wristPosition: "unknown" }), { torso: "inclined", plane: "diagonal", shoulder: "changing" }),
  variant(31, "Archer Push-Up", "none", pushUp("Both hands on the floor, wide; one arm does most of the push while the other stays nearly straight, as on the Archer Pull-Up."), { ...pushUpDims, grip_width: "wide" }),
  variant(32, "Plyometric Push-Up", "none", pushUp("Pushed hard enough for the hands to leave the floor."), pushUpDims),
  variant(33, "Clap Push-Up", "none", pushUp("Pushed hard enough to clap before the hands land."), pushUpDims),
  variant(34, "Explosive Depth Push-Up", "none", pushUp("Dropped from raised hand supports to the floor and pushed straight back up."), pushUpDims),
  variant(35, "Deficit Push-Up", "none", pushUp("Hands raised on blocks or handles so the chest sinks below them.", { forearmOrientation: "unknown", wristPosition: "unknown", gripType: "unknown" }), pushUpDims),
  variant(36, "Ring Push-Up", "none", pushUp("Hands on rings or straps, body inclined (as photographed); the rings let the hands turn.", { forearmOrientation: "unknown", wristPosition: "unknown", gripType: "neutral" }), { torso: "inclined", plane: "horizontal", shoulder: "changing" }),
  variant(37, "Weighted Push-Up", "none", pushUp("A load on the back."), pushUpDims),
  variant(38, "Spiderman Push-Up", "none", pushUp("A knee drawn to the elbow on each rep, the legs taking turns within the set."), pushUpDims),
  variant(39, "Typewriter Push-Up", "none", pushUp("Hands wide; the body shifts toward one hand and then the other at the bottom (as photographed), so both arms work every set."), { ...pushUpDims, grip_width: "wide" }),
  variant(272, "Explosive Medicine-Ball Push-Up", "none", pushUp("A push-up with a hand on a medicine ball, pushed off explosively; the catalog does not say one hand or both on the ball.", { wristPosition: "unknown" }), pushUpDims),
  variant(40, "Parallel-Bar Dip", "none", press("neutral", "neutral", "bilateral", "Body weight on parallel bars, palms facing in."), dip),
  variant(158, "Bench Dip", "none", columns("multi_joint", "pronated", "extended", "none", "not_applicable", "bilateral", "Hands on the edge of a bench behind the hips, feet on a second box (as photographed); the elbows bend and straighten."), dip),
  variant(159, "Ring Dip", "none", press("neutral", "neutral", "bilateral", "Body weight on rings, palms facing in at the bottom (as photographed)."), dip),

  // ------------------------------------------------------------ triceps: close-grip presses and extensions
  variant(146, "Close-Grip Bench Press", "none", press("pronated", "overhand", "bilateral", "Flat bench, hands about shoulder width or closer (as photographed)."), { ...flat, grip_width: "narrow" }),
  variant(147, "JM Press", "none", press("pronated", "overhand", "bilateral", "Flat bench, close grip: the bar is lowered toward the throat by bending the elbows, then pressed up; part press, part skull crusher."), { ...flat, grip_width: "narrow" }),
  variant(148, "Skull Crusher", "none", isolation("pronated", "overhand", "bilateral", "Flat bench, an EZ bar lowered toward the forehead by bending the elbows, upper arms upright (as photographed)."), { bench: "flat", torso: "supine", shoulder: "flexed" }),
  variant(149, "Dumbbell Skull Crusher", "none", isolation("neutral", "neutral", "bilateral", "Flat bench, two dumbbells, palms facing, upper arms upright (as photographed)."), { bench: "flat", torso: "supine", shoulder: "flexed" }),
  variant(150, "Cable Triceps Pushdown", "none", isolation("pronated", "overhand", "bilateral", "A bar on a high pulley, palms down, elbows at the sides (as photographed)."), armAtSide),
  variant(151, "Rope Triceps Pushdown", "none", isolation("neutral", "neutral", "bilateral", "A rope on a high pulley, palms facing, elbows at the sides (as photographed)."), armAtSide),
  variant(152, "Reverse-Grip Pushdown", "none", isolation("supinated", "underhand", "bilateral", "A bar on a high pulley, palms up, elbows at the sides (as photographed)."), armAtSide),
  variant(153, "Single-Arm Cable Pushdown", "arm", isolation("supinated", "underhand", "unilateral", "One handle on a high pulley, palm up, elbow at the side (as photographed)."), armAtSide),
  variant(343, "Cable Triceps Pressdown", "none", isolation("pronated", "overhand", "bilateral", "A bar on a high pulley, palms down, elbows at the sides (as photographed)."), armAtSide),
  variant(344, "Rope Cable Pressdown", "none", isolation("neutral", "neutral", "bilateral", "A rope on a high pulley, palms facing, elbows at the sides (as photographed)."), armAtSide),
  variant(345, "Reverse-Grip Cable Pressdown", "none", isolation("supinated", "underhand", "bilateral", "A bar on a high pulley, palms up, elbows at the sides (as photographed)."), armAtSide),
  variant(346, "Single-Arm Cable Pressdown", "arm", isolation("supinated", "underhand", "unilateral", "One handle on a high pulley, palm up, elbow at the side (as photographed)."), armAtSide),
  variant(154, "Overhead Cable Triceps Extension", "none", isolation("neutral", "neutral", "bilateral", "Facing away from the pulley, a rope behind the head, upper arms overhead (as photographed)."), armOverhead),
  variant(349, "Cable Overhead Triceps Extension", "none", isolation("neutral", "neutral", "bilateral", "Facing away from the pulley, a rope behind the head, upper arms overhead (as photographed)."), armOverhead),
  variant(155, "Dumbbell Overhead Triceps Extension", "none", isolation("unknown", "unknown", "bilateral", "Standing, one dumbbell held overhead in both hands, cupped under its top end, and lowered behind the head (as photographed)."), armOverhead),
  variant(156, "Single-Arm Dumbbell Triceps Extension", "arm", isolation("unknown", "unknown", "unilateral", "One dumbbell held overhead and lowered behind the head (as photographed)."), armOverhead),
  variant(157, "Machine Triceps Extension", "arm", isolation("unknown", "unknown", "either", "Seated, upper arms on a pad raised in front (as photographed); machines differ: one bar, or handles that allow one arm."), { torso: "upright", shoulder: "flexed" }),
  variant(160, "Bodyweight Triceps Extension", "none", isolation("unknown", "unknown", "bilateral", "Leaning into a bar or straps held in both hands, the head lowered toward the hands by bending the elbows; the catalog gives no set-up beyond the name.", { wristPosition: "unknown" }), { torso: "inclined", shoulder: "flexed" }),
  variant(347, "Cross-Body Cable Triceps Extension", "arm", isolation("unknown", "unknown", "either", "The handle is drawn across the body and the elbow straightened; one arm, or both with crossed cables, which the catalog does not say."), { torso: "upright" }),
  variant(348, "Cable Triceps Kickback", "arm", isolation("unknown", "unknown", "either", "The upper arm held back beside the trunk while the elbow straightens; one handle or two, which the catalog does not say."), { shoulder: "extended" }),

  // ------------------------------------------------------------ pullovers and straight-arm pulls (shoulder extension)
  variant(24, "Dumbbell Pullover", "none", columns("multi_joint", "unknown", "unknown", "open_hand", "not_applicable", "bilateral", "Lying across a flat bench, one dumbbell held in both hands by its top end and swung from behind the head to over the chest, elbows nearly straight (as photographed)."), { bench: "flat", torso: "supine", shoulder: "changing" }),
  variant(65, "Dumbbell Pullover", "none", columns("multi_joint", "unknown", "unknown", "open_hand", "not_applicable", "bilateral", "Lying across a flat bench, one dumbbell held in both hands by its top end and swung from behind the head to over the chest, elbows nearly straight (as photographed). The catalog has a second Dumbbell Pullover (24)."), { bench: "flat", torso: "supine", shoulder: "changing" }),
  variant(63, "Cable Pullover", "none", pull("unknown", "unknown", "bilateral", "A bar or rope in both hands, drawn in an arc with the elbows nearly straight; the catalog does not say lying or standing."), moving),
  variant(64, "Machine Pullover", "none", pull("unknown", "unknown", "bilateral", "Seated, the arms move one lever in an arc with the elbows nearly straight."), { torso: "upright", shoulder: "changing" }),
  variant(328, "Cable Straight-Arm Pulldown", "none", pull("pronated", "overhand", "bilateral", "A bar on a high pulley drawn down to the thighs with the elbows straight (as photographed)."), { torso: "upright", plane: "vertical", shoulder: "changing" }),

  // ------------------------------------------------------------ rows, pulldowns and pulls
  variant(318, "Cable Rear-Delt Row", "none", pull("neutral", "neutral", "bilateral", "A rope pulled toward the face with the elbows out wide (as photographed)."), { torso: "upright", plane: "horizontal", shoulder: "changing" }),
  variant(326, "Kneeling Cable Lat Pulldown", "none", pull("neutral", "neutral", "bilateral", "Kneeling, a rope on a high pulley pulled down in both hands (as photographed)."), { torso: "upright", plane: "vertical", shoulder: "changing" }),
  variant(329, "Cable Single-Arm Bent-Over Row", "arm", pull("unknown", "unknown", "unilateral", "One handle on a low pulley, bent forward in a split stance (as photographed)."), { torso: "inclined", plane: "horizontal", shoulder: "changing" }),
  variant(330, "Chest-Supported Cable Row", "none", pull("unknown", "unknown", "bilateral", "Chest on a pad; both hands, on a bar or two handles."), { plane: "horizontal", shoulder: "changing" }),
  variant(333, "Cable High Row", "none", pull("unknown", "unknown", "bilateral", "Kneeling, both hands pulling down and back from a high pulley (as photographed)."), { torso: "upright", plane: "diagonal", shoulder: "changing" }),
  variant(87, "Face Pull", "none", pull("neutral", "neutral", "bilateral", "A rope on a high pulley pulled toward the face, the elbows bending and drawn out wide (as photographed)."), { torso: "upright", plane: "horizontal", shoulder: "changing" }),
  variant(88, "Rope Face Pull with External Rotation", "none", pull("neutral", "neutral", "bilateral", "A face pull that ends by turning the upper arms out, the hands rising beside the head."), { torso: "upright", plane: "horizontal", shoulder: "changing" }),
  variant(335, "Cable High Pull", "none", pull("unknown", "unknown", "bilateral", "Both hands pull a low cable up the front of the body, elbows rising high; the hips may help drive it."), { torso: "upright", plane: "vertical", shoulder: "changing" }),

  // ------------------------------------------------------------ front raises (shoulder flexion)
  variant(117, "Dumbbell Front Raise", "none", isolation("pronated", "overhand", "bilateral", "Two dumbbells raised in front, elbows nearly straight (as photographed)."), { torso: "upright", shoulder: "changing" }),
  variant(118, "Cable Front Raise", "arm", isolation("pronated", "overhand", "unilateral", "One handle from a low pulley raised in front, the other hand at rest (as photographed)."), { torso: "upright", shoulder: "changing" }),
  variant(119, "Plate Front Raise", "none", isolation("neutral", "unknown", "bilateral", "One plate held at its sides in both hands and raised in front (as photographed)."), { torso: "upright", shoulder: "changing" }),

  // ------------------------------------------------------------ throws and slams
  variant(271, "Medicine-Ball Chest Pass", "none", ball("A ball passed from the chest with both hands (as photographed)."), standingPress),
  variant(281, "Kneeling Medicine-Ball Chest Pass", "none", ball("Kneeling upright, a ball passed from the chest with both hands (as photographed)."), standingPress),
  variant(273, "Medicine-Ball Overhead Slam", "none", ball("A ball raised overhead in both hands (as photographed) and slammed to the floor."), { torso: "changing", plane: "vertical", shoulder: "changing" }),
  variant(284, "Medicine-Ball Sprawl-to-Slam", "none", ball("An overhead slam with both hands, then a sprawl to the floor."), { torso: "changing", plane: "vertical", shoulder: "changing" }),
  variant(285, "Medicine-Ball Slam-to-Sprint", "none", ball("An overhead slam with both hands, then a sprint."), { torso: "changing", plane: "vertical", shoulder: "changing" }),
  variant(279, "Medicine-Ball Overhead Backward Throw", "none", ball("A ball swung from between the legs, out of a squat (as photographed), up and back over the head with the arms nearly straight; the legs and hips drive it."), { torso: "changing", shoulder: "changing" }),
  variant(280, "Medicine-Ball Forward Overhead Throw", "none", ball("A ball thrown forward from behind the head with both hands (as photographed)."), { torso: "upright", shoulder: "changing" }),
  variant(283, "Medicine-Ball Sit-Up Throw", "none", ball("Lying back, knees bent (as photographed), the ball held overhead in both hands and thrown forward as the trunk sits up."), { torso: "changing", shoulder: "changing" }),

  // ------------------------------------------------------------ other work that loads the upper arm
  variant(164, "Zercher Squat", "none", columns("multi_joint", "supinated", "unknown", "none", "not_applicable", "bilateral", "The bar sits in the crook of both elbows (as photographed); the hands do not hold it, and the elbows are held bent against it through the squat."), { torso: "upright" }),
  variant(237, "Ab-Wheel Rollout", "none", columns("multi_joint", "pronated", "unknown", "overhand", "not_applicable", "bilateral", "Kneeling, both hands on the wheel's handles (as photographed); the arms reach overhead as the wheel rolls out and are drawn back down to return, elbows straight."), { torso: "changing", shoulder: "changing" }),
  variant(238, "Barbell Rollout", "none", columns("multi_joint", "pronated", "unknown", "overhand", "not_applicable", "bilateral", "Both hands on a barbell rolled out and back, elbows straight (as photographed); the catalog does not say from the knees or the feet."), { torso: "changing", shoulder: "changing" }),
  variant(380, "Cable Anti-Rotation Walkout", "none", columns("multi_joint", "unknown", "unknown", "unknown", "not_applicable", "bilateral", "One handle held straight out in front in both hands while stepping away from the pulley and back, the trunk resisting the pull to turn.", { phase: "unspecified" }), { torso: "upright", plane: "horizontal", shoulder: "flexed" }),
  variant(388, "Kettlebell Snatch", "arm", columns("multi_joint", "changing", "unknown", "unknown", "not_applicable", "unilateral", "One kettlebell (as photographed) swung from between the legs to overhead in one movement, the hand turning around the handle and the elbow locking out at the top."), { plane: "vertical", shoulder: "changing" }),
  variant(390, "Turkish Get-Up", "arm", columns("multi_joint", "unknown", "unknown", "unknown", "not_applicable", "unilateral", "One kettlebell held overhead on a straight arm while getting up from lying to standing and back; the knee on the bell's side is bent and drives (as photographed, lunge style).", { phase: "unspecified" }), { torso: "changing", shoulder: "changing" }),
];
