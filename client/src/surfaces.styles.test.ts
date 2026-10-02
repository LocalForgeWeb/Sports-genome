import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { keyboardInsetFrom } from "@/lib/keyboardInset";

const read = (path: string) => readFileSync(resolve(process.cwd(), "client/src", path), "utf8");
const surfaces = read("surfaces.css");
const search = read("search-field.css");
const print = read("printable-workout.css");
const share = read("workout-share.css");

const luminance = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i + 1, i + 3), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/**
 * Oct 2 brief §1–2. The unreadable screens were repainted surfaces, not faded
 * ones: a light card inside a dark sheet took the sheet's text colours, and a
 * dark sheet kept a light component's ground. The fixes are structural, and
 * these tests hold the structure.
 */
describe("surfaces own their ink", () => {
  it("loads the surface contract after index.css, so it can restate repainted components", () => {
    const main = read("main.tsx");
    expect(main.indexOf('import "./surfaces.css";')).toBeGreaterThan(main.indexOf('import "./index.css";'));
    expect(surfaces).toMatch(/\.sg-surface-dark \{ color: var\(--sg-text-on-dark\); --sg-label-color: var\(--sg-text-subtle-on-dark\); --sg-link-color: var\(--sg-link-on-dark\); \}/);
  });

  it("renders the term explanation in the modal layer, out of reach of the dark sheet's text rules", () => {
    const panel = read("components/ExerciseGenomePanel.tsx");
    expect(panel).toContain("return createPortal(<div ref={layerRef} className=\"genome-learn-overlay\"");
    expect(panel).toContain('className="genome-learn-card sg-surface-light"');
    expect(panel).toContain(", document.body);");
  });

  it("gives Muscle Genome dividers on the dark sheet instead of a light ground showing through", () => {
    expect(surfaces).toContain(".exercise-intelligence .genome-muscle-stack { gap: 0; background: transparent; }");
    expect(read("pages/Home.tsx")).toContain('className="fixed inset-0 z-50 exercise-intelligence sg-surface-dark"');
  });

  it("marks every dark overlay as a dark surface", () => {
    expect(read("components/DayExercisePicker.tsx")).toContain('className="day-picker-sheet sg-surface-dark"');
    expect(read("components/StackAnalysisPage.tsx")).toContain('className="stack-analysis-overlay sg-surface-dark"');
    expect(read("components/WorkoutShareSheet.tsx")).toContain('className="workout-share-sheet sg-surface-dark"');
  });

  it("styles the day's Share button where it always loads, not with the lazily loaded sheet", () => {
    expect(read("workout-planner.css")).toContain(".day-plan-actions .day-action-share {");
    expect(share).not.toContain(".day-action-share");
  });

  it("never fades a modal's surface in: the share sheet slides, its text opaque from the first frame", () => {
    const keyframes = share.match(/@keyframes workout-share-in \{[^}]*\}[^}]*\}/)?.[0] ?? "";
    expect(keyframes).toContain("translateY");
    expect(keyframes).not.toContain("opacity");
  });

  it("gives every grade stamp its own ink at 4.5:1 on its own tile, whatever surrounds it", () => {
    const stamp = read("components/GradeStamp.tsx");
    expect(stamp).toContain("style={{ color: inks[grade] }}");
    const tile = Object.fromEntries([...stamp.matchAll(/(SS|S|A|B|C|D|F): "bg-\[(#[0-9a-f]{6}|var\(--sg-action-fill\))\]/g)].map((match) => [match[1], match[2] === "var(--sg-action-fill)" ? "#c9401c" : match[2]]));
    const ink = Object.fromEntries([...stamp.matchAll(/(SS|S|A|B|C|D|F): "(#[0-9a-f]{6})"/g)].map((match) => [match[1], match[2]]));
    for (const grade of ["S", "A", "B", "C", "D", "F"]) expect(contrast(ink[grade], tile[grade] === "white" ? "#ffffff" : tile[grade] ?? "#ffffff"), grade).toBeGreaterThanOrEqual(4.5);
  });
});

/** Oct 2 brief §3: one search control, one focus treatment. */
describe("the search field", () => {
  it("draws focus once, on the field, and nothing on the input inside it", () => {
    expect(search).toMatch(/\.sg-search-field:focus-within \{[^}]*border-color: #5aa9ff;[^}]*box-shadow: 0 0 0 3px/);
    // Three classes: more specific than any screen's `:is(input):focus-visible` outline (two classes and an element).
    expect(search).toMatch(/\.sg-search-field \.sg-search-input,\n\.sg-search-field \.sg-search-input:focus,\n\.sg-search-field \.sg-search-input:focus-visible \{[^}]*border: 0;[^}]*box-shadow: none;[^}]*outline: none;/);
    // 16px, so iOS Safari does not zoom the page into the field.
    expect(search).toMatch(/\.sg-search-input:focus-visible \{[^}]*font-size: var\(--sg-text-lg\)/);
  });

  it("is the search box on the catalog, Add Exercises and the movement explorer", () => {
    expect(read("components/CatalogDiscoveryPanel.tsx")).toContain('<SearchField className="catalog-discovery-search"');
    expect(read("components/DayExercisePicker.tsx")).toContain('<SearchField ref={searchRef} className="day-picker-search"');
    expect(read("components/MovementAtlasPanel.tsx")).toContain('<SearchField className="atlas-search"');
  });

  it("leaves no older wrapper drawing a second border or focus colour", () => {
    expect(read("catalog-discovery.css")).not.toContain(".catalog-discovery-search:focus-within");
    expect(read("movement-atlas.css")).not.toContain(".atlas-search:focus-within");
  });

  it("keeps a real outline where box-shadow is not drawn (forced colours)", () => {
    expect(search).toContain("@media (forced-colors: active) { .sg-search-field:focus-within { outline: 2px solid Highlight;");
  });
});

/** Oct 2 brief §10: printing the page prints the sheet and nothing else - no empty navy pages. */
describe("browser printing", () => {
  it("takes the app out of the flow instead of hiding it in place", () => {
    expect(print).toContain("body > :not(.printable-workout-sheet) { display: none !important; }");
    expect(print).not.toContain("visibility: hidden");
    expect(print).toMatch(/html, body \{ height: auto !important; min-height: 0 !important;[^}]*background: #fff !important;/);
    expect(read("components/PrintableWorkoutSheet.tsx")).toContain(", document.body);");
  });
});

/** The on-screen keyboard lifts the Add Exercises sheet instead of covering it. */
describe("keyboard inset", () => {
  it("is the part of the layout viewport the visual viewport has lost", () => {
    expect(keyboardInsetFrom(844, { height: 508, offsetTop: 0 })).toBe(336);
    expect(keyboardInsetFrom(844, { height: 790, offsetTop: 0 })).toBe(0); // URL bar settling, not a keyboard
    expect(keyboardInsetFrom(844, null)).toBe(0);
  });
});
