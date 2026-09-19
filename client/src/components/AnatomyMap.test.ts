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
    expect(source).toContain("qualitative role map");
    expect(source).not.toContain("involvement heat map");
  });

  it("keeps the default anatomy canvas concise while preserving its qualitative-role boundary", () => {
    expect(source).toContain("Selected action <em>role map.</em>");
    expect(source).toContain("Color shows qualitative action roles, not activation or strength.");
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

  it("groups compact role rows by importance and progressively discloses lower-priority worked muscles", async () => {
    const { AnatomyMap } = await import("./AnatomyMap");
    const markup = renderToStaticMarkup(createElement(AnatomyMap, {
      primary: ["chest", "front delts", "triceps", "abs", "quads", "glutes"],
      secondary: ["serratus anterior", "obliques"],
      onSelect: vi.fn(),
    }));

    expect(markup).toContain("Key muscle roles");
    expect(markup).toContain("muscles involved");
    expect(markup).toContain("Primary movers");
    expect(markup).toContain("Show all ");
    expect(markup).toContain(" muscles");
    expect(markup).toContain("How muscle roles are classified");
    expect(markup).toContain("Supporting role");
    expect(markup).toContain("Primary role");
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
    expect(markup).toContain("Stabilizers");
    expect(markup).not.toContain("Stabilizer · Strong indirect evidence");
  });

  it("sizes the figure by width, because two bodies is a landscape drawing", () => {
    // It used to be sized by height, with `!important` to beat the third-party
    // chart's inline `max-height`. That library is gone, and with both bodies on
    // one canvas height is no longer the scarce axis — width is, so a fixed
    // height would letterbox the drawing inside its own card.
    expect(styles).toContain(".atlas-body-chart svg{width:100%;height:auto;max-width:100%}");
    expect(styles).not.toMatch(/\.atlas-body-chart\{[^}]*height:clamp/);
    expect(styles).not.toContain("!important");
  });
});
