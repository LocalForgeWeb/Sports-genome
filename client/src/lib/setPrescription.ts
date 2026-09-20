/**
 * A prescription as a list of sets, not a single number of reps repeated.
 *
 * Real sets are not interchangeable. A top set of 6 followed by two back-off sets of
 * 10 is an ordinary way to train, and the planner could not express it: one reps field
 * applied to every set, so the only way to write 10/8/6 was three separate exercises.
 *
 * The per-set detail is carried inside the prescription string that already exists -
 * "4 × 10/8/6/6" rather than a second stored field. Everything downstream reads the
 * leading count before the `×` (the weekly volume map, the session diagnostics, the
 * tracker's planned-set count), so all of it keeps working untouched, and a pasted or
 * hand-typed "4 × 8–12" is still exactly what it was.
 */

export type PlannedSet = { reps: string };

export type SetPrescription = {
  sets: PlannedSet[];
  /** True when the sets do not all ask for the same thing. */
  varied: boolean;
};

export const defaultPrescription = "3 × 8–12";
const maxSets = 12;

/**
 * What may be read as one set's target within a slash list.
 *
 * Deliberately narrow. "3 × 8 / side" is one instruction about every set, not two sets
 * of different things, and the difference is that "side" is not a rep count. Anything
 * with a word in it that is not a unit keeps the whole target intact.
 */
const repSpec = /^\s*\d+(\s*[–—-]\s*\d+)?\s*(s|sec|secs|m|min|mins|yd|km)?\s*$/i;

const clampCount = (value: number) => Math.max(1, Math.min(maxSets, Math.round(value) || 1));

export function parsePrescription(value: string | undefined, fallback = defaultPrescription): SetPrescription {
  const source = (value ?? "").trim() || fallback;
  const [, rawCount, rawTarget] = source.match(/^\s*(\d+)\s*(?:×|x)\s*(.+?)\s*$/i) || [];
  if (!rawCount || !rawTarget) return { sets: [{ reps: source || "8–12" }], varied: false };

  const count = clampCount(Number.parseInt(rawCount, 10));
  const parts = rawTarget.split("/");
  const perSet = parts.length > 1 && parts.every((part) => repSpec.test(part));
  if (!perSet) return { sets: Array.from({ length: count }, () => ({ reps: rawTarget.trim() })), varied: false };

  // A count and a list that disagree can arrive from a hand edit; the list is the more
  // specific statement, so the count follows it rather than truncating what was written.
  const sets = parts.map((part) => ({ reps: part.trim() }));
  return { sets: sets.slice(0, maxSets), varied: !isUniform(sets) };
}

function isUniform(sets: PlannedSet[]) {
  return sets.every((set) => set.reps === sets[0]?.reps);
}

export function formatPrescription(sets: PlannedSet[]): string {
  const cleaned = sets.length ? sets.map((set) => ({ reps: set.reps.trim() || "1" })) : [{ reps: "1" }];
  const target = isUniform(cleaned) ? cleaned[0].reps : cleaned.map((set) => set.reps).join("/");
  return `${cleaned.length} × ${target}`;
}

/** The target shared by every set, or null when they differ. */
export function uniformReps(prescription: SetPrescription): string | null {
  return isUniform(prescription.sets) ? prescription.sets[0]?.reps ?? null : null;
}

/**
 * Grow or shrink the list. A new set copies the last one, because the set you just
 * added is nearly always a continuation of the set before it.
 */
export function withSetCount(prescription: SetPrescription, count: number): SetPrescription {
  const target = clampCount(count);
  const sets = [...prescription.sets];
  while (sets.length > target) sets.pop();
  while (sets.length < target) sets.push({ reps: sets[sets.length - 1]?.reps ?? "8–12" });
  return { sets, varied: !isUniform(sets) };
}

export function withSetReps(prescription: SetPrescription, index: number, reps: string): SetPrescription {
  const sets = prescription.sets.map((set, position) => position === index ? { reps } : set);
  return { sets, varied: !isUniform(sets) };
}

/** Apply one target to every set, which is how varying is undone. */
export function withUniformReps(prescription: SetPrescription, reps: string): SetPrescription {
  const sets = prescription.sets.map(() => ({ reps }));
  return { sets, varied: false };
}

/** What the tracker should show for one set, so a varied plan is legible while training. */
export function repsForSet(value: string | undefined, index: number): string {
  const { sets } = parsePrescription(value);
  return (sets[index] ?? sets[sets.length - 1])?.reps ?? "";
}

export function setCount(value: string | undefined): number {
  return parsePrescription(value).sets.length;
}
