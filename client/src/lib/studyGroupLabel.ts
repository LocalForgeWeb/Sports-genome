/**
 * Presentation filter for a study's population description.
 *
 * These strings are written for a research database, not for an athlete, and the
 * comparison card printed them verbatim. Real values in the library include
 * "Non-starters", the bare word "female", and "Healthy young men, mean age 20.9 ±
 * 1.449 y and body mass 69.65 ± 2.92 kg." - a standard deviation quoted to four
 * significant figures, which is the fake precision the evidence-visible rule names
 * as its anti-pattern.
 *
 * Rewriting 1,800 rows in the database is the real fix. Until then this keeps the
 * useful descriptions, tidies the numbers, and drops the fragments that tell an
 * athlete nothing.
 */

/** Below this a description is a fragment rather than a description of a group. */
const minimumUsefulLength = 12;

/**
 * Bare demographic words. On their own they restate what the comparison already
 * says - it matched your sex and age band - so they add a line and no information.
 */
const barePopulationWords = new Set([
  "male", "female", "men", "women", "boys", "girls", "adults", "athletes",
  "healthy adults", "general population", "starters", "non-starters", "controls",
  "control group", "intervention group", "experimental group", "participants",
]);

/** Rounds a quoted spread to one decimal: "20.9 ± 1.449 y" reads as "20.9 ± 1.4 y". */
export function tidyPrecision(text: string): string {
  return text.replace(/(\d+\.\d{2,})/g, match => {
    const rounded = Number(match);
    return Number.isFinite(rounded) ? rounded.toFixed(1) : match;
  });
}

/**
 * The group description to show beside a comparison, or null when the stored value
 * would not help the athlete read it.
 */
export function studyGroupLabel(populationDefinition: string | null | undefined): string | null {
  const value = (populationDefinition ?? "").trim();
  if (!value) return null;
  if (barePopulationWords.has(value.toLowerCase().replace(/[.]$/, ""))) return null;
  if (value.length < minimumUsefulLength) return null;
  return tidyPrecision(value).replace(/\s+/g, " ");
}
