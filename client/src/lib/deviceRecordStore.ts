import { scopedKey } from "./deviceStorageScope";

/**
 * Who the device's own records belong to, and how they are read and written safely
 * (iOS readiness audit, A03).
 *
 * The plan, profile, favourites, goals, measurements and stacks were namespaced by account
 * (deviceStorageScope.ts). Workout history, strength observations, the body-weight log and the
 * cloud outbox were not: they sat under fixed keys, so a second account on one device would read
 * and add to the first one's history and, worse, upload it. Those stores now read their key here.
 *
 * The owner is the signed-in account's stable id. With no one signed in (this build opens
 * straight onto the device store, accountAccess.ts) it is null and every key is the key it always
 * was: nothing moves for anyone using the app today.
 *
 * Reads also stop treating unreadable data as "no data". A history that failed to parse used to
 * load as an empty list, and the next checkpoint wrote that empty list over every workout. Now the
 * raw text is copied aside first ("quarantined") and kept until the athlete deals with it; if it
 * cannot be copied aside, writes over it are refused, so the screen says "not saved" instead.
 */

let owner: string | null = null;

/** Called by the workspace when the signed-in account is known. Returns whether it changed. */
export function setDeviceStorageOwner(id: string | number | null | undefined): boolean {
  const next = id === null || id === undefined || id === "" ? null : String(id);
  if (next === owner) return false;
  owner = next;
  return true;
}

/** The account the device's records are being read and written for; null when no one is signed in. */
export function deviceStorageOwner(): string | null {
  return owner;
}

/** The storage key of `base` for an owner (the current one unless given). */
export function ownedKey(base: string, who: string | null = owner): string {
  return scopedKey(base, who);
}

/** Whether a storage event's key is this owner's copy of `base` (null: storage was cleared). */
export function isOwnedKey(base: string, key: string | null, who: string | null = owner): boolean {
  return key === null || key === ownedKey(base, who);
}

type Storage_ = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const storageOf = (storage?: Storage_): Storage_ | undefined => storage ?? (typeof window === "undefined" ? undefined : window.localStorage);

/** Where a claimed legacy record notes who claimed it, so no second account can claim it again. */
export const legacyClaimSuffix = "::claimed-by";

/**
 * Moves a record written before it had an owner into the first owner that reads it.
 *
 * The plan's version of this (migrateLegacyRecord) copies and then removes. That is right for a
 * browser, where the two calls cannot be separated, and it is what the plan keeps. A workout history
 * needs the stronger version, because a native storage layer or a crash can stop it between steps:
 *
 * 1. note the claimant beside the legacy record,
 * 2. copy, and read the copy back to check it,
 * 3. only then remove the original.
 *
 * Interrupted anywhere, a retry by the same owner finishes the job; a different owner finds the
 * claim note and leaves the record alone. Nothing is guessed: unclaimed signed-out records stay
 * where they are, readable while signed out and available to the backup import.
 */
export function claimLegacyRecord(
  base: string,
  who: string | null,
  storage?: Storage_,
): "claimed" | "kept" | "claimed-by-other" | "nothing-to-move" | "failed" {
  const store = storageOf(storage);
  if (!store || who === null) return "nothing-to-move";
  const target = scopedKey(base, who);
  const marker = `${base}${legacyClaimSuffix}`;
  try {
    const legacy = store.getItem(base);
    const claimant = store.getItem(marker);
    if (legacy === null) return "nothing-to-move";
    if (claimant !== null && claimant !== who) return "claimed-by-other";
    const existing = store.getItem(target);
    // This owner already has a different record of its own: the legacy one is not merged into it.
    // (A claim interrupted after its copy leaves the two identical, and is finished below.)
    if (existing !== null && existing !== legacy) return "kept";
    if (claimant === null) store.setItem(marker, who);
    if (existing === null) store.setItem(target, legacy);
    if (store.getItem(target) !== legacy) return "failed";
    store.removeItem(base);
    return "claimed";
  } catch {
    return "failed";
  }
}

/** Suffix of the copy kept of a record that could not be read. */
export const unreadableSuffix = "::unreadable";

export type UnreadableRecord = { key: string; base: string; savedAt: string; raw: string; bytes: number };

const blocked = new Set<string>();

/** Copies unreadable text aside under a dated key, once. Returns whether it is safely kept. */
function quarantine(key: string, raw: string, store: Storage_): boolean {
  try {
    for (let index = 0; index < store.length; index += 1) {
      const name = store.key(index);
      if (!name || !name.startsWith(`${key}${unreadableSuffix}`)) continue;
      const kept = parseQuarantined(store.getItem(name));
      if (kept && kept.raw === raw) return true;
    }
    const savedAt = new Date().toISOString();
    const name = `${key}${unreadableSuffix}::${savedAt}`;
    store.setItem(name, JSON.stringify({ savedAt, raw }));
    return parseQuarantined(store.getItem(name))?.raw === raw;
  } catch {
    return false;
  }
}

function parseQuarantined(text: string | null): { savedAt: string; raw: string } | null {
  if (!text) return null;
  try {
    const value = JSON.parse(text) as unknown;
    if (value && typeof value === "object" && typeof (value as { raw?: unknown }).raw === "string" && typeof (value as { savedAt?: unknown }).savedAt === "string") return value as { savedAt: string; raw: string };
  } catch { /* not ours */ }
  return null;
}

/**
 * Reads an owner's list. Absent is an empty list. Text that is not a JSON array is quarantined
 * and reads as empty, but the key is marked so a write cannot replace it until the copy is safe.
 */
export function readOwnedList(base: string, who: string | null = owner, storage?: Storage_): unknown[] {
  const store = storageOf(storage);
  if (!store) return [];
  claimLegacyRecord(base, who, store);
  const key = scopedKey(base, who);
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return [];
  }
  if (raw === null || raw === "") {
    blocked.delete(key);
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      blocked.delete(key);
      return parsed;
    }
    // `null` is what an empty store once wrote; it is nothing, not damage.
    if (parsed === null) return [];
  } catch { /* falls through to quarantine */ }
  if (quarantine(key, raw, store)) blocked.delete(key);
  else blocked.add(key);
  return [];
}

/**
 * Writes an owner's list, unless the record there is unreadable and could not be copied aside.
 * Returns whether the write reached the device; callers already turn false into "not saved".
 */
export function writeOwnedList(base: string, value: readonly unknown[], who: string | null = owner, storage?: Storage_): boolean {
  const store = storageOf(storage);
  if (!store) return false;
  const key = scopedKey(base, who);
  if (blocked.has(key)) {
    // Try again: the athlete may have freed space since.
    readOwnedList(base, who, store);
    if (blocked.has(key)) return false;
  }
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Every quarantined record on this device for an owner, newest first. */
export function unreadableRecords(who: string | null = owner, storage?: Storage_): UnreadableRecord[] {
  const store = storageOf(storage);
  if (!store) return [];
  const found: UnreadableRecord[] = [];
  try {
    for (let index = 0; index < store.length; index += 1) {
      const name = store.key(index);
      if (!name || !name.includes(unreadableSuffix)) continue;
      const key = name.slice(0, name.indexOf(unreadableSuffix));
      const scope = key.includes("::") ? key.slice(key.indexOf("::") + 2) : null;
      if (scope !== who) continue;
      const kept = parseQuarantined(store.getItem(name));
      if (!kept) continue;
      found.push({ key: name, base: key.includes("::") ? key.slice(0, key.indexOf("::")) : key, savedAt: kept.savedAt, raw: kept.raw, bytes: kept.raw.length });
    }
  } catch { /* storage unavailable: nothing to list */ }
  return found.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Removes one quarantined copy, after the athlete has saved or chosen to discard it. */
export function discardUnreadableRecord(key: string, storage?: Storage_): boolean {
  const store = storageOf(storage);
  if (!store || !key.includes(unreadableSuffix)) return false;
  try {
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** For tests: forget which keys were blocked. */
export function resetDeviceRecordStoreForTests() {
  blocked.clear();
  owner = null;
}
