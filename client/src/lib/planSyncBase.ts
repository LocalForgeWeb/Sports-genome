import type { PlanSyncBase } from "./planSyncDecision";

/**
 * Where a device keeps its last agreement with each account's plan. Per account, so one
 * account's revision is never used as another's base (PS-05).
 */
export const planSyncBaseKey = (accountId: string | number) => `sports-genome-plan-sync-base-v1::${accountId}`;

export function loadPlanSyncBase(accountId: string | number | null | undefined): PlanSyncBase | null {
  if (accountId === null || accountId === undefined || typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(planSyncBaseKey(accountId)) || "null") as Partial<PlanSyncBase> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      revision: typeof parsed.revision === "number" ? parsed.revision : null,
      syncedHash: typeof parsed.syncedHash === "string" ? parsed.syncedHash : null,
    };
  } catch {
    return null;
  }
}

export function savePlanSyncBase(accountId: string | number | null | undefined, base: PlanSyncBase): void {
  if (accountId === null || accountId === undefined || typeof window === "undefined") return;
  try { window.localStorage.setItem(planSyncBaseKey(accountId), JSON.stringify(base)); } catch { /* The next pull re-establishes it. */ }
}
