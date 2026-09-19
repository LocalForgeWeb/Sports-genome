/**
 * Looking at a sport, versus making it yours.
 *
 * These were the same action. Opening "Soccer" from search - or picking it in
 * the Movement Atlas, or the Body Lab - called the same handler the profile
 * uses, so browsing another sport's actions rewrote the athlete's own sport and
 * cleared every saved training day across all three weeks. The only way back
 * was an Undo toast, and toasts expire.
 *
 * The Body Lab destination is the reference library - the comment on its own
 * workspace list says it is "about exercises and anatomy in general, not about
 * this athlete" - so a sport chosen there is a thing to read, not a commitment.
 * Everything the athlete's plan is built from keeps reading the profile sport,
 * and adopting a browsed sport stays a deliberate, separate act.
 */

import type { SportMovementProfile } from "./sportMovementDatabase";

export type SportBrowseState = {
  /** The sport the reference screens are showing, or null to follow the profile. */
  sportId: string | null;
  /** The action selected within that sport, if one was opened directly. */
  movementId: string | null;
};

/** Following the athlete's own sport, which is the resting state. */
export const followProfileSport: SportBrowseState = { sportId: null, movementId: null };

/** The sport the reference screens should show. */
export function referenceSportId(profileSportId: string, browse: SportBrowseState): string {
  return browse.sportId || profileSportId;
}

/**
 * Whether the reference screens are showing a sport that is not the athlete's.
 *
 * Browsing your own sport is not browsing: selecting Wrestling while Wrestling
 * is your sport should leave no banner and nothing to return from.
 */
export function isBrowsingOtherSport(profileSportId: string, browse: SportBrowseState): boolean {
  return Boolean(browse.sportId) && browse.sportId !== profileSportId;
}

/** Which action the reference screens should show, given what the athlete has open. */
export function referenceMovementId(profileMovementId: string, browse: SportBrowseState): string {
  return browse.sportId ? browse.movementId || "" : profileMovementId;
}

/**
 * Opening a sport to read it.
 *
 * Selecting the athlete's own sport clears the overlay rather than recording it,
 * so returning to your own sport leaves no trace of having browsed.
 */
export function browseSport(sportId: string, profileSportId: string): SportBrowseState {
  if (!sportId || sportId === profileSportId) return followProfileSport;
  return { sportId, movementId: null };
}

/** Opening one action, which carries the sport it belongs to. */
export function browseAction(action: Pick<SportMovementProfile, "id" | "sportId">, profileSportId: string): SportBrowseState {
  if (action.sportId === profileSportId) return followProfileSport;
  return { sportId: action.sportId, movementId: action.id };
}

/** Selecting a different action while already browsing keeps the browsed sport. */
export function browseMovement(movementId: string, browse: SportBrowseState): SportBrowseState {
  if (!browse.sportId) return followProfileSport;
  return { sportId: browse.sportId, movementId };
}
