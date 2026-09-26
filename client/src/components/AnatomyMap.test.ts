import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("./AnatomyMap.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../anatomy-clean.css", import.meta.url), "utf8");

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  let calls = 0;
  return {
    ...actual,
    default: actual,
    useState: <T,>(initial: T) => {
      const value = calls++ === 1 ? "hamstrings" : initial;
      return [value as T, vi.fn()] as [T, ReturnType<typeof vi.fn>];
    },
  };
});

describe("Body Lab selection proximity", () => {
  // "Body Lab anatomical interaction and mode contract": "selecting a region
  // immediately exposes its state and a compact local action layer". The full
  // inspector sits past the legend and the methodology disclosure inside a
  // panel measured at 1984px tall, which on a phone is a long scroll from the
  // muscle just tapped.
  it("restates the selection directly under the body chart, before the legend", () => {
    const chart = source.indexOf('className="atlas-body-chart-wrap"');
    const strip = source.indexOf('className="atlas-selected-strip"');
    const legend = source.indexOf('className="atlas-heat-legend-pro"');
    const inspector = source.indexOf('className={`atlas-pro-inspector');

    expect(strip, "the selection strip is rendered").toBeGreaterThan(-1);
    expect(strip, "it follows the chart").toBeGreaterThan(chart);
    expect(strip, "it comes before the legend").toBeLessThan(legend);
    expect(strip, "the full inspector stays the deeper layer").toBeLessThan(inspector);
  });

  it("carries the decision-relevant state, not just a name", () => {
    const block = source.slice(source.indexOf('className="atlas-selected-strip"'), source.indexOf("Qualitative role legend"));
    expect(block).toContain("Selected muscle");
    expect(block).toContain("selectedLabel");
    expect(block).toContain("atlas-selected-role");
    // Confidence travels with the role, never implied by its absence.
    expect(block).toContain("atlas-selected-confidence");
  });

  it("stands down on wide screens, where the inspector is already beside the body", () => {
    expect(styles).toMatch(/@media \(min-width:\s*901px\)\{\.atlas-selected-strip\{display:none\}\}/);
  });
});

describe("Body Lab architecture mechanics disclosure", () => {
  it("uses categorical role states instead of a numeric heat scale", () => {
    expect(source).toContain("anatomyRoleRenderState");
    expect(source).toContain('primary: "primary"');
    expect(source).toContain('supporting: "supporting"');
    // The third-party renderer took a 0-10 intensity, so a categorical role had
    // to be encoded as a number on the way in. Nothing translates now.
    expect(source).not.toMatch(/intensity/i);
    expect(source).not.toContain("heatSolid");
    expect(source).not.toContain("muscleScoreIntensity");
    expect(source).not.toContain("involvement heat map");
  });

  it("keeps the default anatomy canvas concise while preserving its qualitative-role boundary", () => {
    // The heading that said the map was a map is gone; the boundary it carried
    // lives in the legend disclosure and, once, at the foot of the inspector.
    expect(source).not.toContain("Selected action <em>role map.</em>");
    expect(source).toContain("How muscle roles are classified");
    expect(source).toContain("not measured activation, force, or anything about your own capacity");
    expect(source).not.toContain("Precise anatomical SVG with 70+ muscle regions");
    expect(source).not.toContain("See the work. <em>Then inspect the why.</em>");
  });

  it("draws its own anatomy instead of a third-party chart, so there is no load-failure path to fall back from", () => {
    expect(source).not.toContain("body-muscles");
    expect(source).not.toContain("BodyChart");
    expect(source).not.toContain("chartFailed");
    expect(source).not.toContain("VectorAnatomyFallback");
    expect(source).toContain('import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure"');
  });

  it("names a muscle with no role in the action instead of calling it a synergist", () => {
    // `matches(selectedKey, primary) ? "Primary" : "Synergist"` gave every
    // non-primary muscle a synergist role, including ones the action does not
    // use at all — a fabricated role with no record behind it.
    expect(source).not.toContain('matches(selectedKey, primary) ? "Primary" : "Synergist"');
    expect(source).toContain('"No role in this action"');
    expect(source).toContain("absence of evidence here");
  });

  it("uses qualitative role context without rendering numeric role indices when exercise or stack context is supplied", () => {
    expect(source).toContain('hasLinkedExerciseOrStackContext = selectedKey ? muscleScores?.[selectedKey] != null : false');
    expect(source).toContain('hasLinkedExerciseOrStackContext ? "Exercise and stack context" : "Movement model"');
    expect(source).toContain("not measured activation, force, or anything about your own capacity");
    expect(source).not.toContain("Relative model index");
    expect(source).not.toContain("Tier</i>");
    expect(source).not.toContain('selectedKey ? (muscleScores?.[selectedKey] ?? (matches(selectedKey, primary) ? 90 : 55)) : 0');
  });

  it("lists role rows by importance, each tagged with its role, and progressively discloses the rest", async () => {
    const { AnatomyMap } = await import("./AnatomyMap");
    const markup = renderToStaticMarkup(createElement(AnatomyMap, {
      primary: ["chest", "front delts", "triceps", "abs", "quads", "glutes"],
      secondary: ["serratus anterior", "obliques"],
      onSelect: vi.fn(),
    }));

    expect(markup).toContain("Key muscle roles");
    expect(markup).toContain("muscles involved");
    // One list, the role as a tag on the row - not three headed groups.
    expect(markup).toContain('class="atlas-role-tag atlas-role-tag-primary"');
    expect(markup).not.toContain("Primary movers");
    // Four rows first; the rest of the involved muscles and then the rest of
    // the body are the same list one tap longer.
    expect(markup.match(/class="atlas-role-row /g)).toHaveLength(4);
    expect(markup).toContain("View all ");
    expect(markup).toContain(" muscle roles");
    expect(markup).toContain("How muscle roles are classified");
    // The legend says what the paint draws: three states, and that the
    // supporting fill is also the stabilizing one.
    expect(markup).toContain("Supporting or stabilizing role");
    expect(markup).toContain("Primary role");
    expect(markup).toContain("Neutral");
  });

  it("uses source-recorded action phase context instead of fabricating timing or force values", () => {
    // Rendered only when the movement record carries one, and printed verbatim:
    // there is no branch that composes a phase description out of anything else.
    expect(source).toContain("<dt>Works through</dt><dd>{selectedRoleDetail.phaseContext}</dd>");
    expect(source).toContain("selectedRoleDetail?.phaseContext &&");
    expect(source).not.toMatch(/phaseContext\s*\|\|/);
  });

  it("orders rendered Key Muscle Roles from source-recorded qualitative role order rather than a numeric heat score", () => {
    expect(source).toContain("detail?.roleOrder.indexOf(firstRole)");
    expect(source).toContain("const fallbackOrder: Record<Role, number>");
    expect(source).not.toContain("muscleScores?.[entry.key]");
  });

  it("renders qualitative primary, stabilizer, and synergist roles in their supplied phase-sensitive order", async () => {
    const { AnatomyMap } = await import("./AnatomyMap");
    const roleOrder = ["Primary Mover", "Stabilizer", "Synergist", "Supporting"] as const;
    const roleDetails = {
      glutes: { roles: ["Primary Mover"], roleOrder: [...roleOrder], confidence: "Direct evidence", sourceScope: "Movement-specific evidence" as const, sources: [], explanation: "Propulsion context." },
      obliques: { roles: ["Stabilizer"], roleOrder: [...roleOrder], confidence: "Strong indirect evidence", sourceScope: "Movement-specific evidence" as const, sources: [], explanation: "Bracing context." },
      hamstrings: { roles: ["Synergist"], roleOrder: [...roleOrder], confidence: "Moderate biomechanical inference", sourceScope: "Movement-specific evidence" as const, sources: [], explanation: "Assisting context." },
    };
    const markup = renderToStaticMarkup(createElement(AnatomyMap, { primary: ["glutes"], secondary: ["obliques", "hamstrings"], roleDetails, onSelect: vi.fn() }));

    // Scoped to the ranked list: the figure's own hit layer also names every
    // muscle, and is ordered by area so small regions win hit priority.
    const ranking = markup.slice(markup.indexOf('class="atlas-ranking"'));
    expect(ranking.indexOf("Gluteal complex")).toBeLessThan(ranking.indexOf("External oblique"));
    expect(ranking.indexOf("External oblique")).toBeLessThan(ranking.indexOf("Hamstrings"));
    expect(ranking).toContain(">Stabilizer<");
    expect(ranking).toContain(">Supporting<");
    // A muscle with no role recorded is missing data, never "not used".
    expect(markup).not.toContain("Not used here");
    expect(markup).not.toContain("Stabilizer · Strong indirect evidence");
  });

  it("sizes the figure so a whole body fits the screen it is shown on", () => {
    // One body at a time is a portrait drawing, so height is the scarce axis
    // again. Sized by width it came out 559px tall and the chart measured 625px
    // against the 624px band between the sticky header and the bottom bar on a
    // 390x844 phone — the athlete's feet sat under the nav. The chart takes a
    // height the viewport can show and the drawing fits itself into that.
    expect(styles).toMatch(/\.atlas-body-chart\{[^}]*height:var\(--sg-body-figure-height\)/);
    expect(styles).toContain(".atlas-body-chart svg{width:auto;height:100%;max-width:100%}");
    expect(styles).not.toContain("!important");

    // One height for both body maps. They draw the same athlete and live in
    // different stylesheets, so the value is a token rather than two literals
    // that agree today. A vh fallback is declared first for engines without dvh.
    const root = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    // Capped at 30rem: with the page's name and the sport/action line above
    // the body, 34rem put the feet 17px under the dock on a 390x844 phone.
    expect(root).toContain("--sg-body-figure-height: clamp(18rem, calc(100vh - 20rem), 30rem)");
    expect(root).toMatch(/@supports \(height: 1dvh\)[^}]*\{[^}]*--sg-body-figure-height: clamp\(18rem, calc\(100dvh - 20rem\), 30rem\)/);
    expect(root).toContain(".strength-body-chart .anatomy-figure { height: var(--sg-body-figure-height)");
  });

  it("makes the control that turns the body around look like a control", () => {
    // It was a hairline border in the divider colour over the panel's own
    // background. On the dark Body Lab ground that read as a caption, not as
    // the only route to the half of the body you cannot see.
    const rule = styles.match(/\.atlas-side-toggle\{[^}]*\}/)![0];
    expect(rule).toContain("background:var(--sg-info-strong)");
    expect(rule).toContain("color:#fff");
    expect(rule).toMatch(/min-height:2\.5rem/);
    expect(styles).toContain(".destination-body .atlas-side-toggle{");
  });
});
