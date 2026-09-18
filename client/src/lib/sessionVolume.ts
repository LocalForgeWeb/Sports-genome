/**
 * Whether a muscle is getting too little or too much work in this session.
 *
 * `weeklyVolume.ts` already bands direct sets against the register's landmarks -
 * 6 sets a week to be established, 12 for a high exposure - but it works on the
 * saved weekly plan. The stack analysis looks at one day and had nothing to say
 * about volume at all.
 *
 * The honest difficulty is that a weekly landmark cannot be applied to a session
 * without knowing how often the session recurs, and nothing here knows that:
 * `trainingDays` is total days per week, not how often *this* split comes round.
 * A Push day in a 4-day week might be trained once or twice, and guessing would
 * put a confident, wrong number on screen.
 *
 * So this does not guess. It reports the session's own direct sets and says what
 * weekly frequency that implies - "5 sets here; twice a week clears the 6-set
 * mark" - which is a statement about arithmetic the athlete can check, not a
 * prediction about their week.
 */

import type { Exercise } from "@/lib/exerciseCatalog";
import { logicCalibration } from "@/lib/evidenceTraceability";

export type VolumeReading = "none" | "indirect-only" | "light" | "solid" | "heavy";

export type MuscleSessionVolume = {
  muscle: string;
  directSets: number;
  /** Supporting work at the register's half-set convention. */
  supportSets: number;
  reading: VolumeReading;
  /** Sessions per week at this session's volume to clear the established mark. */
  sessionsForEstablished: number | null;
  note: string;
};

export const volumeReadingCopy: Record<VolumeReading, { label: string; glyph: string }> = {
  none: { label: "None", glyph: "—" },
  "indirect-only": { label: "Indirect only", glyph: "◦" },
  light: { label: "Light", glyph: "↓" },
  solid: { label: "Solid", glyph: "✓" },
  heavy: { label: "Heavy", glyph: "↑" },
};

/** The same "3" the planner falls back to when a prescription has no leading count. */
export const defaultSetsPerExercise = 3;

export function parseSetCount(prescription: string | undefined): number {
  return Number.parseInt(prescription?.match(/^\s*(\d+)/)?.[1] || "", 10) || defaultSetsPerExercise;
}

/**
 * A single session carrying the full weekly high-exposure landmark is a lot in
 * one sitting by the register's own numbers, whatever the weekly total.
 */
function readVolume(directSets: number, supportSets: number): VolumeReading {
  if (directSets === 0) return supportSets > 0 ? "indirect-only" : "none";
  if (directSets >= logicCalibration.exposure.highDirectSetBand) return "heavy";
  if (directSets >= logicCalibration.exposure.lowDirectSetBand) return "solid";
  return "light";
}

export function getSessionMuscleVolume(
  workout: readonly Exercise[],
  setsFor: (exercise: Exercise, index: number) => number = () => defaultSetsPerExercise
): MuscleSessionVolume[] {
  const direct = new Map<string, number>();
  const support = new Map<string, number>();

  workout.forEach((exercise, index) => {
    const sets = setsFor(exercise, index);
    const primary = new Set(exercise.primaryMuscles);
    primary.forEach((muscle) => direct.set(muscle, (direct.get(muscle) || 0) + sets));
    exercise.secondaryMuscles
      .filter((muscle) => !primary.has(muscle))
      .forEach((muscle) => support.set(muscle, (support.get(muscle) || 0) + sets * logicCalibration.exposure.secondarySetConvention));
  });

  const muscles = new Set(Array.from(direct.keys()).concat(Array.from(support.keys())));
  return Array.from(muscles)
    .map((muscle) => {
      const directSets = Number((direct.get(muscle) || 0).toFixed(1));
      const supportSets = Number((support.get(muscle) || 0).toFixed(1));
      const reading = readVolume(directSets, supportSets);
      const sessionsForEstablished = directSets > 0
        ? Math.ceil(logicCalibration.exposure.lowDirectSetBand / directSets)
        : null;
      return { muscle, directSets, supportSets, reading, sessionsForEstablished, note: noteFor(reading, directSets, supportSets, sessionsForEstablished) };
    })
    .sort((left, right) => right.directSets - left.directSets || right.supportSets - left.supportSets || left.muscle.localeCompare(right.muscle));
}

function noteFor(reading: VolumeReading, directSets: number, supportSets: number, sessions: number | null): string {
  if (reading === "indirect-only") return `${supportSets} supporting set${supportSets === 1 ? "" : "s"}, no direct work.`;
  if (reading === "none") return "Nothing in this session.";
  if (reading === "heavy") return `${directSets} direct sets in one session - the register's high-exposure mark for a whole week.`;
  if (reading === "solid") return `${directSets} direct sets clears the ${logicCalibration.exposure.lowDirectSetBand}-set mark in this session alone.`;
  return sessions === 1
    ? `${directSets} direct sets.`
    : `${directSets} direct set${directSets === 1 ? "" : "s"}; ${sessions}× a week clears the ${logicCalibration.exposure.lowDirectSetBand}-set mark.`;
}

/** Muscles worth calling out first: nothing direct, or a lot in one sitting. */
export function volumeOutliers(volumes: readonly MuscleSessionVolume[]) {
  return {
    heavy: volumes.filter((entry) => entry.reading === "heavy"),
    indirectOnly: volumes.filter((entry) => entry.reading === "indirect-only"),
  };
}
