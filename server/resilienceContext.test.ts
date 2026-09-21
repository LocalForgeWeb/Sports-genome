import { describe, expect, it } from "vitest";
import {
  constraintFromFocusArea,
  resolveActionPosture,
  resolveSportContext,
  selectEvidenceRoute,
  selectPlanAction,
  sportDerivedOutputAvailable,
} from "../shared/resilienceContext";

/**
 * Coverage for the Musculoskeletal Capacity & Injury Resilience (v2) shared semantics.
 * Each block names the canonical requirement or blocking acceptance key it protects.
 */

describe("sport is optional context, never a fake sport", () => {
  // requirement: manual_focus_selection - "Never require a sport."
  it("accepts general and undecided as real states with no sport", () => {
    expect(resolveSportContext("general", null)).toEqual({ mode: "general", primarySportId: null });
    expect(resolveSportContext("undecided", null)).toEqual({ mode: "undecided", primarySportId: null });
  });

  it("keeps sport mode honest in both directions", () => {
    expect(resolveSportContext("sport", "wrestling")).toEqual({ mode: "sport", primarySportId: "wrestling" });
    expect(() => resolveSportContext("sport", null)).toThrow("SPORT_REQUIRED_FOR_SPORT_MODE");
    // A sport ID carried alongside general mode is how a synthetic sport creeps in.
    expect(() => resolveSportContext("general", "wrestling")).toThrow("SPORT_NOT_ALLOWED_FOR_MODE");
  });

  it("gates sport-derived output without blocking general training", () => {
    expect(sportDerivedOutputAvailable(resolveSportContext("sport", "soccer"))).toBe(true);
    expect(sportDerivedOutputAvailable(resolveSportContext("general", null))).toBe(false);
    expect(sportDerivedOutputAvailable(resolveSportContext("undecided", null))).toBe(false);
  });
});

describe("evidence routes stay separate", () => {
  // blocking acceptance: no_fake_sport_fallback
  const generalContext = resolveSportContext("general", null);
  const wrestler = resolveSportContext("sport", "wrestling");

  it("returns nothing rather than borrowing a sport row for a general user", () => {
    expect(selectEvidenceRoute(generalContext, [{ route: "sport_specific", sportId: "wrestling" }])).toBeNull();
  });

  it("returns nothing when no route exists at all", () => {
    // The live database currently has zero sport-agnostic routes, so this is the
    // expected launch behaviour for general mode, not an edge case.
    expect(selectEvidenceRoute(generalContext, [])).toBeNull();
  });

  it("prefers the most specific applicable route in sport mode", () => {
    expect(
      selectEvidenceRoute(wrestler, [
        { route: "general" },
        { route: "presentation_matched" },
        { route: "sport_specific", sportId: "wrestling" },
      ])
    ).toBe("sport_specific");
  });

  it("does not apply another sport's row to this athlete", () => {
    expect(
      selectEvidenceRoute(wrestler, [{ route: "sport_specific", sportId: "soccer" }, { route: "general" }])
    ).toBe("general");
  });

  it("offers general and presentation-matched routes to a general-mode user", () => {
    expect(selectEvidenceRoute(generalContext, [{ route: "general" }])).toBe("general");
    expect(
      selectEvidenceRoute(generalContext, [{ route: "general" }, { route: "presentation_matched" }])
    ).toBe("presentation_matched");
  });
});

describe("uncertainty maps to posture", () => {
  // requirement: scope_escalation_boundary; blocking acceptance: high_consequence_state_withholds
  const base = { confidence: 0.9, highConsequenceState: false, outOfDomain: false, uncertaintyIsMaterial: true };

  it("withholds automated progression for a high-consequence state", () => {
    expect(resolveActionPosture({ ...base, highConsequenceState: true })).toBe("withhold");
  });

  it("withholds when no reviewed route covers the request", () => {
    expect(resolveActionPosture({ ...base, outOfDomain: true })).toBe("withhold");
  });

  it("adds no friction when the uncertainty cannot change the decision", () => {
    expect(resolveActionPosture({ ...base, confidence: 0.1, uncertaintyIsMaterial: false })).toBe("ordinary_action");
  });

  it("steps down through qualified action to measurement first", () => {
    expect(resolveActionPosture({ ...base, confidence: 0.9 })).toBe("ordinary_action");
    expect(resolveActionPosture({ ...base, confidence: 0.6 })).toBe("qualified_action");
    expect(resolveActionPosture({ ...base, confidence: 0.2 })).toBe("measurement_first");
    expect(resolveActionPosture({ ...base, confidence: null })).toBe("measurement_first");
  });

  it("keeps a low-risk proactive goal out of the maximal warning gate", () => {
    // An ordinary capacity goal with good evidence must not be escalated.
    expect(resolveActionPosture({ confidence: 0.8, highConsequenceState: false, outOfDomain: false, uncertaintyIsMaterial: true }))
      .toBe("ordinary_action");
  });
});

describe("the plan makes the smallest useful change", () => {
  // requirements: stack_compatibility, goal_constraint_priority_synthesis
  // blocking acceptance: existing_resilience_work_is_credited, smallest_useful_change_preserves_stack
  const base = { creditedCoverage: 0, posture: "ordinary_action" as const, substitutionAvailable: false };

  it("credits adequate existing work instead of adding volume", () => {
    expect(selectPlanAction({ ...base, creditedCoverage: 0.9 })).toBe("monitor");
  });

  it("prefers a substitution over new volume when one is compatible", () => {
    expect(selectPlanAction({ ...base, creditedCoverage: 0.3, substitutionAvailable: true })).toBe("replace");
  });

  it("modifies partial coverage rather than starting over", () => {
    expect(selectPlanAction({ ...base, creditedCoverage: 0.5 })).toBe("modify");
  });

  it("adds only when nothing in the stack covers the target", () => {
    expect(selectPlanAction(base)).toBe("add");
  });

  it("never prescribes training under a withhold or measurement-first posture", () => {
    expect(selectPlanAction({ ...base, posture: "withhold" })).toBe("withhold");
    expect(selectPlanAction({ ...base, posture: "measurement_first" })).toBe("measure");
    // Even with a substitution ready, safety resolves first.
    expect(selectPlanAction({ creditedCoverage: 0, posture: "withhold", substitutionAvailable: true })).toBe("withhold");
  });
});

describe("targets are not constraints", () => {
  // requirement: manual_focus_selection - proactive focus must never imply a symptom.
  it("refuses to derive a constraint from a chosen focus area", () => {
    expect(() => constraintFromFocusArea()).toThrow("CONSTRAINT_MUST_BE_REPORTED_NOT_INFERRED");
  });
});
