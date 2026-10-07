import { describe, expect, it } from "vitest";
import { glossaryGroups, normaliseQuery, searchGlossary, type GlossaryEntry } from "./glossarySearch";
import { trainingGlossary } from "./trainingGlossary";
import { trainingTerms } from "./trainingTerms";
import { searchEverything } from "./universalSearch";

const entry = (id: string, group: GlossaryEntry["group"], term: string, aliases: string[], meaning = "A term.", inApp = "Used here."): GlossaryEntry => ({ id, group, term, aliases, meaning, example: "Example.", inApp });
const entries: GlossaryEntry[] = [
  entry("e1rm", "Strength", "Estimated 1RM (e1RM)", ["e1rm", "estimated one-rep max", "1rm estimate"], "The most you could lift once, estimated from a set of several reps."),
  entry("measured-1rm", "Strength", "Measured 1RM", ["1rm", "one-rep max", "max single"]),
  entry("rep", "Prescription", "Repetition", ["rep", "reps", "repetitions"]),
  entry("rep-range", "Prescription", "Rep range", ["8-12", "range of reps"]),
  entry("rpe", "Effort", "RPE", ["rating of perceived exertion", "effort rating"], "How hard a set felt, on a 1-10 scale.", "Shown as RPE 8 next to a prescription."),
];

/** Utility brief §7 (GL04, GL11). */
describe("searching training terms", () => {
  it("lists everything, grouped in a fixed order, when the query is empty", () => {
    expect(searchGlossary(entries, "").map((item) => item.id)).toEqual(["rep-range", "rep", "rpe", "e1rm", "measured-1rm"]);
    expect(searchGlossary(entries, "   ").map((item) => item.id)).toEqual(["rep-range", "rep", "rpe", "e1rm", "measured-1rm"]);
  });

  it("finds a term by its aliases: e1RM, estimated one-rep max, reps, repetitions", () => {
    expect(searchGlossary(entries, "e1RM")[0].id).toBe("e1rm");
    expect(searchGlossary(entries, "estimated one-rep max")[0].id).toBe("e1rm");
    expect(searchGlossary(entries, "reps")[0].id).toBe("rep");
    expect(searchGlossary(entries, "Repetitions")[0].id).toBe("rep");
    expect(searchGlossary(entries, "1rm").map((item) => item.id).slice(0, 2)).toEqual(["measured-1rm", "e1rm"]);
  });

  it("ranks the name before the explanation, and is the same every time", () => {
    const first = searchGlossary(entries, "rep").map((item) => item.id);
    expect(first[0]).toBe("rep");
    expect(first).toEqual(searchGlossary(entries, "rep").map((item) => item.id));
    // "exertion" is only in RPE's alias; "felt" only in its meaning.
    expect(searchGlossary(entries, "exertion").map((item) => item.id)).toEqual(["rpe"]);
    expect(searchGlossary(entries, "felt").map((item) => item.id)).toEqual(["rpe"]);
  });

  it("returns nothing for a query that matches nothing", () => {
    expect(searchGlossary(entries, "zzqx")).toEqual([]);
    expect(normaliseQuery("  E1RM? ")).toBe("e1rm");
  });
});

/** Utility brief §7 (GL02, GL03, GL05, GL09): the published terms. */
describe("the Training terms content", () => {
  it("gives every term a stable id, a meaning, an example and how the app uses it, with any numbers marked illustrative", () => {
    expect(trainingGlossary).toHaveLength(trainingTerms.length);
    expect(new Set(trainingGlossary.map((entry) => entry.id)).size).toBe(trainingGlossary.length);
    for (const entry of trainingGlossary) {
      expect(glossaryGroups).toContain(entry.group);
      expect(entry.aliases.length, entry.id).toBeGreaterThan(0);
      for (const field of [entry.meaning, entry.example, entry.inApp]) expect(field?.trim().length, entry.id).toBeGreaterThan(10);
      expect(entry.example, entry.id).toMatch(/^Example: /);
      // Numbers in an example illustrate the meaning; they are never a prescription.
      if (/\d/.test(entry.example)) expect(entry.example, entry.id).toMatch(/\(Illustrative[.;][^)]*\)$/);
    }
  });

  it("covers each group the brief lists", () => {
    for (const group of glossaryGroups) expect(trainingGlossary.some((entry) => entry.group === group), group).toBe(true);
    for (const id of ["set", "repetition", "rep-range", "working-set", "warm-up-set", "rest-interval", "tempo", "range-of-motion", "planned-vs-actual", "skipped-vs-not-recorded", "drop-set", "per-side", "assistance", "load-convention", "rpe", "rir", "prescribed-vs-recorded-effort", "direct-sets", "supporting-exposure", "movement-pattern-coverage", "calendar-vs-plan-week", "e1rm", "measured-1rm", "percentile", "comparison-group", "rank-coverage", "unavailable-comparison", "muscle-role", "movement-support-vs-transfer"]) {
      expect(trainingGlossary.some((entry) => entry.id === id), id).toBe(true);
    }
  });

  it("is found term by term from universal search, by name or alias", () => {
    const firstTerm = (query: string) => searchEverything(query).flatMap((group) => group.results).find((result) => result.type === "term");
    expect(firstTerm("RIR")?.id).toBe("rir");
    expect(firstTerm("e1rm")?.id).toBe("e1rm");
    expect(firstTerm("estimated one-rep max")?.id).toBe("e1rm");
    expect(firstTerm("reps")?.id).toBe("repetition");
    expect(firstTerm("RIR")?.context).toBe("Training term · Effort");
    // The list as a whole is still a place in the app.
    expect(searchEverything("glossary").flatMap((group) => group.results)[0]).toMatchObject({ type: "destination", id: "tool:glossary" });
  });
});
