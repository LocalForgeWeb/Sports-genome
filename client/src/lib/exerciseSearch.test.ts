import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { matchesAreGuesses, rankExerciseMatches, searchExercises, suggestExerciseNames } from "./exerciseSearch";

const names = (query: string) => searchExercises(exercises, query).map((exercise) => exercise.name);
const first = (query: string) => names(query)[0];

/**
 * Reported from the gym, in the picker: "reardelt fly" found nothing because the
 * catalog writes "Rear-Delt Fly"; "trap bar" found nothing because it writes
 * "T-Bar"; a letter out of place found nothing at all. Every search box in the
 * app asked for an exact substring of the canonical spelling.
 */
describe("finding an exercise by whatever it is called", () => {
  it("ignores spacing and hyphens: reardelt is Rear-Delt", () => {
    const found = names("reardelt fly");
    expect(found).toContain("Bent-Over Rear-Delt Fly");
    expect(found).toContain("Cable Rear-Delt Fly");
    expect(names("rear delt")).toContain("Bent-Over Rear-Delt Fly");
    expect(names("rear-delt")).toContain("Cable Rear-Delt Fly");
  });

  it("finds the Trap-Bar lifts for 'trap bar', with the T-bar rows athletes also mean by it behind them", () => {
    // "trap bar" is not a substring of "trap-bar", so the exact-substring search
    // returned nothing for lifts the catalog has under that very name.
    const found = names("trap bar");
    expect(found[0]).toMatch(/Trap-Bar/);
    expect(found.filter((name) => /Trap-Bar/.test(name)).length).toBeGreaterThan(0);
    expect(found).toEqual(expect.arrayContaining(["Chest-Supported T-Bar Row", "Landmine T-Bar Row"]));
    expect(found.indexOf("Chest-Supported T-Bar Row")).toBeGreaterThan(found.findIndex((name) => /Trap-Bar/.test(name)));
    expect(names("hex bar")[0]).toMatch(/Trap-Bar|T-Bar/);
    expect(names("t bar")[0]).toMatch(/T-Bar Row/);
    expect(names("tbar")[0]).toMatch(/T-Bar Row/);
  });

  it("tolerates a letter or two out of place, without letting it outrank the real name", () => {
    expect(first("romanain deadlift")).toBe("Romanian Deadlift");
    expect(first("bulgarain split squat")).toBe("Bulgarian Split Squat");
    expect(names("shrugg")).toContain("Barbell Shrug");
    // The real spelling still wins over a fuzzy neighbour.
    expect(first("romanian deadlift")).toBe("Romanian Deadlift");
  });

  it("takes the words in any order and expands the usual shorthand", () => {
    expect(names("fly rear delt")).toContain("Bent-Over Rear-Delt Fly");
    expect(first("db shrug")).toBe("Dumbbell Shrug");
    expect(first("ohp")).toBe("Barbell Overhead Press");
    expect(first("rdl")).toBe("Romanian Deadlift");
    expect(names("skullcrusher")).toContain("Dumbbell Skull Crusher");
    expect(names("pullup")).toContain("Pull-Up");
  });

  it("puts the exact name first and a prefix ahead of a mere mention", () => {
    expect(first("Face Pull")).toBe("Face Pull");
    expect(first("front squat")).toBe("Front Squat");
    // "squat" appears inside dozens of names; the shortest exact-word match leads.
    expect(names("squat").slice(0, 3).every((name) => /squat/i.test(name))).toBe(true);
  });

  it("says when every result is a guess, and stays quiet when nothing is even close", () => {
    expect(matchesAreGuesses(rankExerciseMatches(exercises, "romanain"))).toBe(true);
    expect(matchesAreGuesses(rankExerciseMatches(exercises, "romanian"))).toBe(false);
    expect(names("zzqxv")).toEqual([]);
  });

  it("offers the nearest names when nothing matched, reaching further than matching does", () => {
    // Two letters missing from each word is past what matching accepts, and
    // exactly what a suggestion is for.
    expect(names("rmnian dedlft")).toEqual([]);
    // Near both words typed, so it leads - ahead of anything near only one.
    expect(suggestExerciseNames(exercises, "rmnian dedlft")[0]).toBe("Romanian Deadlift");
    expect(suggestExerciseNames(exercises, "zzqxv")).toEqual([]);
  });

  it("keeps a caller's own order among equal matches and returns everything for no query", () => {
    const list = [...exercises].slice(0, 12);
    expect(searchExercises(list, "")).toEqual(list);
    expect(searchExercises(list, "   ")).toEqual(list);
    const unfiltered = rankExerciseMatches(list, "");
    expect(unfiltered.every((match) => match.kind === "unfiltered" && match.score === 0)).toBe(true);
  });
});

/**
 * One matcher, everywhere a name is typed. These are the four boxes that used
 * to each ask for an exact substring; none of them may go back to it.
 */
describe("every exercise search box uses the same matcher", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

  it("the day picker", () => {
    const source = read("../components/DayExercisePicker.tsx");
    expect(source).toContain("rankExerciseMatches(candidates, query)");
    expect(source).not.toContain(".toLowerCase().includes(normalizedQuery)");
  });

  it("the Plan page's finder", () => {
    const source = read("../pages/Home.tsx");
    expect(source).toContain("searchExercises(exercises, catalogQuery)");
    expect(source).not.toMatch(/exercise\.primaryMuscles\.join\(" "\)}`\.toLowerCase\(\)\.includes\(catalogQuery/);
  });

  it("the lift log", () => {
    const source = read("../components/StrengthGenomePanel.tsx");
    expect(source).toContain("searchExercises(exercises, exerciseSearch)");
    expect(source).not.toContain("exercise.name.toLowerCase().includes(exerciseSearch");
  });

  it("the Catalog", () => {
    const source = read("./catalogDiscovery.ts");
    expect(source).toContain("return searchExercises(pool, filters.query);");
    expect(source).not.toContain("searchable.includes(query)");
  });

  it("and the universal search shares its aliases rather than keeping a second list", () => {
    const source = read("./universalSearch.ts");
    expect(source).toContain('import { EXERCISE_ALIASES, normalizeSearchText, withinEditDistance } from "./exerciseSearch";');
    expect(source).not.toContain("const EXERCISE_ALIASES");
  });
});
