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
 *
 * Two rules make that encoding safe to edit against:
 *
 * 1. `/` is this module's delimiter and nothing else's. `formatPrescription` strips it
 *    out of the individual targets before joining, so a string this module writes can
 *    always be read back with the same number of sets. Without that, typing "/5" into
 *    one set's field silently added a set to the workout.
 *
 * 2. Whether a prescription is written per set is part of the prescription, not a piece
 *    of screen state. "3 × 8" and "3 × 8/8/8" carry the same targets but not the same
 *    intent, and only the second one survives a reload, a tab change, or the same
 *    exercise appearing on another training day.
 */

export type PlannedSet = { reps: string };

export type SetPrescription = {
  sets: PlannedSet[];
  /** True when the prescription is written as one target per set. */
  varied: boolean;
};

export const defaultPrescription = "3 × 8–12";

/**
 * How many sets a prescription that never says gets. "RPE 8, autoregulated" is a
 * real thing to write in this field, and the logger has to offer some number of
 * rows to fill in; three is what every surface in the app has always assumed.
 */
export const defaultSetCount = 3;

/** The most sets the editor will build controls for. Not a limit on what may be read. */
export const maxEditableSets = 12;

/**
 * What may be read as one set's target within a slash list.
 *
 * Deliberately narrow about words: "3 × 8 / side" is one instruction about every set,
 * not two sets of different things, and the difference is that "side" is not a rep
 * count. Deliberately tolerant about half-written numbers: "12–" is what a range looks
 * like halfway through being typed, and a parser that rejects it turns every keystroke
 * into a different number of sets.
 */
const repSpec = /^\s*\d+\s*(?:[–—-]\s*\d*)?\s*(?:s|sec|secs|m|min|mins|yd|km)?\s*$/i;

const unitOf = (value: string) => value.match(/(s|sec|secs|m|min|mins|yd|km)\s*$/i)?.[1] ?? "";

export function parsePrescription(value: string | undefined, fallback = defaultPrescription): SetPrescription {
  const source = (value ?? "").trim() || fallback;
  const [, rawCount, rawTarget] = source.match(/^\s*(\d+)\s*(?:×|x)\s*(.+?)\s*$/i) || [];
  if (!rawCount || !rawTarget) {
    return { sets: Array.from({ length: defaultSetCount }, () => ({ reps: source || "8–12" })), varied: false };
  }

  const count = Math.max(1, Number.parseInt(rawCount, 10) || 1);
  const parts = rawTarget.split("/");
  const perSet = parts.length > 1 && parts.every((part) => repSpec.test(part));
  if (!perSet) return { sets: Array.from({ length: count }, () => ({ reps: rawTarget.trim() })), varied: false };

  /*
   * "3 × 30/20/10 sec" states the unit once, at the end, the way a person writes it.
   * Reading it literally gives the first two sets a bare number and the athlete a live
   * set card saying "Set 1 of 3 · 30" in the middle of a timed hold.
   */
  const trailingUnit = unitOf(parts[parts.length - 1]);
  const sets = parts.map((part) => {
    const reps = part.trim();
    return { reps: trailingUnit && !unitOf(reps) ? `${reps} ${trailingUnit}` : reps };
  });

  // A count and a list that disagree can arrive from a hand edit; the list is the more
  // specific statement, so the count follows it rather than truncating what was written.
  return { sets, varied: true };
}

function isUniform(sets: PlannedSet[]) {
  return sets.every((set) => set.reps === sets[0]?.reps);
}

/**
 * Write the list back out.
 *
 * `varied` asks for the per-set form even when the targets happen to agree, which is how
 * "I am writing this set by set" survives being saved. Targets that differ are always
 * written per set, whatever is asked for, because there is no other way to say them.
 */
export function formatPrescription(sets: PlannedSet[], varied = false): string {
  const cleaned = (sets.length ? sets : [{ reps: "" }]).map((set) => ({
    // `/` is the delimiter. A target that contains one would come back as two sets.
    reps: set.reps.replace(/\//g, " ").replace(/\s+/g, " ").trim() || "1",
  }));
  const perSet = varied || !isUniform(cleaned);
  const target = perSet ? cleaned.map((set) => set.reps).join("/") : cleaned[0].reps;
  return `${cleaned.length} × ${target}`;
}

/** The target shared by every set, or null when they differ. */
export function uniformReps(prescription: SetPrescription): string | null {
  return isUniform(prescription.sets) ? prescription.sets[0]?.reps ?? null : null;
}

/** How this prescription should be shown when it is being read rather than edited. */
export function displayPrescription(value: string | undefined): string {
  const parsed = parsePrescription(value);
  // Collapse "3 × 8/8/8" to "3 × 8" for a reader: the per-set form is a statement about
  // how it is edited, and repeating one number three times tells the athlete nothing.
  return formatPrescription(parsed.sets, false);
}

/**
 * Grow or shrink the list. A new set copies the last one, because the set you just
 * added is nearly always a continuation of the set before it.
 */
export function withSetCount(prescription: SetPrescription, count: number): SetPrescription {
  const target = Math.max(1, Math.min(maxEditableSets, Math.round(count) || 1));
  const sets = [...prescription.sets];
  while (sets.length > target) sets.pop();
  while (sets.length < target) sets.push({ reps: sets[sets.length - 1]?.reps ?? "8–12" });
  return { sets, varied: prescription.varied };
}

export function withSetReps(prescription: SetPrescription, index: number, reps: string): SetPrescription {
  const sets = prescription.sets.map((set, position) => position === index ? { reps } : set);
  return { sets, varied: prescription.varied };
}

/** Apply one target to every set, which is how varying is undone. */
export function withUniformReps(prescription: SetPrescription, reps: string): SetPrescription {
  return { sets: prescription.sets.map(() => ({ reps })), varied: false };
}

/** Open or close the per-set form without changing a single target. */
export function withVaried(prescription: SetPrescription, varied: boolean): SetPrescription {
  return { sets: prescription.sets, varied };
}

/** What the tracker should show for one set, so a varied plan is legible while training. */
export function repsForSet(value: string | undefined, index: number): string {
  const { sets } = parsePrescription(value);
  return (sets[index] ?? sets[sets.length - 1])?.reps ?? "";
}

/** What the prescription says, however many that is. */
export function setCount(value: string | undefined): number {
  return parsePrescription(value).sets.length;
}

/**
 * How many rows a surface should actually build for it.
 *
 * Separate from `setCount` on purpose: the weekly volume map wants the truth about a
 * pasted "20 × 15", and the logger wants a number of input rows a person can scroll
 * past. Capping inside the parser conflated the two and silently rewrote the plan.
 */
export function renderableSetCount(value: string | undefined): number {
  return Math.max(1, Math.min(maxEditableSets, setCount(value)));
}
