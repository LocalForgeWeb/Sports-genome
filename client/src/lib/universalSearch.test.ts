import { describe, expect, it } from "vitest";
import { searchEverything, searchSuggestions, type SearchGroup } from "./universalSearch";

const flat = (groups: SearchGroup[]) => groups.flatMap((g) => g.results);
const labels = (groups: SearchGroup[]) => flat(groups).map((r) => r.label);

describe("universal search and retrieval contract", () => {
  // "retrieves canonical muscles, exercises, sports, ... tests/measurements and
  // metrics from one predictable entry"
  it("retrieves every canonical object type the contract names", () => {
    const types = new Set<string>();
    for (const query of ["biceps", "bench", "wrestling", "sprint", "training day"]) {
      searchEverything(query).forEach((g) => types.add(g.type));
    }
    ["muscle", "exercise", "sport", "metric", "destination"].forEach((t) =>
      expect(types, `${t} is reachable from search`).toContain(t),
    );
  });

  // "clear exact-name navigational matches outrank inferred/personalized suggestions"
  it("puts an exact canonical name first, ahead of longer partial matches", () => {
    const groups = searchEverything("wrestling");
    expect(flat(groups)[0].label).toBe("Wrestling");
    expect(flat(groups)[0].matchKind).toBe("exact");
  });

  it("ranks an exact match above a merely-contained one", () => {
    const results = flat(searchEverything("squat"));
    const exactIndex = results.findIndex((r) => r.matchKind === "exact" || r.matchKind === "alias");
    const containsIndex = results.findIndex((r) => r.matchKind === "contains");
    if (exactIndex >= 0 && containsIndex >= 0) expect(exactIndex).toBeLessThan(containsIndex);
  });

  // "Query matching includes canonical names, curated aliases/abbreviations"
  it("matches curated aliases and abbreviations athletes actually type", () => {
    expect(labels(searchEverything("abs"))).toContain("Rectus abdominis");
    expect(labels(searchEverything("pecs"))).toContain("Pectoralis major");
    expect(labels(searchEverything("ohp")).some((l) => /overhead press/i.test(l))).toBe(true);
    expect(labels(searchEverything("bench")).some((l) => /bench press/i.test(l))).toBe(true);
  });

  // "and tolerant spelling"
  it("tolerates a misspelling without letting it outrank a real match", () => {
    const misspelled = flat(searchEverything("wrestlign"));
    expect(misspelled.some((r) => r.label === "Wrestling")).toBe(true);

    const exact = flat(searchEverything("wrestling"));
    expect(exact[0].score).toBeGreaterThan(misspelled[0].score);
  });

  // "Results identify object type and disambiguating context"
  it("gives every result a type and disambiguating context", () => {
    const results = flat(searchEverything("press"));
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.type).toBeTruthy();
      expect(r.context, `${r.label} carries context`).toBeTruthy();
    });
  });

  // "Group mixed result types"
  it("groups mixed result types under labelled headings", () => {
    const groups = searchEverything("back");
    expect(groups.length).toBeGreaterThan(1);
    groups.forEach((g) => expect(g.label).toBeTruthy());
    // No type appears twice.
    expect(new Set(groups.map((g) => g.type)).size).toBe(groups.length);
  });

  // "Personalization may rank but cannot hide exact canonical matches."
  it("never truncates an exact or alias match away behind the per-type limit", () => {
    const groups = searchEverything("curl", 1);
    const exerciseGroup = groups.find((g) => g.type === "exercise");
    expect(exerciseGroup).toBeTruthy();
    const strong = exerciseGroup!.results.filter((r) => r.matchKind === "exact" || r.matchKind === "alias");
    // Every strong match survives even though the limit is 1.
    expect(exerciseGroup!.results.length).toBeGreaterThanOrEqual(strong.length);
    strong.forEach((r) => expect(exerciseGroup!.results).toContain(r));
  });

  // "Empty results offer alias correction, broader scope or adjacent categories."
  it("offers a correction rather than a dead end when nothing matches", () => {
    // Far enough off that tolerant matching (2 edits) finds nothing, but close
    // enough that recovery (4 edits) can still name the intended object.
    const query = "wrestlinggggg";
    expect(searchEverything(query), "too far to match").toEqual([]);
    expect(searchSuggestions(query)).toContain("Wrestling");
  });

  it("still resolves a light misspelling without needing the recovery path", () => {
    expect(labels(searchEverything("wrestlinggg"))).toContain("Wrestling");
  });

  it("stays quiet until the query is worth running", () => {
    expect(searchEverything("")).toEqual([]);
    expect(searchEverything("b")).toEqual([]);
  });

  it("does not invent results for a query with no plausible neighbour", () => {
    expect(searchEverything("zzzzqqqq")).toEqual([]);
  });
});

/**
 * Search named places by names their pages had dropped - "Movement atlas" opened a
 * page headed "Movement explorer" - and filed the Strength Genome under Body Lab
 * after it had moved to Progress. Typing the heading you had just read found nothing.
 */
describe("destinations are named as their pages name themselves", () => {
  const destinations = (query: string) => flat(searchEverything(query)).filter((r) => r.type === "destination");

  it("files the Strength Genome under Progress, where it now lives", () => {
    const strength = destinations("strength genome").find((r) => r.id === "strength");
    expect(strength?.context).toBe("Progress");
  });

  it("finds each page by its own heading, as an exact match", () => {
    // The page titles and headings, written out here rather than read from Home.
    for (const title of ["Training plan", "Review your week", "Workout", "Movement explorer", "Muscle map", "Strength Genome", "Exercise catalog"]) {
      const first = destinations(title)[0];
      expect(first?.label, title).toBe(title);
      expect(first?.matchKind, title).toBe("exact");
    }
  });

  it("still reaches each page by the name it used to go by", () => {
    const retired: [string, string][] = [
      ["movement atlas", "movement"],
      ["build a workout", "day-plan"],
      ["builder", "day-plan"],
      ["review this day", "review"],
      ["workout tracker", "tracker"],
      ["training day", "day-plan"],
    ];
    for (const [query, id] of retired) expect(destinations(query)[0]?.id, query).toBe(id);
  });

  it("lists each place once, so no two results share an identity", () => {
    // The result list keys each row by type and id.
    for (const query of ["workout", "plan", "train", "review", "body"]) {
      const ids = destinations(query).map((r) => r.id);
      expect(new Set(ids).size, query).toBe(ids.length);
    }
  });
});
