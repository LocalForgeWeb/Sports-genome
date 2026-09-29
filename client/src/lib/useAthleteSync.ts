import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAthleteIdentity, upsertAthleteProfile, type IdentityState } from "@/lib/athleteIdentity";
import { loadCachedReferenceMap, refreshReferenceMap, type ReferenceMap } from "@/lib/supabaseReferenceMap";
import { enqueueLifts, flushSyncQueue, loadSyncQueue, loadSyncedKeys, saveSyncQueue, type QueuedLift } from "@/lib/strengthSyncQueue";
import { workoutStrengthObservations } from "@/lib/workoutStrengthRecord";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { bodyWeightLogEvent, currentBodyWeightKg, loadBodyWeightLog } from "@/lib/bodyWeightLog";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import { capacitySignature, loadCapacityContext, saveCapacityContext, type CapacityContextSnapshot } from "@/lib/capacityContext";
import { fetchTargetCatalogAsAthlete } from "@/lib/resilienceCatalogClient";
import type { CapacityFocusState } from "@/components/CapacityFocusCard";
import type { ResilienceTargetCatalog } from "@shared/resilienceContext";
import type { AthleteSnapshot } from "@/lib/athleteStrengthEntry";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";
import type { DisplayWeightUnit } from "@/lib/weightUnits";

/**
 * Runs the whole account chain without the athlete doing anything: get an id,
 * learn the reference mapping, keep the profile current, and push every
 * finished lift.
 *
 * It is a background concern by design. Nothing it does can block logging a
 * set, none of its failures reach the athlete as an error, and the app works
 * identically with the network unplugged — the queue simply drains later.
 */
const catalogIdByName = new Map(exerciseCatalog.map((exercise) => [exercise.name.trim().toLowerCase(), exercise.id]));

/**
 * Calls `retry` when the device comes back online, and when the tab is shown again: a phone
 * reopening the app fires no online event. Returns the unsubscribe.
 */
function onReconnect(retry: () => void): () => void {
  const onVisible = () => { if (document.visibilityState === "visible") retry(); };
  window.addEventListener("online", retry);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("online", retry);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export type AthleteSyncStatus = {
  identity: IdentityState;
  pending: number;
  lastSyncedAt?: string;
  /**
   * The catalog actually in force: the server's when it is connected, otherwise
   * the athlete's own read of the same view. Callers should prefer this over the
   * server query they passed in, which is only one of the two ways in.
   */
  targetCatalog?: ResilienceTargetCatalog;
};

export function useAthleteSync(options: {
  sexForReference?: SexForReference;
  birthYear?: number;
  sportId?: string;
  sportContextMode?: "sport" | "general" | "undecided";
  weightUnit: DisplayWeightUnit;
  appSports: readonly { id: string; label: string }[];
  /** What the athlete wants built up, and whether anything is going on there. */
  capacityFocus?: CapacityFocusState;
  targetCatalog?: ResilienceTargetCatalog;
  /** Called with rows found on the account when this device has none of its own. */
  onCapacityRestored?: (snapshot: CapacityContextSnapshot) => void;
  enabled?: boolean;
}): AthleteSyncStatus & { syncNow: () => void } {
  const { sexForReference, birthYear, sportId, sportContextMode, weightUnit, appSports, capacityFocus, targetCatalog, onCapacityRestored, enabled = true } = options;
  const [identity, setIdentity] = useState<IdentityState>({ userId: null, anonymous: true });
  const [referenceMap, setReferenceMap] = useState<ReferenceMap | null>(() => loadCachedReferenceMap());
  const [pending, setPending] = useState(() => loadSyncQueue().length);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();
  const running = useRef(false);
  // A sync asked for while one is in flight runs once that one settles, through the latest
  // callback, so it sees an id or map that arrived meanwhile. It used to be dropped, and a
  // workout finished during a slow upload waited for some unrelated event to be queued.
  const rerunRequested = useRef(false);
  const latestSyncNow = useRef<() => void>(() => {});

  // One identity per device, established on first launch and reused after.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    ensureAthleteIdentity().then((state) => { if (!cancelled) setIdentity(state); });
    return () => { cancelled = true; };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    refreshReferenceMap(appSports).then((map) => { if (!cancelled && map) setReferenceMap(map); });
    return () => { cancelled = true; };
  }, [enabled, appSports]);

  // An offline launch leaves identity "unreachable" and the map unread, and About me promises
  // the record syncs when the service is back, so both are asked for again on reconnect.
  // Only "unreachable" is retried: the other reasons are settings a retry cannot change.
  // The ref keeps two anonymous sign-ins from racing and minting two users.
  const resolvingIdentity = useRef(false);
  useEffect(() => {
    if (!enabled || identity.userId || identity.reason !== "unreachable") return;
    let cancelled = false;
    const stop = onReconnect(() => {
      if (resolvingIdentity.current) return;
      resolvingIdentity.current = true;
      ensureAthleteIdentity()
        .then((state) => { if (!cancelled) setIdentity(state); })
        .finally(() => { resolvingIdentity.current = false; });
    });
    return () => { cancelled = true; stop(); };
  }, [enabled, identity.userId, identity.reason]);

  // Its own effect, so an id arriving first does not discard a map still on its way.
  useEffect(() => {
    if (!enabled || referenceMap) return;
    let cancelled = false;
    const stop = onReconnect(() => {
      refreshReferenceMap(appSports).then((map) => { if (!cancelled && map) setReferenceMap(map); });
    });
    return () => { cancelled = true; stop(); };
  }, [enabled, appSports, referenceMap]);

  // The profile row follows the athlete's current defaults. It is a default, not
  // a measurement: every lift keeps its own dated body-weight snapshot.
  useEffect(() => {
    if (!enabled || !identity.userId) return;
    upsertAthleteProfile(identity.userId, {
      sexForReference,
      birthYear,
      primarySportId: sportId ? referenceMap?.sportUuidBySlug[sportId] : undefined,
      sportContextMode,
      defaultBodyWeightKg: currentBodyWeightKg(loadBodyWeightLog()),
    });
  }, [enabled, identity.userId, sexForReference, birthYear, sportId, sportContextMode, referenceMap]);

  /**
   * The catalog, from the athlete's own session when the server route cannot
   * serve it. The service-role key is a deployment setting; the view's own
   * row-level security already says a signed-in athlete may read this list, so a
   * missing key turns off a picker the database was willing to fill.
   *
   * Tried only while the server answer is not connected, and never re-tried once
   * it has succeeded.
   */
  const [ownCatalog, setOwnCatalog] = useState<ResilienceTargetCatalog | null>(null);
  useEffect(() => {
    if (!enabled || !identity.userId || ownCatalog) return;
    if (targetCatalog?.status === "connected") return;
    let cancelled = false;
    fetchTargetCatalogAsAthlete(identity.userId).then((catalog) => { if (!cancelled && catalog) setOwnCatalog(catalog); });
    return () => { cancelled = true; };
  }, [enabled, identity.userId, targetCatalog?.status, ownCatalog]);

  // The server wins when it has an answer; this is a fallback, not a second
  // source, and both parse rows through the same shared parser.
  const effectiveCatalog = targetCatalog?.status === "connected" ? targetCatalog : ownCatalog ?? targetCatalog;

  /**
   * The capacity answers, restored once and then written through.
   *
   * Restored only when this device has none of its own: the device is what the
   * athlete is looking at, and overwriting an answer they just gave with an
   * older one from the account would be the sync clobbering the edit. It is the
   * reinstall and the second device that this is for.
   */
  const restoredCapacity = useRef(false);
  useEffect(() => {
    if (!enabled || !identity.userId || restoredCapacity.current) return;
    if (effectiveCatalog?.status !== "connected") return;
    if (capacityFocus?.focus) { restoredCapacity.current = true; return; }
    let cancelled = false;
    loadCapacityContext(identity.userId, effectiveCatalog).then((snapshot) => {
      if (cancelled || !snapshot) return;
      restoredCapacity.current = true;
      onCapacityRestored?.(snapshot);
    });
    return () => { cancelled = true; };
  }, [enabled, identity.userId, effectiveCatalog, capacityFocus?.focus, onCapacityRestored]);

  // Written on a real change only. The signature leaves out anything the tables
  // have no column for, so a re-render never lays down a duplicate row.
  const lastCapacity = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !identity.userId || !capacityFocus) return;
    if (effectiveCatalog?.status !== "connected") return;
    const signature = capacitySignature(capacityFocus);
    if (signature === "none" || signature === lastCapacity.current) return;
    lastCapacity.current = signature;
    saveCapacityContext(identity.userId, capacityFocus, effectiveCatalog);
  }, [enabled, identity.userId, capacityFocus, effectiveCatalog]);

  const athleteSnapshot = useCallback((): AthleteSnapshot => ({
    sexForReference,
    birthYear,
    sportId: sportId ? referenceMap?.sportUuidBySlug[sportId] : undefined,
  }), [sexForReference, birthYear, sportId, referenceMap]);

  /** Turns everything finished on this device into queued rows, then sends them. */
  const syncNow = useCallback(() => {
    if (!enabled) return;
    if (running.current) { rerunRequested.current = true; return; }
    running.current = true;
    const weightLog = loadBodyWeightLog();
    const observations = workoutStrengthObservations(loadDeviceWorkoutSessions(), weightUnit, weightLog);
    const snapshot = athleteSnapshot();

    const candidates: QueuedLift[] = observations.flatMap((observation) => {
      const catalogExerciseId = catalogIdByName.get(observation.exerciseName.trim().toLowerCase());
      if (!catalogExerciseId) return [];
      return [{
        key: observation.id,
        queuedAt: new Date().toISOString(),
        athlete: snapshot,
        lift: {
          catalogExerciseId,
          observedAt: observation.observedAt,
          measurementType: observation.measurementType,
          // Sent exactly as typed, in the unit it was typed in; load_kg is generated in
          // Postgres. It used to be re-expressed in today's profile unit, so a set logged
          // in lb and synced after a switch to kg arrived as kilograms.
          reportedLoad: observation.reportedLoad,
          reportedUnit: observation.reportedUnit ?? weightUnit,
          repetitions: observation.repetitions,
          bodyMassKgAtTest: observation.bodyMassKgAtTest,
          source: "device" as const,
          // The exercise's own convention, not "total_external_load" for every lift (EN-07).
          loadSemantics: observation.loadSemantics,
        },
      }];
    });

    const queue = enqueueLifts(loadSyncQueue(), loadSyncedKeys(), candidates);
    saveSyncQueue(queue);
    setPending(queue.length);

    flushSyncQueue(identity.userId, (catalogId) => referenceMap?.exerciseUuidByCatalogId[catalogId])
      .then((result) => {
        setPending(loadSyncQueue().length);
        if (result.sent) setLastSyncedAt(new Date().toISOString());
      })
      .finally(() => {
        running.current = false;
        if (rerunRequested.current) { rerunRequested.current = false; latestSyncNow.current(); }
      });
  }, [enabled, weightUnit, athleteSnapshot, identity.userId, referenceMap]);

  useEffect(() => { latestSyncNow.current = syncNow; }, [syncNow]);
  // A flush that settles after unmount starts nothing.
  useEffect(() => () => { rerunRequested.current = false; latestSyncNow.current = () => {}; }, []);

  // Sync when a workout finishes, when weight changes, when an id arrives, and
  // when the device comes back online.
  useEffect(() => {
    if (!enabled) return;
    syncNow();
    const handler = () => syncNow();
    window.addEventListener(deviceWorkoutHistoryEvent, handler);
    window.addEventListener(bodyWeightLogEvent, handler);
    window.addEventListener("online", handler);
    return () => {
      window.removeEventListener(deviceWorkoutHistoryEvent, handler);
      window.removeEventListener(bodyWeightLogEvent, handler);
      window.removeEventListener("online", handler);
    };
  }, [enabled, syncNow]);

  return { identity, pending, lastSyncedAt, targetCatalog: effectiveCatalog, syncNow };
}
