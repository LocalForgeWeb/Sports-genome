import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { muscleLabels } from "@/components/AnatomyMap";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import { catalogKeysFor, muscleFilterKey, searchAliasesFor, selectableMuscles, trainsMuscle } from "@/lib/muscleVocabulary";

/**
 * Reported as "if you can say that I'm missing rhomboids in a day I should be
 * able to select rhomboids as a muscle to find workouts for". It was worse than
 * that: the name travelled to three places and was broken in all of them.
 */
describe("a muscle the app can name is a muscle it can find work for", () => {
  it("resolves a register name to the catalog keys that carry it", () => {
    // The Pull register asks for rhomboids; the catalog has no such tag, and
    // files the rows that train them under `upperBack`.
    expect(catalogKeysFor("rhomboids")).toEqual(["upperBack"]);
    // Everything else is its own key, so the map stays a list of exceptions.
    expect(catalogKeysFor("chest")).toEqual(["chest"]);
  });

  it("finds exercises for it at all", () => {
    const found = exercises.filter((exercise) => trainsMuscle(exercise, "rhomboids"));
    expect(found.length, "rhomboids matched nothing before").toBeGreaterThan(10);
  });

  it("lets the shortfall it reports actually close", () => {
    // `involvement()` asked the catalog for `rhomboids` directly, so a Pull day
    // scored 0 there no matter what was added - the one gap in the app that
    // could not be fixed by doing the work it asked for.
    const rows = exercises.filter((exercise) => trainsMuscle(exercise, "rhomboids") === "primary").slice(0, 3);
    const rhomboidsOf = (workout: typeof rows) =>
      analyzeSplitStack(workout, exercises, "Pull").ratings.find((rating) => rating.muscle === "rhomboids")!;

    expect(rhomboidsOf([]).score).toBe(0);
    const covered = rhomboidsOf(rows);
    expect(covered.score).toBeGreaterThanOrEqual(covered.target);
  });

  it("offers one row per set of exercises, under the name the catalog uses", () => {
    // Offering "Rhomboids" and "Upper back" as separate options would be two
    // rows returning the same exercises. One row, findable by either name.
    const options = selectableMuscles(exercises, (key) => muscleLabels[key] || key);
    expect(options).toContain("upperBack");
    expect(options).not.toContain("rhomboids");
    expect(muscleFilterKey("rhomboids")).toBe("upperBack");
    expect(searchAliasesFor("upperBack")).toContain("rhomboids");
  });

  it("offers the muscles exercises train as support, not only as primary", () => {
    // The options were built from primary tags alone, which left four muscles
    // the filter genuinely matches unselectable.
    const options = selectableMuscles(exercises, (key) => muscleLabels[key] || key);
    for (const key of ["rotatorCuff", "lowerBack", "hipFlexors", "feet"]) {
      expect(options, `${key} is offered`).toContain(key);
      expect(exercises.some((exercise) => trainsMuscle(exercise, key)), `${key} has exercises`).toBe(true);
    }
  });

  it("orders them by the words on screen, not by the keys behind them", () => {
    // Sorting the keys opened the list with "Hip abductors, Rectus abdominis,
    // Hip adductors, Biceps brachii" - which is `abductors, abs, adductors,
    // biceps`, alphabetical to the code and arbitrary to everyone else.
    const labels = selectableMuscles(exercises, (key) => muscleLabels[key] || key).map((key) => muscleLabels[key] || key);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })));
  });

  it("leaves no muscle the split register can report but the catalog cannot answer", () => {
    // The guard that would have caught this one: every name a day can be told
    // it is short of has to resolve to exercises.
    const splits = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"] as const;
    const unanswerable = new Set<string>();
    for (const split of splits) {
      for (const rating of analyzeSplitStack([], exercises, split).ratings) {
        if (!exercises.some((exercise) => trainsMuscle(exercise, rating.muscle))) unanswerable.add(rating.muscle);
      }
    }
    expect([...unanswerable], "each of these is a shortfall with no exercise to fix it").toEqual([]);
  });
});

/**
 * The control itself. It reuses the listbox the onboarding quiz uses, and that
 * component is written for the quiz's dark ground - dropped into the picker's
 * white toolbar, its trigger label measured 1.04:1. The control's own name,
 * invisible.
 */
describe("the muscle filter is legible in the toolbar it sits in", () => {
  const planner = readFileSync(resolve(process.cwd(), "client/src/workout-planner.css"), "utf8");
  const root = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("restates every surface the shared component paints for a dark ground", () => {
    const scoped = planner.match(/\.day-picker-tools \.muscle-select [^{]*\{[^}]*\}/g) ?? [];
    expect(scoped.length, "the light overrides are present").toBeGreaterThan(5);
    // The trigger is the one that was invisible, so it is named explicitly.
    expect(planner).toMatch(/\.day-picker-tools \.muscle-select \.athlete-sport-trigger \{[^}]*background: #fff;[^}]*color: #264f77;/);
    expect(planner).toMatch(/\.day-picker-tools \.muscle-select \.athlete-sport-trigger strong \{[^}]*color: #264f77;/);
  });

  it("hands them back in dark mode rather than leaving a white control on navy", () => {
    // The component's own dark defaults no longer reach it: the light rules
    // above are more specific, so the theme has to restate them too.
    expect(root).toContain('[data-theme="dark"] .day-picker-tools .muscle-select .athlete-sport-trigger,');
    expect(root).toContain('[data-theme="dark"] .day-picker-tools .muscle-select .athlete-sport-option.is-active');
  });
});
