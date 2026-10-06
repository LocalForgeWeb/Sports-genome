import type { LoadConvention } from "@shared/loadConventions";
import type { DeviceSetLog, DropStage } from "./deviceWorkoutLog";
import { displayWeightToKilograms, kilogramsToDisplayWeight, type DisplayWeightUnit } from "./weightUnits";

/**
 * Drop sets (Oct 6 brief §4, §5): one set done as several ordered stages, each lighter than the
 * last, with no rest between them - 100 lb x 5, then 70 lb x 6, then 50 lb x 10.
 *
 * The rules every reader follows, so the set means the same thing everywhere it is shown:
 * - It is ONE set. Set counts, weekly totals and "sets done" count it once.
 * - Its volume is every stage's load x reps added up: 100x5 + 70x6 + 50x10 = 1,420 lb-reps.
 * - Its reps are every stage's reps added up (21), shown as the set's total, never as a 21-rep
 *   set at 100 lb.
 * - Strength estimates read stage 1 only. Stages 2 on are done fatigued, straight after the one
 *   before, so they say nothing about what a fresh set could do; the stages are never added
 *   together into one estimate.
 * - Two stages at least: one stage is an ordinary set (deviceWorkoutLog.settleDropSet).
 */

/** A drop set that counts as one: completed, with at least one drop. */
export function isDropSet(set: Pick<DeviceSetLog, "type" | "stages" | "completed">): boolean {
  return set.type === "drop" && set.completed && (set.stages?.length ?? 0) >= 2;
}

/** The set's stages in order: a drop set's own, or the set itself as its only stage. */
export function stagesOf(set: DeviceSetLog): DropStage[] {
  if (set.type === "drop" && set.stages?.length) return set.stages;
  return [{ id: set.id ?? "set", weight: set.weight, reps: set.reps, unit: set.unit }];
}

const number = (value: string | undefined) => {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : NaN;
};

/** Reps done in the set: a drop set's stages added up. */
export function totalReps(set: DeviceSetLog): number {
  return stagesOf(set).reduce((sum, stage) => sum + (Number.isFinite(number(stage.reps)) ? number(stage.reps) : 0), 0);
}

/** A load as it is written in this app: "52.5", never "52.50" or "52.499999". */
export function formatLoad(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * What a stage's load means for the exercise, in words short enough for a set row. A bodyweight
 * movement's weight is load added to the body, and an empty one is the body alone.
 */
export function stageLoadText(stage: Pick<DropStage, "weight" | "unit">, unit: DisplayWeightUnit, convention: LoadConvention = "total_external_load"): string {
  const value = number(stage.weight);
  const has = stage.weight.trim() !== "" && Number.isFinite(value) && value > 0;
  const shown = has ? formatLoad(stage.unit && stage.unit !== unit ? kilogramsToDisplayWeight(displayWeightToKilograms(value, stage.unit), unit) : value) : "";
  if (convention === "bodyweight_reps") return has ? `+${shown} ${unit}` : "bodyweight";
  return has ? `${shown} ${unit}` : `— ${unit}`;
}

/** "Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10": the collapsed row, the same in every place it is shown. */
export function dropSetLine(set: DeviceSetLog, unit: DisplayWeightUnit, convention: LoadConvention = "total_external_load"): string {
  return `Drop set · ${stagesOf(set).map((stage) => `${stageLoadText(stage, unit, convention)} × ${stage.reps.trim() || "—"}`).join(" → ")}`;
}

/**
 * The set's volume, load x reps over every stage, in the unit asked for - or null where the
 * load is not the external load lifted:
 * - total external load and machine-displayed load are what was moved;
 * - a dumbbell or carry weight is per implement, so the volume is per dumbbell (or per hand),
 *   and says so rather than doubling a number nobody typed;
 * - a bodyweight movement's typed weight is only what was added, so it has no external volume.
 */
export type SetVolume = { value: number; unit: DisplayWeightUnit; basis: "total" | "per_implement" | "per_hand" };

export function setVolume(set: DeviceSetLog, unit: DisplayWeightUnit, convention: LoadConvention = "total_external_load", fallbackUnit: DisplayWeightUnit = unit): SetVolume | null {
  if (convention === "bodyweight_reps") return null;
  let value = 0;
  let counted = false;
  for (const stage of stagesOf(set)) {
    const load = number(stage.weight);
    const reps = number(stage.reps);
    if (!(load > 0) || !(reps > 0)) continue;
    const from = stage.unit ?? set.unit ?? fallbackUnit;
    value += (from === unit ? load : kilogramsToDisplayWeight(displayWeightToKilograms(load, from), unit)) * reps;
    counted = true;
  }
  if (!counted) return null;
  return { value: Math.round(value * 100) / 100, unit, basis: convention === "per_implement" ? "per_implement" : convention === "per_hand" ? "per_hand" : "total" };
}

/** "1,420 lb·reps", with "per dumbbell" or "per hand" where the load was. */
export function volumeText(volume: SetVolume): string {
  const amount = volume.value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${amount} ${volume.unit}·reps${volume.basis === "per_implement" ? " per dumbbell" : volume.basis === "per_hand" ? " per hand" : ""}`;
}

/**
 * One performed set as every record shows it: "185 lb × 5", "bodyweight × 12", "+20 lb × 5",
 * "24 in box × 8", or a drop set's collapsed row.
 */
export function performedSetLine(set: DeviceSetLog, unit: DisplayWeightUnit, convention: LoadConvention = "total_external_load"): string {
  if (set.type === "drop" && (set.stages?.length ?? 0) >= 2) return dropSetLine(set, unit, convention);
  const reps = set.reps.trim() || "—";
  if ((set.height || "").trim() && !set.weight.trim()) return `${set.height} in box × ${reps}`;
  const load = stageLoadText({ weight: set.weight, unit: set.unit }, unit, convention);
  return `${load}${(set.height || "").trim() ? ` · ${set.height} in box` : ""} × ${reps}`;
}

/** "1 drop set · 3 stages · 21 reps", the detail line under the collapsed row. */
export function dropSetSummary(set: DeviceSetLog): string {
  const stages = stagesOf(set).length;
  const reps = totalReps(set);
  return `1 drop set · ${stages} ${stages === 1 ? "stage" : "stages"} · ${reps} ${reps === 1 ? "rep" : "reps"}`;
}

/**
 * Why a stage cannot be added yet, or null when it can. Reps are whole and at least 1. A load
 * is required where the exercise has one, and each drop is lighter than the stage before - a
 * stage at the same or a heavier load is a rest-pause or a new set, not a drop. A bodyweight
 * movement may drop its added load to none.
 */
export function stageProblem(stage: Pick<DropStage, "weight" | "reps">, previous: Pick<DropStage, "weight" | "unit"> | undefined, options: { loadOptional: boolean; unit: DisplayWeightUnit; previousUnit?: DisplayWeightUnit }): string | null {
  const reps = number(stage.reps);
  if (!stage.reps.trim() || !Number.isInteger(reps) || reps < 1) return "Enter the reps for this stage.";
  const load = stage.weight.trim() ? number(stage.weight) : NaN;
  if (stage.weight.trim() && !(load >= 0)) return "Enter the load as a number.";
  if (!options.loadOptional && !(load > 0)) return "Enter the load for this stage.";
  if (previous) {
    const before = previous.weight.trim() ? number(previous.weight) : 0;
    const beforeInUnit = previous.unit && previous.unit !== options.unit ? kilogramsToDisplayWeight(displayWeightToKilograms(before, previous.unit), options.unit) : before;
    const now = Number.isFinite(load) ? load : 0;
    if (beforeInUnit > 0 && now >= beforeInUnit - 1e-9) return `Each drop is lighter than the stage before (${formatLoad(beforeInUnit)} ${options.unit}).`;
    if (beforeInUnit <= 0 && now > 0) return "Each drop is lighter than the stage before.";
    if (beforeInUnit <= 0 && now <= 0 && !options.loadOptional) return "Enter the load for this stage.";
  }
  return null;
}

/** A new stage id: stable once written, unique within its set. */
export function newStageId(setId: string, existing: readonly DropStage[]): string {
  let index = existing.length + 1;
  const taken = new Set(existing.map((stage) => stage.id));
  while (taken.has(`${setId}-stage-${index}`)) index += 1;
  return `${setId}-stage-${index}`;
}
