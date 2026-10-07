import { preTrainingMobilityLibrary, type MobilityDrill } from "@/lib/preTrainingMobility";

/**
 * Saved preparation routines: an ordered list of drills from the app's own preparation library
 * (lib/preTrainingMobility, the same drills and ids the suggested warm-up uses), saved under a
 * name and reused before workouts.
 *
 * Preparation is not training volume. A routine never becomes a plan entry, and doing it never
 * becomes a logged set: progress is kept in its own record, apart from the workout's sets, so
 * it cannot change weekly sets, lift counts, ranks or records. Nothing here infers muscle work
 * from a drill being present. It is not a readiness check, a screening or rehab advice.
 *
 * - A dose the athlete writes is kept apart from the library's own dose; the library's is shown,
 *   marked as such, where they wrote none.
 * - A routine assigned to a planned day ("Week 1 · Day 02 · Pull") is stored here, never in the
 *   day, so the day's exercises and prescriptions are untouched. "Today only" is a separate,
 *   one-workout choice that leaves the assignment as it is.
 * - Today's progress keeps a snapshot of the routine it was done from, so editing the routine
 *   later never rewrites what an earlier workout showed or recorded.
 * - A drill the library no longer has keeps its saved name and dose and is shown as missing,
 *   never swapped for another drill.
 */

export type PrepStep = { drillId: string; name: string; dose?: string; note?: string };
export type PrepRoutine = { id: string; schema: 1; name: string; steps: PrepStep[]; createdAt: string; updatedAt: string; archivedAt?: string };
export type PrepStore = { version: 1; routines: PrepRoutine[]; assignments: Record<string, string> };
export type PrepRun = { key: string; dayLabel: string; date: string; routineId: string; scope: "assigned" | "today"; snapshot: { name: string; steps: PrepStep[] }; done: number[]; skipped: boolean; updatedAt: string };
export type PrepRunStore = { version: 1; runs: Record<string, PrepRun>; today: Record<string, string> };

export const PREP_STORE = "sg-prep-routines-v1";
export const PREP_RUN_STORE = "sg-prep-progress-v1";
export const emptyPrepStore: PrepStore = { version: 1, routines: [], assignments: {} };
export const emptyPrepRunStore: PrepRunStore = { version: 1, runs: {}, today: {} };
export const prepLimits = { name: 60, steps: 16, dose: 40, note: 160, runsKept: 60 } as const;

export function isPrepStore(value: unknown): value is PrepStore {
  const store = value as PrepStore;
  return Boolean(store && store.version === 1 && Array.isArray(store.routines) && store.assignments && typeof store.assignments === "object"
    && store.routines.every((routine) => routine && typeof routine.id === "string" && routine.schema === 1 && typeof routine.name === "string" && Array.isArray(routine.steps) && routine.steps.every((step) => typeof step.drillId === "string" && typeof step.name === "string")));
}
export function isPrepRunStore(value: unknown): value is PrepRunStore {
  const store = value as PrepRunStore;
  return Boolean(store && store.version === 1 && store.runs && typeof store.runs === "object" && store.today && typeof store.today === "object");
}

const library = new Map(preTrainingMobilityLibrary.map((drill) => [drill.id, drill]));
export const drillById = (id: string): MobilityDrill | undefined => library.get(id);

/** What a step shows: the drill's own text when the library still has it, the saved copy when not. */
export function stepView(step: PrepStep) {
  const drill = drillById(step.drillId);
  return {
    name: drill?.name ?? step.name,
    available: Boolean(drill),
    dose: step.dose?.trim() || drill?.dose || "",
    doseIsLibraryDefault: !step.dose?.trim() && Boolean(drill),
    cue: drill?.cue,
    phase: drill?.phase,
    note: step.note,
  };
}

/** Minutes a dose clearly states ("45 sec", "2 min", "2 × 30 s"); null when it is counted in reps or distance. */
export function doseMinutes(dose: string): number | null {
  const text = dose.toLowerCase();
  const sets = Number(text.match(/^(\d+)\s*[×x]/)?.[1] ?? 1);
  const seconds = text.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds)\b/);
  if (seconds) return (Number(seconds[1]) * sets) / 60;
  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minutes)\b/);
  if (minutes) return Number(minutes[1]) * sets;
  return null;
}

/**
 * An estimate of the routine's length, or null when the steps don't support one. A step on the
 * library's dose uses the library's own minutes; a step with the athlete's dose counts only if
 * that dose states a time. Repetitions alone never imply a duration.
 */
export function estimatedMinutes(steps: PrepStep[]): number | null {
  let total = 0;
  for (const step of steps) {
    const drill = drillById(step.drillId);
    if (step.dose?.trim()) {
      const minutes = doseMinutes(step.dose);
      if (minutes === null) return null;
      total += minutes;
    } else if (drill) total += drill.minutes;
    else return null;
  }
  return steps.length ? Math.max(1, Math.round(total)) : null;
}

const clip = (value: string, max: number) => value.replace(/\s+/g, " ").trim().slice(0, max);

export function routineFromDrills(name: string, drillIds: string[], meta: { id: string; now: string }): { ok: true; routine: PrepRoutine } | { ok: false; message: string } {
  const cleanName = clip(name, prepLimits.name);
  if (!cleanName) return { ok: false, message: "Give the routine a name, like Lower-body prep." };
  const steps = drillIds.map((id) => drillById(id)).filter((drill): drill is MobilityDrill => Boolean(drill)).slice(0, prepLimits.steps).map((drill) => ({ drillId: drill.id, name: drill.name }));
  if (!steps.length) return { ok: false, message: "Add at least one drill." };
  return { ok: true, routine: { id: meta.id, schema: 1, name: cleanName, steps, createdAt: meta.now, updatedAt: meta.now } };
}

/** The routine's steps replaced (reordered, added, removed, doses and notes edited), validated. */
export function editRoutine(store: PrepStore, id: string, fields: { name: string; steps: PrepStep[] }, now: string): { ok: true; store: PrepStore } | { ok: false; message: string } {
  const name = clip(fields.name, prepLimits.name);
  if (!name) return { ok: false, message: "A routine needs a name." };
  if (!fields.steps.length) return { ok: false, message: "A routine needs at least one drill. Archive it instead." };
  if (fields.steps.length > prepLimits.steps) return { ok: false, message: `A routine holds up to ${prepLimits.steps} drills.` };
  const steps = fields.steps.map((step) => {
    const dose = clip(step.dose ?? "", prepLimits.dose);
    const note = clip(step.note ?? "", prepLimits.note);
    return { drillId: step.drillId, name: drillById(step.drillId)?.name ?? step.name, ...(dose ? { dose } : {}), ...(note ? { note } : {}) };
  });
  return { ok: true, store: { ...store, routines: store.routines.map((routine) => (routine.id === id ? { ...routine, name, steps, updatedAt: now } : routine)) } };
}

export function upsertRoutine(store: PrepStore, routine: PrepRoutine): PrepStore {
  return { ...store, routines: store.routines.some((item) => item.id === routine.id) ? store.routines.map((item) => (item.id === routine.id ? routine : item)) : [...store.routines, routine] };
}

export function duplicateRoutine(store: PrepStore, id: string, newId: string, now: string): PrepStore {
  const source = store.routines.find((routine) => routine.id === id);
  if (!source) return store;
  const copy: PrepRoutine = { ...source, id: newId, name: clip(`${source.name} (copy)`, prepLimits.name), steps: source.steps.map((step) => ({ ...step })), createdAt: now, updatedAt: now };
  delete copy.archivedAt;
  return { ...store, routines: [...store.routines, copy] };
}

/** Archived routines stay (and can be restored) but are no longer assigned anywhere. */
export function setRoutineArchived(store: PrepStore, id: string, archived: boolean, now: string): PrepStore {
  const assignments = archived ? Object.fromEntries(Object.entries(store.assignments).filter(([, routineId]) => routineId !== id)) : store.assignments;
  return { ...store, assignments, routines: store.routines.map((routine) => {
    if (routine.id !== id) return routine;
    const next: PrepRoutine = { ...routine, updatedAt: now };
    if (archived) next.archivedAt = now; else delete next.archivedAt;
    return next;
  }) };
}

/** Assigns (or, with null, unassigns) a routine for a planned day. The day's own record is not touched. */
export function assignRoutine(store: PrepStore, dayLabel: string, routineId: string | null): PrepStore {
  const assignments = { ...store.assignments };
  if (routineId) assignments[dayLabel] = routineId; else delete assignments[dayLabel];
  return { ...store, assignments };
}

export const activeRoutines = (store: PrepStore) => store.routines.filter((routine) => !routine.archivedAt).sort((a, b) => a.name.localeCompare(b.name));
export const archivedRoutines = (store: PrepStore) => store.routines.filter((routine) => routine.archivedAt).sort((a, b) => a.name.localeCompare(b.name));

/** Today's preparation for a planned day: the one-workout choice first, then the day's assignment. */
export const runKey = (dayLabel: string, date: string) => `${date}|${dayLabel}`;
export function routineForToday(store: PrepStore, runs: PrepRunStore, dayLabel: string, date: string): { routine: PrepRoutine; scope: "assigned" | "today" } | null {
  const todayId = runs.today[runKey(dayLabel, date)];
  const today = todayId ? store.routines.find((routine) => routine.id === todayId && !routine.archivedAt) : undefined;
  if (today) return { routine: today, scope: "today" };
  const assignedId = store.assignments[dayLabel];
  const assigned = assignedId ? store.routines.find((routine) => routine.id === assignedId && !routine.archivedAt) : undefined;
  return assigned ? { routine: assigned, scope: "assigned" } : null;
}

export function chooseForToday(runs: PrepRunStore, dayLabel: string, date: string, routineId: string | null): PrepRunStore {
  const key = runKey(dayLabel, date);
  const today = { ...runs.today };
  if (routineId) today[key] = routineId; else delete today[key];
  // A different routine starts a fresh checklist; the earlier one's run is kept as it was.
  const current = runs.runs[key];
  const keepRun = current && current.routineId === routineId;
  const nextRuns = { ...runs.runs };
  if (!keepRun && current) delete nextRuns[key];
  return { ...runs, today, runs: nextRuns };
}

/** Today's run of a routine, created with a snapshot the first time a step is marked or prep is skipped. */
function ensureRun(runs: PrepRunStore, dayLabel: string, date: string, routine: PrepRoutine, scope: "assigned" | "today", now: string): PrepRun {
  const key = runKey(dayLabel, date);
  const existing = runs.runs[key];
  if (existing && existing.routineId === routine.id) return existing;
  return { key, dayLabel, date, routineId: routine.id, scope, snapshot: { name: routine.name, steps: routine.steps.map((step) => ({ ...step })) }, done: [], skipped: false, updatedAt: now };
}

function keepRecent(runs: Record<string, PrepRun>): Record<string, PrepRun> {
  const entries = Object.values(runs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, prepLimits.runsKept);
  return Object.fromEntries(entries.map((run) => [run.key, run]));
}

export function toggleStep(runs: PrepRunStore, dayLabel: string, date: string, routine: PrepRoutine, scope: "assigned" | "today", stepIndex: number, now: string): PrepRunStore {
  const run = ensureRun(runs, dayLabel, date, routine, scope, now);
  const done = run.done.includes(stepIndex) ? run.done.filter((index) => index !== stepIndex) : [...run.done, stepIndex].sort((a, b) => a - b);
  return { ...runs, runs: keepRecent({ ...runs.runs, [run.key]: { ...run, done, skipped: false, updatedAt: now } }) };
}

export function skipPreparation(runs: PrepRunStore, dayLabel: string, date: string, routine: PrepRoutine, scope: "assigned" | "today", skipped: boolean, now: string): PrepRunStore {
  const run = ensureRun(runs, dayLabel, date, routine, scope, now);
  return { ...runs, runs: keepRecent({ ...runs.runs, [run.key]: { ...run, skipped, updatedAt: now } }) };
}

/** The run for today, if any step was marked or prep was skipped: it shows its own snapshot. */
export function todaysRun(runs: PrepRunStore, dayLabel: string, date: string, routineId: string): PrepRun | null {
  const run = runs.runs[runKey(dayLabel, date)];
  return run && run.routineId === routineId ? run : null;
}

/** The athlete's local calendar date, as the key for "today's workout". */
export function localDate(at = new Date()): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
}
