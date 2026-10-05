import { describe, expect, it } from "vitest";
import { buildMovementReasoning, getSportDemandModel, getSportModifiers } from "./hierarchicalSportModel";
import { sportMovementProfiles } from "./sportMovementDatabase";

describe("hierarchical sport-to-program model", () => {
  /**
   * 5 October 2026: rotational power is a sport-level demand wherever the sport's own movement
   * record is built on throws, strikes, swings, shots or kicks, and nowhere the record's
   * rotation is a body roll or one event's alone. The Plan's analysis lists a stack against
   * sport-level demands only, so this is what decides whether "Rotational power" is asked for.
   */
  it("lists rotational power at sport level for the sports whose actions rotate to produce force", () => {
    const asks = (sportId: string) => getSportDemandModel(sportId).demands.find((item) => item.key === "rotationalPower")?.evidenceType;
    for (const sportId of ["wrestling", "mma", "ice-hockey", "volleyball", "soccer", "baseball", "tennis", "boxing", "lacrosse", "golf"]) {
      expect(asks(sportId), sportId).toBe("literature-derived");
    }
    for (const sportId of ["swimming", "rowing", "gymnastics", "skiing", "olympic-weightlifting", "basketball", "rugby", "brazilian-jiu-jitsu"]) {
      expect(asks(sportId), sportId).toBe("model-estimated");
    }
    // Event- and role-scoped: lifted by the modifier, not asked of the whole sport.
    expect(asks("track-and-field")).toBe("model-estimated");
    expect(getSportDemandModel("track-and-field", "throws").demands.find((item) => item.key === "rotationalPower")?.evidenceType).toBe("expert-inference");
    expect(asks("american-football")).toBe("model-estimated");
    expect(getSportDemandModel("american-football", "qb").demands.find((item) => item.key === "rotationalPower")?.evidenceType).toBe("expert-inference");
  });

  it("keeps each sport's first four priorities where they were before rotational power joined its register", () => {
    // Sport-level demands share one score and sort stably in the register's key order, so the
    // added key cannot displace the priorities Home and the recommendations already show.
    // These four-key lists were read from the register the day before the change.
    const top = (sportId: string) => getSportDemandModel(sportId).demands.slice(0, 4).map((item) => item.key);
    expect(top("wrestling")).toEqual(["aerobicCapacity", "anaerobicCapacity", "maxStrength", "power"]);
    expect(top("mma")).toEqual(["anaerobicCapacity", "maxStrength", "power", "isometricStrength"]);
    expect(top("ice-hockey")).toEqual(["anaerobicCapacity", "repeatSprint", "power", "deceleration"]);
    expect(top("volleyball")).toEqual(["power", "deceleration", "plyometricAbility", "elasticStrength"]);
    expect(top("soccer")).toEqual(["aerobicCapacity", "repeatSprint", "speed", "acceleration"]);
  });

  it("provides the specified style modifiers without treating them as a separate sport", () => {
    expect(getSportModifiers("wrestling").map((item) => item.id)).toContain("greco-roman");
    const model = getSportDemandModel("wrestling", "greco-roman");
    expect(model.selectedModifier?.label).toBe("Greco-Roman");
    expect(model.evidenceBoundary).toMatch(/planning comparisons/i);
  });

  it("builds a complete sport-to-program reasoning path for an action", () => {
    const movement = sportMovementProfiles.find((item) => item.sportId === "soccer");
    expect(movement).toBeTruthy();
    if (!movement) return;
    const reasoning = buildMovementReasoning(movement, "field-player");
    expect(reasoning.sport).toBe("Soccer");
    expect(reasoning.biomechanics.length).toBeGreaterThan(10);
    expect(reasoning.physicalQualities.length).toBeGreaterThan(2);
    expect(reasoning.physiologicalDemands.length).toBeGreaterThan(2);
    expect(reasoning.modifierEvidenceScope).toMatch(/reviewed/i);
    expect(reasoning.modifierEvidenceSources.join(" ")).toMatch(/soccer evidence inventory/i);
    expect(reasoning.modality).toMatch(/gym modalities/i);
    expect(reasoning.exerciseRole).toMatch(/transfer similarity/i);
    expect(reasoning.programming).toMatch(/goal/i);
    expect(reasoning.exerciseBoundary).toBeTruthy();
  });

  it("includes expanded football, hockey, track, and swimming contexts", () => {
    expect(getSportModifiers("american-football").map((item) => item.id)).toContain("lb-te");
    expect(getSportModifiers("ice-hockey").map((item) => item.id)).toContain("defense");
    expect(getSportModifiers("track-and-field").map((item) => item.id)).toContain("hurdles");
    expect(getSportModifiers("swimming").map((item) => item.id)).toEqual(expect.arrayContaining(["middle-distance", "distance", "im"]));
  });

  it("makes a role or event adjustment visible as a transparent hierarchy difference", () => {
    const general = getSportDemandModel("ice-hockey");
    const goalie = getSportDemandModel("ice-hockey", "goalie");
    const generalMobility = general.demands.find((item) => item.key === "mobility")?.score;
    const goalieMobility = goalie.demands.find((item) => item.key === "mobility")?.score;
    expect(goalieMobility).toBeGreaterThan(generalMobility || 0);
    expect(goalie.demands.find((item) => item.key === "mobility")?.evidenceType).toBe("expert-inference");
    expect(goalie.selectedModifier?.evidenceSources?.join(" ")).toMatch(/Wearable-technology/i);
  });

  it("attaches direct source records to expanded football, hockey, track, and swimming modifiers", () => {
    expect(getSportDemandModel("american-football", "wr-db").selectedModifier?.evidenceSources?.join(" ")).toMatch(/NFL positional player-tracking/i);
    expect(getSportDemandModel("ice-hockey", "defense").selectedModifier?.evidenceSources?.join(" ")).toMatch(/high-threshold decelerations/i);
    expect(getSportDemandModel("track-and-field", "sprint").selectedModifier?.evidenceSources?.join(" ")).toMatch(/109-study/i);
    expect(getSportDemandModel("swimming", "freestyle").selectedModifier?.evidenceSources?.join(" ")).toMatch(/front-crawl/i);
  });

  it("attaches concrete reviewed references to expanded track and swimming modifiers", () => {
    expect(getSportDemandModel("track-and-field", "sprint").selectedModifier?.evidenceSources?.join(" ")).toMatch(/109-study/i);
    expect(getSportDemandModel("swimming", "freestyle").selectedModifier?.evidenceSources?.join(" ")).toMatch(/Kwok/i);
  });

  it("adds Batch 3 source context without flattening sport, role, style, or competition differences", () => {
    expect(getSportDemandModel("wrestling", "freestyle").demands.map((item) => item.key)).toContain("aerobicCapacity");
    expect(getSportDemandModel("basketball", "guard").selectedModifier?.evidenceSources?.join(" ")).toMatch(/29039018/);
    expect(getSportDemandModel("soccer", "field-player").selectedModifier?.evidenceSources?.join(" ")).toMatch(/29199782/);
    expect(getSportDemandModel("swimming", "freestyle").selectedModifier?.evidenceSources?.join(" ")).toMatch(/26839618/);
    expect(getSportDemandModel("american-football", "wr-db").selectedModifier?.evidenceSources?.join(" ")).toMatch(/37050597/);
    expect(getSportDemandModel("rugby", "forward").selectedModifier?.evidenceSources?.join(" ")).toMatch(/41359906/);
  });

  it("keeps newly separated basketball forward and center contexts transparent and source-bounded", () => {
    expect(getSportModifiers("basketball").map((item) => item.id)).toEqual(expect.arrayContaining(["forward", "center"]));
    expect(getSportDemandModel("basketball", "forward").selectedModifier?.evidenceSources?.join(" ")).toMatch(/40453900/);
    expect(getSportDemandModel("basketball", "center").selectedModifier?.evidenceBoundary).toMatch(/group-level/i);
  });

  it("gives every configured modifier an explicit evidence scope, source record, and planning boundary", () => {
    const sportIds = Array.from(new Set(sportMovementProfiles.map((movement) => movement.sportId)));
    sportIds.forEach((sportId) => {
      getSportModifiers(sportId).forEach((modifier) => {
        expect(modifier.evidenceScope).toMatch(/reviewed|sport-level/i);
        expect(modifier.evidenceSources?.length).toBeGreaterThan(0);
        expect(modifier.evidenceBoundary).toMatch(/planning|not|contextual|descriptive/i);
      });
    });
  });
});
