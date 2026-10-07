import { createContext, useContext, useEffect, useState } from "react";
import { readScopedRecord, scopedKey } from "@/lib/deviceStorageScope";

/**
 * Private, per-account records for the utility tools (plate inventory, setup notebook, plan
 * blocks, preparation routines). They use the same account namespacing as the plan and the
 * profile (lib/deviceStorageScope): one athlete's setups never show for another account on the
 * same device, and a record made before sign-in moves into the first account that signs in.
 * Nothing here is sent anywhere; no new sync, cloud or analytics path.
 *
 * Every read tolerates missing, blocked or corrupt storage and returns the fallback; every
 * write reports whether it was kept, so a sheet can say "Couldn't save" and keep the draft.
 */

/** The signed-in account the utility records belong to; null is the shared, signed-out namespace. */
export const UtilityAccountContext = createContext<string | number | null>(null);
export const useUtilityAccount = () => useContext(UtilityAccountContext);

const CHANGED = "sg-utility-record-changed";

function storage(): Storage | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; } catch { return undefined; }
}

export function readUtilityRecord<T>(base: string, accountId: string | number | null | undefined, fallback: T, isValid: (value: unknown) => value is T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = readScopedRecord(base, accountId, store);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return isValid(parsed) ? parsed : fallback;
  } catch { return fallback; }
}

/** True when the record was written. A full or blocked store returns false and changes nothing. */
export function writeUtilityRecord(base: string, accountId: string | number | null | undefined, value: unknown): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(scopedKey(base, accountId), JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CHANGED, { detail: { base } }));
    return true;
  } catch { return false; }
}

/** A record kept in step with every writer on the page, for the account in context. */
export function useUtilityRecord<T>(base: string, fallback: T, isValid: (value: unknown) => value is T): [T, (next: T) => boolean] {
  const accountId = useUtilityAccount();
  const [value, setValue] = useState<T>(() => readUtilityRecord(base, accountId, fallback, isValid));
  useEffect(() => {
    setValue(readUtilityRecord(base, accountId, fallback, isValid));
    const refresh = (event: Event) => { if ((event as CustomEvent<{ base: string }>).detail?.base === base) setValue(readUtilityRecord(base, accountId, fallback, isValid)); };
    // Another tab writing the same record shows here too.
    const fromOtherTab = (event: StorageEvent) => { if (event.key === scopedKey(base, accountId)) setValue(readUtilityRecord(base, accountId, fallback, isValid)); };
    window.addEventListener(CHANGED, refresh);
    window.addEventListener("storage", fromOtherTab);
    return () => { window.removeEventListener(CHANGED, refresh); window.removeEventListener("storage", fromOtherTab); };
    // The fallback and validator are stable module values at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, accountId]);
  const write = (next: T) => {
    const kept = writeUtilityRecord(base, accountId, next);
    if (kept) setValue(next);
    return kept;
  };
  // Whatever state holds is checked again before anyone reads it: a record can only ever be
  // the validated shape or the fallback.
  return [isValid(value) ? value : fallback, write];
}

/** A stable, unguessable-enough local id for a record ("setup-k3j…"). */
export function utilityId(prefix: string): string {
  const random = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID().replace(/-/g, "").slice(0, 16) : Math.random().toString(36).slice(2, 18);
  return `${prefix}-${random}`;
}
