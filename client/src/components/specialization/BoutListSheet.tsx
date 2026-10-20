import { ArrowRight, ChevronDown } from "lucide-react";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { RegionBoutRow } from "@shared/specialization/types";
import { BoutItem, boutDay } from "./BoutItem";
import { ledgerByExercise } from "./model";
import type { RowSideText } from "./sideWords";
import { SpecializationSheet } from "./SpecializationSheet";

/**
 * One list in the sheet: the bouts behind one total, with what that total is, and what to say when
 * it is 0. `reasons` says, per exercise (the ledger's exercise key), why its sets are listed: an
 * exercise the region leaves unmapped, with its listed reason (10-multi-region.md §8).
 */
export type BoutList = { key: string; heading: string | null; note: string | null; rows: readonly RegionBoutRow[]; empty?: string; reasons?: ReadonlyMap<string, string> };

/**
 * The set records behind a region-level total (brief §1, "Every total opens the contributing
 * exercises and actual set records"): the region's distinct bouts on this side, the sets with
 * no side recorded, the work tagged with the region and mapped to no muscle, the sets it does not
 * count although their exercise tags it, one day's bouts (a bar in "Exercises in this window"), or
 * this week's logged bouts beside the plan week's (the pair in the window line). Exercise → bout →
 * segment, as the muscle sheet's ledger reads, each logged bout with "Open this workout".
 */
export function BoutListSheet({ eyebrow, title, intro, lists, sideText, weightUnit, onOpenSession, onInspectExercise, onOpenMethod, onClose }: {
  eyebrow: string;
  title: string;
  intro: string;
  lists: readonly BoutList[];
  sideText: RowSideText;
  weightUnit: DisplayWeightUnit;
  onOpenSession: (sessionId: string) => void;
  onInspectExercise: (catalogExerciseId: number | null, name: string) => void;
  onOpenMethod: () => void;
  onClose: () => void;
}) {
  return <SpecializationSheet id="spz-bouts" focusKey={`${eyebrow}|${title}`} eyebrow={eyebrow} title={title} subtitle={<p>{intro}</p>} onClose={onClose}>
    {lists.map((list) => {
      const groups = ledgerByExercise(list.rows);
      return <section key={list.key} className="spz-sheet-section" aria-label={list.heading ?? title}>
        {list.heading && <h3>{list.heading}</h3>}
        {list.note && <p className="spz-note">{list.note}</p>}
        {groups.length ? <div className="spz-ledger">
          {groups.map((group) => <details key={group.key} className="spz-disclosure" open={groups.length === 1 || undefined}>
            <summary><span><b>{group.name}</b><small>{group.rows.length} set{group.rows.length === 1 ? "" : "s"}{group.matchedBy === "name" ? " · matched by name" : ""}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
            {list.reasons?.get(group.key) && <p className="spz-note">{list.reasons.get(group.key)}</p>}
            <ol className="spz-bouts">
              {group.rows.map((row) => {
                const day = boutDay(row.performedAt);
                return <BoutItem key={row.boutId} row={row} title={day ?? row.sessionLabel} meta={[day ? row.sessionLabel : null, ...sideText(row)].filter(Boolean).join(" · ")} sideText={sideText} weightUnit={weightUnit} onOpenSession={onOpenSession} />;
              })}
            </ol>
            <button type="button" className="spz-link" onClick={() => onInspectExercise(group.catalogExerciseId, group.name)}>About {group.name} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </details>)}
        </div> : <p className="spz-note">{list.empty ?? "No set records are kept for this total."}</p>}
      </section>;
    })}
    <section className="spz-sheet-section">
      <button type="button" className="spz-link" onClick={onOpenMethod}>How this is counted <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
    </section>
  </SpecializationSheet>;
}
