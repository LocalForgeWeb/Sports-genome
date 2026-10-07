import { Calculator, SlidersHorizontal } from "lucide-react";
import "../utility-tools.css";
import { useUtilityRecord } from "@/lib/utilityStore";
import { openUtility, usesBarbellPlates } from "@/lib/utilityTools";
import { SETUP_STORE, emptySetupStore, isSetupStore, selectedSetup, settingsLine, setupsFor, type SetupStore } from "@/lib/setupNotebook";

/**
 * The exercise record's one line for the athlete's own things, kept apart from the catalog's
 * content above it: the setup they chose (or that none is chosen), My setup to open the
 * notebook, and - for an exercise loaded with plates on a bar - Load the bar.
 */
export function ExerciseYoursRow({ catalogExerciseId, exerciseName, equipment }: { catalogExerciseId: number; exerciseName: string; equipment?: string }) {
  const [store] = useUtilityRecord<SetupStore>(SETUP_STORE, emptySetupStore, isSetupStore);
  const chosen = selectedSetup(store, catalogExerciseId);
  const count = setupsFor(store, catalogExerciseId).length;
  const summary = chosen
    ? <><b>{chosen.label}</b>{chosen.settings.length ? <span> · {settingsLine(chosen)}</span> : null}</>
    : count ? <span>{count} setup{count === 1 ? "" : "s"} saved · none chosen</span> : <span>Nothing saved yet</span>;
  return <section className="ei-yours" aria-labelledby="ei-yours-title">
    <h2 id="ei-yours-title" className="ei-section-title">Yours</h2>
    <div className="ei-yours-row">
      <p className="ei-yours-setup"><span className="ei-yours-label">My setup</span>{summary}</p>
      <div className="ei-yours-actions">
        <button type="button" className="ei-yours-button" onClick={() => openUtility({ tool: "setup", catalogExerciseId, exerciseName })}><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{chosen ? "Change setup" : "My setup"}</button>
        {usesBarbellPlates(equipment, exerciseName) && <button type="button" className="ei-yours-button" onClick={() => openUtility({ tool: "plates", exerciseName })}><Calculator className="h-4 w-4" aria-hidden="true" />Load the bar</button>}
      </div>
    </div>
  </section>;
}
