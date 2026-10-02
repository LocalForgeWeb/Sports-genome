import type { Exercise } from "@/lib/exerciseCatalog";
import type { SplitDay } from "@/lib/splitCycle";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";
import type { NextWorkoutChoice } from "@/lib/nextWorkout";
import type { TodayPlan } from "./TodayActionPanel";

/**
 * A plan for TodayActionPanel tests: the split's days, and for each named day that many
 * exercises in plan week 1. Exercises carry no muscles unless given, so the count line reads
 * "6 exercises" on its own.
 */
export function todayPlan(
  counts: Partial<Record<SplitDay, number>>,
  options: { split?: SplitDay[]; ready?: boolean; choice?: NextWorkoutChoice | null; primaryMuscles?: string[]; weeks?: Record<number, Partial<Record<SplitDay, number>>> } = {},
): TodayPlan {
  const split = options.split ?? ["Push", "Pull", "Legs", "Upper"];
  const slots = buildDaySlots(split);
  const weekStore = (weekCounts: Partial<Record<SplitDay, number>>) => {
    const store = emptyDayStore();
    for (const slot of slots) {
      store.plan[slot.key] = Array.from({ length: weekCounts[slot.day] ?? 0 }, (_, index) => ({ id: slot.index * 100 + index + 1, name: `${slot.day} ${index + 1}`, primaryMuscles: options.primaryMuscles ?? [], secondaryMuscles: [] }) as unknown as Exercise);
    }
    return store;
  };
  const weeks: TodayPlan["weeks"] = { 1: weekStore(counts), ...Object.fromEntries(Object.entries(options.weeks ?? {}).map(([week, weekCounts]) => [Number(week), weekStore(weekCounts)])) };
  return { ready: options.ready ?? true, slots, weeks, choice: options.choice ?? null };
}
