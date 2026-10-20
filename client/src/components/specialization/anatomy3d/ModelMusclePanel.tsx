import type { ReactNode } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { GoalMetric, GoalPeriod } from "@shared/specialization/types";
import { formatSeconds, goalMetricLabels } from "../model";
import type { ViewerMuscleData, ViewerTarget } from "./viewerData";

/**
 * Under the 3D model (SG-FOREARM-INTEGRATION-20261019 §6, items 5–7): the selected muscle's
 * function, its direct dynamic work and the athlete's own target when one applies; then the
 * other kinds of work, each apart with its unit; then the exercises behind the numbers; then
 * what the numbers mean and where the model comes from, folded away.
 *
 * Every state is said in words: loading, the totals failing, a muscle with no mapping
 * (missing, not zero), partial counts, and zero. A number the data does not have shows as
 * "—" beside that reason, never as 0.
 */

const periodWords: Record<GoalPeriod, string> = { calendar_week: "per calendar week", rolling_7d: "per rolling 7 days" };

const unknown = "—";

function TargetLine({ target }: { target: ViewerTarget }) {
  return <p className="sg-anatomy3d-target">{target.label} {target.metric === "direct_dynamic_bouts" ? "direct dynamic bouts" : target.metric === "deliberate_hold_bouts" ? "hold bouts" : "seconds of holds"} {periodWords[target.period]}</p>;
}

export function ModelMusclePanel({ data, mode, windowLabel, regionLine, onViewContributions, onAddExercise, onViewExercise, onOpenMethod, onSeeRegionSets, credits }: {
  /** The selected muscle; null for the whole forearm (Overview). */
  data: ViewerMuscleData | null;
  mode: "planned" | "completed";
  windowLabel: string;
  /** With nothing selected: the region's distinct bouts on this arm, the page's own line. */
  regionLine: string;
  onViewContributions: () => void;
  onAddExercise: () => void;
  onViewExercise: (catalogExerciseId: number | null, name: string) => void;
  onOpenMethod: () => void;
  /** Opens the region's sets, when there are any. */
  onSeeRegionSets: (() => void) | null;
  credits: ReactNode;
}) {
  if (!data) {
    return <section className="sg-anatomy3d-detail" aria-label="The whole forearm">
      <p className="sg-anatomy3d-status">{regionLine} Tap a muscle on the model, or use Choose muscle, for its numbers.</p>
      {onSeeRegionSets && <div className="spz-actions"><button type="button" className="spz-link" onClick={onSeeRegionSets}>See these sets <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>}
      <ModelCredits>{credits}</ModelCredits>
    </section>;
  }
  if (data.dataStatus === "unavailable") {
    return <section className="sg-anatomy3d-detail" aria-label="Muscle not found">
      <p className="sg-anatomy3d-status" data-status="unavailable">{data.dataNote}</p>
    </section>;
  }
  const numbersKnown = data.directDynamicSets !== null;
  const direct = data.directDynamicSets;
  const hold = data.deliberateIsometricBouts;
  const planned = mode === "planned";
  const otherTargets = data.targets.filter((target) => target !== data.targetSets);
  const metricShort: Record<GoalMetric, string> = goalMetricLabels;
  return <section className="sg-anatomy3d-detail" aria-labelledby="sg-anatomy3d-name">
    <div className="sg-anatomy3d-head">
      <h3 id="sg-anatomy3d-name">{data.displayName}</h3>
      <span className="spz-badge">{data.shortName}</span>
      <span className="spz-badge">{data.layerLabel}</span>
      {!data.inModel && <span className="spz-badge">Not in the 3D model</span>}
    </div>
    <p className="sg-anatomy3d-function">{data.physicalFunction.text}{!data.physicalFunction.reviewed && <small> · not reviewed yet</small>}</p>

    <div className="sg-anatomy3d-lead">
      <p className="sg-anatomy3d-lead-number"><b>{direct ? direct.bouts : unknown}</b><span>direct dynamic bout{direct?.bouts === 1 ? "" : "s"}{direct && direct.reps > 0 ? ` · ${direct.reps} reps` : ""}</span></p>
      <p className="sg-anatomy3d-small">{planned ? "Planned" : "Completed"} · {windowLabel} · both arms</p>
      {data.targetSets && <>
        <TargetLine target={data.targetSets} />
        <span className="sg-anatomy3d-meter" role="img" aria-label={`${Math.round(Math.min(data.targetSets.fraction, 9.99) * 100)}% of your target`}><i style={{ width: `${Math.min(100, data.targetSets.fraction * 100)}%` }} /></span>
      </>}
    </div>
    {data.dataNote && <p className="sg-anatomy3d-status" data-status={data.dataStatus}>{data.dataNote}</p>}

    {numbersKnown && <dl className="sg-anatomy3d-metrics" aria-label="Other work, counted apart">
      <div><dt>Supporting dynamic work<small>Other dynamic bouts, where this muscle helps</small></dt><dd>{data.supportingExerciseExposure?.value ?? unknown} <small>bouts</small></dd></div>
      <div><dt>Deliberate holds<small>Isometric bouts, kept in seconds, never sets</small></dt><dd>{hold ?? unknown} <small>bouts{hold ? ` · ${data.isometricHoldSeconds === null ? "time not recorded" : formatSeconds(data.isometricHoldSeconds)}` : ""}</small></dd></div>
      <div><dt>Incidental grip or steadying<small>Not direct sets</small></dt><dd>{data.incidentalGripExposure?.value ?? unknown} <small>bouts</small></dd></div>
      {(data.otherBouts ?? 0) > 0 && <div><dt>Mixed or unclassified<small>Counted once each</small></dt><dd>{data.otherBouts} <small>bouts</small></dd></div>}
    </dl>}

    {otherTargets.length > 0 && <div className="sg-anatomy3d-targets">
      <h4 className="sg-anatomy3d-section-title">Your targets</h4>
      {otherTargets.map((target) => <p key={`${target.metric}-${target.period}`} className="sg-anatomy3d-status">
        {metricShort[target.metric]}: {target.label} {periodWords[target.period]}{target.matchesWindow ? "" : ", over the target's own period (not this window)"}.
      </p>)}
    </div>}

    {numbersKnown && <div>
      <h4 className="sg-anatomy3d-section-title">{planned ? "Planned exercises" : "Contributing exercises"}</h4>
      {data.exercises.length ? <ul className="sg-anatomy3d-exercises">
        {data.exercises.map((exercise) => <li key={exercise.key}>
          <span><b>{exercise.name}</b><small>{exercise.breakdown}{exercise.matchedBy === "name" ? " · matched by name" : ""}</small></span>
          {exercise.catalogExerciseId !== null && <button type="button" className="spz-link spz-link-box" onClick={() => onViewExercise(exercise.catalogExerciseId, exercise.name)} aria-label={`View ${exercise.name}`}>View</button>}
        </li>)}
      </ul> : <p className="sg-anatomy3d-status">None {planned ? "planned" : "logged"} in this window.</p>}
    </div>}

    <div className="spz-actions">
      {data.dataStatus !== "loading" && data.dataStatus !== "error" && <button type="button" className="spz-button" onClick={onViewContributions}>{data.exercises.length ? "View contributions" : "Muscle details"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
      {data.dataStatus !== "loading" && data.dataStatus !== "error" && <button type="button" className="spz-primary" onClick={onAddExercise}>Add exercise <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
    </div>

    <details className="spz-disclosure">
      <summary><span><b>How it contributes to shape</b><small>{data.visibleShapeContribution.reviewed ? "Reviewed" : "Not reviewed yet"} · qualified, not a forecast</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
      <p className="sg-anatomy3d-function">{data.visibleShapeContribution.text}</p>
      {data.visibleShapeContribution.caveats.length > 0 && <ul className="spz-caveats">{data.visibleShapeContribution.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul>}
    </details>
    <details className="spz-disclosure">
      <summary><span><b>What these numbers mean</b><small>One bout per set, per muscle, per arm</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
      <div className="sg-anatomy3d-credits">
        <p>A direct dynamic bout is a set in which this muscle is a main mover; a drop set counts once. Supporting work, deliberate holds and incidental grip are counted apart and never added to it. Both arms count together: a set counts once, whichever arm or arms did it.</p>
        <p>The numbers are the same ones the list and the muscle's sheet show, from your {planned ? "plan as written" : "logged workouts"}.</p>
        <button type="button" className="spz-link" onClick={onOpenMethod}>How this is counted <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </details>
    <ModelCredits>{credits}</ModelCredits>
  </section>;
}

function ModelCredits({ children }: { children: ReactNode }) {
  return <details className="spz-disclosure">
    <summary><span><b>About the 3D model</b><small>Sources and licences</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
    <div className="sg-anatomy3d-credits">{children}</div>
  </details>;
}
