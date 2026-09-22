import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = new URL(".", import.meta.url).pathname;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.includes(".test.") ? [path] : [];
  });
}

describe("universal search and retrieval contract / local search", () => {
  // "Local inline search remains allowed inside bounded collections but must
  // state its scope and offer broadening when appropriate."
  it("gives every bounded local search a scope line and a way to broaden", () => {
    // Universal search IS the broad scope, and the showcase page renders vendor
    // component demos rather than an athlete-facing search.
    const exempt = ["UniversalSearch.tsx", "ComponentShowcase.tsx"];

    const searches = tsxFiles(SRC).filter((path) => {
      if (exempt.some((name) => path.endsWith(name))) return false;
      const source = readFileSync(path, "utf8");
      if (!/placeholder=(?:"Search|\{`Search)/.test(source)) return false;
      // A field that filters the listbox it sits inside states its scope by
      // being inside it: the options are on screen, narrowing as you type, and
      // there is nothing to broaden to that closing the popup does not already
      // do. The rule is for a search over a collection rendered elsewhere on
      // the page, where what was searched has to be said in words.
      return !/role="listbox"[\s\S]*aria-controls=\{listId\}|aria-controls=\{listId\}[\s\S]*role="listbox"/.test(source);
    });
    expect(searches.length, "local search inputs were found").toBeGreaterThan(4);

    const unscoped = searches.filter((path) => !readFileSync(path, "utf8").includes("<LocalSearchScope"));
    expect(unscoped.map((path) => path.replace(SRC, "")), "these searches state no scope").toEqual([]);
  });

  it("routes broadening through the one universal entry rather than a second sheet", () => {
    const scope = readFileSync(join(SRC, "components/LocalSearchScope.tsx"), "utf8");
    expect(scope).toContain("openUniversalSearch");
    // The current query travels with it, so broadening continues the search
    // instead of restarting it.
    expect(scope).toMatch(/openUniversalSearch\(query\)/);
  });
});
