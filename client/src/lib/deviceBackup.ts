import { buildStamp } from "./buildStamp";
import { deviceStorageOwner, ownedKey, readOwnedList, writeOwnedList } from "./deviceRecordStore";
import { readScopedRecord } from "./deviceStorageScope";
import { deviceWorkoutHistoryEvent, deviceWorkoutHistoryKey } from "./deviceWorkoutLog";
import { bodyWeightLogEvent, bodyWeightLogKey } from "./bodyWeightLog";
import { deviceStrengthObservationEvent, deviceStrengthObservationKey } from "./deviceStrengthObservations";
import { specializationGoalsEvent, specializationGoalsKeyBase, specializationMeasurementsEvent, specializationMeasurementsKeyBase } from "./specialization/stores";
import { specializationStacksEvent, specializationStacksKeyBase } from "./specialization/stackStore";
import { specializationExclusionsEvent, specializationExclusionsKeyBase } from "./specialization/exclusions";

/**
 * A restorable copy of what this device holds for its athlete (iOS readiness audit, A03).
 *
 * Safari's storage and an installed app's storage are separate, so installing the iOS app does
 * not bring anyone's web history across, and full account sync is not finished. This is the
 * bridge until it is: export on the web, import in the app (or on another browser), with a
 * preview of exactly what would change before anything is written.
 *
 * What it carries: workouts with every set, stage, side, hold, unit, swap and note as stored;
 * typed lifts; the body-weight history; the profile, the plan and favourites; specialization
 * goals, measurements, stacks and exclusions. Records are copied as stored, so a field this
 * release does not know survives the round trip.
 *
 * What it never carries: sign-in tokens, the cloud session, shared links' manage secrets, the
 * cloud outbox (rebuilt from the workouts) and anything belonging to another account.
 *
 * Import never overwrites silently. A record already on the device is kept; one that is new is
 * added; one with the same id but different content is a conflict, and the imported copy is kept
 * aside for review instead of replacing the device's. The profile and plan are taken from the
 * backup only where the device has none, or where the athlete explicitly asks to replace them.
 * Every import can be undone.
 */

export const backupFormat = "sports-genome-device-backup";
export const backupVersion = 1;
/** Bigger than any real history by orders of magnitude; a file this size is not a backup. */
export const backupMaxBytes = 25 * 1024 * 1024;

export const athleteProfileKeyBase = "gym-optimizer-athlete-profile-v1";
export const workoutPlanKeyBase = "gym-optimizer-workout-plan-v1";
export const favoriteExerciseKeyBase = "gym-optimizer-favorite-exercise-ids-v1";
/** Imported records that clashed with the device's, kept for the athlete to review. */
export const importConflictsKeyBase = "sports-genome-import-conflicts-v1";

type ListName = "workouts" | "strengthObservations" | "bodyWeights" | "specializationGoals" | "specializationMeasurements" | "specializationStacks";
type DocumentName = "profile" | "plan" | "specializationExclusions";

type ListSpec = { name: ListName; label: string; one: string; base: string; event: string; identity: (entry: Record<string, unknown>) => string | null; valid: (entry: Record<string, unknown>) => boolean };
type DocumentSpec = { name: DocumentName; label: string; base: string; event?: string; valid: (value: unknown) => boolean };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const idOf = (entry: Record<string, unknown>) => (text(entry.id) ? entry.id : null);

const lists: readonly ListSpec[] = [
  {
    name: "workouts", label: "workouts", one: "workout", base: deviceWorkoutHistoryKey, event: deviceWorkoutHistoryEvent, identity: idOf,
    valid: (entry) => text(entry.id) && text(entry.startedAt) && (entry.status === "active" || entry.status === "completed") && Array.isArray(entry.exercises),
  },
  { name: "strengthObservations", label: "typed lifts", one: "typed lift", base: deviceStrengthObservationKey, event: deviceStrengthObservationEvent, identity: idOf, valid: (entry) => text(entry.id) },
  {
    // A weigh-in is one per moment; two entries at the same instant are the same weigh-in.
    name: "bodyWeights", label: "body-weight entries", one: "body-weight entry", base: bodyWeightLogKey, event: bodyWeightLogEvent,
    identity: (entry) => (text(entry.observedAt) ? entry.observedAt : null),
    valid: (entry) => text(entry.observedAt) && Number.isFinite(Number(entry.bodyMassKg)) && Number(entry.bodyMassKg) > 0,
  },
  { name: "specializationGoals", label: "specialization targets", one: "specialization target", base: specializationGoalsKeyBase, event: specializationGoalsEvent, identity: idOf, valid: (entry) => text(entry.id) },
  { name: "specializationMeasurements", label: "measurements", one: "measurement", base: specializationMeasurementsKeyBase, event: specializationMeasurementsEvent, identity: idOf, valid: (entry) => text(entry.id) },
  { name: "specializationStacks", label: "specialization stacks", one: "specialization stack", base: specializationStacksKeyBase, event: specializationStacksEvent, identity: idOf, valid: (entry) => text(entry.id) },
];

const documents: readonly DocumentSpec[] = [
  { name: "profile", label: "athlete profile", base: athleteProfileKeyBase, valid: isRecord },
  { name: "plan", label: "training plan", base: workoutPlanKeyBase, valid: isRecord },
  { name: "specializationExclusions", label: "exercise exclusions", base: specializationExclusionsKeyBase, event: specializationExclusionsEvent, valid: isRecord },
];

export type DeviceBackup = {
  format: typeof backupFormat;
  version: number;
  exportedAt: string;
  build: { commit: string; builtAt: string };
  records: Partial<Record<ListName, unknown[]>> & Partial<Record<DocumentName, unknown>> & { favorites?: unknown[] };
};

type Storage_ = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const storageOf = (storage?: Storage_): Storage_ | null => storage ?? (typeof window === "undefined" ? null : window.localStorage);

function readDocument(base: string, owner: string | null, store: Storage_): unknown {
  const raw = readScopedRecord(base, owner, store);
  if (!raw) return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

/** Everything this device holds for its current owner, as a backup. */
export function buildDeviceBackup(owner: string | null = deviceStorageOwner(), storage?: Storage_, now = new Date()): DeviceBackup {
  const store = storageOf(storage);
  const records: DeviceBackup["records"] = {};
  if (store) {
    for (const spec of lists) records[spec.name] = readOwnedList(spec.base, owner, store).filter(isRecord);
    for (const spec of documents) {
      const value = readDocument(spec.base, owner, store);
      if (spec.valid(value)) records[spec.name] = value;
    }
    const favorites = readDocument(favoriteExerciseKeyBase, owner, store);
    records.favorites = Array.isArray(favorites) ? favorites.filter((id) => Number.isInteger(id)) : [];
  }
  return { format: backupFormat, version: backupVersion, exportedAt: now.toISOString(), build: buildStamp(), records };
}

/** "sports-genome-backup-2026-11-02.json". */
export function backupFileName(now = new Date()): string {
  return `sports-genome-backup-${now.toISOString().slice(0, 10)}.json`;
}

export function serializeBackup(backup: DeviceBackup): string {
  return JSON.stringify(backup, null, 1);
}

export type ListPreview = { name: ListName; label: string; add: number; same: number; conflicts: number; invalid: number };
export type DocumentPreview = { name: DocumentName | "favorites"; label: string; inBackup: boolean; onDevice: boolean; action: "add" | "keep-device" | "replace" | "same" | "none" };
export type BackupPreview = {
  exportedAt: string;
  build: string;
  lists: ListPreview[];
  documents: DocumentPreview[];
  /** Whether applying it would change anything at all. */
  changes: boolean;
};

export type BackupReadResult =
  | { ok: true; backup: DeviceBackup }
  | { ok: false; reason: "too-large" | "not-json" | "not-a-backup" | "newer-version" | "malformed" };

const forbiddenKeys = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Parses and checks a file before anything else looks at it. Keys that could reach an object's
 * prototype are dropped while parsing, so nothing in a crafted file can change how the app's own
 * objects behave.
 */
export function readBackup(textContent: string): BackupReadResult {
  if (textContent.length > backupMaxBytes) return { ok: false, reason: "too-large" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(textContent, (key, value) => (forbiddenKeys.has(key) ? undefined : value));
  } catch {
    return { ok: false, reason: "not-json" };
  }
  if (!isRecord(parsed) || parsed.format !== backupFormat) return { ok: false, reason: "not-a-backup" };
  if (typeof parsed.version !== "number" || !Number.isInteger(parsed.version) || parsed.version < 1) return { ok: false, reason: "malformed" };
  if (parsed.version > backupVersion) return { ok: false, reason: "newer-version" };
  if (!isRecord(parsed.records) || !text(parsed.exportedAt)) return { ok: false, reason: "malformed" };
  const records = parsed.records;
  for (const spec of lists) if (records[spec.name] !== undefined && !Array.isArray(records[spec.name])) return { ok: false, reason: "malformed" };
  if (records.favorites !== undefined && !Array.isArray(records.favorites)) return { ok: false, reason: "malformed" };
  const build = isRecord(parsed.build) ? { commit: String(parsed.build.commit ?? "unknown"), builtAt: String(parsed.build.builtAt ?? "") } : { commit: "unknown", builtAt: "" };
  return { ok: true, backup: { format: backupFormat, version: parsed.version, exportedAt: parsed.exportedAt, build, records: records as DeviceBackup["records"] } };
}

const stable = (value: unknown): string => JSON.stringify(value, (_key, item) => (isRecord(item) ? Object.fromEntries(Object.keys(item).sort().map((name) => [name, item[name]])) : item));

type Plan = {
  lists: { spec: ListSpec; device: Record<string, unknown>[]; add: Record<string, unknown>[]; conflicts: Record<string, unknown>[]; same: number; invalid: number }[];
  documents: { spec: DocumentSpec | { name: "favorites"; label: string; base: string; event?: string }; device: unknown; incoming: unknown; action: DocumentPreview["action"] }[];
};

function planImport(backup: DeviceBackup, owner: string | null, store: Storage_, replaceDocuments: boolean): Plan {
  const plan: Plan = { lists: [], documents: [] };
  for (const spec of lists) {
    const device = readOwnedList(spec.base, owner, store).filter(isRecord);
    const byIdentity = new Map(device.map((entry) => [spec.identity(entry), entry] as const).filter(([key]) => key !== null));
    const incoming = backup.records[spec.name] ?? [];
    const add: Record<string, unknown>[] = [];
    const conflicts: Record<string, unknown>[] = [];
    let same = 0;
    let invalid = 0;
    const seen = new Set<string>();
    for (const entry of incoming) {
      if (!isRecord(entry) || !spec.valid(entry)) { invalid += 1; continue; }
      const identity = spec.identity(entry);
      if (identity === null || seen.has(identity)) { invalid += 1; continue; }
      seen.add(identity);
      const existing = byIdentity.get(identity);
      if (!existing) add.push(entry);
      else if (stable(existing) === stable(entry)) same += 1;
      else conflicts.push(entry);
    }
    // One running workout at a time: an imported one waits as a conflict if the device has its own.
    if (spec.name === "workouts" && device.some((entry) => entry.status === "active")) {
      for (const entry of add.filter((item) => item.status === "active")) conflicts.push(entry);
      for (let index = add.length - 1; index >= 0; index -= 1) if (add[index].status === "active") add.splice(index, 1);
    }
    plan.lists.push({ spec, device, add, conflicts, same, invalid });
  }
  for (const spec of documents) {
    const device = readDocument(spec.base, owner, store);
    const incoming = backup.records[spec.name];
    const has = spec.valid(incoming);
    const onDevice = spec.valid(device);
    const action: DocumentPreview["action"] = !has ? "none" : !onDevice ? "add" : stable(device) === stable(incoming) ? "same" : replaceDocuments ? "replace" : "keep-device";
    plan.documents.push({ spec, device, incoming, action });
  }
  const deviceFavorites = readDocument(favoriteExerciseKeyBase, owner, store);
  const ownFavorites = Array.isArray(deviceFavorites) ? deviceFavorites.filter((id) => Number.isInteger(id)) as number[] : [];
  const incomingFavorites = (backup.records.favorites ?? []).filter((id) => Number.isInteger(id)) as number[];
  const union = Array.from(new Set([...ownFavorites, ...incomingFavorites]));
  plan.documents.push({
    spec: { name: "favorites", label: "favourite exercises", base: favoriteExerciseKeyBase },
    device: ownFavorites,
    incoming: union,
    action: !incomingFavorites.length ? "none" : union.length === ownFavorites.length ? "same" : "add",
  });
  return plan;
}

/** What importing this backup would do, without doing it. */
export function previewBackupImport(backup: DeviceBackup, options: { replaceDocuments?: boolean } = {}, owner: string | null = deviceStorageOwner(), storage?: Storage_): BackupPreview {
  const store = storageOf(storage);
  const empty: BackupPreview = { exportedAt: backup.exportedAt, build: backup.build.commit, lists: [], documents: [], changes: false };
  if (!store) return empty;
  const plan = planImport(backup, owner, store, Boolean(options.replaceDocuments));
  const listsPreview = plan.lists.map(({ spec, add, conflicts, same, invalid }) => ({ name: spec.name, label: spec.label, add: add.length, same, conflicts: conflicts.length, invalid }));
  const documentsPreview = plan.documents.map(({ spec, device, incoming, action }) => ({
    name: spec.name, label: spec.label, action,
    inBackup: spec.name === "favorites" ? action !== "none" : incoming !== null && incoming !== undefined,
    onDevice: spec.name === "favorites" ? (device as number[]).length > 0 : device !== null,
  }));
  const changes = listsPreview.some((item) => item.add > 0 || item.conflicts > 0) || documentsPreview.some((item) => item.action === "add" || item.action === "replace");
  return { ...empty, lists: listsPreview, documents: documentsPreview, changes };
}

/** The raw text of every key an import touched, before it did: what Undo writes back. */
export type ImportSnapshot = { owner: string | null; keys: Record<string, string | null> };

export type ImportResult =
  | { ok: true; added: number; conflictsKept: number; documentsWritten: string[]; snapshot: ImportSnapshot; needsReload: boolean }
  | { ok: false; reason: "storage-refused" | "nothing-to-import" };

/**
 * Applies a previewed import. All or nothing: if the device refuses any write, everything written
 * so far is put back as it was and nothing is reported as imported.
 */
export function applyBackupImport(backup: DeviceBackup, options: { replaceDocuments?: boolean } = {}, owner: string | null = deviceStorageOwner(), storage?: Storage_, now = new Date()): ImportResult {
  const store = storageOf(storage);
  if (!store) return { ok: false, reason: "storage-refused" };
  const plan = planImport(backup, owner, store, Boolean(options.replaceDocuments));
  const conflictRecords: Record<string, unknown>[] = [];
  const writes: { key: string; value: string; event?: string; list?: { base: string; value: unknown[] } }[] = [];
  let added = 0;
  for (const { spec, device, add, conflicts } of plan.lists) {
    for (const entry of conflicts) conflictRecords.push({ store: spec.name, importedAt: now.toISOString(), backupExportedAt: backup.exportedAt, record: entry });
    if (!add.length) continue;
    added += add.length;
    const merged = [...device, ...add];
    writes.push({ key: ownedKey(spec.base, owner), value: JSON.stringify(merged), event: spec.event, list: { base: spec.base, value: merged } });
  }
  const documentsWritten: string[] = [];
  for (const { spec, device, incoming, action } of plan.documents) {
    if (action !== "add" && action !== "replace") continue;
    if (action === "replace" && spec.name !== "favorites") conflictRecords.push({ store: spec.name, importedAt: now.toISOString(), replacedOnDevice: true, record: device });
    writes.push({ key: ownedKey(spec.base, owner), value: JSON.stringify(incoming), event: spec.event });
    documentsWritten.push(spec.name);
  }
  if (conflictRecords.length) {
    const kept = readOwnedList(importConflictsKeyBase, owner, store);
    const value = [...kept, ...conflictRecords];
    writes.push({ key: ownedKey(importConflictsKeyBase, owner), value: JSON.stringify(value), list: { base: importConflictsKeyBase, value } });
  }
  if (!writes.length) return { ok: false, reason: "nothing-to-import" };

  const snapshot: ImportSnapshot = { owner, keys: {} };
  for (const write of writes) snapshot.keys[write.key] = store.getItem(write.key);
  for (const write of writes) {
    const ok = write.list ? writeOwnedList(write.list.base, write.list.value, owner, store) : (() => { try { store.setItem(write.key, write.value); return true; } catch { return false; } })();
    if (!ok) {
      restoreImportSnapshot(snapshot, store);
      return { ok: false, reason: "storage-refused" };
    }
  }
  announce(writes.map((write) => write.event));
  const needsReload = documentsWritten.length > 0;
  return { ok: true, added, conflictsKept: conflictRecords.length, documentsWritten, snapshot, needsReload };
}

/** Undo: writes back exactly what each touched key held before the import. */
export function restoreImportSnapshot(snapshot: ImportSnapshot, storage?: Storage_): boolean {
  const store = storageOf(storage);
  if (!store) return false;
  let ok = true;
  for (const [key, value] of Object.entries(snapshot.keys)) {
    try {
      if (value === null) store.removeItem(key);
      else store.setItem(key, value);
    } catch {
      ok = false;
    }
  }
  announce([...lists.map((spec) => spec.event), ...documents.map((spec) => spec.event)]);
  return ok;
}

/** Records kept aside by earlier imports because they clashed with the device's. */
export function importConflicts(owner: string | null = deviceStorageOwner(), storage?: Storage_): Record<string, unknown>[] {
  const store = storageOf(storage);
  return store ? readOwnedList(importConflictsKeyBase, owner, store).filter(isRecord) : [];
}

function announce(events: (string | undefined)[]) {
  if (typeof window === "undefined") return;
  for (const event of Array.from(new Set(events))) if (event) window.dispatchEvent(new Event(event));
}

/** Counts for a summary line: "42 workouts, 3 typed lifts, 18 body-weight entries". */
export function backupCounts(backup: DeviceBackup): { label: string; count: number }[] {
  return lists.map((spec) => {
    const count = (backup.records[spec.name] ?? []).length;
    return { label: `${count} ${count === 1 ? spec.one : spec.label}`, count };
  }).filter((item) => item.count > 0);
}
