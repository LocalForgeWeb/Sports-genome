import type { ActionId, JointAction } from "../types";
import { forearmActions } from "./forearm";
import { jointActions } from "./joints";

/**
 * The shared joint action library (docs/specialization-atlas/10-multi-region.md §1.3): one
 * definition per action, read by every region that names it, so two regions can never word one
 * action two ways. A region lists its actions by id (`actionsFor`); the records stay here.
 */
export const actionLibrary: readonly JointAction[] = [...forearmActions, ...jointActions];

export const actionById: ReadonlyMap<ActionId, JointAction> = new Map(actionLibrary.map((action) => [action.id, action]));

/** The library's records for these ids, in this order. An id the library does not hold is an error. */
export function actionsFor(ids: readonly ActionId[]): JointAction[] {
  return ids.map((id) => {
    const action = actionById.get(id);
    if (!action) throw new Error(`Joint action ${id} is not in the shared library (shared/specialization/actions/)`);
    return action;
  });
}
