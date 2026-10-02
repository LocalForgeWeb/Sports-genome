import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

/**
 * No destination may be a second copy of another one.
 *
 * The navigation principle's second anti-pattern is "duplicating objects by
 * entry path", and the app had one: "Builder" was Training Day again, seven
 * panels rendered in both, reachable from a different tab. It was removed by
 * hand. Nothing stopped it coming back, or stopped the next one - adding a
 * panel to two workspaces is one line in each, and the duplication is invisible
 * in a diff that touches two places a hundred lines apart.
 *
 * So this reads what each workspace actually renders and compares them.
 *
 * The workspaces are consecutive siblings in one JSX list, so a branch runs
 * from its own `{workspace === "x" &&` to the next one. That is deliberately
 * simpler than matching braces: JSX text contains apostrophes, and a brace
 * matcher that tracks quotes reads one as an opening string and swallows
 * everything to the next one - measured, it over-reported Training Day at 26
 * components including three that belong to Body Lab.
 */
function panelsByWorkspace(): Record<string, Set<string>> {
  // Icons are furniture. A chevron in two places is not two copies of a page,
  // and counting them would bury the signal this test exists to find.
  const icons = new Set(
    (source.match(/import \{([^}]*)\} from "lucide-react"/)?.[1] ?? "")
      .split(",").map((name) => name.trim()).filter(Boolean),
  );
  expect(icons.size, "the icon import was found").toBeGreaterThan(10);

  const first = source.indexOf('{workspace === "tracker"');
  const last = source.indexOf("</Suspense>", first);
  expect(first, "the workspace render list was found").toBeGreaterThan(-1);
  expect(last, "the end of the render list was found").toBeGreaterThan(first);
  const region = source.slice(first, last);

  const cuts = [...region.matchAll(/\{workspace === "([a-z-]+)"/g)].map((match) => ({
    workspace: match[1],
    at: match.index!,
  }));
  const panels: Record<string, Set<string>> = {};
  cuts.forEach((cut, index) => {
    const branch = region.slice(cut.at, index + 1 < cuts.length ? cuts[index + 1].at : region.length);
    panels[cut.workspace] ??= new Set();
    for (const match of branch.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) {
      if (!icons.has(match[1])) panels[cut.workspace].add(match[1]);
    }
  });
  return panels;
}

describe("no destination is a second copy of another", () => {
  it("reads a real set of panels out of every workspace", () => {
    // If the extraction silently stops working, every assertion below passes
    // vacuously. These are the shape of the thing being measured.
    const panels = panelsByWorkspace();
    expect(Object.keys(panels).length, "every workspace branch was found").toBeGreaterThanOrEqual(10);
    expect(panels["day-plan"], "Training Day is the densest page").toContain("DayExercisePicker");
    expect(panels.tracker, "the tracker renders through a multi-line branch").toContain("DeviceWorkoutTracker");
    expect(panels.strength).toContain("StrengthGenomePanel");
  });

  it("shares no more than one panel between any two workspaces", () => {
    // One is furniture that legitimately appears twice - the sport-context gate
    // stands in front of both Movement and Recommended, and the browse notice
    // sits on both Body Lab and Movement. Two or more is a page being rebuilt
    // somewhere else, which is what Builder was.
    const panels = panelsByWorkspace();
    const names = Object.keys(panels).sort();
    const duplicated: string[] = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const shared = [...panels[names[i]]].filter((panel) => panels[names[j]].has(panel));
        if (shared.length > 1) duplicated.push(`${names[i]} and ${names[j]} both render ${shared.join(", ")}`);
      }
    }
    // Joined rather than compared as an array: vitest prints a mismatched
    // array as "[ Array(1) ]", which says something is wrong and not what.
    expect(duplicated.join(" | "), "a destination is a second copy of another").toBe("");
  });

  it("gives every tab its own destination", () => {
    // The other way a page repeats: two tabs that land on the same workspace.
    // Two of them used to, by scrolling the page you were already on.
    const config = source.slice(source.indexOf("const contextualWorkspaces"), source.indexOf("function primaryDestinationForWorkspace"));
    for (const group of config.matchAll(/(\w+): \[(.*?)\],\n/gs)) {
      const routes = [...group[2].matchAll(/workspace: "([a-z-]+)"/g)].map((match) => match[1]);
      expect(new Set(routes).size, `${group[1]} routes two tabs to the same page: ${routes.join(", ")}`).toBe(routes.length);
    }
    // And no tab may carry a scroll target, which is how the removed pair
    // pretended to be pages.
    expect(source).not.toContain("scrollTarget");
  });

  it("gives every tab somewhere to land", () => {
    // A tab whose workspace renders nothing is the opposite failure, and just
    // as invisible: the page changes to blank and nothing says why.
    const panels = panelsByWorkspace();
    const config = source.slice(source.indexOf("const contextualWorkspaces"), source.indexOf("function primaryDestinationForWorkspace"));
    const routed = [...config.matchAll(/workspace: "([a-z-]+)"/g)].map((match) => match[1]);
    expect(routed.length, "tab routes were found").toBeGreaterThan(4);
    const empty = routed.filter((workspace) => !panels[workspace]?.size);
    expect(empty.join(", "), "these tabs lead to a workspace that renders nothing").toBe("");
  });
});
