import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { StoreWrite } from "@/lib/specialization/stores";
import { claimKeyOf } from "@shared/specialization/compose";
import type { SpecializationGoal, SpecializationRegionData, SpecializationSummary, SummarySide } from "@shared/specialization/types";
import { selectableNodes } from "./model";
import { EndedTargets, READ_ONLY_TARGET_NOTE, TargetEditStatus, TargetForm, TargetRows, savedMessage, splitTargets, subjectKeyOf, useReturnFocus, useTargetEdits, type TargetSubject } from "./TargetsEditor";

/**
 * What a target can be for in a region (brief §7, "Targets attach to muscle or action"):
 * its target muscles, and the movements a reviewed node action of one of its own muscles
 * performs, so a movement target always has something the calculator can count. A node action's
 * claim is found by its key (`claimKey`), so a claim another region owns is never mistaken for one
 * with the same id here.
 */
export function targetSubjectsFor(data: SpecializationRegionData): { muscles: TargetSubject[]; movements: TargetSubject[] } {
  const regionId = data.region.id;
  const regionNodeIds = new Set(data.nodes.filter((node) => node.regionId === regionId).map((node) => node.id));
  const reviewedClaims = new Set(data.claims.filter((claim) => claim.reviewStatus === "reviewed").map(claimKeyOf));
  const usedActions = new Set(data.nodeActions.filter((row) => regionNodeIds.has(row.nodeId) && reviewedClaims.has(row.claimKey)).map((row) => row.actionId));
  return {
    muscles: selectableNodes(data)
      .filter((node) => node.regionId === regionId && node.role === "target" && node.status !== "rejected")
      .map((node) => ({ kind: "muscle", id: node.id, name: node.name })),
    movements: data.actions.filter((action) => usedActions.has(action.id)).map((action) => ({ kind: "movement", id: action.id, name: action.label })),
  };
}

export type TargetsOverviewProps = {
  data: SpecializationRegionData;
  /** The summary on screen (both sides as one); null while it is calculated (rows then show no progress). */
  summary: SpecializationSummary | null;
  /** The region's targets, whatever side an earlier version stored, ended ones included. */
  goals: readonly SpecializationGoal[];
  side: SummarySide;
  timeZone: string;
  /** Today's local date (YYYY-MM-DD). */
  todayKey: string;
  onSave: (goals: SpecializationGoal[]) => StoreWrite;
  /** Undo's write: the targets as they were before End or Remove (`useTargetEdits`). */
  onRestore?: (goals: SpecializationGoal[]) => StoreWrite;
  onRemove: (goalId: string) => StoreWrite;
  /** Opens the muscle's sheet. */
  onOpenMuscle: (nodeId: string) => void;
  /** Opens the movement's sheet: the sets behind its number, and exercises for it. */
  onOpenMovement?: (actionId: string) => void;
};

type Group = { key: string; subject: TargetSubject; goals: SpecializationGoal[] };

/**
 * The page's Targets disclosure: every target of the region, grouped by what it is for — a
 * muscle or a movement — with its progress ("8 of your 20"), Change / End / Remove in place, Open
 * for a muscle or a movement, and "Add a target" with the subject chosen here. Targets have no
 * side: both sides are counted as one (owner, 20 Oct 2026). Nothing is suggested or filled in: every target is one the athlete set. A
 * target saved earlier on a muscle that is not a target here can be ended or removed only.
 */
export function TargetsOverview({ data, summary, goals, side, timeZone, todayKey, onSave, onRestore, onRemove, onOpenMuscle, onOpenMovement }: TargetsOverviewProps) {
  const subjects = useMemo(() => targetSubjectsFor(data), [data]);
  const targetMuscles = useMemo(() => new Set(subjects.muscles.map((subject) => subject.id)), [subjects]);
  const readOnly = (goal: SpecializationGoal) => goal.nodeId !== null && !targetMuscles.has(goal.nodeId);
  const subjectGroups = useMemo(() => [
    { label: "Muscles", options: subjects.muscles },
    { label: "Movements", options: subjects.movements },
  ].filter((group) => group.options.length), [subjects]);

  const subjectOf = (goal: SpecializationGoal): TargetSubject => {
    if (goal.nodeId !== null) return { kind: "muscle", id: goal.nodeId, name: data.nodes.find((node) => node.id === goal.nodeId)?.name ?? goal.nodeId };
    const actionId = goal.actionId ?? "";
    return { kind: "movement", id: actionId, name: data.actions.find((action) => action.id === actionId)?.label ?? actionId };
  };
  const subjectName = (goal: SpecializationGoal) => subjectOf(goal).name;

  const [open, setOpen] = useState(false);
  const addRef = useReturnFocus(open);
  const edits = useTargetEdits({ onSave, onRestore, onRemove, todayKey, subjectName });

  const regionGoals = goals.filter((goal) => goal.regionId === data.region.id);
  const { active, ended } = splitTargets(regionGoals, todayKey);
  // Muscles first, then movements, each in the region's own order; anything unknown last.
  const order = new Map<string, number>([...subjects.muscles, ...subjects.movements].map((subject, index) => [`${subject.kind}:${subject.id}`, index]));
  const groups = Array.from(active.reduce((byKey, goal) => {
    const key = subjectKeyOf(goal);
    const group = byKey.get(key) ?? { key, subject: subjectOf(goal), goals: [] };
    group.goals.push(goal);
    return byKey.set(key, group);
  }, new Map<string, Group>()).values())
    .sort((a, b) => (order.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.key) ?? Number.MAX_SAFE_INTEGER) || a.subject.name.localeCompare(b.subject.name));
  // Only a summary of the page's side (`both`, or `midline`) speaks for these targets.
  const summaryHere = summary && summary.side === side ? summary : null;
  const progress = summaryHere ? summaryHere.goals : [];
  // A muscle with no reviewed mapping: nothing can be counted for its targets, so none reads as a zero.
  const uncounted = (goal: SpecializationGoal) => {
    const exposure = goal.nodeId ? summaryHere?.nodes.find((node) => node.nodeId === goal.nodeId) : undefined;
    return exposure !== undefined && exposure.mappingCoverage !== "reviewed";
  };

  return <div className="spz-tg-overview">
    {groups.length ? <ul className="spz-tg-groups">
      {groups.map((group) => <li key={group.key} className="spz-tg-group" data-kind={group.subject.kind}>
        <div className="spz-tg-group-head">
          <span><b>{group.subject.name}</b><small>{group.subject.kind === "muscle" ? "Muscle" : "Movement"}</small></span>
          {group.subject.kind === "muscle" && <button type="button" className="spz-button" onClick={() => onOpenMuscle(group.subject.id)} aria-label={`Open ${group.subject.name}`}>Open</button>}
          {group.subject.kind === "movement" && onOpenMovement && <button type="button" className="spz-button" onClick={() => onOpenMovement(group.subject.id)} aria-label={`Open ${group.subject.name}`}>Open</button>}
        </div>
        {group.goals.some(readOnly) && <p className="spz-note">{READ_ONLY_TARGET_NOTE}</p>}
        <TargetRows goals={group.goals} side={side} progress={progress} edits={edits} subjectName={subjectName} readOnly={readOnly} uncounted={uncounted} todayKey={todayKey} progressReady={summaryHere !== null} />
      </li>)}
    </ul> : <p className="spz-note">No targets yet.</p>}
    <TargetEditStatus edits={edits} />
    {open
      ? <TargetForm region={data.region} timeZone={timeZone} todayKey={todayKey} subjectGroups={subjectGroups} onSave={onSave}
        onSaved={(_saved, subject) => { edits.settle(savedMessage(subject.name)); setOpen(false); }}
        onCancel={() => setOpen(false)} />
      : <button ref={addRef} type="button" className="spz-link" onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add a target</button>}
    <EndedTargets goals={ended} subjectName={subjectName} showSubject />
  </div>;
}
