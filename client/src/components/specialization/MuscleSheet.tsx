import { ArrowRight, ChevronDown, Plus } from "lucide-react";
import type { Recommendations } from "@/lib/specialization/recommendations";
import type { StoreWrite } from "@/lib/specialization/stores";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { AnatomyNode, ArmSide, GoalProgress, NodeExposure, SpecializationGoal, SpecializationRegionData, SummaryMode } from "@shared/specialization/types";
import { ActionGlyph } from "./ActionGlyph";
import { categoryLabel, formatSegment, holdTime, layerLabels, ledgerByExercise, sideLabels } from "./model";
import { SpecializationSheet } from "./SpecializationSheet";
import { TargetsEditor } from "./TargetsEditor";

const basisLabels: Record<string, string> = {
  established_anatomy: "Established anatomy",
  experimental: "Measured in studies",
  anatomical_inference: "Inferred from anatomy",
  product_assumption: "Sports Genome assumption",
  unknown: "Basis unknown",
};

/**
 * One muscle, in the brief's order (§6 "Muscle detail sheet"): name, location and layer;
 * what it does; how it contributes to shape; its exposure for the window and arm; the
 * contribution ledger behind every number (exercise → bout → segment); your target;
 * exercises for it, with why; and the sources and method.
 */
export function MuscleSheet({ data, node, exposure, side, mode, intervalLabel, weightUnit, goals, progress, timeZone, todayKey, recommendations, onSaveGoals, onRemoveGoal, onChooseExercise, onInspectExercise, onOpenSession, onOpenMethod, onClose }: {
  data: SpecializationRegionData;
  node: AnatomyNode;
  exposure: NodeExposure | null;
  side: ArmSide;
  mode: SummaryMode;
  intervalLabel: string;
  weightUnit: DisplayWeightUnit;
  goals: readonly SpecializationGoal[];
  progress: readonly GoalProgress[];
  timeZone: string;
  todayKey: string;
  recommendations: Recommendations | null;
  onSaveGoals: (goals: SpecializationGoal[]) => StoreWrite;
  onRemoveGoal: (goalId: string) => StoreWrite;
  onChooseExercise: (catalogExerciseId: number) => void;
  onInspectExercise: (catalogExerciseId: number | null, name: string) => void;
  onOpenSession: (sessionId: string) => void;
  onOpenMethod: () => void;
  onClose: () => void;
}) {
  const actionById = new Map(data.actions.map((action) => [action.id, action] as const));
  const nodeActions = data.nodeActions.filter((item) => item.nodeId === node.id).sort((left, right) => (left.role === right.role ? 0 : left.role === "prime" ? -1 : 1));
  const claims = data.claims.filter((claim) => claim.nodeId === node.id && claim.reviewStatus !== "rejected");
  const sourceById = new Map(data.sources.map((source) => [source.id, source] as const));
  const nodeName = (id: string) => data.nodes.find((item) => item.id === id)?.shortName ?? id;
  const armWord = side === "left" ? "left arm" : "right arm";
  const ledger = exposure ? ledgerByExercise(exposure.contributions) : [];
  const notCounted = exposure?.notCounted ?? [];

  return <SpecializationSheet
    id="spz-muscle"
    eyebrow={`${node.shortName} · ${layerLabels[node.layer]}`}
    title={node.name}
    subtitle={<p>{node.location}</p>}
    onClose={onClose}
  >
    <section className="spz-sheet-section" aria-labelledby="spz-does">
      <h3 id="spz-does">What it does</h3>
      <p>{node.whatItDoes}</p>
      {nodeActions.length > 0 && <ul className="spz-actions-list">
        {nodeActions.map((item) => {
          const action = actionById.get(item.actionId);
          if (!action) return null;
          return <li key={item.actionId}><ActionGlyph actionId={item.actionId} /><span><b>{action.label}</b><small>{item.role === "prime" ? "Main action" : "Helps"} · {action.plainDescription}</small></span></li>;
        })}
      </ul>}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-shape">
      <h3 id="spz-shape">How it contributes to shape</h3>
      <p>{node.shapeNote}</p>
      {node.caveats.length > 0 && <ul className="spz-caveats">{node.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul>}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-exposure">
      <h3 id="spz-exposure">{mode === "planned" ? "Planned" : "Completed"} · {intervalLabel} · {armWord}</h3>
      {!exposure || exposure.mappingCoverage === "none"
        ? <p className="spz-note">No exercise is mapped to this muscle yet, so there is nothing to count. That is missing mapping, not missing training.</p>
        : <dl className="spz-numbers">
          <div><dt>Direct dynamic bouts</dt><dd>{exposure.directDynamicBouts}{exposure.directDynamicReps ? <small> · {exposure.directDynamicReps} reps</small> : null}</dd></div>
          <div><dt>Other dynamic bouts</dt><dd>{exposure.contributingDynamicBouts}{exposure.contributingDynamicReps ? <small> · {exposure.contributingDynamicReps} reps</small> : null}</dd></div>
          <div><dt>Deliberate holds</dt><dd>{exposure.deliberateHoldBouts}{exposure.deliberateHoldBouts ? <small> · {holdTime(exposure.deliberateHoldSeconds)}</small> : null}</dd></div>
          <div><dt>Incidental grip or steadying</dt><dd>{exposure.incidentalBouts}</dd></div>
          {exposure.mixedBouts > 0 && <div><dt>Mixed bouts</dt><dd>{exposure.mixedBouts}</dd></div>}
          {exposure.unknownBouts > 0 && <div><dt>Unclassified</dt><dd>{exposure.unknownBouts}</dd></div>}
          {exposure.unknownSide.bouts > 0 && <div><dt>No arm recorded</dt><dd>{exposure.unknownSide.bouts}<small> · counted for neither arm</small></dd></div>}
          {exposure.pendingReviewBouts > 0 && <div><dt>Mapping under review</dt><dd>{exposure.pendingReviewBouts}<small> · shown, not counted</small></dd></div>}
        </dl>}
      {exposure?.mappingCoverage === "pending_review" && <p className="spz-note">Its exercise mapping is still under review, so nothing is counted for it yet.</p>}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-ledger">
      <h3 id="spz-ledger">Where the numbers come from</h3>
      {ledger.length || notCounted.length ? <div className="spz-ledger">
        {ledger.map((group) => <details key={group.key} className="spz-disclosure">
          <summary><span><b>{group.name}</b><small>{group.rows.length} bout{group.rows.length === 1 ? "" : "s"}{group.matchedBy === "name" ? " · matched by name" : ""}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
          <ol className="spz-bouts">
            {group.rows.map((row) => <li key={row.boutId} className="spz-bout">
              <div className="spz-bout-head">
                <b>{categoryLabel(row.category)}</b>
                <small>{[row.sessionLabel, row.performedAt ? new Date(row.performedAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : null, sideLabels[row.side]].filter(Boolean).join(" · ")}</small>
              </div>
              <ul className="spz-segments">{row.segments.map((segment, index) => <li key={segment.id}>{row.kind === "drop" ? `Drop ${index + 1}: ` : ""}{formatSegment(segment, weightUnit)}</li>)}</ul>
              {row.category === "mixed" && <p className="spz-note">Parts: {row.parts.map((part) => categoryLabel(part.category)).join(" and ")}. Counted once.</p>}
              {row.sharedWith.length > 0 && <p className="spz-note">Shared with {row.sharedWith.map(nodeName).join(", ")}: the work is real but cannot be split between them.</p>}
              {row.notes.length > 0 && <p className="spz-note">{row.notes.join(" · ")}</p>}
              {row.sessionId && <button type="button" className="spz-link" onClick={() => onOpenSession(row.sessionId!)}>Open this workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
            </li>)}
          </ol>
          <button type="button" className="spz-link" onClick={() => onInspectExercise(group.catalogExerciseId, group.name)}>About {group.name} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </details>)}
        {notCounted.length > 0 && <details className="spz-disclosure">
          <summary><span><b>Not counted</b><small>{notCounted.length} bout{notCounted.length === 1 ? "" : "s"} matched but earned nothing</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
          <ol className="spz-bouts">{notCounted.map((row) => <li key={`${row.boutId}-nc`} className="spz-bout"><div className="spz-bout-head"><b>{row.exerciseName}</b><small>{[row.sessionLabel, sideLabels[row.side]].join(" · ")}</small></div><p className="spz-note">{row.notes.join(" · ") || "Not counted."}</p></li>)}</ol>
        </details>}
      </div> : <p className="spz-note">Nothing {mode === "planned" ? "planned" : "logged"} for it in this window.</p>}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-target">
      <h3 id="spz-target">Your target</h3>
      <TargetsEditor regionId={data.region.id} nodeId={node.id} nodeName={node.name} side={side} goals={goals} progress={progress} timeZone={timeZone} todayKey={todayKey} onSave={onSaveGoals} onRemove={onRemoveGoal} />
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-exercises">
      <h3 id="spz-exercises">Exercises for this muscle</h3>
      {!recommendations ? <p className="spz-note">Exercises appear once your plan has loaded.</p>
        : recommendations.kind === "mapping_not_reviewed" ? <p className="spz-note">{recommendations.message}</p>
        : recommendations.kind === "at_target" ? <p className="spz-note">{recommendations.note}</p>
        : recommendations.candidates.length ? <ul className="spz-candidates">
          {recommendations.candidates.slice(0, 5).map((candidate) => <li key={candidate.catalogExerciseId} className="spz-candidate">
            <span><b>{candidate.name}</b><small>{candidate.why}</small>{candidate.alsoLoads.length > 0 && <small>Also loads {candidate.alsoLoads.slice(0, 4).map((item) => item.name).join(", ")}{candidate.alsoLoads.length > 4 ? ` and ${candidate.alsoLoads.length - 4} more` : ""}.</small>}</span>
            <span className="spz-candidate-actions">
              <button type="button" className="spz-button" onClick={() => onChooseExercise(candidate.catalogExerciseId)}><Plus className="h-4 w-4" aria-hidden="true" />Add or swap</button>
              <button type="button" className="spz-link" onClick={() => onInspectExercise(candidate.catalogExerciseId, candidate.name)}>About it</button>
            </span>
          </li>)}
        </ul> : <p className="spz-note">{recommendations.emptyReason ?? "No reviewed exercise fits your equipment and choices."}</p>}
      {recommendations && recommendations.kind !== "mapping_not_reviewed" && recommendations.alreadyCoveredBy.length > 0 && <p className="spz-note"><b>Already covered by</b> {recommendations.alreadyCoveredBy.map((item) => `${item.name} (${item.days.map((day) => day.label).join(", ")})`).join("; ")}.</p>}
    </section>

    <section className="spz-sheet-section" aria-labelledby="spz-sources">
      <h3 id="spz-sources">Sources and method</h3>
      {claims.length ? <ul className="spz-claims">
        {claims.map((claim) => <li key={claim.id}>
          <p>{claim.statement}</p>
          <small>{basisLabels[claim.basis] ?? claim.basis}{claim.reviewStatus === "draft" ? " · not reviewed yet" : ""}</small>
          <ul className="spz-sources">{claim.sources.map((ref) => {
            const source = sourceById.get(ref.sourceId);
            return source ? <li key={`${claim.id}-${ref.sourceId}`}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>{ref.locator ? ` · ${ref.locator}` : ""}{ref.qualification ? <small> {ref.qualification}</small> : null}</li> : null;
          })}</ul>
        </li>)}
      </ul> : <p className="spz-note">No reviewed statements for this muscle yet.</p>}
      <button type="button" className="spz-link" onClick={onOpenMethod}>How this is counted <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
    </section>
  </SpecializationSheet>;
}
