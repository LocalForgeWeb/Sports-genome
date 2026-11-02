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

/** What one logged number of load means, per convention, in the words the logger uses. */
export const loadConventionWords: Record<LoadConvention, string> = {
  total_bar_mass: "The whole bar and its plates.",
  machine_display: "The number the stack or the display shows. It is not the force at your hands or head.",
  plates_per_arm: "The plates on each arm, entered arm by arm. Unequal arms stay unequal.",
  smith_declared: "Plates only, or the total with the bar's known resistance: you say which each time. A bar of unknown resistance stays unknown; nothing is added for it.",
  suspended_external_mass: "The plates hanging from the harness. Not comparable with a neck machine's stack number.",
  manual_unmeasured: "Manual resistance · force not measured. Your own hand pushes back, so no load is logged; add effort if you like.",
};

/** The set-up values the logger keeps with the exercise, in words. */
export const setupFieldWords: Record<SetupField, string> = {
  bar_type: "Bar type",
  start_height_cm: "Start height of the bar (cm)",
  rom_note: "Range of motion",
  setup_note: "Set-up note",
  machine_model: "Machine",
  seat_setting: "Seat setting",
  pad_setting: "Pad setting",
  attachment_setup: "Pulley and harness set-up",
  seat_or_bench_setting: "Seat or bench setting",
  load_convention: "How the load is counted",
  pause_seconds: "Pause (seconds)",
  hover_distance_cm: "Hover above the chest (cm)",
};

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
    { label: "Holds still while others move the load", muscles: of((role) => role.relationship === "stabilizer"), note: execution.measure === "seconds" ? "Held still for the time logged; never read as curls, reps or grip work." : "Steadying only: never counted as sets for these muscles." },
  ];
  return groups.filter((group) => group.muscles.length > 0);
}

/** How one set of this exercise is logged, line by line. */
export function loggingLines(exercise: Pick<Exercise, "name">, execution: ExerciseExecution): { term: string; detail: string }[] {
  const lines = [
    { term: "Each set", detail: execution.measure === "seconds" ? "Seconds held. Hold time is kept apart from reps everywhere." : "Repetitions." },
    { term: "Load", detail: loadConventionWords[execution.load] },
  ];
  if (execution.headDirection) {
    const isometric = execution.measure === "seconds";
    lines.push({ term: isometric ? "Push or turn toward" : "Head direction", detail: `Left / Right per set. It is the head's direction, not an arm; each side is its own set.` });
  }
  if (execution.setupFields.length) lines.push({ term: "Set-up recorded", detail: `${execution.setupFields.map((field) => setupFieldWords[field]).join(" · ")}. A different set-up is a different comparison.` });
  return lines;
}

export function ExerciseExecutionDetail({ exercise, execution, media }: { exercise: Exercise; execution: ExerciseExecution; media?: ReactNode }) {
  const sublabel = catalogSublabelOf(exercise.id);
  const needs = execution.requires.map((accessory) => requiredAccessoryLabels[accessory]);
  return <>
    <section className="ei-section ei-execution-setup" aria-labelledby="ei-setup-title">
      <h2 id="ei-setup-title" className="ei-section-title">Set-up</h2>
      <dl className="ei-facts">
        <div><dt>Equipment</dt><dd>{[exercise.equipment, ...needs].join(" · ")}{sublabel ? ` — ${sublabel}` : ""}</dd></div>
        {needs.length > 0 && <div><dt>Needs</dt><dd>{needs.join(" and ")}. {exercise.equipment === "Cable" ? "A cable station alone is not enough." : exercise.equipment === "Machine" ? "Not every gym's machines include one." : ""}</dd></div>}
      </dl>
      <p className="ei-section-note">{execution.distinction}</p>
    </section>
    {/* The photograph where one shows exactly this set-up; otherwise the app's own placeholder frame, never a cousin's photo. */}
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
      <p className="ei-section-note">Roles in words, not percentages: which muscles do what is from anatomy and coaching sources, not measured.</p>
    </section>
    <section className="ei-section" aria-labelledby="ei-mapped-title">
      <h2 id="ei-mapped-title" className="ei-section-title">How this is mapped</h2>
      <p className="ei-section-note">Its grades are provisional product judgements, not measured effects: it is not ranked, given a percentile or an estimated 1RM, and the app does not add it to plans on its own.</p>
      <ul className="ei-sources">{execution.sources.map((source) => <li key={source.id}><span className="ei-source-kind">{sourceKindLabel(source)}</span><a href={source.url} target="_blank" rel="noreferrer">{source.supports}</a></li>)}</ul>
    </section>
  </>;
}
