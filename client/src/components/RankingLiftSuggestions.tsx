import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { familiarRankingLift, rankingLiftHowTo, rankingLiftReason, rankingLiftsForRegion, suggestedRankingLifts } from "@/lib/rankRecommendations";
import "../rank-suggestions.css";

/**
 * "Get a Chest rank": shown on a muscle group that has no rank yet, with the lifts that would
 * give it one (lib/rankRecommendations). Each is a lift the ranking can actually score and that
 * works this group, the familiar one first, with one tap to log it - the lift log opens with
 * that exercise already chosen.
 *
 * A group no lift in the comparison data can rank says so, rather than suggesting a lift that
 * would train the muscle and still leave it unranked.
 */
export function RankingLiftSuggestions({ regionId, regionLabel, loggedNames, hasRecords, onLog }: {
  regionId: string;
  regionLabel: string;
  /** Exercises already logged for this group, left out of the suggestions. */
  loggedNames: readonly string[];
  /** Lifts are logged here already, just none that a rank could use. */
  hasRecords: boolean;
  onLog?: (exercise: Exercise) => void;
}) {
  const exclude = useMemo(() => new Set(loggedNames.map((name) => name.toLowerCase())), [loggedNames]);
  const lifts = useMemo(() => suggestedRankingLifts(regionId, { exclude }), [regionId, exclude]);
  const total = useMemo(() => rankingLiftsForRegion(regionId).length, [regionId]);
  const titleId = `rank-suggestions-${regionId}`;

  if (total === 0) {
    return <section className="strength-record-section rank-suggestions" aria-labelledby={titleId} data-rank-suggestions="none">
      <h3 id={titleId} className="strength-record-section-title">Get a {regionLabel} rank</h3>
      <p className="rank-suggestions-lead">No lift in the comparison data ranks the {regionLabel.toLowerCase()} yet, so this group can't be ranked for now. Lifts you log for it still show your own progress.</p>
    </section>;
  }

  return <section className="strength-record-section rank-suggestions" aria-labelledby={titleId} data-rank-suggestions="lifts">
    <h3 id={titleId} className="strength-record-section-title">Get a {regionLabel} rank</h3>
    <p className="rank-suggestions-lead">{hasRecords
      ? `None of the lifts logged here can be ranked. Log a set of any of these — the weight and the reps — and your ${regionLabel.toLowerCase()} gets a rank:`
      : `Log a set of any of these — the weight and the reps — and your ${regionLabel.toLowerCase()} gets a rank:`}</p>
    <ul className="rank-suggestions-list">
      {lifts.map((lift) => <li key={lift.exercise.id} className="rank-suggestion">
        <ExerciseMedia exerciseId={lift.exercise.id} exerciseName={lift.exercise.name} equipment={lift.exercise.equipment} variant="thumb" />
        <div className="rank-suggestion-copy">
          <strong>{lift.exercise.name}{lift.exercise.name === familiarRankingLift[regionId] ? <span className="rank-suggestion-tag">Most common</span> : null}</strong>
          <small>{rankingLiftReason(lift, regionLabel)}</small>
          {rankingLiftHowTo(lift) && <small>{rankingLiftHowTo(lift)}</small>}
        </div>
        {onLog && <button type="button" className="rank-suggestion-log" onClick={() => { emitInteractionFeedback(); onLog(lift.exercise); }} aria-label={`Log ${lift.exercise.name}`}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Log it
        </button>}
      </li>)}
    </ul>
    {total > lifts.length && <p className="rank-suggestions-more">{total - lifts.length} more {total - lifts.length === 1 ? "lift ranks" : "lifts rank"} the {regionLabel.toLowerCase()}. Any of them works: search for it in Log a lift.</p>}
  </section>;
}
