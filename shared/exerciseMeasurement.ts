/**
 * How a set of each catalog exercise is recorded (50-exercise brief, 6 Oct 2026, §7-§8).
 *
 * The 400 original records were all logged as load × reps, and the logger, the set lines, the
 * volume figures and the strength estimate all assume that. The expansion brings exercises where
 * that is false: a 20-second neck hold is not 20 reps, 30 metres carried is not 30 reps, an
 * assisted pull-up's stack number is help rather than load, and a band or a gripper has a setting
 * rather than a weight. Each of those needs its own boxes, its own record line, and its own
 * answer to "can this produce an estimated one-rep max".
 *
 * Every expansion id (417-458) is classified here explicitly; `measurementFor` never guesses for
 * them. The original records keep the behaviour they have always had (`load_reps`), reported as
 * `explicit: false` so nothing downstream mistakes the default for a reviewed decision.
 */

export type MeasurementMode =
  /** Load and repetitions: the original catalog's only mode. */
  | "load_reps"
  /** Repetitions with no external load beyond the body (any typed weight is added load). */
  | "reps_only"
  /** Repetitions at a named resistance setting - a band colour, a gripper model. No kilograms. */
  | "setting_reps"
  /** Repetitions with machine assistance. More assistance is an easier set, never a heavier one. */
  | "assisted_reps"
  /** A timed hold with no external load field. */
  | "duration"
  /** A load held for a time. */
  | "load_duration"
  /** A load carried, dragged or pulled over a distance. */
  | "load_distance";

/**
 * How the two sides are done. `per_side`: each side gets the prescribed work, and a logged set
 * may name its side; the set still counts once, never twice (brief §8). `alternating`: the sides
 * alternate within one set. `bilateral`: both sides together. `unspecified`: the original records,
 * which never stated it.
 */
export type Laterality = "bilateral" | "per_side" | "alternating" | "unspecified";

export type ExerciseMeasurement = {
  mode: MeasurementMode;
  laterality: Laterality;
  /**
   * Whether load × reps from this exercise may become an estimated one-rep max. The estimator
   * accepts any positive numbers; that does not make it applicable to a timed hold, a carry, a
   * gripper setting or an assistance stack (brief §7).
   */
  e1rmEligible: boolean;
  /** Why it is not, in words an athlete can read. */
  e1rmReason?: string;
  /** What the setting names, for `setting_reps` and the hub's `load_duration` ("Band", "Gripper", "Hub"). */
  settingLabel?: string;
  /** The target a new plan entry starts with when the goal's rep range does not fit the mode. */
  defaultTarget?: string;
  /** True for a reviewed decision; false for an original record's inherited default. */
  explicit: boolean;
};

const assisted = "The number is assistance from the machine, not load lifted; less assistance is the stronger set.";
const setting = "A band or gripper setting is a label, not a weight, so there is nothing to convert into a one-rep max.";
const timed = "A hold is recorded in seconds; seconds are not repetitions.";
const distance = "A carry or drag is recorded as load over a distance; metres are not repetitions.";
const ballistic = "A ballistic lift to the shoulder is limited by technique and catch, not by a repetition-maximum relationship.";

const m = (mode: MeasurementMode, laterality: Laterality, e1rmEligible: boolean, extra: Partial<ExerciseMeasurement> = {}): ExerciseMeasurement =>
  ({ mode, laterality, e1rmEligible, explicit: true, ...extra });

/** Catalog ids 417-458: the expansion's 42 records, in candidate order (EXPANSION_CANDIDATE_IDS). */
const EXPANSION_V1: Readonly<Record<number, ExerciseMeasurement>> = {
  417: m("load_reps", "bilateral", true),
  418: m("load_reps", "bilateral", true),
  419: m("load_reps", "per_side", true),
  420: m("load_reps", "bilateral", true),
  421: m("setting_reps", "bilateral", false, { e1rmReason: setting, settingLabel: "Band" }),
  422: m("setting_reps", "bilateral", false, { e1rmReason: setting, settingLabel: "Band" }),
  423: m("duration", "per_side", false, { e1rmReason: timed, defaultTarget: "20 s" }),
  424: m("duration", "per_side", false, { e1rmReason: timed, defaultTarget: "20 s" }),
  425: m("load_reps", "bilateral", true),
  426: m("load_reps", "bilateral", true),
  427: m("load_duration", "per_side", false, { e1rmReason: timed, settingLabel: "Hub", defaultTarget: "5 s" }),
  428: m("load_reps", "bilateral", true),
  429: m("assisted_reps", "bilateral", false, { e1rmReason: assisted }),
  430: m("assisted_reps", "bilateral", false, { e1rmReason: assisted }),
  431: m("load_reps", "bilateral", true),
  432: m("load_reps", "bilateral", true),
  433: m("load_reps", "per_side", true),
  434: m("load_reps", "bilateral", true),
  435: m("load_reps", "per_side", true),
  436: m("load_reps", "per_side", true),
  437: m("load_reps", "bilateral", true),
  438: m("load_reps", "per_side", true),
  439: m("load_reps", "bilateral", true),
  440: m("load_reps", "bilateral", true),
  441: m("load_reps", "bilateral", true),
  442: m("load_reps", "bilateral", true),
  443: m("load_reps", "bilateral", true),
  444: m("load_reps", "bilateral", true),
  445: m("reps_only", "bilateral", false, { e1rmReason: "A bodyweight lean has no external load to estimate from." }),
  446: m("load_reps", "per_side", true),
  447: m("load_reps", "per_side", true),
  448: m("load_reps", "per_side", true),
  449: m("load_reps", "per_side", true),
  450: m("load_distance", "bilateral", false, { e1rmReason: distance, defaultTarget: "30 m" }),
  451: m("load_distance", "per_side", false, { e1rmReason: distance, defaultTarget: "20 m" }),
  452: m("load_distance", "bilateral", false, { e1rmReason: distance, defaultTarget: "30 m" }),
  453: m("load_reps", "alternating", false, { e1rmReason: ballistic }),
  454: m("load_distance", "bilateral", false, { e1rmReason: distance, defaultTarget: "20 m" }),
  455: m("load_distance", "bilateral", false, { e1rmReason: distance, defaultTarget: "15 m" }),
  456: m("load_reps", "per_side", true),
  457: m("load_reps", "per_side", true),
  458: m("load_reps", "per_side", true),
};

const LEGACY: ExerciseMeasurement = { mode: "load_reps", laterality: "unspecified", e1rmEligible: true, explicit: false };

/** How a catalog exercise's sets are recorded. Unknown and original ids read as load × reps. */
export function measurementFor(catalogExerciseId: number | null | undefined): ExerciseMeasurement {
  return (catalogExerciseId != null && EXPANSION_V1[catalogExerciseId]) || LEGACY;
}

/** Every id with a reviewed measurement decision, for the validator. */
export function explicitMeasurementIds(): number[] {
  return Object.keys(EXPANSION_V1).map(Number);
}

/** Modes whose sets carry a number of repetitions. */
export const countsRepetitions = (mode: MeasurementMode) => mode !== "duration" && mode !== "load_duration" && mode !== "load_distance";
