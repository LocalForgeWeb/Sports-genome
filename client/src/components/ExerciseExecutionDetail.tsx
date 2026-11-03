/**
 * How an exercise is done and logged, for a row with an execution record (exerciseExecution.ts:
 * the Zercher, neck and bench rows of 2 Nov 2026). It opens the exercise's first view, in the
 * handoff's order: what sets it apart and what it needs, what it looks like (or the deliberate
 * fallback), the three steps, how one set is logged, what each muscle does, and how it is mapped.
 *
 * Caveats sit with the field they qualify - "force not measured" with the load, "not counted" with
 * the roles - rather than in a block of warnings. Nothing here is a number the app has not got: no
 * percentage, no grade turned into a measurement.
 */
import type { ReactNode } from "react";
import { muscleLabels } from "@/components/AnatomyMap";
import type { Exercise } from "@/lib/exerciseCatalog";
import { catalogSublabelOf, requiredAccessoryLabels, sourceKindLabel, type ExerciseExecution, type ExerciseRole, type LoadConvention, type SetupField } from "@/lib/exerciseExecution";
import { headDirectionPrompt, MANUAL_RESISTANCE_LINE, setupFieldSpecs } from "@/lib/exerciseLogging";

/**
 * What one logged number of load means, per convention, opening with the load box's own label in the
 * logger (setEntryFields.ts), so the detail and the logger name the number the same way.
 */
export const loadConventionWords: Record<LoadConvention, string> = {
  total_bar_mass: "Weight: the bar and its plates.",
  machine_display: "Machine load: the number on the stack or display.",
  plates_per_arm: "Plates per arm, entered arm by arm. The arms can differ.",
  smith_declared: "Plates only, or Plates + bar when you know the bar's weight: you choose in Setup. Nothing is added for the bar.",
  suspended_external_mass: "Harness load: the plates hanging from the harness.",
  manual_unmeasured: `${MANUAL_RESISTANCE_LINE}. No load is logged.`,
};

/** A setup value in the logger's own words ("Start height (cm)"). */
const setupFieldWords = (field: SetupField) => `${setupFieldSpecs[field].label}${setupFieldSpecs[field].unit ? ` (${setupFieldSpecs[field].unit})` : ""}`;

/** A neck direction group in words; the side a muscle works on is the head's direction, never an arm. */
const neckGroupWords: Record<string, string> = {
  "neck.flexors": "Neck flexors, at the front of the neck",
  "neck.extensors": "Neck extensors, at the back of the neck",
  "neck.lateral_flexors": "Neck side-benders, on the side the head bends toward",
  "neck.rotators": "Neck rotators, on both sides together",
};

const targetWords = (target: string) => neckGroupWords[target] ?? muscleLabels[target] ?? target;

/** The roles in three plain groups: what moves the load (or is held, on a timed hold), what helps, what holds still. */
export function roleGroups(execution: Pick<ExerciseExecution, "roles" | "measure">): { label: string; muscles: string[]; note?: string }[] {
  const of = (match: (role: ExerciseRole) => boolean) => execution.roles.filter(match).map((role) => targetWords(role.target));
  const groups = [
    { label: "Moves the load", muscles: of((role) => role.relationship === "direct" && role.mode === "dynamic") },
    { label: "Holds the position, for time", muscles: of((role) => role.relationship === "direct" && role.mode === "isometric") },
    { label: "Helps", muscles: of((role) => role.relationship === "contributing") },
    { label: "Holds still while others move the load", muscles: of((role) => role.relationship === "stabilizer"), note: execution.measure === "seconds" ? "Held still for the time logged, never counted as reps or grip." : "Steadying only, never counted as sets for these muscles." },
  ];
  return groups.filter((group) => group.muscles.length > 0);
}

/** How one set of this exercise is logged, line by line. */
export function loggingLines(exercise: Pick<Exercise, "id" | "name">, execution: ExerciseExecution): { term: string; detail: string }[] {
  const lines = [
    { term: "Each set", detail: execution.measure === "seconds" ? "Seconds held." : "Reps." },
    { term: "Load", detail: loadConventionWords[execution.load] },
  ];
  // The logger's own label for the choice: "Head direction", or "Push / turn toward" on a hold.
  if (execution.headDirection) lines.push({ term: headDirectionPrompt(exercise.id) ?? "Head direction", detail: "Left or Right, on every set. Each side is its own set." });
  if (execution.setupFields.length) lines.push({ term: "Setup", detail: `${execution.setupFields.map(setupFieldWords).join(" · ")}. A different setup is compared apart.` });
  return lines;
}

export function ExerciseExecutionDetail({ exercise, execution, media }: { exercise: Exercise; execution: ExerciseExecution; media?: ReactNode }) {
  const sublabel = catalogSublabelOf(exercise.id);
  const needs = execution.requires.map((accessory) => requiredAccessoryLabels[accessory]);
  return <>
    <section className="ei-section ei-execution-setup" aria-labelledby="ei-setup-title">
      <h2 id="ei-setup-title" className="ei-section-title">Setup</h2>
      <dl className="ei-facts">
        <div><dt>Equipment</dt><dd>{[exercise.equipment, ...needs].join(" · ")}{sublabel ? ` — ${sublabel}` : ""}</dd></div>
        {needs.length > 0 && <div><dt>Needs</dt><dd>{needs.join(" and ")}. {exercise.equipment === "Cable" ? "A cable station alone is not enough." : exercise.equipment === "Machine" ? "Not every gym's machines include one." : ""}</dd></div>}
      </dl>
      <p className="ei-section-note">{execution.distinction}</p>
    </section>
    {/* The photograph where one shows exactly this setup; otherwise the app's own placeholder frame, never a cousin's photo. */}
    {media && <div className="ei-media">{media}</div>}
    <section className="ei-section" aria-labelledby="ei-steps-title">
      <h2 id="ei-steps-title" className="ei-section-title">How to do it</h2>
      <ol className="ei-steps">{execution.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    </section>
    <section className="ei-section" aria-labelledby="ei-logging-title">
      <h2 id="ei-logging-title" className="ei-section-title">How a set is logged</h2>
      <dl className="ei-facts">{loggingLines(exercise, execution).map((line) => <div key={line.term}><dt>{line.term}</dt><dd>{line.detail}</dd></div>)}</dl>
    </section>
    <section className="ei-section" aria-labelledby="ei-roles-title">
      <h2 id="ei-roles-title" className="ei-section-title">What the muscles do</h2>
      <dl className="ei-facts">{roleGroups(execution).map((group) => <div key={group.label}><dt>{group.label}</dt><dd>{group.muscles.join(" · ")}{group.note ? <span className="ei-role-note"> {group.note}</span> : null}</dd></div>)}</dl>
      <p className="ei-section-note">From anatomy and coaching sources, not measured.</p>
    </section>
    <section className="ei-section" aria-labelledby="ei-mapped-title">
      <h2 id="ei-mapped-title" className="ei-section-title">How this is mapped</h2>
      <p className="ei-section-note">Its grades are provisional, not measured: no rank, percentile or estimated 1RM, and the app never adds it to a plan by itself.</p>
      <ul className="ei-sources">{execution.sources.map((source) => <li key={source.id}><span className="ei-source-kind">{sourceKindLabel(source)}</span><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><small className="ei-source-use">{source.supports}</small></li>)}</ul>
    </section>
  </>;
}
