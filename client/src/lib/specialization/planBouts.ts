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

/** What an exercise's sets are measured in: reps, or the seconds of a hold (the variant's `measure`). */
export type PlannedMeasure = ExerciseVariant["measure"];

/**
 * A hold's default target. The goal's defaults are rep ranges ("3 × 6–10"), and a rep range on a
 * hold reads as seconds on the set card ("6–10 sec") while meaning nothing the athlete chose; a
 * hold gets a hold's target instead.
 */
export const holdDefaultTarget = "30 sec";
/** A hold's default with no goal to take a set count from. */
export const holdDefaultPrescription = `3 × ${holdDefaultTarget}`;

/**
 * The default for an entry with nothing of its own. A rep exercise takes the goal's default for
 * its position. A hold takes the goal's set count for that position with a hold's target
 * ("4 × 30 sec" where the goal says "4 × 3–6"), so every plan reader that counts sets from the
 * goal's default (the weekly volume map, Today, the week review) still counts the same sets.
 */
function defaultPrescriptionOf(index: number, goal: TrainingGoal | undefined, measure: PlannedMeasure | undefined): string | undefined {
  const goalDefault = goal ? getGoalPrescription(goal, index) : undefined;
  if (measure !== "seconds") return goalDefault;
  return goalDefault ? `${parseSetCount(goalDefault)} × ${holdDefaultTarget}` : holdDefaultPrescription;
}

/** Every goal's default for every place in a day: the texts the planner pins on an entry it builds. */
const trainingGoals = ["Athleticism", "Muscle growth", "Max strength", "Capacity"] as const satisfies readonly TrainingGoal[];
// Every goal is listed: a goal added to TrainingGoal and not here fails to compile.
const everyGoalListed: Exclude<TrainingGoal, (typeof trainingGoals)[number]> extends never ? true : never = true;
void everyGoalListed;
const pinnedGoalDefaults: ReadonlySet<string> = new Set(trainingGoals.flatMap((goal) => [0, 1, 2, 3].map((index) => getGoalPrescription(goal, index))));

/**
 * The prescription every plan reader uses for an entry: the saved one, else the default for its
 * position (`defaultPrescriptionOf`), so a hold never gets a rep default. The tracker reads its
 * planned sets through this same function, so the card and the planned totals start from the
 * same text.
 *
 * On a hold, a saved prescription that is one of the goals' defaults is read as the default it
 * is, with its own set count: "3 × 6–10" on a hang is "3 × 30 sec". The planner pins that text
 * on every entry when it builds a day or a week (and Home hands the tracker the day's map with
 * it filled in), so it says nothing the athlete chose; read literally it would be a rep range
 * taken as seconds. It is matched against every goal's default for every position, not only
 * this entry's: an entry moved within its day, or a goal changed after the week was built,
 * keeps the text it was pinned with. Any other saved text is the athlete's and is kept.
 */
export function prescriptionOf(saved: string | undefined, index: number, goal: TrainingGoal, measure?: PlannedMeasure): string;
export function prescriptionOf(saved: string | undefined, index: number, goal: TrainingGoal | undefined, measure?: PlannedMeasure): string | undefined;
export function prescriptionOf(saved: string | undefined, index: number, goal: TrainingGoal | undefined, measure?: PlannedMeasure): string | undefined {
  if (saved && measure === "seconds" && pinnedGoalDefaults.has(saved.trim())) return `${parseSetCount(saved)} × ${holdDefaultTarget}`;
  if (saved) return saved;
  return defaultPrescriptionOf(index, goal, measure);
}

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
