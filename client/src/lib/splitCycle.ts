export type SplitDay = "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full Body" | "Sport Transfer";

export function splitDaysForFrequency(days: number): SplitDay[] {
  if (days === 1) return ["Full Body"];
  if (days === 2) return ["Upper", "Lower"];
  if (days === 3) return ["Push", "Pull", "Legs"];
  if (days === 4) return ["Upper", "Lower", "Upper", "Lower"];
  if (days === 5) return ["Push", "Pull", "Legs", "Upper", "Sport Transfer"];
  if (days === 6) return ["Push", "Pull", "Legs", "Upper", "Lower", "Sport Transfer"];
  return ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];
}

export function cycleSplitIndex(days: SplitDay[], activeIndex: number, direction: -1 | 1) {
  if (!days.length) return 0;
  return (Math.max(0, activeIndex) + direction + days.length) % days.length;
}
