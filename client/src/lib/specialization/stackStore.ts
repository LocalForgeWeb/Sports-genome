import { useCallback, useEffect, useState } from "react";
import { readScopedRecord, scopedKey } from "@/lib/deviceStorageScope";
import { commitDay, loadDay, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { catalogIdOf } from "@/lib/workoutSwap";
import type { AccountScope, StoreWrite } from "./stores";
import { STACK_RULES, type StackDesign, type StackSettings } from "./stack";

/**
 * The stack designer's record on the device (docs/specialization-atlas, note 11,
 * §3.9), on the pattern of stores.ts: one list per account under its own key (`scopedKey`), each
 * entry checked on load, an entry this version cannot read left out of what the screens see and
 * written back untouched on every save, storage that is corrupt or refused read as nothing, and a
 * refused write said rather than announced. Every read and write is inside a try/catch.
 *
 * Two kinds of entry:
 * - **a region's last choice**, `{ kind: "choice", regionId, total, settings, updatedAt }`: the
 *   athlete's last total and settings, to start a design for another week;
 * - **a stack**, `{ kind: "stack", id, regionId, planWeek, mappingVersion, total, createdAt, settings,
 *   entries }`: what one Add wrote into one plan week, so Take it out and Change the total remove
 *   exactly the entries still as the stack wrote them (same exercise, day and prescription).
 *
 * It holds no side. It is never synced and never in a share card: on another device the stack's
 * entries are simply plan entries.
 */

export const specializationStacksKeyBase = "sports-genome-specialization-stacks-v1";
export const specializationStacksEvent = "sports-genome:specialization-stacks";

export type StackChoiceRecord = { kind: "choice"; regionId: string; total: number; settings: StackSettings; updatedAt: string };
export type StackRecordEntry = { dayKey: string; catalogExerciseId: number; prescription: string };
export type StackRecord = {
  kind: "stack";
  id: string;
  regionId: string;
  planWeek: number;
  mappingVersion: string;
  total: number;
  createdAt: string;
  settings: StackSettings;
  entries: StackRecordEntry[];
};

const REFUSED: StoreWrite = { ok: false, reason: "This device did not save it. Storage may be full or turned off." };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";
const isCount = (value: unknown, low = 0): value is number => typeof value === "number" && Number.isInteger(value) && value >= low;
const isInstant = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));

/** Stored settings as the designer reads them, or null when they are not settings this version can read. */
export function parseStackSettings(value: unknown): StackSettings | null {
  if (!isRecord(value)) return null;
  const days = value.days ?? null;
  if (!(days === null || (Array.isArray(days) && days.every(nonEmpty)))) return null;
  const { min, max } = STACK_RULES.exercisesPerDay;
  if (!isCount(value.perDay, min) || value.perDay > max) return null;
  const holds = value.holds ?? null;
  if (!(holds === null || typeof holds === "boolean")) return null;
  return { days: days === null ? null : [...(days as string[])], perDay: value.perDay, holds: holds as boolean | null };
}

export function parseStackChoice(value: unknown): StackChoiceRecord | null {
  if (!isRecord(value) || value.kind !== "choice" || !nonEmpty(value.regionId)) return null;
  if (!isCount(value.total) || value.total > STACK_RULES.maxTotal || !isInstant(value.updatedAt)) return null;
  const settings = parseStackSettings(value.settings);
  if (!settings) return null;
  return { kind: "choice", regionId: value.regionId, total: value.total, settings, updatedAt: value.updatedAt };
}

function parseEntry(value: unknown): StackRecordEntry | null {
  if (!isRecord(value) || !nonEmpty(value.dayKey) || !isCount(value.catalogExerciseId, 1) || !nonEmpty(value.prescription)) return null;
  return { dayKey: value.dayKey, catalogExerciseId: value.catalogExerciseId, prescription: value.prescription };
}

export function parseStackRecord(value: unknown): StackRecord | null {
  if (!isRecord(value) || value.kind !== "stack" || !nonEmpty(value.id) || !nonEmpty(value.regionId) || !nonEmpty(value.mappingVersion)) return null;
  if (!isCount(value.planWeek, 1) || !isCount(value.total) || value.total > STACK_RULES.maxTotal || !isInstant(value.createdAt)) return null;
  const settings = parseStackSettings(value.settings);
  if (!settings || !Array.isArray(value.entries)) return null;
  const entries = value.entries.map(parseEntry);
  if (entries.some((entry) => entry === null)) return null;
  return { kind: "stack", id: value.id, regionId: value.regionId, planWeek: value.planWeek, mappingVersion: value.mappingVersion, total: value.total, createdAt: value.createdAt, settings, entries: entries as StackRecordEntry[] };
}

const readable = (value: unknown) => parseStackChoice(value) ?? parseStackRecord(value);

function readList(accountId: AccountScope): unknown[] {
  try {
    if (typeof window === "undefined") return [];
    const parsed = JSON.parse(readScopedRecord(specializationStacksKeyBase, accountId, window.localStorage) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(accountId: AccountScope, list: readonly unknown[]): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(scopedKey(specializationStacksKeyBase, accountId), JSON.stringify(list));
  } catch {
    return false;
  }
  try {
    window.dispatchEvent(new Event(specializationStacksEvent));
  } catch {
    // Saved; only the other screens' refresh is lost.
  }
  return true;
}

export type StackStoreState = { choices: StackChoiceRecord[]; stacks: StackRecord[] };

/** What this account has on the device: each region's last choice and each stack, newest first. */
export function loadStackStore(accountId?: AccountScope): StackStoreState {
  const list = readList(accountId);
  const choices = list.map(parseStackChoice).filter((entry): entry is StackChoiceRecord => entry !== null).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const stacks = list.map(parseStackRecord).filter((entry): entry is StackRecord => entry !== null).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.id < b.id ? -1 : 1));
  return { choices, stacks };
}

/** Writes the readable entries and keeps, after them, every stored entry this version cannot read. */
function save(accountId: AccountScope, state: StackStoreState): StoreWrite {
  const unread = readList(accountId).filter((entry) => readable(entry) === null);
  return writeList(accountId, [...state.choices, ...state.stacks, ...unread]) ? { ok: true } : REFUSED;
}

/** Saves a region's last total and settings, replacing its earlier choice. */
export function saveStackChoice(choice: Omit<StackChoiceRecord, "kind">, accountId?: AccountScope): StoreWrite {
  const record = parseStackChoice({ ...choice, kind: "choice" });
  if (!record) return { ok: false, reason: "That total or those settings are not ones the designer can keep." };
  const state = loadStackStore(accountId);
  return save(accountId, { ...state, choices: [record, ...state.choices.filter((item) => item.regionId !== record.regionId)] });
}

/** Saves a stack, replacing one with its id or for the same region and plan week. */
export function saveStackRecord(record: Omit<StackRecord, "kind">, accountId?: AccountScope): StoreWrite {
  const parsed = parseStackRecord({ ...record, kind: "stack" });
  if (!parsed) return { ok: false, reason: "That stack is not one the designer can keep." };
  const state = loadStackStore(accountId);
  const others = state.stacks.filter((item) => item.id !== parsed.id && !(item.regionId === parsed.regionId && item.planWeek === parsed.planWeek));
  return save(accountId, { ...state, stacks: [parsed, ...others] });
}

/** Removes a stack's record (Take it out, or its Undo of an Add). Removing one that is not there is not an error. */
export function removeStackRecord(id: string, accountId?: AccountScope): StoreWrite {
  const state = loadStackStore(accountId);
  return save(accountId, { ...state, stacks: state.stacks.filter((item) => item.id !== id) });
}

/** The stack this account added to one plan week of a region, if any. */
export const stackForWeek = (state: StackStoreState, regionId: string, planWeek: number): StackRecord | null => state.stacks.find((item) => item.regionId === regionId && item.planWeek === planWeek) ?? null;

/** A region's last choice, to start a design for another week. */
export const lastChoiceFor = (state: StackStoreState, regionId: string): StackChoiceRecord | null => state.choices.find((item) => item.regionId === regionId) ?? null;

/** A stack's record from the design that was added: its entries are the design's changes, each with the prescription it wrote. */
export function stackRecordFrom(design: StackDesign, id: string, createdAt: string, settings: StackSettings): Omit<StackRecord, "kind"> {
  return {
    id,
    regionId: design.regionId,
    planWeek: design.planWeek,
    mappingVersion: design.mappingVersion,
    total: design.total,
    createdAt,
    settings,
    entries: design.changes.map((change) => ({ dayKey: change.dayKey, catalogExerciseId: change.catalogExerciseId, prescription: change.prescription ?? "" })).filter((entry) => entry.prescription !== ""),
  };
}

/**
 * The stack's entries as the plan week holds them now: still as the stack wrote them (same
 * exercise on the same day with the same prescription), changed by the athlete since (the
 * exercise is on that day with another prescription: the athlete's from then on), or no longer
 * found (the day or the entry is gone). Only `asWritten` entries are ever taken out.
 */
export function stackEntriesState(record: Pick<StackRecord, "entries">, store: WeeklyDayStore): { asWritten: StackRecordEntry[]; changed: StackRecordEntry[]; missing: StackRecordEntry[] } {
  const asWritten: StackRecordEntry[] = [];
  const changed: StackRecordEntry[] = [];
  const missing: StackRecordEntry[] = [];
  for (const entry of record.entries) {
    const day = loadDay(store, entry.dayKey);
    const found = day.workout.find((exercise) => catalogIdOf(exercise) === entry.catalogExerciseId);
    if (!found) missing.push(entry);
    else if ((day.prescriptions[found.id] ?? "") === entry.prescription) asWritten.push(entry);
    else changed.push(entry);
  }
  return { asWritten, changed, missing };
}

/**
 * The plan week without the given entries (a stack's `asWritten` ones), for designing again
 * ("Change the total"): the design then counts the plan's own work only, and lane S3's batch
 * removes the same entries when the new stack is added. The days keep everything else.
 */
export function storeWithoutEntries(store: WeeklyDayStore, entries: readonly StackRecordEntry[]): WeeklyDayStore {
  let next = store;
  for (const dayKey of Array.from(new Set(entries.map((entry) => entry.dayKey)))) {
    const ids = new Set(entries.filter((entry) => entry.dayKey === dayKey).map((entry) => entry.catalogExerciseId));
    const day = loadDay(next, dayKey);
    next = commitDay(next, dayKey, { ...day, workout: day.workout.filter((exercise) => !ids.has(catalogIdOf(exercise))) });
  }
  return next;
}

/** The account's stack records, kept current across screens and tabs, with checked writes. */
export function useSpecializationStacks(accountId?: AccountScope) {
  const [state, setState] = useState<StackStoreState>(() => loadStackStore(accountId));
  useEffect(() => {
    const refresh = () => setState((current) => {
      const next = loadStackStore(accountId);
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === scopedKey(specializationStacksKeyBase, accountId)) refresh();
    };
    refresh();
    window.addEventListener(specializationStacksEvent, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(specializationStacksEvent, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [accountId]);
  const saveChoice = useCallback((choice: Omit<StackChoiceRecord, "kind">) => saveStackChoice(choice, accountId), [accountId]);
  const saveStack = useCallback((record: Omit<StackRecord, "kind">) => saveStackRecord(record, accountId), [accountId]);
  const remove = useCallback((id: string) => removeStackRecord(id, accountId), [accountId]);
  return { ...state, saveChoice, saveStack, remove };
}
