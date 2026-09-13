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

describe("parseNormsDeclaration", () => {
  it("maps a complete powerlifting declaration onto the registry's population wording", () => {
    expect(parseNormsDeclaration(JSON.stringify(powerliftingDeclaration))).toEqual({
      trainingStatus: "strength-trained competitive",
      confirmedContexts: ["powerlifting; drug-tested unequipped competition"],
    });
  });

  it("maps a complete pre-training declaration without inventing a competition context", () => {
    expect(parseNormsDeclaration(JSON.stringify(piperDeclaration))).toEqual({
      trainingStatus: "novice-to-intermediate; pre-training",
      confirmedContexts: [],
    });
  });

  it("yields nothing when any required confirmation is missing", () => {
    for (const field of declarationRules[0].requiredConfirmations) {
      const partial = { ...powerliftingDeclaration, [field]: false };
      expect(parseNormsDeclaration(JSON.stringify(partial)), `${field} withheld`).toEqual({
        trainingStatus: null,
        confirmedContexts: [],
      });
    }
  });

  it("yields nothing for absent, malformed, or unknown declarations", () => {
    const empty = { trainingStatus: null, confirmedContexts: [] };
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
    expect(parseNormsDeclaration(JSON.stringify(coerced))).toEqual({
      trainingStatus: null,
      confirmedContexts: [],
    });
  });
});
