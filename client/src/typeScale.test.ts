import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = new URL(".", import.meta.url).pathname;

function walk(dir: string, match: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, match);
    return entry.isFile() && match(entry.name) ? [path] : [];
  });
}

/** The floor the app renders at: --sg-text-xs, 11px. */
const FLOOR_PX = 11;

function toPx(value: string): number {
  if (value.endsWith("px")) return parseFloat(value);
  if (value.endsWith("rem")) return parseFloat(value) * 16;
  return Number.POSITIVE_INFINITY;
}

describe("type scale floor", () => {
  // A phone screen in a gym, at arm's length, with a sweaty hand. The audit
  // found 118 rendered text nodes below 11px across eleven screens — 7px, 8px
  // and 9px labels — which is the single biggest reason the app read as cheap
  // rather than precise.
  it("renders no stylesheet text below the readable floor", () => {
    const offenders: string[] = [];
    for (const path of walk(SRC, (name) => name.endsWith(".css"))) {
      const css = readFileSync(path, "utf8");
      for (const match of css.matchAll(/font-size:\s*([0-9.]+(?:px|rem))/g)) {
        if (toPx(match[1]) < FLOOR_PX) offenders.push(`${path.replace(SRC, "")}: ${match[1]}`);
      }
    }
    expect(offenders, `these declarations fall below ${FLOOR_PX}px`).toEqual([]);
  });

  /**
   * A literal below the floor was caught; a *token* holding one was not, because
   * `font-size: var(--sg-text-2xs)` is not a literal. That token was .625rem -
   * 10px - and 37 declarations used it, so the smallest type in the app was a
   * size this very test forbids, in 37 places, invisibly.
   */
  it("defines no size token below the readable floor", () => {
    const root = readFileSync(join(SRC, "index.css"), "utf8");
    const offenders: string[] = [];
    for (const match of root.matchAll(/(--sg-(?:text|display)-[\w-]+):\s*([0-9.]+(?:px|rem))\s*;/g)) {
      if (toPx(match[2]) < FLOOR_PX) offenders.push(`${match[1]}: ${match[2]}`);
    }
    expect(offenders, `these tokens are below ${FLOOR_PX}px, and every use of them inherits it`).toEqual([]);
  });

  it("references no size token it has not defined", () => {
    const root = readFileSync(join(SRC, "index.css"), "utf8");
    const all = walk(SRC, (name) => name.endsWith(".css") || (name.endsWith(".tsx") && !name.includes(".test.")))
      .map((path) => readFileSync(path, "utf8")).join("\n");
    for (const match of all.matchAll(/var\((--sg-(?:text|display)-[\w-]+)/g)) {
      expect(root, `${match[1]} is referenced, so it must be defined`).toMatch(new RegExp(`${match[1]}\\s*:`));
    }
  });

  it("renders no inline Tailwind text below the readable floor", () => {
    const offenders: string[] = [];
    for (const path of walk(SRC, (name) => name.endsWith(".tsx") && !name.includes(".test."))) {
      const source = readFileSync(path, "utf8");
      for (const match of source.matchAll(/text-\[([0-9.]+)px\]/g)) {
        if (parseFloat(match[1]) < FLOOR_PX) offenders.push(`${path.replace(SRC, "")}: ${match[1]}px`);
      }
    }
    expect(offenders, `these utilities fall below ${FLOOR_PX}px`).toEqual([]);
  });

  it("gives the eyebrow-and-title pair its own breathing room", () => {
    // The pair is the app's most repeated unit and was rendering with 1.6-3.5px
    // between the two lines on eleven screens.
    const css = readFileSync(join(SRC, "index.css"), "utf8");
    expect(css).toMatch(/\.metric-label:not\(:last-child\)\s*\{\s*margin-bottom/);
  });

  it("keeps the eyebrow's tracking readable at the floor size", () => {
    // .16em of tracking on an 11px uppercase label reads as strain.
    const css = readFileSync(join(SRC, "index.css"), "utf8");
    const rules = [...css.matchAll(/\.metric-label\s*\{[^}]*letter-spacing:\s*([0-9.]+em)/g)].map((m) => parseFloat(m[1]));
    expect(rules.length, "the eyebrow declares its tracking").toBeGreaterThan(0);
    rules.forEach((tracking) => expect(tracking).toBeLessThanOrEqual(0.12));
  });
});
