/**
 * One record per training day, and one place that decides which day you are on.
 *
 * Every "my workout vanished" and "these are yesterday's sets" report traces back to
 * the same two habits in the planner: a day's sets, effort and notes were spread
 * across three maps with different key shapes, and the active day was carried as a
 * loose (index, label) pair that nothing kept in agreement with the week. When the
 * two drifted - a changed training frequency, a week switch, a pasted routine - the
 * app wrote a day's stack under a slot that no longer existed, or loaded one day's
 * prescriptions on top of another's.
 *
 * So: a day slot is derived from the split, never stored loose; a day's exercises,
 * prescriptions, settings and imported context live together under that slot's key;
 * and loading a day REPLACES the draft rather than merging into it, so nothing from
 * the day you just left can bleed into the day you just opened.
 */
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import type { SplitDay } from "@/lib/splitCycle";
import type { ImportedRoutineContext } from "@/components/StackImportPanel";

export type DayPrescriptions = Record<number, string>;
export type DaySettings = Record<number, ExerciseSettings>;

/** One slot in the week. Derived from the split; never persisted on its own. */
export type DaySlot = { index: number; day: SplitDay; key: string; ordinal: string; label: string };

/** Everything one training day owns, kept together so a day can be moved or read as a unit. */
export type DayRecord = {
  workout: Exercise[];
  prescriptions: DayPrescriptions;
  settings: DaySettings;
  context: ImportedRoutineContext[];
};

/** The saved week: day key -> that day's record, for each of the four facets the planner persists. */
export type WeeklyDayStore = {
  plan: Record<string, Exercise[]>;
  prescriptions: Record<string, DayPrescriptions>;
  settings: Record<string, DaySettings>;
  context: Record<string, ImportedRoutineContext[]>;
};

export const emptyDayStore = (): WeeklyDayStore => ({ plan: {}, prescriptions: {}, settings: {}, context: {} });
export const emptyDayRecord = (): DayRecord => ({ workout: [], prescriptions: {}, settings: {}, context: [] });

/**
 * The stored key keeps its historic `${index}-${day}` shape so plans saved by earlier
 * builds keep resolving to the same slot.
 */
export const dayPlanKey = (index: number, day: SplitDay) => `${index}-${day}`;
export const dayOrdinal = (index: number) => `Day ${String(index + 1).padStart(2, "0")}`;

export function buildDaySlots(days: SplitDay[]): DaySlot[] {
  return days.map((day, index) => ({ index, day, key: dayPlanKey(index, day), ordinal: dayOrdinal(index), label: `${dayOrdinal(index)} · ${day}` }));
}

export function sameSplit(left: SplitDay[], right: SplitDay[]) {
  return left.length === right.length && left.every((day, index) => day === right[index]);
}

/**
 * The single answer to "which day am I on?".
 *
 * The position is authoritative, because a split can repeat a label (a four-day week
 * is Upper / Lower / Upper / Lower) and searching by label alone would silently move
 * an athlete editing Day 03 back to Day 01. The label only decides when the position
 * no longer exists.
 */
export function resolveActiveSlot(days: SplitDay[], index: number, day: SplitDay): DaySlot {
  const slots = buildDaySlots(days);
  if (!slots.length) return { index: 0, day, key: dayPlanKey(0, day), ordinal: dayOrdinal(0), label: `${dayOrdinal(0)} · ${day}` };
  const atIndex = slots[index];
  if (atIndex && atIndex.day === day) return atIndex;
  const byLabel = slots.find((slot) => slot.day === day);
  if (byLabel) return byLabel;
  return slots[Math.min(Math.max(index, 0), slots.length - 1)];
}

export function slotForKey(days: SplitDay[], key: string): DaySlot | null {
  return buildDaySlots(days).find((slot) => slot.key === key) || null;
}

const scopeToWorkout = <T,>(workout: Exercise[], record: Record<number, T> | undefined): Record<number, T> => {
  if (!record) return {};
  const scoped: Record<number, T> = {};
  for (const exercise of workout) {
    const value = record[exercise.id];
    if (value !== undefined) scoped[exercise.id] = value;
  }
  return scoped;
};

export function hasDayContent(store: WeeklyDayStore, key: string) {
  return Boolean(store.plan[key]?.length || store.context[key]?.length);
}

export function dayExerciseCount(store: WeeklyDayStore, key: string) {
  return store.plan[key]?.length || 0;
}

/**
 * Write the working draft back to the day it belongs to.
 *
 * Prescriptions and settings are scoped to the exercises actually in the day, so a
 * removed exercise cannot leave a stale set count behind to reappear on a later paste,
 * and one day's effort notes can never be attributed to another's.
 */
export function commitDay(store: WeeklyDayStore, key: string, record: Partial<DayRecord>): WeeklyDayStore {
  const workout = record.workout ?? store.plan[key] ?? [];
  const context = record.context ?? store.context[key] ?? [];
  return {
    plan: { ...store.plan, [key]: [...workout] },
    prescriptions: { ...store.prescriptions, [key]: scopeToWorkout(workout, record.prescriptions ?? store.prescriptions[key]) },
    settings: { ...store.settings, [key]: scopeToWorkout(workout, record.settings ?? store.settings[key]) },
    context: { ...store.context, [key]: [...context] },
  };
}

/** Read a day back. A replacement, never a merge: what is not saved for this day is simply not there. */
export function loadDay(store: WeeklyDayStore, key: string): DayRecord {
  const workout = store.plan[key] || [];
  return {
    workout: [...workout],
    prescriptions: scopeToWorkout(workout, store.prescriptions[key]),
    settings: scopeToWorkout(workout, store.settings[key]),
    context: [...(store.context[key] || [])],
  };
}

export function clearDay(store: WeeklyDayStore, key: string): WeeklyDayStore {
  return commitDay(store, key, emptyDayRecord());
}

/**
 * Only the days the current split actually has.
 *
 * Lowering the training frequency hides days rather than deleting them, so the records
 * of the hidden days stay in the store and return when the frequency goes back up. They
 * must not keep feeding the weekly volume estimate in the meantime.
 */
export function visibleDayPlan(store: WeeklyDayStore, days: SplitDay[]) {
  const slots = buildDaySlots(days);
  const plan: Record<string, Exercise[]> = {};
  const prescriptions: Record<string, DayPrescriptions> = {};
  for (const slot of slots) {
    if (!store.plan[slot.key]?.length) continue;
    plan[slot.key] = store.plan[slot.key];
    prescriptions[slot.key] = store.prescriptions[slot.key] || {};
  }
  return { plan, prescriptions };
}

/**
 * Carry the saved week across a change of training frequency.
 *
 * Going from three days to four used to orphan every saved day: the keys carry the
 * split label, so `2-Legs` simply stopped being addressable and the week read as empty
 * while the work sat in storage. Days are rehomed by label first (a Sport Transfer day
 * moving from slot five to slot six is still that day), then by position, and anything
 * with nowhere to go is left untouched under its own key so raising the frequency again
 * brings it back.
 */
export function remapDaysForFrequency(store: WeeklyDayStore, previousDays: SplitDay[], nextDays: SplitDay[]): { store: WeeklyDayStore; moved: Record<string, string> } {
  if (sameSplit(previousDays, nextDays)) return { store, moved: {} };
  const previousSlots = buildDaySlots(previousDays);
  const nextSlots = buildDaySlots(nextDays);
  const claimed = new Set<string>();
  const moved: Record<string, string> = {};
  const claim = (nextSlot: DaySlot, previousSlot: DaySlot) => {
    claimed.add(previousSlot.key);
    moved[previousSlot.key] = nextSlot.key;
  };
  const takenTargets = () => new Set(Object.values(moved));

  // A slot that survives unchanged keeps its own record.
  for (const nextSlot of nextSlots) {
    const exact = previousSlots.find((slot) => slot.key === nextSlot.key && !claimed.has(slot.key));
    if (exact) claim(nextSlot, exact);
  }
  // The same day at a new position keeps its stack; the nearest position wins.
  for (const nextSlot of nextSlots) {
    if (takenTargets().has(nextSlot.key)) continue;
    const byLabel = previousSlots
      .filter((slot) => !claimed.has(slot.key) && slot.day === nextSlot.day)
      .sort((left, right) => Math.abs(left.index - nextSlot.index) - Math.abs(right.index - nextSlot.index))[0];
    if (byLabel) claim(nextSlot, byLabel);
  }
  // Otherwise whatever was built in this position carries over under the new label.
  for (const nextSlot of nextSlots) {
    if (takenTargets().has(nextSlot.key)) continue;
    const byIndex = previousSlots.find((slot) => !claimed.has(slot.key) && slot.index === nextSlot.index);
    if (byIndex) claim(nextSlot, byIndex);
  }

  const next = emptyDayStore();
  // Records with nowhere to go stay where they are: a hidden day, not a deleted one.
  for (const key of Object.keys(store.plan)) {
    if (moved[key]) continue;
    next.plan[key] = store.plan[key];
    next.prescriptions[key] = store.prescriptions[key] || {};
    next.settings[key] = store.settings[key] || {};
    next.context[key] = store.context[key] || [];
  }
  for (const [previousKey, nextKey] of Object.entries(moved)) {
    if (!hasDayContent(store, previousKey)) continue;
    next.plan[nextKey] = store.plan[previousKey] || [];
    next.prescriptions[nextKey] = store.prescriptions[previousKey] || {};
    next.settings[nextKey] = store.settings[previousKey] || {};
    next.context[nextKey] = store.context[previousKey] || [];
  }
  return { store: next, moved };
}

const importAliases = (label: string): string[] => {
  const requested = label.toLowerCase();
  if (requested.includes("lower")) return ["lower", "legs"];
  if (requested.includes("upper")) return ["upper", "push", "pull"];
  if (requested.includes("full")) return ["full body", "push"];
  if (requested.includes("condition") || requested.includes("recovery")) return ["sport transfer", "full body"];
  return [requested];
};

export type ImportPlacement = { pastedIndex: number; slotIndex: number };

/**
 * Give every pasted day its own slot.
 *
 * Two pasted days used to be able to match the same split slot - an "Upper A" and an
 * "Upper B" both resolve to the first Upper - and the second silently overwrote the
 * first. Anything past the end of the week was clamped onto the last slot, with the
 * same result. Slots are now claimed exactly once, and a day with nowhere to land is
 * reported rather than dropped.
 */
export function placeImportedDays(labels: string[], days: SplitDay[]): { placements: ImportPlacement[]; unplacedLabels: string[] } {
  const slots = buildDaySlots(days);
  const claimed = new Set<number>();
  const placements: ImportPlacement[] = [];
  const unplacedLabels: string[] = [];
  const pending: number[] = [];

  labels.forEach((label, pastedIndex) => {
    const aliases = importAliases(label);
    const matched = slots.find((slot) => !claimed.has(slot.index) && aliases.some((alias) => slot.day.toLowerCase().includes(alias) || alias.includes(slot.day.toLowerCase())));
    if (!matched) { pending.push(pastedIndex); return; }
    claimed.add(matched.index);
    placements.push({ pastedIndex, slotIndex: matched.index });
  });

  // Whatever did not match a split label fills the week in the order it was pasted.
  for (const pastedIndex of pending) {
    const free = slots.find((slot) => !claimed.has(slot.index));
    if (!free) { unplacedLabels.push(labels[pastedIndex]); continue; }
    claimed.add(free.index);
    placements.push({ pastedIndex, slotIndex: free.index });
  }

  placements.sort((left, right) => left.pastedIndex - right.pastedIndex);
  return { placements, unplacedLabels };
}
