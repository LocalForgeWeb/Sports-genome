import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAthleteIdentity, upsertAthleteProfile, type IdentityState } from "@/lib/athleteIdentity";
import { loadCachedReferenceMap, refreshReferenceMap, type ReferenceMap } from "@/lib/supabaseReferenceMap";
import { enqueueLifts, flushSyncQueue, loadSyncQueue, loadSyncedKeys, saveSyncQueue, type QueuedLift } from "@/lib/strengthSyncQueue";
import { workoutStrengthObservations } from "@/lib/workoutStrengthRecord";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { bodyWeightLogEvent, currentBodyWeightKg, loadBodyWeightLog } from "@/lib/bodyWeightLog";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import { capacitySignature, loadCapacityContext, saveCapacityContext, type CapacityContextSnapshot } from "@/lib/capacityContext";
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

export type AthleteSyncStatus = {
  identity: IdentityState;
  pending: number;
  lastSyncedAt?: string;
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
    if (targetCatalog?.status !== "connected") return;
    if (capacityFocus?.focus) { restoredCapacity.current = true; return; }
    let cancelled = false;
    loadCapacityContext(identity.userId, targetCatalog).then((snapshot) => {
      if (cancelled || !snapshot) return;
      restoredCapacity.current = true;
      onCapacityRestored?.(snapshot);
    });
    return () => { cancelled = true; };
  }, [enabled, identity.userId, targetCatalog, capacityFocus?.focus, onCapacityRestored]);

  // Written on a real change only. The signature leaves out anything the tables
  // have no column for, so a re-render never lays down a duplicate row.
  const lastCapacity = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !identity.userId || !capacityFocus) return;
    if (targetCatalog?.status !== "connected") return;
    const signature = capacitySignature(capacityFocus);
    if (signature === "none" || signature === lastCapacity.current) return;
    lastCapacity.current = signature;
    saveCapacityContext(identity.userId, capacityFocus, targetCatalog);
  }, [enabled, identity.userId, capacityFocus, targetCatalog]);

  const athleteSnapshot = useCallback((): AthleteSnapshot => ({
    sexForReference,
    birthYear,
    sportId: sportId ? referenceMap?.sportUuidBySlug[sportId] : undefined,
  }), [sexForReference, birthYear, sportId, referenceMap]);

  /** Turns everything finished on this device into queued rows, then sends them. */
  const syncNow = useCallback(() => {
    if (!enabled || running.current) return;
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
          // Sent in the athlete's own unit; load_kg is generated in Postgres.
          reportedLoad: observation.loadKg === undefined ? undefined : Number((weightUnit === "kg" ? observation.loadKg : observation.loadKg / 0.45359237).toFixed(2)),
          reportedUnit: weightUnit,
          repetitions: observation.repetitions,
          bodyMassKgAtTest: observation.bodyMassKgAtTest,
          source: "device" as const,
          loadSemantics: "total_external_load",
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
      .finally(() => { running.current = false; });
  }, [enabled, weightUnit, athleteSnapshot, identity.userId, referenceMap]);

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

  return { identity, pending, lastSyncedAt, syncNow };
}
