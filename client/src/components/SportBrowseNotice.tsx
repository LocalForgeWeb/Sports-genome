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
 * Adopting the sport stays a deliberate act with its own confirmation, and it
 * lives here rather than on the sport picker, so selecting a sport to read it
 * can never be mistaken for committing to it.
 */
export function SportBrowseNotice({ browsing, browsedSportLabel, ownSportLabel, onAdopt, onReturn }: { browsing: boolean; browsedSportLabel: string; ownSportLabel: string; onAdopt: () => void; onReturn: () => void }) {
  if (!browsing) return null;
  return (
    <aside className="sport-browse-notice" aria-label={`Viewing ${browsedSportLabel}. Your sport is ${ownSportLabel}.`}>
      <p className="sport-browse-notice-state">
        <Eye className="h-4 w-4" aria-hidden="true" />
        <span>
          <strong>Viewing {browsedSportLabel}</strong>
          <small>Your plan stays on {ownSportLabel}. Nothing here changes it.</small>
        </span>
      </p>
      <div className="sport-browse-notice-actions">
        <button type="button" onClick={onReturn} className="sport-browse-notice-return">Back to {ownSportLabel}</button>
        <button type="button" onClick={onAdopt} className="sport-browse-notice-adopt">Make {browsedSportLabel} my sport <ArrowUpRight className="h-3.5 w-3.5" /></button>
      </div>
    </aside>
  );
}
