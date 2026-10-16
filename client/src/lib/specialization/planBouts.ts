import type { Exercise } from "@/lib/exerciseCatalog";
import { parseSetCount } from "@/lib/sessionVolume";
import { parsePrescription } from "@/lib/setPrescription";
import type { DaySlot, WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
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

/** The prescription every plan reader uses for an entry: the saved one, else the goal's default for its position. */
export function prescriptionOf(saved: string | undefined, index: number, goal: TrainingGoal | undefined): string | undefined {
  return saved || (goal ? getGoalPrescription(goal, index) : undefined);
}

const TIME_UNIT = /^(s|sec|secs|second|seconds|min|mins|minute|minutes)$/i;

/**
 * One written set target read as reps or seconds. "8–12" → 8 reps; "30 sec" → 30 s;
 * "1 min" → 60 s. Distances ("40 m", "30 yd") and words ("AMRAP", "RPE 8") are neither.
 */
export function plannedTarget(target: string): { reps: number | null; holdSeconds: number | null } {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(?:[–—-]\s*\d*(?:\.\d+)?)?\s*([a-z]*)\s*$/i.exec(target);
  if (!match) return { reps: null, holdSeconds: null };
  const amount = Number(match[1]);
  const unit = match[2];
  if (!unit || /^reps?$/i.test(unit)) return { reps: amount, holdSeconds: null };
  if (TIME_UNIT.test(unit)) return { reps: null, holdSeconds: /^m/i.test(unit) ? amount * 60 : amount };
  return { reps: null, holdSeconds: null };
}

/**
 * A planned bout's side. A two-handed exercise is bilateral by definition. A one-arm (or
 * either-way) exercise is planned for each arm in turn: that is an assumption about how the
 * plan will be done, so it is labelled as one (`plan_assumption`). Without a variant the
 * side is unknown and the bout reaches neither arm.
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
      const prescription = prescriptionOf(prescriptions[entry.id], position, input.goal);
      const count = parseSetCount(prescription);
      const targets = parsePrescription(prescription).sets;
      const straps: ExposureBout["straps"] = variant?.straps === "yes" || variant?.straps === "no" ? variant.straps : "unknown";
      for (let n = 1; n <= count; n += 1) {
        const id = `plan/${input.week}/${slot.key}/${entry.id}/${n}`;
        const target = plannedTarget(targets[n - 1]?.reps ?? targets[targets.length - 1]?.reps ?? "");
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
