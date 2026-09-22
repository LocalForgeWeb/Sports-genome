import { ArrowUpRight, ShieldAlert, Target } from "lucide-react";
import {
  resolveConstraintPosture,
  type ConstraintType,
  type Laterality,
  type ResilienceTargetCatalog,
} from "@shared/resilienceContext";
import type { CapacityFocusState } from "@/components/CapacityFocusCard";

/**
 * What the athlete said they are working on, on the day they are building.
 *
 * The introduction and the profile both ask for a target and, separately, whether
 * anything is going on there now. Nothing then read the answer: `capacityFocus`
 * was written to local storage by two screens and consumed by none, so an athlete
 * who told Sports Genome about a shoulder never saw it mentioned again anywhere
 * near training. That is the whole reported defect - the setting exists, the
 * feature does not appear.
 *
 * This is the smallest honest fix: the declared target is stated on the Training
 * Day, with the posture its own constraint rules already resolve to, and a way
 * back to change it. It does not alter the plan, filter the catalog or rank an
 * exercise - the plan contract lives on the server and scoring anything here
 * would be the `single_contract_across_clients` violation the shared module
 * warns about. It says what is known, and where the boundary is.
 */

const lateralityCopy: Record<Laterality, string> = {
  bilateral: "both sides",
  left: "left side",
  right: "right side",
  unspecified: "side not specified",
};

/** The athlete's own words for what is going on there, echoed back, never restated as a finding. */
const constraintCopy: Record<ConstraintType, string> = {
  proactive_none: "Nothing reported going on there.",
  symptomatic: "You said it bothers you at the moment.",
  recent_or_returning: "You said you are coming back from something there.",
  prior_recurrent: "You said it has been a recurring issue.",
  clinician_restricted: "You said a clinician has restricted what you do.",
};

/** A stored key with no catalog to name it is still better read as words than as a key. */
function readableTarget(targetKey: string): string {
  const words = targetKey.replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "Your target";
}

export function DayCapacityNote({ capacity, catalog, onOpenProfile }: {
  capacity: CapacityFocusState;
  catalog?: ResilienceTargetCatalog;
  onOpenProfile: () => void;
}) {
  const focus = capacity.focus;

  // Nothing declared. One quiet line, because a feature nobody can find is the
  // same as a feature that is not there - and a day screen is where the thought
  // "my shoulder" actually occurs.
  if (!focus) {
    return <aside className="day-capacity-note day-capacity-note-empty">
      <Target className="h-4 w-4" aria-hidden="true" />
      <p>Working around something, or building one area up? <button type="button" onClick={onOpenProfile}>Name it in your profile <ArrowUpRight className="h-3.5 w-3.5" /></button></p>
    </aside>;
  }

  const entry = catalog?.status === "connected"
    ? catalog.targets.find((target) => target.targetKey === focus.targetKey)
    : undefined;
  const name = entry?.name || readableTarget(focus.targetKey);
  const constraintType: ConstraintType = capacity.constraint?.constraintType || "proactive_none";
  const posture = resolveConstraintPosture(constraintType, capacity.reportedSignals ?? []);
  const side = entry?.lateralitySupported === false ? null : lateralityCopy[focus.laterality];

  return <aside className={`day-capacity-note day-capacity-note-${posture === "withhold" ? "withhold" : posture === "qualified_action" ? "qualified" : "ordinary"}`}>
    {posture === "withhold"
      ? <ShieldAlert className="h-4 w-4" aria-hidden="true" />
      : <Target className="h-4 w-4" aria-hidden="true" />}
    <div>
      <p className="day-capacity-note-head">
        <strong>{name}</strong>{side ? <small>{side}</small> : null}
      </p>
      <p className="day-capacity-note-state">{constraintCopy[constraintType]}</p>
      <p className="day-capacity-note-posture">
        {posture === "withhold"
          ? "Sports Genome will not progress loading on that area by itself. This day stays yours to build and edit, and nothing here is telling you what the problem is."
          : posture === "qualified_action"
            ? "This day is not adjusted for it automatically. Keep the loading on that area deliberate, and drop anything that provokes it."
            : "No constraint reported, so this day is planned the ordinary way."}
      </p>
      <button type="button" onClick={onOpenProfile}>Change this <ArrowUpRight className="h-3.5 w-3.5" /></button>
      {catalog?.status === "unavailable" && <p className="day-capacity-note-offline">The target list is offline right now, so this is what was saved on this device. Everything else on this day is unaffected.</p>}
    </div>
  </aside>;
}
