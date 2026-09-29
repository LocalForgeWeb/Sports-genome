import type { DaySlot, WeeklyDayStore } from "@/lib/trainingDayPlan";
import { dayExerciseCount } from "@/lib/trainingDayPlan";

/**
 * Home's next workout, owned by Home rather than borrowed from whatever day Plan is showing.
 *
 * Home used to read Plan's inspected day: open Pull, Legs and an empty Upper in Plan, go back
 * Home, and Home asked you to "Choose your next workout" because Upper was empty. The inspected
 * day was even saved with the plan, so the empty day stayed "next" after a reload (Sep 28
 * regression brief §4). Three different things are kept apart here:
 *
 * - the inspected plan day: what Plan is showing or editing (Home.tsx activeSlot). Changed by
 *   Plan's tabs and week pills, the add-destination strips and the recovery panel. Never read by
 *   this module.
 * - the next planned workout: resolved below from the plan and this week's finished sessions.
 * - an explicit choice to train a day (`NextWorkoutChoice`): made by the tracker's Change day,
 *   or by opening a day's workout from Plan or Review. It is the only way to override the rule.
 *
 * The active session is not decided here: a running workout is always Home's Resume action.
 *
 * The plan carries no dates and no rest days. Every slot is a training day; an empty slot is a
 * day not built yet, so it is passed over, never called "rest".
 */

export type NextWorkoutChoice = { week: number; index: number; day: string; madeAt: string };

/** A finished session this calendar week, by the plan day it was started for. */
export type WeekCompletion = { dayLabel: string; at: string };

export type NextWorkout =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "workout"; week: number; slot: DaySlot; exerciseCount: number; source: "choice" | "schedule" }
  | { kind: "weekComplete"; week: number; slot: DaySlot; exerciseCount: number };

/** "Week 2 · Day 03 · Legs" -> "Day 03 · Legs": the plan slot a session was for, in any plan week. */
export function slotOfDayLabel(dayLabel: string): string {
  const parts = dayLabel.split(" · ").map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? parts.slice(-2).join(" · ") : dayLabel.trim();
}

/** The label the tracker stamps on a session started from this slot. */
export const planDayLabel = (week: number, slot: Pick<DaySlot, "ordinal" | "day">) => `Week ${week} · ${slot.ordinal} · ${slot.day}`;

/** The plan week a label names ("Week 2 · …" -> 2), or null. */
export function weekOfDayLabel(dayLabel: string | null | undefined): number | null {
  const match = /^Week\s+(\d+)\s+·/.exec(dayLabel?.trim() ?? "");
  return match ? Number(match[1]) : null;
}

/**
 * The plan slots finished this calendar week.
 *
 * Matched by slot ("Day 02 · Pull"), not by the full label: the calendar week is one pass through
 * the split, whichever plan week the session was started from. The Home strip, its fraction and
 * Plan's day tabs all read this one rule.
 */
export function slotsDoneThisWeek(completions: readonly WeekCompletion[]): Set<string> {
  return new Set(completions.map((completion) => slotOfDayLabel(completion.dayLabel)));
}

/**
 * Which plan week Home trains from when nothing says otherwise: the week of an explicit choice,
 * else the week of the most recent session (so an athlete who moved on to Week 2 stays there),
 * else Week 1. Browsing another week in Plan changes none of these.
 */
export function trainingWeekFor(input: { choice: NextWorkoutChoice | null; latestSessionDayLabel: string | null; weeks: readonly number[] }): number {
  const available = new Set(input.weeks);
  if (input.choice && available.has(input.choice.week)) return input.choice.week;
  const latest = weekOfDayLabel(input.latestSessionDayLabel);
  if (latest !== null && available.has(latest)) return latest;
  return available.has(1) || available.size === 0 ? 1 : Math.min(...Array.from(available));
}

function slotForChoice(slots: readonly DaySlot[], choice: NextWorkoutChoice): DaySlot | null {
  const atIndex = slots[choice.index];
  if (atIndex && atIndex.day === choice.day) return atIndex;
  return slots.find((slot) => slot.day === choice.day) ?? null;
}

export function resolveNextWorkout(input: {
  ready: boolean;
  week: number;
  slots: readonly DaySlot[];
  store: WeeklyDayStore;
  completions: readonly WeekCompletion[];
  choice: NextWorkoutChoice | null;
}): NextWorkout {
  if (!input.ready) return { kind: "loading" };
  const built = input.slots.filter((slot) => dayExerciseCount(input.store, slot.key) > 0);
  if (!built.length) return { kind: "none" };
  const done = slotsDoneThisWeek(input.completions);
  const countFor = (slot: DaySlot) => dayExerciseCount(input.store, slot.key);

  // An explicit choice holds until that day is trained after the choice was made.
  if (input.choice && input.choice.week === input.week) {
    const chosen = slotForChoice(input.slots, input.choice);
    const madeAt = new Date(input.choice.madeAt).getTime();
    const trainedSince = chosen && input.completions.some((completion) => slotOfDayLabel(completion.dayLabel) === `${chosen.ordinal} · ${chosen.day}` && new Date(completion.at).getTime() >= madeAt);
    if (chosen && countFor(chosen) > 0 && !trainedSince) return { kind: "workout", week: input.week, slot: chosen, exerciseCount: countFor(chosen), source: "choice" };
  }

  const next = built.find((slot) => !done.has(`${slot.ordinal} · ${slot.day}`));
  if (next) return { kind: "workout", week: input.week, slot: next, exerciseCount: countFor(next), source: "schedule" };
  return { kind: "weekComplete", week: input.week, slot: built[0], exerciseCount: countFor(built[0]) };
}
