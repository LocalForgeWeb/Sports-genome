import { catalogMeasureOf } from "@shared/specialization/holdCatalogIds";
import { holdSecondsOf, isCompletedSet, isHoldSet, type DeviceSetLog, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { totalReps } from "./dropSets";
import { headDirectionActionOf, neckActionOf, type HeadDirection } from "./exerciseLogging";
import type { NeckAction } from "./exerciseExecution";
import { startOfTrainingWeek } from "./trainingWeekSummary";

/**
 * The neck's week, from what was logged (the Zercher, neck and bench handoff §4, "Neck weekly
 * view"): Flexion, Extension, Side bend and Rotation, the last two by the head's direction, each with
 * its dynamic work (sets and reps) and its holds (holds and seconds) in separate columns. Nothing
 * adds seconds to reps, and there is no one "neck volume" number.
 *
 * Counted from finished workouts on this device in one training week (Monday to Sunday), completed
 * sets only, warm-ups left out. A drop set is one set with its stages' reps. A set of a side-bend or
 * rotation exercise logged without a direction is not given one: it is counted on the "Unknown
 * direction" line of its action, never on Left or Right. An action with no sets reads "No logged
 * work", which says nothing about weakness or injury. Pure: the card reads this and counts nothing.
 */

/** Dynamic work and holds, kept apart: a set is one or the other. */
export type NeckWork = { sets: number; reps: number; holds: number; seconds: number };

/** One set behind a total, as the card lists it when its row is tapped. */
export type NeckWorkSet = {
  sessionId: string;
  completedAt: string;
  exerciseName: string;
  catalogId: number;
  /** The head's direction, on a side-bend or rotation set that recorded one. */
  direction: HeadDirection | null;
  /** A hold: its dose is `seconds`; otherwise `reps`. */
  hold: boolean;
  reps: number;
  /** A hold's seconds, or null when the hold was logged without them. */
  seconds: number | null;
};

/** "both" is a flexion or extension row, which has no side; "unknown" a directed set logged without one. */
export type NeckWeekLine = { action: NeckAction; side: HeadDirection | "both" | "unknown"; work: NeckWork; sets: NeckWorkSet[] };

export type NeckWeekSummary = {
  /** Monday 00:00 of the week, local time; `to` is the next Monday. */
  from: Date;
  to: Date;
  /** Flexion, Extension, Side bend Left and Right, Rotation Left and Right, in that order, then an unknown-direction line per directed action that has one. */
  lines: NeckWeekLine[];
  /** Any neck set at all this week: the card is shown only then. */
  hasWork: boolean;
};

const ORDER: readonly { action: NeckAction; side: NeckWeekLine["side"] }[] = [
  { action: "flexion", side: "both" },
  { action: "extension", side: "both" },
  { action: "lateral_flexion", side: "left" },
  { action: "lateral_flexion", side: "right" },
  { action: "rotation", side: "left" },
  { action: "rotation", side: "right" },
];

export const neckActionLabels: Record<NeckAction, string> = { flexion: "Flexion", extension: "Extension", lateral_flexion: "Side bend", rotation: "Rotation" };

const emptyWork = (): NeckWork => ({ sets: 0, reps: 0, holds: 0, seconds: 0 });

/**
 * Whether a logged set is a hold: it holds seconds, or it is on an exercise measured in seconds and
 * holds no reps (a hold whose seconds were never typed). Reps logged on a timed row stay reps.
 */
const isHoldOn = (set: DeviceSetLog, catalogId: number) => isHoldSet(set) || (catalogMeasureOf(catalogId) === "seconds" && !set.reps.trim());

export function neckWeekSummary(sessions: readonly DeviceWorkoutSession[], now: Date = new Date()): NeckWeekSummary {
  const from = startOfTrainingWeek(now);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  const lines = new Map<string, NeckWeekLine>(ORDER.map(({ action, side }) => [`${action}:${side}`, { action, side, work: emptyWork(), sets: [] }]));
  const unknown = new Map<NeckAction, NeckWeekLine>();
  const finished = sessions
    .filter((session) => session.status === "completed")
    .map((session) => ({ session, at: new Date(session.completedAt ?? session.startedAt) }))
    .filter(({ at }) => at >= from && at < to)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const { session, at } of finished) {
    for (const exercise of session.exercises) {
      const catalogId = exercise.catalogId;
      const action = neckActionOf(catalogId);
      if (catalogId === undefined || !action) continue;
      const directed = headDirectionActionOf(catalogId) !== null;
      for (const set of exercise.sets) {
        if (!isCompletedSet(set) || set.warmup) continue;
        const hold = isHoldOn(set, catalogId);
        const direction = directed && set.headDirection ? set.headDirection : null;
        const side: NeckWeekLine["side"] = !directed ? "both" : direction ?? "unknown";
        let line = lines.get(`${action}:${side}`);
        if (!line) {
          line = unknown.get(action) ?? { action, side, work: emptyWork(), sets: [] };
          unknown.set(action, line);
        }
        const seconds = hold ? holdSecondsOf(set) : null;
        const reps = hold ? 0 : totalReps(set);
        if (hold) { line.work.holds += 1; line.work.seconds += seconds ?? 0; } else { line.work.sets += 1; line.work.reps += reps; }
        line.sets.push({ sessionId: session.id, completedAt: at.toISOString(), exerciseName: exercise.exerciseName, catalogId, direction, hold, reps, seconds });
      }
    }
  }
  const all = [...Array.from(lines.values()), ...(["lateral_flexion", "rotation"] as const).flatMap((action) => (unknown.has(action) ? [unknown.get(action)!] : []))];
  return { from, to, lines: all, hasWork: all.some((line) => line.sets.length > 0) };
}

/** "3 sets · 36 reps", or null with no dynamic sets. */
export function dynamicWorkText(work: NeckWork): string | null {
  if (!work.sets) return null;
  return `${work.sets} ${work.sets === 1 ? "set" : "sets"} · ${work.reps} ${work.reps === 1 ? "rep" : "reps"}`;
}

/** "2 holds · 40 s", or null with no holds. */
export function holdWorkText(work: NeckWork): string | null {
  if (!work.holds) return null;
  return `${work.holds} ${work.holds === 1 ? "hold" : "holds"} · ${work.seconds} s`;
}

/** "Side bend · Left", "Flexion", "Rotation · Unknown direction": a line's name. */
export function neckLineLabel(line: Pick<NeckWeekLine, "action" | "side">): string {
  const action = neckActionLabels[line.action];
  if (line.side === "both") return action;
  if (line.side === "unknown") return `${action} · Unknown direction`;
  return `${action} · ${line.side === "left" ? "Left" : "Right"}`;
}
