import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { StoreWrite } from "@/lib/specialization/stores";
import type { ArmSide, SpecializationGoal, SpecializationRegionData, SpecializationSummary, SummarySide } from "@shared/specialization/types";
import { EndedTargets, TargetEditStatus, TargetForm, TargetRows, splitTargets, subjectKeyOf, useReturnFocus, useTargetEdits, type TargetSubject } from "./TargetsEditor";

/**
 * What a target can be for in a region (brief §7, "Targets attach to muscle or action"):
 * its target muscles, and the movements a reviewed node action of one of its own muscles
 * performs, so a movement target always has something the calculator can count.
 */
export function targetSubjectsFor(data: SpecializationRegionData): { muscles: TargetSubject[]; movements: TargetSubject[] } {
  const regionId = data.region.id;
  const regionNodeIds = new Set(data.nodes.filter((node) => node.regionId === regionId).map((node) => node.id));
  const reviewedClaims = new Set(data.claims.filter((claim) => claim.reviewStatus === "reviewed").map((claim) => claim.id));
  const usedActions = new Set(data.nodeActions.filter((row) => regionNodeIds.has(row.nodeId) && reviewedClaims.has(row.claimId)).map((row) => row.actionId));
  return {
    muscles: data.nodes
      .filter((node) => node.regionId === regionId && node.role === "target" && (node.kind === "muscle" || node.kind === "head") && node.status !== "rejected")
      .map((node) => ({ kind: "muscle", id: node.id, name: node.name })),
    movements: data.actions.filter((action) => usedActions.has(action.id)).map((action) => ({ kind: "movement", id: action.id, name: action.label })),
  };
}

export type TargetsOverviewProps = {
  data: SpecializationRegionData;
  /** The summary for the arm on screen; null while it is calculated (rows then show no progress). */
  summary: SpecializationSummary | null;
  /** The region's targets, both arms, ended ones included. */
  goals: readonly SpecializationGoal[];
  side: SummarySide;
  timeZone: string;
  /** Today's local date (YYYY-MM-DD). */
  todayKey: string;
  onSave: (goals: SpecializationGoal[]) => StoreWrite;
  onRemove: (goalId: string) => StoreWrite;
  /** Opens the muscle's sheet. */
  onOpenMuscle: (nodeId: string) => void;
  /** Opens the movement's sheet: the sets behind its number, and exercises for it. */
  onOpenMovement?: (actionId: string) => void;
};

type Group = { key: string; subject: TargetSubject; goals: SpecializationGoal[] };

/**
 * The page's Targets disclosure: every target of the region, grouped by what it is for — a
 * muscle or a movement — with this arm's progress ("8 of your 20") or "Not targeted on the
 * right arm", Change / End / Remove in place, Open for a muscle or a movement, and "Add a target" with the
 * subject chosen here. Nothing is suggested or filled in: every target is one the athlete set.
 */
export function TargetsOverview({ data, summary, goals, side, timeZone, todayKey, onSave, onRemove, onOpenMuscle, onOpenMovement }: TargetsOverviewProps) {
  const subjects = useMemo(() => targetSubjectsFor(data), [data]);
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
  const edits = useTargetEdits({ onSave, onRemove, todayKey, subjectName });

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
  // Only a summary of this arm speaks for this arm.
  const summaryHere = summary && summary.side === side ? summary : null;
  const oneArm = side !== "both";
  const progress = summaryHere ? summaryHere.goals : [];

  return <div className="spz-tg-overview">
    {groups.length ? <ul className="spz-tg-groups">
      {groups.map((group) => <li key={group.key} className="spz-tg-group" data-kind={group.subject.kind}>
        <div className="spz-tg-group-head">
          <span><b>{group.subject.name}</b><small>{group.subject.kind === "muscle" ? "Muscle" : "Movement"}</small></span>
          {group.subject.kind === "muscle" && <button type="button" className="spz-button" onClick={() => onOpenMuscle(group.subject.id)} aria-label={`Open ${group.subject.name}`}>Open</button>}
          {group.subject.kind === "movement" && onOpenMovement && <button type="button" className="spz-button" onClick={() => onOpenMovement(group.subject.id)} aria-label={`Open ${group.subject.name}`}>Open</button>}
        </div>
        {oneArm && !group.goals.some((goal) => goal.side === side) && <p className="spz-note"><b>Not targeted on the {side} arm.</b></p>}
        <TargetRows goals={group.goals} side={side} progress={progress} edits={edits} subjectName={subjectName} todayKey={todayKey} progressReady={summaryHere !== null} />
      </li>)}
    </ul> : <p className="spz-note"><b>No targets.</b> A muscle or movement without a target is not behind on anything.</p>}
    <TargetEditStatus edits={edits} />
    {open
      ? <TargetForm regionId={data.region.id} side={side} timeZone={timeZone} todayKey={todayKey} subjectGroups={subjectGroups} onSave={onSave}
        onSaved={(saved, subject) => { edits.settle(!oneArm ? `Saved: a target for ${subject.name}.` : saved.length === 2 ? `Saved: one target per arm for ${subject.name}.` : `Saved: a ${saved[0].side}-arm target for ${subject.name}.`); setOpen(false); }}
        onCancel={() => setOpen(false)} />
      : <button ref={addRef} type="button" className="spz-link" onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />Add a target</button>}
    <EndedTargets goals={ended} subjectName={subjectName} showSubject />
  </div>;
}
