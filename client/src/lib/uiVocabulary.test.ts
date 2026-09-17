import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { studyGroupLabel, tidyPrecision } from "./studyGroupLabel";
import type { BodyLabEvidenceConfidence } from "./bodyLabRoleContext";

/** Every component and page source, which is where athlete-facing copy lives. */
function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, found);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) found.push(path);
  }
  return found;
}

const uiRoot = join(process.cwd(), "client/src");
const copySources = [
  ...sourceFiles(join(uiRoot, "components")),
  ...sourceFiles(join(uiRoot, "pages")),
  join(uiRoot, "lib/evidenceTraceability.ts"),
  join(uiRoot, "lib/bodyLabRoleContext.ts"),
].filter(
  path =>
    // The primitive itself, and a component gallery that nothing imports or routes -
    // neither is copy an athlete can reach.
    !path.endsWith("components/ui/table.tsx") && !path.endsWith("pages/ComponentShowcase.tsx")
);

/** Quoted strings long enough to be prose rather than an identifier or class name. */
function prose(path: string): string[] {
  const source = readFileSync(path, "utf8");
  return [...source.matchAll(/"([^"\\]{18,400})"/g)].map(match => match[1]).filter(
    text => / /.test(text) && !text.includes("@/") && !/^[a-z-]+(\s[a-z-]+)*$/.test(text)
  );
}

describe("the interface does not say 'table'", () => {
  it("never uses the word in athlete-facing copy", () => {
    const offenders: string[] = [];
    for (const path of copySources) {
      for (const text of prose(path)) {
        // Markup is not copy: <table> is a grid the athlete looks at, not a word
        // they read. Tags go first, then a real word edge - \b does not break
        // inside "Printable" or "timetable".
        const readable = text.replace(/<\/?[a-zA-Z][^>]*>/g, " ");
        if (/(^|[^a-z])tables?([^a-z]|$)/i.test(readable)) offenders.push(`${path.replace(uiRoot, "")}: ${text.slice(0, 90)}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("leaves the gymnastics apparatus alone, which is a real piece of equipment", () => {
    // The vault table in the movement database is not a database table.
    const movement = readFileSync(join(uiRoot, "lib/sportMovementDatabase.ts"), "utf8");
    expect(movement).toContain("table");
  });
});

/**
 * Nearly every glossary entry used to end by naming what the value was NOT. Fifteen
 * in a row meant the athlete finished each explanation knowing less than when they
 * started.
 */
describe("explanations end on what a value tells you", () => {
  const selfNegating = /\b(is not a|are not a|it is not|not a measured|not a direct measure|not a universal|does not imply|do not replace|not superior)\b/i;

  it("has no self-negating tail left in the exercise glossary", () => {
    const glossary = readFileSync(join(uiRoot, "components/ExerciseGenomePanel.tsx"), "utf8");
    const offenders = [...glossary.matchAll(/read: "([^"]+)"/g)]
      .map(match => match[1])
      .filter(text => selfNegating.test(text));
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no longer labels its own output low-confidence", () => {
    // The philosophy's uncertainty moment names "making low confidence look like
    // poor performance" as the thing to avoid, and this was the default label.
    for (const path of copySources) {
      expect(readFileSync(path, "utf8"), path).not.toContain("Low-confidence inference");
    }
  });

  it("names the basis for a role rather than grading its weakness", () => {
    const ladder: BodyLabEvidenceConfidence[] = [
      "Direct evidence", "Strong indirect evidence", "Biomechanical model", "Movement model",
    ];
    const source = readFileSync(join(uiRoot, "lib/bodyLabRoleContext.ts"), "utf8");
    for (const rung of ladder) expect(source).toContain(rung);
    expect(source).not.toContain("Low-confidence");
  });

  it("keeps the scope statements that stop the app claiming more than it knows", () => {
    // Removing these would have the app imply a population rank it does not have.
    const panel = readFileSync(join(uiRoot, "components/TodayActionPanel.tsx"), "utf8");
    expect(panel).toContain("not a rank against other people");
  });
});

describe("studyGroupLabel", () => {
  it("keeps a description that actually describes the group", () => {
    expect(studyGroupLabel("37 male collegiate lightweight wrestlers, freestyle and Greco-Roman"))
      .toContain("collegiate lightweight wrestlers");
  });

  it("drops a bare demographic word, which the comparison already implies", () => {
    for (const value of ["female", "male", "Non-starters", "participants", "Controls"]) {
      expect(studyGroupLabel(value), value).toBeNull();
    }
  });

  it("drops an empty or missing value rather than rendering a stray separator", () => {
    expect(studyGroupLabel(null)).toBeNull();
    expect(studyGroupLabel(undefined)).toBeNull();
    expect(studyGroupLabel("   ")).toBeNull();
  });

  it("tidies a spread quoted to four significant figures", () => {
    const result = studyGroupLabel("Healthy young men, mean age 20.9 ± 1.449 y and body mass 69.65 ± 2.92 kg.");
    expect(result).toContain("20.9 ± 1.4 y");
    expect(result).not.toContain("1.449");
    expect(result).toContain("69.7");
  });

  it("collapses stray whitespace so the card does not gap", () => {
    expect(studyGroupLabel("Amateur   male    rowers training twice weekly")).toBe(
      "Amateur male rowers training twice weekly"
    );
  });
});

describe("tidyPrecision", () => {
  it("leaves a single decimal alone", () => {
    expect(tidyPrecision("mean age 20.9 y")).toBe("mean age 20.9 y");
  });

  it("leaves whole numbers alone", () => {
    expect(tidyPrecision("37 wrestlers across 2 groups")).toBe("37 wrestlers across 2 groups");
  });

  it("rounds every over-precise figure in one string", () => {
    expect(tidyPrecision("20.9 ± 1.449 and 69.65 ± 2.925")).toBe("20.9 ± 1.4 and 69.7 ± 2.9");
  });
});
