import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { choosePlan } from "@/lib/planSyncDecision";

export type PlanSyncState = "idle" | "syncing" | "synced" | "offline" | "conflict";

/**
 * Keeps the training plan on the account as well as the device.
 *
 * The device copy stays the source of truth while editing - it is instant, it works
 * offline, and it is what the builder already reads. This adds the account copy
 * alongside it: pulled once when an athlete signs in, pushed after edits settle.
 *
 * Saving is debounced because the plan is written on every keystroke-level change in
 * the builder, and a request per change would be both wasteful and a good way to
 * lose a race with itself.
 */
export function usePlanSync({ enabled, planJson, planVersion, onAdoptServerPlan }: {
  enabled: boolean;
  planJson: string | null;
  planVersion: number;
  /** Called when the account's copy wins and the builder should load it. */
  onAdoptServerPlan: (planJson: string) => void;
}) {
  const [state, setState] = useState<PlanSyncState>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const revisionRef = useRef<number | null>(null);
  const pulledRef = useRef(false);
  const lastPushedRef = useRef<string | null>(null);

  const remote = trpc.workoutPlan.get.useQuery(undefined, {
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const save = trpc.workoutPlan.save.useMutation();

  // Pull once per sign-in. The device copy wins unless the account's is genuinely
  // newer, so a plan built offline is never quietly replaced on reconnect.
  useEffect(() => {
    if (!enabled || pulledRef.current || remote.isLoading) return;
    if (remote.isError) { setState("offline"); return; }
    pulledRef.current = true;

    const server = remote.data ?? null;
    revisionRef.current = server?.revision ?? null;

    const choice = choosePlan(
      { planJson, updatedAt: null },
      { planJson: server?.planJson ?? null, updatedAt: server?.updatedAt ? new Date(server.updatedAt) : null }
    );
    if (choice.use === "server" && server?.planJson) {
      onAdoptServerPlan(server.planJson);
      lastPushedRef.current = server.planJson;
      setLastSyncedAt(server.updatedAt ? new Date(server.updatedAt) : new Date());
      setState("synced");
    }
  }, [enabled, remote.isLoading, remote.isError, remote.data, planJson, onAdoptServerPlan]);

  const push = useCallback(async (json: string) => {
    setState("syncing");
    try {
      const result = await save.mutateAsync({
        planJson: json,
        planVersion,
        baseRevision: revisionRef.current,
      });
      if (result.status === "saved") {
        revisionRef.current = result.revision;
        lastPushedRef.current = json;
        setLastSyncedAt(new Date(result.updatedAt));
        setState("synced");
        return;
      }
      if (result.status === "conflict") {
        // Another device wrote first. Take its revision so the next push is a clean
        // edit on top rather than another rejected write.
        revisionRef.current = result.current.revision;
        setState("conflict");
        return;
      }
      setState("offline");
    } catch {
      // No network, no account, or the API is down: the device copy still holds
      // everything, so this is a degraded state rather than a failure.
      setState("offline");
    }
  }, [planVersion, save]);

  // Debounced push. The builder rewrites the plan on every small edit.
  useEffect(() => {
    if (!enabled || !pulledRef.current || !planJson) return;
    if (planJson === lastPushedRef.current) return;
    const timer = window.setTimeout(() => { void push(planJson); }, 1_500);
    return () => window.clearTimeout(timer);
  }, [enabled, planJson, push]);

  return { state, lastSyncedAt };
}
