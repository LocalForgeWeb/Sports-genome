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

  /**
   * The floor was only half the problem. Below 16px the stylesheets named 23
   * distinct sizes — nine of them between 11px and 12.5px — against a scale of
   * four tokens that 90 declarations used and 619 ignored. At that spacing the
   * steps are not a hierarchy a reader can perceive; they are drift.
   *
   * Above 16px is the display tier, where the differences are visible and tuned
   * per surface, so literals are allowed there.
   */
  it("writes no literal size in the reading tier", () => {
    const offenders: string[] = [];
    for (const path of walk(SRC, (name) => name.endsWith(".css"))) {
      const css = readFileSync(path, "utf8");
      for (const match of css.matchAll(/font-size:\s*([^;}\n]+)/g)) {
        const value = match[1].trim();
        if (value.startsWith("var(")) continue;
        const px = /^[0-9.]+(?:px|rem)/.test(value) ? toPx(value) : Number.POSITIVE_INFINITY;
        if (px <= 16) offenders.push(`${path.replace(SRC, "")}: ${value}`);
      }
    }
    expect(offenders, "at or below 16px the scale is the only vocabulary").toEqual([]);
  });

  /**
   * DM Sans is now fetched as a variable axis, so 750, 800, 850 and 900 draw
   * four different weights. They used to draw one — the 700 face — which is why
   * 97 declarations had drifted across four values nobody could see.
   */
  it("draws from a four-step weight ladder", () => {
    const allowed = new Set([400, 600, 700, 800]);
    const offenders: string[] = [];
    for (const path of walk(SRC, (name) => name.endsWith(".css"))) {
      const css = readFileSync(path, "utf8");
      for (const match of css.matchAll(/font-weight:\s*(\d{3})/g)) {
        if (!allowed.has(Number(match[1]))) offenders.push(`${path.replace(SRC, "")}: ${match[1]}`);
      }
    }
    expect(offenders, "400 body, 600 medium, 700 emphasis, 800 label").toEqual([]);
  });

  /**
   * The boot splash is styled inline in index.html so it paints before any
   * stylesheet loads. That put it outside every guard here, and its wordmark
   * was the first thing an athlete saw — at 10px.
   */
  it("holds the floor in the boot splash, which no stylesheet covers", () => {
    const html = readFileSync(join(SRC, "../index.html"), "utf8");
    const offenders: string[] = [];
    for (const match of html.matchAll(/font(?:-size)?:\s*(?:\d{3}\s+)?([0-9.]+px)/g)) {
      if (toPx(match[1]) < FLOOR_PX) offenders.push(match[0]);
    }
    expect(offenders, `these fall below ${FLOOR_PX}px before the app has rendered`).toEqual([]);
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
    const label = /--sg-tracking-label:\s*([0-9.]+)em/.exec(css);
    expect(label, "the label tracking is a token").toBeTruthy();
    expect(parseFloat(label![1])).toBeLessThanOrEqual(0.12);
    const rules = [...css.matchAll(/\.metric-label\s*\{[^}]*letter-spacing:\s*([^;}]+)/g)].map((m) => m[1].trim());
    expect(rules.length, "the eyebrow declares its tracking").toBeGreaterThan(0);
    rules.forEach((tracking) => expect(tracking).toBe("var(--sg-tracking-label)"));
  });

  /**
   * Tracking had drifted the same way sizes had: 30 distinct values over 288
   * declarations, 20 of them on uppercase micro-labels alone. There are three
   * intents here — caps, sentence case, display — and one optical exception.
   */
  it("tracks from three intents", () => {
    const allowed = new Set(["var(--sg-tracking-label)", "var(--sg-tracking-open)", "var(--sg-tracking-tight)", "0", "-.3em"]);
    const offenders: string[] = [];
    for (const path of walk(SRC, (name) => name.endsWith(".css"))) {
      const css = readFileSync(path, "utf8");
      for (const match of css.matchAll(/letter-spacing:\s*([^;}\n]+)/g)) {
        const value = match[1].trim();
        if (!allowed.has(value)) offenders.push(`${path.replace(SRC, "")}: ${value}`);
      }
    }
    // -.3em is the "GO" monogram: two letters tucked into a badge, not text.
    expect(offenders, "caps, sentence case, display — and the monogram").toEqual([]);
  });
});
