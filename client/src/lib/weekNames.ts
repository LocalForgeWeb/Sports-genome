/**
 * The names an athlete gives the plan's weeks ("Heavy", "Deload", "Peak").
 *
 * A name is a label only. The week is still Week 1, 2 or 3 everywhere the app keys or
 * matches on it: day labels, the next workout, logged sessions and the plan's own record
 * all keep "Week N", so naming a week never orphans what was logged against it. Where a
 * week is shown, the name goes beside its number: "Week 2: Deload".
 */

export type WeekNames = Readonly<Record<number, string>>;

/** Long enough for "Strength block 2", short enough for a week pill on a phone. */
export const weekNameMaxLength = 24;

const planWeeks = [1, 2, 3] as const;

/** Trims, folds runs of spaces and line breaks into one space, and caps the length. */
export function cleanWeekName(raw: string): string {
  return Array.from(raw.replace(/\s+/g, " ").trim()).slice(0, weekNameMaxLength).join("").trim();
}

/** The names kept in a saved plan. Anything that is not a non-empty name of Week 1–3 is dropped. */
export function readWeekNames(value: unknown): Record<number, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const names: Record<number, string> = {};
  for (const week of planWeeks) {
    const raw = (value as Record<string, unknown>)[String(week)];
    if (typeof raw !== "string") continue;
    const name = cleanWeekName(raw);
    if (name) names[week] = name;
  }
  return names;
}

/** Sets or, for a blank name, removes one week's name. Returns the same object when nothing changes. */
export function withWeekName(names: WeekNames, week: number, raw: string): WeekNames {
  const name = cleanWeekName(raw);
  if ((names[week] ?? "") === name) return names;
  const next: Record<number, string> = { ...names };
  if (name) next[week] = name;
  else delete next[week];
  return next;
}

/** For the saved plan: only the weeks that have names, or nothing when none do. */
export function storedWeekNames(names: WeekNames): Record<string, string> | undefined {
  const entries = planWeeks.flatMap((week) => (names[week] ? [[String(week), names[week]] as const] : []));
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/** "Week 2: Deload", or "Week 2" for a week with no name. */
export function weekLabel(week: number, names?: WeekNames): string {
  const name = names?.[week];
  return name ? `Week ${week}: ${name}` : `Week ${week}`;
}
