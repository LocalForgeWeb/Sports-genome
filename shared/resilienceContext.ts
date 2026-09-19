/**
 * Musculoskeletal Capacity & Injury Resilience (v2) — shared semantics.
 *
 * This module holds the canonical vocabulary and the boundary guards that the philosophy fixes:
 * context modes, evidence routes, action postures, and the target/constraint separation.
 *
 * It is deliberately NOT the plan engine. Synthesis, ranking and dose belong to the versioned
 * server contract (`resilience_plan_v2`) so web and iOS receive the same result; the blocking
 * criterion `single_contract_across_clients` fails the moment a client scores anything locally.
 * What lives here is the shared meaning of the values that contract exchanges, plus the guards
 * that make an unsafe combination unrepresentable.
 */

/** Sport participation is optional context. `general` and `undecided` are real states, not NULL. */
export type SportContextMode = "sport" | "general" | "undecided";

export type SportContext =
  | { mode: "sport"; primarySportId: string }
  | { mode: "general"; primarySportId: null }
  | { mode: "undecided"; primarySportId: null };

/** Positive targets and plan constraints are different objects even when they name one region. */
export type FocusIntent = "build_capacity" | "improve_function" | "maintain_capacity";

export type ConstraintType =
  | "proactive_none"
  | "symptomatic"
  | "recent_or_returning"
  | "prior_recurrent"
  | "clinician_restricted";

export type Laterality = "bilateral" | "left" | "right" | "unspecified";

/** Evidence routes stay separate; a sport row never becomes general evidence by omission. */
export type EvidenceRoute = "general" | "presentation_matched" | "sport_specific";

/** The action the plan takes, from the adopted "smallest useful change" rule. */
export type PlanActionKind = "add" | "replace" | "modify" | "monitor" | "measure" | "withhold";

/** Uncertainty maps to posture, never to a changed estimate. */
export type ActionPosture = "ordinary_action" | "qualified_action" | "measurement_first" | "withhold";

export type PlanResultState =
  | "resolved"
  | "insufficient_evidence"
  | "partial_evidence"
  | "stale"
  | "withheld";

/**
 * Builds a context from a stored mode and sport ID. A sport ID outside sport mode, or a missing
 * one inside it, is a contract violation rather than something to silently repair — the
 * "default every user to a synthetic sport" anti-pattern starts with a lenient reader.
 */
export function resolveSportContext(mode: SportContextMode, primarySportId: string | null): SportContext {
  if (mode === "sport") {
    if (!primarySportId) throw new Error("SPORT_REQUIRED_FOR_SPORT_MODE");
    return { mode, primarySportId };
  }
  if (primarySportId) throw new Error("SPORT_NOT_ALLOWED_FOR_MODE");
  return { mode, primarySportId: null };
}

/** Sport-derived demands, transfer claims and benchmarks are available only in sport mode. */
export function sportDerivedOutputAvailable(context: SportContext): boolean {
  return context.mode === "sport";
}

/**
 * Chooses the applicable evidence route, in specificity order, for the athlete's context.
 * A sport-specific route is only ever applicable to the same sport; returning `null` is the
 * honest answer and drives the insufficiency state, which is what `no_fake_sport_fallback`
 * requires instead of borrowing an arbitrary sport row.
 */
export function selectEvidenceRoute(
  context: SportContext,
  available: { route: EvidenceRoute; sportId?: string | null; presentationMatched?: boolean }[]
): EvidenceRoute | null {
  const sportRoute = available.find(
    entry => entry.route === "sport_specific" && context.mode === "sport" && entry.sportId === context.primarySportId
  );
  if (sportRoute) return "sport_specific";
  if (available.some(entry => entry.route === "presentation_matched")) return "presentation_matched";
  if (available.some(entry => entry.route === "general")) return "general";
  return null;
}

export type PostureInput = {
  confidence: number | null;
  /** Severe, rapidly worsening, neurologic/systemic, postoperative, or clinician-restricted. */
  highConsequenceState: boolean;
  /** No reviewed route covers this target/presentation combination. */
  outOfDomain: boolean;
  /** False when the uncertainty cannot change which action the athlete would take. */
  uncertaintyIsMaterial: boolean;
};

/**
 * Maps confidence to action posture. High-consequence and out-of-domain states withhold
 * automated progression; immaterial uncertainty adds no friction at all.
 */
export function resolveActionPosture(input: PostureInput): ActionPosture {
  if (input.highConsequenceState || input.outOfDomain) return "withhold";
  if (!input.uncertaintyIsMaterial) return "ordinary_action";
  if (input.confidence === null) return "measurement_first";
  if (input.confidence >= 0.75) return "ordinary_action";
  if (input.confidence >= 0.5) return "qualified_action";
  return "measurement_first";
}

export type CoverageInput = {
  /** Credited exposure already present in the current stack, as a 0–1 adequacy fraction. */
  creditedCoverage: number;
  posture: ActionPosture;
  /** A compatible exercise exists that could replace an incompatible one. */
  substitutionAvailable: boolean;
};

/**
 * Picks the smallest useful action. Adequate compatible work is credited before anything is
 * added, so a well-covered target yields `monitor` rather than redundant volume.
 */
export function selectPlanAction(input: CoverageInput): PlanActionKind {
  if (input.posture === "withhold") return "withhold";
  if (input.posture === "measurement_first") return "measure";
  if (input.creditedCoverage >= 0.8) return "monitor";
  if (input.substitutionAvailable) return "replace";
  if (input.creditedCoverage >= 0.4) return "modify";
  return "add";
}

/** Copy guard: a constraint is reported, never inferred from a chosen target. */
export function constraintFromFocusArea(): never {
  throw new Error("CONSTRAINT_MUST_BE_REPORTED_NOT_INFERRED");
}

/* ------------------------------------------------------------------------ *
 * Selectable targets and the athlete's own selections.
 * ------------------------------------------------------------------------ */

export type ResilienceTargetType = "body_region" | "functional_task" | "movement_pattern" | "tissue_system";

export type ResilienceTargetCatalogEntry = {
  targetId: string;
  targetKey: string;
  name: string;
  region: string;
  targetType: ResilienceTargetType;
  lateralitySupported: boolean;
  /** Empty means no reviewed route covers this target yet, which is the insufficiency signal. */
  supportedRoutes: EvidenceRoute[];
};

export type ResilienceTargetCatalog = {
  status: "connected" | "unavailable";
  targets: ResilienceTargetCatalogEntry[];
  boundary: string;
};

export type AthleteFocusSelection = {
  targetKey: string;
  intent: FocusIntent;
  laterality: Laterality;
};

export type AthleteConstraintSelection = {
  targetKey: string;
  constraintType: ConstraintType;
  laterality: Laterality;
  /** What the athlete says a clinician told them. Stored as their report, never as our finding. */
  clinicianRestriction?: string;
};

/** Reported states that stop automated progression. Not a diagnosis, and not a severity score. */
export type HighConsequenceSignal =
  | "severe_or_worsening"
  | "neurological_or_systemic"
  | "postoperative"
  | "clinician_restricted";

export const highConsequenceSignals: { value: HighConsequenceSignal; label: string }[] = [
  { value: "severe_or_worsening", label: "It is severe, or getting worse quickly" },
  { value: "neurological_or_systemic", label: "There is numbness, weakness, or I feel unwell with it" },
  { value: "postoperative", label: "I have had surgery there recently" },
  { value: "clinician_restricted", label: "A clinician has told me to limit something" },
];

/**
 * Screening stays proportional: a proactive target with nothing reported asks nothing further,
 * and only a reported high-consequence signal withholds. A constraint on its own qualifies the
 * plan; it does not escalate. Nothing here infers a condition from the answers.
 */
export function resolveConstraintPosture(
  constraintType: ConstraintType,
  reportedSignals: HighConsequenceSignal[] = []
): ActionPosture {
  if (reportedSignals.length > 0) return "withhold";
  if (constraintType === "clinician_restricted") return "withhold";
  if (constraintType === "proactive_none") return "ordinary_action";
  return "qualified_action";
}

/** A target the athlete can act on only once a reviewed route exists for it. */
export function targetHasReviewedRoute(entry: ResilienceTargetCatalogEntry): boolean {
  return entry.supportedRoutes.length > 0;
}

/**
 * Which routes this athlete could actually use. A sport_specific route is unusable outside
 * sport mode, so a target whose only route is sport-specific reads as uncovered for a
 * general-mode athlete rather than appearing available and then failing.
 */
export function applicableRoutesForContext(
  entry: ResilienceTargetCatalogEntry,
  context: SportContext
): EvidenceRoute[] {
  return entry.supportedRoutes.filter(route => route !== "sport_specific" || context.mode === "sport");
}
