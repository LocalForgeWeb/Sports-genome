import { splitDaysForFrequency, type SplitDay } from "@/lib/splitCycle";

/**
 * The athlete's own week: what each training day is (owner, 22 Oct 2026: "if I want I should be
 * able to have 5 upper days, or whatever; all the potential day splits should be visible as an
 * option when building a week").
 *
 * The app's suggestion for a number of days is still the default (splitDaysForFrequency). A
 * layout the athlete chose overrides it position by position, and is kept at full length, so
 * going from five days to three and back again brings the same five back. A position the layout
 * has never set falls back to the suggestion for that number of days.
 */

/** Every kind of day the app can build, check coverage for and illustrate, in the order offered. */
export const dayTypes: readonly SplitDay[] = ["Upper", "Lower", "Push", "Pull", "Legs", "Full Body", "Sport Transfer"];

export const maxTrainingDays = 7;

const isDayType = (value: unknown): value is SplitDay => typeof value === "string" && (dayTypes as readonly string[]).includes(value);

/** A saved layout, or null when there is none or it is not one this build can read. */
export function readDayLayout(value: unknown): SplitDay[] | null {
  if (!Array.isArray(value) || !value.length || value.length > maxTrainingDays || !value.every(isDayType)) return null;
  return [...value];
}

/** The days the week actually has: the athlete's choice where there is one, the suggestion elsewhere. */
export function resolveSplit(trainingDays: number, layout: readonly SplitDay[] | null): SplitDay[] {
  const suggested = splitDaysForFrequency(trainingDays);
  if (!layout) return suggested;
  return suggested.map((day, index) => layout[index] ?? day);
}

/** The layout with one day's type changed. Positions past this week's days keep what they held. */
export function withDayType(split: readonly SplitDay[], layout: readonly SplitDay[] | null, index: number, type: SplitDay): SplitDay[] {
  const next = [...split, ...(layout ?? []).slice(split.length)];
  next[index] = type;
  return next;
}

export type SplitPreset = { id: string; name: string; days: SplitDay[]; suggested: boolean };

const cycle = (pattern: SplitDay[], length: number): SplitDay[] => Array.from({ length }, (_, index) => pattern[index % pattern.length]);

/**
 * The ready-made weeks for a number of days, each shown with the days it makes. The app's own
 * suggestion is marked on whichever of them it is, or offered first when it is none of them.
 * Two that make the same week are offered once, under the first name.
 */
export function splitPresets(trainingDays: number): SplitPreset[] {
  const days = Math.max(1, Math.min(maxTrainingDays, Math.round(trainingDays)));
  const suggestion = splitDaysForFrequency(days);
  const named: (Omit<SplitPreset, "suggested"> | null)[] = [
    { id: "full-body", name: "Full body", days: cycle(["Full Body"], days) },
    days >= 2 ? { id: "upper-lower", name: "Upper / Lower", days: cycle(["Upper", "Lower"], days) } : null,
    days >= 3 ? { id: "push-pull-legs", name: "Push / Pull / Legs", days: cycle(["Push", "Pull", "Legs"], days) } : null,
    days >= 4 ? { id: "ppl-upper-lower", name: "Push / Pull / Legs + Upper / Lower", days: cycle(["Push", "Pull", "Legs", "Upper", "Lower"], days) } : null,
    days >= 3 ? { id: "upper-lower-full", name: "Upper / Lower / Full body", days: cycle(["Upper", "Lower", "Full Body"], days) } : null,
    days >= 2 ? { id: "upper-only", name: "Upper every day", days: cycle(["Upper"], days) } : null,
    days >= 2 ? { id: "lower-only", name: "Lower every day", days: cycle(["Lower"], days) } : null,
  ];
  const same = (left: readonly SplitDay[], right: readonly SplitDay[]) => left.join("|") === right.join("|");
  const presets: SplitPreset[] = named
    .filter((preset): preset is Omit<SplitPreset, "suggested"> => Boolean(preset))
    .map((preset) => ({ ...preset, suggested: same(preset.days, suggestion) }));
  if (!presets.some((preset) => preset.suggested)) presets.unshift({ id: "suggested", name: "Suggested", days: suggestion, suggested: true });
  return presets.filter((preset, index) => presets.findIndex((other) => same(other.days, preset.days)) === index);
}

/** The ready-made week this one is, if it is one. */
export function matchingPreset(split: readonly SplitDay[]): SplitPreset | null {
  return splitPresets(split.length).find((preset) => preset.days.join("|") === split.join("|")) ?? null;
}

/** "Upper · Lower · Upper", with Sport Transfer and Full Body short enough for a phone. */
export function describeDays(days: readonly SplitDay[]): string {
  return days.map((day) => (day === "Sport Transfer" ? "Sport" : day === "Full Body" ? "Full body" : day)).join(" · ");
}
