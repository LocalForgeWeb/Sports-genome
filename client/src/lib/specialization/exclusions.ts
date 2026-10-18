import { useCallback, useEffect, useState } from "react";
import { readScopedRecord, scopedKey } from "@/lib/deviceStorageScope";
import type { AccountScope, StoreWrite } from "./stores";

/**
 * Exercises and equipment the athlete does not want suggested on the specialization page
 * (brief §7: "Allow equipment and unavailable movements to be excluded"). Device storage
 * under the account's key, like targets; a corrupt record reads as no exclusions.
 */

export const specializationExclusionsKeyBase = "sports-genome-specialization-exclusions-v1";
export const specializationExclusionsEvent = "sports-genome:specialization-exclusions";

export type SpecializationExclusions = { catalogExerciseIds: number[]; equipment: string[] };

const EMPTY: SpecializationExclusions = { catalogExerciseIds: [], equipment: [] };
const REFUSED: StoreWrite = { ok: false, reason: "This device did not save it. Storage may be full or turned off." };

export function parseExclusions(value: unknown): SpecializationExclusions {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return EMPTY;
  const record = value as Record<string, unknown>;
  const ids = Array.isArray(record.catalogExerciseIds) ? record.catalogExerciseIds.filter((id): id is number => Number.isInteger(id) && (id as number) > 0) : [];
  const equipment = Array.isArray(record.equipment) ? record.equipment.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
  return { catalogExerciseIds: Array.from(new Set(ids)), equipment: Array.from(new Set(equipment)) };
}

export function loadSpecializationExclusions(accountId?: AccountScope): SpecializationExclusions {
  if (typeof window === "undefined") return EMPTY;
  try {
    return parseExclusions(JSON.parse(readScopedRecord(specializationExclusionsKeyBase, accountId, window.localStorage) || "null"));
  } catch {
    return EMPTY;
  }
}

export function saveSpecializationExclusions(next: SpecializationExclusions, accountId?: AccountScope): StoreWrite {
  if (typeof window === "undefined") return REFUSED;
  try {
    window.localStorage.setItem(scopedKey(specializationExclusionsKeyBase, accountId), JSON.stringify(parseExclusions(next)));
  } catch {
    return REFUSED;
  }
  window.dispatchEvent(new Event(specializationExclusionsEvent));
  return { ok: true };
}

/** The account's exclusions, kept current across screens and tabs, with toggles that report a refused write. */
export function useSpecializationExclusions(accountId?: AccountScope) {
  const [exclusions, setExclusions] = useState<SpecializationExclusions>(() => loadSpecializationExclusions(accountId));
  useEffect(() => {
    const refresh = () => setExclusions(loadSpecializationExclusions(accountId));
    const onStorage = (event: StorageEvent) => { if (event.key === null || event.key === scopedKey(specializationExclusionsKeyBase, accountId)) refresh(); };
    refresh();
    window.addEventListener(specializationExclusionsEvent, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(specializationExclusionsEvent, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [accountId]);
  const toggle = useCallback((field: keyof SpecializationExclusions, value: number | string, excluded: boolean): StoreWrite => {
    const current = loadSpecializationExclusions(accountId);
    const list = current[field] as (number | string)[];
    const next = excluded ? Array.from(new Set([...list, value])) : list.filter((item) => item !== value);
    return saveSpecializationExclusions({ ...current, [field]: next } as SpecializationExclusions, accountId);
  }, [accountId]);
  const setExercise = useCallback((catalogExerciseId: number, excluded: boolean) => toggle("catalogExerciseIds", catalogExerciseId, excluded), [toggle]);
  const setEquipment = useCallback((equipment: string, excluded: boolean) => toggle("equipment", equipment, excluded), [toggle]);
  return { exclusions, setExercise, setEquipment };
}
