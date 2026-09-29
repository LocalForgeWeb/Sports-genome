/**
 * Reading loose values out of Supabase rows. PostgREST returns numeric columns as strings, so a
 * number arrives either way; anything that is not a finite number or non-blank text becomes null.
 */

export function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** An exercise name with case, spacing and punctuation dropped, so "Back-Squat" meets "back squat". */
export function comparableName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
