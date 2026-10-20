import { useCallback, useEffect, useState } from "react";
import { readScopedRecord, scopedKey } from "@/lib/deviceStorageScope";
import { goalMetrics, goalPeriods, isGoalActiveAt, validateGoal, type GoalValidation } from "@shared/specialization/goals";
import { isDateKey, isValidTimeZone } from "@shared/specialization/time";
import type { MeasurementProtocol, SpecializationGoal, SpecializationMeasurement } from "@shared/specialization/types";

/**
 * Specialization targets and measurements, on the device (design §5, 01-reconciliation.md).
 *
 * Personal data lives where the plan lives: under the account's own key (`scopedKey`), so
 * two people on one device never see each other's targets. The Supabase tables with
 * owner-only access exist for a later sync; nothing writes them yet.
 *
 * What comes back from storage is checked entry by entry: a corrupt or foreign record
 * reads as nothing rather than a crash, an entry that is not a target (or not a
 * measurement) is dropped, and a write the device refused is reported as refused rather
 * than announced to the screens listening for it.
 */

export const specializationGoalsKeyBase = "sports-genome-specialization-goals-v1";
export const specializationMeasurementsKeyBase = "sports-genome-specialization-measurements-v1";
export const specializationGoalsEvent = "sports-genome:specialization-goals";
export const specializationMeasurementsEvent = "sports-genome:specialization-measurements";

export type AccountScope = string | number | null | undefined;
export type StoreWrite = { ok: true } | { ok: false; reason: string };

const REFUSED: StoreWrite = { ok: false, reason: "This device did not save it. Storage may be full or turned off." };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";
const optionalString = (value: unknown): string | null | undefined => (value === undefined || value === null ? null : typeof value === "string" ? value : undefined);

function readList(base: string, accountId: AccountScope): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(readScopedRecord(base, accountId, window.localStorage) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(base: string, accountId: AccountScope, event: string, list: readonly unknown[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(scopedKey(base, accountId), JSON.stringify(list));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(event));
  return true;
}

// ---------------------------------------------------------------- goals

/** A stored entry as a target, or null when it is not one this version can read. */
export function parseStoredGoal(value: unknown): SpecializationGoal | null {
  if (!isRecord(value)) return null;
  const nodeId = value.nodeId ?? null;
  const actionId = value.actionId ?? null;
  const endsOn = value.endsOn ?? null;
  if (!nonEmpty(value.id) || !nonEmpty(value.regionId)) return null;
  if (!(nodeId === null || nonEmpty(nodeId)) || !(actionId === null || nonEmpty(actionId))) return null;
  if ((nodeId === null) === (actionId === null)) return null;
  if (value.side !== "left" && value.side !== "right") return null;
  if (!goalMetrics.includes(value.metric as SpecializationGoal["metric"]) || !goalPeriods.includes(value.period as SpecializationGoal["period"])) return null;
  if (typeof value.target !== "number" || !Number.isFinite(value.target) || value.target <= 0) return null;
  if (!isDateKey(value.startsOn) || !(endsOn === null || isDateKey(endsOn))) return null;
  if (!isValidTimeZone(value.timezone)) return null;
  return {
    id: value.id,
    regionId: value.regionId,
    nodeId: nodeId as string | null,
    actionId: actionId as string | null,
    side: value.side,
    metric: value.metric as SpecializationGoal["metric"],
    target: value.target,
    period: value.period as SpecializationGoal["period"],
    startsOn: value.startsOn,
    endsOn: endsOn as string | null,
    timezone: value.timezone,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

export function loadSpecializationGoals(accountId?: AccountScope): SpecializationGoal[] {
  return collapseArmPairs(readList(specializationGoalsKeyBase, accountId).map(parseStoredGoal).filter((goal): goal is SpecializationGoal => goal !== null));
}

/**
 * Both arms are counted as one (20 Oct 2026). A target saved for "Both arms" was stored as
 * two, one per arm, identical but for the side: they read as one target (the right arm's copy
 * kept). The next write saves the list as read, so the extra copy leaves the device then.
 */
export function collapseArmPairs(goals: readonly SpecializationGoal[]): SpecializationGoal[] {
  const keyOf = (goal: SpecializationGoal) => [goal.regionId, goal.nodeId, goal.actionId, goal.metric, goal.period, goal.target, goal.startsOn, goal.endsOn, goal.timezone].join("|");
  const rights = new Set(goals.filter((goal) => goal.side === "right").map(keyOf));
  return goals.filter((goal) => !(goal.side === "left" && rights.has(keyOf(goal))));
}

/** Returns whether the write reached the device. */
export function saveSpecializationGoals(goals: readonly SpecializationGoal[], accountId?: AccountScope): boolean {
  return writeList(specializationGoalsKeyBase, accountId, specializationGoalsEvent, goals);
}

/** Adds a target, or replaces the one with its id; refused (with the reason) when it overlaps another. */
export function upsertGoal(existing: readonly SpecializationGoal[], goal: SpecializationGoal): { ok: true; goals: SpecializationGoal[] } | { ok: false; reason: string } {
  const verdict: GoalValidation = validateGoal(goal, existing);
  if (!verdict.ok) return verdict;
  const index = existing.findIndex((item) => item.id === goal.id);
  const goals = index < 0 ? [...existing, goal] : existing.map((item, at) => (at === index ? goal : item));
  return { ok: true, goals };
}

export function removeGoal(existing: readonly SpecializationGoal[], goalId: string): SpecializationGoal[] {
  return existing.filter((goal) => goal.id !== goalId);
}

/**
 * Whether the athlete has an active target in a region. The logger asks this before
 * offering region-specific controls (straps), so they stay out of the way until relevant.
 */
export function hasActiveGoalForRegion(regionId: string, accountId?: AccountScope, nowIso: string = new Date().toISOString()): boolean {
  return loadSpecializationGoals(accountId).some((goal) => goal.regionId === regionId && isGoalActiveAt(goal, nowIso));
}

// ---------------------------------------------------------------- measurements

const POSTURES: readonly MeasurementProtocol["posture"][] = ["arm_relaxed_hanging", "arm_extended_supported", "elbow_90_supported", "other"];
const CONDITIONS: readonly MeasurementProtocol["condition"][] = ["unpumped", "pumped", "unknown"];
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseProtocol(value: unknown): MeasurementProtocol | null {
  if (!isRecord(value) || !nonEmpty(value.landmark)) return null;
  const distance = value.distanceFromLandmarkCm ?? null;
  if (!(distance === null || (typeof distance === "number" && Number.isFinite(distance) && distance >= 0))) return null;
  if (!POSTURES.includes(value.posture as MeasurementProtocol["posture"]) || !CONDITIONS.includes(value.condition as MeasurementProtocol["condition"])) return null;
  const device = optionalString(value.device);
  const timeOfDay = optionalString(value.timeOfDay);
  if (device === undefined || timeOfDay === undefined || (timeOfDay !== null && !TIME_OF_DAY.test(timeOfDay))) return null;
  return {
    landmark: value.landmark,
    distanceFromLandmarkCm: distance as number | null,
    posture: value.posture as MeasurementProtocol["posture"],
    condition: value.condition as MeasurementProtocol["condition"],
    device,
    timeOfDay,
  };
}

/** A stored entry as a measurement, or null when it is not one this version can read. */
export function parseStoredMeasurement(value: unknown): SpecializationMeasurement | null {
  if (!isRecord(value) || !nonEmpty(value.id) || !nonEmpty(value.regionId)) return null;
  if (value.side !== "left" && value.side !== "right") return null;
  if (typeof value.measuredAt !== "string" || !Number.isFinite(Date.parse(value.measuredAt))) return null;
  if (value.metric !== "circumference_cm" && value.metric !== "grip_force_n") return null;
  if (typeof value.value !== "number" || !Number.isFinite(value.value) || value.value <= 0) return null;
  const protocol = parseProtocol(value.protocol);
  const notes = optionalString(value.notes);
  if (!protocol || notes === undefined) return null;
  return { id: value.id, regionId: value.regionId, side: value.side, measuredAt: value.measuredAt, metric: value.metric, value: value.value, protocol, notes };
}

const byMeasuredAt = (a: SpecializationMeasurement, b: SpecializationMeasurement) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Measurements in time order. */
export function loadSpecializationMeasurements(accountId?: AccountScope): SpecializationMeasurement[] {
  return readList(specializationMeasurementsKeyBase, accountId)
    .map(parseStoredMeasurement)
    .filter((entry): entry is SpecializationMeasurement => entry !== null)
    .sort(byMeasuredAt);
}

export function saveSpecializationMeasurements(entries: readonly SpecializationMeasurement[], accountId?: AccountScope): boolean {
  return writeList(specializationMeasurementsKeyBase, accountId, specializationMeasurementsEvent, [...entries].sort(byMeasuredAt));
}

// ---------------------------------------------------------------- hooks

function useStoredList<T>(base: string, event: string, load: (accountId: AccountScope) => T[], accountId: AccountScope): T[] {
  const [list, setList] = useState<T[]>(() => load(accountId));
  useEffect(() => {
    // Same content, same array: listeners elsewhere do not re-render for a write that changed nothing here.
    const refresh = () => setList((current) => {
      const next = load(accountId);
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
    const onStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key === null || storageEvent.key === scopedKey(base, accountId)) refresh();
    };
    refresh();
    window.addEventListener(event, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(event, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [base, event, load, accountId]);
  return list;
}

/** The account's targets, kept current across screens and tabs, with checked writes. */
export function useSpecializationGoals(accountId?: AccountScope) {
  const goals = useStoredList(specializationGoalsKeyBase, specializationGoalsEvent, loadSpecializationGoals, accountId);
  const save = useCallback((goal: SpecializationGoal | readonly SpecializationGoal[]): StoreWrite => {
    let next = loadSpecializationGoals(accountId);
    for (const item of Array.isArray(goal) ? goal : [goal as SpecializationGoal]) {
      const result = upsertGoal(next, item);
      if (!result.ok) return result;
      next = result.goals;
    }
    return saveSpecializationGoals(next, accountId) ? { ok: true } : REFUSED;
  }, [accountId]);
  const remove = useCallback((goalId: string): StoreWrite => (saveSpecializationGoals(removeGoal(loadSpecializationGoals(accountId), goalId), accountId) ? { ok: true } : REFUSED), [accountId]);
  return { goals, save, remove };
}

/** The account's measurements in time order, with checked writes. */
export function useSpecializationMeasurements(accountId?: AccountScope) {
  const measurements = useStoredList(specializationMeasurementsKeyBase, specializationMeasurementsEvent, loadSpecializationMeasurements, accountId);
  const save = useCallback((entry: SpecializationMeasurement): StoreWrite => {
    if (!parseStoredMeasurement(entry)) return { ok: false, reason: "Enter a value above zero, the arm, and where and how it was measured." };
    const others = loadSpecializationMeasurements(accountId).filter((item) => item.id !== entry.id);
    return saveSpecializationMeasurements([...others, entry], accountId) ? { ok: true } : REFUSED;
  }, [accountId]);
  const remove = useCallback((id: string): StoreWrite => (saveSpecializationMeasurements(loadSpecializationMeasurements(accountId).filter((item) => item.id !== id), accountId) ? { ok: true } : REFUSED), [accountId]);
  return { measurements, save, remove };
}
