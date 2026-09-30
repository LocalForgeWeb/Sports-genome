import { useId } from "react";
import { ArrowUpRight, Eye } from "lucide-react";
import "../sport-browse-notice.css";

/**
 * Says whose sport you are looking at, whenever it is not your own.
 *
 * Browsing another sport used to be indistinguishable from switching to it -
 * same handler, no signal, and every saved training day silently cleared. Now
 * that the two are separate, the difference has to be visible, or a reference
 * screen showing soccer while the plan is built on wrestling is just a quieter
 * kind of confusion.
 *
 * Adopting the sport stays a deliberate act, and it lives here rather than on
 * the sport picker, so selecting a sport to read it can never be mistaken for
 * committing to it. What adopting costs is said before the tap, and Undo
 * follows it. `adoptClearsDays` is false when there is no sport of their own
 * yet: adopting then clears nothing, so nothing is said. `adoptClearsRole` is
 * true when they have picked a role or style, which belongs to their sport and
 * is cleared with the days, so the line names it too.
 */
export function SportBrowseNotice({ browsing, browsedSportLabel, ownSportLabel, onAdopt, onReturn, adoptClearsDays = true, adoptClearsRole = false }: { browsing: boolean; browsedSportLabel: string; ownSportLabel: string; onAdopt: () => void; onReturn: () => void; adoptClearsDays?: boolean; adoptClearsRole?: boolean }) {
  const consequenceId = useId();
  if (!browsing) return null;
  return (
    <aside className="sport-browse-notice" aria-label={`Viewing ${browsedSportLabel}. Your sport is ${ownSportLabel}.`}>
      <p className="sport-browse-notice-state">
        <Eye className="h-4 w-4" aria-hidden="true" />
        <span>
          <strong>Viewing {browsedSportLabel}</strong>
          <small>Your plan stays on {ownSportLabel} while you look.</small>
          {adoptClearsDays && <small id={consequenceId} className="sport-browse-notice-consequence">Making {browsedSportLabel} your sport clears your saved training days{adoptClearsRole ? " and your role or style" : ""}. You can undo it straight after.</small>}
        </span>
      </p>
      <div className="sport-browse-notice-actions">
        <button type="button" onClick={onReturn} className="sport-browse-notice-return">Back to {ownSportLabel}</button>
        <button type="button" onClick={onAdopt} className="sport-browse-notice-adopt" aria-describedby={adoptClearsDays ? consequenceId : undefined}>Make {browsedSportLabel} my sport <ArrowUpRight className="h-3.5 w-3.5" /></button>
      </div>
    </aside>
  );
}
