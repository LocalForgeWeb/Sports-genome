import type { Exercise } from "@/lib/exerciseCatalog";
import type { AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import type { NextWorkoutChoice } from "@/lib/nextWorkout";
import type { DaySlot, WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import type { SpecializationPlanChange, SpecializationPlanChangeResult, SpecializationViewState } from "@/lib/specialization/viewState";
import { regionDataFor } from "@shared/specialization/registry";

/** What Home hands the page: its plan, the catalog, and the few actions that change Home's state. */
export type SpecializationPanelProps = {
  state: SpecializationViewState;
  /** Replaces the page state (and the URL entry); never pushes a history entry. */
  onStateChange: (next: SpecializationViewState) => void;
  plan: { ready: boolean; slots: DaySlot[]; weeks: Record<number, WeeklyDayStore>; choice: NextWorkoutChoice | null; activeWeek: number };
  catalog: Exercise[];
  equipmentProfile: AthleteEquipmentProfile;
  accountId: string | number | null;
  goal: TrainingGoal;
  /** The profile's unit: loads are shown in it, and a set with no recorded unit was typed in it. */
  weightUnit: DisplayWeightUnit;
  defaultPrescriptionFor: (index: number) => string;
  onApplyPlanChange: (change: SpecializationPlanChange) => SpecializationPlanChangeResult;
  onInspectExercise: (exercise: Exercise) => void;
  onOpenSession: (sessionId: string) => void;
  /** "Back to Review your week" when the page was opened from another screen. */
  backLabel: string | null;
  onBack: (() => void) | null;
};

export function SpecializationPanel({ state }: SpecializationPanelProps) {
  const data = regionDataFor(state.regionId);
  return <section className="specialization-page" aria-labelledby="specialization-heading">
    <h1 id="specialization-heading">{data?.region.heading ?? "Specialization"}</h1>
  </section>;
}
