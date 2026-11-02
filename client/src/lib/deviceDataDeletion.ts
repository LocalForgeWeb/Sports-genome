import { deviceStorageOwner, legacyClaimSuffix, ownedKey, unreadableSuffix } from "./deviceRecordStore";
import { athleteProfileKeyBase, favoriteExerciseKeyBase, importConflictsKeyBase, workoutPlanKeyBase } from "./deviceBackup";
import { deviceWorkoutHistoryEvent, deviceWorkoutHistoryKey } from "./deviceWorkoutLog";
import { bodyWeightLogKey } from "./bodyWeightLog";
import { deviceStrengthObservationKey } from "./deviceStrengthObservations";
import { strengthSyncedKey, strengthSyncQueueKey } from "./strengthSyncQueue";
import { specializationGoalsKeyBase, specializationMeasurementsKeyBase } from "./specialization/stores";
import { specializationStacksKeyBase } from "./specialization/stackStore";
import { specializationExclusionsKeyBase } from "./specialization/exclusions";
import { specializationRegionKeyBase } from "./specialization/viewState";
import { recentExercisesKey } from "./recentExercises";

/**
 * Deleting an athlete's data (iOS readiness audit, A04).
 *
 * This build keeps the athlete's record on the device, with no sign-in; the cloud copy is an
 * anonymous identity per device when sync is configured (production had no such identities on
 * 2 Nov 2026). So "delete my data" here means, in this order:
 *
 * 1. turn off every workout link this device shared, so nothing published stays reachable;
 * 2. delete the rows the cloud identity owns, where one exists, and sign it out;
 * 3. remove this owner's records from the device, and nothing else on it.
 *
 * Each step reports what it did. A step that fails is reported as failed, never as done, and the
 * whole thing is safe to run again: links already off, rows already gone and keys already removed
 * are simply nothing to do. Links that could not be turned off are kept, with their manage
 * secrets, so the retry can still turn them off. App preferences that are not about the athlete
 * (theme, intro video) stay, like the settings of any app.
 */

/** Every device record that belongs to the athlete, as base keys (scoped per owner when signed in). */
export const personalRecordBases: readonly string[] = [
  deviceWorkoutHistoryKey,
  deviceStrengthObservationKey,
  bodyWeightLogKey,
  strengthSyncQueueKey,
  strengthSyncedKey,
  athleteProfileKeyBase,
  workoutPlanKeyBase,
  favoriteExerciseKeyBase,
  specializationGoalsKeyBase,
  specializationMeasurementsKeyBase,
  specializationStacksKeyBase,
  specializationExclusionsKeyBase,
  specializationRegionKeyBase,
  importConflictsKeyBase,
  "sg-saved-shares-v1",
];

/** Device-wide keys that hold the athlete's data or session, whoever is signed in. */
export const personalDeviceKeys: readonly string[] = [
  recentExercisesKey,
  "sports-genome-benchmark-opt-in-v1",
  "sports-genome-user-info",
  "sports-genome-supabase-reference-map-v1",
];

export const sharedLinksKeyBase = "sg-shared-by-me-v1";

/** The cloud tables an athlete can delete their own rows from (row-level security: delete own). */
export const cloudTablesDeletableByAthlete = ["athlete_strength_entries", "athlete_focus_areas", "athlete_training_constraints", "athlete_profiles"] as const;
/**
 * Insert-only by design (a correction is a new row), so the athlete cannot delete them from the app.
 * Removing them needs the server-side deletion endpoint named in docs/ios-readiness/status.md (A04).
 */
export const cloudTablesNeedingServerDeletion = ["athlete_focus_checkins", "athlete_strength_states"] as const;

export type OwnedLink = { token: string; manageSecret: string; disabledAt?: string };

export type DeletionStep = { step: "links" | "cloud" | "device"; status: "done" | "nothing" | "failed" | "partial"; detail: string };
export type DeletionReport = { complete: boolean; steps: DeletionStep[] };

type Storage_ = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export type DeletionDeps = {
  storage: Storage_;
  owner: string | null;
  /** Turns a shared link off. Resolves true when the server confirms it is off (or already gone). */
  disableLink: (link: OwnedLink) => Promise<boolean>;
  /** The cloud identity on this device, if any, and how to delete its rows and sign it out. */
  cloud: null | {
    userId: string;
    deleteRows: (table: string, userId: string) => Promise<boolean>;
    signOut: () => Promise<boolean>;
  };
};

function readLinks(store: Storage_, key: string): OwnedLink[] {
  try {
    const parsed = JSON.parse(store.getItem(key) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is OwnedLink => Boolean(item) && typeof item.token === "string" && typeof item.manageSecret === "string") : [];
  } catch {
    return [];
  }
}

/** Every storage key this owner's records occupy right now, including quarantined copies. */
export function personalKeysOnDevice(store: Storage_, owner: string | null): string[] {
  const keys = new Set<string>();
  for (const base of personalRecordBases) {
    const key = ownedKey(base, owner);
    if (store.getItem(key) !== null) keys.add(key);
  }
  for (const key of personalDeviceKeys) if (store.getItem(key) !== null) keys.add(key);
  for (let index = 0; index < store.length; index += 1) {
    const name = store.key(index);
    if (!name) continue;
    const stem = name.includes(unreadableSuffix) ? name.slice(0, name.indexOf(unreadableSuffix)) : null;
    if (stem && personalRecordBases.some((base) => ownedKey(base, owner) === stem)) keys.add(name);
    // The note of who claimed a pre-account record goes with that account's data.
    if (owner !== null && name.endsWith(legacyClaimSuffix) && store.getItem(name) === owner) keys.add(name);
  }
  return Array.from(keys);
}

export async function deleteAthleteData(deps: DeletionDeps): Promise<DeletionReport> {
  const { storage: store, owner } = deps;
  const steps: DeletionStep[] = [];

  // 1. Links first: once their secrets are gone they can never be turned off.
  const linksKey = ownedKey(sharedLinksKeyBase, owner);
  const links = readLinks(store, linksKey);
  const stillOn: OwnedLink[] = [];
  for (const link of links) {
    let off = false;
    try { off = await deps.disableLink(link); } catch { off = false; }
    if (!off) stillOn.push(link);
  }
  try {
    if (stillOn.length) store.setItem(linksKey, JSON.stringify(stillOn));
    else store.removeItem(linksKey);
  } catch { /* reported below through stillOn */ }
  steps.push(!links.length
    ? { step: "links", status: "nothing", detail: "No shared workout links." }
    : stillOn.length
      ? { step: "links", status: stillOn.length === links.length ? "failed" : "partial", detail: `${stillOn.length} of ${links.length} shared link${links.length === 1 ? "" : "s"} could not be turned off. They are kept so trying again can turn them off.` }
      : { step: "links", status: "done", detail: `${links.length} shared link${links.length === 1 ? "" : "s"} turned off.` });

  // 2. The cloud identity's rows, then the identity's session.
  if (!deps.cloud) {
    steps.push({ step: "cloud", status: "nothing", detail: "No cloud copy exists for this device." });
  } else {
    const failedTables: string[] = [];
    for (const table of cloudTablesDeletableByAthlete) {
      let ok = false;
      try { ok = await deps.cloud.deleteRows(table, deps.cloud.userId); } catch { ok = false; }
      if (!ok) failedTables.push(table);
    }
    let signedOut = false;
    if (!failedTables.length) {
      try { signedOut = await deps.cloud.signOut(); } catch { signedOut = false; }
    }
    steps.push(failedTables.length
      ? { step: "cloud", status: "failed", detail: "The cloud copy could not be deleted (no connection, or the service refused). Nothing on this device was removed; try again when online." }
      : { step: "cloud", status: signedOut ? "done" : "partial", detail: signedOut ? "Cloud workouts and profile deleted, and this device signed out." : "Cloud workouts and profile deleted; signing this device out did not finish." });
    // The device copy is the athlete's only other copy: keep it until the cloud step succeeded,
    // so a failure can be retried rather than leaving cloud rows nobody can reach.
    if (failedTables.length) return { complete: false, steps };
  }

  // 3. This owner's records on the device.
  const keys = personalKeysOnDevice(store, owner).filter((key) => key !== linksKey);
  const left: string[] = [];
  for (const key of keys) {
    try { store.removeItem(key); } catch { /* checked just below */ }
    if (store.getItem(key) !== null) left.push(key);
  }
  steps.push(left.length
    ? { step: "device", status: "partial", detail: `${keys.length - left.length} of ${keys.length} records removed from this device.` }
    : { step: "device", status: keys.length ? "done" : "nothing", detail: keys.length ? "Everything this device held for you was removed." : "Nothing was stored on this device." });
  if (typeof window !== "undefined") window.dispatchEvent(new Event(deviceWorkoutHistoryEvent));
  return { complete: steps.every((step) => step.status === "done" || step.status === "nothing"), steps };
}

/** The current device owner, for callers that do not hold it. */
export const currentDeletionOwner = () => deviceStorageOwner();
