import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { exercises as catalog, type Exercise } from "@/lib/exerciseCatalog";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { familiarRankingLiftId, rankableSnapshotMeta, rankingEquipmentOptions, rankingLiftHowTo, rankingLiftReason, rankingLiftsForRegion, suggestedRankingLifts } from "@/lib/rankRecommendations";
import "../rank-suggestions.css";

/**
 * Why a lift logged now would not produce a rank yet (S04, S05). Each is a different state with a
 * different remedy, and none of them stops the lift being saved:
 * - "group": no comparison group chosen; - "no_curve": the chosen group has no curve;
 * - "failed": the ranking service did not answer; - "offline": waiting for a connection.
 */
export type RankBlockedReason = "group" | "no_curve" | "failed" | "offline";

const blockedCopy: Record<RankBlockedReason, string> = {
  group: "Ranks compare your lifts with men or women who lift, so a comparison group is needed first. A lift you log now is saved, and ranks once a group is chosen.",
  no_curve: "The comparison group you chose has no strength curves, so no lift can be ranked against it. A lift you log is still saved and tracks your own progress.",
  failed: "Ranks could not be worked out just now. A lift you log is saved, and ranks when the service answers again.",
  offline: "You're offline. A lift you log is saved on this device, and ranks once you're back online.",
};

const byName = new Map(catalog.map((exercise) => [exercise.name.toLowerCase(), exercise.id]));

/**
 * "Add a comparable lift": shown on a muscle group that has no rank yet, with up to three lifts
 * the ranking can score that work this group (lib/rankRecommendations). The snapshot behind them
 * says a comparison exists; it is not a promise that every entry will rank, so what else a rank
 * needs is said here too. One tap opens the lift log with that exact exercise chosen.
 *
 * A group no lift in the comparison data can rank says so, and that the lifts still count for the
 * athlete's own progress: no comparison is not the same as not worth training (S07).
 */
export function RankingLiftSuggestions({ regionId, regionLabel, loggedNames, hasRecords, blocked = null, onLog }: {
  regionId: string;
  regionLabel: string;
  /** Exercises already logged for this group, left out of the suggestions (by catalog ID where the name is a catalog name). */
  loggedNames: readonly string[];
  /** Lifts are logged here already, just none that a rank could use. */
  hasRecords: boolean;
  /** What stands between a logged lift and a rank right now, if anything. */
  blocked?: RankBlockedReason | null;
  onLog?: (exercise: Exercise) => void;
}) {
  const { excludeIds, exclude } = useMemo(() => {
    const ids = new Set<number>();
    const names = new Set<string>();
    for (const name of loggedNames) {
      const id = byName.get(name.toLowerCase());
      if (id !== undefined) ids.add(id); else names.add(name.toLowerCase());
    }
    return { excludeIds: ids, exclude: names };
  }, [loggedNames]);
  const [equipment, setEquipment] = useState<string>("");
  const equipmentOptions = useMemo(() => rankingEquipmentOptions(regionId, { excludeIds, exclude }), [regionId, excludeIds, exclude]);
  const lifts = useMemo(() => suggestedRankingLifts(regionId, { excludeIds, exclude, equipment: equipment || null }), [regionId, excludeIds, exclude, equipment]);
  const total = useMemo(() => rankingLiftsForRegion(regionId).length, [regionId]);
  const shownTotal = equipment ? equipmentOptions.find((option) => option.equipment === equipment)?.count ?? 0 : equipmentOptions.reduce((sum, option) => sum + option.count, 0);
  const titleId = `rank-suggestions-${regionId}`;
  const group = regionLabel.toLowerCase();

  if (total === 0) {
    return <section className="strength-record-section rank-suggestions" aria-labelledby={titleId} data-rank-suggestions="none">
      <h3 id={titleId} className="strength-record-section-title">Add a comparable lift</h3>
      <p className="rank-suggestions-lead">No lift in the comparison data ranks the {group} yet, so this group can't get a rank for now. That says nothing about how much it matters: lifts you log for it still show your own progress.</p>
    </section>;
  }

  return <section className="strength-record-section rank-suggestions" aria-labelledby={titleId} data-rank-suggestions="lifts">
    <h3 id={titleId} className="strength-record-section-title">Add a comparable lift</h3>
    <p className="rank-suggestions-lead">{hasRecords
      ? `None of the lifts logged here can be compared with other lifters. A set of one of these — weight and reps — can give your ${group} a rank.`
      : `A set of one of these — weight and reps — can give your ${group} a rank.`}</p>
    {blocked && <p className="rank-suggestions-blocked" role="status" data-rank-blocked={blocked}>{blockedCopy[blocked]}</p>}
    {equipmentOptions.length > 1 && <label className="rank-suggestions-equipment">
      <span>Equipment</span>
      <select value={equipment} onChange={(event) => setEquipment(event.target.value)}>
        <option value="">Any equipment</option>
        {equipmentOptions.map((option) => <option key={option.equipment} value={option.equipment}>{option.equipment} ({option.count})</option>)}
      </select>
    </label>}
    {lifts.length === 0
      ? <div className="rank-suggestions-empty" role="status"><p>No {equipment.toLowerCase()} lift you haven't logged ranks the {group}.</p><button type="button" onClick={() => setEquipment("")}>Show any equipment</button></div>
      : <ul className="rank-suggestions-list">
        {lifts.map((lift) => <li key={lift.exercise.id} className="rank-suggestion">
          <ExerciseMedia exerciseId={lift.exercise.id} exerciseName={lift.exercise.name} equipment={lift.exercise.equipment} variant="thumb" />
          <div className="rank-suggestion-copy">
            <strong>{lift.exercise.name}{lift.exercise.id === familiarRankingLiftId[regionId] ? <span className="rank-suggestion-tag">Common option</span> : null}</strong>
            <small>{rankingLiftReason(lift, regionLabel)}</small>
            {rankingLiftHowTo(lift) && <small>{rankingLiftHowTo(lift)}</small>}
          </div>
          {onLog && <button type="button" className="rank-suggestion-log" onClick={() => { emitInteractionFeedback(); onLog(lift.exercise); }} aria-label={`Log this lift: ${lift.exercise.name}`}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Log this lift
          </button>}
        </li>)}
      </ul>}
    {shownTotal > lifts.length && lifts.length > 0 && <p className="rank-suggestions-more">{shownTotal - lifts.length} more {shownTotal - lifts.length === 1 ? "lift ranks" : "lifts rank"} the {group}{equipment ? ` on ${equipment.toLowerCase()}` : ""}. Any of them works: search for it in Log a lift.</p>}
    <details className="rank-suggestions-method">
      <summary>How lifts are compared</summary>
      <p><b>Compared on this exact lift</b>: your set is placed among lifters who logged the same exercise. <b>Compared through a related lift</b>: this exercise has no data of its own, so it is placed using a closely related variation's data, and the rank is less exact.</p>
      <p>A rank needs a comparison group (men or women who lift), a set with its reps, and for a loaded lift the weight. Your body weight is used too when it's on record. These lifts come from asking the ranking itself which exercises it can place ({rankableSnapshotMeta.catalog.scored} of them, checked {new Date(`${rankableSnapshotMeta.generatedAt}T12:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}).</p>
    </details>
  </section>;
}
