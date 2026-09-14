import { describe, expect, it } from "vitest";
import { declarationRules, parseNormsDeclaration } from "../shared/normsDeclarations";

const powerliftingDeclaration = {
  referenceId: "van_den_hoek_2024_powerlifting_relative_strength",
  drugTestedCompetitionConfirmed: true,
  unequippedCompetitionConfirmed: true,
  maximumSuccessfulLiftConfirmed: true,
};

const piperDeclaration = {
  referenceId: "piper_2021_preacher_curl_10rm",
  collegeStudentConfirmed: true,
  preTrainingConfirmed: true,
  exactProtocolConfirmed: true,
  directlyObservedConfirmed: true,
};

/** Nothing resolved: no population, no declared identity, no measured maximum. */
const emptyContext = {
  trainingStatus: null,
  confirmedContexts: [],
  declaredSex: null,
  declaredAgeYears: null,
  declaresMeasuredMaximum: false,
};

describe("parseNormsDeclaration", () => {
  it("maps a complete powerlifting declaration onto the registry's population wording", () => {
    expect(parseNormsDeclaration(JSON.stringify(powerliftingDeclaration))).toEqual({
      trainingStatus: "strength-trained competitive",
      confirmedContexts: ["powerlifting; drug-tested unequipped competition"],
      declaredSex: null,
      declaredAgeYears: null,
      declaresMeasuredMaximum: true,
    });
  });

  it("maps a complete pre-training declaration without inventing a competition context", () => {
    expect(parseNormsDeclaration(JSON.stringify(piperDeclaration))).toEqual({
      trainingStatus: "novice-to-intermediate; pre-training",
      confirmedContexts: [],
      declaredSex: null,
      declaredAgeYears: null,
      // A 10RM protocol is not a measured maximum, so it never feeds a 1RM reference.
      declaresMeasuredMaximum: false,
    });
  });

  it("carries the sex and age declared beside this specific test", () => {
    const declared = { ...powerliftingDeclaration, sex: "female", ageYears: 29 };
    expect(parseNormsDeclaration(JSON.stringify(declared))).toMatchObject({
      declaredSex: "female",
      declaredAgeYears: 29,
    });
  });

  it("ignores a sex or age the registry cannot compare against", () => {
    const unusable = { ...powerliftingDeclaration, sex: "prefer_not_to_say", ageYears: 0 };
    expect(parseNormsDeclaration(JSON.stringify(unusable))).toMatchObject({
      declaredSex: null,
      declaredAgeYears: null,
    });
  });

  it("yields nothing when any required confirmation is missing", () => {
    for (const field of declarationRules[0].requiredConfirmations) {
      const partial = { ...powerliftingDeclaration, [field]: false };
      expect(parseNormsDeclaration(JSON.stringify(partial)), `${field} withheld`).toEqual(emptyContext);
    }
  });

  it("yields nothing for absent, malformed, or unknown declarations", () => {
    const empty = emptyContext;
    expect(parseNormsDeclaration(null)).toEqual(empty);
    expect(parseNormsDeclaration("")).toEqual(empty);
    expect(parseNormsDeclaration("{not json")).toEqual(empty);
    expect(parseNormsDeclaration("[]")).toEqual(empty);
    expect(parseNormsDeclaration(JSON.stringify({ referenceId: "some_unreviewed_source" }))).toEqual(empty);
    // A declaration with the right flags but no reference identity must not borrow
    // another source's population.
    expect(parseNormsDeclaration(JSON.stringify({ drugTestedCompetitionConfirmed: true }))).toEqual(empty);
  });

  it("treats a truthy-but-not-true confirmation as unconfirmed", () => {
    const coerced = { ...powerliftingDeclaration, maximumSuccessfulLiftConfirmed: "yes" };
    expect(parseNormsDeclaration(JSON.stringify(coerced))).toEqual(emptyContext);
  });
});
