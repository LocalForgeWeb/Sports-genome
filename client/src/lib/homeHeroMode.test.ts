import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { homeHeroMode } from "./homeHeroMode";

const hero = readFileSync(join(process.cwd(), "client/src/components/CommandHero.tsx"), "utf8");
const home = readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

const nothing = { sessionCount: 0, observationCount: 0, stagedExerciseCount: 0 };

/**
 * Home opened with a full-bleed photograph, a display headline and a paragraph of
 * positioning copy. That orients someone on their first visit; on their fifth it is
 * furniture pushing the state, priority and next action below the fold.
 */
describe("homeHeroMode", () => {
  it("introduces the product when the athlete has done nothing yet", () => {
    expect(homeHeroMode(nothing)).toBe("introduce");
  });

  it("stops introducing once anything is on the record", () => {
    expect(homeHeroMode({ ...nothing, sessionCount: 1 })).toBe("compact");
    expect(homeHeroMode({ ...nothing, observationCount: 1 })).toBe("compact");
    expect(homeHeroMode({ ...nothing, stagedExerciseCount: 1 })).toBe("compact");
  });

  it("treats a single staged exercise as history, since the athlete has acted", () => {
    // The bar is the first action, not a threshold of regular use.
    expect(homeHeroMode({ sessionCount: 0, observationCount: 0, stagedExerciseCount: 1 })).toBe("compact");
  });
});

describe("the compact hero keeps what the full one showed", () => {
  const compact = hero.slice(hero.indexOf('if (mode === "compact")'), hero.indexOf("return <div className=\"command-hero\">"));

  it("still shows the sport, the plan and the training days", () => {
    expect(compact).toContain("{sportLabel}");
    expect(compact).toContain("{planStatus}");
    expect(compact).toContain("{trainingDays}");
  });

  it("still shows the session fit grade", () => {
    expect(compact).toContain("{gradeStamp}");
  });

  it("drops the photograph and the positioning copy, which is the point", () => {
    expect(compact).not.toContain("heroImage");
    expect(compact).not.toContain("Train the action");
  });

  it("carries exactly one heading, so the page keeps one h1", () => {
    expect([...compact.matchAll(/<h1/g)].length).toBe(1);
  });
});

describe("Home wires the hero rather than inlining it", () => {
  it("renders the component", () => {
    expect(home).toContain("<CommandHero");
  });

  it("no longer carries the hero markup inline", () => {
    expect(home).not.toContain('<div className="command-hero">');
    expect(home).not.toContain("Train the action");
  });

  it("keeps the command section's other content", () => {
    // The movement lens and priority blocks still follow the hero.
    expect(home).toContain("Today&apos;s movement lens");
    expect(home).toContain("Priority blocks");
  });
});
