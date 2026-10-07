import type { PlateUnit } from "@/lib/plateLoading";

/**
 * Opening a utility tool from wherever it is needed - the exercise record, the workout, search,
 * About me - without threading callbacks through the screens that own those places. The one
 * host (components/UtilityToolsHost, mounted by Home) listens and opens the sheet; the place
 * that asked keeps its own state, and focus returns to it when the sheet closes.
 */
export type UtilityRequest =
  | { tool: "plates"; exerciseName?: string; target?: string; unit?: PlateUnit }
  | { tool: "setup"; catalogExerciseId: number; exerciseName: string }
  | { tool: "glossary"; termId?: string }
  | { tool: "preparation"; dayLabel: string; mode: "choose" | "create" | "manage"; suggestedDrillIds?: string[] };

export const UTILITY_OPEN_EVENT = "sg-open-utility";

export function openUtility(request: UtilityRequest) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UtilityRequest>(UTILITY_OPEN_EVENT, { detail: request }));
}

const BAR_EQUIPMENT = /^(barbell|trap bar|safety squat bar)$/i;
// The catalog files many barbell lifts under "Free weights", a bucket that also holds pulldowns,
// jumps and dumbbell work, so a named barbell lift is recognised by name - conservatively.
const BAR_LIFT = /\b(back squat|front squat|box squat|deadlift|good morning|bench press|overhead press|military press|push press|z-press|jm press|hip thrust|zercher|clean|snatch|jerk|ez-bar|barbell)\b/i;
const NOT_A_BAR = /dumbbell|kettlebell|single-leg|single-arm|b-stance|goblet|landmine|cable|machine|smith|band|plate front|plate pinch|plate squeeze|t-bar/i;

/** An exercise loaded with plates on both ends of a bar: where "Load the bar" belongs. */
export function usesBarbellPlates(equipment: string | undefined, name = ""): boolean {
  const kind = (equipment ?? "").trim();
  if (NOT_A_BAR.test(name)) return false;
  return BAR_EQUIPMENT.test(kind) || ((kind === "Free weights" || kind === "") && BAR_LIFT.test(name));
}
