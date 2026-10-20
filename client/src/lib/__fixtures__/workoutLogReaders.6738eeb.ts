import { isSetEffort } from "@shared/setEffort";

/**
 * The workout log's readers as shipped on 18 Oct 2026, copied from 6738eeb
 * (`git show 6738eeb:client/src/lib/deviceWorkoutLog.ts`, `normalizeSet` to
 * `saveDeviceWorkoutSessions`; `git show 6738eeb:client/src/lib/specialization/bouts.ts`, `sideOf`).
 * The logic is unchanged; the types are local, so a later change to the app's types cannot change
 * what these read.
 *
 * A deploy older than the multi-region logger reads whatever a newer one writes through these
 * (10-multi-region.md §2.1). deviceWorkoutLog.legSide.test.ts writes the new shapes and reads them
 * back through these, to show that no leg side is ever read as an arm side.
 */

type DisplayWeightUnit = "lb" | "kg";
type DropStage = { id: string; weight: string; reps: string; unit?: DisplayWeightUnit };
type ShippedSet = {
  weight: string; reps: string; unit?: DisplayWeightUnit; height?: string; completed: boolean; skipped?: boolean; id?: string;
  type?: "standard" | "drop"; stages?: DropStage[]; effort?: unknown; side?: "left" | "right" | "both"; holdSeconds?: string; warmup?: boolean;
};
type ShippedExercise = { sets: ShippedSet[]; straps?: unknown } & Record<string, unknown>;
type ShippedSession = { exercises: ShippedExercise[]; weightUnit?: DisplayWeightUnit } & Record<string, unknown>;

const isSetSide = (value: unknown): value is "left" | "right" | "both" => value === "left" || value === "right" || value === "both";
const isStrapsUsed = (value: unknown) => value === "yes" || value === "no";
const isWeightUnit = (value: unknown): value is DisplayWeightUnit => value === "lb" || value === "kg";

function normalizeSet(set: ShippedSet): ShippedSet {
  const normalized: ShippedSet = { weight: String(set.weight || ""), reps: String(set.reps || ""), height: String(set.height || ""), completed: Boolean(set.completed), skipped: Boolean(set.skipped) };
  if (isWeightUnit(set.unit)) normalized.unit = set.unit;
  if (typeof set.id === "string" && set.id) normalized.id = set.id;
  if (isSetEffort(set.effort)) normalized.effort = set.effort;
  if (isSetSide(set.side)) normalized.side = set.side;
  const seconds = holdSecondsText(set.holdSeconds);
  if (seconds) normalized.holdSeconds = seconds;
  if (set.warmup === true) normalized.warmup = true;
  if (set.type === "drop") {
    normalized.type = "drop";
    normalized.stages = (Array.isArray(set.stages) ? set.stages : [])
      .filter((stage): stage is DropStage => typeof stage === "object" && stage !== null)
      .map((stage, index) => {
        const kept: DropStage = { id: typeof stage.id === "string" && stage.id ? stage.id : `${normalized.id ?? "set"}-stage-${index + 1}`, weight: String(stage.weight || ""), reps: String(stage.reps || "") };
        if (isWeightUnit(stage.unit)) kept.unit = stage.unit;
        return kept;
      });
  }
  return normalized;
}

function holdSecondsText(value: unknown): string | null {
  const text = typeof value === "number" && Number.isInteger(value) && value >= 0 ? String(value) : typeof value === "string" ? value.trim() : "";
  return /^\d{1,5}$/.test(text) ? String(Number(text)) : null;
}

function normalizeExercise<T extends object>(exercise: T): T {
  const straps = (exercise as { straps?: unknown }).straps;
  if (straps === undefined || isStrapsUsed(straps)) return exercise;
  const { straps: _dropped, ...rest } = exercise as T & { straps?: unknown };
  return rest as T;
}

export const shippedHistoryKey = "sports-genome-device-workout-history-v1";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function shippedLoadDeviceWorkoutSessions(): ShippedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(shippedHistoryKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isRecord).map((session) => ({
      ...session,
      exercises: Array.isArray(session.exercises) ? session.exercises.filter(isRecord).map((exercise) => ({
        ...normalizeExercise(exercise),
        sets: Array.isArray(exercise.sets) ? exercise.sets.filter(isRecord).map((set) => normalizeSet(set as ShippedSet)) : [],
      })) : [],
      weightUnit: isWeightUnit(session.weightUnit) ? session.weightUnit : undefined,
    })) as ShippedSession[] : [];
  } catch {
    return [];
  }
}

export function shippedSaveDeviceWorkoutSessions(sessions: ShippedSession[]): boolean {
  if (typeof window === "undefined") return false;
  const normalized = sessions.map((session) => ({ ...session, exercises: session.exercises.map((exercise) => ({ ...normalizeExercise(exercise), sets: exercise.sets.map(normalizeSet) })) }));
  try {
    window.localStorage.setItem(shippedHistoryKey, JSON.stringify(normalized));
  } catch {
    return false;
  }
  return true;
}

/** The calculator's side of a set as shipped (bouts.ts `sideOf`): only `side` names an arm. */
export function shippedSideOf(set: { side?: unknown }, variant: { laterality: string } | null): { side: "left" | "right" | "bilateral" | "unknown"; sideSource: "recorded" | "structural" | "unknown" } {
  const recorded = set.side as string | undefined;
  if (recorded === "left" || recorded === "right") return { side: recorded, sideSource: "recorded" };
  if (recorded === "both" || recorded === "bilateral") return { side: "bilateral", sideSource: "recorded" };
  if (variant?.laterality === "bilateral") return { side: "bilateral", sideSource: "structural" };
  return { side: "unknown", sideSource: "unknown" };
}
