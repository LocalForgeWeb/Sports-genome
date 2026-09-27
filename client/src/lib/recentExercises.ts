/**
 * The exercises this device looked at most recently, so a returning athlete can
 * reopen one without searching again (docs/ux-polish/brief.md, 11A).
 *
 * Only canonical catalog ids are kept, newest first, deduplicated and capped;
 * nothing else about the athlete is recorded and nothing leaves the device. The
 * list is cleared with one action, and an id that no longer resolves to a
 * catalog exercise is skipped when read.
 */
import { useEffect, useState } from "react";

export const recentExercisesKey = "sports-genome-recent-exercises-v1";
export const recentExercisesEvent = "sports-genome:recent-exercises";
export const recentExercisesLimit = 8;

export function loadRecentExerciseIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentExercisesKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function save(ids: number[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(recentExercisesKey, JSON.stringify(ids));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(recentExercisesEvent));
  return true;
}

/** Puts one exercise at the front of the list: a repeat view moves it up rather than duplicating it. */
export function pushRecentExerciseId(existing: readonly number[], id: number, limit = recentExercisesLimit): number[] {
  return [id, ...existing.filter((item) => item !== id)].slice(0, limit);
}

export function recordRecentExercise(id: number): boolean {
  return save(pushRecentExerciseId(loadRecentExerciseIds(), id));
}

export function clearRecentExercises(): boolean {
  return save([]);
}

/** The list, kept in step with this tab's own writes and another tab's storage events. */
export function useRecentExerciseIds(): number[] {
  const [ids, setIds] = useState<number[]>(() => loadRecentExerciseIds());
  useEffect(() => {
    const refresh = () => setIds(loadRecentExerciseIds());
    window.addEventListener(recentExercisesEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(recentExercisesEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return ids;
}
