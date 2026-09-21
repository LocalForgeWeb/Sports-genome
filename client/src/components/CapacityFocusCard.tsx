import { HeartPulse, ShieldAlert, Target } from "lucide-react";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import {
  highConsequenceSignals,
  resolveConstraintPosture,
  type AthleteConstraintSelection,
  type AthleteFocusSelection,
  type ConstraintType,
  type HighConsequenceSignal,
  type Laterality,
  type ResilienceTargetCatalog,
} from "@shared/resilienceContext";

/**
 * Targeted capacity, editable after onboarding.
 *
 * The introduction asks this once, but a stiff shoulder or a knee that started complaining
 * arrives long after signup — so the same two questions live here permanently. They stay two
 * questions: what you want to build, and separately whether anything is going on there now.
 * Neither is inferred from the other, here or in the quiz.
 */

const constraintOptions: { value: ConstraintType; label: string }[] = [
  { value: "proactive_none", label: "Nothing right now" },
  { value: "symptomatic", label: "It bothers me at the moment" },
  { value: "recent_or_returning", label: "I am coming back from something there" },
  { value: "prior_recurrent", label: "It has been a recurring issue" },
  { value: "clinician_restricted", label: "A clinician has restricted what I do" },
];

const lateralityOptions: { value: Laterality; label: string }[] = [
  { value: "bilateral", label: "Both sides" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "unspecified", label: "Not sure" },
];

export type CapacityFocusState = {
  focus?: AthleteFocusSelection;
  constraint?: AthleteConstraintSelection;
  reportedSignals: HighConsequenceSignal[];
};

export function CapacityFocusCard({ catalog, value, onChange }: {
  catalog?: ResilienceTargetCatalog;
  value: CapacityFocusState;
  onChange: (next: CapacityFocusState) => void;
}) {
  const targets = catalog?.status === "connected" ? catalog.targets : [];
  const targetKey = value.focus?.targetKey || "";
  const selectedTarget = targets.find(target => target.targetKey === targetKey);
  const constraintType = value.constraint?.constraintType || "proactive_none";
  const laterality = value.focus?.laterality || "bilateral";
  const reportedSignals = value.reportedSignals ?? [];
  const posture = resolveConstraintPosture(constraintType, reportedSignals);

  const chooseTarget = (nextKey: string) => {
    emitInteractionFeedback();
    // Clearing the target clears what was reported about it. Leaving a stale symptom attached
    // to a goal the athlete no longer has is how a plan keeps working around nothing.
    if (!nextKey) return onChange({ reportedSignals: [] });
    onChange({
      focus: { targetKey: nextKey, intent: "build_capacity", laterality },
      constraint: { targetKey: nextKey, constraintType, laterality },
      reportedSignals,
    });
  };

  const chooseLaterality = (next: Laterality) => {
    if (!value.focus) return;
    emitInteractionFeedback();
    onChange({
      focus: { ...value.focus, laterality: next },
      constraint: value.constraint ? { ...value.constraint, laterality: next } : undefined,
      reportedSignals,
    });
  };

  const chooseConstraint = (next: ConstraintType) => {
    if (!value.focus) return;
    emitInteractionFeedback();
    onChange({
      focus: value.focus,
      constraint: { targetKey: value.focus.targetKey, constraintType: next, laterality },
      // "Nothing right now" cannot coexist with a reported red flag.
      reportedSignals: next === "proactive_none" ? [] : reportedSignals,
    });
  };

  const toggleSignal = (signal: HighConsequenceSignal) => {
    emitInteractionFeedback();
    const nextSignals = reportedSignals.includes(signal)
      ? reportedSignals.filter(entry => entry !== signal)
      : [...reportedSignals, signal];
    onChange({ focus: value.focus, constraint: value.constraint, reportedSignals: nextSignals });
  };

  return <section className="about-me-capacity" aria-labelledby="capacity-focus-heading">
    <div className="about-me-capacity-head">
      <div>
        <p className="metric-label">Targeted capacity / editable</p>
        <h2 id="capacity-focus-heading">Something you want stronger</h2>
        <p>
          Pick an area or a task you want more tolerant, and say separately whether anything is
          going on there now. Choosing an area says nothing about injury, and nothing here is a
          diagnosis. <strong>The introduction asks this too — this is the same setting, and it is
          yours to change whenever something turns up.</strong>
        </p>
      </div>
      <Target className="h-6 w-6 text-[var(--sg-text-subtle-on-dark)]" />
    </div>

    {catalog?.status === "connected" && targets.length > 0 ? <>
      <div className="about-me-capacity-fields">
        <label>
          <span>What do you want to build up?</span>
          <select value={targetKey} onChange={event => chooseTarget(event.target.value)}>
            <option value="">Nothing selected</option>
            {targets.map(target => <option key={target.targetKey} value={target.targetKey}>{target.name}</option>)}
          </select>
        </label>
        {selectedTarget?.lateralitySupported && <label>
          <span>Which side?</span>
          <select value={laterality} onChange={event => chooseLaterality(event.target.value as Laterality)}>
            {lateralityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>}
        {/* The second question only exists once there is something to ask it about. */}
        {selectedTarget && <label>
          <span>Anything going on there right now?</span>
          <select value={constraintType} onChange={event => chooseConstraint(event.target.value as ConstraintType)}>
            {constraintOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>}
      </div>

      {selectedTarget && selectedTarget.supportedRoutes.length === 0 && <p className="about-me-capacity-insufficiency">
        No reviewed exercise routine covers {selectedTarget.name.toLowerCase()} yet. You can still keep it
        as a priority — the plan will say what is missing rather than guessing.
      </p>}

      {selectedTarget && constraintType !== "proactive_none" && <fieldset className="about-me-capacity-signals">
        <legend>Any of these? Tick what applies.</legend>
        {highConsequenceSignals.map(signal => <label key={signal.value} className="about-me-capacity-signal">
          <input
            type="checkbox"
            checked={reportedSignals.includes(signal.value)}
            onChange={() => toggleSignal(signal.value)}
          />
          <HeartPulse className="h-4 w-4" aria-hidden="true" />
          <span>{signal.label}</span>
        </label>)}
      </fieldset>}

      {posture === "withhold" && selectedTarget && <div className="about-me-capacity-escalation" role="status">
        <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        <div>
          <strong>Sports Genome will not build around this on its own.</strong>
          <p>
            From what you have told us, this is worth a look from a clinician who can examine you.
            Your plan stays available and fully editable, but nothing here will progress loading on
            that area by itself, and we are not telling you what the problem is.
          </p>
        </div>
      </div>}
    </> : <p className="about-me-capacity-unavailable">
      {catalog?.boundary || "Targeted areas are unavailable right now. Nothing else in your plan is affected."}
    </p>}
  </section>;
}
