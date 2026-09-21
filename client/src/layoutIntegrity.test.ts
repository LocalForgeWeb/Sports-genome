import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = new URL(".", import.meta.url).pathname;
const css = readFileSync(join(SRC, "index.css"), "utf8");
const allCss = readdirSync(SRC)
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(join(SRC, f), "utf8"))
  .join("\n");

function relativeLuminance(hex: string): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(parseInt(hex.slice(1, 3), 16))
    + 0.7152 * channel(parseInt(hex.slice(3, 5), 16))
    + 0.0722 * channel(parseInt(hex.slice(5, 7), 16));
}
function contrast(a: string, b: string): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function token(name: string): string {
  const m = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  expect(m, `${name} is defined`).toBeTruthy();
  return m![1].trim().split(/\s+/)[0];
}

describe("layout integrity", () => {
  it("keeps a closed disclosure from rendering its contents", () => {
    // A closed <details> hides its contents through the slot, but an author
    // `display` declaration on a direct child overrides that. The Catalog filter
    // panel did exactly this: open=false while a 267px grid of five selects still
    // laid out behind the cards, unreachable by pointer but present for keyboard
    // and screen-reader users.
    expect(css).toMatch(/details:not\(\[open\]\)\s*>\s*\*:not\(summary\)\s*\{[^}]*display:\s*none/);
  });

  it("stops a wide descendant from widening its column past the viewport", () => {
    // Grid and flex items default to min-width:auto. The Exercise Genome list
    // overflowed the 390px viewport by 70px this way.
    expect(css).toMatch(/\.apex-main\s*:where\([^)]*\.grid[^)]*\)\s*>\s*\*\s*\{[^}]*min-width:\s*0/);
  });

  it("gives every light surface its own foreground colour", () => {
    // A light background that sets no colour inherits the destination shell's
    // light text; on Matches and Builder that rendered body copy at 1.04:1.
    const rule = css.match(/\.light-panel,[^{]*\{[^}]*color:\s*var\(--sg-text-on-light\);[^}]*\}/);
    expect(rule, "the light-surface foreground rule is present").toBeTruthy();
    ["movement-intelligence-panel", "genome-panel", "weekly-plan-board", "session-exercise",
     "atlas-inspector", "body-lab-quick-actions", "recovery-spacing-panel", "builder-finder"]
      .forEach((cls) => expect(rule![0], `${cls} declares a foreground`).toContain(cls));
    // The label colour is declared in the same rule so the two cannot drift apart:
    // a light card nested in a dark destination resets it, and children inherit.
    expect(rule![0], "the same rule sets the label colour").toContain("--sg-label-color: var(--sg-text-subtle-on-light)");
    expect(css).toMatch(/\.metric-label\s*\{\s*color:\s*var\(--sg-label-color/);
  });

  it("gives form controls a real tap target", () => {
    // Several selects and inputs rendered 14-17px tall, which also produced rows
    // where a 17px select sat beside a 38px control.
    expect(css).toMatch(/\.apex-main select,[\s\S]{0,700}min-height:\s*2\.75rem/);
  });

  it("separates the action fill from the action accent, because one hue cannot do both", () => {
    const accent = token("--sg-action");
    const fill = token("--sg-action-fill");
    expect(fill).not.toBe(accent);
    // The fill carries a white label, so it needs AA for small text.
    expect(contrast(token("--sg-action-on"), fill), "white label on the action fill").toBeGreaterThanOrEqual(4.5);
    // The accent is used as text and borders on the deep navy.
    expect(contrast(accent, token("--sg-surface-deep")), "accent on deep navy").toBeGreaterThanOrEqual(4.5);
  });

  it("keeps subtle text on light above the AA threshold", () => {
    expect(contrast(token("--sg-text-subtle-on-light"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("gives every control in the workspace a 44px tap target", () => {
    // "Live-session control priority": use "at least platform-recommended
    // 44x44pt hit areas for primary touch controls rather than treating WCAG's
    // 24px minimum as the design target". The audit measured 34 controls below
    // it, eleven at 17px tall, and the Builder's add-exercise button at 30x30.
    expect(css).toMatch(/\.apex-content :is\(button, summary\)[^{]*\{\s*\n?\s*min-height: 2\.75rem;/);
  });

  it("extends the hit area of inline text buttons instead of inflating the line", () => {
    // A 17px inline link cannot become a 44px box without breaking the line it
    // sits on, so the target grows and the type does not.
    expect(css).toMatch(/\.apex-content :is\(\.atlas-reset-pro, \.genome-term-button\)::after \{ content: ""; position: absolute; inset: -14px -8px; \}/);
    expect(css).toMatch(/\.local-search-scope > button::after \{ content: ""; position: absolute; inset: -8px -6px; \}/);
  });

  it("keeps a row's own action clear of the controls floating over it", () => {
    // The Training Day reorder controls are absolutely positioned at the
    // top-right of each row, and whatever reached that corner ran underneath
    // them: tapping near the end of the title hit "move earlier" instead of
    // opening the exercise. The 44px tap floor made the dead zone taller,
    // 34x34 -> 34x44. The row is now a single summary, so it reserves the
    // width in its own padding rather than by pushing a child out of the way.
    const card = readFileSync(join(SRC, "mobile-training-card.css"), "utf8");
    const summary = card.slice(card.indexOf(".custom-prescription > summary.custom-row {"));
    expect(summary.slice(0, summary.indexOf("}"))).toMatch(/padding: [^;]*5\.6rem/);
  });

  it("retires the acid-lime accent across every stylesheet", () => {
    expect(allCss).not.toContain("#b8ff5b");
  });
});

describe("athlete-facing labels", () => {
  it("has a display label for every muscle key the catalog ships", () => {
    // Rows render `muscleLabels[key] || key`, so a missing key leaks a raw
    // identifier: `upperBack` was surfacing verbatim on three screens.
    const anatomy = readFileSync(join(SRC, "components/AnatomyMap.tsx"), "utf8");
    const catalog = readFileSync(join(SRC, "lib/exerciseCatalog.ts"), "utf8");

    const open = anatomy.indexOf("{", anatomy.indexOf("const labels: Record<string, string> = "));
    let depth = 0, end = open;
    for (let i = open; i < anatomy.length; i++) {
      if (anatomy[i] === "{") depth++;
      else if (anatomy[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    const labelled = new Set(
      [...anatomy.slice(open + 1, end).matchAll(/(?:^|[,{\s])([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((m) => m[1]),
    );

    const used = new Set<string>();
    for (const m of catalog.matchAll(/"(?:primaryMuscles|secondaryMuscles)"\s*:\s*\[([^\]]*)\]/g)) {
      for (const t of m[1].matchAll(/"([A-Za-z][A-Za-z0-9_]*)"/g)) used.add(t[1]);
    }
    expect(used.size, "catalog muscle keys were found").toBeGreaterThan(10);

    const missing = [...used].filter((k) => !labelled.has(k));
    expect(missing, `unlabelled muscle keys would render raw: ${missing.join(", ")}`).toEqual([]);
  });
});

/**
 * Dark mode arrived with the chrome themed one element short, and one control
 * left holding a colour written for a surface it no longer sits on.
 */
describe("the dark theme covers the chrome it sits in", () => {
  it("themes the block holding search and Profile, not just the tab row beside it", () => {
    // `.workspace-top-actions` is a sibling of the tab row, not a child, and it
    // carries its own --sg-surface-light fill at phone width. Themed without
    // it, the row went dark and that block stayed a white rectangle in the
    // top-right corner with two near-invisible icons on it.
    const themed = css.match(/\[data-theme="dark"\][^{]*\.workspace-top-actions[^{]*\{[^}]*\}/g) ?? [];
    expect(themed.length, "the actions block has a dark rule").toBeGreaterThan(0);
    // And whatever gave it the light fill is named in the same breath as the row.
    const light = css.match(/\.workspace-top-switcher, \.workspace-top-actions \{[^}]*\}/);
    expect(light, "the light rule pairs them").toBeTruthy();
    expect(themed.join("\n"), "so does the dark one").toContain(".workspace-top-actions");
  });

  it("leaves no control wearing a colour meant for a different surface", () => {
    // The empty-day button is an orange action fill with a white label, styled
    // where it lives. A palette guard here repainted it gold on both counts and,
    // because index.css imports that file at the top, won on source order -
    // gold on the action orange, 2.71:1, on the one control the panel offers.
    expect(css).not.toContain(".day-plan-empty button { border-color: var(--sg-focus-on-dark); color: var(--sg-focus-on-dark); }");
    const planner = readFileSync(join(SRC, "workout-planner.css"), "utf8");
    expect(planner, "the button keeps its own white label").toMatch(/\.day-plan-empty button \{[^}]*background: var\(--sg-action-fill\); color: #fff;/);
  });

  it("keeps the Add controls legible once their rows go dark", () => {
    // Both kept the light-mode link blue: the row's Add measured 2.79:1 and the
    // disclosure's "Add exercises" 2.71:1 against the surfaces the theme gave them.
    expect(css).toContain('[data-theme="dark"] .day-picker-result > button:last-child,');
    expect(css).toContain('[data-theme="dark"] .day-exercise-disclosure-action { color: var(--sg-link-on-dark); }');
  });
});
