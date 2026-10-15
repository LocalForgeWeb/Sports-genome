import { Check } from "lucide-react";
import { usuallyLightReason, type SetEffort } from "@shared/setEffort";
import "../set-effort.css";

/**
 * How hard a set was taken, said where the set is entered - never a dialog (owner, 15 Oct 2026).
 *
 * For an exercise usually done light (shared/setEffort.ts: good mornings and their like) it is one
 * short line with the assumption already chosen - "Not to failure" - so the athlete sees how the set
 * will count and changes it only if it was a hard set. For any other exercise it is a single quiet
 * toggle, off unless pressed: most sets need nothing said.
 *
 * A set stopped short of failure is a floor: it may raise a rank, never lower it.
 */
export function SetEffortChoice({ exerciseName, catalogExerciseId, effort, onChange, variant = "full" }: {
  exerciseName: string;
  catalogExerciseId: number | null | undefined;
  /** What the athlete said for this set; undefined when nothing was said. */
  effort: SetEffort | undefined;
  /** Undefined clears it: nothing said. */
  onChange: (effort: SetEffort | undefined) => void;
  /** "full" in the set's entry; "chip" on a logged set's row, where space is short. */
  variant?: "full" | "chip";
}) {
  const usuallyLight = usuallyLightReason(catalogExerciseId) !== null;
  const shown: SetEffort | undefined = effort ?? (usuallyLight ? "not_to_failure" : undefined);
  const floor = shown === "not_to_failure";

  if (variant === "chip") {
    // Pressing flips how the set counts; for a usually-light exercise "off" has to be said, since unsaid reads as on.
    const flip = () => onChange(floor ? (usuallyLight ? "failure" : undefined) : "not_to_failure");
    return <button type="button" className="set-effort-chip" aria-pressed={floor} onClick={flip} aria-label={`${exerciseName}: ${floor ? "not taken to failure" : "taken to failure"}. ${floor ? "Mark as to failure" : "Mark as not to failure"}`}>
      {floor && <Check className="h-3 w-3" aria-hidden="true" />}<span>Not to failure</span>
    </button>;
  }

  if (usuallyLight) {
    return <div className="set-effort set-effort-ask" role="group" aria-label={`How hard this set of ${exerciseName} was taken`}>
      <p className="set-effort-why">Usually done light. This set was</p>
      <div className="set-effort-options">
        <button type="button" aria-pressed={shown === "not_to_failure"} onClick={() => onChange("not_to_failure")}>Not to failure</button>
        <button type="button" aria-pressed={shown === "failure"} onClick={() => onChange("failure")}>To failure</button>
      </div>
    </div>;
  }

  return <div className="set-effort">
    <button type="button" className="set-effort-chip" aria-pressed={floor} onClick={() => onChange(floor ? undefined : "not_to_failure")}>
      {floor && <Check className="h-3 w-3" aria-hidden="true" />}<span>Not to failure</span>
    </button>
    {floor && <p className="set-effort-why">Counts toward your ranks only where it raises them.</p>}
  </div>;
}
