import type { ActionId, MappingEvidenceBasis, MappingSourceRef, MuscleMode, NodeId, Relationship, ReviewStatus, VariantMapping } from "../../../types";
import { variantIdFor } from "../../../ids";
import { forearmActionIds as a } from "../../../actions/ids";
import { UPPER_ARM_MAPPING_VERSION, upperArmMuscleIds as m } from "../ids";

/**
 * Part of the extensions-and-other family (extensionsOther.ts): its one-row builder and its rows on
 * the elbow flexors, the Zercher lifts' biceps and brachialis and 406 Lever Supination's biceps,
 * which extensionsOther.ts lists in their places. Kept in a module of their own at wave A's
 * integration (23 Oct 2026), unchanged, so that the forearm's page, which credits the biceps and
 * brachialis through the upper arm's rows (docs/specialization-atlas/10-multi-region.md §4.2),
 * loads these rows without the family's triceps rows (§6.1's download gate;
 * regions/forearm/upperArmHome.ts).
 */

// ---------------------------------------------------------------- source references

const ACTION_ONLY = "Gives the muscle's action, not how much this exercise loads it.";
const SEEN = "Seen through web-search excerpts, not the full text.";
export const action = (sourceId: string, locator: string, seen = SEEN): MappingSourceRef => ({ sourceId, locator, limitation: `${ACTION_ONLY} ${seen}` });

const src = {
  biceps: action("A50", "Introduction"),
  bicepsKenhub: action("kenhub.biceps_brachii", "Function"),
  brachialis: action("A51", "Introduction"),
  brachialisTeach: action("teachmeanatomy.brachialis", "Brachialis: flexes the elbow"),
  supinationByTorque: {
    sourceId: "M5",
    locator: "Results: supinator vs biceps activity as torque rises",
    limitation: "Pilot of 4 adults, isometric, forearm in neutral; shows the biceps joining supination as torque rises, not its share in this exercise.",
  } satisfies MappingSourceRef,
  supinationByElbowAngle: {
    sourceId: "M6",
    locator: "Abstract: maximal supination torque by elbow and forearm angle",
    limitation: "Maximal isometric efforts, not repetitions.",
  } satisfies MappingSourceRef,
};

// ---------------------------------------------------------------- one mapping

export interface Spec {
  action: ActionId;
  relationship: Relationship;
  mode: MuscleMode;
  basis: MappingEvidenceBasis;
  rationale: string;
  sources: MappingSourceRef[];
  allocation?: VariantMapping["allocation"];
  status?: ReviewStatus;
}

export const mapping = (catalogExerciseId: number, nodeId: NodeId, spec: Spec): VariantMapping => ({
  id: `${variantIdFor(catalogExerciseId)}:${nodeId}`,
  versionKey: UPPER_ARM_MAPPING_VERSION,
  variantId: variantIdFor(catalogExerciseId),
  nodeId,
  actionId: spec.action,
  relationship: spec.relationship,
  muscleMode: spec.mode,
  evidenceBasis: spec.basis,
  allocation: spec.allocation ?? "individual",
  requiresNoStraps: false,
  rationale: spec.rationale,
  reviewStatus: spec.status ?? "reviewed",
  sources: spec.sources,
  // Every row here loads the muscle on the side of the arm that holds or moves the load.
  sideRelation: "same",
});

// ---------------------------------------------------------------- the elbow flexors' rows

/** The two elbow flexors holding the elbows bent against a bar that sits in their crook. */
function zercher(id: number, relationship: "incidental" | "contributing", rationale: string): VariantMapping[] {
  const work = { action: a.elbowFlexion, relationship, mode: "isometric" as const, basis: "anatomy" as const, rationale };
  return [
    mapping(id, m.biceps, { ...work, sources: [src.biceps, src.bicepsKenhub] }),
    mapping(id, m.brachialis, { ...work, sources: [src.brachialis, src.brachialisTeach] }),
  ];
}

/** The Zercher squat: the elbow flexors hold the bar, incidental. */
export const zercherSquat: VariantMapping[] = zercher(164, "incidental", "The bar sits in the crook of both elbows and the hands do not hold it, so the elbow flexors hold the elbows bent against it while the legs and hips move the load: holding, isometric, counted as incidental steadying, never as direct work.");

/** The Zercher carry: holding the bar is part of what it trains, contributing. */
export const zercherCarry: VariantMapping[] = zercher(300, "contributing", "The bar sits in the crook of both elbows for the whole carry and the hands do not grip it, so the elbow flexors hold the elbows bent for the time logged. Holding it is part of what the carry trains, so they are contributing, isometric, as the forearm page has always counted them.");

/** Lever supination: the forearm's exercise; the upper arm speaks for the biceps. */
export const leverSupination: VariantMapping =
mapping(406, m.biceps, {
    action: a.supination,
    relationship: "contributing",
    mode: "dynamic",
    basis: "emg",
    sources: [src.biceps, src.bicepsKenhub, src.supinationByTorque, src.supinationByElbowAngle],
    rationale: "Turning the forearm palm-up against a lever is supination. With the elbow bent at 90 degrees, as the exercise sets it, the biceps is a strong supinator and joins in more as the load rises (M5, M6), so it is contributing. The supinator, a forearm muscle, is credited on the forearm page.",
  });
