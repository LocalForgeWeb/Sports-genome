import type { Exercise } from "@/lib/exerciseCatalog";
import { parseSetCount } from "@/lib/sessionVolume";
import { parsePrescription } from "@/lib/setPrescription";
import type { DaySlot, WeeklyDayStore } from "@/lib/trainingDayPlan";
import { prescriptionOf, type TrainingGoal } from "@/lib/workoutPlanner";
import { catalogIdOf } from "@/lib/workoutSwap";
import type { ExerciseVariant, ExposureBout, LimbSideRecord } from "@shared/specialization/types";
import { variantLookup } from "./bouts";

/**
 * The plan as planned bouts: one bout per planned set of each exercise on each day of one
 * plan week (01-reconciliation.md, adapter map). The set count is the one every other
 * reader of the plan uses (`parseSetCount`), so "4 × 8–12" is four bouts here exactly as it
 * is four sets in the weekly volume map and in the tracker.
 *
 * A plan has no dates, no loads and no sides, so a planned bout says only what the plan
 * says: reps or seconds from the written target (the low end of a range: what the plan
 * commits to), no load, and, for an exercise done one side at a time, the sides the plan
 * assumes (`plannedSides`): both, one bout per planned set.
 */

export type PlanBoutInput = {
  week: number;
  /** The visible days of the week (hidden days of a lowered frequency are not planned work). */
  slots: readonly DaySlot[];
  /** That week's saved days. */
  store: WeeklyDayStore;
  /**
   * Atlas variants, for each exercise's sides, measure and default straps: on a region's page the
   * region's own and then the shared library's (`planningVariantsFor`), so a plan is laid out the
   * same on every region's page.
   */
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

type PlannedSides = Pick<ExposureBout, "armSide" | "legSide">;

/**
 * The sides one planned set's bout assumes, on the limb whose side the logger would record for the
 * exercise (its variant's `sidedBy`, 10-multi-region.md §2.1). A planned set is ONE bout, whatever
 * the exercise: both sides are counted as one (owner, 20 Oct 2026), and the tracker lays a planned
 * one-side set out as one row per planned set, so the plan logged as built is the plan on every
 * region's page (planned equals logged), paired and midline alike.
 * - done one side at a time on that limb (`unilateral`), or either way (`either`): the bout is
 *   assumed on both sides (`plan_assumption`), as the calculator first shipped it ("3 × 12" is
 *   three sets for each arm in a per-side summary, which is dormant; once in the page's `both`);
 * - anything else: no side; the calculator reads a two-sided exercise's sides from the exercise.
 */
function plannedSides(variant: ExerciseVariant | null): PlannedSides {
  const none: PlannedSides = { armSide: null, legSide: null };
  const limb = variant?.sidedBy;
  if (!variant || (limb !== "arm" && limb !== "leg")) return none;
  const laterality = limb === "arm" ? variant.laterality : variant.legLaterality;
  if (laterality !== "unilateral" && laterality !== "either") return none;
  const record: LimbSideRecord = { side: "both", source: "plan_assumption" };
  return { armSide: limb === "arm" ? record : null, legSide: limb === "leg" ? record : null };
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
      const { armSide, legSide } = plannedSides(variant);
      for (let n = 1; n <= count; n += 1) {
        const target = plannedTarget(targets[n - 1]?.reps ?? targets[targets.length - 1]?.reps ?? "", variant?.measure);
        const id = `plan/${input.week}/${slot.key}/${entry.id}/${n}`;
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
          armSide,
          legSide,
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
