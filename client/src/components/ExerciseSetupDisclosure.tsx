import { useId } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import type { SetupField } from "@/lib/exerciseExecution";
import {
  declaresLoadBasis, editableSetupFieldsOf, loadBasisText, setupFieldSpecs, setupSummaryOf, smithLoadBasisOf, smithLoadBasisWords,
  type ExerciseSetup, type SmithLoadBasis,
} from "@/lib/exerciseLogging";

const SMITH_BASES: readonly SmithLoadBasis[] = ["plates_only", "total_known_bar"];

/**
 * "Setup" on the live set card (the Zercher, neck and bench handoff §3.4): the values an exercise
 * was done with in this workout - a block's start height, a pause, the machine and its seat, a Smith
 * machine's load basis. Closed until the athlete opens it, every value optional, and nothing in it
 * stands between the athlete and Log set. The summary line says what is recorded, so a closed
 * disclosure still shows the setup. "Same as last time" reuses the last workout's setup of this
 * exercise only when tapped: a setup is never carried over on its own.
 */
export function ExerciseSetupDisclosure({ catalogId, exerciseName, setup, lastSetup, onChange, onRepeat }: {
  catalogId: number | undefined;
  exerciseName: string;
  setup: ExerciseSetup | undefined;
  /** The setup this exercise was last done with in a finished workout, when it differs from this one. */
  lastSetup: ExerciseSetup | null;
  onChange: (field: SetupField, value: string) => void;
  onRepeat: () => void;
}) {
  const ids = useId();
  const fields = editableSetupFieldsOf(catalogId);
  const basisText = loadBasisText(catalogId, setup);
  const smith = declaresLoadBasis(catalogId);
  if (!fields.length && !basisText) return null;
  // A Smith machine's basis defaults to plates only: shown chosen, and stamped when a set is logged.
  const basis = smithLoadBasisOf(setup) ?? "plates_only";
  const summary = setupSummaryOf(catalogId, setup);
  return <details className="live-set-setup">
    <summary>
      <span className="live-set-setup-title">Setup</span>
      <span className="live-set-setup-summary">{summary && summary !== "Setup not recorded" ? summary : "Optional · not recorded"}</span>
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </summary>
    <div className="live-set-setup-body">
      {!smith && basisText && <p className="live-set-setup-basis">Load counted as: <b>{basisText}</b></p>}
      {lastSetup && <button type="button" className="live-set-setup-repeat" onClick={onRepeat}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Same as last time <small>{setupSummaryOf(catalogId, lastSetup)}</small>
      </button>}
      {fields.map((field) => {
        const spec = setupFieldSpecs[field];
        if (spec.kind === "load") {
          return <div key={field} className="live-set-setup-choice" role="group" aria-label={`${spec.label} on ${exerciseName}`}>
            <span aria-hidden="true">{spec.label}</span>
            {SMITH_BASES.map((option) => <button key={option} type="button" aria-pressed={basis === option} onClick={() => onChange(field, option)}>{smithLoadBasisWords[option]}</button>)}
            <small>The app never adds a bar weight for you.</small>
          </div>;
        }
        const id = `${ids}-${field}`;
        return <label key={field} htmlFor={id} className="live-set-setup-field">
          <span>{spec.label}</span>
          <input id={id} type="text" autoComplete="off" inputMode={spec.kind === "number" ? "decimal" : "text"} value={setup?.[field] ?? ""} placeholder="—" maxLength={80}
            onChange={(event) => onChange(field, event.target.value)} />
          {spec.unit && <em>{spec.unit}</em>}
        </label>;
      })}
    </div>
  </details>;
}
