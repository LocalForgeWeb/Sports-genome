/**
 * How hard a set was taken, and what that lets it say about strength (owner, 15 Oct 2026).
 *
 * A set taken to failure is a measurement: the athlete could do that much and no more. A set
 * stopped short of failure is a floor: they could do at least that much. A floor may raise a rank
 * but never lower it - a light set of good mornings must not pull down a lower back that heavier,
 * harder lifts already rank. A logged one-rep max is always a measurement.
 */
export type SetEffort = "failure" | "not_to_failure";

export const setEfforts: readonly SetEffort[] = ["failure", "not_to_failure"];

export function isSetEffort(value: unknown): value is SetEffort {
  return value === "failure" || value === "not_to_failure";
}

/**
 * Why an exercise is usually done light: the muscles it reads can lift far more than the
 * movement is normally loaded with, so an unmarked set of it says little about their strength.
 */
export type UsuallyLightReason = "hinge_accessory" | "single_leg_balance" | "shoulder_health" | "activation" | "core_control";

/**
 * Exercises usually done light, by catalog id - only ones the ranks score (they have a comparison
 * curve or read a related lift's), since anywhere else the answer would change nothing.
 *
 * In the good morning's category: loaded for technique, balance, joint health or activation rather
 * than strength. A movement trained heavy as a strength lift (a deadlift, a Zercher lift, a squat)
 * is not here, and neither is ordinary isolation work, whose comparison data is itself light.
 * An unmarked set of one of these counts as not to failure; the athlete can say otherwise.
 */
export const usuallyLightExercises: ReadonlyMap<number, UsuallyLightReason> = new Map<number, UsuallyLightReason>([
  // Hinges done light for the lower back and hamstrings, like the good morning itself.
  [190, "hinge_accessory"], // Good Morning
  [191, "hinge_accessory"], // Seated Good Morning
  [355, "hinge_accessory"], // Cable Good Morning
  [204, "hinge_accessory"], // Barbell Hip Hinge
  [202, "hinge_accessory"], // Cable Pull-Through
  [201, "hinge_accessory"], // Reverse Hyperextension
  // Single-leg hinges, held back by balance before strength.
  [188, "single_leg_balance"], // Single-Leg Romanian Deadlift
  [264, "single_leg_balance"], // Landmine Single-Leg Romanian Deadlift
  [356, "single_leg_balance"], // Cable Single-Leg Deadlift
  // Shoulder-health pulls, kept light by design.
  [87, "shoulder_health"], // Face Pull
  [88, "shoulder_health"], // Rope Face Pull with External Rotation
  [95, "shoulder_health"], // Cable Y-Raise
  // Glute activation, read on curves of far heavier hip extensions.
  [212, "activation"], // Cable Glute Kickback
  [213, "activation"], // Machine Glute Kickback
  [361, "activation"], // Cable Quadruped Hip Extension
  [362, "activation"], // Cable Donkey Kick
  [363, "activation"], // Cable Fire Hydrant
  // Chops, done for control of the trunk rather than load.
  [250, "core_control"], // Cable Wood Chop
  [377, "core_control"], // Cable Reverse Chop
  [378, "core_control"], // Cable Horizontal Chop
]);

/** Why an exercise is on the usually-light list, or null when it is not. */
export function usuallyLightReason(catalogExerciseId: number | null | undefined): UsuallyLightReason | null {
  return catalogExerciseId == null ? null : usuallyLightExercises.get(catalogExerciseId) ?? null;
}

/**
 * The effort a set is read with. What the athlete said wins. A one-rep max is a measurement
 * whatever else is recorded. An unmarked set of a usually-light exercise is read as not to
 * failure; any other unmarked set as it always was, as a measurement.
 */
export function effectiveEffort(set: { catalogExerciseId?: number | null; measurementType?: string | null; effort?: unknown }): { effort: SetEffort | null; assumed: boolean } {
  if (set.measurementType === "MEASURED_1RM") return { effort: "failure", assumed: false };
  if (isSetEffort(set.effort)) return { effort: set.effort, assumed: false };
  if (usuallyLightReason(set.catalogExerciseId)) return { effort: "not_to_failure", assumed: true };
  return { effort: null, assumed: false };
}

/** A floor rather than a measurement: it may raise a rank, never lower it. */
export function isNotToFailure(set: { catalogExerciseId?: number | null; measurementType?: string | null; effort?: unknown }): boolean {
  return effectiveEffort(set).effort === "not_to_failure";
}
