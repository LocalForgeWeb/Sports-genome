import type { Exercise } from "@/lib/exerciseCatalog";
import { parseSetCount } from "@/lib/sessionVolume";
import { parsePrescription } from "@/lib/setPrescription";
import type { DaySlot, WeeklyDayStore } from "@/lib/trainingDayPlan";
import { prescriptionOf, type TrainingGoal } from "@/lib/workoutPlanner";
import { catalogIdOf } from "@/lib/workoutSwap";
import type { BoutSide, ExerciseVariant, ExposureBout, SideSource } from "@shared/specialization/types";
import { variantLookup } from "./bouts";

/**
 * The plan as planned bouts: one bout per planned set of each exercise on each day of one
 * plan week (01-reconciliation.md, adapter map). The set count is the one every other
 * reader of the plan uses (`parseSetCount`), so "4 × 8–12" is four bouts here exactly as it
 * is four sets in the weekly volume map and in the tracker.
 *
 * A plan has no dates, no loads and no sides, so a planned bout says only what the plan
 * says: reps or seconds from the written target (the low end of a range: what the plan
 * commits to), no load, and a side taken from the exercise itself.
 */

export type PlanBoutInput = {
  week: number;
  /** The visible days of the week (hidden days of a lowered frequency are not planned work). */
  slots: readonly DaySlot[];
  /** That week's saved days. */
  store: WeeklyDayStore;
  /** Atlas variants, for each exercise's laterality and default straps. */
  variants: readonly ExerciseVariant[];
  /**
   * The athlete's training goal. A day entry with no saved prescription reads as the goal's
   * default for its position, as the weekly review, Today and the tracker read it; without a
   * goal it falls back to the planner's 3 sets.
   */
  goal?: TrainingGoal;
};

/** What an exercise's sets are measured in: reps, or the seconds of a hold (the variant's `measure`). */
export type PlannedMeasure = ExerciseVariant["measure"];

/**
 * The prescription every plan reader uses for an entry, and a hold's default ("4 × 30 sec" where
 * the goal says "4 × 3–6"): one reading, in workoutPlanner.ts beside the goal's defaults, so Home
 * reads it without loading the atlas. The tracker reads its planned sets through it too.
 */
export { holdDefaultPrescription, holdDefaultTarget, prescriptionOf } from "@/lib/workoutPlanner";

const TIME_UNIT = /^(s|sec|secs|second|seconds|min|mins|minute|minutes)$/i;

/**
 * One written set target read as reps or seconds. "8–12" → 8 reps; "30 sec" → 30 s;
 * "1 min" → 60 s. Distances ("40 m", "30 yd") and words ("AMRAP", "RPE 8") are neither.
 *
 * A bare number is read by the exercise's measure, as the set card reads it: on an exercise
 * measured in seconds "40" is 40 seconds (the card shows "40 sec"), elsewhere 40 reps. A unit
 * the target writes out is taken as written.
 */
export function plannedTarget(target: string, measure?: PlannedMeasure): { reps: number | null; holdSeconds: number | null } {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(?:[–—-]\s*\d*(?:\.\d+)?)?\s*([a-z]*)\s*$/i.exec(target);
  if (!match) return { reps: null, holdSeconds: null };
  const amount = Number(match[1]);
  const unit = match[2];
  if (!unit && measure === "seconds") return { reps: null, holdSeconds: amount };
  if (!unit || /^reps?$/i.test(unit)) return { reps: amount, holdSeconds: null };
  if (TIME_UNIT.test(unit)) return { reps: null, holdSeconds: /^m/i.test(unit) ? amount * 60 : amount };
  return { reps: null, holdSeconds: null };
}

/**
 * A planned bout's side. A two-handed exercise is bilateral by definition. A one-arm (or
 * either-way) exercise is planned for each arm in turn: that is an assumption about how the
 * plan will be done, so it is labelled as one (`plan_assumption`). Without a variant the
 * side is unknown and the bout reaches neither arm.
 *
 * A planned set count on a one-arm exercise is per arm: "3 × 12" is three sets for each arm
 * (02-design.md §3, "each side"), so each planned set is one bout on each arm. For an athlete
 * with a specialization target the tracker builds the same plan as two rows per planned set,
 * Right then Left (DeviceWorkoutTracker `perArmSets`), so the plan logged as built gives each
 * arm exactly the bouts planned here.
 */
function plannedSide(variant: ExerciseVariant | null): { side: BoutSide; sideSource: SideSource } {
  if (!variant) return { side: "unknown", sideSource: "unknown" };
  if (variant.laterality === "bilateral") return { side: "bilateral", sideSource: "structural" };
  return { side: "bilateral", sideSource: "plan_assumption" };
}

export function boutsFromPlan(input: PlanBoutInput): ExposureBout[] {
  const variantOf = variantLookup(input.variants);
  const bouts: ExposureBout[] = [];
  for (const slot of input.slots) {
    const entries = input.store.plan[slot.key] ?? [];
    const prescriptions = input.store.prescriptions[slot.key] ?? {};
    entries.forEach((entry, position) => {
      const catalogExerciseId = catalogIdOf(entry);
      const variant = variantOf(catalogExerciseId);
      const prescription = prescriptionOf(prescriptions[entry.id], position, input.goal, variant?.measure);
      const count = parseSetCount(prescription);
      const targets = parsePrescription(prescription).sets;
      const straps: ExposureBout["straps"] = variant?.straps === "yes" || variant?.straps === "no" ? variant.straps : "unknown";
      for (let n = 1; n <= count; n += 1) {
        const id = `plan/${input.week}/${slot.key}/${entry.id}/${n}`;
        const target = plannedTarget(targets[n - 1]?.reps ?? targets[targets.length - 1]?.reps ?? "", variant?.measure);
        bouts.push({
          id,
          mode: "planned",
          performedAt: null,
          sessionId: null,
          sessionLabel: `Week ${input.week} · ${slot.label}`,
          planWeek: input.week,
          dayKey: slot.key,
          exerciseEntryId: String(entry.id),
          catalogExerciseId,
          exerciseName: entry.name,
          matchedBy: "id",
          ...plannedSide(variant),
          straps,
          warmup: false,
          effort: null,
          kind: "standard",
          segments: [{ id, reps: target.reps, loadKg: null, holdSeconds: target.holdSeconds }],
        });
      }
    });
  }
  return bouts;
}

/** An exercise already in the chosen plan week, and the days it is on. */
export type PlannedExercise = { catalogExerciseId: number; name: string; days: { key: string; label: string }[] };

/** The exercises in one plan week, once each, with their days: what recommendations check for overlap. */
export function plannedExercisesInWeek(slots: readonly DaySlot[], store: WeeklyDayStore): PlannedExercise[] {
  const byId = new Map<number, PlannedExercise>();
  for (const slot of slots) {
    for (const entry of (store.plan[slot.key] ?? []) as Exercise[]) {
      const id = catalogIdOf(entry);
      const item = byId.get(id) ?? { catalogExerciseId: id, name: entry.name, days: [] };
      if (!item.days.some((day) => day.key === slot.key)) item.days.push({ key: slot.key, label: slot.label });
      byId.set(id, item);
    }
  }
  return Array.from(byId.values());
}
