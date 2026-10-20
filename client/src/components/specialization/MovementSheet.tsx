import { ArrowRight, ChevronDown } from "lucide-react";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { SpecializationRegionData, SpecializationSummary, SummaryMode, SummarySide } from "@shared/specialization/types";
import { ActionGlyph } from "./ActionGlyph";
import { BoutItem } from "./BoutItem";
import { categoryLabel, goalMetricLabels, holdTime, ledgerByExercise, movementLedger, otherWorkWords } from "./model";
import { rowSideTextFor, sideWordsFor } from "./sideWords";
import { SpecializationSheet } from "./SpecializationSheet";
import { Suggestions, type SuggestionsProps } from "./Suggestions";
import { WhyThisCounts } from "./WhyThisCounts";

/**
 * One movement (brief §7, "Targets attach to muscle or action"): what it is and which of the
 * region's muscles do it; its numbers for the window and arm, counted as a movement target
 * counts them; the bouts behind those numbers, exercise → bout → segment, each logged one
 * with "Open this workout" and each exercise with "Why this counts"; its targets; and
 * exercises for it (`recommendFor({ actionId })`) with Add or swap. A movement target's
 * "3 of your 10" opens here, so the number always leads to the sets that made it.
 */
export function MovementSheet({ data, actionId, summary, loading, side, mode, intervalLabel, weightUnit, onOpenSession, onOpenMuscle, onOpenMethod, onClose, ...suggestions }: {
  data: SpecializationRegionData;
  actionId: string;
  /** The summary on screen for this side; null while it is worked out or the plan loads. */
  summary: SpecializationSummary | null;
  /** Planned mode while the plan is still loading: no numbers yet, and none shown as zero. */
  loading: boolean;
  side: SummarySide;
  mode: SummaryMode;
  intervalLabel: string;
  weightUnit: DisplayWeightUnit;
  onOpenSession: (sessionId: string) => void;
  onOpenMuscle: (nodeId: string) => void;
  onOpenMethod: () => void;
  onClose: () => void;
} & SuggestionsProps) {
  const action = data.actions.find((item) => item.id === actionId);
  const name = action?.label ?? actionId;
  const words = sideWordsFor(data.region);
  const sideText = rowSideTextFor(data);
  const onSide = side === "midline" ? null : words.of(side);
  const regionNodeIds = new Set(data.nodes.filter((node) => node.regionId === data.region.id).map((node) => node.id));
  const doers = data.nodeActions
    .filter((item) => item.actionId === actionId && regionNodeIds.has(item.nodeId))
    .sort((left, right) => (left.role === right.role ? 0 : left.role === "prime" ? -1 : 1))
    .map((item) => ({ role: item.role, node: data.nodes.find((node) => node.id === item.nodeId) }))
    .filter((item): item is { role: "prime" | "assist"; node: NonNullable<typeof item.node> } => Boolean(item.node));
  const shortName = (id: string) => data.nodes.find((node) => node.id === id)?.shortName ?? id;
  const ledger = summary ? movementLedger(summary, data, actionId) : null;
  const groups = ledger ? ledgerByExercise(ledger.bouts) : [];
  const progress = summary ? summary.goals.filter((item) => item.goal.actionId === actionId && item.goal.side === side) : [];
  const waiting = loading ? "Loading your plan…" : "Working out the totals…";

  return <SpecializationSheet
    id="spz-movement"
    focusKey={actionId}
    eyebrow={onSide ? `Movement · ${onSide}` : "Movement"}
    title={name}
    subtitle={action ? <p>{action.plainDescription}</p> : undefined}
    onClose={onClose}
  >
    <section className="spz-sheet-section" aria-labelledby="spz-move-who">
      <h3 id="spz-move-who">Muscles that do it</h3>
      {doers.length ? <ul className="spz-actions-list">
        {doers.map((item) => <li key={item.node.id}>
          <ActionGlyph actionId={actionId} />
          <span><b>{item.node.name}</b><small>{item.role === "prime" ? "A main action of this muscle" : "This muscle helps"}</small></span>
          <button type="button" className="spz-link spz-link-box" onClick={() => onOpenMuscle(item.node.id)} aria-label={`Open ${item.node.name}`}>Open</button>
        </li>)}
      </ul> : <p className="spz-note">No reviewed statement names a muscle of this region for it yet.</p>}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-move-numbers">
      <h3 id="spz-move-numbers">{[mode === "planned" ? "Planned" : "Completed", intervalLabel, onSide].filter(Boolean).join(" · ")}</h3>
      {!ledger ? <p className="spz-note">{waiting}</p> : <>
        <dl className="spz-numbers">
          <div><dt>Direct dynamic bouts</dt><dd>{ledger.totals.directDynamicBouts}</dd></div>
          <div><dt>Deliberate holds</dt><dd>{ledger.totals.deliberateHoldBouts}{ledger.totals.deliberateHoldBouts ? <small> · {holdTime(ledger.totals.deliberateHoldSeconds)}</small> : null}</dd></div>
          <div><dt>Other work for it</dt><dd>{ledger.totals.otherBouts}<small> · {otherWorkWords}</small></dd></div>
          {words.paired && ledger.totals.unknownSideBouts > 0 && <div><dt>{words.noneRecordedTitle}</dt><dd>{ledger.totals.unknownSideBouts}<small> · {words.neither}</small></dd></div>}
        </dl>
        {/* A plan has done nothing yet: its sets are planned for the movement, not sets muscles did. */}
        <p className="spz-note">{mode === "planned" ? "Each planned set counts once for the movement, however many muscles it is planned for." : "Each set counts once for the movement, however many muscles did it."}</p>
      </>}
      {progress.map((item) => <p key={item.goal.id} className="spz-note"><b>{goalMetricLabels[item.goal.metric]}: {item.label}</b>, {mode === "planned" ? intervalLabel : item.goal.period === "calendar_week" ? "this calendar week" : "the last 7 days"}. The target is yours, not a prescription.</p>)}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-move-ledger">
      <h3 id="spz-move-ledger">Where the numbers come from</h3>
      {!ledger ? <p className="spz-note">{waiting}</p> : groups.length ? <div className="spz-ledger">
        {groups.map((group) => <details key={group.key} className="spz-disclosure">
          <summary><span><b>{group.name}</b><small>{group.rows.length} bout{group.rows.length === 1 ? "" : "s"}{group.matchedBy === "name" ? " · matched by name" : ""}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
          <ol className="spz-bouts">
            {group.rows.map((row) => <BoutItem key={row.boutId} row={row} title={row.categories.map((category, index) => (index ? categoryLabel(category, data.region.wording).toLowerCase() : categoryLabel(category, data.region.wording))).join(" and ")} sideText={sideText} weightUnit={weightUnit} onOpenSession={onOpenSession}>
              <p className="spz-note">By {row.nodeIds.map(shortName).join(", ")}.{row.notes.length ? ` ${row.notes.join(" · ")}.` : ""}</p>
            </BoutItem>)}
          </ol>
          <WhyThisCounts data={data} mappingIds={group.rows.flatMap((row) => row.mappingIds)} />
          <button type="button" className="spz-link" onClick={() => suggestions.onInspectExercise(group.catalogExerciseId, group.name)}>About {group.name} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </details>)}
      </div> : <p className="spz-note">Nothing {mode === "planned" ? "planned" : "logged"} for it in this window.</p>}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-move-exercises">
      <h3 id="spz-move-exercises">Exercises for this movement</h3>
      <Suggestions {...suggestions} data={data} mode={mode} />
    </section>

    <section className="spz-sheet-section">
      <button type="button" className="spz-link" onClick={onOpenMethod}>How this is counted <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
    </section>
  </SpecializationSheet>;
}
