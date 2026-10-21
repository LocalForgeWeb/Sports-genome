export type SplitDay = "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full Body" | "Sport Transfer";

/** Every kind of day a week can hold, in the order the day editor offers them. */
export const splitDayTypes: readonly SplitDay[] = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];

export const maxTrainingDays = 7;

export const isSplitDay = (value: unknown): value is SplitDay => typeof value === "string" && (splitDayTypes as readonly string[]).includes(value);

export function splitDaysForFrequency(days: number): SplitDay[] {
  if (days === 1) return ["Full Body"];
  if (days === 2) return ["Upper", "Lower"];
  if (days === 3) return ["Push", "Pull", "Legs"];
  if (days === 4) return ["Upper", "Lower", "Upper", "Lower"];
  if (days === 5) return ["Push", "Pull", "Legs", "Upper", "Sport Transfer"];
  if (days === 6) return ["Push", "Pull", "Legs", "Upper", "Lower", "Sport Transfer"];
  return ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];
}

/**
 * The week as the athlete trains it: the days they chose, else the split recommended for how
 * often they train.
 *
 * The number of days was the only choice, and it decided every day's type: three days was
 * always Push / Pull / Legs and four was always Upper / Lower twice. The athlete's own days
 * now win, position by position. When the frequency changes somewhere else (the profile), a
 * shorter week keeps the chosen days it still has and a longer one fills the new positions
 * from the recommendation, so a chosen day is never renamed behind the athlete's back.
 */
export function effectiveSplit(days: number, chosen: readonly SplitDay[] | null | undefined): SplitDay[] {
  const recommended = splitDaysForFrequency(days);
  if (!chosen?.length) return recommended;
  return recommended.map((day, index) => chosen[index] ?? day);
}

/** Whether a week is exactly the one recommended for its length, so nothing needs storing. */
export function isRecommendedSplit(days: readonly SplitDay[]) {
  const recommended = splitDaysForFrequency(days.length);
  return days.length === recommended.length && days.every((day, index) => day === recommended[index]);
}

/** A split read back from a saved plan, or null when it is absent or is not one. */
export function readStoredSplit(value: unknown): SplitDay[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxTrainingDays) return null;
  return value.every(isSplitDay) ? [...value] : null;
}

export type SplitPreset = { id: string; label: string; days: SplitDay[] };

/** Common weeks, one tap each. Every day stays editable afterwards. */
export const splitPresets: readonly SplitPreset[] = [
  { id: "full-body-2", label: "Full body", days: ["Full Body", "Full Body"] },
  { id: "full-body-3", label: "Full body", days: ["Full Body", "Full Body", "Full Body"] },
  { id: "upper-lower", label: "Upper · Lower", days: ["Upper", "Lower"] },
  { id: "push-pull-legs", label: "Push · Pull · Legs", days: ["Push", "Pull", "Legs"] },
  { id: "upper-lower-2", label: "Upper · Lower ×2", days: ["Upper", "Lower", "Upper", "Lower"] },
  { id: "ppl-upper-lower", label: "Push · Pull · Legs · Upper · Lower", days: ["Push", "Pull", "Legs", "Upper", "Lower"] },
  { id: "push-pull-legs-2", label: "Push · Pull · Legs ×2", days: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"] },
];

export function cycleSplitIndex(days: SplitDay[], activeIndex: number, direction: -1 | 1) {
  if (!days.length) return 0;
  return (Math.max(0, activeIndex) + direction + days.length) % days.length;
}
