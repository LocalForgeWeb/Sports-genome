export const weekNumbers = [1, 2, 3] as const;

export function visibleWeeks(generated: number[], activeWeek: number): number[] {
  return Array.from(new Set(generated.concat(activeWeek))).filter((week) => weekNumbers.includes(week as 1 | 2 | 3)).sort((left, right) => left - right);
}

export function nextWeekToGenerate(generated: number[], activeWeek: number): number | undefined {
  return weekNumbers.find((week) => week !== activeWeek && !generated.includes(week));
}
