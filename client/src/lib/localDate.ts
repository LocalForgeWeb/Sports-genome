/**
 * The calendar day the athlete is living in, as YYYY-MM-DD: what an
 * `<input type="date">` shows, and what `new Date(`${key}T12:00:00`)` reads
 * back as that day's local noon. `toISOString()` gives the UTC day instead,
 * which is tomorrow for an evening in the Americas.
 */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
