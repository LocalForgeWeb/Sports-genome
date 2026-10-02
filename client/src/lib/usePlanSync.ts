import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { planFingerprint, reconcilePlans } from "@/lib/planSyncDecision";
import { loadPlanSyncBase, savePlanSyncBase } from "@/lib/planSyncBase";

export type PlanSyncState = "idle" | "syncing" | "synced" | "offline" | "conflict";

/** The account's copy when it and this device both changed since they last agreed. */
export type PlanSyncConflict = { planJson: string; revision: number; updatedAt: Date | null };

/**
 * Keeps the training plan on the account as well as the device.
 *
 * The device copy stays the source of truth while editing - it is instant, it works
 * offline, and it is what the builder already reads. This adds the account copy
 * alongside it: pulled when an athlete signs in, pushed after edits settle.
 *
 * Every decision is three-way - this device, the account, and the revision they last
 * agreed on (`planSyncBase`) - so an edit on one side is never taken for a change on the
 * other. When both changed, syncing stops and the athlete chooses (`resolveConflict`).
 * It used to adopt the account's revision on a conflict and push again 1.5 s later,
 * overwriting the other device's plan, and to replace a device's offline edits with any
 * differing account copy on the first pull (SV-04, PS-04, PS-05).
 *
 * Saving is debounced because the plan is written on every keystroke-level change in
 * the builder, and a request per change would be both wasteful and a good way to lose a
 * race with itself.
 */
export function usePlanSync({ enabled, accountId, planJson, planVersion, onAdoptServerPlan }: {
  enabled: boolean;
  /** Whose plan this is. Everything the hook remembers is per account. */
  accountId: string | number | null;
  planJson: string | null;
  planVersion: number;
  /** Called when the account's copy wins and the builder should load it. */
  onAdoptServerPlan: (planJson: string) => void;
}) {
  const [state, setState] = useState<PlanSyncState>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [conflict, setConflict] = useState<PlanSyncConflict | null>(null);
  const pulledRef = useRef(false);
  const lastPushedRef = useRef<string | null>(null);
  const accountRef = useRef(accountId);
  const planJsonRef = useRef(planJson);
  planJsonRef.current = planJson;
  /** The device copy the account's plan just replaced; it is never pushed afterwards. */
  const supersededRef = useRef<string | null>(null);

  // A different account starts from nothing: no pull, no base, no pending push.
  if (accountRef.current !== accountId) {
    accountRef.current = accountId;
    pulledRef.current = false;
    lastPushedRef.current = null;
    supersededRef.current = null;
  }
  useEffect(() => { setConflict(null); setState("idle"); setLastSyncedAt(null); }, [accountId]);

  const remote = trpc.workoutPlan.get.useQuery(undefined, {
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const save = trpc.workoutPlan.save.useMutation();

  const agree = useCallback((json: string, revision: number, at: Date | null) => {
    savePlanSyncBase(accountRef.current, { revision, syncedHash: planFingerprint(json) });
    lastPushedRef.current = json;
    setLastSyncedAt(at ?? new Date());
    setConflict(null);
    setState("synced");
  }, []);

  const adopt = useCallback((json: string, revision: number, at: Date | null) => {
    if (planJsonRef.current && planJsonRef.current !== json) supersededRef.current = planJsonRef.current;
    onAdoptServerPlan(json);
    agree(json, revision, at);
  }, [agree, onAdoptServerPlan]);

  // Pull once per sign-in, and settle the two copies three ways.
  useEffect(() => {
    // The device's copy has to be known first: comparing an unread plan with the account's
    // would take the account's copy for the only one.
    if (!enabled || pulledRef.current || remote.isLoading || planJson === null) return;
    if (remote.isError) { setState("offline"); return; }
    pulledRef.current = true;

    const server = remote.data ?? null;
    const serverAt = server?.updatedAt ? new Date(server.updatedAt) : null;
    const decision = reconcilePlans({ planJson }, { planJson: server?.planJson ?? null, revision: server?.revision ?? null }, loadPlanSyncBase(accountRef.current));
    if (decision.use === "server" && server?.planJson) { adopt(server.planJson, server.revision, serverAt); return; }
    if (decision.use === "same" && server?.planJson) { agree(server.planJson, server.revision, serverAt); return; }
    if (decision.use === "conflict" && server?.planJson) {
      setConflict({ planJson: server.planJson, revision: server.revision, updatedAt: serverAt });
      setState("conflict");
      return;
    }
    // "device" (the account is unchanged, or has nothing) and "neither": the debounced push
    // below carries this device's plan on top of the account's revision.
  }, [enabled, remote.isLoading, remote.isError, remote.data, planJson, adopt, agree]);

  const push = useCallback(async (json: string, baseRevision: number | null) => {
    setState("syncing");
    try {
      const result = await save.mutateAsync({ planJson: json, planVersion, baseRevision });
      if (result.status === "saved") {
        agree(json, result.revision, new Date(result.updatedAt));
        return;
      }
      if (result.status === "conflict") {
        // Another device wrote first. Stop here and ask; pushing again on its revision would
        // overwrite that device's plan with this one.
        const current = result.current;
        setConflict({ planJson: current.planJson, revision: current.revision, updatedAt: current.updatedAt ? new Date(current.updatedAt) : null });
        setState("conflict");
        return;
      }
      setState("offline");
    } catch {
      // No network, no account, or the API is down: the device copy still holds
      // everything, so this is a degraded state rather than a failure.
      setState("offline");
    }
  }, [agree, planVersion, save]);

  // Debounced push, on top of the revision this device last agreed with. Never while a
  // conflict is waiting for the athlete.
  useEffect(() => {
    if (!enabled || !pulledRef.current || !planJson || conflict) return;
    if (planJson === lastPushedRef.current) return;
    // Until the builder has loaded the adopted plan, what it still holds is the copy the
    // account replaced; pushing it would undo the adoption.
    if (planJson === supersededRef.current) return;
    const timer = window.setTimeout(() => {
      const base = loadPlanSyncBase(accountRef.current);
      void push(planJson, base?.revision ?? remote.data?.revision ?? null);
    }, 1_500);
    return () => window.clearTimeout(timer);
  }, [enabled, planJson, push, conflict, remote.data?.revision]);

  /** The athlete's answer to a conflict: keep this device's plan, or take the account's. */
  const resolveConflict = useCallback((keep: "device" | "account") => {
    if (!conflict) return;
    if (keep === "account") { adopt(conflict.planJson, conflict.revision, conflict.updatedAt); return; }
    if (!planJson) return;
    // Written knowingly on top of the account's current revision.
    const revision = conflict.revision;
    setConflict(null);
    void push(planJson, revision);
  }, [adopt, conflict, planJson, push]);

  return { state, lastSyncedAt, conflict, resolveConflict };
}
