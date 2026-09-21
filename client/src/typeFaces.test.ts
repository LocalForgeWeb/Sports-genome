import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = new URL(".", import.meta.url).pathname;
const html = readFileSync(join(SRC, "../index.html"), "utf8");

function walk(dir: string, match: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, match);
    return entry.isFile() && match(entry.name) ? [path] : [];
  });
}

const allCss = walk(SRC, (name) => name.endsWith(".css"))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

/** The weights each family is actually fetched at, read from the Google Fonts request. */
function requestedWeights(family: string): { min: number; max: number } {
  const link = html.match(/https:\/\/fonts\.googleapis\.com\/css2[^"]*/)?.[0] ?? "";
  const spec = link.split("&").find((part) => part.includes(family.replace(/ /g, "+")));
  expect(spec, `${family} is requested`).toBeTruthy();
  // Two forms: a range ("wght@9..40,400..900") and a pinned list ("0,500;0,600").
  // Only the weight axis is read - `9..40` is the optical-size axis, not a weight.
  const axis = spec!.split("wght@")[1] ?? "";
  const numbers = [...axis.matchAll(/\b(\d{3})\b/g)].map((m) => Number(m[1]));
  expect(numbers.length, `${family} names its weights`).toBeGreaterThan(0);
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

/**
 * A weight the font does not have is not a lighter or heavier weight - CSS font
 * matching just resolves it to the nearest face that exists, so the declaration
 * renders identically to one several steps away.
 *
 * The audit found 368 declarations at 750, 800, 850 and 900 against a DM Sans
 * request that stopped at 700. Every one of them drew the 700 face, which means
 * four "different" weights in the stylesheets were one weight on screen.
 */
describe("the weights on screen are weights the fonts have", () => {
  it("fetches DM Sans across the range the stylesheets ask it for", () => {
    const { max } = requestedWeights("DM Sans");
    // Declarations that inherit the body face: everything not naming the display family.
    const declared = [...allCss.matchAll(/font-weight:\s*(\d{3})/g)].map((m) => Number(m[1]));
    const heaviest = Math.max(...declared);
    expect(heaviest, "the stylesheets ask for a weight heavier than anything requested").toBeLessThanOrEqual(max);
  });

  it("asks Barlow Condensed for nothing heavier than the 800 it ships", () => {
    // Not a variable font: Google serves discrete faces and there is no 900.
    const { max } = requestedWeights("Barlow Condensed");
    expect(max).toBeLessThanOrEqual(800);
    const rules = [...allCss.matchAll(/([^{}]*)\{([^}]*)\}/g)];
    const offenders = rules
      .filter(([, , body]) => /font-weight:\s*900/.test(body) && /(Barlow Condensed|--sg-font-display|font-display)/.test(body))
      .map(([, selector]) => selector.trim().split("\n").pop()!.slice(0, 60));
    expect(offenders, "these ask the display face for a 900 it does not have").toEqual([]);
  });

  it("requests the body face as a range, so a variable axis is actually used", () => {
    // Four pinned instances cost more to download than the axis and still could
    // not answer 800. `400..900` is one file that answers all of them.
    const link = html.match(/https:\/\/fonts\.googleapis\.com\/css2[^"]*/)?.[0] ?? "";
    expect(link).toContain("DM+Sans:opsz,wght@9..40,400..900");
  });
});
