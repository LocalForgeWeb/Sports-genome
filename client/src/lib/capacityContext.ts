import { getSupabaseClient } from "@/lib/supabaseClient";
import type { CapacityFocusState } from "@/components/CapacityFocusCard";
import type { ConstraintType, Laterality, ResilienceTargetCatalog } from "@shared/resilienceContext";

/**
 * The athlete's focus area and constraint, kept in `public.athlete_focus_areas`
 * and `public.athlete_training_constraints`.
 *
 * Those two tables, their check constraints and their RLS policies now exist —
 * the audit that opened this feature recorded them as absent, so until now the
 * answers to "what do you want to build up?" and "anything going on there right
 * now?" lived in this device's local storage and nowhere else. Reinstalling the
 * app, or opening it on a second device, lost them.
 *
 * Three rules from the interaction contract shape how this writes.
 *
 * §3: the two are separate objects and "both objects are effective-dated with
 * provenance and are user-editable and reversible". So nothing is ever updated
 * in place and nothing is deleted: changing an answer closes the old row with
 * `effective_to` and inserts a new one, and the history of what the athlete said
 * stays readable.
 *
 * §3 again: `proactive_none` is a reported state, not an absent one. "Nothing
 * right now" is a row, because the difference between having answered and never
 * having been asked is exactly what the plan needs to know.
 *
 * §8: "Reassessment windows come from the evidence route, not one global timer."
 * `reconfirm_due_on` is therefore left NULL rather than filled with an invented
 * interval — the schema has no default for it either, which says the same thing.
 * A constraint that should expire is a route's decision, and no route exists yet.
 *
 * Everything returns rather than throws, like the rest of the sync layer: a gym
 * basement with no signal is an ordinary condition, and none of this may ever
 * stop an athlete using the app.
 */

type ActiveFocusRow = { id: string; target_id: string; intent_code: string; laterality: string };
type ActiveConstraintRow = { id: string; target_id: string; constraint_type: string; laterality: string };

export type CapacityContextSnapshot = {
  focus?: { targetKey: string; laterality: Laterality };
  constraint?: { targetKey: string; constraintType: ConstraintType; laterality: Laterality };
};

/** Catalog lookups in both directions. The client speaks keys; the tables speak ids. */
function catalogMaps(catalog: ResilienceTargetCatalog | undefined) {
  const idByKey = new Map<string, string>();
  const keyById = new Map<string, string>();
  if (catalog?.status === "connected") {
    for (const target of catalog.targets) {
      idByKey.set(target.targetKey, target.targetId);
      keyById.set(target.targetId, target.targetKey);
    }
  }
  return { idByKey, keyById };
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * What the athlete last told us, from their own rows.
 *
 * Returns null when there is nothing to say — no client, no id, no catalog to
 * resolve a target id against, or simply no rows — so a caller can tell "the
 * server has nothing" apart from "the server was not asked".
 */
export async function loadCapacityContext(
  userId: string | null,
  catalog: ResilienceTargetCatalog | undefined
): Promise<CapacityContextSnapshot | null> {
  const supabase = getSupabaseClient();
  const { keyById } = catalogMaps(catalog);
  if (!supabase || !userId || keyById.size === 0) return null;

  try {
    const [focusResult, constraintResult] = await Promise.all([
      supabase.from("athlete_focus_areas").select("id,target_id,intent_code,laterality")
        .eq("user_id", userId).eq("status", "active").is("effective_to", null)
        .order("priority", { ascending: true }).limit(1),
      supabase.from("athlete_training_constraints").select("id,target_id,constraint_type,laterality")
        .eq("user_id", userId).eq("status", "active").is("effective_to", null)
        .order("created_at", { ascending: false }).limit(1),
    ]);
    if (focusResult.error) return null;

    const focusRow = (focusResult.data as ActiveFocusRow[] | null)?.[0];
    const constraintRow = (constraintResult.data as ActiveConstraintRow[] | null)?.[0];
    const focusKey = focusRow ? keyById.get(focusRow.target_id) : undefined;
    const constraintKey = constraintRow ? keyById.get(constraintRow.target_id) : undefined;
    if (!focusKey && !constraintKey) return null;

    return {
      focus: focusKey ? { targetKey: focusKey, laterality: focusRow!.laterality as Laterality } : undefined,
      constraint: constraintKey
        ? { targetKey: constraintKey, constraintType: constraintRow!.constraint_type as ConstraintType, laterality: constraintRow!.laterality as Laterality }
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Writes the current answers, closing anything they replace.
 *
 * A row that already says what the athlete is saying now is left alone, so
 * re-rendering the card or reopening the app does not lay down a new row every
 * time. Only a real change closes one and opens another.
 */
export async function saveCapacityContext(
  userId: string | null,
  state: CapacityFocusState,
  catalog: ResilienceTargetCatalog | undefined
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { idByKey } = catalogMaps(catalog);
  if (!supabase || !userId || idByKey.size === 0) return false;

  const wantedFocusTargetId = state.focus ? idByKey.get(state.focus.targetKey) : undefined;
  // A key the catalog cannot resolve is not something to guess at; the foreign
  // key would reject it anyway, and inventing one would attach the athlete's
  // answer to the wrong region.
  if (state.focus && !wantedFocusTargetId) return false;
  const wantedLaterality = state.focus?.laterality || "bilateral";
  const wantedConstraintType = state.constraint?.constraintType;

  try {
    const [focusResult, constraintResult] = await Promise.all([
      supabase.from("athlete_focus_areas").select("id,target_id,intent_code,laterality")
        .eq("user_id", userId).eq("status", "active").is("effective_to", null),
      supabase.from("athlete_training_constraints").select("id,target_id,constraint_type,laterality")
        .eq("user_id", userId).eq("status", "active").is("effective_to", null),
    ]);
    if (focusResult.error || constraintResult.error) return false;

    const activeFocus = (focusResult.data as ActiveFocusRow[] | null) ?? [];
    const activeConstraints = (constraintResult.data as ActiveConstraintRow[] | null) ?? [];
    const stamp = today();
    const now = new Date().toISOString();

    const keptFocus = activeFocus.find((row) =>
      row.target_id === wantedFocusTargetId && row.intent_code === (state.focus?.intent || "build_capacity") && row.laterality === wantedLaterality);
    const staleFocus = activeFocus.filter((row) => row.id !== keptFocus?.id).map((row) => row.id);
    const keptConstraint = activeConstraints.find((row) =>
      row.target_id === wantedFocusTargetId && row.constraint_type === wantedConstraintType && row.laterality === wantedLaterality);
    const staleConstraints = activeConstraints.filter((row) => row.id !== keptConstraint?.id).map((row) => row.id);

    // "Removed" and "superseded" are what the schema calls a closed row; neither
    // is a delete, and the previous answer stays queryable with its own dates.
    if (staleFocus.length) {
      const { error } = await supabase.from("athlete_focus_areas")
        .update({ status: "removed", effective_to: stamp, updated_at: now }).in("id", staleFocus);
      if (error) return false;
    }
    if (staleConstraints.length) {
      const { error } = await supabase.from("athlete_training_constraints")
        .update({ status: "superseded", effective_to: stamp, updated_at: now }).in("id", staleConstraints);
      if (error) return false;
    }

    if (wantedFocusTargetId && !keptFocus) {
      const { error } = await supabase.from("athlete_focus_areas").insert({
        user_id: userId,
        target_id: wantedFocusTargetId,
        intent_code: state.focus?.intent || "build_capacity",
        laterality: wantedLaterality,
        provenance: "user_selected",
      });
      if (error) return false;
    }
    // The constraint only exists alongside a focus area, which is how the card
    // asks it: there is no constraint on a target the athlete has not named.
    if (wantedFocusTargetId && wantedConstraintType && !keptConstraint) {
      const { error } = await supabase.from("athlete_training_constraints").insert({
        user_id: userId,
        target_id: wantedFocusTargetId,
        constraint_type: wantedConstraintType,
        laterality: wantedLaterality,
        provenance: "user_reported",
      });
      if (error) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * A stable signature of what is worth writing, so a re-render does not re-send.
 *
 * `reportedSignals` is deliberately absent: it has no column. The table carries
 * `severity_or_irritability`, `clinician_restriction` and
 * `user_reported_diagnosis`, and none of them means "the athlete ticked
 * neurological or systemic symptoms" — writing the ticks into any of them would
 * be recording a report as something it is not. They stay on the device, and
 * `clinician_restricted` reaches the row honestly, as a constraint type.
 */
export function capacitySignature(state: CapacityFocusState): string {
  if (!state.focus) return "none";
  return [state.focus.targetKey, state.focus.intent, state.focus.laterality, state.constraint?.constraintType || "proactive_none"].join("|");
}
