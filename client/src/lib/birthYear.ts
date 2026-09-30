/**
 * The birth year is asked for in three places, onboarding, About Me and the Strength rank
 * gate, and all three read it the same way. It lives here rather than in any one component
 * because About Me already imports from the onboarding quiz, so the quiz importing back from
 * About Me would be a cycle.
 */

/** Years an athlete could plausibly have been born in: the hundred before this one, and this one. */
export function birthYearRange(now = new Date()): { min: number; max: number } {
  const max = now.getFullYear();
  return { min: max - 100, max };
}

/** The saved year a typed value stands for, or undefined while it is not yet a whole year in range. */
export function parseBirthYear(text: string, now = new Date()): number | undefined {
  if (!/^\d{4}$/.test(text)) return undefined;
  const year = Number(text);
  const { min, max } = birthYearRange(now);
  return year > min && year <= max ? year : undefined;
}

/**
 * Why a typed year will not be saved, said once it is plainly wrong (four digits, out of
 * range) or the field was left short. Null while it is empty, whole, or still being typed.
 */
export function birthYearHint(text: string, left: boolean, now = new Date()): string | null {
  if (!text || parseBirthYear(text, now) !== undefined || (text.length !== 4 && !left)) return null;
  if (text.length < 4) return "Four digits, like 1998.";
  const { min, max } = birthYearRange(now);
  return `Between ${min + 1} and ${max}.`;
}
